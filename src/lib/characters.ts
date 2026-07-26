// ─────────────────────────────────────────────
//  Character + image pool data
//  Extensible: add members to CHARACTERS array,
//  or add images to any member's `images` array.
// ─────────────────────────────────────────────
import { supabase } from './supabase';

export type Rarity = 'common' | 'rare' | 'legendary';
export type EyeStyle = 'round' | 'star' | 'heart' | 'cat' | 'squint';
export type MouthStyle = 'smile' | 'grin' | 'excited' | 'kiss' | 'smirk';
export type Accessory = 'none' | 'bow' | 'crown' | 'sunglasses' | 'flowers' | 'ribbon' | 'tiara';

export interface CharacterImage {
  id: string;
  label: string;
  rarity: Rarity;
  multiplier: number;
  eye: EyeStyle;
  mouth: MouthStyle;
  acc: Accessory;
  accColor: string;
  bgShift: [string, string] | null;
  imageUrl?: string;          // 真实照片地址，没有就画表情
}

export interface Character {
  id: string;        // stable key, e.g. "moya"
  name: string;      // display, e.g. "磨牙"
  weight: number;    // relative spawn weight (all 7 sum ~100)
  bg: [string, string];
  face: string;
  cheek: string;
  eyeColor: string;
  images: CharacterImage[];
}

// ── Compact image factories ──────────────────────────────────────────────
const img = (id: string, label: string, r: Rarity, mult: number, eye: EyeStyle, mouth: MouthStyle, acc: Accessory, accColor: string, bgShift: [string,string]|null = null): CharacterImage =>
  ({ id, label, rarity: r, multiplier: mult, eye, mouth, acc, accColor, bgShift });

// ── 7 Characters ─────────────────────────────────────────────────────────

