const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

const web3 = new Web3('http://127.0.0.1:7545');

// Load contract
const artifactPath = path.join(__dirname, 'build', 'contracts', 'AgriSupplyChain.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const contractABI = artifact.abi;
const networkId = '1758097798747';
const deployed = artifact.networks && artifact.networks[networkId];
const contract = new web3.eth.Contract(contractABI, deployed.address);

async function completeItem2Flow() {
  try {
    console.log('🔄 Completing the flow for Item 2...\n');
    
    const accounts = await web3.eth.getAccounts();
    const retailer = accounts[0]; // Same account that received the item
    
    // Check current state
    const item = await contract.methods.getItem(2).call();
    const stateName = await contract.methods.getStateName(item.state).call();
    console.log(`📦 Item 2 current state: ${stateName} (${item.state})`);
    console.log(`   Retailer: ${item.retailer}`);
    console.log(`   Price: ${item.price} wei`);
    console.log(`   State type: ${typeof item.state}, Value: ${item.state}\n`);
    
    if (item.state == 4) {
      console.log('💰 Step: Retailer purchasing item from distributor...');
      await contract.methods.purchaseByRetailer(2).send({
        from: retailer,
        value: item.price,
        gas: 3000000
      });
      console.log('✅ Item purchased by retailer\n');
      
      // Check new state
      const newItem = await contract.methods.getItem(2).call();
      const newStateName = await contract.methods.getStateName(newItem.state).call();
      console.log(`📦 Item 2 new state: ${newStateName} (${newItem.state})`);
      console.log('🎉 Item is now available for consumers to purchase!');
    } else {
      console.log(`❌ Item is not in the correct state for retailer purchase. Current state: ${stateName}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completeItem2Flow();
