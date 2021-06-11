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

import statisticsController = require('./statistics.controller');
import { Async } from "../../helpers/async";
const router = require('express').Router();

router.get('/stats', Async.middleware(statisticsController.getStats));
router.get('/stats/social', Async.middleware(statisticsController.getSocialStats));
router.get('/stats/world', Async.middleware(statisticsController.getWorldStats));
router.get('/stats/country/:country/short', Async.middleware(statisticsController.getShortCountryStats));
router.get('/stats/country/:country', Async.middleware(statisticsController.getCountryStats));
router.get('/stats/topdonors/:timeframe', Async.middleware(statisticsController.getTopDonors));

export const StatisticsApi = router;
