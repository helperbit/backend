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

import { Request, Response } from "express";
import { AltDonation, AltDonationModel } from "../altdonation.model";
import { DonationModel } from "../../donation/donation.model";
import express = require('express');
import AdminLogController = require('../../admin.log/log.controller');
import {checkLogin } from '../../admin/auth';
import flypme = require('../../../helpers/flypme');
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
const router = express.Router();


router.get('/altdonations', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = AltDonation.find({}).sort({ time: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('donation.alt/admin/list', { page: 'donation', altdonations: data.results, pagination: data.pagination });
});

router.get('/altdonation/:id', checkLogin, async (req: Request, res: Response) => {
	const ad = await AltDonationModel.getByID(req.params.id);
	const don = await DonationModel.getByID(ad.donation);
	res.render('donation.alt/admin/detail', { page: 'donation', ad: ad, don: don });
});

router.post('/altdonation/:id/setrefund', checkLogin, async (req: Request, res: Response) => {
	const ad = await AltDonationModel.getByID(req.params.id);
	const address = req.body.address;

	const r = await flypme.setRefundAddress(ad.order, address);
	if (r.result == 'ok') {
		ad.refundaddress = address;
		await ad.save();
		res.status(200);
		await AdminLogController.operation(req, 'donation.alt', `Altcoin donation ${ad._id} has a new refund address: ${address}`);
	} else {
		res.status(500);
	}

	res.json({});
});

export const DonationAltAdminApi = router;
