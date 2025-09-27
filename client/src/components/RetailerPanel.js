import React, { useState, useEffect } from 'react';
import PriceBreakdown from './PriceBreakdown';

const RetailerPanel = ({ selectedAccount, addNotification }) => {
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

  const receiveItem = async (itemId) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/receive-by-retailer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          account: selectedAccount
        })
      });

      if (response.ok) {
        addNotification('✅ Item received successfully!', 'success');
        fetchItems(); // Refresh items
      } else {
        const error = await response.text();
        addNotification(`❌ Receipt failed: ${error}`, 'error');
      }
    } catch (error) {
      addNotification('❌ Error receiving item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const setMargin = async (itemId, margin) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/set-retailer-margin', {
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
      const response = await fetch('http://localhost:5000/purchase-by-retailer', {
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
      item.state === '2' || item.state === 2 || // Purchased by Distributor - can receive (if distributor ships)
      item.state === '3' || item.state === 3 || // Shipped by Distributor - can receive
      ((item.state === '4' || item.state === 4) && item.retailer === selectedAccount) // Received by this retailer - can purchase
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
        <h2>🏪 Retailer Panel</h2>
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
                  {(item.state === '2' || item.state === 2) && (
                    <div className="action-info">
                      <span className="waiting-badge">⏳ Waiting for Distributor to Ship</span>
                      <p className="action-help">This item has been purchased by a distributor but not yet shipped.</p>
                    </div>
                  )}
                  {(item.state === '3' || item.state === 3) && (
                    <button 
                      className="action-button receive"
                      onClick={() => receiveItem(item.id)}
                      disabled={actionLoading}
                    >
                      Receive Item
                    </button>
                  )}
                  {((item.state === '4' || item.state === 4) && item.retailer === selectedAccount) && (
                    <div className="margin-section">
                      <div className="margin-input-group">
                        <label>Set Your Retail Margin (wei):</label>
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
                        className="action-button purchase"
                        onClick={() => purchaseItem(item.id, item.distributorPrice || item.price)}
                        disabled={actionLoading}
                      >
                        Purchase from Distributor
                      </button>
                      <div className="price-info">
                        <small>You'll pay: {item.distributorPrice || item.price} wei to distributor</small>
                      </div>
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

export default RetailerPanel;
