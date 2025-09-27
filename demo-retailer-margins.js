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

async function demoRetailerMargins() {
  try {
    console.log('🛒 RETAILER MARGIN DEMO - COMPLETE FLOW');
    console.log('=========================================');
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
    const farmerPrice = 500; // ₹500 equivalent in wei
    await contract.methods.harvestItem(
      'Fresh Tomatoes',
      'Punjab, India', 
      farmerPrice,
      'Grade A'
    ).send({ from: farmer, gas: 3000000 });
    
    const itemId = 2; // This will be item 2
    console.log(`✅ Item harvested! ID: ${itemId}`);
    console.log(`   📦 Product: Fresh Tomatoes`);
    console.log(`   📍 Origin: Punjab, India`);
    console.log(`   💰 Farmer Price: ${farmerPrice} wei (₹500)`);
    console.log(`   ⭐ Quality: Grade A`);
    console.log('');

    // Step 3: Distributor purchases and sets margin
    console.log('🚚 STEP 3: DISTRIBUTOR ADDS MARGIN');
    console.log('==================================');
    await contract.methods.purchaseByDistributor(itemId).send({ 
      from: distributor, 
      value: farmerPrice, 
      gas: 3000000 
    });
    console.log(`✅ Distributor purchased from farmer for ${farmerPrice} wei`);

    const distributorMargin = 150; // ₹150 distributor margin
    await contract.methods.setDistributorMargin(itemId, distributorMargin).send({ 
      from: distributor, 
      gas: 3000000 
    });
    const distributorPrice = farmerPrice + distributorMargin;
    console.log(`✅ Distributor set margin: ${distributorMargin} wei (₹150)`);
    console.log(`✅ New price for retailer: ${distributorPrice} wei (₹650)`);

    await contract.methods.shipItem(itemId).send({ from: distributor, gas: 3000000 });
    console.log('✅ Item shipped by distributor');
    console.log('');

    // Step 4: Retailer receives and sets margin
    console.log('🏪 STEP 4: RETAILER ADDS THEIR MARGIN');
    console.log('=====================================');
    await contract.methods.receiveByRetailer(itemId).send({ from: retailer, gas: 3000000 });
    console.log('✅ Item received by retailer');

    const retailerMargin = 200; // ₹200 retailer margin
    await contract.methods.setRetailerMargin(itemId, retailerMargin).send({ 
      from: retailer, 
      gas: 3000000 
    });
    console.log(`✅ Retailer set margin: ${retailerMargin} wei (₹200)`);
    
    const retailerPrice = distributorPrice + retailerMargin;
    console.log(`✅ Final consumer price: ${retailerPrice} wei (₹850)`);

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
    await contract.methods.purchaseByConsumer(itemId).send({ 
      from: consumer, 
      value: retailerPrice, 
      gas: 3000000 
    });
    console.log(`✅ Consumer purchased for ${retailerPrice} wei (₹850)`);
    console.log('');

    // Step 6: Show complete price breakdown with retailer margins
    console.log('💰 STEP 6: COMPLETE PRICE BREAKDOWN');
    console.log('====================================');
    const breakdown = await contract.methods.getPriceBreakdown(itemId).call();
    const totalMargin = parseInt(breakdown.totalMargin.toString());
    const priceIncrease = Math.round((totalMargin / farmerPrice) * 100);
    
    console.log('🌾 FARMER PRICE:       ' + breakdown.farmerPrice.toString() + ' wei (₹500)');
    console.log('🚚 DISTRIBUTOR MARGIN: ' + breakdown.distributorMargin.toString() + ' wei (₹150) - 30%');
    console.log('🚚 DISTRIBUTOR PRICE:  ' + breakdown.distributorPrice.toString() + ' wei (₹650)');
    console.log('🏪 RETAILER MARGIN:    ' + breakdown.retailerMargin.toString() + ' wei (₹200) - 31%'); 
    console.log('🏪 FINAL CONSUMER PRICE: ' + breakdown.retailerPrice.toString() + ' wei (₹850)');
    console.log('📈 TOTAL MARGINS:      ' + totalMargin + ' wei (₹350)');
    console.log('📊 TOTAL PRICE INCREASE: ' + priceIncrease + '%');
    console.log('');

    // Breakdown percentages
    const distributorPercent = Math.round((parseInt(breakdown.distributorMargin.toString()) / farmerPrice) * 100);
    const retailerPercent = Math.round((parseInt(breakdown.retailerMargin.toString()) / distributorPrice) * 100);

    console.log('📊 MARGIN ANALYSIS:');
    console.log('===================');
    console.log(`🚚 Distributor adds ${distributorPercent}% to farmer price`);
    console.log(`🏪 Retailer adds ${retailerPercent}% to distributor price`);
    console.log(`👤 Consumer pays ${priceIncrease}% more than farmer price`);
    console.log('');
    
    console.log('🎯 RETAILER MARGIN TRACKING COMPLETE!');
    console.log('=====================================');
    console.log('✅ Farmer gets: ₹500');
    console.log('✅ Distributor gets: ₹150 margin');
    console.log('✅ Retailer gets: ₹200 margin');
    console.log('✅ Consumer pays: ₹850 total');
    console.log('✅ Full transparency of who gets what!');
    console.log('');
    console.log(`🔍 Test this in your app: Item ID ${itemId}`);
    console.log(`💰 Price breakdown API: http://localhost:5000/price-breakdown/${itemId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

demoRetailerMargins();