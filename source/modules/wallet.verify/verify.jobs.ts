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

import log = require('../../log');
import moment = require('moment');
import { WalletModel } from '../wallet/wallet.model';
import { createTimeLockTransaction } from './verify.controller';

const moduleName = 'wallet.verify';
const EXPIRATION_DAYS_DIFF = 31 * 3;
// const MAX_DAYS = 31 * 2;

/**
 * Get for each wallet the expiration of the current verification which
 * is described by:
 * - 6 month after creation or last verification
 * - it reaches a new threshold since last verification (2k, 10k, 25k, 50k, 100k)
 */
export async function checkVerifyExpirations() {
	const wallets = await WalletModel.listActiveWallets('all', 'lasttimelocktransaction');
	log.job.debug(moduleName, `Checking ${wallets.length} wallets`);

	for (let i = 0; i < wallets.length; i++) {
		const wallet = wallets[i];
		let expired = false;
		// let blockprojects = false;

		if (wallet.lasttimelocktransaction == null && moment(moment()).diff(wallet.creationdate, 'days') > EXPIRATION_DAYS_DIFF) {
			expired = true;
		} else if (wallet.lasttimelocktransaction != null) {
			/* If the tx is in creation state, but passed max_days, recreate (and block projects) */

			/* If the tx is in creation state, but not passed max_days, skip */

			/* If the tx is older than expiration_days_diff, create */

			/* If the tx is not older than expiration_days_diff, but the value surpess a threshold, create */
		}

		if (!expired)
			continue;

		log.job.info(moduleName, `Wallet ${wallet.address} verification expired; creating new one`);
		// const tltx = await createTimeLockTransaction(wallet);
	}
}
