import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { MAX_LEVEL, getLevelConfig } from '@/lib/levels';
import { generateBall, getCharacter, getImage, BallConfig, RARITY_COLOR } from '@/lib/characters';
import { drawAvatar } from '@/lib/drawAvatar';
import { playMergeSound, playDropSound, playGameOverSound, checkMilestone, resetMilestones, startBGM, stopBGM } from '@/lib/audio';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 580;
const WALL_THICKNESS = 30;
const DROP_Y = 50;
const DANGER_LINE_Y = 90;
const DROP_COOLDOWN = 650;

const bgImage = new Image();
bgImage.src = 'https://ezfbyqmpnrlbxkonvzgd.supabase.co/storage/v1/object/public/avatar-photos/bg.jpg';

export interface GameState {
  score: number;
  highestLevel: number;
  isOver: boolean;
  startTime: number;
}

export interface NextDrop {
  level: number;
  member: string;
  image: string;
}

interface MergeEffect { x: number; y: number; level: number; flash: number; isBonus: boolean }
interface FloatText   { x: number; y: number; text: string; opacity: number; vy: number; color: string; bold: boolean }
interface MilestoneBanner { message: string; color: string; opacity: number; createdAt: number }

interface Props {
  onGameOver: (state: GameState) => void;
  onScoreUpdate: (score: number, highestLevel: number, next: NextDrop) => void;
  paused: boolean;
  soundEnabled: boolean;
}

interface BodyMeta { avatarLevel: number; avatarMember: string; avatarImageId: string; avatarMultiplier: number }
function meta(b: Matter.Body): BodyMeta { return b as any }

function randomDropLevel(): number {
  const w = [40, 30, 20, 10, 0, 0, 0, 0];
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i + 1; }
  return 1;
}

// 大球破裂延迟（毫秒）
const RUPTURE_DELAY = 3000;

