import { supabase, Player } from './supabase';

const PLAYER_KEY = 'nana_player';

// 简单的 SHA-256 哈希（用于密码验证）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getStoredPlayer(): Promise<Player | null> {
  const raw = localStorage.getItem(PLAYER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Player;
  } catch {
    return null;
  }
}

export function clearStoredPlayer() {
  localStorage.removeItem(PLAYER_KEY);
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const { data } = await supabase
    .from('players')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();
  return data === null;
}

/** 注册新玩家 */
export async function registerPlayer(nickname: string, password: string): Promise<Player | null> {
  const hash = await hashPassword(password);
  const { data, error } = await supabase
    .from('players')
    .insert({ nickname, password_hash: hash })
    .select()
    .single();
  if (error || !data) return null;
  const player = data as Player;
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  return player;
}

/** 登录已有玩家 */
export async function loginPlayer(nickname: string, password: string): Promise<Player | null> {
  const hash = await hashPassword(password);
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('nickname', nickname)
    .eq('password_hash', hash)
    .maybeSingle();
  if (!data) return null;
  const player = data as Player;
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  return player;
}

export async function submitScore(
  player: Player,
  score: number,
  highestLevel: number,
  gameDuration: number
): Promise<void> {
  await supabase.from('game_scores').insert({
    player_id: player.id,
    nickname: player.nickname,
    score,
    highest_level: highestLevel,
    game_duration: gameDuration,
  });
}

export interface LeaderboardRow {
  rank: number;
  nickname: string;
  score: number;
  highest_level: number;
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('game_scores')
    .select('nickname, score, highest_level')
    .order('score', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const seen = new Map<string, { score: number; highest_level: number }>();
  for (const row of data) {
    const existing = seen.get(row.nickname);
    if (!existing || row.score > existing.score) {
      seen.set(row.nickname, { score: row.score, highest_level: row.highest_level });
    }
  }

  return Array.from(seen.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([nickname, v], i) => ({
      rank: i + 1,
      nickname,
      score: v.score,
      highest_level: v.highest_level,
    }));
}

export async function getPlayerRank(nickname: string): Promise<number | null> {
  const board = await fetchLeaderboard(1000);
  const entry = board.find((r) => r.nickname === nickname);
  return entry ? entry.rank : null;
}