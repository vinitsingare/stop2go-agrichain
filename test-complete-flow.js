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

async function testCompleteFlow() {
  try {
    console.log('🌾 Testing Complete AgriChain Supply Chain Flow...\n');
    
    const accounts = await web3.eth.getAccounts();
    const farmer = accounts[0];
    const distributor = accounts[1];
    const retailer = accounts[2];
    const consumer = accounts[3];
    
    console.log('👥 Accounts:');
    console.log(`Farmer: ${farmer}`);
    console.log(`Distributor: ${distributor}`);
    console.log(`Retailer: ${retailer}`);
    console.log(`Consumer: ${consumer}\n`);
    
    // Step 1: Register roles
    console.log('📝 Step 1: Registering roles...');
    await contract.methods.addFarmer(farmer).send({ from: farmer, gas: 3000000 });
    await contract.methods.addDistributor(distributor).send({ from: distributor, gas: 3000000 });
    await contract.methods.addRetailer(retailer).send({ from: retailer, gas: 3000000 });
    console.log('✅ All roles registered\n');
    
    // Step 2: Farmer harvests item
    console.log('🌾 Step 2: Farmer harvesting item...');
    await contract.methods.harvestItem('Test Apple', 'Test Farm', 1000, 'Premium').send({
      from: farmer,
      gas: 3000000
    });
    console.log('✅ Item harvested\n');
    
    // Step 3: Distributor purchases item
    console.log('🚚 Step 3: Distributor purchasing item...');
    await contract.methods.purchaseByDistributor(1).send({
      from: distributor,
      value: 1000,
      gas: 3000000
    });
    console.log('✅ Item purchased by distributor\n');
    
    // Step 4: Distributor ships item
    console.log('📦 Step 4: Distributor shipping item...');
    await contract.methods.shipByDistributor(1).send({
      from: distributor,
      gas: 3000000
    });
    console.log('✅ Item shipped by distributor\n');
    
    // Step 5: Retailer receives item
    console.log('🏪 Step 5: Retailer receiving item...');
    await contract.methods.receiveByRetailer(1).send({
      from: retailer,
      gas: 3000000
    });
    console.log('✅ Item received by retailer\n');
    
    // Step 6: Retailer purchases item
    console.log('💰 Step 6: Retailer purchasing item...');
    await contract.methods.purchaseByRetailer(1).send({
      from: retailer,
      value: 1000,
      gas: 3000000
    });
    console.log('✅ Item purchased by retailer\n');
    
    // Step 7: Consumer purchases item
    console.log('🛒 Step 7: Consumer purchasing item...');
    await contract.methods.purchaseByConsumer(1).send({
      from: consumer,
      value: 1000,
      gas: 3000000
    });
    console.log('✅ Item purchased by consumer\n');
    
    // Final state
    console.log('📊 Final Item State:');
    const item = await contract.methods.getItem(1).call();
    const stateName = await contract.methods.getStateName(item.state).call();
    console.log(`State: ${stateName}`);
    console.log(`Farmer: ${item.farmer}`);
    console.log(`Distributor: ${item.distributor}`);
    console.log(`Retailer: ${item.retailer}`);
    console.log(`Consumer: ${item.consumer}`);
    
    console.log('\n🎉 Complete supply chain flow tested successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCompleteFlow();

