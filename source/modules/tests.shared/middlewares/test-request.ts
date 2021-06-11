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

import frisby = require('frisby');
import { api } from './common';
const formdata = require('form-data');
const fs = require('fs');

export class TestRequest {
	private req;
	private token: boolean | string = false;
	private afterFn;

	private modifiers: ((req: any, data: any) => any)[];

	// TODO: dynamic endpoint
	constructor(private endpoint: string, name: string) {
		this.req = frisby.create(endpoint + ' - ' + name);
		this.modifiers = [];

		if (endpoint[0] == '/')
			endpoint = endpoint.substr(1);
	}

	static post(endpoint: string, name: string, postData: any) {
		const r = new TestRequest(endpoint, name);

		r.modifiers.push((req, data) => {
			if(typeof(postData) == 'function') 
				return req.post(api + r.endpoint, postData(data), { json: true });
			else
				return req.post(api + r.endpoint, postData, { json: true });
		});
		return r;
	}

	static get(endpoint: string, name: string) {
		const r = new TestRequest(endpoint, name);

		r.modifiers.push((req, data) => {
			return req.get(api + r.endpoint);
		});

		return r;
	}

	static postFile(endpoint: string, name: string, fileName: string) {
		const r = new TestRequest(endpoint, name);

		r.modifiers.push((req, data) => {
			const form = new formdata();
			form.append('file', fs.createReadStream('source/modules/tests.shared/data/' + fileName), {
				knownLength: fs.statSync('source/modules/tests.shared/data/' + fileName).size
			});

			req = req.post(api + r.endpoint, form, { json: false });
			req = req.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary());
			req = req.addHeader('content-length', form.getLengthSync());
			return req;
		});

		return r;
	}

	retry(n: number, seconds: number) {
		this.modifiers.push((req, data) => {
			return req.retry(n, seconds * 1000);
		});

		return this;
	}

	after(fnAfter?: ((data: any, j: any) => any)) {
		this.afterFn = fnAfter;
		return this;
	}

	expectJSONTypes(jsonTypes?: any) {
		this.modifiers.push((req, data) => {
			return req.expectJSONTypes(jsonTypes);
		});
		return this;
	}

	expectJSON(path: string, json: any) {
		this.modifiers.push((req, data) => {
			return req.expectJSON(path, json);
		});
		return this;
	}

	expect(status: number, json?: any, jsonTypes?: any) {
		this.modifiers.push((req, data) => {
			req = req.expectStatus(status);

			if (json)
				req = req.expectJSON(json);
			if (jsonTypes)
				req = req.expectJSONTypes(jsonTypes);
				
			return req;
		});
		return this;
	}

	authenticate(token?: string) {
		this.token = token ? token : true;
		return this;
	}

	toChainEntry() {
		return (data, next) => {
			let req = this.req;
			for(const m of this.modifiers) {
				req = m(req, data);
			}

			if (this.token && typeof (this.token) == 'boolean')
				req = req.addHeader('authorization', 'Bearer ' + data.token);
			else if (this.token && typeof (this.token) == 'string')
				req = req.addHeader('authorization', 'Bearer ' + this.token);

			req.afterJSON(j => {
				if (this.afterFn)
					data = this.afterFn(data, j);

				next(data);
			});
			req.toss();
		};
	}
}
