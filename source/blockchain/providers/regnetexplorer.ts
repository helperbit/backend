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

const RPCClient = require('bitcoin-core');

const RPCConf = {
	network: 'regtest',
	username: 'test',
	password: 'test',
	host: 'localhost',
	port: 18443
};

export default class RegnetExplorer extends Explorer {
	client: any;
	mineInterval: any;

	constructor(testnet) {
		super(testnet, null);
		this.client = new RPCClient(RPCConf);

		// this.client.generateToAddress(101, "mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj").then(() => {
		// 	this.client.importPrivKey("cUxccFVBdJRq6HnyxiFMd8Z15GLThXaNLcnPBgoXLEv9iX6wuV2b");
		// });
		// this.mineInterval = setInterval(() => {
		// 	this.client.generateToAddress(1, "mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj")
		// });
	}

	get name() { return 'RegnetExplorer'; }

	isNetworkSupported() { return true; }

	async getHeight(): Promise<number> {
		const info = await this.client.getBlockchainInfo();
		return info.blocks;
	}

	async getTransactions(address: string): Promise<Blockchain.Txs> {
		let txs = await this.client.listTransactions("*", 10000, 0, true);
		txs = txs.filter(t => t.address == address)
			.filter(t => t.category == 'receive')
			.map(t => {
				const tx = {
					confirmations: t.confirmations,
					in: t.category == 'receive',
					time: t.time,
					tx: t.txid,
					value: t.amount
				};
				return tx;
			});
		return txs;
	}

	async getTransactions2(address: string): Promise<Blockchain.Txs> {
		throw new Error("Method not implemented.");
	}

	async getTransaction(txid: string): Promise<Blockchain.Tx> {
		const tx = await this.client.getTransaction(txid, true);

		return {
			txid: txid,
			confirmations: tx.confirmations,
			time: tx.time,
			from: [], //tx.details.filter(d => d.category == 'send').map(d => d.address),
			to: tx.details.filter(d => d.category == 'receive').map(d => d.address)
		};
	}

	async getTransactionRaw(txid: string): Promise<string> {
		return await this.client.getRawTransaction(txid);
	}

	async getUnspent(address: string, confMin: number = 1, confMax: number = 10000000): Promise<Blockchain.UTXO[]> {
		const utxos = await this.client.listUnspent(confMin, confMax, [address]);
		const utxos2: Blockchain.UTXO[] = utxos.map(utx => ({
			tx: utx.txid,
			n: utx.vout,
			value: utx.amount
		}));
		return utxos2;
	}

	async getBalance(address: string): Promise<Blockchain.Balance> {
		return {
			balance: (await this.getUnspent(address)).reduce((prev, current) => current.value + prev, 0),
			unconfirmed: (await this.getUnspent(address, 0, 0)).reduce((prev, current) => current.value + prev, 0),
			received: 0
		};
	}

	async getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]> {
		const b = [];

		for (const addr of addresses) {
			const bb: Blockchain.BalanceEx = await this.getBalance(addr) as Blockchain.BalanceEx;
			bb.address = addr;
			b.push(bb);
		}

		return b;
	}

	async pushTransaction(txhex: string): Promise<string> {
		return await this.client.sendRawTransaction(txhex);
	}
}
