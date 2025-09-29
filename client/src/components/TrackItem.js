import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const TrackItem = ({ addNotification }) => {
  const [itemId, setItemId] = useState('');
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const stateNames = {
    '0': 'Harvested',
    '1': 'For Sale by Farmer',
    '2': 'Purchased by Distributor',
    '3': 'Shipped by Distributor',
    '4': 'Received by Retailer',
    '5': 'For Sale by Retailer',
    '6': 'Purchased by Consumer'
  };

  const handleTrackItem = async (e) => {
    e.preventDefault();
    if (!itemId) return;

    setIsLoading(true);
    setItem(null);

    try {
      const response = await fetch(`http://localhost:5000/item/${itemId}`);
      
      if (response.ok) {
        const itemData = await response.json();
        setItem(itemData);
        addNotification(`📦 Item found: ${itemData.name}`, 'success');
      } else {
        const error = await response.text();
        addNotification(`❌ ${error}`, 'error');
      }
    } catch (error) {
      addNotification(`❌ Network error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Not assigned';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="track-item modern-page">
      <div className="page-header modern-header">
        <h2 className="modern-title">🔍 Track Item</h2>
        <p className="modern-subtitle">Search and verify agricultural products on the blockchain</p>
      </div>

      <div className="search-section modern-search">
        <form onSubmit={handleTrackItem} className="search-form modern-form">
          <div className="search-input-group modern-input-group">
            <input
              type="number"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              placeholder="Enter Item ID (e.g., 1, 2, 3...)"
              className="search-input modern-input"
              min="1"
              required
            />
            <button 
              type="submit" 
              className={`search-btn modern-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !itemId}
            >
              {isLoading ? (
                <span className="spinner-small modern-spinner"></span>
              ) : (
                <>🔍 Track</>
              )}
            </button>
          </div>
        </form>
      </div>

      {item && (
        <div className="item-details modern-details">
          <div className="item-header modern-header">
            <div className="item-title modern-title">
              <h3 className="modern-product-title">📦 {item.name}</h3>
              <span className={`status-badge modern-badge ${item.state}`}>
                {stateNames[item.state] || 'Unknown State'}
              </span>
            </div>
            <div className="item-id modern-id">
              ID: #{item.id}
            </div>
          </div>

          <div className="supply-chain-section modern-supply-section">
            <div className="supply-chain modern-timeline">
              <div className="detail-card modern-step-card">
                <div className="step-header">
                  <div className="step-icon modern-icon">👨‍🌾</div>
                  <div className="step-info">
                    <strong className="modern-step-title">Harvested by Farmer</strong>
                    <span className="modern-step-value">{formatAddress(item.farmer)}</span>
                  </div>
                </div>
              </div>

              <div className="step-arrow modern-arrow">↓</div>

              <div className="detail-card modern-step-card">
                <div className="step-header">
                  <div className="step-icon modern-icon">🚚</div>
                  <div className="step-info">
                    <strong className="modern-step-title">Purchased by Distributor</strong>
                    <span className="modern-step-value">{formatAddress(item.distributor)}</span>
                  </div>
                </div>
              </div>

              <div className="step-arrow modern-arrow">↓</div>

              <div className="detail-card modern-step-card">
                <div className="step-header">
                  <div className="step-icon modern-icon">🏪</div>
                  <div className="step-info">
                    <strong className="modern-step-title">Received by Retailer</strong>
                    <span className="modern-step-value">{formatAddress(item.retailer)}</span>
                  </div>
                </div>
              </div>

              <div className="step-arrow modern-arrow">↓</div>

              <div className="detail-card modern-step-card">
                <div className="step-header">
                  <div className="step-icon modern-icon">👤</div>
                  <div className="step-info">
                    <strong className="modern-step-title">Purchased by Consumer</strong>
                    <span className="modern-step-value">{formatAddress(item.consumer)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="info-qr-row modern-info-qr">
            <div className="detail-card modern-card">
              <h4 className="modern-card-title">🌍 Product Information</h4>
              <div className="detail-list modern-list">
                <div className="detail-item modern-item">
                  <strong className="modern-label">Name:</strong>
                  <span className="modern-value">{item.name}</span>
                </div>
                <div className="detail-item modern-item">
                  <strong className="modern-label">Origin:</strong>
                  <span className="modern-value">{item.origin}</span>
                </div>
                <div className="detail-item modern-item">
                  <strong className="modern-label">Quality:</strong>
                  <span className="quality-badge modern-quality">{item.quality}</span>
                </div>
                <div className="detail-item modern-item">
                  <strong className="modern-label">Price:</strong>
                  <span className="modern-value">{item.price} wei</span>
                </div>
              </div>
            </div>

            <div className="detail-card modern-card qr-card modern-qr">
              <h4 className="modern-card-title">📱 QR Code</h4>
              <div className="qr-section modern-qr-section">
                <QRCodeSVG 
                  value={`AgriChain Item #${item.id}: ${item.name} from ${item.origin}`}
                  size={150}
                  bgColor="#ffffff"
                  fgColor="#2d5a87"
                  level="M"
                />
                <p className="qr-text modern-qr-text">Scan to verify authenticity</p>
              </div>
            </div>
          </div>

          <div className="verification-badge modern-verification">
            <div className="verification-icon modern-icon">✅</div>
            <div className="verification-text modern-verification-text">
              <strong className="modern-verified-title">Blockchain Verified</strong>
              <p className="modern-verified-desc">This item is authentic and traceable on the AgriChain network</p>
            </div>
          </div>
        </div>
      )}

      {!item && !isLoading && (
        <div className="empty-state modern-empty">
          <div className="empty-icon modern-icon">🔍</div>
          <h3 className="modern-empty-title">Ready to Track</h3>
          <p className="modern-empty-desc">Enter an item ID above to view its complete supply chain history and verify its authenticity.</p>
        </div>
      )}
    </div>
  );
};

export default TrackItem;
