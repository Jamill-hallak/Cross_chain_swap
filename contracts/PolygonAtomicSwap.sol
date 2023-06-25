//By Jamill (jnbez)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PolygonAtomicSwap {
    bool private _locked;

    struct Swap {
        address initiator; // Address of the swap initiator
        address participant; // Address of the swap participant
        address token_address;
        uint256 starttime; // Start time timestamp of the swap
        uint256 timeLockDuration; // Duration of the time-lock period
        uint256 amount; // Amount to be swapped
        bytes32 hashlock; // Hash of the secret
    }

    mapping(uint256 => Swap) public swaps; // Mapping of swap ID to Swap struct

    event SwapInitiated(uint256 indexed swapID, address indexed initiator, address indexed participant, uint256 amount, bytes32 hashlock, uint256 starttime, uint256 timeLockDuration);
    event SwapExecuted(uint256 indexed swapID, address indexed executor, bytes32 secret);
    event SwapRefunded(uint256 indexed swapID, address indexed refunder);

    modifier preventReentrancy() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

   

    // constructor() public {}

// Initiates a swap
    function initiateSwap(uint256 swapID, address tokenAddress, address _participant, uint256 timeLockDuration, bytes32 hashlock, uint256 amount) external {
           
        require(bytes20(_participant).length == 20, "Short address attack detected");
        require(bytes20(tokenAddress).length == 20, "Short address attack detected");

        
        require(swapID != 0, "Invalid swap ID");
        require(swaps[swapID].initiator == address(0), "Swap ID already exists");
        require(_participant != address(0), "Invalid participant address");
        require(timeLockDuration > 0, "Invalid time lock duration");
        require(amount > 0, "Invalid amount"); 
               
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");

        token.transferFrom(msg.sender, address(this), amount);

        swaps[swapID] = Swap({
            initiator: msg.sender,
            token_address: tokenAddress,
            participant: _participant,
            starttime: block.timestamp,
            timeLockDuration: timeLockDuration,
            amount: amount,
            hashlock: hashlock
        });

        emit SwapInitiated(swapID, msg.sender, _participant, amount, hashlock, block.timestamp, timeLockDuration);
    }

    // Checks if a provided secret hash matches the swap's hashlock
    function checkHash(uint256 swapID, bytes32 secretHash) external view returns (bool) {
        Swap storage swap = swaps[swapID];
        require(swap.initiator != address(0), "Swap ID does not exist");

        return (swap.hashlock == secretHash);
    }

    // Executes a swap by providing the secret
    function executeSwap(uint256 swapID, bytes32 secret) external preventReentrancy {
        Swap storage swap = swaps[swapID];
        require(swap.initiator != address(0), "Swap ID does not exist");
        require(swap.participant == msg.sender, "Unauthorized execution");

        require(keccak256(abi.encodePacked(secret)) == swap.hashlock, "Invalid secret");
        require(block.timestamp <= swap.starttime + swap.timeLockDuration, "Time-lock period has passed");

        IERC20 token = IERC20(address(swap.token_address));
        token.transfer(swap.participant, swap.amount);

        emit SwapExecuted(swapID, msg.sender, secret);
        delete swaps[swapID];
    }

    // Refunds a swap if the time-lock period has passed
    function refundSwap(uint256 swapID) external preventReentrancy {
        Swap storage swap = swaps[swapID];
        require(swap.initiator != address(0), "Swap ID does not exist");
        require(swap.initiator == msg.sender, "Unauthorized refund");
        require(block.timestamp >= swap.starttime + swap.timeLockDuration, "Time-lock period has not passed yet");

        IERC20 token = IERC20(address(swap.token_address));
        token.transfer(swap.initiator, swap.amount);

        emit SwapRefunded(swapID, msg.sender);
        delete swaps[swapID];
    }
    // Fallback function to receive ETH
    receive() external payable {}
}
