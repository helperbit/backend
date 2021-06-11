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

(process as any).binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

// var access = fs.createWriteStream (conf.logs.job);
// process.stdout.write = process.stderr.write = access.write.bind (access);

import conf = require('./conf');
import Scheduler from "./helpers/scheduler";
import express = require('express');
import log = require('./log');
import telegrambot = require('./helpers/telegrambot');
import { connectDatabase } from "./helpers/db";
import { ModuleRepository } from "./modules";

log.debug('server', 'Helperbit job backend is starting...');
log.debug('server', `Setting env to ${conf.env}`);

const port: number = parseInt(process.env.VCAP_APP_PORT) || parseInt(process.env.PORT) || 3001;

process.on('uncaughtException', (err: any): void => { log.critical('except', err.stack); });

connectDatabase().then(() => {
	try {
		const scheduler = new Scheduler();
		const mlist = ModuleRepository.i().list();

		for (let i = 0; i < mlist.length; i++) {
			const m = mlist[i];
			if (!('jobs' in m))
				continue;

			const mj = m.jobs;

			for (let j = 0; j < mj.length; j++) {
				if ('type' in mj[j] && mj[j].type == 'onBlock')
					scheduler.addOnBlockTask(mj[j].job);
				else if ('type' in mj[j] && mj[j].type == 'onStart')
					scheduler.addOnStartTask(mj[j].job);
				else
					scheduler.addTask(mj[j].job, mj[j].timeout);
			}
		}

		setTimeout(telegrambot.start, 1000);
		scheduler.start().then(_ => {
			log.debug('jobserver', 'Schedular first start completed');
		}).catch(err => {
			log.debug('jobserver', `Schedular first start failed ${err}`);
		})
	} catch (err) {
		log.critical('jobserver', `Error`);
		console.log(err);
	}
	return express().listen(port);
}).catch((err) => {
	process.exit();
});

export { };
