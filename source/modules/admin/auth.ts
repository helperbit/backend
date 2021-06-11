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

import { NextFunction, Response } from "express";
import { User } from "../user/user.model";
import { AdminMerchandise } from "../user.ambassador/merchandise.model";
import { Project } from "../project/project.model";
import moment = require('moment');
import { ModuleRepository } from "..";


function jadeCheckPrivileges(locals, requiredAuth) {
	if (locals.privileges.indexOf(requiredAuth) != -1)
		return true;
	else
		return false;
}

function jadeFormatDate(date, format = 'YYYY-MM-DD hh:mm') {
	if (date == null)
		return 'Not set';
	return moment(new Date(date)).format(format)
}


async function pendingTasks() {
	const tasks = [
		Project.countDocuments({ status: 'submitted' }).exec(),
		User.countDocuments({ "verification": { $elemMatch: { "provider": 'document', "state": 'pending' } } }).exec(),
		User.countDocuments({ "verification": { $elemMatch: { "provider": 'npo', "state": 'pending' } } }).exec(),
		User.countDocuments({ "verification": { $elemMatch: { "provider": 'otc', "state": 'pending' } } }).exec(),
		User.countDocuments({ "verification": { $elemMatch: { "provider": 'residency', "state": 'pending' } } }).exec(),
		User.countDocuments({ "verification": { $elemMatch: { "provider": 'npomemorandum', "state": 'pending' } } }).exec(),
		User.countDocuments({ "verification": { $elemMatch: { "provider": 'npostatute', "state": 'pending' } } }).exec(),
		User.countDocuments({ "verification": { $elemMatch: { "provider": 'npoadmins', "state": 'pending' } } }).exec(),
		AdminMerchandise.countDocuments({ "assignments.status": "assigned" }).exec()
	];

	const results = await Promise.all(tasks);

	return {
		project: results[0],
		document: results[1],
		npo: results[2],
		otc: results[3],
		residency: results[4],
		npomemorandum: results[5],
		npostatute: results[6],
		npoadmins: results[7],
		merchandise: results[8],
		total: results[0] + results[1] + results[2] + results[3] + results[4] + results[5] + results[6] + results[7] + results[8]
	};
}


function subofDict(modules) {
	const d = {};
	for (const m of modules) {
		if ('admin' in m && !('subof' in m.admin))
			d[m.name] = [];
	}
	for (const m of modules) {
		if ('admin' in m && 'subof' in m.admin && m.admin.subof in d)
			d[m.admin.subof].push(m.admin);
	}
	return d;
}


/* Check login and privileges */
export function checkAuth(requiredAuth: string) {
	return async (req: any, res: Response, next: NextFunction) => {
		if (!req.session || !req.session.admin)
			return res.redirect('/admin/login');

		if (req.session.privileges.indexOf(requiredAuth) == -1)
			return res.redirect('/admin/unauthorized');

		res.locals.adminname = req.session.user;
		res.locals.privileges = req.session.privileges;
		res.locals.checkPriv = jadeCheckPrivileges;
		res.locals.tasks = await pendingTasks();
		res.locals.formatDate = jadeFormatDate;
		res.locals.modules = ModuleRepository.i().list();
		res.locals.subofmodules = subofDict(res.locals.modules);

		return next();
	};
}

/* Check only login */
export async function checkLogin(req: any, res: Response, next: NextFunction) {
	if (!req.session || !req.session.admin)
		return res.redirect('/admin/login');

	res.locals.adminname = req.session.user;
	res.locals.privileges = req.session.privileges;
	res.locals.checkPriv = jadeCheckPrivileges;
	res.locals.tasks = await pendingTasks();
	res.locals.formatDate = jadeFormatDate;
	res.locals.modules = ModuleRepository.i().list();
	res.locals.subofmodules = subofDict(res.locals.modules);

	if (res.locals.privileges.indexOf('kyc-thirdparty') != -1 &&
		(
			req.originalUrl.indexOf('/admin/users/verify/thirdparty') == -1
			&&
			req.originalUrl.indexOf('adminuser') == -1
			&&
			req.originalUrl.indexOf('logout') == -1
		)
	) {
		return res.redirect('/admin/users/verify/thirdparty');
	}

	return next();
}

/* Check the cert */
export function checkCert(req: Request, res: Response, next: NextFunction) {
	if (req.headers['VERIFIED'])
		return next();

	res.redirect('/');
}
