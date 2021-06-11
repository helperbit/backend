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

import * as bitcoinjs from 'bitcoinjs-lib';
import { Psbt } from 'bitcoinjs-lib';
import conf = require('../conf');
import { $WalletDocument } from '../modules/wallet/wallet.model';
import { Blockchain } from '../blockchain';
import { PsbtInputExtended } from 'bip174/src/lib/interfaces';

export const SAT_IN_BITCOIN = 100000000;

export namespace Conversion {
	export function toSatoshi(btc: number) {
		return Math.floor(btc * SAT_IN_BITCOIN);
	}

	export function toBitcoin(sat: number) {
		return sat / SAT_IN_BITCOIN;
	}

	export function floorToSatoshi(btc: number) {
		return Math.floor(btc * SAT_IN_BITCOIN) / SAT_IN_BITCOIN;
	}
}

/* Described in doc/utxo_selector.md */
export interface UTXOSelectorOptions {
	value: number;
	bestInputNumber?: number;
	set: Blockchain.UTXO[];
	locked?: Blockchain.UTXO[];
}

export interface UTXOSelectorResult { 
	set: Blockchain.UTXO[]; 
	value: number; 
	rest: Blockchain.UTXO[];
}

export type UTXOSelector = (options: UTXOSelectorOptions) => UTXOSelectorResult;

export function utxoSelector(options: UTXOSelectorOptions): UTXOSelectorResult {
	let rSet = [];
	let rValue = options.value;
	let bestInputNumber = options.bestInputNumber || 6;
	const locked = options.locked || [];

	options.set.sort((a, b) => { return b.value - a.value; });

	/* If we have less input than bestInputNumber, we use 1 as value */
	if (options.set.length < bestInputNumber)
		bestInputNumber = 1;

	let newSet: Blockchain.UTXO[] = [];

	/* Find best matches */
	for (let i = 0; i < options.set.length; i++) {
		if (locked.find(utx => { return (utx.tx == options.set[i].tx && utx.n == options.set[i].n); }) !== undefined)
			continue;

		if ((rValue > 0 && options.set[i].value == rValue) || (rValue > 0 && options.set[i].value > rValue && (i + 1) < options.set.length && options.set[i + 1].value < rValue)) {
			rSet.push(options.set[i]);
			rValue -= options.set[i].value;
		} else {
			newSet.push(options.set[i]);
		}
	}

	/* Complete the filling */
	let newSet2 = [];

	for (let i = 0; i < newSet.length; i++) {
		if (rValue > 0) {
			rSet.push(newSet[i]);
			rValue -= newSet[i].value;
		} else {
			newSet2.push(newSet[i]);
		}
	}

	newSet = newSet2;

	/* Add some dust */
	newSet2 = [];

	for (let i = newSet.length - 1; i >= 0; i--) {
		if (rSet.length < bestInputNumber) {
			rSet.push(newSet[i]);
			rValue -= newSet[i].value;
		} else {
			newSet2.push(newSet[i]);
		}
	}

	if (rValue > 0)
		rSet = [];

	return { set: rSet, value: rValue, rest: newSet2 };
}


export type ScriptType = 'p2wsh' | 'p2sh' | 'p2sh-p2wsh';

export interface Scripts {
	address: string;
	scripttype: ScriptType;
	p2sh?: bitcoinjs.Payment;
	p2wsh?: bitcoinjs.Payment;
}


export function prepareScripts(scripttype: string, n: number, pubkeys: string[]): Scripts | null {
	// Se uso pubkeys da solo, restituisce il toJSON dei buffer
	const pubkeys_raw = [].concat(pubkeys).map(hex => Buffer.from(String(hex), 'hex'));
	const p2ms = bitcoinjs.payments.p2ms({ m: n, pubkeys: pubkeys_raw, network: conf.blockchain.network });

	switch (scripttype) {
		case 'p2sh': {
			const p2sh = bitcoinjs.payments.p2sh({ redeem: p2ms, network: conf.blockchain.network });
			const res: Scripts = {
				address: p2sh.address,
				scripttype: scripttype,
				p2sh: p2sh
			};
			return res;
		}

		case 'p2sh-p2wsh': {
			const p2wsh = bitcoinjs.payments.p2wsh({ redeem: p2ms, network: conf.blockchain.network });
			const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wsh, network: conf.blockchain.network });
			const res: Scripts = {
				address: p2sh.address,
				scripttype: scripttype,
				p2sh: p2sh,
				p2wsh: p2wsh
			};
			return res;
		}

		case 'p2wsh': {
			const p2wsh = bitcoinjs.payments.p2wsh({ redeem: p2ms, network: conf.blockchain.network });
			const res: Scripts = {
				address: p2wsh.address,
				scripttype: scripttype,
				p2wsh: p2wsh
			};
			return res;
		}
	}
}

export function prepareScriptsOfWallet(wallet: $WalletDocument): Scripts | null {
	return prepareScripts(wallet.scripttype, wallet.ismultisig ? wallet.multisig.n : 2, wallet.pubkeys);
}


