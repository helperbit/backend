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

// import request = require('request-promise-native');
// import conf = require('../../conf');
// import Explorer from './explorer';
// import { Blockchain } from '..';


// export default class ChainsoExplorer extends Explorer {
// 	private param: string;

// 	constructor (testnet) {
// 		super(testnet, 'https://chain.so/api/v2');
// 		this.param = testnet ? 'BTCTEST/' : 'BTC/';
// 	}

// 	get name() { return 'Chain.so'; }

// 	isNetworkSupported() {
// 		return true;
// 	}

// 	getHeight(): Promise<number> {
// 		throw new Error("Method not implemented.");
// 	}
	
// 	async getTransactions(address: string): Promise<Blockchain.Txs> {
// 		const data = await request({ url: `${this.host}/address/${this.param}${address}`, json: true, timeout: 8000 });
	
// 		if (data.status !== 'success')
// 			return Promise.reject(data);
	
// 		const txs = [];
// 		for (let i = 0; i < data.data.txs.length; i++) {
// 			const tx = data.data.txs[i];
// 			let amount = 0.0;
	
// 			if ('incoming' in tx)
// 				amount += tx.incoming.value;
// 			if ('outgoing' in tx)
// 				amount -= tx.outgoing.value;
	
// 			txs.push({ tx: tx.txid, value: Math.abs(amount), confirmations: tx.confirmations, time: parseInt(tx.time) * 1000, in: (amount > 0.0) });
// 		}
// 		return txs;
// 	}

// 	async getTransactions2(address: string): Promise<Blockchain.Txs> {
// 		const data = await request({ url: `${this.host}/address/${this.param}${address}`, json: true, timeout: 8000 });
	
// 		if (data.status !== 'success')
// 			return Promise.reject(data);
	
// 		const txs = [];
// 		for (let i = 0; i < data.data.txs.length; i++) {
// 			const tx = data.data.txs[i];
// 			txs.push(tx.txid);
// 		}
// 		return txs;
// 	}

// 	async getTransaction(txid: string): Promise<Blockchain.Tx> {
// 		const data = await request({ url: `${this.host}/get_tx/${this.param}${txid}`, json: true, timeout: 8000 });
	
// 		if (data.status !== 'success')
// 			return Promise.reject(data);
	
// 		const tx = { txid: txid, confirmations: data.data.confirmations, time: data.data.time, from: [], to: [] };
	
// 		data.data.inputs.forEach(v => {
// 			tx.from.push(v.address);
// 		});
// 		data.data.outputs.forEach(v => {
// 			tx.to.push(v.address);
// 		});
	
// 		return tx;
// 	}

// 	async getTransactionRaw(txid: string): Promise<string> {
// 		const data = await request({ url: `${this.host}/get_tx/${this.param}${txid}`, json: true, timeout: 8000 });
	
// 		if (data.status !== 'success')
// 			return Promise.reject(data);
	
// 		return data.data.tx_hex;
// 	}

// 	async getUnspent(address: string): Promise<Blockchain.UTXO[]> {
// 		const data = await request({ url: `${this.host}/get_tx_unspent/${this.param}${address}`, json: true, timeout: 8000 });
	
// 		if (data.status !== 'success')
// 			return Promise.reject(data);
	
// 		const txs = [];
// 		for (let i = 0; i < data.data.txs.length; i++)
// 			txs.push({ tx: data.data.txs[i].txid, n: data.data.txs[i].output_no, value: data.data.txs[i].value });
// 		return txs;
// 	}

// 	async getBalance(address: string): Promise<Blockchain.Balance> {
// 		const data = await request({ url: `${this.host}/address/${this.param}${address}/${conf.blockchain.limits.min.conf}`, json: true, timeout: 8000 });
	
// 		if (data.status !== 'success')
// 			return Promise.reject(data);
	
// 		return {
// 			balance: data.data.balance,
// 			unconfirmed: data.data.pending_value,
// 			received: data.data.received_value
// 		};
// 	}

// 	getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]> {
// 		throw new Error("Method not implemented.");
// 	}

// 	async pushTransaction(txhex: string): Promise<string> {
// 		const data = await request({ method: 'POST', url: `${this.host}/send_tx/${this.param}`, body: { tx_hex: txhex }, json: true, timeout: 15000 });
		
// 		if (data.status !== 'success')
// 			return Promise.reject(data);
	
// 		return data.data.txid;
// 	}
// }
