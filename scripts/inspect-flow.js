import fs from 'fs';
import { spawn } from 'child_process';

async function run() {
  const profileDir = `/tmp/chrome-profile-${Date.now()}`;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,800',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:4173/'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chrome.kill();
    throw new Error('Failed to connect to Chrome page on port 9222');
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER LOG]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER ERR]', data.params.exceptionDetails);
    }
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Runtime.enable');
  await send('Page.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }

  async function screenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  }

  await new Promise(r => setTimeout(r, 2000));
  await screenshot('/tmp/flow_01_title.png');

  // Click "New company"
  await evaluate(`document.querySelector('button.game-btn-primary')?.click()`);
  await new Promise(r => setTimeout(r, 800));
  await screenshot('/tmp/flow_02_setup_founder.png');

  // Founder step -> click Continue
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find(b => b.textContent?.trim() === 'Continue');
    cont?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await screenshot('/tmp/flow_03_setup_cofounder.png');

  // Cofounder step -> click Choose
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const choose = btns.find(b => b.textContent?.includes('Choose'));
    choose?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await screenshot('/tmp/flow_04_setup_company.png');

  // Company step -> click Incorporate
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const inc = btns.find(b => b.textContent?.includes('Incorporate'));
    inc?.click();
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await screenshot('/tmp/flow_05_apartment_reveal.png');

  // Wait for reveal caption or advance
  await new Promise(r => setTimeout(r, 2500));
  await screenshot('/tmp/flow_06_tutorial_intro.png');

  ws.close();
  chrome.kill();
}

run().catch(console.error);
