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

import LightningInvoiceCountMetric from "./metrics/LightningInvoiceCount";
import LightningInvoiceVolumeMetric from "./metrics/LightningInvoiceVolume";
import { Module } from "../module";
import { LightningAdminApi } from "./admin/lightning";
import { LightningApi } from "./lightning.api";
import { checkExpired, deleteExpired, checkPayment, streamPayment } from "./lightning.jobs";

export const LightningModule: Module = {
	name: 'lightning',
	require: [],
	enabled: true,

	admin: {
		subof: 'wallet',
		title: 'Lightning',
		icon: 'fa-flash',
		menu: [
			{ title: 'Invoices', url: '/admin/lightning/invoices' },
			{ title: 'Charity Pot', url: '/admin/charitypot/rounds' }
		]
	},

	adminApi: () => LightningAdminApi,
	api: () => LightningApi,
	metrics: [
		new LightningInvoiceCountMetric,
		new LightningInvoiceVolumeMetric
	],
	jobs: [
		{ job: checkExpired, timeout: 30000 },
		{ job: deleteExpired, timeout: 300000 },
		{ job: checkPayment, timeout: 300000 },
		{ job: streamPayment, type: 'onStart' }
	]
};