export const CHARACTERS: Character[] = [
  // ── 磨牙 ─────────────────────────────────────────────────────────────
  {
    id: 'moya',         // ← 已改为纯英文
    name: '磨牙',
    weight: 15,
    bg: ['#FF7043', '#BF360C'],
    face: '#FFCCBC',
    cheek: '#FF5722',
    eyeColor: '#5D4037',
    images: [
      img('01','日常',  'common', 1,   'round',  'smile',   'none',       ''),
      img('02','开心',  'common', 1,   'squint', 'grin',    'ribbon',     '#FF5722'),
      img('03','兴奋',  'common', 1,   'round',  'excited', 'none',       ''),
      img('04','调皮',  'common', 1,   'cat',    'smirk',   'sunglasses', '#333'),
      img('05','撒娇',  'common', 1,   'heart',  'kiss',    'bow',        '#FF7043'),
      img('06','害羞',  'common', 1,   'squint', 'smile',   'flowers',    '#FF80AB'),
      img('07','发呆',  'common', 1,   'round',  'smile',   'none',       ''),
      img('08','闪耀',  'rare',   1.5, 'star',   'smile',   'crown',      '#FF8F00'),
      img('09','傲娇',  'rare',   1.5, 'cat',    'grin',    'tiara',      '#FF8F00', ['#FFAB40','#FF6D00']),
      img('10','表演',  'legendary', 3,'star',   'excited', 'ribbon',     '#FF5722', ['#FFD740','#FF3D00']),
    ],
  },

  // ── 悠悠 ─────────────────────────────────────────────────────────────
  {
    id: 'youyou',
    name: '悠悠',
    weight: 14,
    bg: ['#29B6F6', '#0277BD'],
    face: '#E1F5FE',
    cheek: '#81D4FA',
    eyeColor: '#01579B',
    images: [
      img('01','日常',  'common', 1,   'round',  'smile',   'none',       ''),
      img('02','优雅',  'common', 1,   'cat',    'smile',   'tiara',      '#29B6F6'),
      img('03','开心',  'common', 1,   'squint', 'grin',    'ribbon',     '#0288D1'),
      img('04','温柔',  'common', 1,   'round',  'kiss',    'flowers',    '#81D4FA'),
      img('05','自信',  'common', 1,   'cat',    'smirk',   'none',       ''),
      img('06','活泼',  'common', 1,   'squint', 'excited', 'bow',        '#29B6F6'),
      img('07','甜蜜',  'common', 1,   'heart',  'smile',   'bow',        '#F48FB1'),
      img('08','凉爽',  'rare',   1.5, 'cat',    'smirk',   'sunglasses', '#0288D1'),
      img('09','光芒',  'rare',   1.5, 'star',   'grin',    'crown',      '#FFD740', ['#4FC3F7','#01579B']),
      img('10','梦幻',  'legendary', 3,'heart',  'kiss',    'tiara',      '#29B6F6', ['#E1F5FE','#006064']),
    ],
  },

  // ── 哈鲁鲁 ───────────────────────────────────────────────────────────
  {
    id: 'halulu',
    name: '哈鲁鲁',
    weight: 14,
    bg: ['#FFD740', '#F57F17'],
    face: '#FFF9C4',
    cheek: '#FFE57F',
    eyeColor: '#BF360C',
    images: [
      img('01','日常',  'common', 1,   'round',  'smile',   'none',       ''),
      img('02','大笑',  'common', 1,   'squint', 'grin',    'none',       ''),
      img('03','超兴奋','common', 1,   'round',  'excited', 'ribbon',     '#FF8F00'),
      img('04','甜蜜',  'common', 1,   'heart',  'kiss',    'bow',        '#FFD740'),
      img('05','得意',  'common', 1,   'cat',    'smirk',   'crown',      '#FF8F00'),
      img('06','阳光',  'common', 1,   'star',   'smile',   'flowers',    '#FFD740'),
      img('07','萌萌',  'common', 1,   'squint', 'smile',   'ribbon',     '#FFAB40'),
      img('08','元气',  'rare',   1.5, 'star',   'grin',    'none',       ''),
      img('09','耀眼',  'rare',   1.5, 'cat',    'grin',    'tiara',      '#FF8F00', ['#FFE57F','#F9A825']),
      img('10','太阳',  'legendary', 3,'heart',  'excited', 'crown',      '#FF6D00', ['#FFF9C4','#FF6D00']),
    ],
  },

  // ── 啃啃 ─────────────────────────────────────────────────────────────
  {
    id: 'kenken',
    name: '啃啃',
    weight: 14,
    bg: ['#66BB6A', '#1B5E20'],
    face: '#C8E6C9',
    cheek: '#A5D6A7',
    eyeColor: '#2E7D32',
    images: [
      img('01','日常',  'common', 1,   'round',  'smile',   'none',       ''),
      img('02','开心',  'common', 1,   'squint', 'grin',    'bow',        '#66BB6A'),
      img('03','超可爱','common', 1,   'heart',  'kiss',    'ribbon',     '#4CAF50'),
      img('04','活泼',  'common', 1,   'round',  'excited', 'none',       ''),
      img('05','调皮',  'common', 1,   'cat',    'smirk',   'sunglasses', '#333'),
      img('06','萌萌',  'common', 1,   'heart',  'smile',   'flowers',    '#66BB6A'),
      img('07','自然',  'common', 1,   'squint', 'smile',   'flowers',    '#A5D6A7'),
      img('08','元气',  'rare',   1.5, 'star',   'grin',    'ribbon',     '#388E3C'),
      img('09','特别',  'rare',   1.5, 'cat',    'smirk',   'tiara',      '#388E3C', ['#DCEDC8','#33691E']),
      img('10','森林',  'legendary', 3,'star',   'excited', 'crown',      '#2E7D32', ['#69F0AE','#00C853']),
    ],
  },

  // ── 小森pro ──────────────────────────────────────────────────────────
  {
    id: 'xiaosen',
    name: '小森pro',
    weight: 14,
    bg: ['#00ACC1', '#004D40'],
    face: '#E0F7FA',
    cheek: '#80DEEA',
    eyeColor: '#006064',
    images: [
      img('01','日常',  'common', 1,   'round',  'smile',   'none',       ''),
      img('02','专业',  'common', 1,   'cat',    'smirk',   'sunglasses', '#00695C'),
      img('03','活力',  'common', 1,   'squint', 'grin',    'none',       ''),
      img('04','帅气',  'common', 1,   'cat',    'smirk',   'none',       ''),
      img('05','自信',  'common', 1,   'round',  'smile',   'tiara',      '#00ACC1'),
      img('06','开朗',  'common', 1,   'squint', 'excited', 'none',       ''),
      img('07','潮流',  'common', 1,   'cat',    'smirk',   'bow',        '#0097A7'),
      img('08','明星',  'rare',   1.5, 'star',   'smile',   'crown',      '#00BCD4'),
      img('09','超pro', 'rare',   1.5, 'star',   'grin',    'crown',      '#00897B', ['#80DEEA','#004D40']),
      img('10','大神',  'legendary', 3,'heart',  'kiss',    'tiara',      '#00ACC1', ['#E0F7FA','#006064']),
    ],
  },

  // ── 星太 ─────────────────────────────────────────────────────────────
  {
    id: 'xingtai',
    name: '星太',
    weight: 14,
    bg: ['#1E88E5', '#0D47A1'],
    face: '#E3F2FD',
    cheek: '#90CAF9',
    eyeColor: '#1565C0',
    images: [
      img('01','日常',  'common', 1,   'round',  'smile',   'none',       ''),
      img('02','深邃',  'common', 1,   'cat',    'smirk',   'none',       ''),
      img('03','闪亮',  'common', 1,   'star',   'excited', 'none',       ''),
      img('04','宇宙',  'common', 1,   'heart',  'kiss',    'crown',      '#1E88E5'),
      img('05','神秘',  'common', 1,   'cat',    'smirk',   'sunglasses', '#0D47A1'),
      img('06','壮观',  'common', 1,   'round',  'excited', 'none',       ''),
      img('07','梦幻',  'common', 1,   'heart',  'smile',   'flowers',    '#90CAF9'),
      img('08','耀眼',  'rare',   1.5, 'star',   'smile',   'crown',      '#FFD740'),
      img('09','光辉',  'rare',   1.5, 'star',   'grin',    'tiara',      '#29B6F6', ['#90CAF9','#0D47A1']),
      img('10','超星',  'legendary', 3,'star',   'excited', 'crown',      '#FFD740', ['#E3F2FD','#0D47A1']),
    ],
  },

  // ── yukiii ───────────────────────────────────────────────────────────
  {
    id: 'yukiii',
    name: 'yukiii',
    weight: 15,
    bg: ['#F06292', '#AD1457'],
    face: '#FCE4EC',
    cheek: '#F48FB1',
    eyeColor: '#880E4F',
    images: [
      img('01','日常',  'common', 1,   'round',  'smile',   'none',       ''),
      img('02','甜甜',  'common', 1,   'heart',  'kiss',    'bow',        '#F06292'),
      img('03','开心',  'common', 1,   'squint', 'grin',    'ribbon',     '#E91E63'),
      img('04','可爱',  'common', 1,   'heart',  'smile',   'bow',        '#FF80AB'),
      img('05','俏皮',  'common', 1,   'cat',    'smirk',   'sunglasses', '#AD1457'),
      img('06','甜心',  'common', 1,   'round',  'smile',   'flowers',    '#FF80AB'),
      img('07','活泼',  'common', 1,   'squint', 'excited', 'none',       ''),
      img('08','温柔',  'rare',   1.5, 'round',  'kiss',    'tiara',      '#E91E63'),
      img('09','发光',  'rare',   1.5, 'star',   'smile',   'crown',      '#FFD740', ['#FCE4EC','#C2185B']),
      img('10','闪耀',  'legendary', 3,'star',   'grin',    'crown',      '#FFD740', ['#F8BBD9','#AD1457']),
    ],
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export function getImage(charId: string, imageId: string): CharacterImage {
  // 1. 先查是不是自定义照片
  const customImgs = getCustomImagesFor(charId);
  const customMatch = customImgs.find(c => c.image_id === imageId);
  if (customMatch) {
    return {
      id: customMatch.image_id,
      label: '照片',
      rarity: customMatch.rarity,
      multiplier: customMatch.multiplier,
      eye: 'round',
      mouth: 'smile',
      acc: 'none',
      accColor: '',
      bgShift: null,
      imageUrl: customMatch.image_url,
    };
  }

  // 2. 没找到就退回默认表情
  const char = getCharacter(charId);
  return char.images.find((i) => i.id === imageId) ?? char.images[0];
}

// ─── Ball generation ──────────────────────────────────────────────────────

export interface BallConfig {
  member: string;  // character id
  image: string;   // image id
}

/** Pick a character weighted by `weight` field. */
function pickCharacter(): Character {
  const totalWeight = CHARACTERS.reduce((s, c) => s + c.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const c of CHARACTERS) {
    rand -= c.weight;
    if (rand <= 0) return c;
  }
  return CHARACTERS[0];
}

/** Pick an image from a character respecting rarity weights. */
function pickImage(char: Character): CharacterImage {
  const rand = Math.random();
  let pool: CharacterImage[];
  if (rand < 0.05)      pool = char.images.filter((i) => i.rarity === 'legendary');
  else if (rand < 0.20) pool = char.images.filter((i) => i.rarity === 'rare');
  else                  pool = char.images.filter((i) => i.rarity === 'common');
  if (!pool.length) pool = char.images;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate a ball config for a given level.
 * @param existingAtLevel  member+image combos already on the board at this level
 * @param matchProb        probability of intentionally matching an existing combo
 */
export function generateBall(
  existingAtLevel: BallConfig[],
  matchProb = 0.35
): BallConfig {
  if (existingAtLevel.length > 0 && Math.random() < matchProb) {
    const target = existingAtLevel[Math.floor(Math.random() * existingAtLevel.length)];
    return { member: target.member, image: target.image };
  }

  const char = pickCharacter();

  // 只使用自定义照片（如果该成员有的话）
  const customImgs = getCustomImagesFor(char.id);
  if (customImgs.length > 0) {
    // 按稀有度加权抽取自定义照片
    const rand = Math.random();
    let pool: typeof customImgs;
    if (rand < 0.05) {
      pool = customImgs.filter(i => i.rarity === 'legendary');
    } else if (rand < 0.20) {
      pool = customImgs.filter(i => i.rarity === 'rare');
    } else {
      pool = customImgs.filter(i => i.rarity === 'common');
    }
    if (pool.length === 0) pool = customImgs;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    return { member: char.id, image: chosen.image_id };
  }

  // 如果没有自定义照片，回退到默认表情（理论上不会触发）
  const im = pickImage(char);
  return { member: char.id, image: im.id };
}

// ── 自定义图片池（从 Supabase 加载）───────────────────────────────────────

let customImagePool: Map<string, { member_id: string; image_id: string; image_url: string; rarity: Rarity; multiplier: number }[]> | null = null;

/** 从 Supabase 的 avatar_images 表读取所有自定义照片 */
export async function fetchCustomImages(): Promise<void> {
  const { data, error } = await supabase
    .from('avatar_images')
    .select('*');

  if (error) {
    console.error('加载自定义图片失败:', error);
    return;
  }

  const map = new Map();
  (data as any[]).forEach((row) => {
    if (!map.has(row.member_id)) map.set(row.member_id, []);
    map.get(row.member_id).push({
      member_id: row.member_id,
      image_id: row.image_id,
      image_url: row.image_url,
      rarity: row.rarity,
      multiplier: row.multiplier,
    });
  });
  customImagePool = map;
  console.log(`成功加载 ${data.length} 张自定义照片`);
}

/** 获取某个成员的自定义照片列表 */
export function getCustomImagesFor(member: string) {
  return customImagePool?.get(member) ?? [];
}

// ─── Rarity display constants ────────────────────────────────────────────

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  legendary: '限定',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#78909C',
  rare: '#C0A020',
  legendary: '#FF6D00',
};