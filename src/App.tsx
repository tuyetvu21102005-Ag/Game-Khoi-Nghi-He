import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { Shop } from './components/Shop';
import { LuckyWheel } from './components/LuckyWheel';
import { GameScreen } from './components/GameScreen';
import type { Team } from './types/game';
import './App.css';

type Screen = 'menu' | 'shop' | 'wheel' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [coinsP, setCoinsP] = useState<number>(300); // Start with 300 P for spins/skins
  const [coinsG, setCoinsG] = useState<number>(0);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['skin_default']);
  const [activeSkin, setActiveSkin] = useState<string>('skin_default');
  const [selectedMapId, setSelectedMapId] = useState<string>('map_erangel');
  const [assignedTeam, setAssignedTeam] = useState<Team>('Hider');
  const [scale, setScale] = useState<number>(1);

  // Resize handler to scale the 950x650 game bounds dynamically into the screen
  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 950;
      const baseHeight = 800;
      const padding = 16; // 16px safety margins

      const scaleX = (window.innerWidth - padding) / baseWidth;
      const scaleY = (window.innerHeight - padding) / baseHeight;

      // Always fit inside the viewport by taking the minimum scale factor
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load stats from localStorage if available
  useEffect(() => {
    const savedP = localStorage.getItem('pubg_hide_coinsP');
    const savedG = localStorage.getItem('pubg_hide_coinsG');
    const savedSkins = localStorage.getItem('pubg_hide_ownedSkins');
    const savedActive = localStorage.getItem('pubg_hide_activeSkin');

    if (savedP) setCoinsP(parseInt(savedP));
    if (savedG) setCoinsG(parseInt(savedG));
    if (savedSkins) setOwnedSkins(JSON.parse(savedSkins));
    if (savedActive) setActiveSkin(savedActive);
  }, []);

  // Sync state to localStorage
  const saveStats = (newP: number, newG: number, newSkins: string[], newActive: string) => {
    localStorage.setItem('pubg_hide_coinsP', newP.toString());
    localStorage.setItem('pubg_hide_coinsG', newG.toString());
    localStorage.setItem('pubg_hide_ownedSkins', JSON.stringify(newSkins));
    localStorage.setItem('pubg_hide_activeSkin', newActive);
  };

  const handleBuySkin = (skinId: string, cost: number, currency: 'P' | 'G') => {
    let nextP = coinsP;
    let nextG = coinsG;

    if (currency === 'P') {
      nextP = coinsP - cost;
      setCoinsP(nextP);
    } else {
      nextG = coinsG - cost;
      setCoinsG(nextG);
    }

    const nextSkins = [...ownedSkins, skinId];
    setOwnedSkins(nextSkins);
    saveStats(nextP, nextG, nextSkins, activeSkin);
  };

  const handleEquipSkin = (skinId: string) => {
    setActiveSkin(skinId);
    saveStats(coinsP, coinsG, ownedSkins, skinId);
  };

  const handleAddCoinsP = (amount: number) => {
    const nextP = Math.max(0, coinsP + amount);
    setCoinsP(nextP);
    saveStats(nextP, coinsG, ownedSkins, activeSkin);
  };

  const handleAddSkinDirect = (skinId: string) => {
    if (!ownedSkins.includes(skinId)) {
      const nextSkins = [...ownedSkins, skinId];
      setOwnedSkins(nextSkins);
      saveStats(coinsP, coinsG, nextSkins, activeSkin);
    }
  };

  const handleTopUpG = (amount: number) => {
    const nextG = coinsG + amount;
    setCoinsG(nextG);
    saveStats(coinsP, nextG, ownedSkins, activeSkin);
  };

  const handleStartGame = (team: Team) => {
    setAssignedTeam(team);
    setCurrentScreen('game');
  };

  const handleGameOver = (earnedP: number) => {
    const nextP = coinsP + earnedP;
    setCoinsP(nextP);
    saveStats(nextP, coinsG, ownedSkins, activeSkin);
    setCurrentScreen('menu');
  };

  return (
    <main className="app-main-viewport">
      <div
        className="app-scale-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '950px',
          height: '800px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {currentScreen === 'menu' && (
          <MainMenu
            coinsP={coinsP}
            coinsG={coinsG}
            activeSkin={activeSkin}
            selectedMapId={selectedMapId}
            onSelectMap={setSelectedMapId}
            onStartGame={handleStartGame}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {currentScreen === 'shop' && (
          <Shop
            coinsP={coinsP}
            coinsG={coinsG}
            ownedSkins={ownedSkins}
            activeSkin={activeSkin}
            onBuySkin={handleBuySkin}
            onEquipSkin={handleEquipSkin}
            onTopUpG={handleTopUpG}
            onBack={() => setCurrentScreen('menu')}
          />
        )}

        {currentScreen === 'wheel' && (
          <LuckyWheel
            coinsP={coinsP}
            ownedSkins={ownedSkins}
            onAddCoinsP={handleAddCoinsP}
            onAddSkin={handleAddSkinDirect}
            onBack={() => setCurrentScreen('menu')}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            playerTeam={assignedTeam}
            selectedMapId={selectedMapId}
            activeSkinId={activeSkin}
            onGameOver={handleGameOver}
          />
        )}
      </div>
    </main>
  );
}

export default App;
