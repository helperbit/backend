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

import conf = require('../../conf');
import { LightningCharityPotAdminApi } from "./admin/charitypot";
import { LightningCharityPotApi } from "./charitypot.api";
import { Module } from '../module';
import { checkCurrentRound, updateCurrentRound } from './charitypot.jobs';

export interface LightningCharityPotConfig {
	expirationIncrease: number;
	roundDuration: number;
	minValue: number;
}

export const LightningCharityPotModule: Module = {
	name: 'lightning.charitypot',
	require: [],
	enabled: false,

	adminApi: () => LightningCharityPotAdminApi,
	api: () => LightningCharityPotApi,

	config: {
		expirationIncrease: 24, // 1 day of expiration increase
		roundDuration: 24 * 7, // 1 week (in hours)
		minValue: conf.blockchain.limits.min.donation / 10
	},
	jobs: [
		{ job: checkCurrentRound, timeout: 60000 },
		{ job: updateCurrentRound, timeout: 5 * 60000 },
	]
};
