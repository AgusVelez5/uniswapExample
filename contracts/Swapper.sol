pragma solidity ^0.7.0;

interface IUniswap {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(
        uint amountIn, 
        address[] memory path
    ) external returns (uint[] memory amounts);
}

interface IERC20 {
    function transfer(
        address recipient, 
        uint256 amount
    ) external returns (bool);
    
    function approve(
        address spender, 
        uint256 amount
    ) external returns (bool);
    
    function balanceOf(
        address account
    ) external view returns (uint256);
}

contract Swapper {
    address owner;
    mapping(address => bool) private whitelistedMap;

    address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    IUniswap public uniswapRouter;

    // EVENTS   
    event Whitelisted(address indexed account, bool isWhitelisted);
    event Swap(address indexed account, address[] indexed path, uint amountIn, uint amountOut);

    // MODIFIERS
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    modifier onWhiteList {
        require(whitelistedMap[msg.sender]);
        _;
    }

    constructor() {
        uniswapRouter = IUniswap(UNISWAP_ROUTER_ADDRESS);
        owner = msg.sender;
        addAddress(owner);
    }

    
    // WHITE LIST
    function whiteListed(address _address) public view returns (bool) {
        return whitelistedMap[_address];
    }

    function addAddress(address _address) public onlyOwner {
        require(whitelistedMap[_address] != true);
        whitelistedMap[_address] = true;
        emit Whitelisted(_address, true);
    }

    function removeAddress(address _address) public onlyOwner {
        require(whitelistedMap[_address] != false);
        whitelistedMap[_address] = false;
        emit Whitelisted(_address, false);
    }


    // WITHDRAW
    function withdrawToken(address token) external onlyOwner {
        require(IERC20(token).balanceOf(address(this)) > 0);
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }


    // GET BALANCE
    function getTokenBalance(address token) public view onWhiteList returns (uint256){
        return IERC20(token).balanceOf(address(this));
    }

    
    // SWAP
    function swapTokensForTokens(
        uint amountIn,
        address[] calldata path
    ) external onWhiteList {

        IERC20(path[0]).approve(address(uniswapRouter), amountIn);
    
        uint256[] memory amounts = getAmountOut(amountIn, path); 

        uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amounts[amounts.length - 1],
            path,
            address(this),
            block.timestamp + 300
        );

        emit Swap(msg.sender, path, amountIn, amounts[amounts.length - 1]);
    }

    
    // UTILS    
    function getAmountOut(uint amountIn, address[] memory path) private returns(uint256[] memory){
        return uniswapRouter.getAmountsOut(amountIn, path);
    }

}