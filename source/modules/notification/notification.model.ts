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

const NotificationSchema = new Schema({
	mailed: { type: Boolean, default: false, select: false },
	owner: { type: String, required: true, select: false },

	unread: { type: Boolean, default: true },
	code: { type: String, required: true },
	data: { type: Schema.Types.Mixed, default: {} },
	redirect: { type: String, default: null },

	time: { type: Date, default: Date.now }
});


export interface $NotificationDocument extends Document {
	mailed: boolean;
	owner: string;
	unread: boolean;
	code: string;
	data: any;
	redirect: string;
	time: Date;
}

export interface $NotificationModel extends $NotificationDocument {}

export const Notification: Model<$NotificationModel> =
	model<$NotificationModel>('Notification', NotificationSchema);
