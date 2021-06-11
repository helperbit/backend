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

import conf = require('./conf');
import log = require('./log');
import { connectDatabase } from "./helpers/db";
import { ModuleRepository } from './modules';

log.debug('server', 'Helperbit migration tool');
log.debug('server', `Setting env to ${conf.env}`);

process.on('uncaughtException', (err: any): void => { log.critical('except', err.stack); });

connectDatabase().then(() => {
	const mod: string = process.argv[2];
	const mig: string = process.argv[3];
	ModuleRepository.i().list();
	let migration = null;

	try {
		migration = require(`./modules/${mod}/migrations/${mig}`);
	} catch (e) {
		log.critical('migration', e);
		log.critical('migration', `Unrecognized migration ${mig} from module ${mod}`);
		process.exit();
	}

	if (migration)
		migration();
}).catch((err) => {
	process.exit();
});

export {};
