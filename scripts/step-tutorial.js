import { spawn } from 'child_process';
import fs from 'fs';

async function stepThrough() {
  const profile = `/tmp/test-prof-${Date.now()}`;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${profile}`,
    '--window-size=1280,800',
    'http://localhost:4173/'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9224/json/list');
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

  const clickByText = async (text) => {
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.textContent.toLowerCase().includes('${text.toLowerCase()}'));
        if (target) { target.click(); return true; }
        return false;
      })()`,
      returnByValue: true
    });
  };

  const clickSelector = async (selector) => {
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('${selector}');
        if (el) { el.click(); return true; }
        return false;
      })()`,
      returnByValue: true
    });
  };

  const shot = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`/tmp/game_${name}.png`, Buffer.from(res.data, 'base64'));
    console.log(`Saved /tmp/game_${name}.png`);
  };

  // 1. Title -> New company
  await clickByText('New company');
  await new Promise(r => setTimeout(r, 600));

  // 2. Founder -> Continue
  await clickByText('Continue');
  await new Promise(r => setTimeout(r, 600));

  // 3. Cofounder -> Choose
  await clickByText('Choose');
  await new Promise(r => setTimeout(r, 600));

  // 4. Company -> Incorporate
  await clickByText('Incorporate');
  await new Promise(r => setTimeout(r, 1500));

  // 5. Reveal playing
  await shot('01_reveal');

  // Wait for reveal caption to finish (about 3.5 seconds)
  await new Promise(r => setTimeout(r, 3500));
  await shot('02_intro_1');

  // Click Next 4 times to get to open-lab
  for (let i = 2; i <= 5; i++) {
    await clickByText('Next');
    await new Promise(r => setTimeout(r, 500));
  }
  await shot('03_open_lab');

  // Click [data-tutorial="new-product"]
  await clickSelector('[data-tutorial="new-product"]');
  await new Promise(r => setTimeout(r, 800));
  await shot('04_product_lab');

  // Click Next on primitives
  await clickByText('Next');
  await new Promise(r => setTimeout(r, 600));
  await shot('05_choose_chat');

  // Click Chat primitive
  await clickSelector('[data-tutorial="primitive-chat"]');
  await new Promise(r => setTimeout(r, 600));
  await shot('06_choose_writing');

  // Click Writing primitive
  await clickSelector('[data-tutorial="primitive-writing"]');
  await new Promise(r => setTimeout(r, 600));
  await shot('07_start_product');

  // Click Start development
  await clickSelector('[data-tutorial="start-product"]');
  await new Promise(r => setTimeout(r, 800));
  await shot('08_assign_founder');

  // Click founder assignment
  await clickSelector('[data-tutorial="assign-founder"]');
  await new Promise(r => setTimeout(r, 600));
  await shot('09_assign_cofounder');

  // Click cofounder assignment
  await clickSelector('[data-tutorial="assign-cofounder"]');
  await new Promise(r => setTimeout(r, 600));
  await shot('10_team_ready');

  // Click Next on team ready
  await clickByText('Next');
  await new Promise(r => setTimeout(r, 600));
  await shot('11_start_clock');

  ws.close();
  chrome.kill();
  console.log('Done stepping through tutorial intro!');
}

stepThrough().catch(console.error);
