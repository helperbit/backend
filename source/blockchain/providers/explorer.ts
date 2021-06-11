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

import { Blockchain } from "..";

export default abstract class Explorer {
	protected host: string;
	protected testnet: boolean;

	constructor(testnet: boolean, host: string = '') {
		this.testnet = testnet;
		this.host = host;
	}

	abstract get name(): string;
	abstract isNetworkSupported(): boolean;
	abstract getHeight(): Promise<number>;
	abstract getTransactions(address: string): Promise<Blockchain.Txs>;
	abstract getTransactions2(address: string): Promise<Blockchain.Txs>;
	abstract getTransaction(txid: string): Promise<Blockchain.Tx>;
	abstract getTransactionRaw(txid: string): Promise<string>;
	abstract getUnspent(address: string): Promise<Blockchain.UTXO[]>;
	abstract getBalance(address: string): Promise<Blockchain.Balance>;
	abstract getMultiBalance(addresses: string[]): Promise<Blockchain.BalanceEx[]>;
	abstract pushTransaction(txhex: string): Promise<string>;
}

