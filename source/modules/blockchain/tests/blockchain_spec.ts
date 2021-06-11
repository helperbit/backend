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
import common = require('../../tests.shared/middlewares/common');


/* Too slow, it goes in timeout */
frisby.create('/blockchain/fees')
	.get(common.api + 'blockchain/fees')
	.expectStatus(200)
	.expectHeaderContains('Content-Type', 'json')
	.expectJSONTypes({
		fastestFee: Number,
		halfHourFee: Number,
		hourFee: Number
	})
	.toss();


frisby.create('/blockchain/prices')
	.get(common.api + 'blockchain/prices')
	.expectStatus(200)
	.expectHeaderContains('Content-Type', 'json')
	.expectJSONTypes({
		usd: Number,
		eur: Number,
		cny: Number,
		cad: Number,
		rub: Number,
		btc: Number
	})
	.toss();

