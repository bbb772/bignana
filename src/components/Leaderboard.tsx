import { useEffect, useState } from 'react';
import { X, Trophy, RefreshCw } from 'lucide-react';
import { fetchLeaderboard, LeaderboardRow } from '@/lib/player';
import { getLevelConfig } from '@/lib/levels';
import type { Player } from '@/lib/supabase';

interface Props {
  player: Player | null;
  onClose: () => void;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ player, onClose }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchLeaderboard(50);
    setRows(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const myRow = player ? rows.find((r) => r.nickname === player.nickname) : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(14px)' }}>
      <div className="w-[340px] max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg, #333, #111)' }}>
          <div className="flex items-center gap-2">
            <Trophy size={20} color="#FFD700" />
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: '"PingFang SC", sans-serif' }}>合成大呐呐排行榜</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={16} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* My rank banner */}
        {myRow && (
          <div className="mx-4 mt-3 px-4 py-2 rounded-2xl flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>我的排名 #{myRow.rank}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#ffffff' }}>{myRow.score.toLocaleString()} 分</span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 transparent' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-gray-500 border-t-white rounded-full animate-spin" style={{ borderWidth: 3 }} />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#aaaaaa' }}>暂无数据，快来创造记录吧！</p>
          ) : (
            rows.map((row) => {
              const isMe = player?.nickname === row.nickname;
              const cfg = getLevelConfig(row.highest_level);
              return (
                <div
                  key={row.rank}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
                  style={{
                    background: isMe
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    border: isMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  }}
                >
                  {/* Rank */}
                  <div className="w-7 text-center flex-shrink-0">
                    {row.rank <= 3 ? (
                      <span className="text-lg">{MEDAL[row.rank - 1]}</span>
                    ) : (
                      <span className="text-sm font-bold" style={{ color: '#ffffff' }}>{row.rank}</span>
                    )}
                  </div>

                  {/* Avatar dot */}
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #666, #333)' }}
                  />

                  {/* Nickname */}
                  <span className="flex-1 text-sm font-semibold truncate" style={{ color: isMe ? '#ffffff' : '#cccccc', fontFamily: '"PingFang SC", sans-serif' }}>
                    {row.nickname}{isMe ? ' (我)' : ''}
                  </span>

                  {/* Score */}
                  <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: '#ffffff' }}>
                    {row.score.toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 pb-4 pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', fontFamily: '"PingFang SC", sans-serif' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}