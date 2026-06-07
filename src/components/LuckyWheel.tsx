import React, { useState, useRef, useEffect } from 'react';
import { useSound } from '../hooks/useSound';
import type { Skin } from '../types/game';
import { ALL_SKINS } from './Shop';

interface LuckyWheelProps {
  coinsP: number;
  ownedSkins: string[];
  onAddCoinsP: (amount: number) => void;
  onAddSkin: (skinId: string) => void;
  onBack: () => void;
}

interface WheelPrize {
  id: string;
  name: string;
  type: 'coins' | 'skin' | 'nothing';
  value: number; // amount of coins
  skinId?: string;
  color: string;
  probability: number; // weight
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  coinsP,
  ownedSkins,
  onAddCoinsP,
  onAddSkin,
  onBack,
}) => {
  const { playClick, playSpinTick, playCoins, playWin, playLose } = useSound();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<WheelPrize | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Wheel Physics State
  const angleRef = useRef(0);
  const lastTickAngleRef = useRef(0);

  const PRIZES: WheelPrize[] = [
    { id: 'p1', name: '50 Xu P', type: 'coins', value: 50, color: '#2a2a4a', probability: 0.35 },
    { id: 'p2', name: 'Chúc May Mắn', type: 'nothing', value: 0, color: '#1a1a2e', probability: 0.25 },
    { id: 'p3', name: '150 Xu P', type: 'coins', value: 150, color: '#3a3a6a', probability: 0.20 },
    { id: 'p4', name: 'Skins Thường', type: 'skin', value: 0, color: '#008080', probability: 0.10 },
    { id: 'p5', name: '300 Xu P', type: 'coins', value: 300, color: '#4a4a8a', probability: 0.08 },
    { id: 'p6', name: 'Skins Hiếm', type: 'skin', value: 0, color: '#800080', probability: 0.06 },
    { id: 'p7', name: 'SKIN HUYỀN THOẠI', type: 'skin', value: 0, color: '#FFD700', probability: 0.01 }, // 1%
  ];

  // Draw the wheel on canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;

    ctx.clearRect(0, 0, size, size);

    // Outer ring glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0f23';
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Outer border ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#4e4e9e';
    ctx.lineWidth = 6;
    ctx.stroke();

    const numSlices = PRIZES.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    PRIZES.forEach((prize, idx) => {
      const startAngle = angle + idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw slice background
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff22';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = prize.id === 'p7' ? '#1a1a2e' : '#ffffff';
      ctx.font = prize.id === 'p7' ? 'bold 11px Rajdhani' : '500 11px Inter';
      ctx.fillText(prize.name, radius - 20, 0);
      ctx.restore();
    });

    // Draw center peg
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center design
    ctx.beginPath();
    ctx.arc(center, center, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
  };

  // Redraw when angle changes
  useEffect(() => {
    drawWheel(angleRef.current);
  }, []);

  const selectPrize = (): WheelPrize => {
    // Weighted random selection
    const rand = Math.random();
    let cumulative = 0;
    for (const prize of PRIZES) {
      cumulative += prize.probability;
      if (rand <= cumulative) {
        return prize;
      }
    }
    return PRIZES[0];
  };

  const handleSpin = () => {
    if (isSpinning) return;
    if (coinsP < 100) {
      alert('Bạn không đủ Xu P (Cần 100 Xu P cho mỗi lượt quay)! Hãy cày game để có thêm xu.');
      return;
    }

    playClick();
    onAddCoinsP(-100);
    setIsSpinning(true);
    setSpinResult(null);
    setShowResultModal(false);

    const targetPrize = selectPrize();
    const sliceAngle = (Math.PI * 2) / PRIZES.length;
    const prizeIndex = PRIZES.findIndex((p) => p.id === targetPrize.id);

    // Calculate final angle to land on the prize at the top arrow pointer (angle = -Math.PI / 2)
    // The wheel rotates clockwise, so slice index `i` is at `angle + i * sliceAngle`
    // To land index `i` at the top (which is -Math.PI / 2 or 1.5 * Math.PI),
    // targetAngle = 1.5 * Math.PI - (i * sliceAngle) - (sliceAngle / 2)
    const currentAngleNormalized = angleRef.current % (Math.PI * 2);
    const stopAngle = (1.5 * Math.PI) - (prizeIndex * sliceAngle) - (sliceAngle / 2);
    
    // Spin around at least 6 full rotations (12 * Math.PI)
    const extraRotations = Math.PI * 2 * (6 + Math.random() * 2);
    const finalAngleTarget = angleRef.current + (stopAngle - currentAngleNormalized) + extraRotations;
    
    let currentAngle = angleRef.current;
    let duration = 4000; // 4 seconds spin
    let startTime = performance.now();
    
    // Track sound ticks
    lastTickAngleRef.current = currentAngle;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out cubic: 1 - (1 - x)^3
      const ease = 1 - Math.pow(1 - progress, 3.5);
      
      const newAngle = currentAngle + (finalAngleTarget - currentAngle) * ease;
      angleRef.current = newAngle;

      // Play tick sound when passing a slice boundary
      const sliceSize = (Math.PI * 2) / PRIZES.length;
      const prevSlice = Math.floor(lastTickAngleRef.current / sliceSize);
      const currSlice = Math.floor(newAngle / sliceSize);
      if (currSlice !== prevSlice) {
        playSpinTick();
        lastTickAngleRef.current = newAngle;
      }

      drawWheel(newAngle);

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        setIsSpinning(false);
        setSpinResult(targetPrize);
        setShowResultModal(true);
        triggerPrizeReward(targetPrize);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  const triggerPrizeReward = (prize: WheelPrize) => {
    if (prize.type === 'coins') {
      playCoins();
      onAddCoinsP(prize.value);
    } else if (prize.type === 'nothing') {
      playLose();
    } else if (prize.type === 'skin') {
      playWin();
      // Determine what skin to give
      let candidateSkins: Skin[] = [];
      if (prize.id === 'p4') {
        // Common skins: wood, brick
        candidateSkins = ALL_SKINS.filter((s) => s.rarity === 'common' && s.price > 0 && !ownedSkins.includes(s.id));
      } else if (prize.id === 'p6') {
        // Rare skins: camo, red_tiger, neon_wave
        candidateSkins = ALL_SKINS.filter((s) => s.rarity === 'rare' && !ownedSkins.includes(s.id));
      } else if (prize.id === 'p7') {
        // Legendary skins: rainbow, gold_dragon, galaxy
        candidateSkins = ALL_SKINS.filter((s) => s.rarity === 'legendary' && !ownedSkins.includes(s.id));
      }

      if (candidateSkins.length > 0) {
        const selectedSkin = candidateSkins[Math.floor(Math.random() * candidateSkins.length)];
        onAddSkin(selectedSkin.id);
        // Modify prize name to display the specific skin
        prize.name = `Skin: ${selectedSkin.name}`;
      } else {
        // Fallback if they own all skins of that tier
        prize.name = 'Bạn đã sở hữu mọi Skin nhóm này! Nhận 500 P thay thế.';
        onAddCoinsP(500);
        playCoins();
      }
    }
  };

  const handleBack = () => {
    if (isSpinning) return;
    playClick();
    onBack();
  };

  return (
    <div className="wheel-container">
      {/* Header */}
      <header className="wheel-header">
        <button className="btn-back" onClick={handleBack} disabled={isSpinning}>
          ← Quay Lại
        </button>
        <h2>Vòng Quay May Mắn</h2>
        <div className="balance-badge badge-p">
          <span className="balance-label">Xu P:</span>
          <span className="balance-value">{coinsP.toLocaleString()}</span>
        </div>
      </header>

      {/* Wheel Content */}
      <div className="wheel-content-wrapper">
        <div className="wheel-arrow" />
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="wheel-canvas"
        />
        <button
          className={`btn-spin ${isSpinning ? 'spinning' : ''}`}
          onClick={handleSpin}
          disabled={isSpinning}
        >
          {isSpinning ? 'Đang Quay...' : 'QUAY (100 P)'}
        </button>
      </div>

      <div className="wheel-guideline">
        <p>Chi phí: <strong>100 P</strong> mỗi lượt quay.</p>
        <p>Cơ hội trúng <strong>SKIN HUYỀN THOẠI</strong> cực thấp (chỉ 1%). Thử vận may ngay!</p>
      </div>

      {/* Result Modal */}
      {showResultModal && spinResult && (
        <div className="modal-overlay">
          <div className="modal-content glass prize-modal anim-pop">
            <div className={`prize-glow rarity-${spinResult.id === 'p7' ? 'legendary' : spinResult.id === 'p6' ? 'rare' : 'common'}`} />
            
            {spinResult.type === 'coins' && (
              <div className="prize-coins-anim">
                <div className="coin-glow" />
              </div>
            )}
            
            <h3>Kết Quả Vòng Quay</h3>
            <div className="prize-announcement">
              {spinResult.type === 'nothing' ? (
                <p className="text-fail">Rất tiếc! Chúc bạn may mắn lần sau.</p>
              ) : (
                <p className="text-success">
                  Chúc mừng! Bạn đã trúng:<br />
                  <strong className="prize-name">{spinResult.name}</strong>
                </p>
              )}
            </div>

            <button
              className="btn-confirm"
              onClick={() => {
                playClick();
                setShowResultModal(false);
              }}
            >
              Xác Nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
