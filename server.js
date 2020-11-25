require('dotenv').config();
const {
    swapperABI,
    owner,
    account,
    daiAddress,
    batAddress,
    erc20ABI } = require('./data');
const {
    deployContract,
    sendTokens,
    addToWhitelist,
    swapDaiBat,
    withdrawToken,
    getERC20Balance,
    finish } = require('./utils');

const HDWalletProvider = require('truffle-hdwallet-provider');
const provider = new HDWalletProvider(process.env.SEED, process.env.WEB3_PROVIDER);
const Web3 = require('web3');
const web3 = new Web3(provider);
const value = BigInt(1 * (10 ** 18));

init = async () => {

    const swapperAddress = await deployContract();

    const daiToken = new web3.eth.Contract(erc20ABI, daiAddress);
    const batToken = new web3.eth.Contract(erc20ABI, batAddress);
    const swapper = new web3.eth.Contract(swapperABI, swapperAddress);

    await getERC20Balance(daiToken, owner, "DAI");
    await getERC20Balance(batToken, owner, "BAT");
    
    await sendTokens(daiToken, owner, swapperAddress, value, "DAI");
    
    await getERC20Balance(daiToken, swapperAddress, "DAI");
    await getERC20Balance(batToken, swapperAddress, "BAT"); 
    
    await addToWhitelist(swapper, owner);
    
    await swapDaiBat(swapper, account, value, [daiAddress, batAddress]);

    await getERC20Balance(daiToken, swapperAddress, "DAI");
    await getERC20Balance(batToken, swapperAddress, "BAT"); 
    
    await withdrawToken(swapper, batAddress, "BAT");
    
    await getERC20Balance(daiToken, swapperAddress, "DAI");
    await getERC20Balance(batToken, swapperAddress, "BAT"); 
    
    await getERC20Balance(daiToken, owner, "DAI");
    await getERC20Balance(batToken, owner, "BAT"); 
    
    finish(swapper);
};

init();