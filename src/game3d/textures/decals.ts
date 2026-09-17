import { CanvasTexture, SRGBColorSpace } from 'three';

const textureCache = new Map<string, CanvasTexture>();

function createTexture(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  draw(ctx, width, height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/** Whiteboard text decal: Build / Iterate / Ship / Repeat + upward-right arrow */
export function getWhiteboardTexture(): CanvasTexture | null {
  return createTexture('whiteboard_texture', 1024, 576, (ctx, w, h) => {
    // Board white background
    ctx.fillStyle = '#fbfcfd';
    ctx.fillRect(0, 0, w, h);

    // Left text lines
    ctx.fillStyle = '#2563eb';
    ctx.font = '800 68px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';

    const leftX = 140;
    ctx.fillText('Build', leftX, 140);
    ctx.fillText('Iterate', leftX, 235);
    ctx.fillText('Ship', leftX, 330);
    ctx.fillText('Repeat', leftX, 425);

    // Upward-right diagonal blue arrow
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Shaft from bottom-left to top-right
    ctx.moveTo(560, 420);
    ctx.lineTo(840, 160);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(710, 160);
    ctx.lineTo(840, 160);
    ctx.lineTo(840, 290);
    ctx.stroke();
  });
}

/** Pizza box top decal: PIZZA FUELS PROGRESS + pizza slice */
export function getPizzaBoxTexture(): CanvasTexture | null {
  return createTexture('pizzabox_texture', 512, 512, (ctx, w, h) => {
    // Kraft cardboard background
    ctx.fillStyle = '#d1a980';
    ctx.fillRect(0, 0, w, h);

    // Border fold crease
    ctx.strokeStyle = '#ba9067';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Text: PIZZA FUELS PROGRESS
    ctx.fillStyle = '#d94e28';
    ctx.font = '900 60px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'top';

    const textX = 54;
    ctx.fillText('PIZZA', textX, 110);
    ctx.fillText('FUELS', textX, 185);
    ctx.fillText('PROGRESS', textX, 260);

    // Stylized pizza slice on the right
    ctx.save();
    ctx.translate(390, 240);
    ctx.rotate(0.2);

    // Triangular cheese slice
    ctx.beginPath();
    ctx.moveTo(0, 110); // Tip pointing down
    ctx.lineTo(-75, -80);
    ctx.lineTo(75, -80);
    ctx.closePath();
    ctx.fillStyle = '#f2bc3f';
    ctx.fill();

    // Brown crust arc
    ctx.beginPath();
    ctx.moveTo(-82, -80);
    ctx.quadraticCurveTo(0, -104, 82, -80);
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#c08442';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Pepperoni circles
    ctx.fillStyle = '#b93822';
    const peps = [
      { x: -22, y: -45, r: 16 },
      { x: 26, y: -38, r: 15 },
      { x: 0, y: -5, r: 17 },
      { x: -14, y: 36, r: 14 },
    ];
    peps.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  });
}

/** GPU box front decal: Bold GPU + barcode and handling marks */
export function getGPUBoxTexture(): CanvasTexture | null {
  return createTexture('gpubox_texture', 512, 512, (ctx, w, h) => {
    // Kraft cardboard background
    ctx.fillStyle = '#b89065';
    ctx.fillRect(0, 0, w, h);

    // Bold black GPU text
    ctx.fillStyle = '#1a1c1e';
    ctx.font = '900 170px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GPU', w / 2, 210);

    // Subtext
    ctx.font = '700 24px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('ENTERPRISE COMPUTE UNIT', w / 2, 310);

    // Bottom shipping label
    const labelX = 60;
    const labelY = 360;
    const labelW = 200;
    const labelH = 95;
    ctx.fillStyle = '#f5f4ed';
    ctx.fillRect(labelX, labelY, labelW, labelH);

    // Barcode stripes
    ctx.fillStyle = '#1a1c1e';
    const barX = labelX + 15;
    const barY = labelY + 15;
    const barH = 45;
    const pattern = [2, 4, 1, 3, 5, 2, 1, 4, 2, 3, 6, 2, 4, 1, 3, 5, 2, 3, 4];
    let curX = barX;
    pattern.forEach((pw, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curX, barY, pw * 2, barH);
      }
      curX += pw * 2 + 2;
    });

    // Barcode numbers
    ctx.font = '600 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('H100-SXM5-80GB', labelX + 15, labelY + 78);

    // Fragile cup / up arrows on bottom right
    ctx.strokeStyle = '#1a1c1e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    // Up arrows
    const arrowX = 400;
    const arrowY = 390;
    ctx.beginPath();
    ctx.moveTo(arrowX - 25, arrowY + 40);
    ctx.lineTo(arrowX - 25, arrowY);
    ctx.moveTo(arrowX - 35, arrowY + 12);
    ctx.lineTo(arrowX - 25, arrowY);
    ctx.lineTo(arrowX - 15, arrowY + 12);

    ctx.moveTo(arrowX + 15, arrowY + 40);
    ctx.lineTo(arrowX + 15, arrowY);
    ctx.moveTo(arrowX + 5, arrowY + 12);
    ctx.lineTo(arrowX + 15, arrowY);
    ctx.lineTo(arrowX + 25, arrowY + 12);
    ctx.stroke();
  });
}

