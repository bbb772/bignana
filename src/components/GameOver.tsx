import { useEffect, useState } from 'react';
import { Trophy, RotateCcw, List } from 'lucide-react';
import { getLevelConfig } from '@/lib/levels';
import { getPlayerRank } from '@/lib/player';
import type { Player } from '@/lib/supabase';

interface Props {
  score: number;
  highestLevel: number;
  startTime: number;
  player: Player;
  onRestart: () => void;
  onLeaderboard: () => void;
}

export default function GameOver({ score, highestLevel, startTime, player, onRestart, onLeaderboard }: Props) {
  const [rank, setRank] = useState<number | null>(null);
  const levelCfg = getLevelConfig(highestLevel);
  const duration = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  useEffect(() => {
    getPlayerRank(player.nickname).then(setRank);
  }, [player.nickname]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(14px)' }}>
      <div
        className="w-[300px] rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 100%)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* Header */}
        <div className="py-5 px-6 text-center" style={{ background: 'linear-gradient(135deg, #333, #111)' }}>
          <div className="text-4xl mb-1">💔</div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: '"PingFang SC", sans-serif' }}>游戏结束</h2>
          <p className="text-sm text-gray-300 mt-1">{player.nickname}</p>
        </div>

        {/* Stats */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex justify-between items-center py-2 px-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-sm font-medium" style={{ color: '#aaaaaa' }}>本局得分</span>
            <span className="text-xl font-bold tabular-nums" style={{ color: '#ffffff' }}>
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 px-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-sm font-medium" style={{ color: '#aaaaaa' }}>最高合成</span>
            <span className="text-base font-bold" style={{ color: '#ffffff' }}>
              {levelCfg.label}（Lv.{highestLevel}）
            </span>
          </div>

          <div className="flex justify-between items-center py-2 px-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-sm font-medium" style={{ color: '#aaaaaa' }}>游戏时长</span>
            <span className="text-base font-bold" style={{ color: '#ffffff' }}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 px-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#aaaaaa' }}>
              <Trophy size={14} color="#cccccc" /> 全球排名
            </span>
            <span className="text-xl font-bold tabular-nums" style={{ color: '#ffffff' }}>
              {rank !== null ? `#${rank}` : '查询中...'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #444 0%, #222 100%)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontFamily: '"PingFang SC", sans-serif' }}
          >
            <RotateCcw size={18} /> 再来一局
          </button>
          <button
            onClick={onLeaderboard}
            className="w-full py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', fontFamily: '"PingFang SC", sans-serif' }}
          >
            <List size={18} color="#ffffff" /> 查看排行榜
          </button>
        </div>
      </div>
    </div>
  );
}