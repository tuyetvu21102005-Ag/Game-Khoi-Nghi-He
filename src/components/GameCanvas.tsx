import React, { useRef, useEffect, useState } from 'react';
import type { Player, Furniture, Bullet, Particle, GameMap, Team } from '../types/game';
import { useSound } from '../hooks/useSound';
import { MAPS } from './MainMenu';
import { ALL_SKINS } from './Shop';

interface GameCanvasProps {
  playerTeam: Team;
  selectedMapId: string;
  activeSkinId: string;
  isHidePhase: boolean;
  gameActive: boolean;
  remainingTime: number; // in seconds
  onEliminatePlayer: (id: string, name: string, isPlayer: boolean) => void;
  onHiderVictory: () => void;
  onSeekerVictory: () => void;
  onScoreEarned: (points: number) => void;
}

// Map constants
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const HOUSE_LEFT = 100;
const HOUSE_RIGHT = 800;
const HOUSE_WIDTH = HOUSE_RIGHT - HOUSE_LEFT;

const FLOOR_HEIGHTs = [540, 380, 220]; // Y coordinate of Floor 1, Floor 2, Floor 3
const FLOOR_CEILINGS = [380, 220, 60];  // Top Y coordinate of Floor 1, Floor 2, Floor 3

// Stairs X-coordinates
const STAIRS = [
  { fromFloor: 1, toFloor: 2, x: 200, w: 40 },
  { fromFloor: 2, toFloor: 3, x: 700, w: 40 },
];

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerTeam,
  selectedMapId,
  activeSkinId,
  isHidePhase,
  gameActive,
  remainingTime,
  onEliminatePlayer,
  onHiderVictory,
  onSeekerVictory,
  onScoreEarned,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playGunshot, playHit, playClick } = useSound();
  
  // Game entities state refs (to avoid closure issues in the game loop)
  const playersRef = useRef<Player[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef({ x: 0, y: 0 });
  const activeSkinData = ALL_SKINS.find(s => s.id === activeSkinId) || ALL_SKINS[0];

  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [seekerAmmo, setSeekerAmmo] = useState<number>(30);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [seekerScore, setSeekerScore] = useState<number>(0);

  // Initialize map furniture
  const getMapData = (mapId: string): GameMap => {
    const mapMeta = MAPS.find(m => m.id === mapId) || MAPS[0];
    
    // Generate furniture objects based on theme
    const furniture: Furniture[] = [];

    if (mapMeta.theme === 'erangel') {
      // Floor 1 (Living Room & Kitchen)
      furniture.push({ id: 'e_sofa', type: 'sofa', x: 150, y: 540, w: 80, h: 35, color: '#5C4033', name: 'Sofa Da', floor: 1 });
      furniture.push({ id: 'e_tv', type: 'tv', x: 280, y: 540, w: 60, h: 45, color: '#1a1a1a', name: 'Tivi', floor: 1 });
      furniture.push({ id: 'e_table', type: 'table', x: 450, y: 540, w: 70, h: 30, color: '#8B5A2B', name: 'Bàn Ăn', floor: 1 });
      furniture.push({ id: 'e_fridge', type: 'fridge', x: 620, y: 540, w: 40, h: 70, color: '#C0C0C0', name: 'Tủ Lạnh', floor: 1 });
      furniture.push({ id: 'e_plant1', type: 'plant', x: 740, y: 540, w: 25, h: 40, color: '#228B22', name: 'Chậu Cây', floor: 1 });

      // Floor 2 (Bedroom & Bathroom)
      furniture.push({ id: 'e_bed', type: 'bed', x: 120, y: 380, w: 80, h: 40, color: '#4682B4', name: 'Giường Ngủ', floor: 2 });
      furniture.push({ id: 'e_wardrobe', type: 'wardrobe', x: 300, y: 380, w: 50, h: 80, color: '#5C4033', name: 'Tủ Quần Áo', floor: 2 });
      furniture.push({ id: 'e_cabinet', type: 'cabinet', x: 480, y: 380, w: 45, h: 50, color: '#CD853F', name: 'Kệ Sách', floor: 2 });
      furniture.push({ id: 'e_plant2', type: 'plant', x: 600, y: 380, w: 25, h: 40, color: '#228B22', name: 'Chậu Cây', floor: 2 });
      
      // Floor 3 (Attic & Library)
      furniture.push({ id: 'e_bookshelf1', type: 'cabinet', x: 250, y: 220, w: 60, h: 80, color: '#3d2514', name: 'Giá Sách Lớn', floor: 3 });
      furniture.push({ id: 'e_desk', type: 'table', x: 400, y: 220, w: 65, h: 35, color: '#8B4513', name: 'Bàn Làm Việc', floor: 3 });
      furniture.push({ id: 'e_bookshelf2', type: 'cabinet', x: 550, y: 220, w: 60, h: 80, color: '#3d2514', name: 'Giá Sách Phụ', floor: 3 });
      furniture.push({ id: 'e_box', type: 'box', x: 150, y: 220, w: 30, h: 30, color: '#CD853F', name: 'Hòm Gỗ', floor: 3 });
    } else if (mapMeta.theme === 'miramar') {
      // Floor 1
      furniture.push({ id: 'm_crate1', type: 'box', x: 160, y: 540, w: 35, h: 35, color: '#8E8E8E', name: 'Hòm Sắt', floor: 1 });
      furniture.push({ id: 'm_crate2', type: 'box', x: 195, y: 540, w: 35, h: 35, color: '#708090', name: 'Hòm Sắt', floor: 1 });
      furniture.push({ id: 'm_barrel1', type: 'box', x: 340, y: 540, w: 25, h: 40, color: '#D2691E', name: 'Thùng Phi Cam', floor: 1 });
      furniture.push({ id: 'm_barrel2', type: 'box', x: 365, y: 540, w: 25, h: 40, color: '#A0522D', name: 'Thùng Phi Rỉ', floor: 1 });
      furniture.push({ id: 'm_generator', type: 'fridge', x: 550, y: 540, w: 50, h: 60, color: '#555555', name: 'Máy Phát Điện', floor: 1 });
      furniture.push({ id: 'm_table', type: 'table', x: 680, y: 540, w: 60, h: 30, color: '#7f8c8d', name: 'Bàn Sắt', floor: 1 });

      // Floor 2
      furniture.push({ id: 'm_shelves', type: 'cabinet', x: 140, y: 380, w: 55, h: 75, color: '#7f8c8d', name: 'Kệ Vật Tư', floor: 2 });
      furniture.push({ id: 'm_boxstack1', type: 'box', x: 300, y: 380, w: 40, h: 40, color: '#CD853F', name: 'Thùng Gỗ', floor: 2 });
      furniture.push({ id: 'm_boxstack2', type: 'box', x: 335, y: 380, w: 30, h: 30, color: '#B8860B', name: 'Thùng Gỗ Nhỏ', floor: 2 });
      furniture.push({ id: 'm_control', type: 'tv', x: 480, y: 380, w: 70, h: 45, color: '#2c3e50', name: 'Bàn Điều Khiển', floor: 2 });
      furniture.push({ id: 'm_barrel3', type: 'box', x: 620, y: 380, w: 25, h: 40, color: '#34495e', name: 'Thùng Phi Xanh', floor: 2 });

      // Floor 3
      furniture.push({ id: 'm_crate3', type: 'box', x: 220, y: 220, w: 40, h: 40, color: '#7f8c8d', name: 'Hòm Thiết Bị', floor: 3 });
      furniture.push({ id: 'm_locker', type: 'wardrobe', x: 380, y: 220, w: 45, h: 80, color: '#34495e', name: 'Tủ Locker', floor: 3 });
      furniture.push({ id: 'm_pipes', type: 'table', x: 500, y: 220, w: 80, h: 30, color: '#d35400', name: 'Đống Ống Đồng', floor: 3 });
      furniture.push({ id: 'm_box4', type: 'box', x: 650, y: 220, w: 35, h: 35, color: '#95a5a6', name: 'Hòm Nhôm', floor: 3 });
    } else {
      // Sanhok (Ancient ruins theme)
      // Floor 1
      furniture.push({ id: 's_altar', type: 'sofa', x: 150, y: 540, w: 90, h: 40, color: '#2d3e2f', name: 'Bệ Thờ Đá Mossy', floor: 1 });
      furniture.push({ id: 's_chest1', type: 'box', x: 320, y: 540, w: 35, h: 30, color: '#8B5A2B', name: 'Rương Cổ Gỗ', floor: 1 });
      furniture.push({ id: 's_pillar1', type: 'wardrobe', x: 460, y: 540, w: 30, h: 90, color: '#555855', name: 'Trụ Đá Đổ Nát', floor: 1 });
      furniture.push({ id: 's_bush1', type: 'plant', x: 600, y: 540, w: 45, h: 50, color: '#1e5e2f', name: 'Bụi Cây Nhiệt Đới', floor: 1 });
      furniture.push({ id: 's_urn', type: 'plant', x: 720, y: 540, w: 25, h: 40, color: '#7f8c8d', name: 'Bình Gốm Cổ', floor: 1 });

      // Floor 2
      furniture.push({ id: 's_sarcophagus', type: 'bed', x: 130, y: 380, w: 80, h: 35, color: '#7f8c8d', name: 'Quan Tài Đá', floor: 2 });
      furniture.push({ id: 's_bush2', type: 'plant', x: 280, y: 380, w: 45, h: 50, color: '#1e5e2f', name: 'Bụi Cây', floor: 2 });
      furniture.push({ id: 's_chest2', type: 'box', x: 420, y: 380, w: 40, h: 35, color: '#d4af37', name: 'Rương Vàng Cổ', floor: 2 });
      furniture.push({ id: 's_pillar2', type: 'wardrobe', x: 560, y: 380, w: 30, h: 90, color: '#555855', name: 'Trụ Đá', floor: 2 });
      furniture.push({ id: 's_bush3', type: 'plant', x: 670, y: 380, w: 40, h: 45, color: '#1e5e2f', name: 'Cây Dương Xỉ', floor: 2 });

      // Floor 3
      furniture.push({ id: 's_torch', type: 'plant', x: 180, y: 220, w: 20, h: 60, color: '#b22222', name: 'Đuốc Đá', floor: 3 });
      furniture.push({ id: 's_boulder', type: 'sofa', x: 300, y: 220, w: 70, h: 45, color: '#3d4f3d', name: 'Tảng Đá Rêu', floor: 3 });
      furniture.push({ id: 's_chest3', type: 'box', x: 470, y: 220, w: 35, h: 30, color: '#8b5a2b', name: 'Rương Gỗ', floor: 3 });
      furniture.push({ id: 's_statue', type: 'wardrobe', x: 600, y: 220, w: 35, h: 80, color: '#7f8c8d', name: 'Tượng Thần Đá', floor: 3 });
    }

    return {
      id: mapMeta.id,
      name: mapMeta.name,
      theme: mapMeta.theme,
      backgroundColor: mapMeta.theme === 'erangel' ? '#2f3542' : mapMeta.theme === 'miramar' ? '#eccc68' : '#2ed573',
      wallColor: mapMeta.theme === 'erangel' ? '#747d8c' : mapMeta.theme === 'miramar' ? '#d1ccc0' : '#718093',
      floorColor: mapMeta.theme === 'erangel' ? '#57606f' : mapMeta.theme === 'miramar' ? '#ffa502' : '#2f3542',
      skyColor: mapMeta.theme === 'erangel' ? '#1e272e' : mapMeta.theme === 'miramar' ? '#ff7f50' : '#05c46b',
      furniture,
    };
  };

  const activeMap = getMapData(selectedMapId);

  // Initialize Players
  const initializePlayers = () => {
    const players: Player[] = [];
    
    // Spawn Player
    const playerIsHider = playerTeam === 'Hider';
    const initialPlayer: Player = {
      id: 'player_user',
      name: playerIsHider ? 'Bạn (Hider)' : 'Bạn (Seeker)',
      team: playerTeam,
      x: playerIsHider ? HOUSE_LEFT + 100 + Math.random() * 200 : 30,
      y: FLOOR_HEIGHTs[0] - 32, // Floor 1
      vx: 0,
      vy: 0,
      width: 18,
      height: 32,
      color: playerIsHider ? '#ffffff' : activeSkinData.color,
      baseColor: playerIsHider ? '#ffffff' : activeSkinData.color,
      targetColor: '#ffffff',
      isCamo: false,
      camoProgress: 0,
      health: 100,
      isAI: false,
      floor: 1,
      state: playerIsHider ? 'hiding' : 'seeking',
      skinPattern: playerIsHider ? 'none' : activeSkinData.pattern,
      direction: 1,
      gunAngle: 0,
      isReloading: false,
      reloadTimer: 0,
      ammo: 30,
      path: [],
      currentPathIndex: 0,
      aiWaitTimer: 0,
      aiTargetFurnitureId: null,
      aiScanTimer: 0,
    };
    
    players.push(initialPlayer);

    // Spawn 20 Hiders total (either user + 19 AI, or 20 AI)
    const totalHidersCount = 20;
    const aiHidersToSpawn = playerIsHider ? totalHidersCount - 1 : totalHidersCount;
    for (let i = 0; i < aiHidersToSpawn; i++) {
      const startFloor = Math.floor(Math.random() * 3) + 1; // Floor 1, 2, or 3
      players.push({
        id: `hider_ai_${i}`,
        name: `Hider AI #${i + 1}`,
        team: 'Hider',
        x: HOUSE_LEFT + 50 + Math.random() * (HOUSE_WIDTH - 100),
        y: FLOOR_HEIGHTs[startFloor - 1] - 30,
        vx: 0,
        vy: 0,
        width: 16,
        height: 30,
        color: '#ffffff',
        baseColor: '#ffffff',
        targetColor: '#ffffff',
        isCamo: false,
        camoProgress: 0,
        health: 100,
        isAI: true,
        floor: startFloor,
        state: 'hiding',
        skinPattern: 'none',
        direction: Math.random() > 0.5 ? 1 : -1,
        gunAngle: 0,
        isReloading: false,
        reloadTimer: 0,
        ammo: 0,
        path: [],
        currentPathIndex: 0,
        aiWaitTimer: Math.random() * 3, // Stagger initial movement
        aiTargetFurnitureId: null,
        aiScanTimer: 0,
      });
    }

    // Spawn 5 Seekers total (either user + 4 AI, or 5 AI)
    const totalSeekersCount = 5;
    const aiSeekersToSpawn = playerIsHider ? totalSeekersCount : totalSeekersCount - 1;
    for (let i = 0; i < aiSeekersToSpawn; i++) {
      players.push({
        id: `seeker_ai_${i}`,
        name: `Seeker AI #${i + 1}`,
        team: 'Seeker',
        x: 20 + Math.random() * 30, // Spawn outside left
        y: FLOOR_HEIGHTs[0] - 32, // Spawn on ground
        vx: 0,
        vy: 0,
        width: 18,
        height: 32,
        color: '#ff3f34',
        baseColor: '#ff3f34',
        targetColor: '#ff3f34',
        isCamo: false,
        camoProgress: 0,
        health: 100,
        isAI: true,
        floor: 1,
        state: 'seeking',
        skinPattern: 'camo',
        direction: 1,
        gunAngle: 0,
        isReloading: false,
        reloadTimer: 0,
        ammo: 99999, // Infinite ammo
        path: [],
        currentPathIndex: 0,
        aiWaitTimer: 20, // Wait for 20s hiding phase
        aiTargetFurnitureId: null,
        aiScanTimer: 0,
      });
    }

    playersRef.current = players;
  };

  // Setup keyboard & mouse event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      
      // Store both e.key and e.code to bypass Telex/Unikey and handle layout issues
      keysPressed.current[key] = true;
      if (e.code) {
        keysPressed.current[e.code.toLowerCase()] = true;
      }

      // Spacebar for Hider Camouflage (Space, Spacebar, keycode 32)
      if ((e.key === ' ' || e.code === 'Space' || e.keyCode === 32) && playerTeam === 'Hider' && gameActive) {
        e.preventDefault();
        triggerPlayerCamouflage();
      }

      // R key for Seeker Reloading (R, KeyR, keycode 82)
      if ((key === 'r' || e.code === 'KeyR' || e.keyCode === 82) && playerTeam === 'Seeker' && gameActive) {
        triggerPlayerReload();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      
      keysPressed.current[key] = false;
      if (e.code) {
        keysPressed.current[e.code.toLowerCase()] = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Translate to canvas coords
      mousePos.current = {
        x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
        y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
      };
    };

    const handleMouseDown = () => {
      if (playerTeam === 'Seeker' && gameActive && !isHidePhase) {
        triggerPlayerShoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [playerTeam, gameActive, isHidePhase, seekerAmmo, isReloading]);

  // Handle initialization on mount or parameters change
  useEffect(() => {
    initializePlayers();
    bulletsRef.current = [];
    particlesRef.current = [];
    setSeekerScore(0);
    setSeekerAmmo(30);
    setIsReloading(false);
  }, [selectedMapId, playerTeam, gameActive]);

  // Trigger Camouflage for Player
  const triggerPlayerCamouflage = () => {
    const players = playersRef.current;
    const user = players.find(p => p.id === 'player_user');
    if (!user || user.state === 'eliminated') return;

    // Determine target color based on proximity to furniture
    let closestFurniture: Furniture | null = null;
    let minDistance = 60; // Max radius to color sample

    activeMap.furniture.forEach(item => {
      if (item.floor !== user.floor) return;
      const furnitureX = HOUSE_LEFT + item.x;
      const furnitureY = item.y;
      
      const dx = Math.abs((user.x + user.width / 2) - (furnitureX + item.w / 2));
      const dy = Math.abs((user.y + user.height / 2) - (furnitureY - item.h / 2));

      if (dx < (item.w / 2 + 30) && dy < (item.h / 2 + 30)) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          closestFurniture = item;
        }
      }
    });

    let color = activeMap.backgroundColor; // fallback to room wallpaper color
    if (closestFurniture) {
      color = (closestFurniture as Furniture).color;
    }

    setSelectedColor(color);
    user.targetColor = color;
    user.isCamo = true;
    user.camoProgress = 0; // Starts blending
    
    // Play sound and generate tiny dust particles
    playClick();
    createParticles(user.x + user.width/2, user.y + user.height/2, color, 12, user.floor);
  };

  // Trigger Shoot for Seeker Player
  const triggerPlayerShoot = () => {
    if (isReloading || seekerAmmo <= 0) return;

    const players = playersRef.current;
    const user = players.find(p => p.id === 'player_user');
    if (!user || user.state === 'eliminated') return;

    // Decrement Ammo
    const newAmmo = user.ammo - 1;
    user.ammo = newAmmo;
    setSeekerAmmo(newAmmo);

    // Calculate angle to mouse
    const startX = user.x + (user.direction === 1 ? user.width : 0);
    const startY = user.y + 12;
    const dx = mousePos.current.x - startX;
    const dy = mousePos.current.y - startY;
    const angle = Math.atan2(dy, dx);

    playGunshot();

    // Spawn Bullet
    const bulletSpeed = 22;
    bulletsRef.current.push({
      id: Math.random().toString(),
      startX,
      startY,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * bulletSpeed,
      vy: Math.sin(angle) * bulletSpeed,
      floor: user.floor,
      life: 40,
    });

    // Handle screen shake
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.classList.add('shake');
      setTimeout(() => canvas.classList.remove('shake'), 100);
    }

    // Trigger reload if empty
    if (newAmmo === 0) {
      triggerPlayerReload();
    }
  };

  // Seeker reloading logic
  const triggerPlayerReload = () => {
    const players = playersRef.current;
    const user = players.find(p => p.id === 'player_user');
    if (!user || isReloading || user.ammo === 30) return;

    setIsReloading(true);
    user.isReloading = true;
    user.reloadTimer = 90; // 90 frames = 1.5s at 60fps
    
    setTimeout(() => {
      const u = playersRef.current.find(p => p.id === 'player_user');
      if (u) {
        u.ammo = 30;
        u.isReloading = false;
        setSeekerAmmo(30);
      }
      setIsReloading(false);
    }, 1500);
  };

  // Particles generator
  const createParticles = (x: number, y: number, color: string, count: number, floor: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() * 2 - 1) * 3,
        vy: (Math.random() * 2 - 1) * 3,
        color,
        size: Math.random() * 3 + 1,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        floor,
      });
    }
  };

  // Game Physics & Loop
  useEffect(() => {
    if (!gameActive) return;

    let animFrameId: number;

    const gameLoop = () => {
      updateGamePhysics();
      renderFrame();
      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [gameActive, isHidePhase, selectedMapId]);

  // Update Game Entities Physics
  const updateGamePhysics = () => {
    const players = playersRef.current;
    const user = players.find(p => p.id === 'player_user');



    // 1. Update Player Movement
    players.forEach(p => {
      if (p.state === 'eliminated') return;

      if (!p.isAI) {
        // Human Player Movement Logic
        let speed = 3.5;
        p.vx = 0;

        // Move Left / Right (Checks KeyA/KeyD to support Unikey/Telex input methods)
        const goLeft = keysPressed.current['a'] || 
                       keysPressed.current['arrowleft'] || 
                       keysPressed.current['keya'] || 
                       keysPressed.current['left'];
                       
        const goRight = keysPressed.current['d'] || 
                        keysPressed.current['arrowright'] || 
                        keysPressed.current['keyd'] || 
                        keysPressed.current['right'];

        if (goLeft) {
          p.vx = -speed;
          p.direction = -1;
          p.isCamo = false; // Break camo on move
        }
        if (goRight) {
          p.vx = speed;
          p.direction = 1;
          p.isCamo = false; // Break camo on move
        }

        // Climbing Stairs Logic
        let onStair = false;
        let targetStair = STAIRS[0];

        STAIRS.forEach(stair => {
          // Check horizontal proximity to stair center
          if (p.x + p.width/2 >= stair.x - 15 && p.x + p.width/2 <= stair.x + 15) {
            // Check if player is on either the fromFloor or toFloor
            if (p.floor === stair.fromFloor || p.floor === stair.toFloor) {
              onStair = true;
              targetStair = stair;
            }
          }
        });

        const goUp = keysPressed.current['w'] || 
                     keysPressed.current['arrowup'] || 
                     keysPressed.current['keyw'] || 
                     keysPressed.current['up'];
                     
        const goDown = keysPressed.current['s'] || 
                       keysPressed.current['arrowdown'] || 
                       keysPressed.current['keys'] || 
                       keysPressed.current['down'];

        if (onStair) {
          if (goUp) {
            if (p.floor === targetStair.fromFloor) {
              // Climb up
              p.vy = -3;
              p.isCamo = false;
            }
          } else if (goDown) {
            if (p.floor === targetStair.toFloor) {
              // Climb down
              p.vy = 3;
              p.isCamo = false;
            }
          } else {
            p.vy = 0;
          }
        } else {
          p.vy = 0;
        }

        // Apply velocities
        p.x += p.vx;
        p.y += p.vy;

        // Boundary checks inside house structure
        // If Seeker, can wander outside left/right. If Hider, must stay in house or balconies
        const leftLimit = p.team === 'Seeker' ? 20 : HOUSE_LEFT;
        const rightLimit = p.team === 'Seeker' ? CANVAS_WIDTH - 20 : HOUSE_RIGHT + 50; // allow balcony on right

        if (p.x < leftLimit) p.x = leftLimit;
        if (p.x + p.width > rightLimit) p.x = rightLimit - p.width;

        // Clamp vertically to floor lines if not climbing
        const currentFloorIndex = p.floor - 1;
        const floorY = FLOOR_HEIGHTs[currentFloorIndex];

        if (p.vy > 0) {
          // Climbing down
          if (p.y + p.height >= FLOOR_HEIGHTs[p.floor - 2]) {
            p.y = FLOOR_HEIGHTs[p.floor - 2] - p.height;
            p.floor = p.floor - 1;
            p.vy = 0;
          }
        } else if (p.vy < 0) {
          // Climbing up
          if (p.y <= FLOOR_HEIGHTs[p.floor]) {
            p.y = FLOOR_HEIGHTs[p.floor] - p.height;
            p.floor = p.floor + 1;
            p.vy = 0;
          }
        } else {
          // Standing on floor
          p.y = floorY - p.height;
        }

        // Camouflage blending animation
        if (p.isCamo && p.camoProgress < 1) {
          p.camoProgress += 0.03;
          if (p.camoProgress > 1) p.camoProgress = 1;
          
          // Interpolate current color with target camo color
          p.color = lerpColor('#ffffff', p.targetColor, p.camoProgress);
        } else if (!p.isCamo) {
          p.color = p.baseColor;
          p.camoProgress = 0;
        }

        // Update aim angle if seeker
        if (p.team === 'Seeker') {
          const startX = p.x + (p.direction === 1 ? p.width : 0);
          const startY = p.y + 12;
          p.gunAngle = Math.atan2(mousePos.current.y - startY, mousePos.current.x - startX);
        }

      } else {
        // ==========================================
        // AI BOT MOVEMENT & LOGIC
        // ==========================================
        
        // AI Hider Logic
        if (p.team === 'Hider') {
          if (isHidePhase) {
            // Hider AI runs to find furniture to hide
            p.vx = 0;
            p.vy = 0;
            p.isCamo = false;
            p.color = p.baseColor;

            if (p.aiWaitTimer > 0) {
              p.aiWaitTimer -= 0.016; // tick down
            } else {
              // Choose a furniture if none is targetted
              if (!p.aiTargetFurnitureId) {
                const availableFurniture = activeMap.furniture.filter(f => f.floor === p.floor);
                if (availableFurniture.length > 0) {
                  const target = availableFurniture[Math.floor(Math.random() * availableFurniture.length)];
                  p.aiTargetFurnitureId = target.id;
                } else {
                  // Switch floor randomly
                  const newFloor = p.floor === 1 ? 2 : p.floor === 3 ? 2 : Math.random() > 0.5 ? 1 : 3;
                  // Cheat teleport/path for AI floor transition during hide phase
                  p.floor = newFloor;
                  p.y = FLOOR_HEIGHTs[newFloor - 1] - p.height;
                  p.x = HOUSE_LEFT + 50 + Math.random() * (HOUSE_WIDTH - 100);
                }
              }

              if (p.aiTargetFurnitureId) {
                const targetFurn = activeMap.furniture.find(f => f.id === p.aiTargetFurnitureId);
                if (targetFurn) {
                  const targetX = HOUSE_LEFT + targetFurn.x + targetFurn.w / 2 - p.width / 2;
                  const dx = targetX - p.x;

                  if (Math.abs(dx) > 5) {
                    p.vx = Math.sign(dx) * 2.5;
                    p.direction = p.vx > 0 ? 1 : -1;
                    p.x += p.vx;
                  } else {
                    // Reached target furniture! Camouflage
                    p.isCamo = true;
                    p.targetColor = targetFurn.color;
                    p.camoProgress = 1;
                    p.color = targetFurn.color;
                  }
                }
              }
            }
          } else {
            // Main round action phase: AI Hiders stay camouflaged.
            // If they are not camouflaged (spotted earlier), they try to flee to another floor!
            if (!p.isCamo) {
              p.vx = p.direction * 1.5;
              p.x += p.vx;

              // Bounce off walls
              if (p.x < HOUSE_LEFT) {
                p.x = HOUSE_LEFT;
                p.direction = 1;
              }
              if (p.x + p.width > HOUSE_RIGHT) {
                p.x = HOUSE_RIGHT - p.width;
                p.direction = -1;
              }

              // Randomly try to blend in again
              if (Math.random() < 0.01) {
                const nearFurn = activeMap.furniture.find(f => f.floor === p.floor && Math.abs(f.x + HOUSE_LEFT - p.x) < 80);
                if (nearFurn) {
                  p.isCamo = true;
                  p.targetColor = nearFurn.color;
                  p.color = nearFurn.color;
                  p.camoProgress = 1;
                }
              }
            }
          }
        }

        // AI Seeker Logic
        if (p.team === 'Seeker') {
          if (isHidePhase) {
            // Seekers wait outside during hiding phase
            p.x = 20 + Math.random() * 20;
            p.y = FLOOR_HEIGHTs[0] - p.height;
            p.floor = 1;
            p.isCamo = false;
          } else {
            // Action phase: Patrolling the building
            p.vx = 0;
            p.vy = 0;
            
            if (p.aiWaitTimer > 0) {
              // AI Wait/Scan State
              p.aiWaitTimer -= 0.016;
              
              // Aim gun while waiting
              p.gunAngle = p.direction === 1 ? 0 : Math.PI;

              // Periodic Hider scans
              p.aiScanTimer += 1;
              if (p.aiScanTimer >= 30) { // scan twice a second
                p.aiScanTimer = 0;
                scanForHiders(p);
              }
            } else {
              // Decide next destination
              // Stochastically decide to switch floor or move horizontally
              if (Math.random() < 0.005) {
                // Decision to climb stairs if near one
                let nearStair = false;
                let stairObj = STAIRS[0];

                STAIRS.forEach(s => {
                  if (Math.abs(p.x + p.width/2 - s.x) < 25) {
                    if (p.floor === s.fromFloor || p.floor === s.toFloor) {
                      nearStair = true;
                      stairObj = s;
                    }
                  }
                });

                if (nearStair) {
                  // Climb floor!
                  const targetFloor = p.floor === stairObj.fromFloor ? stairObj.toFloor : stairObj.fromFloor;
                  p.floor = targetFloor;
                  p.y = FLOOR_HEIGHTs[targetFloor - 1] - p.height;
                  p.aiWaitTimer = 1.0; // rest after climbing
                  return;
                }
              }

              // Normal patrol walking
              const speed = 2.0;
              p.vx = p.direction * speed;
              p.x += p.vx;

              // Border boundaries bounce
              if (p.x < HOUSE_LEFT - 30) {
                p.x = HOUSE_LEFT - 30;
                p.direction = 1;
              }
              if (p.x + p.width > HOUSE_RIGHT + 50) {
                p.x = HOUSE_RIGHT + 50 - p.width;
                p.direction = -1;
              }

              // Randomly pause and scan
              if (Math.random() < 0.01) {
                p.aiWaitTimer = 1.0 + Math.random() * 2.0;
              }
            }
          }
        }
      }
    });

    // 2. Update Bullets
    const bullets = bulletsRef.current;
    bulletsRef.current = bullets.filter(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.life -= 1;

      // Wall collisions
      if (b.x < 0 || b.x > CANVAS_WIDTH || b.y < 0 || b.y > CANVAS_HEIGHT) {
        return false;
      }

      // Check hit against Hiders (on the same floor)
      let hit = false;
      players.forEach(p => {
        if (p.team === 'Hider' && p.state !== 'eliminated' && p.floor === b.floor) {
          // Bounding box collision
          if (
            b.x >= p.x &&
            b.x <= p.x + p.width &&
            b.y >= p.y &&
            b.y <= p.y + p.height
          ) {
            // Hit!
            hit = true;
            p.health -= 50; // eliminate in 2 hits
            playHit();
            createParticles(b.x, b.y, '#ff3333', 15, b.floor);

            if (p.health <= 0) {
              p.state = 'eliminated';
              createParticles(p.x + p.width/2, p.y + p.height/2, '#aa0000', 30, p.floor);
              onEliminatePlayer(p.id, p.name, !p.isAI);
              
              // If seeker is the user, add score
              if (user && user.team === 'Seeker') {
                setSeekerScore(prev => prev + 100);
                onScoreEarned(100);
              }
            } else {
              // Damaged, break camo
              p.isCamo = false;
              p.color = p.baseColor;
            }
          }
        }
      });

      if (hit) return false; // destroy bullet
      return b.life > 0;
    });

    // 3. Update Particles
    const particles = particlesRef.current;
    particlesRef.current = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity on debris
      p.life += 1;
      return p.life < p.maxLife;
    });

    // 4. Verify Win/Loss Condition
    const aliveHiders = players.filter(p => p.team === 'Hider' && p.state !== 'eliminated').length;
    
    if (gameActive && !isHidePhase) {
      if (aliveHiders === 0) {
        onSeekerVictory();
      } else if (remainingTime <= 0) {
        onHiderVictory();
      }
    }
  };

  // AI Seeker scanning code
  const scanForHiders = (seeker: Player) => {
    const players = playersRef.current;
    
    players.forEach(p => {
      if (p.team === 'Hider' && p.state !== 'eliminated' && p.floor === seeker.floor) {
        // Line of sight distance check
        const dist = Math.abs(seeker.x - p.x);
        if (dist < 250) {
          // Check detection probability
          let detectChance = 0.0;
          
          if (!p.isCamo) {
            detectChance = 0.85; // highly visible
          } else {
            // Camouflaged
            const isMoving = Math.abs(p.vx) > 0.1;
            if (isMoving) {
              detectChance = 0.95; // instant spotted if moving
            } else {
              // check if overlapping with matching furniture
              let overlappingMatchedFurniture = false;
              activeMap.furniture.forEach(item => {
                if (item.floor === p.floor) {
                  const furnX = HOUSE_LEFT + item.x;
                  if (p.x >= furnX - 5 && p.x + p.width <= furnX + item.w + 5) {
                    if (p.targetColor === item.color) {
                      overlappingMatchedFurniture = true;
                    }
                  }
                }
              });

              if (overlappingMatchedFurniture) {
                detectChance = 0.04; // 4% chance (very stealthy)
              } else {
                detectChance = 0.40; // 40% if camouflaged on empty walls
              }
            }
          }

          if (Math.random() < detectChance) {
            // Spotted! Fire at hider
            seeker.direction = p.x > seeker.x ? 1 : -1;
            const startX = seeker.x + (seeker.direction === 1 ? seeker.width : 0);
            const startY = seeker.y + 12;
            const targetX = p.x + p.width / 2;
            const targetY = p.y + p.height / 2;

            seeker.gunAngle = Math.atan2(targetY - startY, targetX - startX);
            playGunshot();

            bulletsRef.current.push({
              id: Math.random().toString(),
              startX,
              startY,
              x: startX,
              y: startY,
              vx: Math.cos(seeker.gunAngle) * 18,
              vy: Math.sin(seeker.gunAngle) * 18,
              floor: seeker.floor,
              life: 40,
            });
          }
        }
      }
    });
  };

  // Helper color interpolator for camo fade
  const lerpColor = (color1: string, color2: string, factor: number) => {
    // Parse hex
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  // Render Frame
  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear background & Draw sky
    ctx.fillStyle = activeMap.skyColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render moon/sun decor
    ctx.fillStyle = '#ffffff11';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 80, 70, 30, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw ground grass
    ctx.fillStyle = activeMap.theme === 'erangel' ? '#27ae60' : activeMap.theme === 'miramar' ? '#d35400' : '#16a085';
    ctx.fillRect(0, 540, CANVAS_WIDTH, 60);

    // 3. Draw 3-Story House structure
    // Draw outer building frame
    ctx.lineWidth = 8;
    ctx.strokeStyle = activeMap.wallColor;
    ctx.strokeRect(HOUSE_LEFT, 60, HOUSE_WIDTH, 480);

    // Draw background wallpaper for each floor
    FLOOR_HEIGHTs.forEach((floorY, idx) => {
      const ceilingY = FLOOR_CEILINGS[idx];
      const floorH = floorY - ceilingY;
      ctx.fillStyle = activeMap.backgroundColor;
      ctx.fillRect(HOUSE_LEFT + 4, ceilingY + 4, HOUSE_WIDTH - 8, floorH - 8);

      // Draw floor lines
      ctx.fillStyle = activeMap.floorColor;
      ctx.fillRect(HOUSE_LEFT, floorY - 4, HOUSE_WIDTH, 8);
    });

    // Draw roof triangular cap
    ctx.fillStyle = '#b22222';
    ctx.beginPath();
    ctx.moveTo(HOUSE_LEFT - 10, 60);
    ctx.lineTo(HOUSE_LEFT + HOUSE_WIDTH / 2, 10);
    ctx.lineTo(HOUSE_RIGHT + 10, 60);
    ctx.closePath();
    ctx.fill();

    // Draw Stairs/Ladders connecting floors
    ctx.strokeStyle = '#ffffff66';
    ctx.lineWidth = 4;
    STAIRS.forEach(stair => {
      const startY = FLOOR_HEIGHTs[stair.fromFloor - 1] - 4;
      const endY = FLOOR_HEIGHTs[stair.toFloor - 1] - 4;
      
      // Draw ladder sides
      ctx.beginPath();
      ctx.moveTo(stair.x - 10, startY);
      ctx.lineTo(stair.x - 10, endY);
      ctx.moveTo(stair.x + 10, startY);
      ctx.lineTo(stair.x + 10, endY);
      ctx.stroke();

      // Draw rungs
      ctx.beginPath();
      for (let y = startY; y >= endY; y -= 16) {
        ctx.moveTo(stair.x - 10, y);
        ctx.lineTo(stair.x + 10, y);
      }
      ctx.stroke();
    });

    // Draw balcony rail
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(HOUSE_RIGHT, FLOOR_HEIGHTs[1] - 25);
    ctx.lineTo(HOUSE_RIGHT + 50, FLOOR_HEIGHTs[1] - 25);
    ctx.lineTo(HOUSE_RIGHT + 50, FLOOR_HEIGHTs[1]);
    ctx.stroke();

    // 4. Draw Furniture Objects
    activeMap.furniture.forEach(item => {
      const x = HOUSE_LEFT + item.x;
      const y = item.y - item.h;

      ctx.fillStyle = item.color;
      
      // Specialized drawing style based on furniture type
      if (item.type === 'sofa') {
        // Round edges or cushions
        ctx.fillRect(x, y + 10, item.w, item.h - 10);
        ctx.fillRect(x, y, 15, item.h); // Armrest left
        ctx.fillRect(x + item.w - 15, y, 15, item.h); // Armrest right
      } else if (item.type === 'plant') {
        // Stem and green leaves
        ctx.fillStyle = '#8B4513'; // pot
        ctx.fillRect(x + item.w/2 - 5, y + item.h - 10, 10, 10);
        ctx.fillStyle = item.color; // leaves
        ctx.beginPath();
        ctx.arc(x + item.w/2, y + item.h - 22, 12, 0, Math.PI * 2);
        ctx.arc(x + item.w/2 - 5, y + item.h - 32, 10, 0, Math.PI * 2);
        ctx.arc(x + item.w/2 + 5, y + item.h - 30, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'tv') {
        // Stand + screen
        ctx.fillStyle = '#555';
        ctx.fillRect(x + item.w/2 - 15, y + item.h - 10, 30, 10); // stand
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, item.w, item.h - 10); // bezel
        ctx.fillStyle = '#00ffff22'; // blue tint screen
        ctx.fillRect(x + 4, y + 4, item.w - 8, item.h - 18);
      } else {
        // Default flat rectangle
        ctx.fillRect(x, y, item.w, item.h);
      }

      // Border outline
      ctx.strokeStyle = '#ffffff22';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, item.w, item.h);
    });

    // 5. Draw Bullets
    ctx.strokeStyle = '#ffdf00';
    ctx.lineWidth = 3;
    bulletsRef.current.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.5, b.y - b.vy * 0.5);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    // 6. Draw Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 1 - p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1.0; // reset
    });

    // 7. Draw Players
    const players = playersRef.current;

    players.forEach(p => {
      if (p.state === 'eliminated') return;

      // Draw Hider Player
      if (p.team === 'Hider') {
        // If Hider is the user, we draw a subtle white outline so player knows where they are
        // Even when 100% camouflaged!
        const isUserHider = p.id === 'player_user';

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Pattern overlays for skins
        if (p.skinPattern !== 'none') {
          drawSkinPattern(ctx, p);
        }

        // Draw character outline
        if (isUserHider) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(p.x - 2, p.y - 2, p.width + 4, p.height + 4);
          
          // Draw username tag above head
          ctx.fillStyle = '#00ffff';
          ctx.font = 'bold 9px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('BẠN', p.x + p.width/2, p.y - 12);
        } else {
          // If Seeker user is looking, draw absolutely nothing (stealth mode)
          // Unless they are moving or not camouflaged
          const shouldShowDebugName = false; // Dev cheat
          if (shouldShowDebugName) {
            ctx.fillStyle = '#ffffffaa';
            ctx.font = '8px Inter';
            ctx.fillText(p.name, p.x + p.width/2, p.y - 6);
          }
        }
      }

      // Draw Seeker Player
      if (p.team === 'Seeker') {
        // Draw head, body, arms, legs
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Helmet/Cap
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(p.x - 1, p.y, p.width + 2, 7);

        // Vest
        ctx.fillStyle = '#34495e';
        ctx.fillRect(p.x + 2, p.y + 7, p.width - 4, 15);

        // Draw AK-47 Rifle
        ctx.save();
        const startX = p.x + (p.direction === 1 ? p.width : 0);
        const startY = p.y + 12;
        ctx.translate(startX, startY);
        ctx.rotate(p.gunAngle);

        // Weapon sprite
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, -2, 16, 4); // Barrel
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-4, 0, 5, 5); // Wood stock
        ctx.fillStyle = '#ff7f50';
        ctx.fillRect(4, 2, 3, 5); // Magazine curve
        ctx.restore();

        // Laser pointer sight (only for seeker player or active seekers during seeking phase)
        if (!isHidePhase) {
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + Math.cos(p.gunAngle) * 200, startY + Math.sin(p.gunAngle) * 200);
          ctx.stroke();
        }

        // Draw Name Tag
        ctx.fillStyle = p.id === 'player_user' ? '#00ffff' : '#ff5252';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(p.id === 'player_user' ? 'BẠN' : 'SEEKER', p.x + p.width/2, p.y - 6);

        // Draw reload spinner above head if reloading
        if (p.isReloading) {
          ctx.strokeStyle = '#f5cd79';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x + p.width/2, p.y - 18, 5, 0, Math.PI * 1.5);
          ctx.stroke();
        }
      }
    });
  };

  // Helper skin drawing
  const drawSkinPattern = (ctx: CanvasRenderingContext2D, player: Player) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(player.x, player.y, player.width, player.height);
    ctx.clip();

    ctx.lineWidth = 3;
    if (player.skinPattern === 'camo') {
      ctx.strokeStyle = '#3e4a2c';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + player.width, player.y + player.height);
      ctx.moveTo(player.x, player.y + 15);
      ctx.lineTo(player.x + player.width - 5, player.y + player.height);
      ctx.stroke();
    } else if (player.skinPattern === 'neon') {
      ctx.strokeStyle = '#00ffff';
      ctx.strokeRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4);
    } else if (player.skinPattern === 'gold') {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fillRect(player.x, player.y, player.width, player.height);
    } else if (player.skinPattern === 'rainbow') {
      ctx.strokeStyle = 'red';
      ctx.strokeRect(player.x + 1, player.y + 1, player.width - 2, player.height - 2);
    }

    ctx.restore();
  };

  // Auto-camo palette colors (matches furniture options)
  const colorsPalette = [
    '#ffffff', // Default White
    activeMap.backgroundColor, // Background wall
    '#5C4033', // Sofa brown
    '#8B5A2B', // Table wood
    '#CD853F', // Cabinet/Box
    '#228B22', // Plant green
    '#C0C0C0', // Metal fridge
    '#1a1a1a', // Black TV
    '#4682B4', // Bed blue
  ];

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas-element"
        />

        {/* Setup phase bottom controls for HIDER */}
        {playerTeam === 'Hider' && gameActive && (
          <div className="game-hud-bottom">
            <div className="camo-controls glass">
              <span className="hud-label">Bộ Hút Màu Camo:</span>
              <div className="camo-palette">
                {colorsPalette.map(c => (
                  <button
                    key={c}
                    className={`palette-color ${selectedColor === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      const players = playersRef.current;
                      const user = players.find(p => p.id === 'player_user');
                      if (user && user.state !== 'eliminated') {
                        setSelectedColor(c);
                        user.targetColor = c;
                        user.isCamo = true;
                        user.camoProgress = 0;
                        playClick();
                      }
                    }}
                  />
                ))}
              </div>
              <button
                className="btn-auto-camo"
                onClick={() => {
                  triggerPlayerCamouflage();
                }}
              >
                Hút Màu Nhanh [SPACE]
              </button>
            </div>
          </div>
        )}

        {/* HUD Overlay for Seeker */}
        {playerTeam === 'Seeker' && gameActive && (
          <div className="game-hud-bottom seeker-hud glass">
            <div className="weapon-status">
              <span className="weapon-name">AK-47</span>
              <span className="ammo-count">
                {seekerAmmo} / ∞
              </span>
              <button
                className="btn-reload"
                disabled={isReloading}
                onClick={triggerPlayerReload}
              >
                {isReloading ? 'Đang nạp...' : 'Nạp Đạn [R]'}
              </button>
            </div>
            <div className="seeker-score-hud">
              <span className="hud-label">Điểm:</span>
              <span className="score-val">{seekerScore}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
