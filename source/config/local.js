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

const bitcoinjs = require('bitcoinjs-lib');
const fs = require('fs');

module.exports = {
	env: "local",
	url: "http://localhost:8000",
	eventmeta: false,
	debug: true,
	clusterize: false,
	port: 3000,

	modules: {
		'user.auth.social': {
			enabled: true,
			signup: true,
			linkedin: {
				clientid: "",
				clientsecret: "",
				redirecturi: "https://api.helperbit.com/api/v1/auth/social/linkedin/callback"
			},
			twitter: {
				apikey: "",
				apisecret: "",
				redirecturi: "https://api.helperbit.com/api/v1/auth/social/twitter/callback"
			},
			facebook: {
				appid: "",
				appsecret: "",
				redirecturi: "https://api.helperbit.com/api/v1/auth/social/facebook/callback"
			},
			google: {
				clientid: "",
				clientsecret: "",
				redirecturi: "https://api.helperbit.com/api/v1/auth/social/google/callback"
			}
		},
		'wallet.verify': {
			enabled: true,
			recoveryAddress: '',
			recoveryTimeout: { amount: 20, unit: 'minutes' },
			alternativeRecoveryAddress: '',
			alternativeRecoveryTimeout: { amount: 40, unit: 'minutes' }
		},
		'event': {
			affectedTrigger: 50000,
			updateInterval: 36000,
			minYear: 2020,
			earthquake: { 
				enabled: false,
				minSeaMagnitude: 6.4,
				minMagnitude: 5,
				minVisibleMagnitude: 5.5,
				minShakeMagnitude: 5	
			},
			flood: {
				enabled: false
			},
			wildfire: { 
				enabled: false 
			},
			images: { 
				enabled: false, 
				number: 3 
			}
		},
		'geoquad': {
			enabled: true,
			polling: true,
			side: 10
		},
		'event.alert': {
			enabled: false,
			expiration: 8,
			threshold: 0.8,
			gridsize: {
				default: 4.0,
				earthquake: 5.0,
				wildfire: 4.0,
				flood: 5.0,
				tsunami: 4.0,
				drought: 6.0
			}
		},
		'admin.mailtool': {
			bucketSize: 50
		},
		'statistics': {
			minYear: 2015
		}
	},

	policyversion: {
		terms: 2,
		privacy: 3
	},

	security: {
		secret: fs.readFileSync('source/data/token.key').toString(),
		captcha: false,
		rateLimit: false
	},

	mail: {
		contact: "info@helperbit.com",
		activation: false,
		send: false
	},

	currency: {
		supported: ["EUR", "USD", "GBP", "BTC"]
	},

	backoffice: {
		u2f: {
			enable: false,
			appId: ""
		}
	},

	services: {
		gis: {
			url: "http://"
		},
		geocoder: {
			provider: "google"
		},
		objectstorage: {
			provider: "fakestorage",
			accesskey: "minio",
			secretkey: "miniostorage"
		},
		redis: {
			host: "localhost",
			port: 6379,
			database: "hb-cache"
		},
		mongo: {
			host: "127.0.0.1",
			port: 27017,
			database: "helperbit"
		},
		lightning: {
			host: "",
			port: "9112",
			token: "",
			node: ''
		}
	},

	api: {
		recaptcha: {
			key: "",
			client: "-YNMIS5g"
		},
		google: {
			key: ""
		},
		google_client: {
			id: "",
			secret: ""
		},
		google_jwt: {
			email: "",
			secret: ""
		},
		telegram: {
			token: ""
		},
		mailchimp: {
			listid: "",
			apikey: ""
		},
		smtp: {
			host: "smtp..org",
			port: "",
			user: "",
			password: ""
		},
		mistralpay: {
			token: "",
			account: "",
			button: ""
		},
		therocktrading: {
			key: "",
			secret: ""
		}
	},

	logs: {
		api: "hb-local-backend.log",
		job: "hb-local-job.log",
		colors: true,
		date: true
	},

	bot: {
		telegram: {
			enabled: false,
			notify: []
		}
	},

	blockchain: {
		network: bitcoinjs.networks.regtest,
		testnet: true,
		faucet: {
			value: 0.005,
			aaddress: "",
			aprivkey: "",
			addr: "",
			privkey: ""
		},
		coldwallet: "",
		limits: {
			min: { donation: 0.001, withdraw: 0.0008, donationconf: 1, conf: 0, fee: 0.002 },
			max: { wallet: 10, donation: 21.0 }
		}
	},
	fiatdonation: {
		staging: true,

		fixedcost: 0.25,
		withdrawcost: 0.00010000,
		fee: 3.5,
		limits: {
			btc: { min: 0.00151, max: 0.1 },
			eur: { min: 5, max: 250 }
		}
	}
};
