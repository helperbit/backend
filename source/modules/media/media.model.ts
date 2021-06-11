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
// mongoose.Promise = global.Promise;

const MediaSchema = new Schema({
	contenttype: { type: String, required: true },
	container: { type: String, require: true },
	filename: { type: String, require: true },
	hash: { type: String, default: null },
	expiry: { type: Date, default: null },
	creationdate: { type: Date, default: Date.now },
	owner: { type: String, default: null },
	private: { type: Boolean, default: false },
	archived: { type: Boolean, default: false },
	archivedate: { type: Date, default: null, select: false },
	archiveby: { type: String, default: null, select: false }
});

export interface $MediaDocument extends Document {
	contenttype: string;
	container: string;
	filename: string;
	hash: string;
	expiry?: Date;
	creationdate: Date;
	owner: string;
	private: boolean;
	archived: boolean;
	archivedate: Date;
	archiveby: string;
}


export const Media: Model<$MediaDocument> =
	model<$MediaDocument>('Media', MediaSchema);


export class MediaModel extends ModelOfDocument<$MediaDocument> {
	static getByID(id, selector?: string) {
		return Media.findById(id, selector).exec();
	}
}
