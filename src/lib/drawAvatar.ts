import { Character, CharacterImage, Rarity, EyeStyle, MouthStyle, Accessory, getCharacter, getImage } from './characters';
import { getLevelConfig } from './levels';

// 图片加载缓存
const imageCache = new Map<string, HTMLImageElement>();
// 预渲染的圆形纹理缓存（关键优化）
const textureCache = new Map<string, HTMLCanvasElement>();

// 创建一个圆形裁剪的纹理
function createRoundTexture(img: HTMLImageElement, radius: number): HTMLCanvasElement {
  const size = radius * 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
}

// ─── Low-level shape helpers ───────────────────────────────────────────────

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, points = 5) {
  const inner = r * 0.4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    i === 0 ? ctx.moveTo(x + rad * Math.cos(a), y + rad * Math.sin(a))
             : ctx.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
  }
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.25);
  ctx.bezierCurveTo(x, y - s * 0.1, x - s, y - s * 0.1, x - s, y + s * 0.25);
  ctx.bezierCurveTo(x - s, y + s * 0.65, x, y + s, x, y + s);
  ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.65, x + s, y + s * 0.25);
  ctx.bezierCurveTo(x + s, y - s * 0.1, x, y - s * 0.1, x, y + s * 0.25);
  ctx.closePath();
}

// ─── Eyes ─────────────────────────────────────────────────────────────────

function drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, style: EyeStyle, color: string) {
  const ox = r * 2.5;
  if (style === 'round') {
    for (const sx of [-ox, ox]) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + sx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(cx + sx + r * 0.35, cy - r * 0.3, r * 0.32, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style === 'star') {
    for (const sx of [-ox, ox]) {
      ctx.fillStyle = color;
      drawStar(ctx, cx + sx, cy, r, 5);
      ctx.fill();
    }
  } else if (style === 'heart') {
    for (const sx of [-ox, ox]) {
      ctx.save();
      ctx.translate(cx + sx, cy - r * 0.2);
      ctx.scale(r * 0.55, r * 0.55);
      drawHeart(ctx, 0, -0.5, 1);
      ctx.fillStyle = color; ctx.fill();
      ctx.restore();
    }
  } else if (style === 'cat') {
    for (const sx of [-ox, ox]) {
      ctx.save(); ctx.translate(cx + sx, cy);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.65, r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.25, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  } else if (style === 'squint') {
    ctx.strokeStyle = color;
    ctx.lineWidth = r * 0.7; ctx.lineCap = 'round';
    for (const sx of [-ox, ox]) {
      ctx.beginPath();
      ctx.arc(cx + sx, cy + r * 0.2, r * 0.8, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// ─── Mouth ────────────────────────────────────────────────────────────────

function drawMouth(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, style: MouthStyle) {
  ctx.strokeStyle = '#555';
  ctx.lineWidth = r * 0.65; ctx.lineCap = 'round';

  if (style === 'smile') {
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, 0.2, Math.PI - 0.2); ctx.stroke();
  } else if (style === 'grin') {
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.7, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = r * 0.35;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.7, 0.2, Math.PI - 0.2); ctx.stroke();
  } else if (style === 'excited') {
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.3, r * 1.1, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#CC3333'; ctx.fill();
    ctx.strokeStyle = '#444'; ctx.lineWidth = r * 0.4; ctx.stroke();
  } else if (style === 'kiss') {
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#E91E63'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.15, r * 0.45, Math.PI, 0);
    ctx.fillStyle = '#FCE4EC'; ctx.fill();
  } else if (style === 'smirk') {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.8, cy + r * 0.2);
    ctx.quadraticCurveTo(cx - r * 0.1, cy + r * 0.2, cx + r * 1.2, cy - r * 0.5);
    ctx.stroke();
  }
}

// ─── Accessories ──────────────────────────────────────────────────────────

function drawAccessory(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, acc: Accessory, color: string) {
  if (acc === 'none') return;
  ctx.save();
  const c = color || '#FF4081';

  if (acc === 'bow') {
    const bx = cx, by = cy - r * 0.95, bs = r * 0.32;
    ctx.fillStyle = c;
    for (const flip of [-1, 1]) {
      ctx.save(); ctx.translate(bx, by); ctx.scale(flip, 1);
      ctx.beginPath(); ctx.ellipse(bs * 1.1, 0, bs * 1.05, bs * 0.55, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(bx, by, bs * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(bx, by, bs * 0.18, 0, Math.PI * 2); ctx.fill();

  } else if (acc === 'crown') {
    const ty = cy - r * 0.88, cw = r * 0.72, ch = r * 0.38;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(cx - cw, ty + ch);
    ctx.lineTo(cx - cw, ty); ctx.lineTo(cx - cw * 0.35, ty + ch * 0.45);
    ctx.lineTo(cx, ty - ch * 0.2); ctx.lineTo(cx + cw * 0.35, ty + ch * 0.45);
    ctx.lineTo(cx + cw, ty); ctx.lineTo(cx + cw, ty + ch);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(cx, ty - ch * 0.2, r * 0.07, 0, Math.PI * 2); ctx.fill();
    for (const sx of [-cw * 0.85, cw * 0.85]) {
      ctx.beginPath(); ctx.arc(cx + sx, ty + ch * 0.15, r * 0.055, 0, Math.PI * 2); ctx.fill();
    }

  } else if (acc === 'sunglasses') {
    const gy = cy - r * 0.08, gr = r * 0.23, gox = r * 0.33;
    ctx.fillStyle = c; ctx.globalAlpha *= 0.85;
    for (const sx of [-gox, gox]) {
      ctx.beginPath(); ctx.ellipse(cx + sx, gy, gr, gr * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = c; ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.moveTo(cx - gox + gr, gy); ctx.lineTo(cx + gox - gr, gy); ctx.stroke();
    for (const [sx, dir] of [[-gox - gr, -1], [gox + gr, 1]] as [number, number][]) {
      ctx.beginPath(); ctx.moveTo(cx + sx, gy); ctx.lineTo(cx + sx + dir * gr * 0.7, gy - r * 0.1); ctx.stroke();
    }

  } else if (acc === 'flowers') {
    const fy = cy - r * 0.82, fx = cx + r * 0.58;
    const pr = r * 0.1, cr = r * 0.07;
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(fx + Math.cos(a) * pr * 1.5, fy + Math.sin(a) * pr * 1.5, pr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(fx, fy, cr, 0, Math.PI * 2); ctx.fill();

  } else if (acc === 'ribbon') {
    const ry = cy - r * 0.88, rx = cx + r * 0.6, rs = r * 0.18;
    ctx.fillStyle = c;
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(0.5);
    for (const flip of [-1, 1]) {
      ctx.save(); ctx.scale(flip, 1);
      ctx.beginPath(); ctx.ellipse(rs * 1.1, 0, rs * 1.1, rs * 0.5, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, rs * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

  } else if (acc === 'tiara') {
    const ty = cy - r * 0.9, tw = r * 0.65;
    ctx.strokeStyle = c; ctx.lineWidth = r * 0.07; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - tw, ty + r * 0.25);
    ctx.quadraticCurveTo(cx - tw * 0.6, ty + r * 0.1, cx - tw * 0.3, ty + r * 0.18);
    ctx.quadraticCurveTo(cx, ty - r * 0.1, cx + tw * 0.3, ty + r * 0.18);
    ctx.quadraticCurveTo(cx + tw * 0.6, ty + r * 0.1, cx + tw, ty + r * 0.25);
    ctx.stroke();
    ctx.fillStyle = c;
    drawStar(ctx, cx, ty, r * 0.1, 4); ctx.fill();
    for (const sx of [-tw * 0.55, tw * 0.55]) {
      ctx.beginPath(); ctx.arc(cx + sx, ty + r * 0.12, r * 0.055, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.restore();
}

// ─── Rarity ring ──────────────────────────────────────────────────────────

function drawRarityRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rarity: Rarity, ts: number) {
  if (rarity === 'common') return;
  ctx.save();
  if (rarity === 'rare') {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, 'rgba(192,192,192,0.9)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(192,192,192,0.9)');
    ctx.strokeStyle = g; ctx.lineWidth = r * 0.1;
    ctx.shadowColor = 'rgba(192,192,192,0.8)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx, cy, r + r * 0.06, 0, Math.PI * 2); ctx.stroke();
  } else {
    const hue = (ts / 15) % 360;
    for (let i = 0; i < 6; i++) {
      const h = (hue + i * 60) % 360;
      const g = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      g.addColorStop(0, `hsla(${h},100%,60%,0)`);
      g.addColorStop(0.5, `hsla(${h},100%,60%,1)`);
      g.addColorStop(1, `hsla(${(h + 60) % 360},100%,60%,0)`);
      ctx.strokeStyle = g; ctx.lineWidth = r * 0.11;
      ctx.shadowColor = `hsla(${h},100%,60%,0.8)`; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, r + r * 0.08, (i / 6) * Math.PI * 2, ((i + 1) / 6) * Math.PI * 2);
      ctx.stroke();
    }
    // orbiting sparkles
    for (let i = 0; i < 4; i++) {
      const a = (ts / 600 + (i / 4) * Math.PI * 2);
      const pulse = 0.5 + 0.5 * Math.sin(ts / 200 + i);
      ctx.globalAlpha = 0.7 * pulse;
      ctx.fillStyle = `hsl(${(hue + i * 90) % 360}, 100%, 70%)`;
      drawStar(ctx, cx + Math.cos(a) * (r + r * 0.22), cy + Math.sin(a) * (r + r * 0.22), r * 0.1 * pulse, 4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawRarityBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rarity: Rarity) {
  if (rarity === 'common') return;
  const bx = cx + r * 0.62, by = cy - r * 0.62, br = r * 0.22;
  ctx.save();
  ctx.fillStyle = rarity === 'legendary' ? '#FF8F00' : '#9E9E9E';
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  ctx.font = `bold ${br * 1.3}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0; ctx.fillStyle = 'white';
  ctx.fillText(rarity === 'legendary' ? '♛' : '★', bx, by);
  ctx.restore();
}

// ─── Main export ──────────────────────────────────────────────────────────

export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number,
  member: string,
  imageId: string,
  alpha = 1,
  mergeFlash = 0,
  ts = 0
) {
  const levelCfg = getLevelConfig(level);
  const char: Character = getCharacter(member);
  const imgCfg: CharacterImage = getImage(member, imageId);
  const r = levelCfg.radius;
  const [bgStart, bgEnd] = imgCfg.bgShift ?? char.bg;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── 照片绘制（使用预渲染圆形纹理，极速）──────────────
  if (imgCfg.imageUrl) {
    // 获取或加载原始图片
    let img = imageCache.get(imgCfg.imageUrl);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgCfg.imageUrl;
      imageCache.set(imgCfg.imageUrl, img);
    }

    // 生成预渲染圆形纹理（图片加载完成后只需生成一次）
    const textureKey = `${imgCfg.imageUrl}_${r}`;
    let texture = textureCache.get(textureKey);
    if (!texture && img.complete && img.naturalWidth > 0) {
      texture = createRoundTexture(img, r);
      textureCache.set(textureKey, texture);
    }

    if (texture) {
      // 直接绘制圆形纹理
      ctx.drawImage(texture, x - r, y - r, r * 2, r * 2);
    } else {
      // 图片未加载或纹理未就绪，显示占位渐变
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.08, x, y, r);
      grad.addColorStop(0, bgStart);
      grad.addColorStop(1, bgEnd);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // 图片加载完毕后不会自动更新，需要下一帧重绘，没问题
    }

    // 稀有度特效
    if (mergeFlash > 0) {
      ctx.shadowColor = bgStart;
      ctx.shadowBlur = 10 + mergeFlash * 28;
    }
    drawRarityRing(ctx, x, y, r, imgCfg.rarity, ts);
    drawRarityBadge(ctx, x, y, r, imgCfg.rarity);
    ctx.restore();
    return;
  }

  // ── 矢量绘制（保留原有逻辑，但没有照片时使用）──────────────
  if (mergeFlash > 0) {
    ctx.shadowColor = bgStart;
    ctx.shadowBlur = 10 + mergeFlash * 28;
  }

  drawRarityRing(ctx, x, y, r, imgCfg.rarity, ts);

  // Body
  const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.08, x, y, r);
  bg.addColorStop(0, bgStart);
  bg.addColorStop(1, bgEnd);
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();

  // Shine
  const shine = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x - r * 0.2, y - r * 0.2, r * 0.55);
  shine.addColorStop(0, 'rgba(255,255,255,0.5)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();

  // Face
  const faceR = r * 0.62;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.04, faceR, 0, Math.PI * 2);
  ctx.fillStyle = char.face;
  ctx.fill();

  // Cheeks
  const eyeY = y - r * 0.05, eyeR = faceR * 0.14, eyeOx = faceR * 0.32;
  ctx.globalAlpha = alpha * 0.45;
  ctx.fillStyle = char.cheek;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + sx * eyeOx * 1.35, eyeY + eyeR * 2.8, eyeR * 1.4, eyeR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = alpha;

  drawEyes(ctx, x, eyeY, eyeR, imgCfg.eye, char.eyeColor);
  drawMouth(ctx, x, eyeY + eyeR * 3.8, eyeR, imgCfg.mouth);
  drawAccessory(ctx, x, y, r, imgCfg.acc, imgCfg.accColor);
  drawRarityBadge(ctx, x, y, r, imgCfg.rarity);

  ctx.restore();
}