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

import conf = require('../conf');
import log = require('../log');
import mongoose = require('mongoose');

export async function connectDatabase(): Promise<typeof mongoose> {
	let mongo_url: string = "mongodb://";
	if (conf.services.mongo.credentials)
		mongo_url += conf.services.mongo.credentials + '@';

	mongo_url = mongo_url + conf.services.mongo.host + ':' + conf.services.mongo.port + '/' + conf.services.mongo.database;

	const mongo_opts: any = {
		useUnifiedTopology: true,
		useNewUrlParser: true,
		connectTimeoutMS: 300000,
		keepAlive: true,
		// reconnectTries: 10, // Deprecated on unifiedtopology
		// reconnectInterval: 30000, // Deprecated on unifiedtopology
		promiseLibrary: global.Promise,
		useCreateIndex: true
	};

	log.debug('mongo', `Connecting to ${conf.services.mongo.host}:${conf.services.mongo.port}/${conf.services.mongo.database}...`);

	try {
		const db = await mongoose.connect(mongo_url, mongo_opts);
		log.debug('mongo', 'Connection enstablished');

		db.connection.on('error', () => {
			setTimeout(connectDatabase, 1000 * 5);
		});
		db.connection.on('disconnected', () => {
			setTimeout(connectDatabase, 1000 * 5);
		});

		return db;
	} catch (err) {
		log.critical('mongo', 'Connection error, exiting');
		Promise.reject(err);
	}
}
