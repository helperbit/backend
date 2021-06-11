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

import { Async } from "../../helpers/async";
import { Blockchain } from "../../blockchain";
import authController = require('../user.auth/auth.controller');
import error = require('../../error');
const router = require('express').Router();


router.get('/blockchain/prices', (req, res) => {
	Blockchain.getPrices().then(prices => {
		res.status(200);
		res.json(prices);
	}).catch(err => {
		error.response(res, 'E');
	});
});

router.get('/blockchain/fees', (req, res) => {
	Blockchain.getFees().then(fees => {
		res.status(200);
		res.json(fees);
	}).catch(err => {
		error.response(res, 'E');
	});
});


router.post('/blockchain/rawtransactions',
	Async.middleware(authController.check),
	Async.middleware(async (req, res) => {
		const transactions = {};
		await Async.forEach(req.body.hashes, async (hash: string) => {
			transactions[hash] = await Blockchain.getTransactionRaw(hash);
		});

		res.status(200);
		res.json({ transactions: transactions });
	})
);

export const BlockchainApi = router;
