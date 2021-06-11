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

import { Module } from "../module";
import { TransactionAdminApi } from "./admin/transaction";
import { TransactionApi } from "./transaction.api";
import { confirmationCheck, broadcastCheck } from "./transaction.jobs";

export const WalletTransactionModule: Module = {
	name: 'wallet.transaction',
	require: [],
	enabled: true,
    
	admin: {
		subof: 'wallet',
		title: 'Transactions',
		icon: 'fa-bitcoin',
		menu: [
			{ title: 'All', url: '/admin/transactions/multisig/all' },
			{ title: 'Broadcasted', url: '/admin/transactions/multisig/broadcasted' },
			{ title: 'Confirmed', url: '/admin/transactions/multisig/confirmed' },
			{ title: 'To Sign', url: '/admin/transactions/multisig/tosign' }
		]
	},

	adminApi() { return TransactionAdminApi; },
	api() { return TransactionApi; },
	jobs: [
		{ job: confirmationCheck, type: 'onBlock' },
		{ job: confirmationCheck, timeout: 30000 },
		{ job: broadcastCheck, timeout: 30000 }		
	]
};
