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
import ModelOfDocument from "../model_of_document";
// mongoose.Promise = global.Promise;

const StatisticsSchema = new Schema({
	country: { type: String, unique: true, required: true, index: true },

	users: { type: Number, default: 0 },
	organizations: { type: Number, default: 0 },
	companies: { type: Number, default: 0 },
	singleusers: { type: Number, default: 0 },
	onlineusers: { type: Number, default: 0 },

	projects: { type: Number, default: 0 },
	events: { type: Number, default: 0 },

	donateddonations: { type: Number, default: 0 },
	donated: { type: Number, default: 0.0 },
	received: { type: Number, default: 0.0 },
	receiveddonations: { type: Number, default: 0 },

	topfivedonated: [{country: String, volume: Number}],
	topfivereceived: [{country: String, volume: Number}],

	history: [
		{
			start: { type: Date, default: null, unique: false },
			donateddonations: { type: Number, default: 0 },
			donated: { type: Number, default: 0.0 },
			received: { type: Number, default: 0.0 },
			receiveddonations: { type: Number, default: 0 },
		}
	],
	historylast: { type: Date, default: null }
});


export interface $History {
	start: Date;
	donateddonations: number;
	donated: number;
	receiveddonations: number;
	received: number;
}


export interface $StatisticsDocument extends Document {
	country: string;
	users: number;
	organizations: number;
	singleusers: number;
	companies: number;
	onlineusers: number;
	projects: number;
	events: number;
	donateddonations: number;
	donated: number;
	received: number;
	receiveddonations: number;
	topfivedonated: {country: string; volume: number}[];
	topfivereceived: {country: string; volume: number}[];

	history: $History[];
	historylast: Date;
}



export const Statistics: Model<$StatisticsDocument> = model<$StatisticsDocument>('Statistics', StatisticsSchema);

export class StatisticsModel extends ModelOfDocument<$StatisticsDocument> {
	static getByCountry = function (country, selector?: string) {
		return Statistics.findOne({ country: country }, selector).exec();
	}
}
