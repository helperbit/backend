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

import { Wallet } from "../wallet/wallet.model";
import log = require('../../log');
import { RedisCache } from "../../helpers/cache";
import { Blockchain } from "../../blockchain";
import { Conversion } from "../../helpers/bitcoin";

const hbCache = new RedisCache();
const moduleName = 'blockchain';

export async function updatePrices() {
	log.job.debug(moduleName, 'Updating prices');
	await Blockchain.updatePrices();
}

export async function updateFees() {
	log.job.debug(moduleName, 'Updating fees');
	await Blockchain.updateFees();
}

// TODO: move this to wallet!
export async function updateCachedBalances() {
	const wallets = await Wallet.find({
		$or: [
			{ ismultisig: false },
			{ $and: [{ ismultisig: true }, { 'multisig.active': true }] }
		]
	}, 'address').exec();

	const addresses = wallets.map(a => a.address);
	log.job.debug(moduleName, `Updating cached balances of ${addresses.length} wallets`);

	try {
		const balances = await Blockchain.getMultiBalance(addresses);
		const totalbalance = Conversion.floorToSatoshi(
			balances.reduce((prev, curr) => prev + Number(curr.balance), 0.0));
		await hbCache.set('totalbalance', totalbalance);
		log.job.debug(moduleName, `Updated cached balances of ${addresses.length} wallets: ${totalbalance}`);
	} catch (err) {
		log.job.error(moduleName, `Failed to update cached balances of ${addresses.length} wallets`);
	}
}
