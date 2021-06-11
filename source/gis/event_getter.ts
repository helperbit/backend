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
import stringHelper = require('../helpers/string');
import { Geometry, Feature, FeatureCollection } from 'geojson';
import { $EventDocument } from '../modules/event/event.model';
import { NearestCity, CommonEventType } from './types';
import { requestTyped } from '../helpers/request-typed';

export interface GetEventsOptions {
	limit?: number;
	offset?: number;
}

export abstract class EventGetter<T = CommonEventType> {
	abstract async getList(opts: GetEventsOptions): Promise<T[]>;
	abstract async getArea(eventId: string): Promise<Geometry>;
	abstract async getAreaLayers(eventId: string): Promise<Feature<Geometry, { mag: number }>[]>;
	abstract async parse(event: $EventDocument, item: T): Promise<$EventDocument>;
	abstract shouldBeProcessed(item: T): boolean;
	abstract shouldBeVisible(item: T, event: $EventDocument): boolean;

	async getEventNearestCities(eventId: string): Promise<NearestCity[]> {
		try {
			const data = await requestTyped<{
				features: NearestCity[];
			}>({ url: `${conf.services.gis.url}getMoreInfoFromIdEvento.php?id_evento=${eventId}`, timeout: 120000 });
			let nc = data.features;

			if (nc.length > 8)
				nc = nc.splice(0, 4)
			return nc;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async parseCommon(event: $EventDocument, item: CommonEventType): Promise<$EventDocument> {
		// event = event.updateField('lastshakedate', Date.parse(item.properties.start_time), 'date');
		event = event.updateField('epicenter', item.geometry, 'geometry');
		if (event.affectedcountries.length == 0)
			event = event.updateField('affectedcountries', [item.properties.country.substring(0, 3)], 'array');
		event = event.updateField('affectedregions', item.properties.regione, 'arraysingle');
		event = event.updateField('startdate', Date.parse(item.properties.start_time), 'date');

		/* Nearest city */
		event = event.updateField(['nearcity', 'name'], stringHelper.capitalizeFirstLetter(item.properties.citta_piu_vicina), '*');
		event = event.updateField(['nearcity', 'distance'], Math.floor(Number(item.properties.distanza_citta_piu_vicina) / 1000), '*');
		event = event.updateField(['nearcity', 'direction'], Number(item.properties.direzione_citta_piu_vicina), '*');
		event = event.updateField(['nearcity', 'population'], Number(item.properties.pop_citta_piu_vicina), '*');

		/* Capital */
		event = event.updateField(['capital', 'name'], stringHelper.capitalizeFirstLetter(item.properties.capital_name), '*');
		event = event.updateField(['capital', 'population'], Number(item.properties.capital_population), '*');
		event = event.updateField(['capital', 'distance'], Math.floor(Number(item.properties.metri_capitale) / 1000), '*');

		return event;
	}
}
