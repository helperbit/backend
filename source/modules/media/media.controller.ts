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
import sharp = require('sharp');
import fs = require('fs');
import util = require('util');
import multiparty = require('multiparty');
import path = require('path');
import os = require('os');
import log = require('../../log');
import error = require('../../error');
import storageHelper = require('../../helpers/storage');
import { $MediaDocument, Media, MediaModel } from './media.model';
import { sha256 } from "../../helpers/crypto";

const storageClient = storageHelper.init();


function browserSupportedFormat(req: Request) {
	const isSafari = req.headers['user-agent'].search("Safari") >= 0 && req.headers['user-agent'].search("Chrome") < 0;
	return isSafari ? 'png' : 'webp';
}

async function download(image, req, res, nopipe = false) {
	if (browserSupportedFormat(req) == 'webp') {
		res.header("Content-Type", image.contenttype);
		res.status(200);
		return storageClient.download(image.container, image.filename, res, nopipe);
	}

	// Safari
	const tempFilePath = os.tmpdir() + '/' + image.container + image.filename;
	const fss = fs.createWriteStream(tempFilePath);
	await storageClient.download(image.container, image.filename, fss, nopipe);

	fss.on('finish', async () => {
		await sharp(tempFilePath).toFormat('png').toFile(tempFilePath + '.png');
		res.header("Content-Type", 'image/png');
		res.status(200);
		res.sendFile(tempFilePath + '.png');
	});
}

interface MediaOptions {
	types?: string[];
	maxsize?: number;
	expiry?: Date;
	hash?: boolean;
	container: string;
	filename: string;
	maxwidth?: number;
	quad?: boolean;
}


/* Upload a pdf file */
async function uploadPDF(file, options: MediaOptions): Promise<$MediaDocument> {
	const data = Buffer.from(fs.readFileSync(file.path));

	try {
		await storageClient.upload(options.container, options.filename + '.pdf', fs.createReadStream(file.path));
		const img: $MediaDocument = new Media();

		img.container = options.container;
		img.filename = options.filename + '.pdf';
		img.contenttype = 'application/pdf';
		img.expiry = null;

		if ('hash' in options && options.hash)
			img.hash = sha256(data.toString());

		await util.promisify(fs.unlink)(file.path);
		return img;
	} catch (err) {
		await util.promisify(fs.unlink)(file.path);
		return Promise.reject(err);
	}
}

/* Upload an image file */
async function uploadImage(file, options: MediaOptions): Promise<$MediaDocument> {
	let image = await sharp(file.path);
	if (image === null)
		return Promise.reject();

	let nh = null;
	let nw = null;

	const sizing = await image.metadata();
	nh = sizing.height;
	nw = sizing.width;

	if (options && options.maxwidth) {
		nh = options.maxwidth * sizing.height / sizing.width;
		nw = options.maxwidth;

		/* if (image.bitmap.height < image.bitmap.width {
			nh = options.maxwidth;
			nw = options.maxwidth * image.bitmap.width / image.bitmap.height;
		}*/

		image = await image.resize({ width: Math.floor(Number(nw)), height: Math.floor(Number(nh)) });
	}

	if (image === null)
		return Promise.reject();

	if (options && options.quad) {
		if(options.maxwidth > nh) 
			options.maxwidth = nh;
		
		image = await image.extract({ left: 0, top: 0, width: Math.floor(Number(options.maxwidth)), height: Math.floor(Number(options.maxwidth)) });
	}

	if (image === null)
		return Promise.reject();


	await image.toFormat('webp').toFile(file.path + '.webp');

	try {
		await storageClient.upload(options.container, options.filename + '.webp', fs.createReadStream(file.path + '.webp'));
		const img = new Media();

		img.container = options.container;
		img.filename = options.filename + '.webp';
		img.contenttype = 'image/webp';
		img.expiry = null;

		if ('hash' in options && options.hash)
			img.hash = sha256((Buffer.from(fs.readFileSync(file.path))).toString());

		await util.promisify(fs.unlink)(file.path);
		return img;
	} catch (err) {
		await util.promisify(fs.unlink)(file.path);
		return Promise.reject();
	}
}

