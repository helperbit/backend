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
import { FeatureCollection, Geometry, Feature } from 'geojson';
import { EventCommonProperties, EventRootObject } from './types';
import { $EventDocument } from '../modules/event/event.model';
import { EventGetter, GetEventsOptions } from './event_getter';
import { EventConfig, EventModule } from '../modules/event';
import { getModuleConfiguration } from '../modules/module';
import { requestTyped } from '../helpers/request-typed';

const country = require('../data/country.json');


export interface EarthquakeEventProperties extends EventCommonProperties {
	last_shake_time: string;
	max_magnitude: number;
	popolazione_coinvolta: number;
	num_comuni: number;
	affected_countries: string[];
	placca_ricadente: string;
	placca_secondaria: string;
	mountain_range?: any;
	distanza_faglia: number;
	is_sea: boolean;
	usgs_name_first: string;
	usgs_name_max: string;
	tsunami: boolean;
	n_shakes: number;
	typical_depth: number;
	capital_population: number;
	old_event?: any;
	years_from_last_strong_event?: any;
	data_ultimo_evento?: any;
	max_magnitude_ultimo_evento?: any;
	caduti_ultimo_evento?: any;
	case_distrutte_ultimo_evento?: any;
	tzunami_ultimo_evento?: any;
	danni_in_milioni_dollari_ultimo_evento?: any;
	zone: number;
	usgs_name_all: string[];
}
export type EarthquakeEventType = EventRootObject<EarthquakeEventProperties>;


export class EarthquakeEventGetter extends EventGetter<EarthquakeEventType> {
	async getList(opts: GetEventsOptions): Promise<EarthquakeEventType[]> {
		const offset = opts.offset || 0;
		const limit = opts.limit || 100;

		try {
			const data: FeatureCollection = await requestTyped<FeatureCollection>({
				timeout: 60000,
				url: `${conf.services.gis.url}getEarthquakeEventsEpicentro.php?limit=${limit}&offset=${offset}`
			});
			return data.features as EarthquakeEventType[];
		} catch (err) {
			return Promise.reject(err);
		}
	}


	async getArea(eventId: string): Promise<Geometry> {
		try {
			const data = await requestTyped<FeatureCollection>({
				url: `${conf.services.gis.url}getEarthquakeEventsAreaFromIdEvento.php?id_evento=${eventId}`,
				timeout: 120000
			});
			return data.features[0].geometry;
		} catch (err) {
			return Promise.reject('nodata');
		}
	}


	async getAreaLayers(eventId: string): Promise<Feature<Geometry, { mag: number }>[]> {
		try {
			const data = await requestTyped<FeatureCollection>({ 
				url: `${conf.services.gis.url}getShakeMapAreasFromIdEvento.php?id_evento=${eventId}`, 
				timeout: 120000 });

			if (data.features === null || data.features.length <= 0)
				return Promise.reject('nodata');

			const shakemaps: any[] = [];

			for (let i = 0; i < data.features.length; i++) {
				if (parseFloat(data.features[i].properties.mag) < 5.0)
					continue;

				const sm: any = {
					type: 'Feature',
					properties: { magnitude: data.features[i].properties.mag },
					geometry: data.features[i].geometry
				};
				shakemaps.push(sm);
			}

			return shakemaps;
		} catch (err) {
			return Promise.reject('connerr');
		}
	}


	/** Return earthquakes of event */
	async getEarthquakes(eid: string): Promise<FeatureCollection> {
		try {
			const data = await requestTyped<FeatureCollection>({ 
				url: `${conf.services.gis.url}getEarthquakesFromEvent.php?id_evento=${eid}`, 
				timeout: 120000 });

			if (data.features !== null)
				return data;
			else
				return Promise.reject('nodata');
		} catch (err) {
			return Promise.reject(err);
		}
	}


