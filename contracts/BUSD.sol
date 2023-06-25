//By Jamill (jnbez)
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BUSD is ERC20 {
     address  public owner ;
    constructor() ERC20("BUSDT", "BUSDT") {
        _mint(msg.sender, 1000 * (10 ** decimals()));
        owner = msg.sender;

    }
}
