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

const AdminLogSchema = new Schema({
	user: { type: String },
	time: { type: Date, default: Date.now },
	type: { type: String, enum: ['login', 'loginfail', 'logout', 'operation', 'changepassword'] },
	relateduser: { type: String, default: null },
	context: { type: String },
	description: { type: String },
	ip: { type: String }
});

export interface $AdminLogDocument extends Document {
	description: string;
	user: string;
	type: 'login' | 'loginfail' | 'logout' | 'operation' | 'changepassword';
	context: string;
	relateduser?: string;
	time: any;
	ip: string;
}



export const AdminLog: Model<$AdminLogDocument> = model<$AdminLogDocument>('AdminLog', AdminLogSchema);


export class AdminLogModel extends ModelOfDocument<$AdminLogDocument> {
	static list(page?: number, limit?: number, selected?: string) {
		return AdminLog.find({}, selected).sort({ time: 'desc' }).limit(limit || 100).skip((page || 0) * 100).exec();
	};

	static listForRelatedUser(relateduser: string, selected?: string) {
		return AdminLog.find({ relateduser: relateduser }, selected).sort({ time: 'desc' }).exec();
	};
}
