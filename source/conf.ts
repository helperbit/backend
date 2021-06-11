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

import { Network } from "bitcoinjs-lib";

interface IConfig {
	env: string;
	url: string;
	eventmeta: boolean;
	debug: boolean;
	clusterize: boolean;
	port: number;

	policyversion: {
		terms: number;
		privacy: number;
	};

	security: {
		secret: string;
		captcha: boolean;
		rateLimit: boolean;
	};

	mail: {
		contact: string;
		activation: boolean;
		send: boolean;
	};

	currency: { supported: ("EUR" | "USD" | "GBP" | "BTC")[] };

	backoffice: {
		u2f: {
			enable: boolean;
			appId: string;
		};
	};

	services: {
		gis: { url: string };
		geocoder: { provider: 'google' | 'fake' };
		objectstorage: {
			provider: string;
			accesskey?: string;
			secretkey?: string;
		};
		redis: {
			host: string;
			port: number;
			database: string;
			password: string;
		};
		mongo: {
			host: string;
			port: number;
			database: string;
			credentials?: string;
		};
		lightning: {
			host: string;
			port: number;
			token: string;
			node: string;
		};
	};

	api: {
		recaptcha: {
			key: string;
			client: string;
		};
		google: { key: string };
		google_client: {
			id: string;
			secret: string;
		};
		google_jwt: {
			email: string;
			secret: string;
		};
		telegram: { token: string };
		mailchimp: {
			listid: string;
			apikey: string;
		};
		smtp: {
			host: string;
			port: string;
			user: string;
			password: string;
		};
		mistralpay: {
			token: string;
			account: string;
			button: string;
		};
		therocktrading: {
			key: string;
			secret: string;
		};
		tinklit: {
			clientid: string;
			token: string;
		};
	};

	logs: {
		api: string;
		job: string;
		colors: boolean;
		date: boolean;
	};

	bot: {
		telegram: {
			enabled: boolean;
			notify: string[];
		};
	};

	blockchain: {
		network: Network;
		testnet: boolean;
		faucet: {
			value: number;
			address: string;
			privkey: string;
		};
		coldwallet: string;
		limits: {
			min: { donation: number; withdraw: number; donationconf: number; conf: number; fee: number };
			max: { wallet: number; donation: number };
		};
	};

	fiatdonation: {
		staging: boolean;

		fixedcost: number;
		withdrawcost: number;
		fee: number;
		limits: {
			btc: { min: number; max: number };
			eur: { min: number; max: number };
		};
	};

	modules: { [moduleName: string]: any };
}

const env: { name: string } = require('./env.json');

export = (require(`./config/${env.name}`) as IConfig);
