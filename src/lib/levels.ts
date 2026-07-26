// Level configs — determines ball SIZE and BASE SCORE only.
// Character / image identity lives in characters.ts.

export interface LevelConfig {
  level: number;
  radius: number;
  baseScore: number;
  label: string; // achievement label shown when this level is first reached
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, radius: 20,  baseScore: 1,   label: '呐'     },
  { level: 2, radius: 28,  baseScore: 3,   label: '呐呐'   },
  { level: 3, radius: 38,  baseScore: 6,   label: '呐呐呐' },
  { level: 4, radius: 50,  baseScore: 10,  label: '小呐'   },
  { level: 5, radius: 63,  baseScore: 21,  label: '中呐'   },
  { level: 6, radius: 78,  baseScore: 36,  label: '大呐'   },
  { level: 7, radius: 94,  baseScore: 55,  label: '超呐'   },
  { level: 8, radius: 112, baseScore: 100, label: '大呐呐' },
];

export const MAX_LEVEL = LEVEL_CONFIGS.length;

export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[Math.max(1, Math.min(level, MAX_LEVEL)) - 1];
}
