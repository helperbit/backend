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
import donationSchema = require('./donation.schema');
import donationController = require('./donation.controller');
import userController = require('../user/user.controller');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();

router.get('/donations/graph', Async.middleware(donationController.getGraph('all')));
router.post('/donations/graph', Async.middleware(donationController.getGraph('all')));
router.get('/event/:id/graph', Async.middleware(donationController.getGraph('event')));
router.post('/event/:id/graph', Async.middleware(donationController.getGraph('event')));
router.get('/project/:id/graph', Async.middleware(donationController.getGraph('project')));
router.post('/project/:id/graph', Async.middleware(donationController.getGraph('project')));
router.get('/user/:name/graph', Async.middleware(donationController.getGraph('user')));
router.post('/user/:name/graph', Async.middleware(donationController.getGraph('user')));


router.get('/donations', Async.middleware(donationController.getList('all')));
router.post('/donations', Async.middleware(donationController.getList('all')));


router.post('/donation/event/:eid/create',
	Async.middleware(authController.check),
	schemaValidator.validate(donationSchema.createEventDonation),
	Async.middleware(donationController.createEventDonation)
);

router.get('/donation/:txid', Async.middleware(donationController.getByTXID));
router.get('/donation/:txid/gift', Async.middleware(donationController.getGiftDonation));

router.post('/donation/:txid/requestinvoice',
	Async.middleware(authController.check),
	Async.middleware(userController.me),
	Async.middleware(donationController.requestInvoice)
);

router.get('/donation/i/:id', Async.middleware(donationController.getByID));

router.get('/user/:name/donations/chart', Async.middleware(donationController.getChart('user')));
router.get('/user/:name/donations', Async.middleware(donationController.getList('user')));
router.post('/user/:name/donations', Async.middleware(donationController.getList('user')));
router.get('/project/:id/donations/chart', Async.middleware(donationController.getChart('project')));
router.get('/project/:id/donations', Async.middleware(donationController.getList('project')));
router.post('/project/:id/donations', Async.middleware(donationController.getList('project')));
router.get('/event/:id/donations/chart', Async.middleware(donationController.getChart('event')));
router.get('/event/:id/donations', Async.middleware(donationController.getList('event')));
router.post('/event/:id/donations', Async.middleware(donationController.getList('event')));
router.get('/campaign/:id/donations', Async.middleware(donationController.getList('campaign')));
router.post('/campaign/:id/donations', Async.middleware(donationController.getList('campaign')));


router.get('/project/:id/donate',
	schemaValidator.validateGet(donationSchema.donate),
	Async.middleware(authController.checkLazy),
	Async.middleware(donationController.getDonationAddress('project'))
);

router.get('/user/:name/donate',
	schemaValidator.validateGet(donationSchema.donate),
	Async.middleware(authController.checkLazy),
	Async.middleware(donationController.getDonationAddress('user'))
);


export const DonationApi = router;
