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

import { Document } from "mongoose";

export default class ModelOfDocument<T extends Document> {
	private _document: T;

	constructor(doc: T) {
		this._document = doc;
	}

	get d() { return this._document; }
	get _id() { return this._document._id; }

	async remove() {
		await this.d.remove();
	}

	async save() {
		return this.d.save();
	}
}
