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
import authSchema = require('./auth.schema');
import authController = require('./auth.controller');
// import userController = require('../user/user.controller');

const router = require('express').Router();


// router.post('/signup',
// 	Async.middleware(authController.recaptcha),
// 	schemaValidator.validate(authSchema.signup),
// 	authController.createRateLimit('signup'),
// 	Async.middleware(authController.signup)
// );

router.post('/login/api',
	schemaValidator.validate(authSchema.login),
	authController.createRateLimit('login'),
	Async.middleware(authController.checkAPILogin),
	Async.middleware(authController.login)
);

router.post('/login',
	Async.middleware(authController.recaptcha),
	schemaValidator.validate(authSchema.login),
	authController.createRateLimit('login'),
	Async.middleware(authController.login)
);


router.post('/logout',
	Async.middleware(authController.check),
	Async.middleware(authController.logout)
);


router.get('/auth/state',
	Async.middleware(authController.checkLazy),
	authController.getAuthState
);

router.post('/auth/reset',
	Async.middleware(authController.recaptcha),
	schemaValidator.validate(authSchema.resetPassword),
	Async.middleware(authController.resetPassword)
);

router.post('/auth/activate',
	schemaValidator.validate(authSchema.activateAccount),
	Async.middleware(authController.activateAccount)
);

router.post('/auth/activate/resend', Async.middleware(authController.sendActivationLink));
router.post('/auth/change',
	Async.middleware(authController.checkLazy),
	Async.middleware(authController.recaptcha),
	Async.middleware(authController.changePassword)
);


export const UserAuthApi = router;
