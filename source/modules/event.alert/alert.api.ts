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
import schemaValidator = require('../../helpers/schema-validator');
import alertSchema = require('./alert.schema');
import alertController = require('./alert.controller');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();

router.post('/me/alert',
	Async.middleware(authController.check),
	schemaValidator.validate(alertSchema.insert),
	Async.middleware(alertController.insert)
);


router.post('/me/alert/:id/media',
	Async.middleware(authController.check),
	Async.middleware(alertController.insertMedia)
);

router.get('/me/alerts',
	Async.middleware(authController.check),
	Async.middleware(alertController.getList)
);

export const EventAlertApi = router;
