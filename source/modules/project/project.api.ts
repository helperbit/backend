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

import schemaValidator = require('../../helpers/schema-validator');
import { Async } from "../../helpers/async";
import projectSchema = require('./project.schema');
import projectController = require('./project.controller');
import userController = require('../user/user.controller');
import authController = require('../user.auth/auth.controller');
const router = require('express').Router();

router.get('/projects/home',
	Async.middleware(projectController.getMainList)
);

router.get('/project/:id',
	Async.middleware(authController.checkLazy),
	Async.middleware(projectController.getByID)
);

router.get('/projects',
	Async.middleware(authController.checkLazy),
	Async.middleware(projectController.getList('all'))
);

router.get('/projects/list',
	Async.middleware(authController.checkLazy),
	Async.middleware(projectController.getList('paginated'))
);

router.post('/projects/list',
	Async.middleware(authController.checkLazy),
	Async.middleware(projectController.getList('paginated'))
);


router.post('/project/create',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	schemaValidator.validate(projectSchema.create),
	Async.middleware(userController.me),
	Async.middleware(projectController.create)
);

router.post('/project/:id/edit',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	schemaValidator.validate(projectSchema.update),
	Async.middleware(projectController.get),
	Async.middleware(projectController.update)
);

router.post('/project/:id/submit',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(projectController.get),
	Async.middleware(projectController.submit)
);

router.post('/project/:id/delete',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(projectController.get),
	Async.middleware(projectController.remove)
);

router.post('/project/:id/media',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(projectController.get),
	Async.middleware(projectController.uploadMedia)
);

router.post('/project/:id/media/:mid/remove',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(projectController.get),
	Async.middleware(projectController.removeMedia)
);


/* Activities */
router.post('/project/:id/activity/new',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	schemaValidator.validate(projectSchema.activityCreate),
	Async.middleware(projectController.get),
	Async.middleware(projectController.newActivity)
);

router.post('/project/:id/activity/:aid/edit',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	schemaValidator.validate(projectSchema.activityEdit),
	Async.middleware(projectController.get),
	Async.middleware(projectController.editActivity)
);


router.post('/project/:id/activity/:aid/media',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(projectController.get),
	Async.middleware(projectController.uploadActivityMedia)
);

router.post('/project/:id/activity/:aid/media/:mid/remove',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(projectController.get),
	Async.middleware(projectController.removeActivityMedia)
);



router.post('/project/:id/activity/:aid/remove',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(userController.typeFilter(['npo', 'company'])),
	Async.middleware(projectController.get),
	Async.middleware(projectController.removeActivity)
);


/* Projects of */
router.get('/user/:name/projects',
	Async.middleware(authController.checkLazy),
	Async.middleware(projectController.getList('user'))
);


router.get('/event/:id/projects',
	Async.middleware(authController.checkLazy),
	Async.middleware(projectController.getList('event'))
);


router.get('/me/projects',
	Async.middleware(authController.check),
	Async.middleware(userController.trustFilter(40)),
	Async.middleware(projectController.getList('me'))
);

export const ProjectApi = router;
