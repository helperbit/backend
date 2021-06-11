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

import mcapi = require('mailchimp-api');
import nodemailer = require('nodemailer');
import conf = require('../conf');
import log = require('../log');
import fs = require('fs');


const smtpConfig = {
	host: conf.api.smtp.host,
	port: conf.api.smtp.port,
	secure: true, // use SSL
	auth: {
		user: conf.api.smtp.user,
		pass: conf.api.smtp.password
	}
};
const mailserver = nodemailer.createTransport(smtpConfig);


const header = "<div align=\"center\"><img width=\"124px\" src=\"https://app.helperbit.com/media/logo_hbtext.png\" /></div>";
const footer = "<div align=\"center\" style=\"font-weight: bold\">Please don't reply to this email, for any issues or further information contact us at info@helperbit.com</div><br><div align=\"center\" style=\"font-weight: bold\">Helperbit S.r.l | P.I. 13844091002 | <a href=\"mailto:info@helperbit.com\">support</a></div>";

export async function send(to: string, subject: string, message: string, file?: any): Promise<void> {
	if (!conf.mail.send) {
		log.debug('mail', 'Dummy send to ' + to + ': ' + message);
		return;
	}

	if (conf.blockchain.testnet) {
		subject = '[Testnet] ' + subject;
	}

	const mailOptions: any = {
		from: '"Helperbit Team" <' + conf.api.smtp.user + '>',
		to: to,
		subject: subject,
		// text: message,
		html: `<html><div style="font-size: 105%; margin-left:10%; margin-right:10%;">${header}<br>${message}<br><br>${footer}</div></html>`,
		attachments: []
	};

	if (file)
		mailOptions.attachments = [{ filename: 'capture.png', content: file }];

	// send mail with defined transport object
	try {
		const info = await mailserver.sendMail(mailOptions);

		if (file)
			fs.unlinkSync(file.path);

		log.debug('mail', 'Sent to ' + to);
		return;
	} catch (err) {
		return Promise.reject(err);
	}
}


export function subscribe (email: string, username?: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const mailchimp = new mcapi.Mailchimp(conf.api.mailchimp.apikey);
		const mergevars = username !== '' && username !== null ? { 'USER': username } : {};

		if (mailchimp === null)
			return reject();

		mailchimp.lists.subscribe({ id: conf.api.mailchimp.listid, double_optin: false, send_welcome: true, merge_vars: mergevars, email: { email: email } }, (data) => {
			return resolve();
		}, (error) => {
			/* Already done */
			if (error.code == 214)
				return resolve();
			else
				return reject(error);
		});
	});
}

