export type Team = 'Hider' | 'Seeker';

export type PlayerState = 'hiding' | 'seeking' | 'eliminated';

export interface Player {
  id: string;
  name: string;
  team: Team;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string; // Current color displayed
  baseColor: string; // Original base color (white for hiders)
  targetColor: string; // Selected camo color
  isCamo: boolean;
  camoProgress: number; // 0 to 1
  health: number;
  isAI: boolean;
  floor: number; // 1, 2, or 3
  state: PlayerState;
  skinPattern: string; // 'none' | 'camo' | 'neon' | 'gold' | 'rainbow' | 'red_tiger' | 'galaxy'
  direction: 1 | -1; // 1 = right, -1 = left
  
  // Seeker specific properties
  gunAngle: number;
  isReloading: boolean;
  reloadTimer: number;
  ammo: number;
  
  // AI navigation properties
  path: { x: number; y: number }[];
  currentPathIndex: number;
  aiWaitTimer: number;
  aiTargetFurnitureId: string | null;
  aiScanTimer: number;

  // Advanced Seeker AI properties
  seekerState?: 'patrol' | 'investigate' | 'pursue';
  pursuitTargetId?: string | null;
  pursuitTimer?: number;
  investigateTargetX?: number | null;
  targetFloor?: number | null;
}

export type FurnitureType =
  | 'sofa'
  | 'fridge'
  | 'bed'
  | 'table'
  | 'box'
  | 'plant'
  | 'cabinet'
  | 'tv'
  | 'wardrobe';

export interface Furniture {
  id: string;
  type: FurnitureType;
  x: number; // relative to floor width
  y: number; // bottom-aligned to floor height
  w: number;
  h: number;
  color: string;
  name: string;
  floor: number;
  house?: number; // 1 or 2
}

export interface GameMap {
  id: string;
  name: string;
  theme: 'erangel' | 'miramar' | 'sanhok';
  backgroundColor: string;
  wallColor: string;
  floorColor: string;
  skyColor: string;
  furniture: Furniture[];
}

export interface Skin {
  id: string;
  name: string;
  price: number;
  currency: 'P' | 'G';
  pattern: string;
  color: string;
  rarity: 'common' | 'rare' | 'legendary';
  previewColor: string;
}

export interface Bullet {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  floor: number;
  life: number; // transparency or frame ticks
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  floor: number;
}
