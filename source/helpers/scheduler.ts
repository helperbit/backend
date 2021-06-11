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

import log = require('../log');
import conf = require('../conf');
import { Blockchain } from "../blockchain";
import { Async } from './async';

export default class Scheduler {
	tasks: { fn: () => void; timeout?: number; firstRun?: boolean; onStart?: boolean; interval?: NodeJS.Timeout }[];
	tasksonblock: { fn: () => void; firstRun: boolean; onStart: boolean }[];

	constructor() {
		this.tasks = [];
		this.tasksonblock = [];
	}

	addTask(fn, timeout, firstRun: boolean = true, onStart: boolean = false) {
		if (!timeout)
			timeout = false;

		this.tasks.push({ fn: fn, timeout: timeout, firstRun: firstRun, onStart: onStart });
	}

	addOnStartTask(fn) {
		this.tasks.push({ fn: fn, firstRun: true });
	}

	addOnBlockTask(fn, firstRun: boolean = true) {
		this.tasksonblock.push({ fn: fn, firstRun: firstRun, onStart: false });
	}

	async start(): Promise<void> {
		log.job.debug('scheduler', `Starting ${this.tasks.length} jobs...`);

		await Async.forEach(this.tasks, async task => {
			if (task.onStart)
				await task.fn();
		});

		await Async.forEach(this.tasks, async task => {
			if (!task.onStart && task.firstRun)
				try {
					await task.fn();
				} catch(err) {
					console.log(err);
					log.job.error('scheduler', `Job ${task.fn.name} raised an exception.`);
				}

			if (task.timeout)
				task.interval = setInterval(async () => { await task.fn(); }, task.timeout);
		});

		await Async.forEach(this.tasksonblock, async task => {
			if (task.firstRun)
				await task.fn();
		});

		const onBlockTimeout = conf.blockchain.network.bech32 == 'bcrt' ? 8000 : 30000;
		Blockchain.onBlock(onBlockTimeout, this.tasksonblock.map(t => t.fn));
	}

	stop() { }
}

