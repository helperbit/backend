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

import conf = require('../conf');
import { Moment } from 'moment';
const { google } = require('googleapis');


export async function getData(start: Moment, end: Moment, metrics?: string) {
	if (conf.api.google_jwt.email.length == 0)
		return null;
		
	const jwt = new google.auth.JWT(conf.api.google_jwt.email, null, conf.api.google_jwt.secret, 'https://www.googleapis.com/auth/analytics.readonly')
	const view_id = '120759944';

	// https://developers.google.com/analytics/devguides/reporting/core/dimsmets#view=detail
	if (!metrics)
		metrics = 'ga:pageviews,ga:sessions,ga:users,ga:newUsers';

	const response = await jwt.authorize();
	const result = await google.analytics('v3').data.ga.get({
		'auth': jwt,
		'ids': 'ga:' + view_id,
		'start-date': start.format('YYYY-MM-DD'),
		'end-date': end.format('YYYY-MM-DD'),
		'metrics': metrics
	});

	return result.data;
}

export async function getTotal(start: Moment, end: Moment, metrics?: string) {
	return (await getData(start, end, metrics))['totalsForAllResults'];
}
