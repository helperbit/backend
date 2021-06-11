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
import ModelOfDocument from "../model_of_document";
// mongoose.Promise = global.Promise;
import conf = require('../../conf');


const RorSchema = new Schema({
	status: { type: String, enum: ['pending', 'rejected', 'accepted', 'sent'], default: 'pending' },
	txid: { type: String, default: null },

	receiveaddress: { type: String, required: true },

	from: { type: String, required: true },
	to: { type: String, required: true },
	description: { type: String, required: true },
	documents: [Schema.Types.ObjectId],
	hash: { type: String, required: true },

	invvat: { type: String, required: true },
	invdate: { type: Date, required: true },

	valuebtc: { type: Number },
	value: { type: Number, required: true },
	currency: { type: String, enum: conf.currency.supported },

	rejectreason: { type: String },

	time: { type: Date, default: Date.now }
});

export interface $RorDocument extends Document {
	status: 'pending' | 'rejected' | 'accepted' | 'sent';
	txid: string;
	receiveaddress: string;
	from: string;
	to: string;
	description: string;
	documents: ObjectId[];
	hash: string;
	invvat: string;
	invdate: Date;
	valuebtc: number;
	value: number;
	currency: string;
	rejectreason?: string;
	time: Date;
}

export interface $RorModel extends $RorDocument {
	getByID(id: string, selector?: string): Promise<$RorDocument>;
};


export const Ror: Model<$RorDocument> = model<$RorDocument>('Ror', RorSchema);


export class RorModel extends ModelOfDocument<$RorDocument> {
	static getByID(id: ObjectId, selector?: string) {
		return Ror.findById(id, selector).exec();
	}
}
