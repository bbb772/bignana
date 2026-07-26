import { useEffect, useState, useRef } from 'react';
import { getLevelConfig } from '@/lib/levels';
import { getCharacter, getImage, RARITY_LABEL, RARITY_COLOR } from '@/lib/characters';
import type { NextDrop } from '@/components/GameCanvas';

interface Props {
  score: number;
  bestScore: number;
  highestLevel: number;
  next: NextDrop | null;
}

/** 离屏生成圆形图片纹理，用于预览 */
function createRoundPreview(url: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

export default function HUD({ score, bestScore, highestLevel, next }: Props) {
  const topCfg = getLevelConfig(highestLevel);
  const nextCfg = next ? getLevelConfig(next.level) : null;
  const char = next ? getCharacter(next.member) : null;
  const imgCfg = next ? getImage(next.member, next.image) : null;
  const rarity = imgCfg?.rarity ?? 'common';
  const rarityColor = RARITY_COLOR[rarity];

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (imgCfg?.imageUrl) {
      if (imageUrlRef.current === imgCfg.imageUrl) return;
      imageUrlRef.current = imgCfg.imageUrl;
      const size = 44; // CSS 显示尺寸，实际 canvas 用 2x 清晰度
      createRoundPreview(imgCfg.imageUrl, size * 2)
        .then((dataUrl) => {
          if (!cancelled && dataUrl) setPreviewUrl(dataUrl);
        });
    } else {
      imageUrlRef.current = null;
      setPreviewUrl(null);
    }
    return () => { cancelled = true; };
  }, [imgCfg?.imageUrl]);

  return (
    <div
      className="flex items-center justify-between px-3 py-2 w-full mx-auto rounded-b-2xl"
      style={{
        maxWidth: 360,
        background: 'rgba(20, 20, 20, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}
    >
      {/* 当前分数 */}
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-xs font-medium" style={{ color: '#aaaaaa' }}>当前分</span>
        <span className="text-xl font-bold tabular-nums" style={{ color: '#ffffff', fontFamily: '"PingFang SC",sans-serif' }}>
          {score.toLocaleString()}
        </span>
      </div>

      {/* 下一个球预览 */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-medium mb-1" style={{ color: '#aaaaaa' }}>下一个</span>
        {char && nextCfg ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="relative">
              {previewUrl ? (
                <div
                  className="w-11 h-11 rounded-full shadow-md"
                  style={{
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: rarity === 'legendary'
                      ? `0 0 12px ${rarityColor}`
                      : rarity === 'rare' ? `0 0 6px ${rarityColor}88` : `0 2px 8px rgba(0,0,0,0.4)`,
                  }}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${imgCfg?.bgShift?.[0] ?? char.bg[0]}, ${imgCfg?.bgShift?.[1] ?? char.bg[1]})`,
                    boxShadow: rarity === 'legendary'
                      ? `0 0 12px ${rarityColor}`
                      : rarity === 'rare' ? `0 0 6px ${rarityColor}88` : `0 2px 8px rgba(0,0,0,0.4)`,
                    fontSize: 10,
                    fontFamily: '"PingFang SC",sans-serif',
                  }}
                >
                  {char.name.slice(0, 2)}
                </div>
              )}
              {rarity !== 'common' && (
                <div
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: rarityColor, fontSize: 9, color: 'white', boxShadow: `0 1px 4px ${rarityColor}88` }}
                >
                  {rarity === 'legendary' ? '♛' : '★'}
                </div>
              )}
            </div>
            {/* 稀有度标签 */}
            <span className="text-center leading-none" style={{ fontSize: 9, color: rarityColor, fontFamily: '"PingFang SC",sans-serif' }}>
              {RARITY_LABEL[rarity]}{imgCfg && imgCfg.multiplier > 1 ? ` ×${imgCfg.multiplier}` : ''}
            </span>
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        )}
      </div>

      {/* 最高分与最高等级 */}
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-xs font-medium" style={{ color: '#aaaaaa' }}>最高分</span>
        <span className="text-base font-bold tabular-nums" style={{ color: '#ffffff', fontFamily: '"PingFang SC",sans-serif' }}>
          {bestScore.toLocaleString()}
        </span>
        <span className="text-xs mt-0.5" style={{ color: '#cccccc', fontFamily: '"PingFang SC",sans-serif' }}>
          {topCfg.label}
        </span>
      </div>
    </div>
  );
}