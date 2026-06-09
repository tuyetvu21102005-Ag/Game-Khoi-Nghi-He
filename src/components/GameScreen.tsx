import React, { useState, useEffect } from 'react';
import type { Team } from '../types/game';
import { GameCanvas } from './GameCanvas';
import { useSound } from '../hooks/useSound';

interface GameScreenProps {
  playerTeam: Team;
  selectedMapId: string;
  activeSkinId: string;
  onGameOver: (pointsP: number) => void;
}

interface KillEvent {
  id: string;
  seekerName: string;
  hiderName: string;
  timestamp: number;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  playerTeam,
  selectedMapId,
  activeSkinId,
  onGameOver,
}) => {
  const { playWin, playLose, playClick, initAudio } = useSound();
  
  // Game state
  const [isHidePhase, setIsHidePhase] = useState<boolean>(true);
  const [realTimeLeft, setRealTimeLeft] = useState<number>(150); // 150 real seconds (2.5 mins)
  const [gameTimeText, setGameTimeText] = useState<string>('15:00');
  const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<'win' | 'lose' | null>(null);
  
  // Statistics
  const [playerKills, setPlayerKills] = useState<number>(0);
  const [playerScoreP, setPlayerScoreP] = useState<number>(0);
  const [hidersRemaining, setHidersRemaining] = useState<number>(20);

  // Match timers
  useEffect(() => {
    initAudio();

    // 20s Hide Phase timer
    let hideTimer = setTimeout(() => {
      setIsHidePhase(false);
    }, 20000);

    // Regular game timer loop
    const gameTimerInterval = setInterval(() => {
      setRealTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimerInterval);
          handleMatchOver('Hider'); // Hiders win if time runs out
          return 0;
        }

        const nextTime = prev - 1;
        
        // Scale 150s down to 15m (900s)
        // 1 real second = 6 game seconds
        const gameSecondsTotal = nextTime * 6;
        const minutes = Math.floor(gameSecondsTotal / 60);
        const seconds = gameSecondsTotal % 60;
        setGameTimeText(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );

        return nextTime;
      });
    }, 1000);

    return () => {
      clearTimeout(hideTimer);
      clearInterval(gameTimerInterval);
    };
  }, []);

  // Handle player elimination callback from canvas
  const handleEliminatePlayer = (id: string, name: string, isPlayer: boolean) => {
    setHidersRemaining((prev) => {
      const nextCount = prev - 1;

      // Add to PUBG-style kill feed
      const seekers = ['Bắn Tỉa Seeker #1', 'Seeker Càn Quét #2', 'Seeker AI #3', 'Bạn (Seeker)'];
      const randomSeeker = playerTeam === 'Seeker' && id !== 'player_user' 
        ? 'Bạn (Seeker)' 
        : seekers[Math.floor(Math.random() * seekers.length)];

      const newKill: KillEvent = {
        id: Math.random().toString(),
        seekerName: randomSeeker,
        hiderName: name,
        timestamp: Date.now(),
      };

      setKillFeed((prevFeed) => [newKill, ...prevFeed.slice(0, 3)]); // Keep last 4 kills

      if (isPlayer) {
        if (playerTeam === 'Hider') {
          // If player was hider and died, they lose immediately (unless they want to spectate,
          // but for quick gaming we show defeat modal)
          setTimeout(() => handleMatchOver('Seeker'), 2000);
        }
      }

      return nextCount;
    });
  };

  const handleScoreEarned = (points: number) => {
    setPlayerKills(prev => prev + 1);
    setPlayerScoreP(prev => prev + points);
  };

  // Match end handler
  const handleMatchOver = (winningTeam: Team) => {
    if (isMatchOver) return;
    setIsMatchOver(true);

    const playerWon = playerTeam === winningTeam;
    setMatchResult(playerWon ? 'win' : 'lose');

    // Play sounds
    if (playerWon) {
      playWin();
    } else {
      playLose();
    }

    // Calculate final P-coins rewards
    let finalRewardP = playerScoreP;
    if (playerTeam === 'Hider') {
      // Survival score: 2 points per survived second
      const survivedSeconds = 150 - realTimeLeft;
      finalRewardP += survivedSeconds * 2;
      if (playerWon) {
        finalRewardP += 300; // survival bonus
      }
    } else {
      // Seeker score
      if (playerWon) {
        finalRewardP += 200; // winning bonus
      }
    }

    setPlayerScoreP(finalRewardP);
  };

  const handleFinishMatch = () => {
    playClick();
    onGameOver(playerScoreP);
  };

  return (
    <div className="game-screen-container">
      {/* HUD Header */}
      <header className="game-hud-header glass">
        <div className="hud-column">
          <span className="hud-label">Đội Của Bạn</span>
          <span className={`hud-value team-name ${playerTeam.toLowerCase()}`}>
            {playerTeam === 'Hider' ? 'ĐI TRỐN' : 'ĐI TÌM (AK-47)'}
          </span>
        </div>

        <div className="hud-column center-timer">
          <span className="hud-label">{isHidePhase ? 'ĐANG TRỐN' : 'THỜI GIAN'}</span>
          <span className={`hud-value game-timer ${isHidePhase ? 'text-warn' : ''}`}>
            {isHidePhase ? '00:20' : gameTimeText}
          </span>
        </div>

        <div className="hud-column">
          <span className="hud-label">Kẻ Trốn Sống Sót</span>
          <span className="hud-value hiders-count">{hidersRemaining} / 20</span>
        </div>
      </header>

      {/* Kill Feed overlay on top right */}
      <div className="kill-feed-container">
        {killFeed.map((kill) => (
          <div key={kill.id} className="kill-card anim-slide-in">
            <span className="kill-seeker">{kill.seekerName}</span>
            <span className="kill-icon">🔫 AK-47</span>
            <span className="kill-hider">{kill.hiderName}</span>
          </div>
        ))}
      </div>

      {/* Hide phase loading cover for Seeker */}
      {isHidePhase && playerTeam === 'Seeker' && (
        <div className="seeker-waiting-screen">
          <div className="waiting-card">
            <div className="military-radar" />
            <h2>ĐỘI TRỐN ĐANG ẨN NẤP</h2>
            <p>Vui lòng đợi 20 giây để đội trốn ổn định vị trí.</p>
            <p className="countdown-hint">
              AK-47 chuẩn bị nạp đạn...
            </p>
          </div>
        </div>
      )}

      {/* Hide phase instructions for Hider */}
      {isHidePhase && playerTeam === 'Hider' && (
        <div className="hider-instruction-bar anim-pulse">
          ⚠️ <strong>HÃY TRỐN NGAY!</strong> Sử dụng Phím Mũi Tên / WASD để di chuyển lên 3 tầng, đứng cạnh đồ vật và ấn <strong>SPACE</strong> để ngụy trang!
        </div>
      )}

      {/* Game Canvas Board */}
      <GameCanvas
        playerTeam={playerTeam}
        selectedMapId={selectedMapId}
        activeSkinId={activeSkinId}
        isHidePhase={isHidePhase}
        gameActive={!isMatchOver}
        remainingTime={realTimeLeft}
        onEliminatePlayer={handleEliminatePlayer}
        onHiderVictory={() => handleMatchOver('Hider')}
        onSeekerVictory={() => handleMatchOver('Seeker')}
        onScoreEarned={handleScoreEarned}
      />

      {/* Match Over Modal */}
      {isMatchOver && (
        <div className="modal-overlay">
          <div className={`modal-content glass match-over-modal anim-pop ${matchResult}`}>
            <h2>TRẬN ĐẤU KẾT THÚC</h2>
            
            <h1 className={`match-result-title text-${matchResult}`}>
              {matchResult === 'win' ? 'VICTORY' : 'DEFEAT'}
            </h1>

            <div className="match-stats-summary">
              <h3>Thống Kê Chiến Tích</h3>
              <div className="stats-row">
                <span>Số mạng tiêu diệt:</span>
                <strong>{playerKills}</strong>
              </div>
              <div className="stats-row">
                <span>Thời gian sinh tồn:</span>
                <strong>{150 - realTimeLeft} giây</strong>
              </div>
              <div className="stats-row bonus-row">
                <span>Phần thưởng Xu P kiếm được:</span>
                <strong className="text-p">+{playerScoreP} P</strong>
              </div>
            </div>

            <button className="btn-confirm" onClick={handleFinishMatch}>
              Nhận Thưởng & Trở Về
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
