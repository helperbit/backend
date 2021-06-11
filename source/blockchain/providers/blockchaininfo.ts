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

import conf = require('../../conf');
import Explorer from './explorer';
import { Blockchain } from '..';
import { requestTyped } from '../../helpers/request-typed';
import { address } from 'bitcoinjs-lib';
import { Conversion } from '../../helpers/bitcoin';

interface DataTx {
	block_height: number;
	time: number;
	hash: string;
	inputs: {
		prev_out: {
			addr?: string;
			script: string;
		};
	}[];
	out: {
		addr: string;
		value: number;
	}[];
};

interface DataMultiAddr {
	addresses: {
		address: string;
		total_received: number;
		total_sent: number;
		final_balance: number;
	}[];
}

interface DataAddress {
	txs: DataTx[];
	total_received: number;
	total_sent: number;
	final_balance: number;
}

export default class BlockchainInfoExplorer extends Explorer {
	private param: string;
	private paramConf: string;

	constructor(testnet) {
		super(testnet, testnet? 'https://testnet.blockchain.info' : 'https://blockchain.info');
		this.param = '?format=json&cors=true&limit=50';
		this.paramConf = "?confirmations=1";
	}

	get name() { return 'BlockChain.info'; }

	isNetworkSupported() { return true; }

	async getHeight(): Promise<number> {
		const data = await requestTyped<{
			height: number;
		}>({ url: `${this.host}/latestblock${this.param}`, timeout: 8000 });
		return data.height;
	}
	
	async getTransactions(address: string): Promise<Blockchain.Txs> {
		const lasth = await this.getHeight();
		const data = await requestTyped<DataAddress>({ 
			url: `${this.host}/address/${address}${this.param}`, timeout: 8000 });
	
		const txs = [];
		for (let i = 0; i < data.txs.length; i++) {
			const tx = data.txs[i];
			let amount = 0.0;
			let incoming = true;
	
			for (let j = 0; j < tx.inputs.length; j++) {
				if (tx.inputs[j].prev_out.addr == address) {
					incoming = false;
				}
			}
	
			for (let z = 0; z < tx.out.length; z++) {
				if (!incoming && tx.out[z].addr != address) {
					amount += Conversion.toBitcoin(tx.out[z].value);
				}
				if (incoming && tx.out[z].addr == address) {
					amount += Conversion.toBitcoin(tx.out[z].value);
				}
			}
	
			let conf = 0;
			if ('block_height' in tx)
				conf = (lasth + 1) - tx.block_height;
	
			txs.push({ tx: tx.hash, value: amount, confirmations: conf, time: tx.time * 1000, in: incoming });
		}
		return txs;
	}
	
	async getTransactions2(address: string): Promise<Blockchain.Txs> {
		const data = await requestTyped<DataAddress>({ 
			url: `${this.host}/address/${address}${this.param}`, timeout: 8000 });
	
		const txs = [];
		for (let i = 0; i < data.txs.length; i++) {
			const tx = data.txs[i];
			txs.push(tx.hash);
		}
		return txs;
	}
	
	async getTransaction(txid: string): Promise<Blockchain.Tx> {
		const lasth = await this.getHeight();
		const data = await requestTyped<DataTx>(
			{ url: `${this.host}/rawtx/${txid}${this.param}`, timeout: 8000 });
	
		const tx = { txid: txid, confirmations: 0, time: data.time * 1000, from: [], to: [] };
	
		if ('block_height' in data)
			tx.confirmations = (lasth + 1) - data.block_height;
		else if (!conf.blockchain.testnet) // TODO: this is currently broken on bc.info, no block_height returned
			tx.confirmations = 1;
	
		data.inputs.forEach(v => {
			if ('addr' in v.prev_out) {
				tx.from.push(v.prev_out.addr);
			} else {
				return address.fromOutputScript(Buffer.from(v.prev_out.script, 'hex'));
			}
		});
		data.out.forEach(v => {
			tx.to.push(v.addr);
		});
	
		return tx;
	}
	
	async getTransactionRaw(txid: string): Promise<string> {
		return await requestTyped<string>(
			{ url: `${this.host}/rawtx/${txid}?format=hex`, timeout: 8000 });
	}
	
	async getUnspent(address: string): Promise<Blockchain.UTXO[]> {
		throw new Error("Method not implemented.");
		const data = await requestTyped<{
			unspent_outputs: {
				tx_hash: string;
				tx_output_n: number;
				value: number;
			}[];
		}>({ 
			url: `${this.host}/unspent?active=${address}&${this.param}`, timeout: 8000 });
	
		const invertHash = (s) => {
			let a = "";
			for (let i = 0; i < s.length / 2; i++) {
				a += s[s.length - i * 2 - 2] + s[s.length - i * 2 - 1];
			}
			return a;
		};
	
		const txs = [];
		for (let i = 0; i < data.unspent_outputs.length; i++) {
			txs.push({
				tx: invertHash(data.unspent_outputs[i].tx_hash),
				n: data.unspent_outputs[i].tx_output_n,
				value: Conversion.toBitcoin(data.unspent_outputs[i].value)
			});
		}
		return txs;
	}

	async getBalance(address: string): Promise<Blockchain.Balance> {
		const data = await requestTyped<DataAddress>({ 
			url: `${this.host}/address/${address}${this.param}`, timeout: 8000 });
	
		try {
			const data2 = await requestTyped<DataAddress>({ 
				url: `${this.host}/address/${address}${this.param}${this.paramConf}`, timeout: 8000 });
			const unconfirmed = data.final_balance - data2.final_balance;
	
			return {
				received: Conversion.toBitcoin(data.total_received),
				balance: Conversion.toBitcoin(data2.final_balance),
				unconfirmed: Conversion.toBitcoin(unconfirmed)
			};
		} catch (err) {
			return {
				received: Conversion.toBitcoin(data.total_received),
				balance: Conversion.toBitcoin(data.final_balance),
				unconfirmed: 0.0
			};
		}
	}
	
	async getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]> {
		/* Max 200 addresses */
		if (addresses.length > 200)
			addresses = addresses.slice(0, 200);
	
		let adrstr = '';
		addresses.forEach(a => { adrstr += a + '|'; });
	
		const data = await requestTyped<DataMultiAddr>({ 
			url: `${this.host}/multiaddr?active=${adrstr}`, timeout: 8000 });
	
		const noconf = {};
		data.addresses.forEach(a => { noconf[a.address] = a; });
	
		const data2 = await requestTyped<DataMultiAddr>({ 
			url: `${this.host}/multiaddr?active=${adrstr}&confirmations=1`, timeout: 8000 });
	
		const balances = [];
	
		data2.addresses.forEach(a => {
			const unconfirmed = noconf[a.address].final_balance - a.final_balance;
	
			balances.push({
				address: a.address,
				received: Conversion.toBitcoin(noconf[a.address].total_received),
				balance: Conversion.toBitcoin(a.final_balance),
				unconfirmed: Conversion.toBitcoin(unconfirmed)
			});
		});
	
		return balances;
	}

	pushTransaction(txhex: string): Promise<string> {
		throw new Error("Method not implemented.");
	}
}
