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

import Explorer from './explorer';
import { Blockchain } from '..';
import { requestTyped, requestPostTyped } from '../../helpers/request-typed';
import { Conversion } from '../../helpers/bitcoin';

export interface EsploraTransaction {
	txid: string;
	status: {
		block_height?: number;
		block_time: number;
		confirmed: boolean;
	};
	vin: {
		prevout: {
			scriptpubkey_address: string;
		};
	}[];
	vout: {
		scriptpubkey_address: string;
		value: number;
	}[];
}

export default abstract class EsploraExplorer extends Explorer {
	async getHeight(): Promise<number> {
		return parseInt(await requestTyped<string>({ url: `${this.host}/blocks/tip/height`, timeout: 8000 }));
	}

	async getTransactions(address: string): Promise<Blockchain.Txs> {
		const lasth = await this.getHeight();
		const data = await requestTyped<EsploraTransaction[]>({ url: `${this.host}/address/${address}/txs`, timeout: 8000 });

		const txs: Blockchain.Txs = [];
		for (let i = 0; i < data.length; i++) {
			const tx = data[i];
			let amount = 0.0;
			let incoming = true;

			for (let j = 0; j < tx.vin.length; j++) {
				if (tx.vin[j].prevout.scriptpubkey_address == address) {
					incoming = false;
				}
			}

			for (let z = 0; z < tx.vout.length; z++) {
				if (!incoming && tx.vout[z].scriptpubkey_address != address) {
					amount += Conversion.toBitcoin(tx.vout[z].value);
				}
				if (incoming && tx.vout[z].scriptpubkey_address == address) {
					amount += Conversion.toBitcoin(tx.vout[z].value);
				}
			}

			let confirm = 0;
			let time = Date.now();
			if (tx.status.block_height) {
				confirm = (lasth + 1) - tx.status.block_height;
				time = Number(tx.status.block_time) * 1000;
			} else {
				confirm = tx.status.confirmed ? 1 : 0;
			}

			txs.push({ tx: tx.txid, value: amount, confirmations: confirm, time: time, in: incoming });
		}
		return txs;
	}

	async getTransactions2(address: string): Promise<Blockchain.Txs> {
		throw new Error("Method not implemented.");
		// https://blockstream.info/api/address/3NpNJfgpYVyZSa8YCfUufC3idVtF3iSX6d/txs
		// const data = await requestTyped<{
		// 	txid: string;
		// }[]>({ url: `${this.host}/address/${address}/txs`, timeout: 8000 });

		// const txs: Blockchain.Txs = [];
		// for (let i = 0; i < data.length; i++) {
		// 	const tx = data[i];
		// 	txs.push({
		// 		tx: tx.txid,
		// 		value: 0,
		// 		time: 0,
		// 		confirmations: 0,
		// 		in: false
		// 	});
		// }
		// return txs;
	}

	async getTransaction(txid: string): Promise<Blockchain.Tx> {
		const lasth = await this.getHeight();
		const data = await requestTyped<EsploraTransaction>({ url: `${this.host}/tx/${txid}`, timeout: 8000 });

		const tx: Blockchain.Tx = { txid: txid, confirmations: 0, time: Date.now(), from: [], to: [] };

		if (data.status.block_height) {
			tx.confirmations = (lasth + 1) - data.status.block_height;
			tx.time = data.status.block_time;
		} else {
			tx.confirmations = data.status.confirmed ? 1 : 0;
		}

		data.vin.forEach(v => {
			tx.from.push(v.prevout.scriptpubkey_address);
		});
		data.vout.forEach(v => {
			tx.to.push(v.scriptpubkey_address);
		});

		return tx;
	}

	async getTransactionRaw(txid: string): Promise<string> {
		return await requestTyped<string>({
			url: `${this.host}/tx/${txid}/hex`, json: false, timeout: 8000
		});
	}

	async getUnspent(address: string): Promise<Blockchain.UTXO[]> {
		const data = await requestTyped<{
			txid: string;
			vout: number;
			value: number;
		}[]>({ url: `${this.host}/address/${address}/utxo`, timeout: 8000 });

		return data.map(u => ({
			tx: u.txid,
			n: u.vout,
			value: Conversion.toBitcoin(u.value)
		}));
	}

	async getBalance(address: string): Promise<Blockchain.Balance> {
		throw new Error("Method not implemented.");

		// Non abbiamo possibilita' di ottenere l'unconfirmed
		const data = await requestTyped<any>({ url: `${this.host}/address/${address}`, timeout: 8000 });
		const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum);

		return {
			received: Conversion.toBitcoin(data.chain_stats.funded_txo_sum),
			balance: Conversion.toBitcoin(balance),
			unconfirmed: 0,
		};
	}

	async getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]> {
		throw new Error("Method not implemented.");
	}

	async pushTransaction(txhex: string): Promise<string> {
		return await requestPostTyped<string>({
			url: `${this.host}/tx`, body: txhex, json: false, timeout: 8000
		});
	}
}
