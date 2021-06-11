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

import { Module, getModuleConfigurationFromName } from "../module";
import { GeoQuadApi } from './geoquad.api';
import { update } from "./geoquad.jobs";
const moduleConfig = getModuleConfigurationFromName('geoquad') as GeoQuadConfig;

export interface GeoQuadConfig {
	enabled: boolean;
	polling: boolean;
	side: number;
}

export const GeoQuadModule: Module = {
	name: 'geoquad',
	require: [],
	enabled: true,

	api: () => GeoQuadApi,
	jobs: moduleConfig.polling ? [{ job: update, timeout: 600000 }] : []
};
