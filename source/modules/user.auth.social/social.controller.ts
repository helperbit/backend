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
import { User, UserModel } from "../user/user.model";
import conf = require('../../conf');
import { RedisCache } from "../../helpers/cache";
import { signToken, sha256 } from "../../helpers/crypto";
import error = require('../../error');
import telegramHelper = require('../../helpers/telegram');
import authController = require('../user.auth/auth.controller');
import notificationController = require('../notification/notification.controller');
import passport = require('passport');
import { UserAuthSocialConfig } from ".";
import { getModuleConfigurationFromName } from "../module";
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const LinkedinStrategy = require('passport-linkedin-oauth2').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const moduleConf = getModuleConfigurationFromName('user.auth.social') as UserAuthSocialConfig;
const hbCache = new RedisCache();


const handleSocialLogin = async (provider: string, accessToken: string, refreshToken: string, profile: any, done: any) => {
	let user = await User.findOne({ 'socialauth.provider': provider, 'socialauth.id': profile.id }, 'username banned email usertype +password +iphistory +lastip socialauth').exec();

	/* Found a valid user, then login */
	if (user && user.isBanned())
		return done('banned');

	if (user !== null)
		return done(null, user);

	return done('');

	/* Or we need to signup */
	let username = profile.screen_name || profile.displayName || (profile.name.givenName + profile.name.familyName);
	username = username.toLowerCase().replace(/[^(0-9a-z_)]*/g, '');

	user = await UserModel.getByUsername(username);
	if (user)
		username = username + Math.ceil(Math.random() * 100);

	const newuser = new User();
	newuser.username = username;
	newuser.password = username + '_thispasswordcantbereproduced_' + Math.random();
	newuser.email = username + '@unknown.hb';
	newuser.activation.status = true;
	newuser.refcode = (await UserModel.getLastRefCode()) + 1;

	newuser.socialauth = {
		status: 'incomplete',
		accesstoken: accessToken,
		refreshToken: refreshToken,
		provider: provider,
		id: profile.id
	};
	newuser.usertype = 'singleuser';

	try {
		await newuser.save();
		telegramHelper.notify(`New user signup via ${provider}: ${username} (${newuser.usertype})`); // ${newuser.email}
		return done(null, newuser);
	} catch (err) {
		done(err);
	}
};


if (moduleConf.facebook.appsecret.length > 0)
	passport.use(new FacebookStrategy({
		clientID: moduleConf.facebook.appid,
		clientSecret: moduleConf.facebook.appsecret,
		callbackURL: moduleConf.facebook.redirecturi,
		profileFields: ['id', 'name']
	}, (accessToken, refreshToken, profile, done) => {
		handleSocialLogin('facebook', accessToken, refreshToken, profile, done);
	}));

if (moduleConf.twitter.apikey.length > 0)
	passport.use(new TwitterStrategy({
		consumerKey: moduleConf.twitter.apikey,
		consumerSecret: moduleConf.twitter.apisecret,
		callbackURL: moduleConf.twitter.redirecturi
	}, (token, tokenSecret, profile, done) => {
		handleSocialLogin('twitter', token, tokenSecret, profile, done);
	}));

if (moduleConf.google.clientid.length > 0)
	passport.use(new GoogleStrategy({
		clientID: moduleConf.google.clientid,
		clientSecret: moduleConf.google.clientsecret,
		callbackURL: moduleConf.google.redirecturi
	}, (accessToken, refreshToken, profile, done) => {
		handleSocialLogin('google', accessToken, refreshToken, profile, done);
	}));

if (moduleConf.linkedin.clientid.length > 0)
	passport.use(new LinkedinStrategy({
		clientID: moduleConf.linkedin.clientid,
		clientSecret: moduleConf.linkedin.clientsecret,
		callbackURL: moduleConf.linkedin.redirecturi,
		scope: ['r_emailaddress', 'r_liteprofile']
	}, (accessToken, refreshToken, profile, done) => {
		handleSocialLogin('linkedin', accessToken, refreshToken, profile, done);
	}));


export async function getLoginUrl(req: Request, res: Response) {
	const provider = req.params.provider;

	switch (provider) {
		case 'google':
			return passport.authenticate(provider, { scope: ['https://www.googleapis.com/auth/plus.login'] })(req, res);
		case 'twitter':
			return passport.authenticate(provider)(req, res, (err, res) => { });
		default:
			return passport.authenticate(provider)(req, res);
	};
};


export async function loginDone(req: any, res: Response) {
	/* Controlla il risultato */
	if (!req.user)
		return res.redirect(`${conf.url}/login?social=true&status=fail`);

	/* Setta lastlogin e varie */
	req.user.lastlogin = new Date();
	req.user.lastip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	req.user.iphistory.push(req.user.lastip);
	req.user.save();

	/* Crea il token */
	const token = signToken({ user: req.user.username }, '1d');

	await hbCache.set('tokenhash_' + req.user.username, sha256(token));
	telegramHelper.notify(`User: ${req.user.username} logged in via ${req.user.socialauth.provider}`);
	return res.redirect(`${conf.url}/login?social=true&status=ok&token=${token}&usertype=singleuser&email=unknown&expiration=1440&username=${req.user.username}`);
}


export function loginProvider(req: Request, res: Response, next: NextFunction) {
	const provider = req.params.provider;
	return passport.authenticate(provider, { session: false })(req, res, next);
}


export async function edit(req: any, res: Response, next: NextFunction) {
	let user = await UserModel.getByEmail(req.body.email);
	if (user)
		return error.response(res, 'ES2');

	user = await User.findOne({ username: req.username }, 'username activation password email socialauth banned').exec();

	if (user == null)
		return error.response(res, 'E');

	if (user.isBanned())
		return error.response(res, 'E');

	if (user.socialauth.status != 'incomplete') {
		res.status(200);
		return res.json({});
	}

	user.email = req.body.email;
	user.password = req.body.password;
	user.socialauth.status = 'done';

	try {
		await user.save();
		telegramHelper.notify(`User: ${user.username} set its email/password for ${user.socialauth.provider} login`);

		if (conf.mail.activation)
			await authController.sendActivationLink(req, null);
		else {
			await notificationController.notify({
				user: user,
				data: { user: user.username },
				code: 'welcome',
				email: true
			});
		}

		res.status(200);
		res.json({});
	} catch (err) {
		error.response(res, 'E');
	}
};

