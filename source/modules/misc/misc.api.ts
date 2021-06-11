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
import miscSchema = require('./misc.schema');
import ratelimit = require('express-rate-limit');
import miscController = require('./misc.controller');
import userController = require('../user/user.controller');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();

router.get('/search', 
	new ratelimit({ windowMs: 120 * 1000, max: 20 }),
	Async.middleware(miscController.search)
);

router.get('/blog', Async.middleware(miscController.blog));
router.get('/blog/:lang', Async.middleware(miscController.blog));

router.get('/info', Async.middleware(miscController.infoExtended));
router.get('/info/base', Async.middleware(miscController.infoBase));

router.post('/subscribe',
	schemaValidator.validate(miscSchema.subscribe),
	Async.middleware(miscController.subscribe)
);

router.post('/contact',
	schemaValidator.validate(miscSchema.contact),
	Async.middleware(miscController.contact)
);

router.post('/feedback',
	Async.middleware(authController.recaptcha),
	Async.middleware(authController.checkLazy),
	Async.middleware(userController.meLazy),
	Async.middleware(miscController.feedback)
);


export const MiscApi = router;
