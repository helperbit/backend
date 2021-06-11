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
import { Donation, DonationModel } from "../donation.model";
import AdminLogController = require('../../admin.log/log.controller');
import {checkLogin, checkAuth } from '../../admin/auth';
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
const router = require('express').Router();

router.get('/donations', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Donation.find({}).sort({ time: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('donation/admin/list', { page: 'donation', donations: data.results, pagination: data.pagination });
});

router.get('/donation/:txid/hide', checkAuth('admin'), async (req: Request, res: Response) => {
	const d = await DonationModel.getByTxID(req.params.txid);
	d.status = 'hidden';
	await d.save();
	AdminLogController.operation(req, 'Donation', `Donation ${req.params.txid} marked as hidden`);
	res.redirect('/admin/donations');
});

router.get('/donation/:txid/hidedoublespent', checkAuth('admin'), async (req: Request, res: Response) => {
	const d = await DonationModel.getByTxID(req.params.txid);
	d.status = 'doublespent';
	await d.save();
	AdminLogController.operation(req, 'Donation', `Donation ${req.params.txid} marked as doublespent`);
	res.redirect('/admin/donations');
});

router.get('/donation/:txid/show', checkLogin, async (req: Request, res: Response) => {
	const d = await DonationModel.getByTxID(req.params.txid);
	d.status = 'confirmed';
	await d.save();
	AdminLogController.operation(req, 'Donation', `Donation ${req.params.txid} marked as confirmed`);
	res.redirect('/admin/donations');
});


export const DonationAdminApi = router;
