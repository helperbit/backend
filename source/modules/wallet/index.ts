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

import WalletCountMetric from "./metrics/WalletCount";
import WalletBalancesMetric from "./metrics/WalletBalances";
import { Module } from "../module";
import { WalletAdminApi } from "./admin/wallet";
import { WalletApi } from "./wallet.api";

export const WalletModule: Module = {
	name: 'wallet',
	require: [],
	enabled: true,

	metrics: [
		new WalletCountMetric,
		new WalletBalancesMetric
	],

	admin: {
		title: 'Wallets',
		icon: 'fa-bitcoin',
		menu: [
			{
				icon: 'fa-reorder',
				title: 'List',
				menu: [
					{ title: 'All', url: '/admin/wallets/list/all' },
					{ title: 'Singlesig', url: '/admin/wallets/list/single' },
					{ title: 'Multisig', url: '/admin/wallets/list/multi' },
					{ title: 'Multi (in progress)', url: '/admin/wallets/list/multi_inactive' }
				]
			},
		]
	},

	adminApi() { return WalletAdminApi; },
	api() { return WalletApi; }
};
