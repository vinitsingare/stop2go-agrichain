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

async function checkItemStates() {
  try {
    console.log('🔍 Checking current item states...\n');
    
    const itemCounter = await contract.methods.itemCounter().call();
    console.log(`Total items: ${itemCounter}\n`);
    
    for (let i = 1; i <= parseInt(itemCounter); i++) {
      try {
        const item = await contract.methods.getItem(i).call();
        const stateName = await contract.methods.getStateName(item.state).call();
        
        console.log(`📦 Item ${i}: ${item.name}`);
        console.log(`   State: ${stateName} (${item.state})`);
        console.log(`   Farmer: ${item.farmer}`);
        console.log(`   Distributor: ${item.distributor}`);
        console.log(`   Retailer: ${item.retailer}`);
        console.log(`   Consumer: ${item.consumer}`);
        console.log(`   Price: ${item.price} wei`);
        console.log('');
      } catch (error) {
        console.log(`❌ Error reading item ${i}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkItemStates();

