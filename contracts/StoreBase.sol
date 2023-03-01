// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Validation.sol";
import "./ProductCheck.sol";

contract StoreBase is Ownable, ProductCheck, Validation{

    struct Product{
        string name;
        uint16 quantity;
    }

    uint8 refundPolicyNumber = 100;

    Product[] public products;
    
    mapping(bytes32 => uint) productsIds;
    mapping(string => Product)  productNameMap;
    mapping(address => mapping(uint => uint)) buyers;
    mapping(uint => address[]) productBuyers;

    event ProductAdded(uint id,string name,uint quantity);
    event ProductUpdated(uint id, string name, uint quantity);
    event ProductBought(uint id,address buyer);
    event ProductRefund(uint id);

    function internalAddProduct(uint id,string memory name, uint16 quantity) internal {
        Product memory newProduct =  Product({
            name : name,
            quantity:quantity
        });
        bytes32 idHash = generateId(name);
        productsIds[idHash] = id;
        products.push(newProduct);
        productNameMap[name] = newProduct;
    }

    function internalUpdateProduct(uint id,uint16 quantity) internal {
        products[id].quantity = quantity;
    }

    function internalAddBuyer(uint id, address client) internal{
        uint blockNumber = block.number;
        buyers[client][id] = blockNumber;
        productBuyers[id].push(client);
    }

    function internalRefund(uint id,address client) internal{
        bool bought = buyers[client][id] != 0 ;
        
        bool eligbleForRefund = refundEligable(buyers[client][id]);
        require(eligbleForRefund,"Sorry, your request for refund has been denied.");
   
        require(bought,"You've already returned your product or didn't even bought it.");
        buyers[client][id] = 0;
    }
    
    function internalCheckBuyers(uint id,address client) internal view returns(bool) {
        return buyers[client][id] > 0; 
    }

    function refundEligable(uint boughtBlockNumber) internal view returns(bool){
        if(boughtBlockNumber + refundPolicyNumber > block.number){
            return true;
        }
        return false;
    }

    function generateId(string memory name) internal pure returns(bytes32){
        return keccak256(abi.encodePacked(name));
    }
}   