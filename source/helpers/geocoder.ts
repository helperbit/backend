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
import geocoder = require('node-geocoder');


interface ReverseGeocoding {
	countryCode: string;
	city?: string;
	zipcode: string;
	administrativeLevels: {
		level1long: string;
		level2long: string;
		level3long: string;
	};
}

export interface GeoCoder {
	reverse(lat: number, long: number): Promise<ReverseGeocoding>;
	geocode(address: string): Promise<{ lat: number; long: number }>;
}


export class FakeGeocoder {
	async reverse(lat: number, long: number): Promise<ReverseGeocoding> {
		return {
			countryCode: 'IT',
			city: 'Cagliari',
			zipcode: '09129',
			administrativeLevels: {
				level1long: 'Sardegna',
				level2long: 'Cagliari',
				level3long: 'Cagliari'
			}
		};
	}

	async geocode(address: string): Promise<{ lat: number; long: number }> {
		return { lat: 39, long: 9 };
	}
}

export class GoogleGeocoder {
	geoc: any;

	constructor() {
		this.geoc = geocoder({
			httpAdapter: 'https',
			provider: 'google',
			formatter: null,
			apiKey: conf.api.google.key
		});
	}
	async reverse(lat: number, long: number): Promise<ReverseGeocoding> {
		try {
			const data = await this.geoc.reverse({ lat: lat, lon: long });
			if (data !== undefined && data.length > 0) {
				return data[0];
			} else {
				return Promise.reject();
			}
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async geocode(address: string): Promise<{ lat: number; long: number }> {
		try {
			const geo = await this.geoc.geocode(address);
			if (geo !== null && geo.length > 0) {
				return { lat: geo[0].latitude, long: geo[0].longitude };
			} else {
				return Promise.reject();
			}
		} catch (err) {
			return Promise.reject(err);
		}
	}
}

export function getGeocoder(): GeoCoder {
	switch (conf.services.geocoder.provider) {
		case 'fake':
			return new FakeGeocoder();
		default:
			return new GoogleGeocoder();
	}
}