export async function removeMedia(imageid: string) {
	const image = await MediaModel.getByID(imageid);
	if (image === null)
		return true;

	try {
		await storageClient.remove(image.container, image.filename);
		await Media.remove({ _id: imageid });
		return true;
	} catch (err) {
		return Promise.reject(err);
	}
}


export async function removeMediaList(mediaList: string[]) {
	const ps = mediaList.map(m => removeMedia(m));
	return await Promise.all(ps);
}

/* Generic upload function */
export function upload(req: any, res: Response, options: MediaOptions): Promise<{ image: $MediaDocument; body: any }> {
	return new Promise((resolve, reject) => {
		const form = new multiparty.Form();
		const image = null;
		let title;
		const body = {};

		form.on('error', (err) => {
			return error.response(res, 'EM6');
		});

		if (!options.types)
			options.types = ['image'];

		if (!options.maxsize)
			options.maxsize = 1024 * 1024 * 4;

		if ('admin' in options)
			req.username = 'helperbit';

		form.on('file', async (name, file) => {
			/* Error conditions */
			if (file === null)
				return error.response(res, 'EM6');
			if (!('content-type' in file.headers))
				return error.response(res, 'EM4');
			if ((options.types && options.types.indexOf('image') != -1 && (file.headers['content-type'].substring(0, 5) != 'image' || file.headers['content-type'] == 'image/svg+xml'))
				&&
				(options.types && options.types.indexOf('pdf') != -1 && file.headers['content-type'].indexOf('pdf') == -1)
			)
				return error.response(res, 'EM1', { supported: options.types });
			if (file.size > options.maxsize)
				return error.response(res, 'EM2', { value: options.maxsize });


			let img: $MediaDocument | null = null;

			try {
				if (file.headers['content-type'].substring(0, 5) == 'image')
					img = await uploadImage(file, options);
				else if (file.headers['content-type'].indexOf('pdf') != -1)
					img = await uploadPDF(file, options);
				else
					return error.response(res, 'EM1', { supported: options.types });
			} catch (err) {
				log.error('Media', `Upload failed: ${err}`);
				return error.response(res, 'EM6');
			}

			/* Set the expiration */
			if ('expiry' in options)
				img.expiry = options.expiry;

			/* Set the owner */
			if (req.username === undefined) {
				img.owner = req.ip;

				/* Get another temp image with the same owner */
				const images = await Media.find({ owner: req.ip }).exec();
				const lst = [];

				for (let i = 0; i < images.length; i++)
					lst.push(images[i]._id);

				await removeMediaList(lst);
			} else {
				img.owner = req.username;
			}

			try {
				await img.save();
				return resolve({ image: img, body: body })
			} catch (err) {
				return error.response(res, 'EM6');
			}
		});

		form.parse(req, (err, fields, files) => {
			if (fields !== undefined) {
				const keys = Object.keys(fields);

				for (let i = 0; i < keys.length; i++) {
					body[keys[i]] = fields[keys[i]][0];
				}
			}

			if (err !== null || !('file' in files)) {
				log.error('Media', `Error: ${err}, Fields: ${fields}, Files: ${files}`);
				return error.response(res, 'EM6');
			}
		});
	})
}



export async function uploadPrivate(req: Request, res: Response, owner: string, options: MediaOptions) {
	const data = await upload(req, res, options);

	if (data.image === null)
		return Promise.reject();

	data.image.owner = owner;
	data.image.private = true;
	await data.image.save();
	return data;
}


export async function type(req: Request, res: Response) {
	const id = req.params.id;

	const image = await MediaModel.getByID(id);
	if (image === null)
		return error.response(res, 'E2');

	res.status(200);
	res.json({ type: image.contenttype });
}

