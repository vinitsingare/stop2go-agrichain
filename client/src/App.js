import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddFarmer from './components/AddFarmer';
import HarvestItem from './components/HarvestItem';
import TrackItem from './components/TrackItem';
import RoleSelector from './components/RoleSelector';
import DistributorPanel from './components/DistributorPanel';
import RetailerPanel from './components/RetailerPanel';
import ConsumerPanel from './components/ConsumerPanel';
import Footer from './components/Footer';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Fetch accounts from blockchain on app load
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('http://localhost:5000/accounts');
        if (response.ok) {
          const accountsList = await response.json();
          setAccounts(accountsList.slice(0, 5)); // Use first 5 accounts
          console.log('Loaded accounts:', accountsList.slice(0, 5));
        } else {
          console.error('Failed to fetch accounts');
          addNotification('❌ Failed to load blockchain accounts', 'error');
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        addNotification('❌ Error connecting to blockchain', 'error');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleRoleSelect = async (role, account) => {
    setSelectedRole(role);
    setSelectedAccount(account);
    setActiveTab('role-panel');
    
    // Automatically register the user in their selected role
    try {
      let endpoint = '';
      if (role === 'farmer') {
        endpoint = '/addfarmer';
      } else if (role === 'distributor') {
        endpoint = '/adddistributor';
      } else if (role === 'retailer') {
        endpoint = '/addretailer';
      }
      
      if (endpoint) {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account })
        });
        
        if (response.ok) {
          addNotification(`✅ Registered as ${role} and selected account ${account.slice(0, 6)}...${account.slice(-4)}`, 'success');
        } else {
          addNotification(`⚠️ Selected as ${role} but registration failed. You may need to register manually.`, 'warning');
        }
      } else {
        addNotification(`✅ Selected as ${role} with account ${account.slice(0, 6)}...${account.slice(-4)}`, 'success');
      }
    } catch (error) {
      addNotification(`⚠️ Selected as ${role} but registration failed: ${error.message}`, 'warning');
    }
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setSelectedAccount(null);
    setActiveTab('role-selector');
  };

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <div className="container">
          {notifications.length > 0 && (
            <div className="notifications">
              {notifications.map(notification => (
                <div key={notification.id} className={`notification ${notification.type}`}>
                  {notification.message}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'role-selector' && (
            isLoadingAccounts ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading blockchain accounts...</p>
              </div>
            ) : (
              <RoleSelector accounts={accounts} onRoleSelect={handleRoleSelect} />
            )
          )}
          {activeTab === 'role-panel' && selectedRole && selectedAccount && (
            <>
              <div className="role-header">
                <button className="back-button" onClick={handleBackToRoleSelection}>
                  ← Back to Role Selection
                </button>
                <h2>Current Role: {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h2>
              </div>
              {selectedRole === 'farmer' && (
                <HarvestItem accounts={[selectedAccount]} selectedAccount={selectedAccount} addNotification={addNotification} />
              )}
              {selectedRole === 'distributor' && (
                <DistributorPanel selectedAccount={selectedAccount} addNotification={addNotification} />
              )}
              {selectedRole === 'retailer' && (
                <RetailerPanel selectedAccount={selectedAccount} addNotification={addNotification} />
              )}
              {selectedRole === 'consumer' && (
                <ConsumerPanel selectedAccount={selectedAccount} addNotification={addNotification} />
              )}
            </>
          )}
          {activeTab === 'track' && <TrackItem addNotification={addNotification} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
