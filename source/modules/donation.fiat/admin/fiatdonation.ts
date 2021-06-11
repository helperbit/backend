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
import { FiatDonation, FiatDonationModel } from "../fiatdonation.model";
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
import AdminLogController = require('../../admin.log/log.controller');
import fiatDonationController = require('../fiatdonation.controller');
import { checkLogin, checkAuth } from '../../admin/auth';
const router = require('express').Router();


router.get('/fiatdonations', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const ex = fiatDonationController.getExchange('therocktrading');

	if (ex) {
		const promises = [
			ex.getBalance('EUR'),
			ex.getBalance('USD'),
			ex.getBalance('BTC')
			// ex.getBalance ('GBP'),
		];

		try {
			const results = await Promise.all(promises);
			const query = FiatDonation.find({}).sort({ time: 'desc' });
			const data = await adminQueryPaginate(query, req.query);
			res.render('donation.fiat/admin/list', {
				fiatdonations: data.results,
				pagination: data.pagination,
				therocktrading: {
					EUR: results[0].balance,
					USD: results[1].balance,
					BTC: results[2].balance
					// GBP: results[2].balance,
				}
			});
		} catch (err) {
			const query = FiatDonation.find({}).sort({ time: 'desc' });
			const data = await adminQueryPaginate(query, req.query);
			res.render('donation.fiat/admin/list', {
				page: 'donation',
				fiatdonations: data.results,
				pagination: data.pagination,
				therocktrading: {
					EUR: 0,
					USD: 0,
					BTC: 0
					// GBP: results[2].balance,
				}
			});
		}
	} else {
		const query = FiatDonation.find({}).sort({ time: 'desc' });
		const data = await adminQueryPaginate(query, req.query);
		res.render('donation.fiat/admin/list', { page: 'donation', fiatdonations: data.results, pagination: data.pagination, therocktrading: { EUR: 0.0 } });
	}
});

router.get('/fiatdonation/:id/setpaid', checkAuth('admin'), async (req: Request, res: Response) => {
	const data = await FiatDonationModel.getByID(req.params.id);
	if (data) {
		const oldstatus = data.status;
		data.status = 'paid';
		data.refillstatus = 'pending';
		await data.save();
		AdminLogController.operation(req, 'FiatDonation', `Fiat donation ${data._id} set as paid (was ${oldstatus})`);
	}
	res.redirect('/admin/fiatdonation/' + req.params.id);
});

router.get('/fiatdonation/:id/setrefunded', checkAuth('admin'), async (req: Request, res: Response) => {
	const data = await FiatDonationModel.getByID(req.params.id);
	if (data) {
		const oldstatus = data.status;
		data.status = 'refunded';
		data.refillstatus = 'none';
		await data.save();
		AdminLogController.operation(req, 'FiatDonation', `Fiat donation ${data._id} set as refunded (was ${oldstatus})`);
	}
	res.redirect('/admin/fiatdonation/' + req.params.id);
});


router.get('/fiatdonation/:id/setrefillnone', checkAuth('admin'), async (req: Request, res: Response) => {
	const data = await FiatDonationModel.getByID(req.params.id);
	if (data) {
		// let oldstatus = data.status;
		data.refillstatus = 'none';
		await data.save();
		// AdminLogController.operation (req, 'FiatDonation', `Fiat donation ${data._id} set as refunded (was ${oldstatus})`);
	}
	res.redirect('/admin/fiatdonation/' + req.params.id);
});

router.get('/fiatdonation/:id', checkLogin, async (req: Request, res: Response) => {
	const data = await FiatDonationModel.getByID(req.params.id);
	res.render('donation.fiat/admin/detail', { page: 'donation', fd: data });
});


export const DonationFiatAdminApi = router;
