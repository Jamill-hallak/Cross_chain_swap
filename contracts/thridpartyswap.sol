//By Jamill (jnbez)

pragma solidity ^0.8.0;

import {IAxelarGateway} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract InteroperabilitySwap{
 
    IAxelarGateway public immutable gateway;
    IERC20 public immutable USDC ;
    IERC20 public immutable MATIC ;
    IERC20 public immutable BNB ;

    constructor(address _gateway,address _USD,address _MATIC, address _BNB) {
        gateway = IAxelarGateway(_gateway);
        USDC = IERC20(_USD);
        MATIC = IERC20(_MATIC);
        BNB = IERC20(_BNB);

    }

function sendUsdcToBinance (uint amount_,string memory Receiver_) public
 {
     USDC.approve(address(gateway),amount_) ;
     gateway.sendToken("binance",Receiver_,"aUSDC",amount_);

 }

function sendMaticToBinance (uint amount_,string memory Receiver_) public
 {
     MATIC.approve(address(gateway),amount_) ;
     gateway.sendToken("binance",Receiver_,"WMATIC",amount_);

  }

 
 function sendBNBToBinance (uint amount_,string memory Receiver_) public
  {
     BNB.approve(address(gateway),amount_) ;
     gateway.sendToken("binance",Receiver_,"WBNB",amount_);

  }


 }