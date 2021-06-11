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

import { Media } from "./media.model";
import log = require('../../log');
import mediaController = require('./media.controller');

export async function removeExpired() {
	const datespan = new Date();
	const medias = await Media.find({ expiry: { $lt: datespan } }, '_id').exec();

	log.job.debug('media', `Cleaning expired ${medias.length} media...`);

	const ml = [];

	for (let i = 0; i < medias.length; i++)
		ml.push(medias[i]._id);

	await mediaController.removeMediaList(ml);
}
