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

import DonationAltCountMetric from "./metrics/DonationAltCount";
import DonationAltVolumeMetric from "./metrics/DonationAltVolume";
import { DonationAltApi } from "./altdonation.api";
import { DonationAltAdminApi } from "./admin/altdonation";
import { Module } from "../module";
import { pendingStatusCheck, executedStatusCheck, expiredStatusCheck } from "./altdonation.jobs";

export const DonationAltModule: Module = {
	name: 'donation.alt',
	require: [],
	enabled: true,

	adminApi: () => DonationAltAdminApi,
	metrics: [
		new DonationAltCountMetric,
		new DonationAltVolumeMetric
	],
	api: () => DonationAltApi,
	jobs: [
		{ job: pendingStatusCheck, timeout: 30000 },
		{ job: executedStatusCheck, timeout: 30000 },
		{ job: expiredStatusCheck, timeout: 30000 }
	]
};
