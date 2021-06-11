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

import UserGenderFemaleMetric from "./metrics/UserGenderFemale";
import UserGenderMaleMetric from "./metrics/UserGenderMale";
import UserGeolocalizedMetric from "./metrics/UserGeolocalized";
import UserNotGeolocalizedMetric from "./metrics/UserNotGeolocalized";
import { Module } from "../module";
import { UserAdminApi } from "./admin/user";
import { UserApi } from "./user.api";
import { checkPremiumExpiration } from "./user.jobs";

export const UserModule: Module = {
	name: 'user',
	require: [],
	// require: ['notification', 'media', 'event'],
	enabled: true,

	admin: {
		title: 'Users',
		icon: 'fa-users',
		menu: [
			{
				icon: 'fa-user',
				title: 'By Type',
				menu: [
					{ title: 'Single users', url: '/admin/users/bytype/singleuser' },
					{ title: 'Organizations', url: '/admin/users/bytype/npo' },
					{ title: 'Companies', url: '/admin/users/bytype/company' }
				]
			},
			{
				icon: 'fa-id-card',
				title: 'Pending Verification',
				menu: [
					{ title: 'Manual verify', url: '/admin/users/verify/manual/pending' },
					{ title: 'Residency verify', url: '/admin/users/verify/residency/pending' },
					{ title: 'OTC verify', url: '/admin/users/verify/otc/pending' },
					{ title: 'Npo verify', url: '/admin/users/verify/npo/pending' },
					{ title: 'Npo Statute verify', url: '/admin/users/verify/npostatute/pending' },
					{ title: 'Npo Memorandum verify', url: '/admin/users/verify/npomemorandum/pending' },
					{ title: 'Npo Admins verify', url: '/admin/users/verify/npoadmins/pending' },
					{ title: 'Company verify', url: '/admin/users/verify/company/pending' },
					{ title: 'Document verify', url: '/admin/users/verify/document/pending' },
				]
			},
			{
				icon: 'fa-id-card-o',
				title: 'In-Progress Verification',
				menu: [
					{ title: 'OTC verify', url: '/admin/users/verify/otc/inprogress' }
				]
			},
			{
				icon: 'fa-globe',
				title: 'Geolocalization',
				menu: [
					{ title: 'Online Map', url: '/admin/users/online' },
					{ title: 'Geolocalized Map', url: '/admin/users/geolocalized' },
					{ title: 'Users in Italian Cities', url: '/admin/users/aggregated/bycity' },
					{ title: 'Users/Projects by Country', url: '/admin/users/aggregated/bycountry' },
				]
			},
			{
				icon: 'fa-ban',
				title: 'Banned Users',
				url: '/admin/users/banned'
			},
			{
				icon: 'fa-ticket',
				title: 'Premium Users',
				url: '/admin/users/premium'
			},
			{
				icon: 'fa-microchip',
				title: 'IP Conflicts',
				url: '/admin/users/ipconflicts'
			},
			{
				icon: 'fa-exclamation-triangle',
				title: 'Not active',
				url: '/admin/users/notactive'
			}
		]
	},
	adminApi: () => UserAdminApi,
	metrics: [
		new UserGenderFemaleMetric,
		new UserGenderMaleMetric,
		new UserGeolocalizedMetric,
		new UserNotGeolocalizedMetric
	],
	api: () => UserApi,
	jobs: [
		{ job: checkPremiumExpiration, timeout: 1000000 }
	]
};
