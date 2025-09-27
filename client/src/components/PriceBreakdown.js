import React, { useState, useEffect } from 'react';

const PriceBreakdown = ({ itemId, addNotification }) => {
  const [breakdown, setBreakdown] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (itemId) {
      fetchPriceBreakdown();
    }
  }, [itemId]);

  const fetchPriceBreakdown = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/price-breakdown/${itemId}`);
      if (response.ok) {
        const data = await response.json();
        setBreakdown(data);
      } else {
        addNotification('❌ Failed to fetch price breakdown', 'error');
      }
    } catch (error) {
      addNotification(`❌ Error fetching price breakdown: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `${parseInt(price)} wei`;
  };

  const calculatePercentage = (margin, basePrice) => {
    if (parseInt(basePrice) === 0) return '0%';
    return `${Math.round((parseInt(margin) / parseInt(basePrice)) * 100)}%`;
  };

  if (isLoading) {
    return (
      <div className="price-breakdown">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading price breakdown...</p>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="price-breakdown">
        <p>No price breakdown available</p>
      </div>
    );
  }

  return (
    <div className="price-breakdown">
      <h3>💰 Price Transparency</h3>
      <div className="price-flow">
        <div className="price-step farmer">
          <div className="step-header">
            <span className="step-icon">🌾</span>
            <span className="step-label">Farmer</span>
          </div>
          <div className="step-price">
            <span className="price-label">Base Price:</span>
            <span className="price-value">{formatPrice(breakdown.farmerPrice)}</span>
          </div>
        </div>

        <div className="price-arrow">→</div>

        <div className="price-step distributor">
          <div className="step-header">
            <span className="step-icon">🚚</span>
            <span className="step-label">Distributor</span>
          </div>
          <div className="step-details">
            <div className="margin-info">
              <span className="margin-label">Margin:</span>
              <span className="margin-value">{formatPrice(breakdown.distributorMargin)}</span>
              <span className="margin-percentage">
                ({calculatePercentage(breakdown.distributorMargin, breakdown.farmerPrice)})
              </span>
            </div>
            <div className="step-price">
              <span className="price-label">Price:</span>
              <span className="price-value">{formatPrice(breakdown.distributorPrice)}</span>
            </div>
          </div>
        </div>

        <div className="price-arrow">→</div>

        <div className="price-step retailer">
          <div className="step-header">
            <span className="step-icon">🏪</span>
            <span className="step-label">Retailer</span>
          </div>
          <div className="step-details">
            <div className="margin-info">
              <span className="margin-label">Margin:</span>
              <span className="margin-value">{formatPrice(breakdown.retailerMargin)}</span>
              <span className="margin-percentage">
                ({calculatePercentage(breakdown.retailerMargin, breakdown.distributorPrice)})
              </span>
            </div>
            <div className="step-price">
              <span className="price-label">Final Price:</span>
              <span className="price-value final">{formatPrice(breakdown.retailerPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="price-summary">
        <div className="summary-item">
          <span className="summary-label">Total Margins:</span>
          <span className="summary-value">{formatPrice(breakdown.totalMargin)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Price Increase:</span>
          <span className="summary-value">
            {calculatePercentage(breakdown.totalMargin, breakdown.farmerPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;

