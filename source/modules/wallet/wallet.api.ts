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

import schemaValidator = require('../../helpers/schema-validator');
import { Async } from "../../helpers/async";
import walletSchema = require('./wallet.schema');
import walletController = require('./wallet.controller');
import authController = require('../user.auth/auth.controller');
import userController = require('../user/user.controller');
const router = require('express').Router();


router.get('/_addresses', Async.middleware(walletController.getAddresses));

router.get('/wallet',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter({ npo: 40 })),
	Async.middleware(userController.me),
	Async.middleware(userController.socialCompletness),
	Async.middleware(walletController.getList)
);

router.post('/wallet/:address/update',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(walletController.get),
	Async.middleware(walletController.update)
);

router.delete('/wallet/:address',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(walletController.get),
	Async.middleware(walletController.remove)
);

router.get('/wallet/:address/balance', Async.middleware(walletController.getBalance));



router.get('/wallet/:address/faucet',
	Async.middleware(authController.check),
	Async.middleware(walletController.get),
	Async.middleware(walletController.getFaucet)
);

router.get('/user/:name/addresses', Async.middleware(walletController.getUserAddresses));

router.post('/wallet/create',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(userController.socialCompletness),
	Async.middleware(walletController.create)
);

router.get('/wallet/:address',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(walletController.get),
	(req, res) => {
		req.wallet.srvkey = null;
		res.status(200);
		res.json(req.wallet);
	});


router.post('/wallet/:address/withdraw/fees',
	Async.middleware(authController.check),
	schemaValidator.validate(walletSchema.withdrawFees),
	Async.middleware(userController.me),
	Async.middleware(userController.socialCompletness),
	Async.middleware(walletController.get),
	Async.middleware(walletController.withdrawFees)
);

router.post('/wallet/:address/withdraw',
	Async.middleware(authController.check),
	schemaValidator.validate(walletSchema.withdraw),
	Async.middleware(userController.me),
	Async.middleware(userController.socialCompletness),
	Async.middleware(walletController.get),
	Async.middleware(walletController.withdraw)
);

router.post('/wallet/:address/send',
	Async.middleware(authController.check),
	Async.middleware(walletController.get),
	Async.middleware(walletController.send)
);


export const WalletApi = router;
