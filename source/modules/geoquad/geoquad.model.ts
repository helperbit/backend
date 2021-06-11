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
import { Feature } from "geojson";
// mongoose.Promise = global.Promise;

const GeoQuadSchema = new Schema({
	category: { type: String, enum: ['users', 'users.singleusers', 'alerts'], unique: true },
	features: [
		{
			type: { type: String },
			properties: {
				count: { type: Number },
				idlist: [String]
			},
			geometry: {
				coordinates: [],
				type: { type: String }
			}
		}
	],
	count: { type: Number, default: 0 },
	min: { type: Number, default: 0 },
	max: { type: Number, default: 0 }
});


export interface $GeoQuadDocument extends Document {
	category: string;
	features: Feature[];
	count: number;
	min: number;
	max: number;
}

export interface $GeoQuadModel extends $GeoQuadDocument {};


export const GeoQuad: Model<$GeoQuadModel> =
	model<$GeoQuadModel>('GeoQuad', GeoQuadSchema);
