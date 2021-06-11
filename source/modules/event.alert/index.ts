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

import AlertCountMetric from "./metrics/AlertCount";
import { Module, getModuleConfigurationFromName } from "../module";
import { EventAlertAdminApi } from "./admin/alert";
import { EventAlertApi } from "./alert.api";
import { cleanPast } from "./alert.jobs";

export interface EventAlertConfig {
	enabled: boolean;
	expiration: number;
	threshold: number;
	gridSize: {
		default: number;
		earthquake: number;
		wildfire: number;
		flood: number;
		tsunami: number;
		drought: number;
	};
}

export const EventAlertModule: Module = {
	name: 'event.alert',
	require: [],
	enabled: getModuleConfigurationFromName('event.alert').enabled,

	admin: {
		title: 'Alert',
		icon: 'fa-alert',
		url: '/admin/alerts'
	},

	adminApi: () => EventAlertAdminApi,
	metrics: [
		new AlertCountMetric
	],
	api: () => EventAlertApi,
	jobs: [
		{ job: cleanPast, timeout: 300000 }
	]
};
