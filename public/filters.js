const FILTERS = [
  { name: 'Normal',     emoji: '📷', fn: null },
  { name: 'B&W',        emoji: '🎞️', fn: ctx => { ctx.filter = 'grayscale(100%)'; } },
  { name: 'Sepia',      emoji: '🍂', fn: ctx => { ctx.filter = 'sepia(90%)'; } },
  { name: 'Warm',       emoji: '🌅', fn: ctx => { ctx.filter = 'saturate(160%) hue-rotate(-20deg) brightness(1.1)'; } },
  { name: 'Cool',       emoji: '🧊', fn: ctx => { ctx.filter = 'saturate(130%) hue-rotate(40deg) brightness(0.95)'; } },
  { name: 'Vivid',      emoji: '🌈', fn: ctx => { ctx.filter = 'saturate(280%) contrast(1.2)'; } },
  { name: 'Soft',       emoji: '🌸', fn: ctx => { ctx.filter = 'blur(1.5px) brightness(1.15) saturate(110%)'; } },
  { name: 'Dark',       emoji: '🌑', fn: ctx => { ctx.filter = 'brightness(0.45) contrast(1.5)'; } },
  { name: 'Neon',       emoji: '⚡', fn: ctx => { ctx.filter = 'saturate(400%) brightness(1.3) contrast(1.4) hue-rotate(90deg)'; } },
  { name: 'Retro',      emoji: '📼', fn: ctx => { ctx.filter = 'sepia(60%) contrast(1.2) brightness(0.9) saturate(80%)'; } },
  { name: 'Sunset',     emoji: '🌇', fn: ctx => { ctx.filter = 'hue-rotate(-30deg) saturate(220%) brightness(1.1)'; } },
  { name: 'Ocean',      emoji: '🌊', fn: ctx => { ctx.filter = 'hue-rotate(180deg) saturate(160%) brightness(0.9)'; } },
  { name: 'Forest',     emoji: '🌿', fn: ctx => { ctx.filter = 'hue-rotate(80deg) saturate(200%) brightness(0.95)'; } },
  { name: 'Purple',     emoji: '💜', fn: ctx => { ctx.filter = 'hue-rotate(270deg) saturate(220%) brightness(1.05)'; } },
  { name: 'Pink',       emoji: '🌺', fn: ctx => { ctx.filter = 'hue-rotate(300deg) saturate(200%) brightness(1.15)'; } },
  { name: 'Gold',       emoji: '✨', fn: ctx => { ctx.filter = 'sepia(100%) saturate(350%) hue-rotate(10deg) brightness(1.1)'; } },
  { name: 'Ice',        emoji: '❄️', fn: ctx => { ctx.filter = 'hue-rotate(200deg) saturate(70%) brightness(1.4) contrast(0.9)'; } },
  { name: 'Lava',       emoji: '🌋', fn: ctx => { ctx.filter = 'saturate(350%) contrast(1.4) brightness(0.85) hue-rotate(350deg)'; } },
  { name: 'Cyberpunk',  emoji: '🤖', fn: ctx => { ctx.filter = 'saturate(350%) hue-rotate(270deg) contrast(1.5) brightness(1.1)'; } },
  { name: 'Pastel',     emoji: '🍬', fn: ctx => { ctx.filter = 'saturate(60%) brightness(1.35) contrast(0.8)'; } },
  { name: 'Dramatic',   emoji: '🎭', fn: ctx => { ctx.filter = 'contrast(2) brightness(0.8) saturate(130%)'; } },
  { name: 'Faded',      emoji: '🌫️', fn: ctx => { ctx.filter = 'contrast(0.65) brightness(1.15) saturate(60%)'; } },
  { name: 'Bleach',     emoji: '🤍', fn: ctx => { ctx.filter = 'contrast(1.6) brightness(1.5) saturate(40%)'; } },
  { name: 'Infrared',   emoji: '🔴', fn: ctx => { ctx.filter = 'hue-rotate(120deg) saturate(250%) invert(20%) brightness(1.1)'; } },
  { name: 'Invert',     emoji: '🔄', fn: ctx => { ctx.filter = 'invert(100%)'; } },
  { name: 'Horror',     emoji: '👻', fn: ctx => { ctx.filter = 'grayscale(80%) contrast(2.2) brightness(0.55) sepia(30%)'; } },
  { name: 'Dreamy',     emoji: '💭', fn: ctx => { ctx.filter = 'blur(2px) brightness(1.25) saturate(130%) contrast(0.85)'; } },
  { name: 'Vintage',    emoji: '🎠', fn: ctx => { ctx.filter = 'sepia(50%) contrast(0.8) brightness(0.9) saturate(75%)'; } },
  { name: 'Sketch',     emoji: '✏️', fn: ctx => { ctx.filter = 'grayscale(100%) contrast(4) brightness(1.6)'; } },
  { name: 'Matrix',     emoji: '💚', fn: (ctx, w, h, img) => {
    ctx.filter = 'grayscale(100%) brightness(0.4) contrast(2.5)';
    ctx.drawImage(img, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(0,255,70,0.2)';
    ctx.fillRect(0, 0, w, h);
  }},
  { name: 'Mirror',     emoji: '🪞', fn: (ctx, w, h, img) => {
    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(img, -w, 0, w, h); ctx.restore();
  }},
  { name: 'Flip',       emoji: '🙃', fn: (ctx, w, h, img) => {
    ctx.save(); ctx.scale(1, -1); ctx.drawImage(img, 0, -h, w, h); ctx.restore();
  }},
  { name: 'Zoom',       emoji: '🔍', fn: (ctx, w, h, img) => {
    ctx.drawImage(img, -w * 0.2, -h * 0.2, w * 1.4, h * 1.4);
  }},
  { name: 'Tiny',       emoji: '🔬', fn: (ctx, w, h, img) => {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, w * 0.2, h * 0.2, w * 0.6, h * 0.6);
  }},
  { name: 'Pixelate',   emoji: '👾', fn: (ctx, w, h, img) => {
    const sz = 14; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w / sz, h / sz);
    ctx.drawImage(ctx.canvas, 0, 0, w / sz, h / sz, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
  }},
  { name: 'Glitch',     emoji: '📡', fn: (ctx, w, h, img) => {
    ctx.drawImage(img, 0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'hue-rotate(90deg)'; ctx.drawImage(img, 6, 0, w, h);
    ctx.filter = 'hue-rotate(200deg)'; ctx.drawImage(img, -6, 0, w, h);
    ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  }},
  { name: 'Rainbow',    emoji: '🌈', fn: (ctx, w, h, img) => {
    ctx.filter = 'saturate(180%)'; ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none';
    const t = Date.now() / 800;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsla(${(t * 60) % 360},100%,50%,0.3)`);
    g.addColorStop(0.33, `hsla(${(t * 60 + 120) % 360},100%,50%,0.3)`);
    g.addColorStop(0.66, `hsla(${(t * 60 + 240) % 360},100%,50%,0.3)`);
    g.addColorStop(1, `hsla(${(t * 60 + 360) % 360},100%,50%,0.3)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }},
  { name: 'Vignette',   emoji: '🎬', fn: (ctx, w, h, img) => {
    ctx.drawImage(img, 0, 0, w, h);
    const g = ctx.createRadialGradient(w/2, h/2, h * 0.25, w/2, h/2, h * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }},
  { name: 'Scanline',   emoji: '📺', fn: (ctx, w, h, img) => {
    ctx.filter = 'brightness(0.85) contrast(1.1)'; ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none';
    for (let y = 0; y < h; y += 3) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y, w, 1); }
  }},
  { name: 'Noise',      emoji: '📻', fn: (ctx, w, h, img) => {
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h); const d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 70; d[i] += n; d[i+1] += n; d[i+2] += n; }
    ctx.putImageData(id, 0, 0);
  }},
  { name: 'Duotone',    emoji: '🎨', fn: (ctx, w, h, img) => {
    ctx.filter = 'grayscale(100%)'; ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255,80,40,0.65)'; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }},
  { name: 'Thermal',    emoji: '🌡️', fn: (ctx, w, h, img) => {
    ctx.filter = 'grayscale(100%)'; ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none';
    const id = ctx.getImageData(0, 0, w, h); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i] / 255;
      d[i] = Math.min(255, v * 2 * 255); d[i+1] = Math.max(0, (v * 2 - 1) * 255); d[i+2] = 0; d[i+3] = 255;
    } ctx.putImageData(id, 0, 0);
  }},
  { name: '8-bit',      emoji: '🕹️', fn: (ctx, w, h, img) => {
    const sz = 10; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w / sz, h / sz);
    ctx.drawImage(ctx.canvas, 0, 0, w / sz, h / sz, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.filter = 'saturate(250%) contrast(1.4)';
    ctx.drawImage(ctx.canvas, 0, 0, w, h);
    ctx.filter = 'none';
  }},
  { name: 'Warp',       emoji: '🌀', fn: (ctx, w, h, img) => {
    const t = Date.now() / 600;
    ctx.drawImage(img, Math.sin(t) * 12, Math.cos(t) * 10, w + Math.sin(t) * 20, h + Math.cos(t) * 16);
  }},
  { name: 'Fisheye',    emoji: '🐟', fn: (ctx, w, h, img) => {
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h); const d = id.data;
    const out = ctx.createImageData(w, h);
    const cx = w/2, cy = h/2, r = Math.min(w, h) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x-cx)/r, dy = (y-cy)/r, dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 1) {
        const nd = dist * dist;
        const sx = Math.round(cx + nd * dx * r), sy = Math.round(cy + nd * dy * r);
        const si = (sy * w + sx) * 4, di = (y * w + x) * 4;
        out.data[di]=d[si]; out.data[di+1]=d[si+1]; out.data[di+2]=d[si+2]; out.data[di+3]=255;
      }
    } ctx.putImageData(out, 0, 0);
  }},
  { name: 'Shake',      emoji: '😵', fn: (ctx, w, h, img) => {
    const t = Date.now() / 80;
    ctx.drawImage(img, Math.sin(t)*8, Math.cos(t*1.3)*6, w, h);
  }},
  { name: 'Zoom In',    emoji: '🔭', fn: (ctx, w, h, img) => {
    const t = (Math.sin(Date.now()/1500)+1)/2;
    const z = 1 + t * 0.3;
    const ox = (w - w*z)/2, oy = (h - h*z)/2;
    ctx.drawImage(img, ox, oy, w*z, h*z);
  }},
  { name: 'Split',      emoji: '✂️', fn: (ctx, w, h, img) => {
    ctx.drawImage(img, 0, 0, w, h/2, 0, 0, w, h/2);
    ctx.save(); ctx.scale(1,-1); ctx.drawImage(img, 0, 0, w, h/2, 0, -h, w, h/2); ctx.restore();
  }},
  { name: 'Quad',       emoji: '⊞', fn: (ctx, w, h, img) => {
    ctx.drawImage(img, 0, 0, w/2, h/2);
    ctx.save(); ctx.scale(-1,1); ctx.drawImage(img, -w, 0, w/2, h/2); ctx.restore();
    ctx.save(); ctx.scale(1,-1); ctx.drawImage(img, 0, -h, w/2, h/2); ctx.restore();
    ctx.save(); ctx.scale(-1,-1); ctx.drawImage(img, -w, -h, w/2, h/2); ctx.restore();
  }},
  { name: 'Rotate',     emoji: '🔃', fn: (ctx, w, h, img) => {
    const t = Date.now() / 3000;
    ctx.save(); ctx.translate(w/2, h/2); ctx.rotate(t); ctx.drawImage(img, -w/2, -h/2, w, h); ctx.restore();
  }},
];