/** Book spine decal for book stack */
export function getBookSpineTexture(title: string, bgColor: string, textColor = '#ffffff'): CanvasTexture | null {
  const key = `bookspine_${title}_${bgColor}_${textColor}`;
  return createTexture(key, 512, 64, (ctx, w, h) => {
    // Book spine background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle edge binding lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(0, 0, w, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(0, h - 3, w, 3);

    // Title centered along spine
    ctx.fillStyle = textColor;
    ctx.font = '700 32px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, w / 2, h / 2);
  });
}

/** Conference badge card decal */
export function getConferenceBadgeTexture(): CanvasTexture | null {
  return createTexture('badge_texture', 256, 360, (ctx, w, h) => {
    // Clean white badge card
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Top blue banner
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, w, 85);

    // Mountain icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(38, 55);
    ctx.lineTo(54, 30);
    ctx.lineTo(70, 55);
    ctx.closePath();
    ctx.fill();

    // StartupSim header text
    ctx.font = '800 24px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('StartupSim', 82, 44);

    // Badge body text lines
    ctx.fillStyle = '#1e293b';
    ctx.font = '900 28px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUILD', w / 2, 140);
    ctx.fillText('PEOPLE', w / 2, 185);
    ctx.fillText('PROGRESS', w / 2, 230);

    // Bottom attendee barcode
    ctx.fillStyle = '#64748b';
    ctx.font = '700 14px monospace';
    ctx.fillText('FOUNDER • ALL ACCESS', w / 2, 290);

    ctx.fillStyle = '#0f172a';
    const barW = 180;
    const barX = (w - barW) / 2;
    const barY = 310;
    for (let i = 0; i < 26; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(barX + i * 7, barY, (i % 3 === 0 ? 4 : 2), 25);
      }
    }
  });
}

/** Glowing screen texture for laptop and monitor */
export function getScreenTexture(type: 'laptop' | 'monitor'): CanvasTexture | null {
  const key = `screen_texture_${type}`;
  const w = 512;
  const h = type === 'laptop' ? 320 : 300;
  return createTexture(key, w, h, (ctx, cw, ch) => {
    // Deep navy background with subtle blue glow
    ctx.fillStyle = '#111b27';
    ctx.fillRect(0, 0, cw, ch);

    // Top window chrome
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, cw, 28);
    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(16, 14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath(); ctx.arc(28, 14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(40, 14, 4, 0, Math.PI * 2); ctx.fill();

    // Editor tabs
    ctx.fillStyle = '#293548';
    ctx.fillRect(60, 4, 110, 24);
    ctx.fillStyle = '#50a8ff';
    ctx.font = '600 12px monospace';
    ctx.fillText('engine.ts', 74, 20);

    // Code lines / syntax coloring
    const lines = [
      { ind: 20, len: 120, c: '#a78bfa' },
      { ind: 50, len: 180, c: '#50a8ff' },
      { ind: 50, len: 240, c: '#34d399' },
      { ind: 80, len: 140, c: '#f472b6' },
      { ind: 80, len: 210, c: '#fbbf24' },
      { ind: 50, len: 90,  c: '#60a5fa' },
      { ind: 20, len: 40,  c: '#a78bfa' },
      { ind: 20, len: 160, c: '#50a8ff' },
      { ind: 50, len: 220, c: '#34d399' },
      { ind: 50, len: 190, c: '#fbbf24' },
      { ind: 20, len: 50,  c: '#a78bfa' },
    ];

    let y = 50;
    lines.forEach((line) => {
      ctx.fillStyle = line.c;
      ctx.fillRect(line.ind, y, line.len, 7);
      y += 18;
    });

    // On monitor: show a mini graph in bottom right
    if (type === 'monitor') {
      const gx = 310;
      const gy = 160;
      const gw = 175;
      const gh = 100;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = 'rgba(80, 168, 255, 0.3)';
      ctx.strokeRect(gx, gy, gw, gh);

      // Graph line
      ctx.beginPath();
      ctx.moveTo(gx + 10, gy + 85);
      ctx.lineTo(gx + 45, gy + 70);
      ctx.lineTo(gx + 85, gy + 55);
      ctx.lineTo(gx + 125, gy + 35);
      ctx.lineTo(gx + 165, gy + 15);
      ctx.strokeStyle = '#50a8ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glowing dot
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(gx + 165, gy + 15, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
