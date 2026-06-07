import React, { useState } from 'react';
import type { Skin } from '../types/game';
import { useSound } from '../hooks/useSound';

interface ShopProps {
  coinsP: number;
  coinsG: number;
  ownedSkins: string[];
  activeSkin: string;
  onBuySkin: (skinId: string, cost: number, currency: 'P' | 'G') => void;
  onEquipSkin: (skinId: string) => void;
  onTopUpG: (amount: number) => void;
  onBack: () => void;
}

export const ALL_SKINS: Skin[] = [
  {
    id: 'skin_default',
    name: 'Mặc Định',
    price: 0,
    currency: 'P',
    pattern: 'none',
    color: '#ffffff',
    rarity: 'common',
    previewColor: '#e0e0e0',
  },
  {
    id: 'skin_wood',
    name: 'Vân Gỗ (Woodland)',
    price: 300,
    currency: 'P',
    pattern: 'wood',
    color: '#8B4513',
    rarity: 'common',
    previewColor: '#a0522d',
  },
  {
    id: 'skin_camo',
    name: 'Rằn Ri Quân Đội (Camo)',
    price: 600,
    currency: 'P',
    pattern: 'camo',
    color: '#556B2F',
    rarity: 'rare',
    previewColor: '#6b8e23',
  },
  {
    id: 'skin_brick',
    name: 'Gạch Nung (Brick)',
    price: 450,
    currency: 'P',
    pattern: 'brick',
    color: '#B22222',
    rarity: 'common',
    previewColor: '#cd5c5c',
  },
  {
    id: 'skin_red_tiger',
    name: 'Hổ Đỏ (Red Tiger)',
    price: 1200,
    currency: 'P',
    pattern: 'red_tiger',
    color: '#FF4500',
    rarity: 'rare',
    previewColor: '#ff6347',
  },
  {
    id: 'skin_neon_wave',
    name: 'Sóng Neon (Neon Wave)',
    price: 80,
    currency: 'G',
    pattern: 'neon',
    color: '#00FFFF',
    rarity: 'rare',
    previewColor: '#00ffff',
  },
  {
    id: 'skin_rainbow',
    name: 'Cầu Vồng Lấp Lánh',
    price: 150,
    currency: 'G',
    pattern: 'rainbow',
    color: '#FF00FF',
    rarity: 'legendary',
    previewColor: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)',
  },
  {
    id: 'skin_gold_dragon',
    name: 'Rồng Vàng (Gold Dragon)',
    price: 250,
    currency: 'G',
    pattern: 'gold',
    color: '#FFD700',
    rarity: 'legendary',
    previewColor: '#ffd700',
  },
  {
    id: 'skin_galaxy',
    name: 'Tinh Vân (Galaxy)',
    price: 400,
    currency: 'G',
    pattern: 'galaxy',
    color: '#4B0082',
    rarity: 'legendary',
    previewColor: '#1e0030',
  },
];

