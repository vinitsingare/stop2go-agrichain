import React, { useState, useEffect } from 'react';
import PriceBreakdown from './PriceBreakdown';

const DistributorPanel = ({ selectedAccount, addNotification }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [marginInputs, setMarginInputs] = useState({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      addNotification('❌ Error fetching items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const shipItem = async (itemId) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/ship-by-distributor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          account: selectedAccount
        })
      });

      if (response.ok) {
        addNotification('✅ Item shipped successfully!', 'success');
        fetchItems(); // Refresh items
      } else {
        const error = await response.text();
        addNotification(`❌ Shipping failed: ${error}`, 'error');
      }
    } catch (error) {
      addNotification('❌ Error shipping item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const setMargin = async (itemId, margin) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/set-distributor-margin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          account: selectedAccount,
          margin: margin
        })
      });

      if (response.ok) {
        addNotification('✅ Margin set successfully!', 'success');
        fetchItems(); // Refresh items
        setMarginInputs(prev => ({ ...prev, [itemId]: '' })); // Clear input
      } else {
        const error = await response.text();
        addNotification(`❌ Failed to set margin: ${error}`, 'error');
      }
    } catch (error) {
      addNotification('❌ Error setting margin', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const purchaseItem = async (itemId, price) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/purchase-by-distributor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          account: selectedAccount,
          price: price
        })
      });

      if (response.ok) {
        addNotification('✅ Item purchased successfully!', 'success');
        fetchItems(); // Refresh items
      } else {
        const error = await response.text();
        addNotification(`❌ Purchase failed: ${error}`, 'error');
      }
    } catch (error) {
      addNotification('❌ Error purchasing item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStateName = (state) => {
    const states = ['Harvested', 'For Sale by Farmer', 'Purchased by Distributor', 'Shipped by Distributor', 'Received by Retailer', 'For Sale by Retailer', 'Purchased by Consumer'];
    return states[parseInt(state)] || 'Unknown';
  };

  const getAvailableItems = () => {
    return items.filter(item => 
      (item.state === '0' || item.state === 0) || // Harvested - can purchase
      ((item.state === '2' || item.state === 2) && item.distributor === selectedAccount) || // Purchased by this distributor - can set margin and ship
      ((item.state === '3' || item.state === 3) && item.distributor === selectedAccount) // Shipped by this distributor - view status
    );
  };

  if (isLoading) {
    return (
      <div className="role-panel">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading items...</p>
        </div>
      </div>
    );
  }

  const availableItems = getAvailableItems();

  return (
    <div className="role-panel">
      <div className="panel-header">
        <h2>🏪 Distributor Panel</h2>
        <p>Account: {selectedAccount}</p>
      </div>

      <div className="actions-section">
        <h3>Available Actions</h3>
        <div className="supply-chain-info">
          <p><strong>Supply Chain Flow:</strong> Distributors purchase items from farmers → Ship them → Retailers receive → Purchase from distributors → Sell to consumers</p>
        </div>
        <div className="items-grid">
          {availableItems.length === 0 ? (
            <div className="no-items">
              <p>No items available for your actions</p>
            </div>
          ) : (
            availableItems.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-header">
                  <h4>{item.name}</h4>
                  <span className={`status-badge state-${item.state}`}>
                    {getStateName(item.state)}
                  </span>
                </div>
                <div className="item-details">
                  <p><strong>Origin:</strong> {item.origin}</p>
                  <p><strong>Quality:</strong> {item.quality}</p>
                  <p><strong>Price:</strong> {item.price} wei</p>
                  <p><strong>Farmer:</strong> {item.farmer.slice(0, 6)}...{item.farmer.slice(-4)}</p>
                  <p><strong>Distributor:</strong> {item.distributor.slice(0, 6)}...{item.distributor.slice(-4)}</p>
                </div>
                <div className="item-actions">
                  {(item.state === '0' || item.state === 0) && (
                    <button 
                      className="action-button purchase"
                      onClick={() => purchaseItem(item.id, item.price)}
                      disabled={actionLoading}
                    >
                      Purchase from Farmer
                    </button>
                  )}
                  {((item.state === '2' || item.state === 2) && item.distributor === selectedAccount) && (
                    <div className="margin-section">
                      <div className="margin-input-group">
                        <label>Set Your Distributor Margin (wei):</label>
                        <input
                          type="number"
                          placeholder="Enter margin (e.g., 500)"
                          value={marginInputs[item.id] || ''}
                          onChange={(e) => setMarginInputs(prev => ({ 
                            ...prev, 
                            [item.id]: e.target.value 
                          }))}
                        />
                        <button 
                          className="action-button margin"
                          onClick={() => setMargin(item.id, marginInputs[item.id])}
                          disabled={actionLoading || !marginInputs[item.id]}
                        >
                          Set Margin
                        </button>
                      </div>
                      <button 
                        className="action-button ship"
                        onClick={() => shipItem(item.id)}
                        disabled={actionLoading}
                      >
                        Ship Item
                      </button>
                      <div className="price-info">
                        <small>Current price: {item.price} wei</small>
                      </div>
                    </div>
                  )}
                  {((item.state === '3' || item.state === 3) && item.distributor === selectedAccount) && (
                    <div className="action-info">
                      <span className="shipped-badge">✅ Shipped</span>
                      <p className="action-help">This item has been shipped to retailer.</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributorPanel;
