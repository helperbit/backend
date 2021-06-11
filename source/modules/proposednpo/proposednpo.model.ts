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

const ProposedNPOSchema = new Schema({
	verified: { type: Boolean, default: false, select: false },
	reporter: { type: String, default: null, select: false, index: true },
	time: { type: Date, default: Date.now, select: false },

	country: { type: String, required: true },
	name: { type: String, required: true, unique: true },
	link: { type: String },
	endorsment: { type: Number, default: 1 },

	endorsedbyips: { type: Array, default: [], select: false },
	endorsedbyusers: { type: Array, default: [], select: false, index: true },

	social: {
		facebook: { type: String, default: null },
		twitter: { type: String, default: null },
		googleplus: { type: String, default: null }
	}
});

export interface $ProposedNPODocument extends Document {
	verified: boolean;
	reporter: string;
	time: Date;
	country: string;
	name: string;
	link: string;
	endorsment: number;
	endorsedbyips: string[];
	endorsedbyusers: string[];

	social: {
		facebook: string;
		twitter: string;
		googleplus: string;
	};
}

ProposedNPOSchema.statics.getByID = function (id, selector) {
	return this.findById(id, selector).exec();
};

export const ProposedNPO: Model<$ProposedNPODocument> =
	model<$ProposedNPODocument>('ProposedNPO', ProposedNPOSchema);


export class ProposedNPOModel extends ModelOfDocument<$ProposedNPODocument> {
	static getByID(id: string, selector?: string) {
		return ProposedNPO.findById(id, selector).exec();
	}
}
