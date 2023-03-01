// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

contract Validation{
    modifier nameCheck(string memory name) {
        require(bytes(name).length != 0, "You have to enter a name!");
        _;
    }
}