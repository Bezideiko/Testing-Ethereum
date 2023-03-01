// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

contract ProductCheck {
    modifier quantityCheck(uint16 quantity){
        require(quantity > 0 , "Quantity can't be 0!");
        _;
    }

    modifier productExist(uint id,uint productsLength){
        require(id < productsLength,"This product does not exist!");
        _;
    }
}