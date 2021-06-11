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
import { requestTyped, requestPostTyped } from '../../helpers/request-typed';

interface DataAddress {
	balance: number;
	unconfirmedBalance: number;
	totalReceived: number;
}

interface DataTxs {
	txs: {
		valueIn: number;
		valueOut: number;
		txid: string;
		confirmations: number;
		time: number;
	}[];
}

export default abstract class InsightExplorer extends Explorer {
	async getHeight(): Promise<number> {
		const data = await requestTyped<{ info: { blocks: number } }>({ 
			url: `${this.host}/status?q=getBlockCount`, timeout: 8000 });
		return data.info.blocks;
	}

	async getTransactions(address: string): Promise<Blockchain.Txs> {
		const data = await requestTyped<DataTxs>({ url: `${this.host}/txs/?address=${address}`, timeout: 8000 });
		const txs = [];
	
		for (let i = 0; i < data.txs.length; i++) {
			const tx = data.txs[i];
			txs.push({ tx: tx.txid, value: Math.abs(tx.valueIn), confirmations: tx.confirmations, time: tx.time, in: (tx.valueIn > tx.valueOut) });
		}
		return txs;
	}

	async getTransactions2(address: string): Promise<Blockchain.Txs> {
		const data = await requestTyped<DataTxs>({ 
			url: `${this.host}/txs/?address=${address}`, timeout: 8000 });
		const txs = [];
	
		for (let i = 0; i < data.txs.length; i++) {
			const tx = data.txs[i];
			txs.push(tx.txid);
		}
		return txs;
	}

	async getTransaction(txid: string): Promise<Blockchain.Tx> {
		const data = await requestTyped<{
			confirmations: number;
			time: number;
			vin: {
				addr: string;
			}[];
			vout: {
				scriptPubKey: { addresses: string[] };
			}[];
		}>({ url: `${this.host}/tx/${txid}`, timeout: 8000 });
		const tx = { txid: txid, confirmations: data.confirmations, time: data.time, from: [], to: [] };
	
		data.vin.forEach(v => {
			tx.from.push(v.addr);
		});
		data.vout.forEach(v => {
			tx.to = tx.to.concat(v.scriptPubKey.addresses);
		});
	
		return tx;
	}

	async getTransactionRaw(txid: string): Promise<string> {
		const data = await requestTyped<{rawtx: string }>({ 
			url: `${this.host}/rawtx/${txid}`, timeout: 8000 });
		return data.rawtx;
	}

	async getUnspent(address: string): Promise<Blockchain.UTXO[]> {
		throw new Error("Method not implemented.");
		if (!conf.blockchain.testnet || conf.blockchain.limits.min.conf !== 0)
			return Promise.reject();
	
		const data = await requestTyped<{
			txid: string;
			vout: number;
			amount: number;
		}[]>({ url: `${this.host}/addr/${address}/utxo`, timeout: 8000 });
		const txs = [];
	
		for (let i = 0; i < data.length; i++)
			txs.push({ tx: data[i].txid, n: data[i].vout, value: data[i].amount });
		return txs;
	}

	async getBalance(address: string): Promise<Blockchain.Balance> {
		const data = await requestTyped<DataAddress>({ 
			url: `${this.host}/addr/${address}`, timeout: 8000 });
	
		return {
			balance: data.balance,
			unconfirmed: data.unconfirmedBalance,
			received: data.totalReceived
		};
	}

	getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]> {
		throw new Error("Method not implemented.");
	}

	async pushTransaction(txhex: string): Promise<string> {
		const data = await requestPostTyped<{
			txid: string;
		}>({ url: `${this.host}/tx/send`, body: { rawtx: txhex }, timeout: 8000 });
		return data.txid;
	}
}
