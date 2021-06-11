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
import { getVerify, removeVerification, verifyStep } from "./controller";
import userController = require('../user/user.controller');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();

router.get('/me/verify',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	getVerify
);

router.post('/me/verify/:provider/remove',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(removeVerification)
);

router.post('/me/verify/:provider/step/:step',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(verifyStep)
);


export const UserVerifyApi = router;
