import { spawn } from 'child_process';
import fs from 'fs';

async function testResolutions() {
  const resolutions = [
    { width: 1280, height: 800, name: '1280x800' },
    { width: 1440, height: 900, name: '1440x900' },
    { width: 1920, height: 1080, name: '1920x1080' },
  ];

  for (const res of resolutions) {
    const profile = `/tmp/test-prof-${res.name}`;
    const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
      '--headless=new',
      '--remote-debugging-port=9229',
      `--user-data-dir=${profile}`,
      `--window-size=${res.width},${res.height}`,
      'http://localhost:4173/'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const response = await fetch('http://127.0.0.1:9229/json/list');
        const list = await response.json();
        const page = list.find(t => t.type === 'page');
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const send = (method, params = {}) => new Promise(resolve => {
      const msgId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msgId) { ws.removeEventListener('message', handler); resolve(d.result); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await new Promise(r => ws.onopen = r);
    await send('Runtime.enable');
    await send('Page.enable');
    await new Promise(r => setTimeout(r, 1500));

    // Title shot
    const shotTitle = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`/tmp/res_${res.name}_title.png`, Buffer.from(shotTitle.data, 'base64'));

    // Go to setup
    await send('Runtime.evaluate', { expression: "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start new company'))?.click()" });
    await new Promise(r => setTimeout(r, 800));
    const shotFounder = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`/tmp/res_${res.name}_founder.png`, Buffer.from(shotFounder.data, 'base64'));

    ws.close();
    chrome.kill();
    console.log(`Saved screenshots for resolution ${res.name}`);
  }
}

testResolutions().catch(console.error);
