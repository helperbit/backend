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

import { Async } from "../../helpers/async";

import schemaValidator = require('../../helpers/schema-validator');
import commentSchema = require('./comment.schema');
import authController = require('../user.auth/auth.controller');
// import commentController = require('./comment.controller');
const router = require('express').Router();


/* Get list */
router.get('/project/:id/comments',
	Async.middleware(authController.checkLazy),
	(req, res) => { }
);

router.get('/event/:id/comments',
	Async.middleware(authController.checkLazy),
	(req, res) => { }
);

router.get('/user/:id/comments',
	Async.middleware(authController.checkLazy),
	(req, res) => { }
);


/* Add */
router.post('/project/:id/comment/add',
	Async.middleware(authController.checkLazy),
	schemaValidator.validate(commentSchema.add),
	(req, res) => { }
);

router.post('/event/:id/comment/add',
	Async.middleware(authController.checkLazy),
	schemaValidator.validate(commentSchema.add),
	(req, res) => { }   
);

router.post('/user/:id/comment/add',
	Async.middleware(authController.checkLazy),
	schemaValidator.validate(commentSchema.add),
	(req, res) => { }
);


/* Remove */
router.post('/project/:id/comment/:cid/remove',
	Async.middleware(authController.checkLazy),
	(req, res) => { }
);

router.post('/event/:id/comment/:cid/remove',
	Async.middleware(authController.checkLazy),
	(req, res) => { }
);

router.post('/user/:id/comment/:cid/remove',
	Async.middleware(authController.checkLazy),
	(req, res) => { }
);



export = router;
