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

const AdminMerchandiseSchema = new Schema({
	time: { type: Date, default: Date.now },
	name: { type: String, unique: true },
	minrefs: Number,
	total: Number,
	assigned: { type: Number, default: 0 },
	assignments: [{
		username: String,
		time: { type: Date, default: Date.now },
		notes: { type: String, default: '' },
		status: { type: String, enum: ['assigned', 'delivering', 'delivered'], default: 'assigned' }
	}]
});

export interface $AdminMerchandiseDocument extends Document {
	time: Date;
	name: string;
	minrefs: number;
	total: number;
	assigned: number;
	assignments: {
		username: string;
		time?: Date;
		notes?: string;
		status?: 'assigned' | 'delivering' | 'delivered';
	}[];
}


export const AdminMerchandise: Model<$AdminMerchandiseDocument> =
	model<$AdminMerchandiseDocument>('AdminMerchandise', AdminMerchandiseSchema);
