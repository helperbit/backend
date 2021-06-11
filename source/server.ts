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

(process as any).binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

import conf = require('./conf');
import fs = require('fs');

// const access = fs.createWriteStream (conf.logs.api);
// process.stdout.write = process.stderr.write = access.write.bind (access);

import mongoose = require('mongoose');
import express = require('express');
import bodyParser = require('body-parser');
import passport = require('passport');
import morgan = require('morgan');
import session = require('express-session');
import compress = require('compression');
import ratelimit = require('express-rate-limit');
import hpp = require('hpp');
import helmet = require('helmet');
import redisstore = require('connect-redis');
import https = require('https');
import cluster = require('cluster');
import noCache = require('nocache');

import log = require('./log');
import error = require('./error');
import { Realtime } from './realtime';
import { RedisCache } from './helpers/cache';
import { connectDatabase } from './helpers/db';
import { ModuleRepository } from './modules';
import { AdminModule } from './modules/admin';
import { Module } from './modules/module';



log.debug('Server', 'Helperbit backend is starting...');
log.debug('Server', `Setting env to ${conf.env}`);

const port: number = parseInt(process.env.VCAP_APP_PORT) || parseInt(process.env.PORT) || conf.port;

const cert_conf = {
	key: fs.readFileSync(__dirname + '/data/ssl/helperbit.key', 'utf8'),
	cert: fs.readFileSync(__dirname + '/data/ssl/STAR_helperbit_com.crt', 'utf8'),
	ca: [
		fs.readFileSync(__dirname + '/data/ssl/comodo_intermediate1.ca', 'utf8'),
		fs.readFileSync(__dirname + '/data/ssl/comodo_intermediate2.ca', 'utf8')
	]
};


const app = express();

app.enable('trust proxy');

/* Rate limit, general policy */
if (conf.security.rateLimit) {
	app.use(new ratelimit({
		windowMs: 1 * 60 * 1000,
		max: 500
	}));
}

/* This redirect all connections to https */
if (conf.env.indexOf('local') == -1 && port == 443) {
	app.use((req, res, next) => {
		if (req.secure)
			next();
		else
			res.redirect('https://' + req.headers.host + req.url);
	});
}

/* Inflate IP to res */
app.use((req, res: any, next) => {
	res.ip = req.ip;
	return next();
});

app.use(morgan('route', { skip: (req, res) => { return (req.method == 'OPTIONS'); } }));
app.use(compress());

app.use(bodyParser.json({
	limit: '5mb'
}));

app.use(bodyParser.urlencoded({
	type: 'application/x-www-form-urlencoded',
	limit: '5mb',
	extended: true
}));

app.use(hpp());

// app.use(helmet.contentSecurityPolicy());
app.use(helmet.dnsPrefetchControl());
// app.use (helmet.frameguard ());
app.use(helmet.hidePoweredBy());
// app.use (helmet.hpkp ());
// app.use (helmet.hsts ());
app.use(helmet.ieNoOpen());
app.use(noCache());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

app.use(passport.initialize());

app.set('views', [__dirname + '/admin/views', __dirname + '/modules']);
app.set('view engine', 'jade');


app.use(
	session({
		secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
		proxy: true,
		resave: true,
		saveUninitialized: true,
		store: new (redisstore(session))({ client: new RedisCache().raw })
	})
);


/* Set allowed headers, methods and origin */
app.use((req, res, next) => {
	// if (conf.env.indexOf ('local') != -1)
	res.header('Access-Control-Allow-Origin', '*');

	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, captcha, X-api-key, X-auth-token, Content-Type, Content-Length');

	next();
});


/* Routes */
const apiv1 = express.Router();

ModuleRepository.i().list().forEach((m: Module) => {
	if ('api' in m)
		apiv1.use('/', m.api());
});

app.use('/api/v1/', apiv1);
app.use('/admin/', AdminModule.adminApi());


app.use((err: any, req: any, res: any, next: any) => {
	console.log(err);
	if (err instanceof mongoose.Error.CastError)
		return error.response(res, 'E');

	log.critical('except', `${err.stack}`);
	error.response(res, 'E');
});

process.on('uncaughtException', (err: any) => { log.critical('except', `${err.stack}`); });


if (conf.clusterize) {
	if (cluster.isMaster) {
		const cpuCount = typeof (conf.clusterize) == 'number' ? conf.clusterize : require('os').cpus().length;

		log.debug('cluster', `Cluster is active with ${cpuCount} workers`);

		for (let i = 0; i < cpuCount; i += 1) {
			const worker = cluster.fork();
			log.debug('Cluster', `Deployed worker: ${worker.id}`);
		}
	} else {
		log.debug('cluster', `Worker ${cluster.worker.id} started`);

		connectDatabase().then(() => {
			let server = null;
			log.debug('server', `Helperbit backend is running on port ${port}`);

			if (port != 443) {
				log.debug('server', `SSL is not enabled`);
				server = app.listen(port);
			}
			else {
				log.debug('server', `SSL is enabled`);
				server = https.createServer(cert_conf, app).listen(port);
			}

			new Realtime().init(server);
		}).catch((err: any) => {
			log.debug('cluster', `Worker ${cluster.worker.id} died, restarting`);
			const worker = cluster.fork();
			log.debug('cluster', `Starting worker: ${worker.id}`);
		});
	}
} else {
	connectDatabase().then(() => {
		let server = null;
		log.debug('server', `Helperbit backend is running on port ${port}`);

		if (port != 443) {
			log.debug('server', `SSL is not enabled`);
			server = app.listen(port);
		}
		else {
			log.debug('server', `SSL is enabled`);
			server = https.createServer(cert_conf, app).listen(port);
		}

		new Realtime().init(server);
	}).catch((err: any) => {
		log.debug('server', `Process died, restarting`);
		if (conf.env != 'local')
			cluster.fork();
		else
			log.debug('server', `Error: ${err}`);
	});
}
