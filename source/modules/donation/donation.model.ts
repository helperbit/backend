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
import { $GiftData } from "../../helpers/types";
import ModelOfDocument from "../model_of_document";
// mongoose.Promise = global.Promise;

const DonationSchema = new Schema({
	txid: { type: String, unique: true, default: null },
	status: { type: String, enum: ['waiting', 'signing', 'broadcasted', 'confirmed', 'refused', 'doublespent', 'hidden'], default: 'waiting' },

	value: { type: Number },
	from: { type: String },
	fromaddress: { type: String },
	campaign: { type: Schema.Types.ObjectId, default: null },

	to: [{
		user: String,
		value: Number,
		type: { type: String, enum: ['singleuser', 'company', 'civilprotection', 'munic', 'cultural', 'hospital', 'npo', 'park', 'school', 'address'], default: 'singleuser' },
		address: String,
		project: Schema.Types.ObjectId
	}],

	expiry: { type: Date, default: null },

	value_historic: {
		eur: { type: Number, default: null },
		gbp: { type: Number, default: null },
		usd: { type: Number, default: null }
	},

	fromcountry: { type: String },
	tocountry: { type: String },
	tocountries: [{ type: String }],

	event: { type: Schema.Types.ObjectId, default: null },
	time: { type: Date, default: Date.now },

	fiatdonation: { type: Schema.Types.ObjectId, default: null },
	altdonation: { type: Schema.Types.ObjectId, default: null },
	fromcurrency: { type: String, default: 'BTC' },

	invoicestatus: { type: String, enum: ['none', 'requested'], default: 'none' },

	gift: {
		type: {
			enabled: { type: Boolean, default: false },
			email: String,
			message: String,
			name: String,
			sent: { type: Boolean, default: false },
			token: String
		},
		select: false
	}
});



export interface $DonationTo {
	user?: string;
	value: number;
	type?: ('singleuser' | 'company' | 'civilprotection' | 'munic' | 'cultural' | 'hospital' | 'npo' | 'park' | 'school' | 'address');
	address: string;
	project?: ObjectId | null;
}

export interface $DonationDocument extends Document {
	txid: string;
	status: 'waiting' | 'signing' | 'broadcasted' | 'confirmed' | 'refused' | 'doublespent' | 'hidden';
	time: Date;
	value: number;
	from?: string;
	to: $DonationTo[];
	expiry?: Date;
	fromcountry?: string;
	fromaddress: string;
	tocountry?: string;
	tocountries: string[];
	event: ObjectId | null;
	campaign: ObjectId | null;
	value_historic: {
		eur?: number;
		gbp?: number;
		usd?: number;
	};
	fiatdonation: ObjectId | null;
	altdonation: ObjectId | null;
	fromcurrency?: string;
	invoicestatus: 'none' | 'requested';
	gift: $GiftData;
}

export const Donation: Model<$DonationDocument> =
	model<$DonationDocument>('Donation', DonationSchema);


export class DonationModel extends ModelOfDocument<$DonationDocument> {
	static getByID(id: string | ObjectId, selector?: string) {
		return Donation.findById(id, selector).exec();
	}

	static getByTxID(txid: string, selector?: string) {
		return Donation.findOne({ txid: txid }, selector).exec();
	}
}
