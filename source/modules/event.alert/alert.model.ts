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
import { ObjectId } from "bson";
import { Point } from "geojson";

const AlertSchema = new Schema({
	description: { type: String },
	user: { type: String },
	type: { type: String },
	media: { type: Schema.Types.ObjectId, default: null },
	weight: { type: Number, min: 0.0, max: 1.0 },
	time: { type: Date, default: Date.now },
	position: { type: { type: String }, coordinates: [] }
});

export interface $AlertDocument extends Document {
	description: string;
	user: string;
	type: string;
	media: ObjectId | null;
	weight: number;
	time: any;
	position: Point;
}

export interface $AlertModel extends $AlertDocument {}

export const Alert: Model<$AlertModel> =
	model<$AlertModel>('Alert', AlertSchema);
