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
import log = require('../log');
import { EventCommonProperties, EventRootObject } from "./types";
import { Geometry, Feature, FeatureCollection } from "geojson";
import { $EventDocument } from "../modules/event/event.model";
import { EventGetter, GetEventsOptions } from "./event_getter";
import { requestTyped } from '../helpers/request-typed';
import { isGeometryEmpty } from '../helpers/geometry';

type AlertLevel = 'White' | 'Orange' | 'Red';

export interface EventGDACSCommonProperties {
	crisis_alert_level: AlertLevel;
	crisis_event_episode: number;
	crisis_population: string;
	crisis_severity: string;
	crisis_severity_hash: string;
	crisis_vulnerability: string;
	crisis_vulnerability_hash: string;
	dc_date: string;
	dc_description: string;
	dc_title: string;
	gn_parent_country: string;
	is_sea: boolean;
}

function alertLevelToMagnitude(al: AlertLevel) {
	switch (al) {
		case 'Red':
			return 8.0;
		case 'Orange':
			return 7.0
		case 'White':
			return 6.0;
		default:
			return 1.0;
	}
}

export interface GDACSProperties extends EventCommonProperties, EventGDACSCommonProperties { }
export type GDACSEventType = EventRootObject<GDACSProperties>;

export abstract class GDACSEventTypeEventGetter extends EventGetter<GDACSEventType> {
	callName: string;

	constructor(callName: string) {
		super();
		this.callName = callName;
	}

	async getList(opts: GetEventsOptions): Promise<GDACSEventType[]> {
		try {
			const data: FeatureCollection = await requestTyped<FeatureCollection>({
				timeout: 60000,
				url: `${conf.services.gis.url}get${this.callName}.php`
			});
			return data.features as GDACSEventType[];
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async getArea(eventId: string): Promise<Geometry> {
		try {
			const data = await requestTyped<FeatureCollection>({
				url: `${conf.services.gis.url}get${this.callName}Aree.php?id_evento=${eventId}`,
				timeout: 120000,
				json: true
			});
			const geom = data.features[0].geometry;
			
			if (isGeometryEmpty(geom))
				return Promise.reject('nodata');

			return geom;
		} catch (err) {
			return Promise.reject('nodata');
		}
	}

	async getAreaLayers(eventId: string): Promise<Feature<Geometry, { mag: number }>[]> {
		try {
			const data = await requestTyped<FeatureCollection>({
				url: `${conf.services.gis.url}get${this.callName}AreasFromId.php?id_evento=${eventId}`,
				timeout: 120000,
				json: true
			});

			if (data.features.length == 1)
				return Promise.reject('nodata');

			log.job.error('event', 'Area layers not handled');
			return Promise.reject('nodata');
			// return data.features[0].geometry;
		} catch (err) {
			return Promise.reject('nodata');
		}
	}

	async parse(event: $EventDocument, item: GDACSEventType): Promise<$EventDocument> {
		if (event.datasource != 'GDACS') {
			event.datasource = 'GDACS';
			await event.save();
		}

		event = event.updateField('maxmagnitude', alertLevelToMagnitude(item.properties.crisis_alert_level), '*');
		event = event.updateField('lastshakedate', Date.parse(item.properties.dc_date), 'date');
		event = event.updateField(['population', 'affected'], Number(item.properties.crisis_population), '*');
		event = event.updateField('issea', item.properties.is_sea, '*');
		return event;
	}

	shouldBeVisible(item: GDACSEventType, event: $EventDocument): boolean {
		return event.maxmagnitude > 1 && !isGeometryEmpty(event.geometry);
	}

	shouldBeProcessed(item: GDACSEventType): boolean {
		return (item.properties.crisis_alert_level as any);
	}
}
