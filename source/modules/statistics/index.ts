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
import { StatisticsApi } from "./statistics.api";
import { update, updateSocial } from "./statistics.jobs";

export interface StatisticsConfig {
	minYear: number;
}

export const StatisticsModule: Module = {
	name: 'statistics',
	require: [],
	enabled: true,

	api: () => StatisticsApi,
	jobs: [
		{ job: update, timeout: 396000 },
		{ job: updateSocial, timeout: 396000 }
	]
};
