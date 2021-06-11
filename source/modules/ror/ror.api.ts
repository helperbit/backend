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
import rorController = require('./ror.controller');
import userController = require('../user/user.controller');
import schemaValidator = require('../../helpers/schema-validator');
import rorSchema = require('./ror.schema');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();

router.get('/user/:name/rors',
	Async.middleware(rorController.getUserList)
);

router.get('/me/rors',
	Async.middleware(authController.check),
	Async.middleware(userController.npoStatus),
	// Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(rorController.getList)
);

router.get('/me/rors/tolist',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(rorController.getToList)
);

router.post('/user/:name/ror',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(userController.trustFilter(25)),
	Async.middleware(userController.me),
	// schemaValidator.parseContentDisposition,
	// schemaValidator.validate (rorSchema.create),
	Async.middleware(rorController.create)
);


router.get('/ror/:rid',
	Async.middleware(rorController.getSingle)
);


router.delete('/me/ror/:rid',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(rorController.get),
	Async.middleware(rorController.remove)
);


router.post('/me/ror/:rid/reject',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['npo', 'company'])),
	schemaValidator.validate(rorSchema.reject),
	Async.middleware(rorController.get),
	Async.middleware(rorController.reject)
);

export const RorApi = router;
