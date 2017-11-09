import React from 'react'
import { Component } from 'react'
import Web3Contract from '../Web3Contract'
import _ from 'lodash';
const Promise = require("bluebird");

class Contract extends Component {
  constructor () {
    super();
    this.state = {
      constants: {},
      function: {},
      inputValues: {},
      callValues: {},
    }
  }

  componentDidMount() {
    const contractId = this.lookupAddress(this.props.match.params.contractId);
    console.log(contractId);
    const contract = new Web3Contract(contractId);
    contract.load().then((contract) => {
      this.contract = contract;
      const constantABIs = _.filter(_.filter(contract.abi, "constant"), (f) => f.inputs.length === 0);
      const constantNames = _.map(constantABIs, "name");
      const promises = constantABIs.map(({name}) =>
        new Promise((resolve, reject) =>
          contract[name].call((error, result) => resolve(result))
        )
      );
      Promise.all(promises).then(values => {
        const constantValues = _.map(values, (s) => s.toString())
        const constants = _.zipObject(constantNames, constantValues);
        this.setState({constants});
      });

      const variableABIs = _.filter(contract.abi, {constant: false});
      const constantWithInputABIs = _.filter(_.filter(contract.abi, "constant"), (f) => f.inputs.length !== 0);
      const functionABIs = constantWithInputABIs.concat(variableABIs);
      const functions = _.fromPairs(functionABIs.map((constant) =>
        [constant.name, _.pick(constant, ['inputs', 'outputs', 'payable'])]
      ));
      this.setState({functions});
    });
  }

  lookupAddress (address) {
    // TODO move this to ENS
    return {
      compound: "0xa82ead5449856fef3c495829b4bd72ebda5c5409",
      EthUSD: "0x9f9ea1aa966c529d427c675484ed7af402f728c2",
    }[address] || address;
  }
  handleInputChange = (action, argument, event) => {
    var state = this.state;
    const {value} = event.target;
    state = _.set(state, `inputValues.${action}.${argument}`, value);
    this.setState(state);
  }

  handleValueChange = (action, event) => {
    var state = this.state;
    const {value} = event.target;
    state = _.set(state, `callValues.${action}`, value);
    this.setState(state);
  }


  call = (action) => {
    const inputValues = this.state.inputValues[action];
    const inputs = _.find(this.contract.abi, {name: action}).inputs;
    const params = inputs.map(function(input) {
      return inputValues[input.name]
    })

    const callValue = window.web3.toWei(this.state.callValues[action], "ether") || 0;
    this.contract[action](...params, {value: callValue}, (error, result) => {
      console.log(error)
      console.log(result.toString());
    });
  }


  render() {
    const contractId = this.props.match.params.contractId;
    return <div className={"card"}>
      <h1>{contractId}</h1>
      <h3>Constants</h3>
      <table>
      <tbody>
        {
          _.keys(this.state.constants).map((constant) =>
            <tr key={constant}>
              <td>{constant}</td>
              <td>{this.state.constants[constant]}</td>
            </tr>
          )
        }
      </tbody>
      </table>
      <h3>Functions</h3>
        {
          _.keys(this.state.functions).map((f) =>
            <div key={f}>
              <h4>{f}</h4>
              {this.state.functions[f].inputs.map((input) =>
                <div key={input.name}>
                  {input.name} <input  onChange={this.handleInputChange.bind(this, f, input.name)} />
                </div>)
              }
              {this.state.functions[f].payable
                  ? 
                <div>
                  value (in ETH) <input onChange={this.handleValueChange.bind(this, f)} />
                </div>
                : <div></div>
              }
              <span><button onClick={this.call.bind(this, f)}>{f}</button></span>
            </div>
          )
        }
    </div>
  }
}

export default Contract
