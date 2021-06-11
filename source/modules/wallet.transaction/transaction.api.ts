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
import transactionController = require('./transaction.controller');
import walletController = require('../wallet/wallet.controller');
import authController = require('../user.auth/auth.controller');
import userController = require('../user/user.controller');
const router = require('express').Router();

router.get('/transaction/:txid',
	Async.middleware(authController.checkLazy),
	Async.middleware(userController.meLazy),
	Async.middleware(transactionController.get),
	transactionController.getTransaction
);


router.get('/wallet/:address/txs',
	Async.middleware(authController.check),
	Async.middleware(walletController.get),
	Async.middleware(transactionController.getTransactions)
);

export const TransactionApi = router;
