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

import EventCountMetric from "./metrics/EventCount";
import { Module, getModuleConfigurationFromName } from "../module";
import { GeoQuadModule } from "../geoquad";
import { EventAdminApi } from "./admin/event";
import { EventApi } from "./event.api";
import { fixEmptyEarthquakes, update } from "./event.jobs";
const moduleConfig = getModuleConfigurationFromName('event') as EventConfig;

export interface EventConfig {
	affectedTrigger: number;
	minYear: number;
	updateInterval: number;
	earthquake: { 
		enabled: boolean;
		minSeaMagnitude: number;
		minMagnitude: number;
		minVisibleMagnitude: number;
		minShakeMagnitude: number;
	};
	flood: {
		enabled: boolean;
	};
	wildfire: { 
		enabled: boolean;
	};
	images: { 
		enabled: boolean; 
		number: number;
	};
}

export const EventModule: Module = {
	name: 'event',
	require: [GeoQuadModule],
	enabled: true,

	admin: {
		title: 'Events',
		icon: 'fa-globe',
		menu: [
			{ title: 'List', url: '/admin/events' },
			{ title: 'With users', url: '/admin/events/withusers' },
			// { title: 'From alerts', url: '/admin/events/alert' },
			// { title: 'From alerts (hidden)', url: '/admin/events/alert/notvisible' },
		]
	},

	adminApi: () => EventAdminApi,
	metrics: [
		new EventCountMetric
	],
	api: () => EventApi,
	jobs: [
		{ job: fixEmptyEarthquakes, timeout: moduleConfig.updateInterval / 2 }
	].concat(
		moduleConfig.earthquake.enabled ? [
			{ job: () => update('earthquake'), timeout: moduleConfig.updateInterval },
		] : []
	).concat(
		moduleConfig.wildfire.enabled ? [
			{ job: () => update('wildfire'), timeout: moduleConfig.updateInterval },
		] : []
	).concat(
		moduleConfig.flood.enabled ? [
			{ job: () => update('flood'), timeout: moduleConfig.updateInterval },
		] : []
	)
}
