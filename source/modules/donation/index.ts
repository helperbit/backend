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

import DonationCountMetric from "./metrics/DonationCount";
import DonationVolumeMetric from "./metrics/DonationVolume";
import DonationProjectCountMetric from "./metrics/DonationProjectCount";
import DonationProjectVolumeMetric from "./metrics/DonationProjectVolume";
import DonationSingleCountMetric from "./metrics/DonationSingleCount";
import DonationSingleVolumeMetric from "./metrics/DonationSingleVolume";
import { DonationApi } from "./donation.api";
import { DonationAdminApi } from "./admin/donation";
import { Module } from "../module";
import { confirmationCheck, updateReceived, updateSent, anonymousDonationCheck, unhandledTransactionCheck, checkDonationExpiration, countriesFix } from "./donation.jobs";

export const DonationModule: Module = {
	name: 'donation',
	require: [],
	enabled: true,
    
	admin: {
		title: 'Donations',
		icon: 'fa-heart',
		menu: [
			{ title: 'All', url: '/admin/donations' },
			{ title: 'Fiat Donations', url: '/admin/fiatdonations' },
			{ title: 'Alt Donations', url: '/admin/altdonations' },
		]
	},

	metrics: [
		new DonationCountMetric,
		new DonationVolumeMetric,
		new DonationProjectCountMetric,
		new DonationProjectVolumeMetric,
		new DonationSingleCountMetric,
		new DonationSingleVolumeMetric
	],
    
	jobs: [
		{ job: confirmationCheck, type: 'onBlock', firstRun: false },
		{ job: confirmationCheck, timeout: 300000 },
		{ job: updateReceived, timeout: 300000 },
		{ job: updateSent, timeout: 300000 },
		{ job: anonymousDonationCheck, timeout: 20000 },
		{ job: unhandledTransactionCheck, timeout: 60000 },
		{ job: checkDonationExpiration, timeout: 30000 },
		{ job: countriesFix, timeout: 30000 }
	],
	adminApi: () => DonationAdminApi,
	api: () => DonationApi
};
