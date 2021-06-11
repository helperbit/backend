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
import minio = require('minio');
import conf = require('../conf');

interface Storage {
	upload(container: string, filename: string, stream: any /*stream$Readable*/): Promise<any>;
	download(container: string, filename: string, res: any /*stream$Writable*/, nopipe?: boolean): Promise<any>;
	remove(container: string, filename: string): Promise<any>;
	createContainer(container: string): Promise<any>;
	move(container: string, filename: string, destination: string): Promise<any>;
}

class FakeStorage implements Storage {
	upload(container: string, filename: string, stream: any): Promise<any> {
		log.debug('fakestorage', `Uploaded ${filename} to ${container}`);
		return new Promise((r, _) => r());
	}	
	
	download(container: string, filename: string, res: any, nopipe?: boolean): Promise<any> {
		log.debug('fakestorage', `Downloaded ${filename} from ${container}`);
		return new Promise((r, _) => r());
	}
	
	remove(container: string, filename: string): Promise<any> {
		log.debug('fakestorage', `Removed ${filename} from ${container}`);
		return new Promise((r, _) => r());
	}
	
	createContainer(container: string): Promise<any> {
		log.debug('fakestorage', `Created container ${container}`);
		return new Promise((r, _) => r());
	}

	move(container: string, filename: string, destination: string): Promise<any> {
		log.debug('fakestorage', `Moved ${filename} from ${container} to ${destination}`);
		return new Promise((r, _) => r());
	}
}


/** Minio ObjectStorage */
class MinioStorage implements Storage {
	client: any;

	constructor() {
		const envOS = conf.services.objectstorage;

		this.client = new minio.Client({
			endPoint: '127.0.0.1',
			port: 9000,
			secure: false,
			accessKey: envOS.accesskey,
			secretKey: envOS.secretkey
		});
	}

	async upload(container: string, filename: string, stream: any /*stream$Readable*/): Promise<any> {
		try {
			await this.client.putObject(container, filename, stream);
			return true;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async download(container: string, filename: string, res: any /*stream$Writable*/, nopipe?: boolean): Promise<any> {
		try {
			const stream = await this.client.getObject(container, filename);
			if (!nopipe)
				stream.pipe(res);
			return stream;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async remove(container: string, filename: string): Promise<any> {
		try {
			await this.client.removeObject(container, filename);
		} catch (err) {
			return Promise.reject(err);
		}
		return true;
	}

	async createContainer(container: string): Promise<any> {
		try {
			await this.client.makeBucket(container, 'us-east-1');
			log.debug('storage', `Created container ${container}`);
		} catch (err) {
			log.debug('storage', `Container ${container} already present`);
		}
		return true;
	}

	async move(container: string, filename: string, destination: string): Promise<any> {
		try {
			await this.client.copyObject(destination, filename, `/${container}/${filename}`);
			await this.remove(container, filename);
			return true;
		} catch (err) {
			return Promise.reject();
		}
	}
}



export function init () {
	log.debug('storage', 'Initalizing Object Storage');
	let client: Storage;

	switch (conf.services.objectstorage.provider) {
		case 'fakestorage':
			log.debug('storage', 'Fake storage provider selected for Object Storage');
			client = new FakeStorage();
			break;			
		case 'minio':
		default:
			log.debug('storage', 'Minio provider selected for Object Storage');
			client = new MinioStorage();
	};

	client.createContainer('avatar').then(() => { }).catch(() => { });
	client.createContainer('alert').then(() => { }).catch(() => { });
	client.createContainer('cover').then(() => { }).catch(() => { });
	client.createContainer('documents').then(() => { }).catch(() => { });
	client.createContainer('archiveddocuments').then(() => { }).catch(() => { });
	client.createContainer('project').then(() => { }).catch(() => { });
	client.createContainer('event').then(() => { }).catch(() => { });
	client.createContainer('rors').then(() => { }).catch(() => { });
	client.createContainer('campaign').then(() => { }).catch(() => { });

	return client;
}
