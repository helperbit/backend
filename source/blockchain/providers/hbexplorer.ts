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
// import Explorer from './explorer';
// import { Blockchain, SAT_IN_BITCOIN } from '..';

// export default class HBExplorer extends Explorer {
// 	get name() { return 'HBExplorer'; }

// 	constructor(network) {
// 		super(network, 'http://37.59.138.19:9999');
// 	}

// 	isNetworkSupported(): boolean {
// 		return !this.testnet;
// 	}

// 	async getHeight(): Promise<number> {
// 		const data = await request({ url: this.host, json: true, timeout: 8000 });
// 		if ('status' in data && data.status != 'ok')
// 			return Promise.reject(data);

// 		return data.data.lastblock.height;
// 	}

// 	async getTransactions(address: string): Promise<Blockchain.Txs> {
// 		const data = await request({ url: `${this.host}/address/${address}/transactions`, json: true, timeout: 8000 });
	
// 		if ('status' in data && data.status != 'ok')
// 			return Promise.reject(data);
	
// 		const txs = [];
// 		for (let i = 0; i < data.data.length; i++) {
// 			const tx = data.data[i];
// 			let amount = 0.0;
// 			let incoming = true;
	
// 			for (let j = 0; j < tx.inputs.length; j++) {
// 				if (tx.inputs[j].spentby == address) {
// 					incoming = false;
// 				}
// 			}
	
// 			for (let z = 0; z < tx.outputs.length; z++) {
// 				if (!incoming && tx.outputs[z].spendableby != address) {
// 					amount += tx.outputs[z].value / SAT_IN_BITCOIN;
// 				}
// 				if (incoming && tx.outputs[z].spendableby == address) {
// 					amount += tx.outputs[z].value / SAT_IN_BITCOIN;
// 				}
// 			}
	
// 			const conf = tx.confirmed == true ? 1 : 0;
	
// 			txs.push({ tx: tx.hash, value: amount, confirmations: conf, time: parseInt(tx.time) * 1000, in: incoming });
// 		}
	
// 		txs.sort((a, b) => a.time - b.time);
// 		return txs;
// 	}

// 	async getTransactions2(address: string): Promise<Blockchain.Txs> {
// 		const data = await request({ url: `${this.host}/address/${address}/transactions`, json: true, timeout: 8000 });
	
// 		if ('status' in data && data.status != 'ok')
// 			return Promise.reject(data);
	
// 		return data.data.map(tx => tx.hash);
// 	}
	
// 	async getTransaction(txid: string): Promise<Blockchain.Tx> {
// 		// TODO: non possiamo usarlo perche' in quanto prunato lo spentby non viene rilevato
// 		// const data = await request({ url: host + endpoints.tx + txid, json: true, timeout: 8000 });
	
// 		// if ('status' in data && data.status != 'ok')
// 		// 	return Promise.reject(data);
	
// 		// const tx = { txid: txid, confirmations: data.data.height ? 1 : 0, time: parseInt(data.data.time) * 1000, from: [], to: [] };
	
// 		// data.data.inputs.forEach(v => {
// 		// 	tx.from.push(v.spentby);
// 		// });
// 		// data.data.outputs.forEach(v => {
// 		// 	tx.to.push(v.spendableby);
// 		// });
	
// 		// return tx;
// 		throw new Error("Method not implemented.");
// 	}
// 	async getTransactionRaw(txid: string): Promise<string> {
// 		// request ({ url: host + endpoints.tx + txid, json: true, timeout: 8000})
// 		// .then ((data) => {
// 		// 	if (data.status != 'ok') 
// 		// 		return next (data.data, null);
	
// 		// 	return next (null, data.data.tx_hex);
// 		// })
// 		// .catch ((err) => {
// 		// 	return next (true, null);
// 		// });
// 		throw new Error("Method not implemented.");
// 	}

// 	async getUnspent(address: string): Promise<Blockchain.UTXO[]> {
// 		const data = await request({ url: `${this.host}/address/${address}/utxo`, json: true, timeout: 8000 });
// 		if ('status' in data && data.status != 'ok')
// 			return Promise.reject(data);
	
// 		const txs: Blockchain.UTXO[] = [];
// 		for (let i = 0; i < data.data.length; i++)
// 			txs.push({ tx: data.data[i].hash, n: data.data[i].index, value: data.data[i].value / SAT_IN_BITCOIN });
// 		return txs;
// 	}

// 	async getBalance(address: string): Promise<Blockchain.Balance> {
// 		const data = await request({ url: `${this.host}/address/${address}`, json: true, timeout: 8000 });
// 		if ('status' in data && data.status != 'ok')
// 			return Promise.reject(data);
	
// 		return {
// 			balance: data.data.balance.confirmed / SAT_IN_BITCOIN,
// 			unconfirmed: data.data.balance.unconfirmed / SAT_IN_BITCOIN,
// 			received: data.data.received / SAT_IN_BITCOIN
// 		};
// 	}
	
// 	async getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]> {
// 		/* Max 200 addresses */
// 		if (addresses.length > 200)
// 			addresses = addresses.slice(0, 200);
	
// 		const data = await request({ method: 'POST', url: `${this.host}/addresses/`, body: { addresses: addresses }, json: true, timeout: 8000 });
// 		if ('status' in data && data.status != 'ok')
// 			return Promise.reject(data);
	
// 		const addrlist = [];
	
// 		for (const addr in data.data) {
// 			addrlist.push({
// 				address: data.data[addr].address,
// 				balance: data.data[addr].balance.confirmed / SAT_IN_BITCOIN,
// 				unconfirmed: data.data[addr].balance.unconfirmed / SAT_IN_BITCOIN,
// 				received: data.data[addr].received / SAT_IN_BITCOIN
// 			});
// 		}
	
// 		return addrlist;
// 	}

// 	async pushTransaction(txhex: string): Promise<string> {
// 		const data = await request({ method: 'POST', url: `${this.host}/broadcast`, body: { txhex: txhex }, json: true, timeout: 15000 });
// 		if ('status' in data && data.status != 'ok')
// 			return Promise.reject(data);
	
// 		return data.data;
// 	}
// }
