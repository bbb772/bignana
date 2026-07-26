import { useEffect, useState, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, List, Home } from 'lucide-react';
import GameCanvas, { GameState, NextDrop } from '@/components/GameCanvas';
import NicknameModal from '@/components/NicknameModal';
import HUD from '@/components/HUD';
import GameOver from '@/components/GameOver';
import Leaderboard from '@/components/Leaderboard';
import { getStoredPlayer, clearStoredPlayer, submitScore } from '@/lib/player';
import { fetchCustomImages } from '@/lib/characters';
import { setSoundEnabled } from '@/lib/audio';
import type { Player } from '@/lib/supabase';

type Screen = 'loading' | 'nickname' | 'game' | 'gameover' | 'leaderboard';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [player, setPlayer] = useState<Player | null>(null);
  const [score, setScore] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);
  const [next, setNext] = useState<NextDrop | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [gameKey, setGameKey] = useState(0);
  const [endedState, setEndedState] = useState<GameState | null>(null);
  const scoreRef = useRef(0);
  const highestLevelRef = useRef(1);

  useEffect(() => {
    fetchCustomImages();
    getStoredPlayer().then((p) => {
      setPlayer(p);
      setScreen(p ? 'game' : 'nickname');
    });
  }, []);

  const handleRegistered = useCallback((p: Player) => {
    setPlayer(p);
    setScreen('game');
  }, []);

  const handleScoreUpdate = useCallback((s: number, hl: number, nd: NextDrop) => {
    scoreRef.current = s;
    highestLevelRef.current = hl;
    setScore(s);
    setHighestLevel(hl);
    setNext(nd);
    setBestScore((prev) => Math.max(prev, s));
  }, []);

  const handleGameOver = useCallback(async (state: GameState) => {
    setEndedState(state);
    setScreen('gameover');
    if (player) {
      const duration = Math.floor((Date.now() - state.startTime) / 1000);
      await submitScore(player, state.score, state.highestLevel, duration);
    }
  }, [player]);

  const handleRestart = useCallback(() => {
    setScore(0);
    setHighestLevel(1);
    setNext(null);
    setPaused(false);
    setEndedState(null);
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const handleGoHome = useCallback(() => {
    clearStoredPlayer();
    setPlayer(null);
    setScreen('nickname');
    // 重置游戏相关状态
    setScore(0);
    setHighestLevel(1);
    setNext(null);
    setPaused(false);
    setEndedState(null);
    setGameKey((k) => k + 1);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      setSoundEnabled(!prev);
      return !prev;
    });
  }, []);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  if (screen === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '4px solid #333', borderTopColor: '#fff' }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#121212' }}>
      <div className="relative flex flex-col" style={{ width: '100%', maxWidth: 400, height: '100%', maxHeight: 'calc(100vw * 16 / 9)' }}>

        {/* HUD */}
        <div className="flex-shrink-0 flex justify-center" style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}>
          <HUD score={score} bestScore={bestScore} highestLevel={highestLevel} next={next} />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative mx-2 my-1 overflow-hidden">
          {screen === 'game' && (
            <GameCanvas
              key={gameKey}
              onGameOver={handleGameOver}
              onScoreUpdate={handleScoreUpdate}
              paused={paused}
              soundEnabled={soundOn}
            />
          )}

          {paused && screen === 'game' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(18,18,18,0.85)', backdropFilter: 'blur(8px)' }}>
              <div className="text-center">
                <div className="text-4xl mb-2">⏸</div>
                <p className="text-lg font-bold text-white" style={{ fontFamily: '"PingFang SC",sans-serif' }}>游戏暂停</p>
                <button onClick={togglePause}
                  className="mt-4 px-8 py-2 rounded-full text-white font-bold active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #444, #222)' }}>
                  继续
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 py-2"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          {[
            { icon: paused ? <Play size={20} color="#fff" /> : <Pause size={20} color="#fff" />, action: togglePause,  title: paused ? '继续' : '暂停' },
            { icon: soundOn ? <Volume2 size={20} color="#fff" /> : <VolumeX size={20} color="#fff" />, action: toggleSound, title: soundOn ? '关闭音效' : '开启音效' },
            { icon: <RotateCcw size={20} color="#fff" />, action: handleRestart, title: '重新开始' },
            { icon: <List size={20} color="#fff" />, action: () => setScreen('leaderboard'), title: '排行榜' },
            { icon: <Home size={20} color="#fff" />, action: handleGoHome, title: '返回主界面' },
          ].map(({ icon, action, title }, i) => (
            <button key={i} onClick={action} title={title}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.1)', boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {screen === 'nickname' && <NicknameModal onRegistered={handleRegistered} />}
      {screen === 'gameover' && endedState && player && (
        <GameOver score={endedState.score} highestLevel={endedState.highestLevel}
          startTime={endedState.startTime} player={player}
          onRestart={handleRestart} onLeaderboard={() => setScreen('leaderboard')} />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard player={player} onClose={() => setScreen(endedState ? 'gameover' : 'game')} />
      )}
    </div>
  );
}