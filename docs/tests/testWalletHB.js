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

var seed = "";
var pubkeys = [
	"",
	"",
	""
];
var dest = "";
var utxos = [{ "tx": "", "n": 0, "value": 100000 }];

// var txhex = "";
var srvpriv = "";

var bitcoinjs = require('bitcoinjs-lib');
var bip32 = require('bip32');
var bip39 = require('bip39');

var mnemonicToKeys = function (secret) {
	const seed = bip39.mnemonicToSeed(secret);
	const hd = bip32.fromSeed(seed, bitcoinjs.networks.testnet);
	const priv1 = hd.toWIF();
	const pub1 = hd.publicKey.toString('hex');
	return { private: priv1, public: pub1 };
};

var prepareP2SHScripts = (segwit, n, pubkeys) => {
	const pubkeys_raw = pubkeys.map(hex => Buffer.from(hex, 'hex'));

	if (segwit) {
		const p2ms = bitcoinjs.payments.p2ms({ m: n, pubkeys: pubkeys_raw, network: bitcoinjs.networks.testnet });
		const p2wsh = bitcoinjs.payments.p2wsh({ redeem: p2ms, network: bitcoinjs.networks.testnet });
		const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wsh, network: bitcoinjs.networks.testnet });
		const res = {
			address: p2sh.address,
			segwit: segwit,
			p2sh: p2sh,
			p2shRedeem: p2sh.redeem.output,
			p2wsh: p2wsh,
			p2wshRedeem: p2wsh.redeem.output
		};
		return res;
	} else {
		const p2ms = bitcoinjs.payments.p2ms({ m: n, pubkeys: pubkeys_raw, network: bitcoinjs.networks.testnet });
		const p2sh = bitcoinjs.payments.p2sh({ redeem: p2ms, network: bitcoinjs.networks.testnet });
		const res = {
			address: p2sh.address,
			segwit: segwit,
			p2sh: p2sh,
			p2shRedeem: p2sh.redeem.output
		};
		return res;
	}
};


let txb = new bitcoinjs.Psbt({ network: bitcoinjs.networks.testnet });
for (let i = 0; i < utxos.length; i++)
	txb.addInput({ hash: utxos[i].tx, index: utxos[i].n });

txb.addOutput({ address: dest, value: 0.001 * 100000000, script: walletScripts.p2shRedeem });

const walletScripts = prepareP2SHScripts(false, 2, pubkeys);
console.log(walletScripts);
const srvpair = bitcoinjs.ECPair.fromWIF(srvpriv, bitcoinjs.networks.testnet);

txb.signAllInputs(srvpair)
for (let j = 0; j < txb.data.inputs.length; j++) {
	txb.sign(j, srvpair, walletScripts.p2shRedeem); //, null, parseInt(utxos[j].value), walletScripts.p2wshRedeem);
}

const txhex = txb.toHex();



const wif = mnemonicToKeys(seed).private;
txb = bitcoinjs.Psbt.fromHex(txhex, { network: bitcoinjs.networks.testnet });
const upair = bitcoinjs.ECPair.fromWIF(wif, bitcoinjs.networks.testnet);

txb.signAllInputs(upair);

console.log(txb.toHex())