export function randomPair(): { priv: string; pub: string } {
	const srvpair = bitcoinjs.ECPair.makeRandom({ network: conf.blockchain.network });
	return { priv: srvpair.toWIF(), pub: srvpair.publicKey.toString('hex') };
}


export function checkPublicKey(pubkey: string): boolean {
	try {
		bitcoinjs.ECPair.fromPublicKey(Buffer.from(pubkey, 'hex'));
		return true;
	} catch (e) {
		return false;
	}
}


export interface PrepareTransactionOptions {
	wallet: $WalletDocument;
	value: number;
	fee: number;
	lockedUTXOs?: any[];
	wif?: string;
	unspent?: Blockchain.UTXO[];
}

export interface PrepareTransactionSingleOptions extends PrepareTransactionOptions {
	address: string;
}

export interface PrepareTransactionMultiOptions extends PrepareTransactionOptions {
	addresses: { address: string; value: number }[];
}

export type PrepareTransactionOptionsExtend = PrepareTransactionSingleOptions | PrepareTransactionMultiOptions;

export async function prepareInput(utx: Blockchain.UTXO, wallet: $WalletDocument): Promise<any> {
	const input: PsbtInputExtended = { hash: utx.tx, index: utx.n };
	const txraw = Buffer.from(await Blockchain.getTransactionRaw(input.hash), 'hex');
	const utxraw: any = bitcoinjs.Transaction.fromBuffer(txraw).outs[input.index];
	delete utxraw.address;
	utxraw.script = Buffer.from(utxraw.script, 'hex');
	const sc = prepareScriptsOfWallet(wallet);

	switch (wallet.scripttype) {
		case 'p2wsh':
			input.witnessUtxo = utxraw;
			input.witnessScript = sc.p2wsh.redeem.output;
			break;
		case 'p2sh-p2wsh':
			input.witnessUtxo = utxraw;
			input.witnessScript = sc.p2wsh.redeem.output;
			input.redeemScript = sc.p2sh.redeem.output;
			break;
		case 'p2sh':
			input.nonWitnessUtxo = txraw;
			input.redeemScript = sc.p2sh.redeem.output;
			break;
	}

	return input;
}

export async function prepareTransaction(opts: PrepareTransactionOptionsExtend): Promise<{
	psbt: Psbt;
	utxos: Blockchain.UTXO[];
}> {
	const utxos: Blockchain.UTXO[] = [];
	const txb = new bitcoinjs.Psbt({ network: conf.blockchain.network });
	let cumulative = 0.0;

	const unspents = await Blockchain.getUnspent(opts.wallet.address);
	const bestUTX = utxoSelector({ set: unspents, value: opts.value + opts.fee, locked: opts.lockedUTXOs || [] });

	for (let i = 0; i < bestUTX.set.length; i++) {
		cumulative += Number(bestUTX.set[i].value);
		txb.addInput(await prepareInput(bestUTX.set[i], opts.wallet));
		utxos.push({ tx: bestUTX.set[i].tx, n: bestUTX.set[i].n, value: Conversion.toSatoshi(bestUTX.set[i].value) });
	}

	if (cumulative < (opts.value + opts.fee))
		return Promise.reject('EW1');


	try {
		if ('address' in opts) {
			txb.addOutput({ address: opts.address, value: Conversion.toSatoshi(opts.value) });
		} else if ('addresses' in opts) {
			for (let i = 0; i < opts.addresses.length; i++) {
				txb.addOutput({ address: opts.addresses[i].address, value: Conversion.toSatoshi(opts.addresses[i].value) });
			}
		}
	} catch (err) {
		return Promise.reject('EW2');
	}

	/* Returning */
	if (Conversion.toSatoshi (cumulative - opts.value - opts.fee) > 6500)
		txb.addOutput({ address: opts.wallet.address, value: Conversion.toSatoshi(cumulative) - 
			Conversion.toSatoshi(opts.value) - Conversion.toSatoshi(opts.fee) });

	/* Sign */
	if ('wif' in opts)
		txb.signAllInputs(bitcoinjs.ECPair.fromWIF(opts.wif, conf.blockchain.network));

	return { psbt: txb, utxos: utxos };
}




