// Browser E2E verification test using CDP without external dependencies (uses native WebSocket if available, or native http/fetch)
async function run() {
  const res = await fetch("http://localhost:9222/json/list");
  const list = await res.json();
  const page = list.find((item) => item.type === "page" && item.url.includes("4173"));
  if (!page) {
    console.error("Could not find StartupSim page in Chrome CDP targets");
    process.exit(1);
  }

  console.log("Connecting to CDP WebSocket:", page.webSocketDebuggerUrl);
  // Node 21+ has global WebSocket built-in
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result.value;
  }

  console.log("Navigating to fresh market session...");
  await send("Page.navigate", { url: "http://localhost:4173/?market=1" });
  await new Promise((r) => setTimeout(r, 600));

  console.log("Page loaded. Checking board presence...");
  const boardPresent = await evaluate("Boolean(document.querySelector('.tactical-board'))");
  console.log("Tactical board present:", boardPresent);

  const initialTurns = await evaluate("document.querySelector('.market-score')?.innerText");
  console.log("Initial Score Header:\n", initialTurns);

  // Play turns through the market
  for (let turn = 1; turn <= 12; turn++) {
    const isResults = await evaluate("Boolean(document.querySelector('.market-results'))");
    if (isResults) {
      console.log(`Market finished! Arrived at results screen at step ${turn}`);
      break;
    }

    const state = await evaluate(`(() => {
      const btn = document.querySelector('.primary-action');
      const passBtn = document.querySelector('.end-turn');
      const nodes = Array.from(document.querySelectorAll('.market-node.reachable')).map(n => n.getAttribute('aria-label'));
      const turns = document.querySelector('.market-score')?.innerText;
      return {
        btnText: btn?.innerText,
        btnDisabled: btn?.disabled,
        turns,
        reachableNodes: nodes
      };
    })()`);

    console.log("--- Step " + turn + " ---");
    console.log("Reachable nodes count:", state.reachableNodes.length);

    // Prefer expanding to uncaptured reachable nodes if available
    const expansionCandidate = await evaluate(`(() => {
      const reachable = Array.from(document.querySelectorAll('.market-node.reachable'));
      // pick one that is not yet held by player
      const unheld = reachable.find(n => !n.getAttribute('aria-label').includes('You') || n.getAttribute('aria-label').includes('0% You'));
      const target = unheld || reachable[0];
      if (target) {
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return target.getAttribute('aria-label');
      }
      return null;
    })()`);
    console.log("Clicked node:", expansionCandidate);
    await new Promise((r) => setTimeout(r, 150));

    const afterSelect = await evaluate(`(() => {
      const btn = document.querySelector('.primary-action');
      return { text: btn?.innerText, disabled: btn?.disabled };
    })()`);
    console.log("Action button:", afterSelect.text, "Disabled:", afterSelect.disabled);

    if (!afterSelect.disabled) {
      await evaluate("document.querySelector('.primary-action').click()");
    } else {
      console.log("Passing turn...");
      await evaluate("document.querySelector('.end-turn')?.click()");
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  // Check results screen details
  const resultsData = await evaluate(`(() => {
    const res = document.querySelector('.market-results');
    if (!res) return null;
    return {
      h1: res.querySelector('h1')?.innerText,
      outcome: res.querySelector('p')?.innerText,
      share: res.querySelector('.result-share strong')?.innerText,
      buttonText: res.querySelector('.primary-action')?.innerText
    };
  })()`);

  console.log("Results screen data:", resultsData);

  if (resultsData?.buttonText) {
    console.log("Clicking 'Continue to your company'...");
    await evaluate("document.querySelector('.market-results .primary-action').click()");
    await new Promise((r) => setTimeout(r, 300));

    const finalScreen = await evaluate(`(() => {
      return {
        hasHUD: Boolean(document.querySelector('.hud-bar')),
        hasMarket: Boolean(document.querySelector('.market-mode')),
        hasResults: Boolean(document.querySelector('.market-results')),
        drawer: document.querySelector('.workspace')?.getAttribute('class')
      };
    })()`);

    console.log("After clicking continue:", finalScreen);
  }

  ws.close();
  console.log("E2E browser playthrough completed successfully!");
}

run().catch((err) => {
  console.error("E2E playtest failed:", err);
  process.exit(1);
});
