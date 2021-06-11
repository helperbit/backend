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

interface DataReplyCommon {
	success: boolean;
}

interface DataTransaction {
	output_amount_int: number;
	input_amount_int: number;
	confirmations: number;
	txid: string;
	time?: number;
	inputs: {
		addresses: string[];
	}[];
	outputs: {
		addresses: string[];
	}[];
}

interface DataAddressInner {
	transactions: DataTransaction[];
	confirmed: {
		balance: number;
	};
	unconfirmed: {
		balance: number;
	};
	total: {
		received: number;
	};
}

interface DataAddress extends DataReplyCommon {
	address: DataAddressInner;
}

interface DataAddressMulti extends DataReplyCommon {
	addresses: (DataAddressInner & { address: string })[];
}


export default class SmartbitExplorer extends Explorer {
	get name() { return 'Smartbit.com'; }

	constructor(testnet) {
		super(testnet, testnet ? 'https://testnet-api.smartbit.com.au/v1/blockchain' : 'https://api.smartbit.com.au/v1/blockchain');
	}

	isNetworkSupported(): boolean {
		return true;
	}

	getHeight(): Promise<number> {
		throw new Error("Method not implemented.");
	}

	async getTransactions(address: string): Promise<Blockchain.Txs> {
		const data = await requestTyped<DataAddress>({ url: `${this.host}/address/${address}`, timeout: 8000 });

		if (data.success != true)
			return Promise.reject(data);

		const txs = [];
		for (let i = 0; i < data.address.transactions.length; i++) {
			const tx = data.address.transactions[i];
			const amount = Conversion.toBitcoin(tx.output_amount_int - tx.input_amount_int);

			let ina = false;
			for (let j = 0; j < tx.inputs.length; j++) {
				if (tx.inputs[j].addresses.indexOf(address) != -1)
					ina = false;
			}

			txs.push({ tx: tx.txid, value: Math.abs(amount), confirmations: tx.confirmations, time: Number(tx.time) * 1000, in: ina });
		}
		return txs;
	}

	async getTransactions2(address: string): Promise<Blockchain.Txs> {
		const data = await requestTyped<DataAddress>({ url: `${this.host}/address/${address}`, timeout: 8000 });

		if (data.success != true)
			return Promise.reject(data);

		const txs = [];
		for (let i = 0; i < data.address.transactions.length; i++) {
			const tx = data.address.transactions[i];
			txs.push(tx.txid);
		}
		return txs;
	}

	async getTransaction(txid: string): Promise<Blockchain.Tx> {
		const data = await requestTyped<DataReplyCommon & {
			transaction: DataTransaction;	
		}>({ url: `${this.host}/tx/${txid}`, json: true, timeout: 8000 });

		if (data.success != true)
			return Promise.reject(data);

		const tx = { txid: txid, confirmations: data.transaction.confirmations, time: data.transaction.time, from: [], to: [] };

		data.transaction.inputs.forEach(v => {
			v.addresses.forEach(a => {
				tx.from.push(a);
			});
		});
		data.transaction.outputs.forEach(v => {
			v.addresses.forEach(a => {
				tx.to.push(a);
			});
		});

		return tx;
	}

	async getTransactionRaw(txid: string): Promise<string> {
		const data = await requestTyped<DataReplyCommon & {
			hex: {
				txid: string;
				hex: string;
			}[];
		}>({ url: `${this.host}/tx/${txid}/hex`, json: true, timeout: 8000 });

		if (data.success != true)
			return Promise.reject(data);

		return data.hex[0].hex;
	}

	async getUnspent(address: string): Promise<Blockchain.UTXO[]> {
		throw new Error("Method not implemented.");
		const data = await requestTyped<DataReplyCommon & {
			unspent: {
				txid: string;
				n: number;
				value: number;
			}[];
		}>({ url: `${this.host}/address/${address}/unspent?limit=50`, json: true, timeout: 8000 });

		if (data.success != true)
			return Promise.reject(data);

		const txs = [];
		for (let i = 0; i < data.unspent.length; i++)
			txs.push({ tx: data.unspent[i].txid, n: data.unspent[i].n, value: Number(data.unspent[i].value) });
		return txs;
	}

	async getBalance(address: string): Promise<Blockchain.Balance> {
		const data = await requestTyped<DataAddress>({
			url: `${this.host}/address/${address}`, timeout: 8000
		});

		if (data.success != true)
			return Promise.reject(data);

		return {
			balance: data.address.confirmed.balance,
			unconfirmed: data.address.unconfirmed.balance,
			received: data.address.total.received
		};
	}

	async getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]> {
		/* Max 200 addresses */
		if (addresses.length > 200)
			addresses = addresses.slice(0, 200);

		let adrstr = '';
		addresses.forEach(a => {
			adrstr += a + ',';
		});

		const data = await requestTyped<DataAddressMulti>({ url: `${this.host}/address/${adrstr}`, json: true, timeout: 8000 });

		if (data.success != true)
			return Promise.reject(data);

		const addrlist = [];

		data.addresses.forEach(addr => {
			addrlist.push({
				address: addr.address,
				balance: addr.confirmed.balance,
				unconfirmed: addr.unconfirmed.balance,
				received: addr.total.received
			});
		});

		return addrlist;
	}

	async pushTransaction(txhex: string): Promise<string> {
		const data = await requestPostTyped<DataReplyCommon & {
			txid: string; 
		}>({ url: `${this.host}/pushtx`, body: { 'hex': String(txhex) }, timeout: 30000 });

		if (data.success != true)
			return Promise.reject(data);

		return data.txid;
	}
}

