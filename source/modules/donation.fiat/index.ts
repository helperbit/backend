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

import DonationFiatCountMetric from "./metrics/DonationFiatCount";
import DonationFiatVolumeMetric from "./metrics/DonationFiatVolume";
import { Module } from "../module";
import { DonationFiatAdminApi } from "./admin/fiatdonation";
// import { DonationFiatApi } from "./fiatdonation.api";
// import { toWithdrawCheck, pendingWithdrawCheck, refillCheck, refillOrdersCheck } from "./fiatdonation.jobs";

export const DonationFiatModule: Module = {
	name: 'donation.fiat',
	require: [],
	enabled: true,

	adminApi: () => DonationFiatAdminApi,

	metrics: [
		new DonationFiatCountMetric,
		new DonationFiatVolumeMetric
	],

	// api: () => DonationFiatApi,

	// jobs: [
	// 	{ job: toWithdrawCheck, timeout: 30000 },
	// 	{ job: pendingWithdrawCheck, timeout: 30000 },
	// 	{ job: refillCheck, timeout: 30000 },
	// 	{ job: refillOrdersCheck, timeout: 30000 },
	// ]
};
