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
import authController = require('../user.auth/auth.controller');
import ambassadorController = require('./ambassador.controller');
const router = require('express').Router();


router.get('/me/ambassador', Async.middleware(authController.check), Async.middleware(ambassadorController.ambassador));
router.get('/stats/topambassadors/:timeframe', Async.middleware(ambassadorController.getTopAmbassadors));

router.get('/stats/merchandise', 
	Async.middleware(authController.checkLazy),
	Async.middleware(ambassadorController.getAmbassadorMerchandise)
);

export const UserAmbassadorApi = router;