let currentFilter = 0;
let animFrame = null;
let videoEl = null;
let canvasEl = null;
let ctxEl = null;

function initFilters(video, canvas) {
  videoEl = video;
  canvasEl = canvas;
  ctxEl = canvas.getContext('2d');

  const container = document.getElementById('filterBtns');
  FILTERS.forEach((f, i) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
    btn.innerHTML = `<span class="emoji">${f.emoji}</span>${f.name}`;
    btn.onclick = () => {
      currentFilter = i;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    container.appendChild(btn);
  });

  renderLoop();
}

function renderLoop() {
  if (videoEl && videoEl.readyState >= 2) {
    const w = canvasEl.width = videoEl.videoWidth || 640;
    const h = canvasEl.height = videoEl.videoHeight || 480;
    const f = FILTERS[currentFilter];

    ctxEl.filter = 'none';
    ctxEl.globalCompositeOperation = 'source-over';

    if (!f.fn) {
      ctxEl.drawImage(videoEl, 0, 0, w, h);
    } else {
      const fnStr = f.fn.toString();
      const needsManualDraw = fnStr.includes('ctx.drawImage') || fnStr.includes('ctx.save') || fnStr.includes('putImageData');
      if (needsManualDraw) {
        f.fn(ctxEl, w, h, videoEl);
      } else {
        f.fn(ctxEl, w, h, videoEl);
        ctxEl.drawImage(videoEl, 0, 0, w, h);
      }
    }

    ctxEl.filter = 'none';
    ctxEl.globalCompositeOperation = 'source-over';
  }
  animFrame = requestAnimationFrame(renderLoop);
}

function getCanvasStream() {
  return canvasEl.captureStream(30);
}
