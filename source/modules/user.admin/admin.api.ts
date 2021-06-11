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
import adminSchema = require('./admin.schema');
import userController = require('../user/user.controller');
import adminController = require('./admin.controller');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();


router.get('/me/admin',
	Async.middleware(authController.check),
	Async.middleware(userController.typeFilter(['npo'])),
	// Async.middleware(userController.trustFilter({ npo: 40 })),
	Async.middleware(userController.me),
	Async.middleware(adminController.getAdmins)
);

router.post('/me/admin/add',
	Async.middleware(authController.check),
	Async.middleware(userController.typeFilter(['npo'])),
	Async.middleware(userController.trustFilter({ npo: 40 })),
	schemaValidator.validate(adminSchema.add),
	Async.middleware(userController.me),
	Async.middleware(adminController.addAdmin)
);

router.post('/me/admin/remove',
	Async.middleware(authController.check),
	Async.middleware(userController.typeFilter(['npo'])),
	Async.middleware(userController.trustFilter({ npo: 40 })),
	schemaValidator.validate(adminSchema.remove),
	Async.middleware(userController.me),
	Async.middleware(adminController.removeAdmin)
);


export const UserAdminApi = router;
