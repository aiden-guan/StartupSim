import { spawn } from 'child_process';
import fs from 'fs';

async function verify() {
  const vite = spawn('npx', ['vite', 'preview', '--port', '4174'], {
    stdio: 'inherit'
  });

  await new Promise(r => setTimeout(r, 1000));

  const profile = `/tmp/test-prof-${Date.now()}`;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${profile}`,
    '--window-size=1280,800',
    'http://localhost:4174/'
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

  if (!wsUrl) {
    chrome.kill();
    vite.kill();
    throw new Error('Could not connect to Chrome debugging port');
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
    return res?.result?.value;
  };

  const clickByText = async (text) => {
    return evalCode(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.trim().toLowerCase().includes('${text.toLowerCase()}'));
      if (target) { target.click(); return true; }
      return false;
    })()`);
  };

  const shot = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const p = `/tmp/${name}.png`;
    fs.writeFileSync(p, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${p}`);
    return p;
  };

  try {
    console.log('Starting company setup...');
    await clickByText('New company');
    await new Promise(r => setTimeout(r, 600));
    await clickByText('Continue');
    await new Promise(r => setTimeout(r, 600));
    await clickByText('Choose');
    await new Promise(r => setTimeout(r, 600));
    await clickByText('Incorporate');
    console.log('Waiting for reveal caption to finish...');
    await new Promise(r => setTimeout(r, 3800));

    const stateBefore = await evalCode(`(() => {
      const btn = document.querySelector('[data-tutorial-next]');
      return {
        found: !!btn,
        attr: btn?.getAttribute('data-tutorial-next'),
        hasPulseClass: btn?.classList.contains('tutorial-next-pulse')
      };
    })()`);
    console.log('Initial slide state (before delay):', stateBefore);
    await shot('mentor_01_before_delay');

    console.log('Waiting 4.2s for idle next indicator...');
    await new Promise(r => setTimeout(r, 4200));

    const stateAfter = await evalCode(`(() => {
      const btn = document.querySelector('[data-tutorial-next]');
      return {
        found: !!btn,
        attr: btn?.getAttribute('data-tutorial-next'),
        hasPulseClass: btn?.classList.contains('tutorial-next-pulse')
      };
    })()`);
    console.log('State after 4.2s delay:', stateAfter);
    await shot('mentor_02_pulsing_slide1');

    console.log('Clicking Next to slide 2...');
    await clickByText('Next');
    await new Promise(r => setTimeout(r, 200));

    const stateReset = await evalCode(`(() => {
      const btn = document.querySelector('[data-tutorial-next]');
      return {
        found: !!btn,
        attr: btn?.getAttribute('data-tutorial-next'),
        hasPulseClass: btn?.classList.contains('tutorial-next-pulse')
      };
    })()`);
    console.log('State immediately after advancing:', stateReset);

    console.log('Clicking Next to slide 3 (user screenshot slide)...');
    await clickByText('Next');
    await new Promise(r => setTimeout(r, 500));

    console.log('Waiting 4.2s on slide 3...');
    await new Promise(r => setTimeout(r, 4200));
    const stateSlide3 = await evalCode(`(() => {
      const btn = document.querySelector('[data-tutorial-next]');
      return {
        found: !!btn,
        attr: btn?.getAttribute('data-tutorial-next'),
        hasPulseClass: btn?.classList.contains('tutorial-next-pulse'),
        cardText: document.querySelector('.mentor-card p')?.textContent
      };
    })()`);
    console.log('Slide 3 state after idle delay:', stateSlide3);
    await shot('mentor_03_slide3_cofounder_pulsing');

    console.log('Verification finished successfully!');
  } finally {
    ws.close();
    chrome.kill();
    vite.kill();
  }
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
