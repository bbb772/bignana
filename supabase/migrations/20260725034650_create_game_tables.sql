/*
# 合成大呐呐 - Game Database Schema

## Short Description
Creates the players and game_scores tables for the 合成大呐呐 game.

## Changes

### New Tables

1. `players`
   - `id` (uuid, primary key) - unique player identifier
   - `nickname` (text, unique, not null) - player's chosen display name
   - `created_at` (timestamp) - when the player registered

2. `game_scores`
   - `id` (uuid, primary key) - unique record identifier
   - `player_id` (uuid, not null) - reference to the players table
   - `nickname` (text, not null) - denormalized for fast leaderboard queries
   - `score` (integer, not null) - this game session's score
   - `highest_level` (integer, not null) - highest avatar level merged this session
   - `game_duration` (integer) - game duration in seconds
   - `created_at` (timestamp) - when the score was recorded

## Security
- RLS enabled on both tables
- Public read/write access (anon + authenticated) since this is a no-auth game
- Nickname uniqueness enforced at the database level

## Notes
- No auth system — this is a public leaderboard game
- Scores are immutable once inserted (no update/delete policies for scores)
- Players can be inserted once (unique nickname constraint)
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  highest_level integer NOT NULL DEFAULT 1,
  game_duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_scores" ON game_scores;
CREATE POLICY "anon_select_game_scores" ON game_scores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_game_scores" ON game_scores;
CREATE POLICY "anon_insert_game_scores" ON game_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_player_id ON game_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_nickname ON game_scores(nickname);
