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
import AdminLogController = require('../../admin.log/log.controller');
import notificationController = require('../../notification/notification.controller');
import mediaController = require('../../media/media.controller');
import {checkLogin } from '../../admin/auth';
import { $CampaignDocument, Campaign } from '../campaign.model';
import { $UserDocument, User } from "../../user/user.model";
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
const router = require('express').Router();


router.get('/campaigns', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Campaign.find({}).sort({});
	const data = await adminQueryPaginate(query, req.query);
	res.render('campaign/admin/list', { page: 'campaign', campaigns: data.results, pagination: data.pagination });
});


router.get('/campaign/:id', checkLogin, async (req: Request, res: Response) => {
	const campaign = await Campaign.findOne({ _id: req.params.id }).exec();
	res.render('campaign/admin/detail', { page: 'campaign', campaign: campaign });
});

router.post('/campaign/:id/delete', checkLogin, async (req: Request, res: Response) => {
	const campaign: $CampaignDocument = await Campaign.findOne({ _id: req.params.id }).exec();
	const user: $UserDocument = await User.findOne({ username: campaign.owner }, 'email username').exec();

	if (campaign.media)
		await mediaController.removeMedia(campaign.media as any);

	await Campaign.remove({ _id: req.params.id });
	res.status(200);
	res.json({});

	/* Send notification */
	await notificationController.notify({
		user: user.username,
		email: true,
		code: 'campaignDeleted',
		data: { reason: req.body.reason }
	});
	await AdminLogController.operation(req, 'Campaign', `Campaign ${campaign._id} deleted for violating TOS (Reason: "${req.body.reason}")`, user.username);
});

export const CampaignAdminApi = router;
