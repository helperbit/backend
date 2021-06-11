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
import { Transaction } from "../../wallet.transaction/transaction.model";
import { Donation } from "../../donation/donation.model";
import { User } from "../../user/user.model";
import { Project } from "../../project/project.model";
import { Event } from "../../event/event.model";
import {checkLogin } from '../../admin/auth';
import { isValidObjectId } from "mongoose";
const router = require('express').Router();


router.get('/search', checkLogin, async (req: Request, res: Response) => {
	const q = req.query.q;
	if (q.length < 2)
		return res.redirect('/admin/');

	const queries = [
		User.find({
			$or: [
				{ username: { '$regex': q } },
				{ email: { '$regex': q } },
				{ fullname: { '$regex': q } },
				{ firstname: { '$regex': q } },
				{ country: { '$regex': q } },
				{ lastname: { '$regex': q } }
			]
		} as any, '_id username usertype email regdate').limit(25).exec(),
		Project.find({
			$or: [
				{ 'title.en': { '$regex': q } },
				{ 'title.it': { '$regex': q } },
				{ 'owner': { '$regex': q as any } }
			]
		}, '_id title start owner').limit(25).exec(),
		Transaction.find({
			$or: [
				{ txid: { '$regex': q as any } }
			]
		}, '_id txid time').limit(25).exec(),
		Donation.find({
			$or: [
				{ txid: { '$regex': q as any } }
			]
		}, '_id txid time').limit(25).exec(),
		Event.find({
			$or: isValidObjectId(q) ? [
				{ _id: q }
			] : [
				{ affectedcountries: { '$regex': q } }
			]
		} as any, '_id affectedcountries lastshakedate').limit(25).exec()
	];

	const values = await Promise.all((queries as any));
	res.render('admin.search/admin/results', {
		page: 'search',
		users: values[0],
		projects: values[1],
		transactions: values[2],
		donations: values[3],
		events: values[4],
		query: q
	});
});


export const AdminSearchApi = router;
