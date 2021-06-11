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

// import { GISItemProperties, GetEventsOptions } from ".";

// import request = require('request-promise-native');
// import conf = require('../conf');


// type GISWildfireItem = {
// 	geometry: any,
// 	properties: GISItemProperties & {
// 		area: number
// 	}
// };

// /**
//  * Get the event list
//  */
// export async function getEvents (options: GetEventsOptions): Promise<void> {
// 	const offset = options.offset || 0;
// 	const limit = options.limit || 100;

// 	try {
// 		const data = await request({ url: `${conf.services.gis.url}getFireEventsCenter.php`, json: true });
// 		return data;
// 	} catch (err) {
// 		return Promise.reject(err);
// 	}
// }



// /** 
//  * Return the area of an earthquake event
//  * 
//  * call: resolve (geometry)
//  */
// export async function getEventArea (eid: string): Promise<void> {
// 	try {
// 		const data = request({ url: `${conf.services.gis.url}getFireEventAreaFromIdEvento.php?id_evento=${eid}`, json: true });

// 		if (data.features === null || data.features.length <= 0)
// 			return Promise.reject();

// 		return data.features[0].geometry;
// 	} catch (e) {
// 		return Promise.reject(e);
// 	}
// }



// /* Parse an event */
// export async function parse (event: any, item: GISWildfireItem) {
// 	if (event.type != 'wildfire') {
// 		event.type = 'wildfire';
// 		await event.save();
// 	}

// 	if (event.datasource != 'MODIS') {
// 		event.datasource = 'MODIS';
// 		await event.save();
// 	}

// 	let mag = 5;
// 	if (item.properties.area < 50000000)
// 		mag = 6;
// 	else if (item.properties.area < 80000000)
// 		mag = 7;
// 	else if (item.properties.area < 110000000)
// 		mag = 8;
// 	else
// 		mag = 9;
// 	event = event.updateField('maxmagnitude', mag, '*');
// 	event = event.updateField('area', Number(item.properties.area), '*');
// 	return event;
// };
