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
import { Blockchain } from "../../blockchain";
import types = require('../../helpers/types');


const TransactionSchema = new Schema({
	txid: { type: String, unique: true, default: null },
	status: { type: String, enum: ['waiting', 'signing', 'signed', 'broadcasted', 'confirmed', 'refused', 'doublespent', 'hidden'], default: 'signing' },

	utxos: [{ tx: String, n: Number, value: Number }],
	scripttype: { type: String, enum: ['p2wsh', 'p2sh', 'p2sh-p2wsh'], default: 'p2sh-p2wsh' },

	pubkeys: [String],
	wallet: {
		id: { type: Schema.Types.ObjectId, required: true },
		address: String,
		label: String
	},
	hardwareadmins: [String],
	hardwaretypes: [{ type: String, enum: types.hardwareWallets }],
	signers: [String],
	refused: [String],
	admins: [String],
	hex: { type: String },
	ror: { type: Schema.Types.ObjectId, default: null },

	from: { type: String, required: true },
	to: { type: String },
	value: { type: Number },
	fee: { type: Number },
	n: { type: Number },

	value_historic: {
		eur: { type: Number, default: null },
		gbp: { type: Number, default: null },
		usd: { type: Number, default: null }
	},

	time: { type: Date, default: Date.now },
	description: { type: String }
});


export interface $TransactionDocument extends Document {
	txid: string;
	status: 'waiting' | 'signing' | 'signed' | 'broadcasted' | 'confirmed' | 'refused' | 'doublespent' | 'hidden';
	pubkeys: string[];
	utxos: Blockchain.UTXO[];
	scripttype: 'p2wsh' | 'p2sh' | 'p2sh-p2wsh';

	wallet: {
		id: ObjectId;
		label: string;
		address: string;
	};
	hardwareadmins: string[];
	hardwaretypes: string[];
	signers: string[];
	refused: string[];
	admins: string[];
	hex: string;
	from: string;
	ror: ObjectId | null;
	to: string;
	value: number;
	fee: number;
	n: number;
	time: Date;
	description: string;
	value_historic: {
		eur?: number;
		gbp?: number;
		usd?: number;
	};
}

export const Transaction: Model<$TransactionDocument> = 
	model<$TransactionDocument>('Transaction', TransactionSchema);


export class TransactionModel extends ModelOfDocument<$TransactionDocument> {
	static getByID (id: string, selector?: string) {
		return Transaction.findById(id, selector).exec();
	}
	
	static getByTxID (txid, selector?: string) {
		return Transaction.findOne({ txid: txid }, selector).exec();
	}	
}
