import { useState } from 'react';
import { checkNicknameAvailable, registerPlayer, loginPlayer } from '@/lib/player';
import type { Player } from '@/lib/supabase';

interface Props {
  onRegistered: (player: Player) => void;
}

type Mode = 'login' | 'register';

export default function NicknameModal({ onRegistered }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedNick = nickname.trim();
    const trimmedPass = password.trim();
    if (!trimmedNick) { setError('昵称不能为空'); return; }
    if (trimmedNick.length < 2) { setError('昵称至少2个字'); return; }
    if (trimmedNick.length > 12) { setError('昵称最多12个字'); return; }
    if (!trimmedPass) { setError('密码不能为空'); return; }
    if (trimmedPass.length < 4) { setError('密码至少4位'); return; }

    setLoading(true);
    setError('');

    if (mode === 'register') {
      // 检查昵称是否已被占用
      const available = await checkNicknameAvailable(trimmedNick);
      if (!available) {
        setError('该昵称已被注册，请直接登录');
        setLoading(false);
        return;
      }
      const player = await registerPlayer(trimmedNick, trimmedPass);
      if (!player) {
        setError('注册失败，请稍后重试');
        setLoading(false);
        return;
      }
      onRegistered(player);
    } else {
      // 登录
      const player = await loginPlayer(trimmedNick, trimmedPass);
      if (!player) {
        setError('昵称或密码错误');
        setLoading(false);
        return;
      }
      onRegistered(player);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="w-[300px] rounded-3xl p-8 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}>
            合成大呐呐
          </h1>
          <p className="text-sm" style={{ color: '#cccccc' }}>
            {mode === 'login' ? '登录已有账号' : '注册新账号'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(''); }}
            placeholder="昵称"
            maxLength={12}
            className="w-full px-4 py-3 rounded-2xl outline-none text-center text-lg font-semibold"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
            }}
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="密码"
            maxLength={20}
            className="w-full px-4 py-3 rounded-2xl outline-none text-center text-lg font-semibold"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
            }}
          />

          {error && (
            <p className="text-center text-sm font-medium" style={{ color: '#ff6b6b' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
            style={{
              background: loading ? '#555' : 'linear-gradient(135deg, #444 0%, #222 100%)',
              fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            }}
          >
            {loading ? '请稍后...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-sm font-medium hover:underline"
            style={{ color: '#aaaaaa' }}
          >
            {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#888888' }}>
          昵称用于全球排行榜展示，密码保护你的成绩
        </p>
      </div>
    </div>
  );
}