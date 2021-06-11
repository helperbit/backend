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

import { Document, Schema, Model, model } from "mongoose";
import { $TString } from "../../helpers/types";
import { ObjectId } from "bson";
import ModelOfDocument from "../model_of_document";
import log = require('../../log');
import geometryHelper = require('../../helpers/geometry');
import types = require('../../helpers/types');
import { Geometry, Point } from "geojson";
// mongoose.Promise = global.Promise;

export type EventTypeEnum = 'earthquake' | 'wildfire' | 'flood';

const EventSchema = new Schema({
	visible: { type: Boolean, default: true },
	originid: { type: String, required: true },
	dataid: { type: String, unique: true, required: true },
	metatx: { type: String, default: null },
	datasource: { type: String, enum: ['USGS', 'GDACS', 'MODIS', 'manual', 'alert'], default: 'manual' },
	type: { type: String, enum: ['earthquake', 'hurricane', 'tsunami', 'flood', 'eruption', 'wildfire', 'slide', 'drought'] },
	mainevent: { type: Boolean, default: false },

	news: [{
		title: String,
		url: String,
		image: String,
		lang: String
	}],

	article: { type: types.TString, default: {} },
	images: [Schema.Types.ObjectId],

	issea: { type: Boolean, default: null },
	maxmagnitude: { type: Number, min: 1.0, max: 14.0 },
	startdate: { type: Date, default: null, index: true },
	lastshakedate: { type: Date, default: null, index: true },
	timezone: { type: String, default: null },

	affectedcountries: [String],
	affectedregions: [String],
	affectedcities: { type: Number, default: null },

	population: {
		affected: { type: Number, default: null },
		deaths: { type: Number, default: null },
		displaced: { type: Number, default: null },
		wounded: { type: Number, default: null }
	},

	epicenter: { type: { type: String }, coordinates: [] },
	geometry: { type: { type: String }, coordinates: [] },

	donations: { type: Number, default: 0 },
	donationsvolume: { type: Number, default: 0.0 },
	affectedusers: [String],

	nearcity: {
		name: { type: String, default: null },
		distance: { type: Number, default: null },
		direction: { type: Number, default: null },
		population: { type: Number, default: null }
	},

	capital: {
		name: { type: String, default: null },
		population: { type: Number, default: null },
		distance: { type: Number, default: null },
		position: { type: { type: String }, coordinates: [] }
	},

	nearcities: [{
		name: { type: String, default: null },
		position: { type: { type: String }, coordinates: [] },
		distance: { type: Number, default: null },
		population: { type: Number, default: null }
	}],

	/* Historical */
	historical: {
		present: { type: Boolean, default: false },
		yeardiff: { type: Number, default: null },
		date: { type: Date, default: null },
		magnitude: { type: Number, default: null },
		deaths: { type: Number, default: null },
		destroyedhouse: { type: Number, default: null },
		tsunami: { type: Boolean, default: null },
		damagecost: { type: Number, default: null }
	},

	/* Wildfire related */
	area: { type: Number, default: null },

	/* Earthquake related */
	typicaldepth: { type: Number, default: null },
	tsunami: { type: Boolean, default: false },
	shakes: { type: Number, default: 1 },
	earthquakes: [{
		magnitude: { type: Number, min: 1.0, max: 14.0 },
		date: { type: Date, default: null, index: true },
		epicenter: { type: { type: String }, coordinates: [] }
	}],
	shakemaps: [{ type: { type: String, default: 'Feature' }, geometry: { type: { type: String }, coordinates: [] }, properties: { magnitude: { type: Number } } }],

	plateprimary: { type: String, default: '' },
	platesecondary: { type: String, default: '' },
	faultdistance: { type: Number, default: null }
});

// EventSchema.index ({ epicenter: 'Point' });


export interface $NewsArticle {
	title: string;
	url: string;
	image: string;
	lang: string;
}

export interface $Shakemap {
	type: string;
	geometry: Geometry;
	properties: { magnitude: number	};
}

export interface $Earthquake {
	magnitude: number;
	date: Date;
	epicenter: Point;
}


export interface $EventDocument extends Document {
	visible: boolean;
	dataid: string;
	originid: string;
	metatx: string;
	datasource: string;
	type: string;
	mainevent: boolean;

	news: $NewsArticle[];
	article: $TString;
	images: ObjectId[];

	issea: boolean;
	maxmagnitude: number;
	startdate: Date;
	lastshakedate: Date;
	timezone: string;

	affectedcountries: string[];
	affectedregions: string[];
	affectedcities: number;

	population: {
		affected: number;
		deaths: number;
		displaced: number;
		wounded: number;
	};

	epicenter: Point;
	geometry: Geometry;

	donations: number;
	donationsvolume: number;
	affectedusers: string[];

	nearcity: {
		name: string;
		distance: number;
		direction: number;
		population: number;
		position: Geometry;
	};
	capital: {
		name: string;
		distance: number;
		population: number;
		position: Point;
	};
	nearcities: {
		name: string;
		population: number;
		distance: number;
		position: Geometry;
	}[];

	historical: {
		present: boolean;
		yeardiff: number;
		date: Date;
		magnitude: number;
		deaths: number;
		destroyedhouse: number;
		tsunami: boolean;
		damagecost: number;
	};

	/* Wildfire */
	area: number;

	/* Earthquake */
	typicaldepth: number;
	tsunami: boolean;
	shakes: number;
	earthquakes: $Earthquake[];
	shakemaps: $Shakemap[];
	plateprimary: string;
	platesecondary: string;
	faultdistance: number;

	updateField(field: any, value: any, type: string): $EventDocument;
}



EventSchema.methods.updateField = function (field: string, value: any, type: string) {
	const event: $EventDocument = this;

	if (value === null || (typeof (value) == 'number' && isNaN(value))) return event;

	let current;

	if (typeof (field) == 'string')
		current = event[field];
	else
		current = event[field[0]][field[1]];

	if (type == 'arraysingle') {
		if (current !== null && current.length !== 0 && current[0] == value)
			return event;
		else
			value = [value];
	}
	else if (type == 'array') {
		let eq = true;
		if (current !== null) {
			if (current.length != value.length)
				eq = false;
			else
				for (let i = 0; i < value.length; i++) {
					if (value[i] != current[i])
						eq = false;
				}
		}
		if (eq)
			return event;
	}
	else if (type == 'geometry' && geometryHelper.geometryMatch(current, value))
		return event;
	else if (type == 'date' && current !== null && current.getTime() == value)
		return event;
	else if (type == 'bool' && current === false && !value)
		return event;
	else if (current == value)
		return event;

	if (typeof (field) == 'string') {
		event[field] = value;
	} else {
		(event as any)[field[0]][field[1]] = value;
	}

	log.job.debug('event', `${event._id} updated with ${field}: ${JSON.stringify(value)}`);
	return event;
};



export const Event: Model<$EventDocument> =
	model<$EventDocument>('Event', EventSchema);


export class EventModel extends ModelOfDocument<$EventDocument> {
	static getByID(id: string | ObjectId, selector?: string) {
		return Event.findById(id, selector).exec();
	}
}