export const Shop: React.FC<ShopProps> = ({
  coinsP,
  coinsG,
  ownedSkins,
  activeSkin,
  onBuySkin,
  onEquipSkin,
  onTopUpG,
  onBack,
}) => {
  const { playClick, playCoins } = useSound();
  const [activeTab, setActiveTab] = useState<'skins' | 'topup'>('skins');
  const [showTopUpModal, setShowTopUpModal] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleBack = () => {
    playClick();
    onBack();
  };

  const handleBuy = (skin: Skin) => {
    playClick();
    if (skin.currency === 'P' && coinsP < skin.price) {
      alert('Không đủ Xu P! Hãy chơi game để cày thêm xu hoặc quay vòng quay may mắn.');
      return;
    }
    if (skin.currency === 'G' && coinsG < skin.price) {
      alert('Không đủ Xu G! Vui lòng vào tab Nạp Tiền để nạp thêm Gold.');
      return;
    }
    onBuySkin(skin.id, skin.price, skin.currency);
  };

  const handleEquip = (skinId: string) => {
    playClick();
    onEquipSkin(skinId);
  };

  const startTopUpProcess = (amount: number) => {
    playClick();
    setShowTopUpModal(amount);
    setIsProcessingPayment(true);
    setPaymentSuccess(false);

    // Simulate standard payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      playCoins();
      onTopUpG(amount);
    }, 2000);
  };

  const closeTopUpModal = () => {
    playClick();
    setShowTopUpModal(null);
    setPaymentSuccess(false);
  };

  return (
    <div className="shop-container">
      {/* Shop Header */}
      <header className="shop-header">
        <button className="btn-back" onClick={handleBack}>
          ← Quay Lại
        </button>
        <h2>Cửa Hàng Vật Phẩm</h2>
        <div className="shop-balances">
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

      {/* Shop Nav */}
      <nav className="shop-nav">
        <button
          className={`nav-tab ${activeTab === 'skins' ? 'active' : ''}`}
          onClick={() => {
            playClick();
            setActiveTab('skins');
          }}
        >
          Skins Ngoại Hình & Vũ Khí
        </button>
        <button
          className={`nav-tab ${activeTab === 'topup' ? 'active' : ''}`}
          onClick={() => {
            playClick();
            setActiveTab('topup');
          }}
        >
          Nạp Gold G (Simulated)
        </button>
      </nav>

      {/* Skins Tab */}
      {activeTab === 'skins' && (
        <div className="skins-grid">
          {ALL_SKINS.map((skin) => {
            const isOwned = ownedSkins.includes(skin.id);
            const isActive = activeSkin === skin.id;

            return (
              <div key={skin.id} className={`skin-card rarity-${skin.rarity}`}>
                {/* Skin Preview Icon */}
                <div className="skin-preview-wrapper">
                  <div
                    className={`skin-preview-block pattern-${skin.pattern}`}
                    style={{
                      background: skin.previewColor.startsWith('linear-gradient')
                        ? skin.previewColor
                        : skin.previewColor,
                      backgroundColor: skin.previewColor.startsWith('linear-gradient')
                        ? undefined
                        : skin.previewColor,
                    }}
                  />
                  {skin.rarity === 'legendary' && <div className="legendary-sparkle" />}
                </div>

                <div className="skin-info">
                  <span className={`rarity-tag rarity-${skin.rarity}`}>
                    {skin.rarity.toUpperCase()}
                  </span>
                  <h3>{skin.name}</h3>
                  <p className="skin-desc">
                    {skin.pattern === 'none'
                      ? 'Ngoại hình trắng trơn mặc định.'
                      : `Họa tiết ${skin.name} độc quyền.`}
                  </p>
                </div>

                <div className="skin-action">
                  {isOwned ? (
                    isActive ? (
                      <button className="btn-action btn-active" disabled>
                        Đang Sử Dụng
                      </button>
                    ) : (
                      <button
                        className="btn-action btn-equip"
                        onClick={() => handleEquip(skin.id)}
                      >
                        Trang Bị
                      </button>
                    )
                  ) : (
                    <button
                      className={`btn-action btn-buy ${skin.currency.toLowerCase()}`}
                      onClick={() => handleBuy(skin)}
                    >
                      Mua ({skin.price} {skin.currency})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TopUp Tab */}
      {activeTab === 'topup' && (
        <div className="topup-container">
          <div className="topup-info-card">
            <h3>Nạp Gold G Độc Quyền</h3>
            <p>
              Gold G là tiền tệ trả phí cao cấp giúp bạn mở khóa các bộ skins Huyền Thoại (Legendary)
              hoặc quay thưởng ngay lập tức. Đây là phiên bản mô phỏng giao dịch ảo miễn phí!
            </p>
          </div>

          <div className="topup-grid">
            {[
              { amount: 100, price: '20,000đ', bonus: 0 },
              { amount: 550, price: '100,000đ', bonus: 50 },
              { amount: 1200, price: '200,000đ', bonus: 200 },
              { amount: 3200, price: '500,000đ', bonus: 700 },
            ].map((pack) => (
              <div key={pack.amount} className="topup-card">
                <div className="gold-icon-container">
                  <div className="gold-coin-stack" />
                </div>
                <h3>{pack.amount} Gold G</h3>
                {pack.bonus > 0 && <span className="bonus-tag">+{pack.bonus} G Tặng Kèm</span>}
                <button className="btn-topup" onClick={() => startTopUpProcess(pack.amount)}>
                  Nạp {pack.price}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal !== null && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            {isProcessingPayment ? (
              <div className="payment-processing">
                <div className="spinner" />
                <h3>Đang xử lý giao dịch...</h3>
                <p>Vui lòng không tắt trình duyệt hoặc tải lại trang.</p>
              </div>
            ) : paymentSuccess ? (
              <div className="payment-success">
                <div className="success-icon">✓</div>
                <h3>Giao dịch thành công!</h3>
                <p>
                  Bạn đã nhận được <strong>+{showTopUpModal} Gold G</strong> vào tài khoản.
                </p>
                <button className="btn-confirm" onClick={closeTopUpModal}>
                  Tuyệt Vời
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
