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
import lightningController = require('./lightning.controller');
import authController = require('../user.auth/auth.controller');
import lightningSchema = require('./lightning.schema');
import ratelimit = require('express-rate-limit');
const router = require('express').Router();

router.post('/lightning/invoice/create', 
	new ratelimit({ windowMs: 120 * 1000, max: 10 }),
	schemaValidator.validate(lightningSchema.create),
	Async.middleware(authController.checkLazy),
	Async.middleware(lightningController.createInvoice)
);

router.get('/lightning/invoice/i/:id', Async.middleware(lightningController.getInvoiceByID));
router.get('/lightning/invoice/:id', Async.middleware(lightningController.getInvoiceByInvoiceID));
router.get('/lightning/info', Async.middleware(lightningController.getInfo));

export const LightningApi = router;
