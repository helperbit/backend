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
import socialSchema = require('./social.schema');
import authController = require('../user.auth/auth.controller');
import socialController = require('./social.controller');

const router = require('express').Router();

router.post('/auth/social/edit',
	Async.middleware(authController.check),
	schemaValidator.validate(socialSchema.edit),
	Async.middleware(socialController.edit)
);

router.get('/auth/social/:provider/callback',
	socialController.loginProvider,
	Async.middleware(socialController.loginDone)
);

router.get('/auth/social/:provider/login', socialController.getLoginUrl);

export const UserAuthSocialApi = router;
