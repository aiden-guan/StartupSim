import { spawn } from 'child_process';
import fs from 'fs';

async function stepResults() {
  const profile = `/tmp/test-prof-${Date.now()}`;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${profile}`,
    '--window-size=1280,800',
    'http://localhost:4173/'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9226/json/list');
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

  // Skip directly to market battle via state or UI clicks
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('new company'))?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('continue'))?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('choose'))?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('incorporate'))?.click()`);
  await new Promise(r => setTimeout(r, 3800));

  for (let i = 0; i < 4; i++) {
    await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
    await new Promise(r => setTimeout(r, 200));
  }
  await evalCode(`document.querySelector('[data-tutorial="new-product"]')?.click()`);
  await new Promise(r => setTimeout(r, 300));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 200));
  await evalCode(`document.querySelector('[data-tutorial="primitive-chat"]')?.click()`);
  await new Promise(r => setTimeout(r, 200));
  await evalCode(`document.querySelector('[data-tutorial="primitive-writing"]')?.click()`);
  await new Promise(r => setTimeout(r, 200));
  await evalCode(`document.querySelector('[data-tutorial="start-product"]')?.click()`);
  await new Promise(r => setTimeout(r, 400));
  await evalCode(`document.querySelector('[data-tutorial="assign-founder"]')?.click()`);
  await new Promise(r => setTimeout(r, 200));
  await evalCode(`document.querySelector('[data-tutorial="assign-cofounder"]')?.click()`);
  await new Promise(r => setTimeout(r, 200));
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
  await new Promise(r => setTimeout(r, 200));
  await evalCode(`document.querySelector('[data-tutorial="speed-one"]')?.click()`);
  await new Promise(r => setTimeout(r, 300));
  await evalCode(`document.querySelector('.speed-controls button:last-child')?.click()`);

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 400));
    const isReady = await evalCode(`Boolean(document.querySelector('[data-tutorial="product-ready"]') || document.querySelector('.ready-stamp'))`);
    if (isReady) break;
  }

  for (let i = 0; i < 4; i++) {
    await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
    await new Promise(r => setTimeout(r, 200));
  }
  await evalCode(`document.querySelector('[data-tutorial="stat-capability"] button:last-child')?.click()`);
  await new Promise(r => setTimeout(r, 300));
  await evalCode(`document.querySelector('[data-tutorial="enter-market"]')?.click()`);
  await new Promise(r => setTimeout(r, 800));

  // Skip mentor slides in market
  for (let i = 0; i < 8; i++) {
    await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'))?.click()`);
    await new Promise(r => setTimeout(r, 150));
  }

  // Perform capture and end turns
  await evalCode(`document.querySelector('[data-tutorial="market-capture"]')?.click()`);
  await new Promise(r => setTimeout(r, 300));

  for (let i = 0; i < 10; i++) {
    await evalCode(`document.querySelector('[data-tutorial="market-end-turn"]')?.click()`);
    await new Promise(r => setTimeout(r, 250));
  }

  await new Promise(r => setTimeout(r, 1000));
  await shot('19_market_results');

  // Click continue to company
  await evalCode(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue to your company'))?.click()`);
  await new Promise(r => setTimeout(r, 1200));
  await shot('20_revenue_unlocked');

  ws.close();
  chrome.kill();
  console.log('Done market results step!');
}

stepResults().catch(console.error);
