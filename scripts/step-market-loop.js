import { spawn } from 'child_process';
import fs from 'fs';

async function stepMarket() {
  const profile = `/tmp/test-prof-${Date.now()}`;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${profile}`,
    '--window-size=1280,800',
    'http://localhost:4173/'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9225/json/list');
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page?.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const msgId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === msgId) { ws.removeEventListener('message', handler); res(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');
  await new Promise(r => setTimeout(r, 1500));

  const evalCode = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.value;
  };

  const shot = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`/tmp/game_${name}.png`, Buffer.from(res.data, 'base64'));
    console.log(`Saved /tmp/game_${name}.png`);
  };

  // Skip setup directly into incorporated state using dispatch to inspect quickly
  await evalCode(`(() => {
    const store = window.__STORE__ || window.useGame;
    // Let's use the normal UI clicks through setup:
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('new company'))?.click();
  })()`);
  await new Promise(r => setTimeout(r, 500));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('continue'))?.click()`);
  await new Promise(r => setTimeout(r, 500));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('choose'))?.click()`);
  await new Promise(r => setTimeout(r, 500));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('incorporate'))?.click()`);
  await new Promise(r => setTimeout(r, 4000));

  // Advance intro slides
  for (let i = 0; i < 4; i++) {
    await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
    await new Promise(r => setTimeout(r, 300));
  }
  // Open products
  await evalCode(`document.querySelector('[data-tutorial="new-product"]')?.click()`);
  await new Promise(r => setTimeout(r, 500));
  // Next on primitives
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 300));
  // Select chat
  await evalCode(`document.querySelector('[data-tutorial="primitive-chat"]')?.click()`);
  await new Promise(r => setTimeout(r, 300));
  // Select writing
  await evalCode(`document.querySelector('[data-tutorial="primitive-writing"]')?.click()`);
  await new Promise(r => setTimeout(r, 300));
  // Start product
  await evalCode(`document.querySelector('[data-tutorial="start-product"]')?.click()`);
  await new Promise(r => setTimeout(r, 500));
  // Assign founder
  await evalCode(`document.querySelector('[data-tutorial="assign-founder"]')?.click()`);
  await new Promise(r => setTimeout(r, 300));
  // Assign cofounder
  await evalCode(`document.querySelector('[data-tutorial="assign-cofounder"]')?.click()`);
  await new Promise(r => setTimeout(r, 300));
  // Next on team ready
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 300));
  // Start clock
  await evalCode(`document.querySelector('[data-tutorial="speed-one"]')?.click()`);
  await new Promise(r => setTimeout(r, 500));

  console.log('Clock started. Accelerating ticks until product is ready...');
  // Tick days using setSpeed to 8 or direct commands via console if available
  // Let's set speed to 8x so it progresses fast
  await evalCode(`document.querySelector('.speed-controls button:last-child')?.click()`);

  // Wait until product is ready
  let ready = false;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 500));
    const isReady = await evalCode(`Boolean(document.querySelector('[data-tutorial="product-ready"]') || document.querySelector('.ready-stamp'))`);
    if (isReady) {
      ready = true;
      break;
    }
  }
  console.log('Product ready reached:', ready);
  await shot('12_product_ready');

  // Let's see what mentor slides show for designer
  // Slide 0: product-ready (Next)
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await shot('13_designer_deployment');

  // Slide 1: deployment (Next)
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await shot('14_designer_capability');

  // Slide 2: capability (Next)
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await shot('15_designer_distribution');

  // Slide 3: distribution (Next)
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await shot('16_designer_spend');

  // Spend a point on capability
  await evalCode(`document.querySelector('[data-tutorial="stat-capability"] button:last-child')?.click()`);
  await new Promise(r => setTimeout(r, 500));
  await shot('17_designer_enter_market');

  // Click Enter market
  await evalCode(`document.querySelector('[data-tutorial="enter-market"]')?.click()`);
  await new Promise(r => setTimeout(r, 1000));
  await shot('18_market_board');

  ws.close();
  chrome.kill();
  console.log('Done market flow step!');
}

stepMarket().catch(console.error);
