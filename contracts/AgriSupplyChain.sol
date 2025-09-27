// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AgriSupplyChain {
    address public owner;
    uint public itemCounter = 0;

    enum State { Harvested, ForSaleByFarmer, PurchasedByDistributor, ShippedByDistributor, ReceivedByRetailer, ForSaleByRetailer, PurchasedByConsumer }

    struct Item {
        uint id;
        string name;
        string origin;
        uint farmerPrice;      // Original price from farmer
        uint distributorPrice; // Price after distributor margin
        uint retailerPrice;    // Price after retailer margin
        string quality;
        State state;
        address farmer;
        address distributor;
        address retailer;
        address consumer;
    }

    struct Margins {
        uint distributorMargin; // Margin added by distributor
        uint retailerMargin;    // Margin added by retailer
    }

    mapping(uint => Item) public items;
    mapping(uint => Margins) public itemMargins;

    mapping(address => bool) public isFarmer;
    mapping(address => bool) public isDistributor;
    mapping(address => bool) public isRetailer;

    event Harvested(uint id);
    event PurchasedByDistributor(uint id);
    event ShippedByDistributor(uint id);
    event ReceivedByRetailer(uint id);
    event PurchasedByRetailer(uint id);
    event PurchasedByConsumer(uint id);

    constructor() {
        owner = msg.sender;
    }

    function addFarmer(address _farmer) public { isFarmer[_farmer] = true; }
    function addDistributor(address _dist) public { isDistributor[_dist] = true; }
    function addRetailer(address _retailer) public { isRetailer[_retailer] = true; }

    function harvestItem(string memory _name, string memory _origin, uint _price, string memory _quality) public {
        require(isFarmer[msg.sender], "Only farmers can harvest");
        itemCounter++;
        items[itemCounter] = Item(
            itemCounter, 
            _name, 
            _origin, 
            _price,        // farmerPrice
            _price,        // distributorPrice (initially same)
            _price,        // retailerPrice (initially same)
            _quality, 
            State.Harvested, 
            msg.sender, 
            address(0), 
            address(0), 
            address(0)
        );
        itemMargins[itemCounter] = Margins(0, 0);
        emit Harvested(itemCounter);
    }

    function purchaseByDistributor(uint _id) public payable {
        Item storage item = items[_id];
        require(item.state == State.Harvested, "Not ready for purchase");
        require(isDistributor[msg.sender], "Only distributors");
        require(msg.value >= item.farmerPrice, "Insufficient payment");
        item.distributor = msg.sender;
        item.state = State.PurchasedByDistributor;
        payable(item.farmer).transfer(msg.value);
        emit PurchasedByDistributor(_id);
    }

    function setDistributorMargin(uint _id, uint _margin) public {
        Item storage item = items[_id];
        require(item.state == State.PurchasedByDistributor, "Item not purchased by distributor");
        require(isDistributor[msg.sender], "Only distributors can set margin");
        require(item.distributor == msg.sender, "Only the purchasing distributor can set margin");
        itemMargins[_id].distributorMargin = _margin;
        item.distributorPrice = item.farmerPrice + _margin;
        item.retailerPrice = item.distributorPrice; // Update retailer price too
    }

    function shipItem(uint _id) public {
        Item storage item = items[_id];
        require(item.state == State.PurchasedByDistributor, "Not purchased by distributor");
        require(isDistributor[msg.sender], "Only distributors");
        require(item.distributor == msg.sender, "Only the purchasing distributor can ship");
        item.state = State.ShippedByDistributor;
        emit ShippedByDistributor(_id);
    }

    function receiveByRetailer(uint _id) public {
        Item storage item = items[_id];
        require(item.state == State.ShippedByDistributor, "Not shipped by distributor");
        require(isRetailer[msg.sender], "Only retailers");
        item.retailer = msg.sender;
        item.state = State.ReceivedByRetailer;
        emit ReceivedByRetailer(_id);
    }

    function setRetailerMargin(uint _id, uint _margin) public {
        Item storage item = items[_id];
        require(item.state == State.ReceivedByRetailer, "Item not received by retailer");
        require(isRetailer[msg.sender], "Only retailers can set margin");
        require(item.retailer == msg.sender, "Only the receiving retailer can set margin");
        itemMargins[_id].retailerMargin = _margin;
        item.retailerPrice = item.distributorPrice + _margin;
    }

    function purchaseByRetailer(uint _id) public payable {
        Item storage item = items[_id];
        require(item.state == State.ReceivedByRetailer, "Not received by retailer");
        require(isRetailer[msg.sender], "Only retailers");
        require(item.retailer == msg.sender, "Only the receiving retailer can purchase");
        require(msg.value >= item.distributorPrice, "Insufficient payment");
        item.state = State.ForSaleByRetailer;
        payable(item.distributor).transfer(msg.value);
        emit PurchasedByRetailer(_id);
    }

    function purchaseByConsumer(uint _id) public payable {
        Item storage item = items[_id];
        require(item.state == State.ForSaleByRetailer, "Not for sale by retailer");
        require(msg.value >= item.retailerPrice, "Insufficient payment");
        item.consumer = msg.sender;
        item.state = State.PurchasedByConsumer;
        payable(item.retailer).transfer(msg.value);
        emit PurchasedByConsumer(_id);
    }

    function getPriceBreakdown(uint _id) public view returns (
        uint farmerPrice,
        uint distributorMargin,
        uint distributorPrice,
        uint retailerMargin,
        uint retailerPrice,
        uint totalMargin
    ) {
        Item memory item = items[_id];
        Margins memory margins = itemMargins[_id];
        farmerPrice = item.farmerPrice;
        distributorMargin = margins.distributorMargin;
        distributorPrice = item.distributorPrice;
        retailerMargin = margins.retailerMargin;
        retailerPrice = item.retailerPrice;
        totalMargin = margins.distributorMargin + margins.retailerMargin;
    }

    function getItem(uint _id) public view returns (Item memory) {
        return items[_id];
    }

    function getItemMargins(uint _id) public view returns (Margins memory) {
        return itemMargins[_id];
    }
}