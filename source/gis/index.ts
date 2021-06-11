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

import conf = require('../conf');
import { RiskLevel } from './types';
import { EventGetter } from './event_getter';
import { EarthquakeEventGetter } from './earthquake';
import { requestTyped } from '../helpers/request-typed';
import { FloodEventGetter } from './flood';

/** Get the risk level for the given coordinates */
export async function getRiskLevel(lat: number, lon: number): Promise<RiskLevel> {
	try {
		const data = await requestTyped<RiskLevel>({ 
			url: `${conf.services.gis.url}getClassNew.php?lat=${lat}&lon=${lon}`, 
			timeout: 30000 
		});
		return data;
	} catch (err) {
		return Promise.reject(err);
	}
}


export const EventGetters: { [key: string]: () => EventGetter<any> } = {
	'earthquake': () => new EarthquakeEventGetter(),
	'flood': () => new FloodEventGetter()
};
