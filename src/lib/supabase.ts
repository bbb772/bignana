import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Player {
  id: string;
  nickname: string;
  created_at: string;
}

export interface GameScore {
  id: string;
  player_id: string;
  nickname: string;
  score: number;
  highest_level: number;
  game_duration: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  highest_level: number;
}
