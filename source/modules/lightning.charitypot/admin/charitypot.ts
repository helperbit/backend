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
import { LightningCharityPotRound } from "../round.model";
import {checkLogin, checkAuth } from '../../admin/auth';
import AdminLogController = require('../../admin.log/log.controller');
import { getModuleConfiguration } from "../../module";
import { LightningCharityPotModule, LightningCharityPotConfig } from "..";
const router = require('express').Router();


router.get ('/charitypot/rounds', checkLogin, async (req: Request, res: Response) => {
	const moduleConfig = getModuleConfiguration(LightningCharityPotModule) as LightningCharityPotConfig;
	const rounds = await LightningCharityPotRound.find({}).sort({start: 'desc'}).exec();
	res.render('lightning.charitypot/admin/rounds', { page: 'lightning', target: moduleConfig.minValue * 100000000000, rounds: rounds });
});

router.post('/charitypot/round/:id/donation', checkAuth('admin'), async (req: Request, res: Response) => {
	const round = await LightningCharityPotRound.findOne({_id: req.params.id}).exec();
	round.winner.donation = req.body.donation;
	round.winner.status = "done";
	await round.save();
	res.status(200);
	res.json({});
	await AdminLogController.operation(req, 'Lightning.Charitypot', `Concluded round ${req.params.id} set as paid: ${round.winner.donation}`);
});


export const LightningCharityPotAdminApi = router;