	async parse(event: $EventDocument, item: EarthquakeEventType): Promise<$EventDocument> {
		if (event.datasource != 'USGS') {
			event.datasource = 'USGS';
			await event.save();
		}

		const c = [item.properties.country.substring(0, 3)];
		if (item.properties.affected_countries !== null) {
			for (let i = 0; i < item.properties.affected_countries.length; i++) {
				if (c.indexOf(item.properties.affected_countries[i].substring(0, 3)) != -1)
					continue;
				c.push(item.properties.affected_countries[i].substring(0, 3));
			}
		}

		event = event.updateField('affectedcountries', c, 'array');

		event = event.updateField('issea', item.properties.is_sea, '*');
		event = event.updateField('maxmagnitude', Number(item.properties.max_magnitude), '*');
		event = event.updateField('plateprimary', item.properties.placca_ricadente, '*');
		event = event.updateField('platesecondary', item.properties.placca_secondaria, '*');
		event = event.updateField('faultdistance', Number(item.properties.distanza_faglia), '*');
		event = event.updateField('typicaldepth', Number(item.properties.typical_depth), '*');
		event = event.updateField('shakes', Number(item.properties.n_shakes), '*');
		event = event.updateField('tsunami', Number(item.properties.tsunami), 'bool');

		event = event.updateField('timezone', Number(item.properties.zone) || 0, '*');
		event = event.updateField('lastshakedate', Date.parse(item.properties.last_shake_time), 'date');
		event = event.updateField('affectedcities', Number(item.properties.num_comuni), '*');
		event = event.updateField(['population', 'affected'], Number(Math.floor(Number(item.properties.popolazione_coinvolta) / 100) * 100), '*');

		/* Historical */
		event = event.updateField(['historical', 'present'], item.properties.old_event || false, '*');
		event = event.updateField(['historical', 'yeardiff'], Number(item.properties.years_from_last_strong_event), '*');
		event = event.updateField(['historical', 'date'], Date.parse(item.properties.data_ultimo_evento), 'date');
		event = event.updateField(['historical', 'magnitude'], Number(item.properties.max_magnitude_ultimo_evento), '*');
		event = event.updateField(['historical', 'deaths'], Number(item.properties.caduti_ultimo_evento), '*');
		event = event.updateField(['historical', 'destroyedhouse'], Number(item.properties.case_distrutte_ultimo_evento), '*');
		event = event.updateField(['historical', 'tsunami'], item.properties.tzunami_ultimo_evento, '*');
		event = event.updateField(['historical', 'damagecost'], Number(item.properties.danni_in_milioni_dollari_ultimo_evento), '*');

		return event;
	}

	shouldBeVisible(item: EarthquakeEventType, event: $EventDocument): boolean {
		const moduleConfig = getModuleConfiguration(EventModule) as EventConfig;
		return item.properties.max_magnitude >= moduleConfig.earthquake.minVisibleMagnitude;
	}

	shouldBeProcessed(item: EarthquakeEventType): boolean {
		const moduleConfig = getModuleConfiguration(EventModule) as EventConfig;

		if (
			/* (
				event !== null && 
				event.maxmagnitude < eventConf.earthquake.minSeaMagnitude && 
				event.issea && country.indexOf (item.properties.country) == -1 &&
				(parseInt (item.properties.popolazione_coinvolta) < eventConf.affectedTrigger)
			) ||*/
			(
				item.properties.is_sea && country.indexOf(item.properties.country) == -1 &&
				(
					(Number(item.properties.max_magnitude) < moduleConfig.earthquake.minSeaMagnitude) ||
					(Number(item.properties.popolazione_coinvolta) < moduleConfig.affectedTrigger)
				)
			) ||
			/* (
				event !== null && 
				event.maxmagnitude < eventConf.minmagnitude && 
				!event.issea || country.indexOf (item.properties.country) != -1 && 
				(parseInt (item.properties.popolazione_coinvolta) < eventConf.affectedTrigger)
			) ||*/
			(
				!item.properties.is_sea && country.indexOf(item.properties.country) == -1 &&
				(
					(Number(item.properties.max_magnitude) < moduleConfig.earthquake.minMagnitude) ||
					(Number(item.properties.popolazione_coinvolta) < moduleConfig.affectedTrigger)
				)
			)) {
			return false;
		}

		return true;
	}
}
