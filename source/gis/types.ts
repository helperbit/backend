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

import { Geometry, Point } from "geojson";
import { $EventDocument } from "../modules/event/event.model";

export interface EventRootObject<T> {
	type: string;
	geometry: Geometry;
	properties: T;
}

export interface EventCommonProperties {
	id_evento: string;
	start_time: string;
	regione: string;
	country: string;

	capital_population: number;
	capital_name: string;
	metri_capitale: number;
	country_direction: string;

	citta_piu_vicina: string;
	distanza_citta_piu_vicina: number;
	direzione_citta_piu_vicina: string;
	pop_citta_piu_vicina: number;
	abitato_piu_vicino: string;
	distanza_abitato_piu_vicino: number;
}

export type CommonEventType = EventRootObject<EventCommonProperties>;


declare module Wildfire {
	export interface Properties extends EventCommonProperties {
		end_time: Date;
		affected_countries: string[];
		area: number;
	}
	export type WildfireEventType = EventRootObject<Properties>;
}


// declare module Volcanic {
// 	export interface Properties extends EventCommonProperties, EventGDACSCommonProperties { }
// 	export type VolcanicEventType = EventRootObject<Properties>;
// }

// declare module Cyclone {
// 	export interface Properties extends EventCommonProperties, EventGDACSCommonProperties { }
// 	export type CycloneEventType = EventRootObject<Properties>;
// }

// declare module Drought {
// 	export interface Properties extends EventCommonProperties, EventGDACSCommonProperties { }
// 	export type DroughtEventType = EventRootObject<Properties>;
// }


export interface NearestCity {
	type: string;
	geometry: Point;
	properties: {
		abitati: string;
		popolazione: number;
		distanza: number;
		tipo: string;
	};
}


interface RiskLevelEntry {
	class: 'norisk' | 'low' | 'medium' | 'high';
	source: string;
}

export interface RiskLevel {
	flood?: RiskLevelEntry;
	earthquake: RiskLevelEntry;
	wildfire: RiskLevelEntry;
}
