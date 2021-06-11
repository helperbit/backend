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

import { AdminMerchandise } from "../merchandise.model";

import log = require('../../../log');
import { Async } from "../../../helpers/async";


export = async () => {
	log.job.debug('Migration', 'Creating default merchandise objects');

	const mdise = [
		{ name: 'keychain', total: 21, minrefs: 5 },
		{ name: 'tshirt', total: 21, minrefs: 15 },
		{ name: 'sweatshirt', total: 21, minrefs: 35 },
		{ name: 'ledger', total: 21, minrefs: 100 }
	];

	await Async.forEach(mdise, async m => {
		const mob = new AdminMerchandise();
		mob.name = m.name;
		mob.total = m.total;
		mob.minrefs = m.minrefs;
		try {
			await mob.save();
			log.job.debug('Migration', `Created merchandise object: ${mob.name}`);
		} catch (err) {
			log.job.error('Migration', `Already present merchandise object: ${mob.name}`);
		}
	});
};