// Usage:
// getByteCount({'MULTISIG-P2SH:2-4':45},{'P2PKH':1}) Means "45 inputs of P2SH Multisig and 1 output of P2PKH"
// getByteCount({'P2PKH':1,'MULTISIG-P2SH:2-3':2},{'P2PKH':2}) means "1 P2PKH input and 2 Multisig P2SH (2 of 3) inputs along with 2 P2PKH outputs"
export function getByteCount(inputs, outputs) {
	let totalWeight = 0
	let hasWitness = false
	let inputCount = 0
	let outputCount = 0
	// assumes compressed pubkeys in all cases.
	const types = {
		'inputs': {
			'MULTISIG-P2SH': 49 * 4,
			'MULTISIG-P2WSH': 6 + (41 * 4),
			'MULTISIG-P2SH-P2WSH': 6 + (76 * 4),
			'P2PKH': 148 * 4,
			'P2WPKH': 108 + (41 * 4),
			'P2SH-P2WPKH': 108 + (64 * 4)
		},
		'outputs': {
			'P2SH': 32 * 4,
			'P2PKH': 34 * 4,
			'P2WPKH': 31 * 4,
			'P2WSH': 43 * 4
		}
	}

	function checkUInt53(n) {
		if (n < 0 || n > Number.MAX_SAFE_INTEGER || n % 1 !== 0) throw new RangeError('value out of range')
	}

	function varIntLength(number) {
		checkUInt53(number)

		return (
			number < 0xfd ? 1
				: number <= 0xffff ? 3
					: number <= 0xffffffff ? 5
						: 9
		)
	}

	Object.keys(inputs).forEach(function (key) {
		checkUInt53(inputs[key])
		if (key.slice(0, 8) === 'MULTISIG') {
			// ex. "MULTISIG-P2SH:2-3" would mean 2 of 3 P2SH MULTISIG
			const keyParts = key.split(':')
			if (keyParts.length !== 2) throw new Error('invalid input: ' + key)
			const newKey = keyParts[0]
			const mAndN = keyParts[1].split('-').map(function (item) { return parseInt(item) })

			totalWeight += types.inputs[newKey] * inputs[key]
			const multiplyer = (newKey === 'MULTISIG-P2SH') ? 4 : 1
			totalWeight += ((73 * mAndN[0]) + (34 * mAndN[1])) * multiplyer * inputs[key]
		} else {
			totalWeight += types.inputs[key] * inputs[key]
		}
		inputCount += inputs[key]
		if (key.indexOf('W') >= 0) hasWitness = true
	})

	Object.keys(outputs).forEach(function (key) {
		checkUInt53(outputs[key])
		totalWeight += types.outputs[key] * outputs[key]
		outputCount += outputs[key]
	})

	if (hasWitness) totalWeight += 2

	totalWeight += 8 * 4
	totalWeight += varIntLength(inputCount) * 4
	totalWeight += varIntLength(outputCount) * 4

	return Math.ceil(totalWeight / 4)
}




export type EstimateTransactionFeeOptionsExtend = PrepareTransactionOptionsExtend;

export function estimateTransactionSizeSync(opts: EstimateTransactionFeeOptionsExtend, selector: UTXOSelector): number {
	const inputs = {};
	const outputs = {};
	let cumulative = 0.0;

	if (!opts.fee)
		opts.fee = 0.0;

	const unspents = opts.unspent;
	const bestUTX = selector({ set: unspents, value: opts.value + opts.fee, locked: opts.lockedUTXOs || [] });

	if (opts.wallet.ismultisig) {
		switch (opts.wallet.scripttype) {
			case 'p2wsh':
				inputs[`MULTISIG-P2WSH:${opts.wallet.multisig.n}-${opts.wallet.pubkeys.length}`] = bestUTX.set.length;
				break;
			case 'p2sh-p2wsh':
				inputs[`MULTISIG-P2SH-P2WSH:${opts.wallet.multisig.n}-${opts.wallet.pubkeys.length}`] = bestUTX.set.length;
				break;
			default:
				inputs[`MULTISIG-P2SH:${opts.wallet.multisig.n}-${opts.wallet.pubkeys.length}`] = bestUTX.set.length;
		}
	} else {
		switch (opts.wallet.scripttype) {
			case 'p2wsh':
				inputs[`MULTISIG-P2WSH:2-3`] = bestUTX.set.length;
				break;
			case 'p2sh-p2wsh':
				inputs[`MULTISIG-P2SH-P2WSH:2-3`] = bestUTX.set.length;
				break;
			default:
				inputs[`MULTISIG-P2SH:2-3`] = bestUTX.set.length;
		}
	}

	for (let i = 0; i < bestUTX.set.length; i++)
		cumulative += Number(bestUTX.set[i].value);

	if (cumulative < (opts.value + opts.fee))
		throw 'EW1';

	if ('address' in opts) {
		outputs['P2WSH'] = 1;
	} else if ('addresses' in opts) {
		outputs['P2WSH'] = opts.addresses;
	}

	/* Returning */
	if (Math.floor((cumulative - opts.value - opts.fee) * 100000000) > 6500)
		outputs['P2WSH'] += 1;

	return getByteCount(inputs, outputs);
}

export async function estimateTransactionSize(opts: EstimateTransactionFeeOptionsExtend): Promise<number> {
	if (!opts.value)
		opts.value = (await Blockchain.getBalance(opts.wallet.address)).balance - opts.fee;
	if (!opts.unspent)
		opts.unspent = await Blockchain.getUnspent(opts.wallet.address);

	try {
		return estimateTransactionSizeSync(opts, utxoSelector);
	} catch (err) {
		return Promise.reject('EW1');
	}
}
