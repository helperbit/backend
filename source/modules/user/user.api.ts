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
import userSchema = require('./user.schema');
import userController = require('./user.controller');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();


router.get('/me/npostatus',
	Async.middleware(authController.check),
	Async.middleware(userController.npoStatus),
	(req, res) => { res.status(200); res.json({}); }
);


router.get('/me',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	userController.profile
);

router.post('/me',
	Async.middleware(authController.check),
	schemaValidator.validate(userSchema.edit),
	Async.middleware(userController.me),
	Async.middleware(userController.updateProfile)
);

router.post('/me/media/avatar',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(userController.updateMedia('avatar'))
);

router.post('/me/media/photo',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(userController.updateMedia('photo'))
);

router.delete('/me/media/avatar',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(userController.removeMedia('avatar'))
);

router.delete('/me/media/photo',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(userController.removeMedia('photo'))
);

router.get('/me/events', Async.middleware(authController.check), Async.middleware(userController.events));

router.get('/me/avatar', Async.middleware(authController.check), Async.middleware(userController.avatar));
router.get('/user/:name', Async.middleware(userController.getByName));
router.get('/user/:name/avatar', Async.middleware(userController.avatar));
router.get('/user/:name/avatar/:other*', Async.middleware(userController.avatar));
router.get('/user/:name/events', Async.middleware(userController.events));
router.post('/organizations/list', Async.middleware(userController.getOrganizationList));
router.get('/organizations/list', Async.middleware(userController.getOrganizationList));

export const UserApi = router;
