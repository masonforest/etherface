const Promise = require("bluebird");
const retry = require('./asyncRetry');
const Web3 = require('web3');
const swarm = require("swarm-js").at("http://swarm-gateways.net");
var web3 = window.web3;
// const web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/"));
const getCode = Promise.promisify(web3.eth.getCode);

export default class Web3Contract {
  constructor(contractId) {
    this.contractId = contractId;
  }

  async load() {
    const code = await getCode(this.contractId);

    // Solidity compiler adds the following to the end of the deployed bytecode:
    //
    // 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes swarm hash> 0x00 0x29
    // Reference: http://solidity.readthedocs.io/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode

    const metadataHash = code.slice(-68, -4);
    const swarmArray = await retry(async bail =>
      await swarm.download(metadataHash)
    , { retries: 10 });
    const metadata =  JSON.parse(swarm.toString(swarmArray));
    return web3.eth.contract(metadata.output.abi).at(this.contractId);
  }
}
