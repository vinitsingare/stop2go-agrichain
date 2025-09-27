const { Web3 } = require('web3');

const web3 = new Web3('http://127.0.0.1:7545');

// Load the contract
const contractJSON = require('./build/contracts/AgriSupplyChain.json');
const contractABI = contractJSON.abi;
const networkId = '1758097798747';
const deployed = contractJSON.networks && contractJSON.networks[networkId];
if (!deployed || !deployed.address) {
  console.error('Contract not deployed. Run: npx truffle migrate --reset');
  process.exit(1);
}
const contractAddress = deployed.address;
const contract = new web3.eth.Contract(contractABI, contractAddress);

async function demoCompleteSupplyChain() {
  try {
    console.log('🌾 COMPLETE SUPPLY CHAIN DEMO');
    console.log('========================================');
    console.log(`Contract Address: ${contractAddress}`);
    console.log('');

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const farmer = accounts[0];
    const distributor = accounts[1]; 
    const retailer = accounts[2];
    const consumer = accounts[3];

    console.log('👥 PARTICIPANTS:');
    console.log(`🌾 Farmer:      ${farmer}`);
    console.log(`🚚 Distributor: ${distributor}`);
    console.log(`🏪 Retailer:    ${retailer}`);
    console.log(`👤 Consumer:    ${consumer}`);
    console.log('');

    // Step 1: Register participants
    console.log('📋 STEP 1: REGISTERING PARTICIPANTS');
    console.log('=====================================');
    
    await contract.methods.addFarmer(farmer).send({ from: farmer, gas: 3000000 });
    console.log('✅ Farmer registered');
    
    await contract.methods.addDistributor(distributor).send({ from: distributor, gas: 3000000 });
    console.log('✅ Distributor registered');
    
    await contract.methods.addRetailer(retailer).send({ from: retailer, gas: 3000000 });
    console.log('✅ Retailer registered');
    console.log('');

    // Step 2: Farmer harvests item
    console.log('🌱 STEP 2: FARMER HARVESTS ITEM');
    console.log('================================');
    const farmerPrice = 1000; // 1000 wei
    const tx1 = await contract.methods.harvestItem(
      'Premium Mangoes',
      'Maharashtra, India', 
      farmerPrice,
      'Grade A+'
    ).send({ from: farmer, gas: 3000000 });
    
    const itemId = 1;
    console.log(`✅ Item harvested! ID: ${itemId}`);
    console.log(`   📦 Product: Premium Mangoes`);
    console.log(`   📍 Origin: Maharashtra, India`);
    console.log(`   💰 Farmer Price: ${farmerPrice} wei`);
    console.log(`   ⭐ Quality: Grade A+`);
    console.log('');

    // Step 3: Distributor purchases and sets margin
    console.log('🚚 STEP 3: DISTRIBUTOR PROCESSES');
    console.log('=================================');
    await contract.methods.purchaseByDistributor(itemId).send({ 
      from: distributor, 
      value: farmerPrice, 
      gas: 3000000 
    });
    console.log(`✅ Distributor purchased item for ${farmerPrice} wei`);

    const distributorMargin = 300; // 300 wei margin (30% of farmer price)
    await contract.methods.setDistributorMargin(itemId, distributorMargin).send({ 
      from: distributor, 
      gas: 3000000 
    });
    console.log(`✅ Distributor set margin: ${distributorMargin} wei (30%)`);

    await contract.methods.shipItem(itemId).send({ from: distributor, gas: 3000000 });
    console.log('✅ Item shipped by distributor');
    console.log('');

    // Step 4: Retailer receives and sets margin
    console.log('🏪 STEP 4: RETAILER PROCESSES');
    console.log('==============================');
    await contract.methods.receiveByRetailer(itemId).send({ from: retailer, gas: 3000000 });
    console.log('✅ Item received by retailer');

    const retailerMargin = 200; // 200 wei margin
    await contract.methods.setRetailerMargin(itemId, retailerMargin).send({ 
      from: retailer, 
      gas: 3000000 
    });
    console.log(`✅ Retailer set margin: ${retailerMargin} wei`);

    const distributorPrice = farmerPrice + distributorMargin;
    await contract.methods.purchaseByRetailer(itemId).send({ 
      from: retailer, 
      value: distributorPrice, 
      gas: 3000000 
    });
    console.log(`✅ Retailer purchased from distributor for ${distributorPrice} wei`);
    console.log('');

    // Step 5: Consumer purchases
    console.log('👤 STEP 5: CONSUMER PURCHASE');
    console.log('=============================');
    const retailerPrice = distributorPrice + retailerMargin;
    await contract.methods.purchaseByConsumer(itemId).send({ 
      from: consumer, 
      value: retailerPrice, 
      gas: 3000000 
    });
    console.log(`✅ Consumer purchased for ${retailerPrice} wei`);
    console.log('');

    // Step 6: Show complete price breakdown
    console.log('💰 STEP 6: PRICE TRANSPARENCY');
    console.log('==============================');
    const breakdown = await contract.methods.getPriceBreakdown(itemId).call();
    const totalMargin = parseInt(breakdown.totalMargin.toString());
    const priceIncrease = Math.round((totalMargin / farmerPrice) * 100);
    
    console.log('🌾 FARMER PRICE:       ' + breakdown.farmerPrice.toString() + ' wei');
    console.log('🚚 DISTRIBUTOR MARGIN: ' + breakdown.distributorMargin.toString() + ' wei');
    console.log('🚚 DISTRIBUTOR PRICE:  ' + breakdown.distributorPrice.toString() + ' wei');
    console.log('🏪 RETAILER MARGIN:    ' + breakdown.retailerMargin.toString() + ' wei');
    console.log('🏪 FINAL PRICE:        ' + breakdown.retailerPrice.toString() + ' wei');
    console.log('📈 TOTAL MARGIN:       ' + totalMargin + ' wei');
    console.log('📊 PRICE INCREASE:     ' + priceIncrease + '%');
    console.log('');

    // Step 7: Final item details
    console.log('📦 STEP 7: FINAL ITEM DETAILS');
    console.log('==============================');
    const item = await contract.methods.items(itemId).call();
    const stateNames = [
      'Harvested', 
      'ForSaleByFarmer', 
      'PurchasedByDistributor', 
      'ShippedByDistributor', 
      'ReceivedByRetailer', 
      'ForSaleByRetailer', 
      'PurchasedByConsumer'
    ];
    
    console.log(`📦 Item ID: ${item[0].toString()}`);
    console.log(`🍎 Name: ${item[1]}`);
    console.log(`📍 Origin: ${item[2]}`);
    console.log(`⭐ Quality: ${item[6]}`);
    console.log(`📊 Status: ${stateNames[parseInt(item[7].toString())]}`);
    console.log(`🌾 Farmer: ${item[8]}`);
    console.log(`🚚 Distributor: ${item[9]}`);
    console.log(`🏪 Retailer: ${item[10]}`);
    console.log(`👤 Consumer: ${item[11]}`);
    console.log('');

    console.log('🎉 SUPPLY CHAIN COMPLETE!');
    console.log('==========================');
    console.log('The consumer can now track the complete journey of their');
    console.log('Premium Mangoes from farm to their table, including:');
    console.log('✅ Origin and quality information');
    console.log('✅ Complete price breakdown and transparency');
    console.log('✅ All participants in the supply chain');
    console.log('✅ Current status and ownership');
    console.log('');
    console.log(`🔍 Test tracking: http://localhost:3000 → Track Item → Enter ID: ${itemId}`);
    console.log(`💰 Test price breakdown: http://localhost:5000/price-breakdown/${itemId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

demoCompleteSupplyChain();