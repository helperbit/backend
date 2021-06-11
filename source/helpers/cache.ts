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

import redis = require('redis');
import conf = require('../conf');

export class RedisCache {
	private cache: any;

	constructor() {
		const rconf = {
			host: conf.services.redis.host,
			port: conf.services.redis.port,
			db: 0
			// password: conf.services.redis.password || undefined
		};

		this.cache = redis.createClient(rconf);

		this.cache.on('connect', (m) => { });
		this.cache.on('ready', (m) => { });
		this.cache.on('reconnecting', (m) => { });
		this.cache.on('error', (m) => { });
		this.cache.on('end', (m) => { });
	}

	get raw() {
		return this.cache;
	}

	expire(key: string, timeout: number): void {
		this.cache.expire(key, timeout);
	}


	del(key: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.cache.del(key, (err) => {
				resolve();
			});
		})
	}


	set(key: string, value: any, expire?: number): Promise<void> {
		return new Promise((resolve, reject) => {
			this.cache.set(key, value, (err) => {
				if (expire) this.cache.expire(key, expire);
				resolve();
			});
		})
	}

	async setJSON(key: string, value: any, expire?: number): Promise<void> {
		return await this.set(key, JSON.stringify(value), expire);
	}

	keys(pattern: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			this.cache.keys(pattern, (err, keys) => {
				if (err) return reject(err);
				return resolve(keys);
			});
		})
	}

	has(key: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.cache.get(key, (err, value) => {
				if (err || value === null) 
					return resolve(false);
				resolve(true);
			});
		})
	}

	get(key: string, nofail: boolean = false): Promise<any> {
		return new Promise((resolve, reject) => {
			this.cache.get(key, (err, value) => {
				if ((err || value === null) && !nofail)
					return reject(err);
				resolve(value);
			});
		})
	}

	async getJSON(key: string): Promise<any> {
		const v: string = await this.get(key);
		return JSON.parse(v);
	}
}

