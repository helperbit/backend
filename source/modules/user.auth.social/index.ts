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

import conf = require('../../conf');
import UserRegistrationSocialMetric from './metrics/UserRegistrationSocial';
import { Module, getModuleConfigurationFromName } from '../module';
import { UserAuthSocialApi } from './social.api';

export interface UserAuthSocialConfig {
	enabled: boolean;
	linkedin: {
		clientid: string;
		clientsecret: string;
		redirecturi: string;
	};
	twitter: {
		apikey: string;
		apisecret: string;
		redirecturi: string;
	};
	facebook: {
		appid: string;
		appsecret: string;
		redirecturi: string;
	};
	google: {
		clientid: string;
		clientsecret: string;
		redirecturi: string;
	};
}

export const UserAuthSocialModule: Module = {
	name: 'user.auth.social',
	require: [],
	enabled: getModuleConfigurationFromName('user.auth.social').enabled,

	metrics: [
		new UserRegistrationSocialMetric
	],
	api: () => UserAuthSocialApi
};