export async function show(req: any, res: Response, mid?: string) {
	const id = mid || req.params.id;

	const image = await MediaModel.getByID(id);
	if (image === null)
		return error.response(res, 'E2');

	if (image.private) {
		if (req.username == image.owner) {
			if (image.archived) {
				return res.sendFile(`archived_media.${browserSupportedFormat(req)}`, { root: path.join(__dirname, '../../data') });
			} else {
				return download(image, req, res);
			}
		} else {
			return error.response(res, 'E2');
		}
	} else if (image.archived) {
		return res.sendFile(`archived_media.${browserSupportedFormat(req)}`, { root: path.join(__dirname, '../../data') });
	} else {
		return download(image, req, res);
	}
}


export async function showThumbnail(req: Request, res: Response, mid?: string, msize?: number) {
	const id = mid || req.params.id;
	let size = msize || parseInt(req.params.size) || 256;

	if ([100, 200, 256, 300, 400, 512].indexOf(size) == -1) {
		size = 256;
	}

	const image = await MediaModel.getByID(id);
	if (image === null)
		return error.response(res, 'E2');

	if (image.private || image.contenttype.substring(0, 5) != 'image' || image.archived) {
		return show(req, res, mid);
	} else {
		/* Check if the desidered thumb exists */
		const filename = image.filename.split('.')[0];
		const tempFilePath = os.tmpdir() + '/' + id + '_' + size + '.webp';

		try {
			await download({
				filename: id + '_' + size + '.webp',
				container: image.container,
				contenttype: image.contenttype
			}, req, res);
		} catch (err) {
			const fss = fs.createWriteStream(tempFilePath + '.webp');
			await storageClient.download(image.container, image.filename, fss);

			fss.on('error', async () => {
				return error.response(res, 'E2');
			});

			/* If not create thumb and save */
			fss.on('finish', async () => {
				fss.close();
				await sharp(tempFilePath + '.webp').resize(size).toFormat('webp').toFile(tempFilePath);

				try {
					await storageClient.upload(image.container, id + '_' + size + '.webp', fs.createReadStream(tempFilePath))
					res.header("Content-Type", image.contenttype);
					res.status(200);

					await download({
						filename: id + '_' + size + '.webp',
						container: image.container,
						contenttype: image.contenttype
					}, req, res);
				} catch (err) {

				}
			});
		}
	}
}

export async function showAdmin(req: Request, res: Response, mid?: string) {
	const id = mid || req.params.id;

	const image = await MediaModel.getByID(id);

	if (image === null)
		return error.response(res, 'E2');

	if (image.archived) {
		return res.sendFile('archived_media.webp', { root: path.join(__dirname, '../../data') });
	} else {
		return download(image, req, res);
	}
}

/* Archive a file */
export async function archiveDocument(id: string, user: string): Promise<any> {
	const image = await MediaModel.getByID(id, '+archivedate +archiveby');
	if (image === null || image.archived || image.container != 'documents')
		return Promise.reject('image not found, not a document, or already archived');

	try {
		await storageClient.move(image.container, image.filename, 'archiveddocuments');
		image.archived = true;
		image.archivedate = new Date();
		image.archiveby = user;
		await image.save();
		return image;
	} catch (err) {
		return Promise.reject('move failed');
	}
}


/** * TODO, this wont work anymore */
/* Download the image and send it to handler as (err, image, file) */
export async function data(id: string): Promise<$MediaDocument> {
	const image: $MediaDocument = await MediaModel.getByID(id);
	const tempFilePath = os.tmpdir() + '/' + image.hash;
	const fss = fs.createWriteStream(tempFilePath);

	try {
		const stream = await storageClient.download(image.container, image.filename, fss);
		stream.pipe(fss);
		return image;
	} catch (err) {
		return Promise.reject();
	}
}