export default function GameCanvas({ onGameOver, onScoreUpdate, paused, soundEnabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const rafRef = useRef<number>(0);

  const s = useRef({
    score: 0, highestLevel: 1, isOver: false, startTime: Date.now(),
    pendingMerges: [] as { bodyA: Matter.Body; bodyB: Matter.Body; level: number }[],
    mergingIds: new Set<number>(),
    mergeEffects: [] as MergeEffect[],
    floatTexts: [] as FloatText[],
    milestoneBanner: null as MilestoneBanner | null,
    nextLevel: 1, nextMember: '', nextImage: '',
    cursorX: GAME_WIDTH / 2,
    lastDropTime: 0,
    gameOverChecked: false, overflowStartTime: 0,
    paused: false,
    bodies: [] as Matter.Body[],
    // 记录每个最大等级球的开始稳定时间
    ruptureTimers: new Map<number, number>(), // body.id -> 首次稳定的时间戳
  });

  const [scale, setScale] = useState(1);

  const endGame = useCallback(() => {
    const st = s.current;
    if (st.isOver) return;
    st.isOver = true;
    st.gameOverChecked = true;
    stopBGM();
    if (soundEnabled) playGameOverSound();
    onGameOver({ score: st.score, highestLevel: st.highestLevel, isOver: true, startTime: st.startTime });
  }, [onGameOver, soundEnabled]);

  const addBody = useCallback((engine: Matter.Engine, x: number, y: number, level: number, ball?: BallConfig) => {
    const cfg = getLevelConfig(level);
    const b = ball ?? generateBall([], 0);
    const char = getCharacter(b.member);
    const imgCfg = getImage(b.member, b.image);
    const body = Matter.Bodies.circle(x, y, cfg.radius, {
      restitution: 0.25, friction: 0.6, frictionAir: 0.01, density: 0.002,
      label: `level-${level}`,
    });
    const m = meta(body);
    m.avatarLevel = level;
    m.avatarMember = b.member;
    m.avatarImageId = b.image;
    m.avatarMultiplier = imgCfg.multiplier;
    Matter.World.add(engine.world, body);
    s.current.bodies.push(body);
    return body;
  }, []);

  const existingAtLevel = useCallback((level: number): BallConfig[] =>
    s.current.bodies
      .filter((b) => meta(b).avatarLevel === level)
      .map((b) => ({ member: meta(b).avatarMember, image: meta(b).avatarImageId })),
  []);

  const makeNext = useCallback((level?: number): NextDrop => {
    const lv = level ?? randomDropLevel();
    const ball = generateBall(existingAtLevel(lv), 0.35);
    return { level: lv, member: ball.member, image: ball.image };
  }, [existingAtLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      setScale(Math.min(rect.width / GAME_WIDTH, rect.height / GAME_HEIGHT));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(container);

    const engine = Matter.Engine.create({ gravity: { y: 2.2 } });
    engineRef.current = engine;
    const wallOpts = { isStatic: true, friction: 0.6, label: 'wall' };
    Matter.World.add(engine.world, [
      Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2, GAME_WIDTH, WALL_THICKNESS, wallOpts),
      Matter.Bodies.rectangle(-WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOpts),
      Matter.Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOpts),
    ]);

    const st = s.current;
    Object.assign(st, {
      score: 0, highestLevel: 1, isOver: false, startTime: Date.now(),
      pendingMerges: [], mergingIds: new Set(), mergeEffects: [],
      floatTexts: [], milestoneBanner: null, bodies: [],
      lastDropTime: 0, gameOverChecked: false, overflowStartTime: 0,
      ruptureTimers: new Map(),
    });
    const firstNext = makeNext();
    st.nextLevel = firstNext.level;
    st.nextMember = firstNext.member;
    st.nextImage = firstNext.image;
    onScoreUpdate(0, 1, firstNext);
    resetMilestones();

    Matter.Events.on(engine, 'collisionStart', (event) => {
      if (st.isOver) return;
      event.pairs.forEach(({ bodyA, bodyB }) => {
        const ma = meta(bodyA), mb = meta(bodyB);
        if (ma.avatarLevel && mb.avatarLevel
          && ma.avatarLevel === mb.avatarLevel
          && ma.avatarLevel < MAX_LEVEL
          && !st.mergingIds.has(bodyA.id) && !st.mergingIds.has(bodyB.id)) {
          st.mergingIds.add(bodyA.id);
          st.mergingIds.add(bodyB.id);
          st.pendingMerges.push({ bodyA, bodyB, level: ma.avatarLevel });
        }
      });
    });

    let lastTime = 0;
    function gameLoop(ts: number) {
      if (st.isOver) return;
      rafRef.current = requestAnimationFrame(gameLoop);
      const dt = Math.min(ts - lastTime, 50);
      lastTime = ts;

      if (!st.paused) {
        Matter.Engine.update(engine, dt);

        // 处理合并队列
        const merges = [...st.pendingMerges];
        st.pendingMerges = [];
        merges.forEach(({ bodyA, bodyB, level }) => {
          if (!st.bodies.includes(bodyA) || !st.bodies.includes(bodyB)) return;
          const ma = meta(bodyA), mb = meta(bodyB);
          const mx = (bodyA.position.x + bodyB.position.x) / 2;
          const my = Math.min((bodyA.position.y + bodyB.position.y) / 2, GAME_HEIGHT - getLevelConfig(level + 1).radius - 5);

          const sameImage = ma.avatarMember === mb.avatarMember && ma.avatarImageId === mb.avatarImageId;
          const rarityMult = Math.max(ma.avatarMultiplier, mb.avatarMultiplier);
          const bonusMult = sameImage ? 2 : 1;
          const newLevel = level + 1;
          const gained = Math.round(getLevelConfig(newLevel).baseScore * rarityMult * bonusMult);

          Matter.World.remove(engine.world, bodyA);
          Matter.World.remove(engine.world, bodyB);
          st.bodies = st.bodies.filter((b) => b !== bodyA && b !== bodyB);
          st.mergingIds.delete(bodyA.id); st.mergingIds.delete(bodyB.id);

          const newBall = generateBall(existingAtLevel(newLevel), 0);
          addBody(engine, mx, my, newLevel, newBall);

          st.score += gained;
          st.highestLevel = Math.max(st.highestLevel, newLevel);
          onScoreUpdate(st.score, st.highestLevel, { level: st.nextLevel, member: st.nextMember, image: st.nextImage });

          st.mergeEffects.push({ x: mx, y: my, level: newLevel, flash: 1, isBonus: sameImage });

          const nr = getLevelConfig(newLevel).radius;
          if (sameImage) {
            st.floatTexts.push({ x: mx, y: my - nr - 8,  text: '双倍!',   opacity: 1, vy: -2,   color: '#FFD700', bold: true });
            st.floatTexts.push({ x: mx, y: my - nr + 12, text: `+${gained}`, opacity: 1, vy: -1.5, color: '#FF8F00', bold: true });
          } else {
            const char = getCharacter(newBall.member);
            st.floatTexts.push({ x: mx, y: my - nr, text: `+${gained}`, opacity: 1, vy: -1.5, color: char.bg[1], bold: false });
          }

          if (soundEnabled) playMergeSound(newLevel);
          const milestone = checkMilestone(st.score);
          if (milestone) st.milestoneBanner = { ...milestone, opacity: 1, createdAt: ts };
        });

        // 检查最高等级球的破裂
        st.bodies.forEach((body) => {
          const lv = meta(body).avatarLevel;
          if (lv === MAX_LEVEL) {
            // 判断球是否稳定（速度很小且在危险线以下不远）
            if (body.speed < 0.5 && body.position.y > DANGER_LINE_Y + getLevelConfig(MAX_LEVEL).radius) {
              if (!st.ruptureTimers.has(body.id)) {
                st.ruptureTimers.set(body.id, ts);
              } else {
                const startTime = st.ruptureTimers.get(body.id)!;
                if (ts - startTime > RUPTURE_DELAY) {
                  // 破裂奖励
                  const cfg = getLevelConfig(MAX_LEVEL);
                  const ruptureScore = cfg.baseScore * 3; // 破裂得分是基础分的3倍
                  st.score += ruptureScore;
                  st.floatTexts.push({
                    x: body.position.x,
                    y: body.position.y - cfg.radius,
                    text: `破裂+${ruptureScore}`,
                    opacity: 1,
                    vy: -2,
                    color: '#FF4500',
                    bold: true
                  });
                  // 移除球
                  Matter.World.remove(engine.world, body);
                  st.bodies = st.bodies.filter((b) => b !== body);
                  st.ruptureTimers.delete(body.id);
                  // 音效（可选）
                  if (soundEnabled) playMergeSound(MAX_LEVEL + 1); // 借用合成音效
                }
              }
            } else {
              // 如果球还在运动，清除计时器
              if (st.ruptureTimers.has(body.id)) {
                st.ruptureTimers.delete(body.id);
              }
            }
          }
        });

        // 特效衰减
        st.mergeEffects = st.mergeEffects.map((e) => ({ ...e, flash: e.flash - 0.055 })).filter((e) => e.flash > 0);
        st.floatTexts = st.floatTexts.map((t) => ({ ...t, y: t.y + t.vy, opacity: t.opacity - 0.018 })).filter((t) => t.opacity > 0);
        if (st.milestoneBanner) {
          const age = ts - st.milestoneBanner.createdAt;
          st.milestoneBanner.opacity = age < 2000 ? 1 : Math.max(0, 1 - (age - 2000) / 800);
          if (st.milestoneBanner.opacity <= 0) st.milestoneBanner = null;
        }

        // 原有的游戏结束逻辑（顶部溢出）
        const overflow = st.bodies.some(
          (b) => b.position.y - getLevelConfig(meta(b).avatarLevel).radius < DANGER_LINE_Y && b.speed < 1
        );
        if (overflow) {
          if (!st.overflowStartTime) st.overflowStartTime = ts;
          else if (ts - st.overflowStartTime > 2000 && !st.gameOverChecked) {
            st.gameOverChecked = true; st.isOver = true;
            stopBGM();
            if (soundEnabled) playGameOverSound();
            onGameOver({ score: st.score, highestLevel: st.highestLevel, isOver: true, startTime: st.startTime });
            return;
          }
        } else { st.overflowStartTime = 0; }
      }

      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      render(ctx, st, ts);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
    if (soundEnabled) startBGM();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      engineRef.current = null;
      stopBGM();
    };
  }, []);

  useEffect(() => { s.current.paused = paused; }, [paused]);
  useEffect(() => {
    if (!soundEnabled) stopBGM();
    else if (!s.current.isOver && !s.current.paused) startBGM();
  }, [soundEnabled]);

  function render(ctx: CanvasRenderingContext2D, st: typeof s.current, ts: number) {
    // 背景
    if (bgImage.complete) {
      ctx.drawImage(bgImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // 墙壁
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, 0, 2, GAME_HEIGHT);
    ctx.fillRect(GAME_WIDTH - 2, 0, 2, GAME_HEIGHT);
    ctx.fillRect(0, GAME_HEIGHT - 2, GAME_WIDTH, 2);

    // 危险线
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + 0.3 * Math.sin(ts / 400)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, DANGER_LINE_Y); ctx.lineTo(GAME_WIDTH, DANGER_LINE_Y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.setLineDash([]);
    ctx.font = '11px "PingFang SC",sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('⚠ 危险线', GAME_WIDTH - 8, DANGER_LINE_Y - 4);
    ctx.restore();

    // 球体
    st.bodies.forEach((body) => {
      const m = meta(body);
      const eff = st.mergeEffects.find((e) => Math.abs(e.x - body.position.x) < 6 && Math.abs(e.y - body.position.y) < 6);
      drawAvatar(ctx, body.position.x, body.position.y, m.avatarLevel, m.avatarMember, m.avatarImageId, 1, eff ? eff.flash : 0, ts);
    });

    // 合成光环
    st.mergeEffects.forEach((e) => {
      const r = getLevelConfig(e.level).radius;
      ctx.save();
      ctx.globalAlpha = e.flash * 0.65;
      ctx.strokeStyle = e.isBonus ? '#FFD700' : '#FF8F00';
      ctx.lineWidth = e.isBonus ? 4 : 2.5;
      if (e.isBonus) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 16; }
      ctx.beginPath(); ctx.arc(e.x, e.y, r * (1 + (1 - e.flash) * 0.6), 0, Math.PI * 2); ctx.stroke();
      if (e.isBonus) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + ts / 400;
          const d = r * (1.1 + (1 - e.flash) * 0.4);
          const p = 0.5 + 0.5 * Math.sin(ts / 150 + i);
          ctx.globalAlpha = e.flash * 0.8 * p;
          ctx.fillStyle = '#FFD700';
          const ss = r * 0.12;
          ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, ss, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    });

    // 浮动文字
    st.floatTexts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = t.opacity;
      ctx.font = `${t.bold ? 'bold ' : ''}${t.bold ? 17 : 15}px "PingFang SC",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = t.color;
      ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 4;
      if (t.bold) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.strokeText(t.text, t.x, t.y); }
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    // 里程碑横幅
    if (st.milestoneBanner) {
      const b = st.milestoneBanner;
      ctx.save(); ctx.globalAlpha = b.opacity;
      const bw = 210, bh = 46, bx = (GAME_WIDTH - bw) / 2, by = GAME_HEIGHT / 2 - 90;
      const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
      g.addColorStop(0, b.color + 'DD'); g.addColorStop(1, b.color + '88');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 23); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = `bold 21px "PingFang SC",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 6;
      ctx.fillText(b.message, GAME_WIDTH / 2, by + bh / 2);
      ctx.restore();
    }

    // 掉落预览与瞄准线
    if (!st.isOver) {
      const cfg = getLevelConfig(st.nextLevel);
      const cx = Math.max(cfg.radius + 4, Math.min(GAME_WIDTH - cfg.radius - 4, st.cursorX));
      ctx.save(); ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.moveTo(cx, DROP_Y + cfg.radius); ctx.lineTo(cx, GAME_HEIGHT); ctx.stroke();
      ctx.restore();
      drawAvatar(ctx, cx, DROP_Y, st.nextLevel, st.nextMember, st.nextImage, 0.82, 0, ts);

      const hasMatch = st.bodies.some(
        (b) => meta(b).avatarLevel === st.nextLevel
          && meta(b).avatarMember === st.nextMember
          && meta(b).avatarImageId === st.nextImage
      );
      if (hasMatch) {
        ctx.save();
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(ts / 300);
        ctx.strokeStyle = RARITY_COLOR['rare'];
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, DROP_Y, cfg.radius + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `bold 10px "PingFang SC",sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('双倍机会!', cx, DROP_Y - cfg.radius - 5);
        ctx.restore();
      }
    }

    if (st.overflowStartTime > 0) {
      const a = Math.sin((ts - st.overflowStartTime) / 130) * 0.12;
      if (a > 0) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT); ctx.restore(); }
    }
  }

  function handleMove(clientX: number) {
    if (s.current.isOver || s.current.paused) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    s.current.cursorX = Math.max(0, Math.min(GAME_WIDTH, (clientX - rect.left) / scale));
  }

  function handleDrop() {
    const st = s.current;
    if (st.isOver || st.paused || Date.now() - st.lastDropTime < DROP_COOLDOWN) return;
    st.lastDropTime = Date.now();
    const engine = engineRef.current;
    if (!engine) return;

    const cfg = getLevelConfig(st.nextLevel);
    const x = Math.max(cfg.radius + 4, Math.min(GAME_WIDTH - cfg.radius - 4, st.cursorX));
    addBody(engine, x, DROP_Y, st.nextLevel, { member: st.nextMember, image: st.nextImage });
    if (soundEnabled) playDropSound();

    const next = makeNext();
    st.nextLevel = next.level; st.nextMember = next.member; st.nextImage = next.image;
    onScoreUpdate(st.score, st.highestLevel, next);
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center', cursor: 'crosshair', borderRadius: '12px', boxShadow: '0 8px 40px rgba(255,105,180,0.25)' }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onClick={handleDrop}
        onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX); }}
        onTouchEnd={(e) => { e.preventDefault(); handleDrop(); }}
      />
      {/* 主动结束游戏按钮 */}
      {!s.current.isOver && (
        <button
          onClick={endGame}
          className="absolute bottom-2 right-2 z-10 px-3 py-1 rounded-full text-xs font-bold text-white opacity-70 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          结束游戏
        </button>
      )}
    </div>
  );
}