import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  // Check which port is active (5173 or 4173)
  let port = 5173;
  try {
    const res = await fetch('http://localhost:5173/');
    if (res.ok) port = 5173;
  } catch {
    port = 4173;
  }
  console.log(`Targeting port ${port}`);

  const profileDir = `/tmp/chrome-profile-vis-${Date.now()}`;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9233',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,800',
    '--no-first-run',
    '--no-default-browser-check',
    `http://localhost:${port}/?gallery=1`
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9233/json/list');
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
    throw new Error('Failed to connect to Chrome on port 9233');
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === msgId) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

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

  // 1. Visual Gallery - Characters
  await new Promise(r => setTimeout(r, 2500));
  await screenshot('/tmp/vis_01_gallery_jobs.png');

  // Switch to Mark Zuckerberg
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    buttons[1]?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_02_gallery_zuck.png');

  // Switch to Bill Gates
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    buttons[2]?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_03_gallery_gates.png');

  // Switch to Sam Altman
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    buttons[3]?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_04_gallery_altman.png');

  // Switch to Jensen Huang
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    buttons[4]?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_05_gallery_jensen.png');

  // Switch to Elon Musk
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    buttons[5]?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_06_gallery_elon.png');

  // Switch to Reed Hastings
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    buttons[6]?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_07_gallery_reed.png');

  // Switch to Jeff Bezos
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    buttons[7]?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_08_gallery_bezos.png');

  // 2. Visual Gallery - Props Mode
  await evaluate(`(() => {
    const tab = Array.from(document.querySelectorAll('.studio-tabs button')).find(b => b.textContent.includes('Office props'));
    tab?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  // Whiteboard prop (index 5)
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    const wb = buttons.find(b => b.textContent.includes('Whiteboard'));
    wb?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_09_gallery_prop_whiteboard.png');

  // Potted Plant (index 7)
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    const plant = buttons.find(b => b.textContent.includes('Potted plant'));
    plant?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_10_gallery_prop_plant.png');

  // GPU Box
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    const gpu = buttons.find(b => b.textContent.includes('GPU shipping box'));
    gpu?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_11_gallery_prop_gpu.png');

  // Pizza box
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    const pizza = buttons.find(b => b.textContent.includes('Pizza box'));
    pizza?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_12_gallery_prop_pizza.png');

  // Books
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    const books = buttons.find(b => b.textContent.includes('Stack of books'));
    books?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_13_gallery_prop_books.png');

  // Couch
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    const couch = buttons.find(b => b.textContent.includes('Couch'));
    couch?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_14_gallery_prop_couch.png');

  // Robot assistant
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('.studio-options button'));
    const robot = buttons.find(b => b.textContent.includes('Robot assistant'));
    robot?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('/tmp/vis_15_gallery_prop_robot.png');

  // 3. Main Game Flow - Setup screen & Apartment
  await send('Page.navigate', { url: `http://localhost:${port}/` });
  await new Promise(r => setTimeout(r, 2000));
  // Click "Start new company" / "New company"
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Start new company') || b.textContent.includes('New company'));
    btn?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await screenshot('/tmp/vis_16_setup_founder.png');

  // Founder step -> click Continue to cofounder
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent?.includes('Continue'))?.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));

  // Cofounder step -> click Choose
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent?.includes('Choose'))?.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));

  // Company step -> click Incorporate
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent?.includes('Incorporate'))?.click();
  })()`);
  await new Promise(r => setTimeout(r, 3000));
  await screenshot('/tmp/vis_17_apartment_view.png');

  ws.close();
  chrome.kill();
  console.log('Finished visual inspection capture!');
}

run().catch(console.error);
