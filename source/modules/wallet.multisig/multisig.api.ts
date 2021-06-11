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
import multisigController = require('./multisig.controller');
import authController = require('../user.auth/auth.controller');
import userController = require('../user/user.controller');
const router = require('express').Router();

router.get('/user/:name/txs', Async.middleware(multisigController.getPublicTransactions));

router.post('/wallet/multisig/create',
	Async.middleware(authController.check),
	Async.middleware(userController.typeFilter(['npo'])),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.me),
	Async.middleware(multisigController.create)
);

router.post('/wallet/multisig/feed',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(multisigController.feed)
);

router.get('/wallet/multisig/txs',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(multisigController.getTransactions)
);

router.post('/wallet/multisig/:id/refuse',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(multisigController.refuseTransaction)
);

router.post('/wallet/multisig/:id/sign',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(multisigController.signTransaction)
);

router.delete('/wallet/multisig/:id',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(multisigController.deleteTransaction)
);



export const WalletMultisigApi = router;
