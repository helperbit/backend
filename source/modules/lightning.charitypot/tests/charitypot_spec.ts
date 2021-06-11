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
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';


frisbyChain({}, [
	common.cleanResources('testcharitypot'),

	(data, next) => frisby.create('/lightning/charitypot - get current round')
		.get(common.api + 'lightning/charitypot')
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/lightning/charitypot/rounds - get rounds')
		.get(common.api + 'lightning/charitypot/rounds')
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/lightning/charitypot/stats - get stats')
		.get(common.api + 'lightning/charitypot/stats')
		.expectStatus(200)
		.expectJSONTypes({
			rounds: Number,
			value: Number,
			votes: Number
		})
		.afterJSON(j => next(data))
		.toss(),

	common.cleanResources('testcharitypot')
]);



