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
import userController = require('../user/user.controller');
import authController = require('../user.auth/auth.controller');
import campaignController = require('./campaign.controller');
const router = require('express').Router();


router.get('/campaign/:id',
	Async.middleware(authController.checkLazy),
	Async.middleware(campaignController.getByID)
);


// DISABLED
router.post('/campaign/create',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(userController.me),
	(req, res) => {
		res.status(500);
		res.json({});
	}
	// Async.middleware(campaignController.create)
);


router.post('/campaign/:id/giftmessages',
	Async.middleware(authController.checkLazy),
	Async.middleware(userController.me),
	Async.middleware(campaignController.get),
	Async.middleware(campaignController.giftmessages)
);

router.post('/campaign/:id/edit',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(userController.me),
	Async.middleware(campaignController.get),
	Async.middleware(campaignController.edit)
);

router.post('/campaign/:id/delete',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(campaignController.get),
	Async.middleware(campaignController.remove)
);

router.post('/campaign/:id/media/remove',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(campaignController.get),
	Async.middleware(campaignController.removeMedia)
);

router.post('/campaign/:id/media',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(campaignController.get),
	Async.middleware(campaignController.uploadMedia)
);


router.get('/me/campaigns',
	Async.middleware(authController.check),
	// Async.middleware(userController.typeFilter(['singleuser', 'company'])),
	Async.middleware(campaignController.getList)
);

export const CampaignApi = router;
