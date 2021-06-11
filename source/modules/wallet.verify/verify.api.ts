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
import verifyController = require('./verify.controller');
import authController = require('../user.auth/auth.controller');
import userController = require('../user/user.controller');
const router = require('express').Router();

router.get('/wallet/verify/list',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter({ npo: 40 })),
	Async.middleware(userController.me),
	Async.middleware(userController.socialCompletness),
	Async.middleware(verifyController.getList)
);

router.get('/wallet/verify/pending',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter({ npo: 40 })),
	Async.middleware(userController.me),
	Async.middleware(verifyController.getPendings)
);

router.post('/wallet/:address/verify/sign',
	Async.middleware(authController.check),
	Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(userController.me),
	Async.middleware(verifyController.submitSignature)
);

router.post('/wallet/:address/verify/feed',
	Async.middleware(authController.check),
	Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(userController.me),
	Async.middleware(verifyController.feedSignature)
);

router.get('/wallet/verify/:id',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(verifyController.getTLTransaction)
);

router.post('/wallet/:address/verify/start',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter({ npo: 40 })),
	Async.middleware(userController.me),
	Async.middleware(verifyController.startVerification)
);

router.post('/wallet/:address/verify/remove',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(verifyController.removeVerification)
);

export const VerifyRouter = router;
