// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;
import "./StoreBase.sol";

contract Store is StoreBase{
    function addProduct(string memory name, uint16 quantity) public onlyOwner quantityCheck(quantity) nameCheck(name){
        bool productExist = bytes(productNameMap[name].name).length>0;
        uint productId = productsIds[generateId(name)];

        if(productExist){
            Product storage selectedProduct = products[productId];
            internalUpdateProduct(productId,quantity);
            emit ProductUpdated(productId,selectedProduct.name,selectedProduct.quantity);
        }else{
            productId = products.length;
            internalAddProduct(products.length,name,quantity);
            emit ProductAdded(productId,name,quantity);
        }
    }

    function updateProductQuantity(uint id,uint16 quantity) public onlyOwner productExist(id,products.length){
        internalUpdateProduct(id,quantity);

        Product storage selectedProduct = products[id];
        emit ProductUpdated(id,selectedProduct.name,selectedProduct.quantity);
    }

    function buyProduct(uint id) public quantityCheck(products[id].quantity) productExist(id,products.length){
        address client = msg.sender;
        Product storage selectedProduct = products[id];

        bool alreadyBoughtByClient = internalCheckBuyers(id,client);
        require(!alreadyBoughtByClient, "You cannot buy the same product more than once!");
        internalAddBuyer(id,client);
        selectedProduct.quantity--;

        emit ProductBought(id,client);
    }

    function refundProduct(uint id) public productExist(id,products.length){
        address client = msg.sender;

        internalRefund(id,client);
        Product storage selectedProduct = products[id];
        selectedProduct.quantity++;
        emit ProductRefund(id);
    }

    function setRefundPolicyNumber(uint8 blockNumber)public onlyOwner{
        refundPolicyNumber = blockNumber;
    }

    function getProductByName(string memory name) public view nameCheck(name) returns(Product memory){
        bool productExist = bytes(productNameMap[name].name).length>0;
        require(productExist,"This product does not exist!");

        uint productId = productsIds[generateId(name)];
        Product storage selectedProduct = products[productId];
        return selectedProduct;
    }

    function getProductById(uint id) public view productExist(id,products.length) returns(Product memory) {
        Product storage selectedProduct = products[id];
        return selectedProduct;
    }

    function getProductBuyersById(uint id) public view productExist(id,products.length) returns(address[] memory){
        return productBuyers[id];
    }

    function getAllProducts() public view returns(Product[] memory){
        return products;
    }

    function getRefundPolicyNumber() public view returns(uint8){
        return refundPolicyNumber;
    }
}