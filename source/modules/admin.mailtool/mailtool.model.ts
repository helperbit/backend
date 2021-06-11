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
// mongoose.Promise = global.Promise;

const AdminBulkMailSchema = new Schema({
	time: { type: Date, default: Date.now },
	users: [String],
	doneusers: [String],
	iscommercial: Boolean,
	message: String,
	subject: String,
	status: { type: String, default: 'sending', enum: ['sending', 'sent', 'canceled'] },
	filter: { type: Schema.Types.Mixed, default: {} }
});

export interface $AdminBulkMailDocument {
	time: Date;
	users: string[];
	doneusers: string[];
	iscommercial: boolean;
	message: string;
	subject: string;
	status: 'sending' | 'sent' | 'canceled';
	filter: any;
}

export interface $AdminBulkMailModel extends Document, $AdminBulkMailDocument { }

export const AdminBulkMail: Model<$AdminBulkMailModel> = model<$AdminBulkMailModel>('AdminBulkMail', AdminBulkMailSchema);
