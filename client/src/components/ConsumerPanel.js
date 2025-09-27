import React, { useState, useEffect } from 'react';
import PriceBreakdown from './PriceBreakdown';

const ConsumerPanel = ({ selectedAccount, addNotification }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  const purchaseItem = async (itemId, price) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/purchase-by-consumer', {
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
      item.state === '5' || item.state === 5 || // For Sale by Retailer - can purchase
      item.state === '4' || item.state === 4 || // Received by Retailer - waiting for retailer to purchase
      item.state === '3' || item.state === 3    // Shipped by Distributor - in transit
    );
  };

  const getPurchasedItems = () => {
    return items.filter(item => 
      item.state === '6' && item.consumer === selectedAccount
    ); // Purchased by this consumer
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
  const purchasedItems = getPurchasedItems();

  return (
    <div className="role-panel">
      <div className="panel-header">
        <h2>🛒 Consumer Panel</h2>
        <p>Account: {selectedAccount}</p>
      </div>

      <div className="actions-section">
        <h3>Available for Purchase</h3>
        <div className="supply-chain-info">
          <p><strong>Supply Chain Status:</strong> Items flow from Farmer → Distributor → Retailer → Consumer. You can purchase items that are "For Sale by Retailer".</p>
        </div>
        <div className="items-grid">
          {availableItems.length === 0 ? (
            <div className="no-items">
              <p>No items available for purchase</p>
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
                  <p><strong>Final Price:</strong> {item.retailerPrice} wei</p>
                  <p><strong>Farmer:</strong> {item.farmer.slice(0, 6)}...{item.farmer.slice(-4)}</p>
                  <p><strong>Distributor:</strong> {item.distributor.slice(0, 6)}...{item.distributor.slice(-4)}</p>
                  <p><strong>Retailer:</strong> {item.retailer.slice(0, 6)}...{item.retailer.slice(-4)}</p>
                </div>
                <div className="item-actions">
                  {(item.state === '3' || item.state === 3) && (
                    <div className="action-info">
                      <span className="waiting-badge">🚚 In Transit</span>
                      <p className="action-help">This item is being shipped by the distributor to the retailer.</p>
                    </div>
                  )}
                  {(item.state === '4' || item.state === 4) && (
                    <div className="action-info">
                      <span className="waiting-badge">🏪 At Retailer</span>
                      <p className="action-help">This item has been received by the retailer but not yet put up for sale.</p>
                    </div>
                  )}
                  {(item.state === '5' || item.state === 5) && (
                    <button 
                      className="action-button purchase"
                      onClick={() => purchaseItem(item.id, item.retailerPrice)}
                      disabled={actionLoading}
                    >
                      Purchase Item
                    </button>
                  )}
                </div>
                <PriceBreakdown itemId={item.id} addNotification={addNotification} />
              </div>
            ))
          )}
        </div>
      </div>

      {purchasedItems.length > 0 && (
        <div className="purchased-section">
          <h3>Your Purchased Items</h3>
          <div className="items-grid">
            {purchasedItems.map(item => (
              <div key={item.id} className="item-card purchased">
                <div className="item-header">
                  <h4>{item.name}</h4>
                  <span className={`status-badge state-${item.state}`}>
                    {getStateName(item.state)}
                  </span>
                </div>
                <div className="item-details">
                  <p><strong>Origin:</strong> {item.origin}</p>
                  <p><strong>Quality:</strong> {item.quality}</p>
                  <p><strong>Price Paid:</strong> {item.retailerPrice} wei</p>
                  <p><strong>Farmer:</strong> {item.farmer.slice(0, 6)}...{item.farmer.slice(-4)}</p>
                  <p><strong>Distributor:</strong> {item.distributor.slice(0, 6)}...{item.distributor.slice(-4)}</p>
                  <p><strong>Retailer:</strong> {item.retailer.slice(0, 6)}...{item.retailer.slice(-4)}</p>
                </div>
                <div className="item-actions">
                  <span className="purchased-badge">✅ Purchased</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerPanel;
