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

import { Request, Response, NextFunction } from "express";
import shortid = require('shortid');
import error = require('../../error');
import mediaController = require('../media/media.controller');
import schemaValidator = require('../../helpers/schema-validator');
import telegramHelper = require('../../helpers/telegram');
import rorSchema = require('./ror.schema');
import notificationController = require('../notification/notification.controller');
import { User } from "../user/user.model";
import { Ror, $RorDocument, RorModel } from "./ror.model";
import { ObjectId } from "bson";


/* Middleware: get the ror :rid dell'utente autenticato */
export async function get(req: any, res: Response, next: NextFunction) {
	const ror = await Ror.findOne({ _id: req.params.rid, $or: [{ from: req.username }, { to: req.username }] }).exec();

	if (ror == null)
		return error.response(res, 'E');

	req.ror = ror;
	next();
};


export async function getSingle(req: Request, res: Response) {
	const ror = await Ror.findOne({ _id: req.params.rid }).exec();
	if (ror == null)
		return error.response(res, 'E');

	res.status(200);
	res.json(ror);
};


export async function getUserList(req: Request, res: Response) {
	const rors = await Ror.find({ status: 'sent', $or: [{ from: req.params.name }, { to: req.params.name }] }).sort({ time: 'desc' }).exec();
	res.status(200);
	res.json({ rors: rors });
};


export async function getList(req: any, res: Response) {
	const rors = await Ror.find({ $or: [{ from: req.username }, { to: req.username }] }).sort({ time: 'desc' }).exec();
	res.status(200);
	res.json({ rors: rors });
};


export async function getToList(req: any, res: Response) {
	const users = await User.find({
		'username': { $ne: req.username },
		usertype: 'npo',
		banned: false
	}, 'username usertype fullname').exec();

	res.status(200);
	res.json({ users: users });
};


export async function remove(req: any, res: Response) {
	if (req.ror.from != req.username && req.ror.status != 'pending')
		return error.response(res, 'EROR3');

	await mediaController.removeMediaList(req.ror.documents);
	await Ror.remove({ _id: req.ror._id });

	notificationController.done(req.ror.to, 'rorReceived', { 'data.id': req.ror._id });

	res.status(200);
	res.json({});

	telegramHelper.notify(`User: ${req.username} removed a refund claim to ${req.ror.to}`);
};


export async function create(req: any, res: Response) {
	const to = req.params.name;

	const opts = {
		types: ['pdf', 'image'],
		hash: true,
		container: 'rors',
		filename: req.username + '_' + to + '_' + shortid.generate()
	};

	if (to == req.username)
		return error.response(res, 'E');

	if (!schemaValidator.addressCheck(req.user.receiveaddress))
		return error.response(res, 'EROR4');

	const rors = await Ror.find({ from: req.username, status: 'pending' }).exec();

	if (rors.length >= 1)
		return error.response(res, 'EROR1');

	const tou = await User.findOne({ username: to, usertype: 'npo', banned: false }).exec();
	if (tou == null)
		return error.response(res, 'EROR2');

	const rim = await mediaController.upload(req, res, opts);

	if (rim.image == null || rim.body == null)
		return error.response(res, 'E');

	req.body = schemaValidator.validateSchema(res, rim.body, rorSchema.create);

	if (!req.body) {
		return await mediaController.removeMediaList([rim.image._id]);
	}

	const ror = new Ror();
	ror.hash = rim.image.hash;
	ror.from = req.username;
	ror.to = tou.username;
	ror.description = req.body.description;
	ror.value = req.body.value;
	ror.currency = req.body.currency;
	ror.documents = [rim.image._id];
	ror.invvat = req.body.invvat;
	ror.invdate = req.body.invdate;
	ror.receiveaddress = req.user.receiveaddress;

	try {
		await ror.save();
		await notificationController.notify({
			user: ror.to,
			email: true,
			code: 'rorReceived',
			data: {
				from: ror.from,
				value: ror.value,
				currency: ror.currency,
				id: ror._id
			}
		});

		res.status(200);
		res.json({ rid: ror._id });

		telegramHelper.notify(`User: ${req.username} create a refund claim to ${ror.to} of ${ror.value} ${ror.currency}`);
	} catch (err) {
		error.response(res, 'E');
	}
};


export async function reject(req: any, res: Response) {
	if (req.ror.status != 'pending' || req.ror.to != req.username)
		return error.response(res, 'E');

	req.ror.status = 'rejected';
	req.ror.rejectreason = req.body.reason;

	try {
		await req.ror.save();
		await notificationController.notify({
			user: req.ror.from,
			email: true,
			code: 'rorRejected',
			data: {
				to: req.ror.to,
				value: req.ror.value,
				currency: req.ror.currency,
				id: req.ror._id,
				reason: req.ror.rejectreason
			}
		});

		res.status(200);
		res.json({});

		telegramHelper.notify(`User: ${req.username} rejected a refund claim from ${req.ror.from} with this reason: ${req.ror.rejectreason}`);
	} catch (err) {
		error.response(res, 'E');
	}
};


export async function accept(rid: string, receiveaddress: string, value: number, to: string, txid: string): Promise<$RorDocument> {
	const ror = await Ror.findOne({ to: to, status: 'pending', receiveaddress: receiveaddress }).exec();
	if (ror == null)
		return Promise.reject();

	ror.status = 'accepted';
	ror.valuebtc = value;
	ror.txid = txid;

	await ror.save();
	await notificationController.notify({
		user: ror.from,
		email: true,
		code: 'rorAccepted',
		data: {
			to: ror.to,
			valuebtc: ror.valuebtc,
			value: ror.value,
			currency: ror.currency,
			id: ror._id
		}
	});

	telegramHelper.notify(`User: ${ror.to} acceppted a refund claim from ${ror.from} of ${ror.valuebtc}`);
	return ror;
};


export async function removeAcceptance(rid: ObjectId) {
	const ror = await RorModel.getByID(rid);
	if (ror == null) return;

	ror.status = 'rejected';

	await ror.save();
	telegramHelper.notify(`User: ${ror.to} removed the acceptance of the refund claim from ${ror.from}`);
};


export async function sent(rid: ObjectId, txid: string) {
	const ror = await Ror.findOne({ _id: rid, status: 'accepted' }).exec();
	if (ror == null) return;

	ror.status = 'sent';
	ror.txid = txid;

	await ror.save();
	await notificationController.notify({
		user: ror.from,
		email: true,
		code: 'rorSent',
		data: {
			to: ror.to,
			valuebtc: ror.valuebtc,
			txid: txid,
			value: ror.value,
			currency: ror.currency,
			id: ror._id
		}
	});

	telegramHelper.notify(`User: ${ror.to} sent a refund tx to ${ror.from} of ${ror.valuebtc}: ${ror.txid}`);
};
