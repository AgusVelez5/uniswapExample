const { swapperABI, swapperByteCode, account, owner } = require('./data');
const HDWalletProvider = require('truffle-hdwallet-provider');
const provider = new HDWalletProvider(process.env.SEED, process.env.WEB3_PROVIDER);
const Web3 = require('web3');
const web3 = new Web3(provider);
const Accounts = require('web3-eth-accounts');
const web_accounts = new Accounts(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER));

const deployContract = async () => {
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -')
    console.log('Deploy swapper contract')
    console.log(`Executed by owner: ${owner}`);

    const payload = {
        data: swapperByteCode.object
    }

    const parameters = {
        from: owner,
        gas: web3.utils.toHex('2100000'),
        gasPrice: await web3.eth.getGasPrice(),
    }

    return new Promise(async (resolve, _) => {
        const swapper = await new web3.eth.Contract(swapperABI).deploy(payload).send(parameters);
        console.log('Contract address: ', swapper.options.address);
        resolve(swapper.options.address);
    });
};


const sendTokens = async (token, from, to, value, symbol) => {
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
    console.log(`Send ${symbol} tokens`);
    const data = token.methods.transfer(to, value).encodeABI();
    return await signAndExecute(from, token, data);
};

const addToWhitelist = async (swapper, from) => {
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
    console.log(`Add account address to swapper whitelist`);
    console.log(`Executed by owner: ${from}`);
    const data = swapper.methods.addAddress(account).encodeABI();
    return await signAndExecute(from, swapper, data);
};

const swapDaiBat = async (swapper, from, amount, path) => {
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
    console.log(`Swap DAI & BAT`)
    console.log(`Executed by whitelisted account: ${account}`);
    const data = swapper.methods.swapTokensForTokens(amount, path).encodeABI();
    return await signAndExecute(from, swapper, data);
};

const withdrawToken = async (swapper, tokenAddress, symbol) => {
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
    console.log(`Withdraw ${symbol} from Swapper`)
    console.log(`Executed by owner: ${owner}`);
    const data = swapper.methods.withdrawToken(tokenAddress).encodeABI();
    return await signAndExecute(owner, swapper, data);
};

const getERC20Balance = async (token, accountAddress, symbol) => {
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
    const balance = await token.methods.balanceOf(accountAddress).call();
    console.log(`The ${accountAddress} balance of ${symbol} is ${balance / 1000000000000000000}`);
};

const finish = () => {
    console.log(`See movements on: https://rinkeby.etherscan.io/address/${swapper.options.address}#tokentxns`)
    console.log('Bye Bye');
    console.log('See you later guys');
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
};

const signAndExecute = async (from, contract, data) => {
    const nonce = await web3.eth.getTransactionCount(from);
    const gasPrice = await web3.eth.getGasPrice();

    const gas = await web3.eth.estimateGas({
        from: from,
        to: contract.options.address,
        data: data,
    });

    const tx = {

        from: from,

        to: contract.options.address,

        gas: gas,

        gasPrice: gasPrice,

        data: data,

        value: '0x0',

        nonce: nonce
    };

    const privateKey = from === owner ? process.env.PRIVATE_KEY_OWNER : process.env.PRIVATE_KEY_ACCOUNT;

    const signedTransaction = await web_accounts.signTransaction(tx, privateKey);

    let confirmations = 1;

    return new Promise(async (resolve, _) => {
        await web3.eth.sendSignedTransaction(signedTransaction.raw || signedTransaction.rawTransaction)
            .on('transactionHash', txHash => {
                console.log('Transaction sent, hash =>', txHash);
            }).on('confirmation', () => {
                console.log('Waiting confirmations...');
                if (confirmations === 6) {
                    return resolve();
                }
                confirmations++;
            }).on('error', err => {
                console.log('Transaction failed', err);
                return resolve(err);
            })
    })
};

module.exports = {
    deployContract,
    sendTokens,
    addToWhitelist,
    swapDaiBat,
    withdrawToken,
    getERC20Balance,
    finish
};