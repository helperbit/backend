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

import ProposedNPOCountMetric from "./metrics/ProposedNPOCount";
import { Module } from "../module";
import { ProposedNPOAdminApi } from "./admin/proposednpo";
import { ProposedNPOApi } from "./proposednpo.api";

export const ProposedNPOModule: Module = {
	name: 'proposednpo',
	require: [],
	enabled: true,

	admin: {
		title: 'Proposed NPO',
		icon: 'fa-address-card',
		url: '/admin/proposednpo'
	},

	adminApi: () => ProposedNPOAdminApi,
	api: () => ProposedNPOApi,
	metrics: [
		new ProposedNPOCountMetric
	]
};
