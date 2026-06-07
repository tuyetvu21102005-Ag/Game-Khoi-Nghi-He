import React, { useState } from 'react';
import { useSound } from '../hooks/useSound';
import { ALL_SKINS } from './Shop';

interface MainMenuProps {
  coinsP: number;
  coinsG: number;
  activeSkin: string;
  selectedMapId: string;
  onSelectMap: (mapId: string) => void;
  onStartGame: (assignedTeam: 'Hider' | 'Seeker') => void;
  onNavigate: (screen: 'shop' | 'wheel') => void;
}

export interface MapData {
  id: string;
  name: string;
  description: string;
  theme: 'erangel' | 'miramar' | 'sanhok';
  difficulty: 'Dễ' | 'Trung Bình' | 'Khó';
  imageStyle: {
    background: string;
  };
}

export const MAPS: MapData[] = [
  {
    id: 'map_erangel',
    name: 'Biệt Thự Erangel',
    description: 'Biệt thự 3 tầng kiểu Nga cổ điển với nội thất gỗ ấm cúng, thư viện và rèm cửa dày. Thích hợp để ngụy trang tông màu gỗ và tối màu.',
    theme: 'erangel',
    difficulty: 'Dễ',
    imageStyle: {
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    },
  },
  {
    id: 'map_miramar',
    name: 'Tiền Đồn Miramar',
    description: 'Tiền đồn sa mạc công nghiệp 3 tầng với các tấm kim loại, thùng phi rỉ sét và cát bụi. Màu sắc chủ đạo là cam cát, xám sắt.',
    theme: 'miramar',
    difficulty: 'Trung Bình',
    imageStyle: {
      background: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
    },
  },
  {
    id: 'map_sanhok',
    name: 'Đền Cổ Sanhok',
    description: 'Ngôi đền cổ 3 tầng đổ nát giữa rừng nhiệt đới. Đầy ắp rêu xanh, hòm kho báu đá và dây leo. Lý tưởng cho màu xanh ngụy trang lá cây.',
    theme: 'sanhok',
    difficulty: 'Khó',
    imageStyle: {
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
  },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  coinsP,
  coinsG,
  activeSkin,
  selectedMapId,
  onSelectMap,
  onStartGame,
  onNavigate,
}) => {
  const { playClick, initAudio } = useSound();
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingProgress, setMatchmakingProgress] = useState(0);
  const [assignedTeam, setAssignedTeam] = useState<'Hider' | 'Seeker' | null>(null);

  const activeSkinData = ALL_SKINS.find((s) => s.id === activeSkin) || ALL_SKINS[0];

  const handleStartMatchmaking = () => {
    initAudio();
    playClick();
    setIsMatchmaking(true);
    setMatchmakingProgress(0);
    setAssignedTeam(null);

    // Randomize team (80% Hider, 20% Seeker matching 20 hiders vs 5 seekers ratio)
    const rolledTeam = Math.random() < 0.2 ? 'Seeker' : 'Hider';
    setAssignedTeam(rolledTeam);

    // Simulate matchmaking ticks
    const interval = setInterval(() => {
      setMatchmakingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsMatchmaking(false);
            onStartGame(rolledTeam);
          }, 1500); // Wait to show team reveal
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  const handleNav = (screen: 'shop' | 'wheel') => {
    playClick();
    onNavigate(screen);
  };

  return (
    <div className="menu-container">
      {/* Title Header */}
      <header className="menu-header">
        <h1 className="game-title">
          PUBG: HIDE & SEEK
          <span className="subtitle">Phiên Bản Khởi Nghiệp Hè</span>
        </h1>

        <div className="menu-stats">
          <div className="balance-badge badge-p">
            <span className="balance-label">Xu P:</span>
            <span className="balance-value">{coinsP.toLocaleString()}</span>
          </div>
          <div className="balance-badge badge-g">
            <span className="balance-label">Gold G:</span>
            <span className="balance-value">{coinsG.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="menu-grid">
        {/* Left column: Player Info & Customization */}
        <section className="menu-section section-player glass">
          <h2>Hồ Sơ Cáo Trạng</h2>
          <div className="player-card">
            <div className="player-avatar">
              <div
                className={`avatar-block pattern-${activeSkinData.pattern}`}
                style={{
                  background: activeSkinData.previewColor.startsWith('linear-gradient')
                    ? activeSkinData.previewColor
                    : activeSkinData.previewColor,
                  backgroundColor: activeSkinData.previewColor.startsWith('linear-gradient')
                    ? undefined
                    : activeSkinData.previewColor,
                }}
              />
            </div>
            <div className="player-details">
              <h3>Khách Chơi #{(coinsP % 8999 + 1000)}</h3>
              <p className="skin-status">Ngoại hình: <strong>{activeSkinData.name}</strong></p>
              <div className="combat-stats">
                <div className="stat-item">
                  <span className="stat-val">20</span>
                  <span className="stat-lbl">Hiders</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">5</span>
                  <span className="stat-lbl">Seekers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">15m</span>
                  <span className="stat-lbl">Thời Gian</span>
                </div>
              </div>
            </div>
          </div>

          <div className="nav-buttons">
            <button className="btn-menu-nav" onClick={() => handleNav('shop')}>
              🛒 Cửa Hàng Trang Bị
            </button>
            <button className="btn-menu-nav" onClick={() => handleNav('wheel')}>
              🎡 Vòng Quay May Mắn
            </button>
          </div>
        </section>

        {/* Right column: Map Selector */}
        <section className="menu-section section-maps glass">
          <h2>Chọn Chiến Trường</h2>
          <div className="maps-carousel">
            {MAPS.map((map) => (
              <div
                key={map.id}
                className={`map-card ${selectedMapId === map.id ? 'selected' : ''}`}
                onClick={() => {
                  playClick();
                  onSelectMap(map.id);
                }}
              >
                <div className="map-image-placeholder" style={map.imageStyle}>
                  <div className="map-difficulty">{map.difficulty}</div>
                </div>
                <div className="map-info">
                  <h3>{map.name}</h3>
                  <p>{map.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Big Play Button Section */}
      <footer className="menu-footer">
        <button className="btn-play-match" onClick={handleStartMatchmaking}>
          VÀO TRẬN (RANDOM TEAM)
        </button>
      </footer>

      {/* Matchmaking Overlay */}
      {isMatchmaking && (
        <div className="modal-overlay matchmaking-overlay">
          <div className="matchmaking-panel glass">
            {matchmakingProgress < 100 ? (
              <div className="searching-anim">
                <div className="pulse-radar" />
                <h3>ĐANG TÌM TRẬN ĐẤU...</h3>
                <p>Tìm kiếm người chơi (24/25)</p>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${matchmakingProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="team-reveal anim-pop">
                <h2>TRẬN ĐẤU BẮT ĐẦU!</h2>
                <div className={`revealed-team-card team-${assignedTeam?.toLowerCase()}`}>
                  <p>Bạn được phân vào:</p>
                  <h3>
                    {assignedTeam === 'Hider' ? 'ĐỘI ĐI TRỐN (HIDER)' : 'ĐỘI ĐI TÌM (SEEKER)'}
                  </h3>
                  <span className="team-size">
                    {assignedTeam === 'Hider' ? 'Tổng số: 20 người trốn' : 'Tổng số: 5 người tìm (AK-47)'}
                  </span>
                </div>
                <p className="loading-tip">Đang tải bản đồ...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
