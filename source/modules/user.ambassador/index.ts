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

import { UserAmbassadorApi } from "./ambassador.api";
import { UserAmbassadorAdminApi } from "./admin/ambassador";
import { Module } from "../module";

export const UserAmbassadorModule: Module = {
	name: 'user.ambassador',
	require: [],
	enabled: true,

	admin: {
		subof: 'user',
		title: 'Ambassador',
		icon: 'fa-trophy',
		menu: [
			{ title: 'Merchandise', url: '/admin/ambassadors/merchandise' },
			{
				title: 'Ranks', menu: [
					{ title: 'Last day', url: '/admin/ambassadors/rank/day' },
					{ title: 'Last week', url: '/admin/ambassadors/rank/week' },
					{ title: 'Last month', url: '/admin/ambassadors/rank/month' },
					{ title: 'Last 3 months', url: '/admin/ambassadors/rank/3month' },
					{ title: 'Ever', url: '/admin/ambassadors/rank/ever' },
				],
			},
		]
	},

	adminApi: () => UserAmbassadorAdminApi,
	api: () => UserAmbassadorApi,
	jobs: [
		// { job: checkAmbassadorMerchandiseAssigments, timeout: 60000 }
	]	
};
