/* 
 *  Helperbit: a p2p donation platform (backend)
 *  Copyright (C) 2016-2021  Davide Gessa (gessadavide@gmail.com)
 *  Copyright (C) 2016-2021  Helperbit team
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

/* eslint no-var: 0 */
const bitcoin = require('bitcoinjs-lib')

// Bitcoin address              : mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj
const key1 = {
	priv: 'cUxccFVBdJRq6HnyxiFMd8Z15GLThXaNLcnPBgoXLEv9iX6wuV2b',
	pub: '03c411cf39aca4395c81c35921dc832a0d1585d652ab1b52ccc619ff9fbbc57877'
};

// Bitcoin address              : mpSAvmKXAE8B6H6bgLnGBG8iyC6tQgEy9D
const key2 = {
	priv: 'cVSNe9ZdZRsRvEBL8YRR7YiZmH4cLsf5FthgERWkZezJVrGseaXy',
	pub: '020636d944458a4663b75a912c37dc1cd59b11f9a00106783a65ba230d929b96b0'
};

// Bitcoin address				: mq1HD5wiNLCNQv8u9wdwLvRH5JiMbxJHR4
const key3 = {
	priv: 'cQqbmgCQroize8cD1484C5243Q7twmHq5YjN3fYFayApcfoZykcF',
	pub: '02d1448cbf19528a1a27e5958ba73d930b5b3facdbe5c30c7094951a287fcc9149'
};


const keyPairs = [
	'cUxccFVBdJRq6HnyxiFMd8Z15GLThXaNLcnPBgoXLEv9iX6wuV2b',
	'cVSNe9ZdZRsRvEBL8YRR7YiZmH4cLsf5FthgERWkZezJVrGseaXy',
	'cQqbmgCQroize8cD1484C5243Q7twmHq5YjN3fYFayApcfoZykcF'
].map(function (wif) { return bitcoin.ECPair.fromWIF(wif, bitcoin.networks.testnet) })

const pubKeys = keyPairs.map(function (x) { return x.getPublicKeyBuffer() })

var witnessScript = bitcoin.script.multisig.output.encode(2, pubKeys)
const witnessScriptHash = bitcoin.crypto.sha256(witnessScript)

var redeemScript = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash)
const redeemScriptHash = bitcoin.crypto.hash160(redeemScript)

var scriptPubKey = bitcoin.script.scriptHash.output.encode(redeemScriptHash)
const P2SHaddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet)

console.log(P2SHaddress)
console.log(scriptPubKey)

// 2Mv8kEd3D7PaYciMYMgQU3zGTv5RgsYDUDy

var txb = new bitcoin.Psbt(bitcoin.networks.testnet)

txb.addInput('f3e785dff9694a463f5f17570c2940aa8e65117ae69184e5fa8de69ac4ae3481', 1);

txb.addOutput(scriptPubKey, (1000000 - 10000) / 2);
txb.addOutput("n2iptWzMeDb35222vkp3SA9ytsac3skwjU", (1000000 - 10000) / 2);

txb.sign(0, keyPairs[0], redeemScript, null, 1000000, witnessScript)

var txhex = txb.buildIncomplete().toHex();


var txb = bitcoin.Psbt.fromTransaction(
	bitcoin.Transaction.fromHex(txhex), bitcoin.networks.testnet);
var witnessScript = bitcoin.script.multisig.output.encode(2, pubKeys);
var redeemScript = bitcoin.script.witnessScriptHash.output.encode(bitcoin.crypto.sha256(witnessScript));
var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
const address = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);

txb.sign(0, keyPairs[1], redeemScript, null, 1000000, witnessScript);

const tx = txb.build();
var txhex = tx.toHex();

console.log(txhex);
