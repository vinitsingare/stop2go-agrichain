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

async function testPriceTracking() {
  try {
    console.log('🌾 Testing Price Tracking & Margin Features...\n');
    
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
    await contract.methods.addDistributor(distributor).send({ from: farmer, gas: 3000000 });
    await contract.methods.addRetailer(retailer).send({ from: farmer, gas: 3000000 });
    console.log('✅ All roles registered\n');
    
    // Step 2: Farmer harvests item
    console.log('🌾 Step 2: Farmer harvesting item...');
    const farmerPrice = 1000; // 1000 wei
    await contract.methods.harvestItem('Organic Tomatoes', 'Maharashtra', farmerPrice, 'Premium').send({
      from: farmer,
      gas: 3000000
    });
    console.log(`✅ Item harvested with farmer price: ${farmerPrice} wei\n`);
    
    // Step 3: Check initial price breakdown
    console.log('💰 Step 3: Initial price breakdown...');
    const breakdown1 = await contract.methods.getPriceBreakdown(1).call();
    console.log(`Farmer Price: ${breakdown1.farmerPrice} wei`);
    console.log(`Distributor Price: ${breakdown1.distributorPrice} wei`);
    console.log(`Retailer Price: ${breakdown1.retailerPrice} wei`);
    console.log(`Total Margins: ${breakdown1.totalMargin} wei\n`);
    
    // Step 4: Distributor purchases item
    console.log('🚚 Step 4: Distributor purchasing item...');
    await contract.methods.purchaseByDistributor(1).send({
      from: distributor,
      value: farmerPrice,
      gas: 3000000
    });
    console.log('✅ Item purchased by distributor\n');
    
    // Step 5: Distributor sets margin
    console.log('💵 Step 5: Distributor setting margin...');
    const distributorMargin = 200; // 200 wei margin
    await contract.methods.setDistributorMargin(1, distributorMargin).send({
      from: distributor,
      gas: 3000000
    });
    console.log(`✅ Distributor margin set: ${distributorMargin} wei\n`);
    
    // Step 6: Check price after distributor margin
    console.log('💰 Step 6: Price after distributor margin...');
    const breakdown2 = await contract.methods.getPriceBreakdown(1).call();
    console.log(`Farmer Price: ${breakdown2.farmerPrice} wei`);
    console.log(`Distributor Margin: ${breakdown2.distributorMargin} wei`);
    console.log(`Distributor Price: ${breakdown2.distributorPrice} wei`);
    console.log(`Retailer Price: ${breakdown2.retailerPrice} wei`);
    console.log(`Total Margins: ${breakdown2.totalMargin} wei\n`);
    
    // Step 7: Distributor ships item
    console.log('📦 Step 7: Distributor shipping item...');
    await contract.methods.shipByDistributor(1).send({
      from: distributor,
      gas: 3000000
    });
    console.log('✅ Item shipped by distributor\n');
    
    // Step 8: Retailer receives item
    console.log('🏪 Step 8: Retailer receiving item...');
    await contract.methods.receiveByRetailer(1).send({
      from: retailer,
      gas: 3000000
    });
    console.log('✅ Item received by retailer\n');
    
    // Step 9: Retailer sets margin
    console.log('💵 Step 9: Retailer setting margin...');
    const retailerMargin = 300; // 300 wei margin
    await contract.methods.setRetailerMargin(1, retailerMargin).send({
      from: retailer,
      gas: 3000000
    });
    console.log(`✅ Retailer margin set: ${retailerMargin} wei\n`);
    
    // Step 10: Check final price breakdown
    console.log('💰 Step 10: Final price breakdown...');
    const breakdown3 = await contract.methods.getPriceBreakdown(1).call();
    console.log(`Farmer Price: ${breakdown3.farmerPrice} wei`);
    console.log(`Distributor Margin: ${breakdown3.distributorMargin} wei (${Math.round((breakdown3.distributorMargin / breakdown3.farmerPrice) * 100)}%)`);
    console.log(`Distributor Price: ${breakdown3.distributorPrice} wei`);
    console.log(`Retailer Margin: ${breakdown3.retailerMargin} wei (${Math.round((breakdown3.retailerMargin / breakdown3.distributorPrice) * 100)}%)`);
    console.log(`Final Retailer Price: ${breakdown3.retailerPrice} wei`);
    console.log(`Total Margins: ${breakdown3.totalMargin} wei`);
    console.log(`Total Price Increase: ${Math.round((breakdown3.totalMargin / breakdown3.farmerPrice) * 100)}%\n`);
    
    // Step 11: Retailer purchases from distributor
    console.log('🛒 Step 11: Retailer purchasing from distributor...');
    await contract.methods.purchaseByRetailer(1).send({
      from: retailer,
      value: breakdown3.distributorPrice,
      gas: 3000000
    });
    console.log('✅ Item purchased by retailer\n');
    
    // Step 12: Consumer purchases final product
    console.log('🛒 Step 12: Consumer purchasing final product...');
    await contract.methods.purchaseByConsumer(1).send({
      from: consumer,
      value: breakdown3.retailerPrice,
      gas: 3000000
    });
    console.log('✅ Item purchased by consumer\n');
    
    // Final summary
    console.log('🎉 PRICE TRACKING SUMMARY:');
    console.log('========================');
    console.log(`🌾 Farmer Price: ${breakdown3.farmerPrice} wei`);
    console.log(`🚚 Distributor Margin: ${breakdown3.distributorMargin} wei`);
    console.log(`🏪 Retailer Margin: ${breakdown3.retailerMargin} wei`);
    console.log(`💰 Final Consumer Price: ${breakdown3.retailerPrice} wei`);
    console.log(`📈 Total Price Increase: ${breakdown3.totalMargin} wei (${Math.round((breakdown3.totalMargin / breakdown3.farmerPrice) * 100)}%)`);
    console.log('\n✅ Complete price tracking flow successful!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPriceTracking();


