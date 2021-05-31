// IMPORTS
import log from "./utils/log";
import res_error from "./utils/res-error";
import config from './config.json';
import errors from './errors.json';
import delay from './utils/delay';
import mailer from './utils/mailer';

import express, { response } from "express";
import cors from 'cors';
//import bodyParser from "body-parser";
// helmet, morgan, compress

import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from  'fs';

import "reflect-metadata";
import * as db from "typeorm";

import Device from "./entity/device";
import Collection from "./entity/collection";
import Guarantee from "./entity/guarantee";

import * as uuid from "./utils/uuid";

// ROUTING STUFF
let router: express.Router = express.Router();
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: false }))

// INITIALIZE MODULE
export async function init(stop = false) {
    // CONNECTION TO DB
    let conn: db.Connection | undefined;
    try {
        conn = await db.createConnection();
        log("worker", `WPID: ${process.pid}\n\tTypeORM connection established`);
        return;
    } catch (error) {
        log("worker", `WPID: ${process.pid}\n\tTypeORM connection error: ${error}`, "e")
        return error;
    }
}

function query_get (req: express.Request, field: string) {
    let content: string | undefined = req.query[field] as string | undefined;
    return content;
}

function header_get (req: express.Request, field: string) {
    let content: string | undefined = req.header(field) as string | undefined;
    return content;
}

// WELCOMING REQUEST
router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    let info: string = `${req.method} ${req.originalUrl}\n\tFROM: ${req.ip} | TIME: ${new Date().toISOString()}\n\tWPID: ${process.pid}`;
    if (req.headers)
        for (const prop in req.headers)
            if (!config.ignorable_headers.some(x => x == prop))
                info += `\n\tHEADER: ${prop}:${req.headers[prop]}`;
    if (req.query) info += "\n\tQUERY: " + JSON.stringify(req.query);
    if (req.body) info += "\n\tBODY: " + JSON.stringify(req.body);
    log("worker", info);
    next();
});

// TEST
router.get("/test", async (req: express.Request, res: express.Response) => {
    log("worker", "beginning testing", "d");
    await delay(250);
    log("worker", "finishing testing", "d");
    res.status(200).send('OK, here it is, a random short uuid: ' + uuid.short());
});

// LOAD
router.get("/load", async (req: express.Request, res: express.Response) => {
    log("worker", "beginning load test", "d");
    await delay(100);
    log("worker", "finishing load test", "d");
    res.status(200).send('OK, here it is, a random short uuid: ' + uuid.short());
});

// GET error
/*router.get("/errors", async (req: express.Request, res: express.Response) => {
    res.json(errors) // need complete rework
});*/

// GET new
// ask for the creation of a brand new device with null collection
router.get("/new", async (req: express.Request, res: express.Response) => {
    try {
        let deviceRepo = db.getRepository(Device);
        let device = deviceRepo.create();
        device = await deviceRepo.save(device);
        res.json(device);
    } catch (exc) {
        res_error(res, errors.new_exc);
    }
});

// GET pair
router.get("/pair", async (req: express.Request, res: express.Response) => {
    try {
        let guar_code = query_get(req, config.req_attr.guar_code);
        if (guar_code) {
            let guaranteeRepo = db.getRepository(Guarantee);
            // sqlite: datetime('now')
            // mysql: CURRENT_TIMESTAMP()
            await guaranteeRepo.createQueryBuilder().select().where(`expiration > date('now')`).execute();
            let guarantee = await guaranteeRepo.findOne(guar_code.toUpperCase(), {relations:["device", "device.collection"]});
            if (guarantee) {
                let deviceRepo = db.getRepository(Device);
                let device = deviceRepo.create({collection: guarantee.device.collection});
                device = await deviceRepo.save(device);
                res.json(device);
            } else {
                res_error(res, errors.pair_missing);
            }
        } else {
            res_error(res, errors.pair_bad);
        }
    } catch (exc) {
        res_error(res, errors.pair_exc);
    }
});

// CHECK IF AUTHORIZED
router.use("", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        let dev_id = header_get(req, config.req_attr.dev_id);
        if (dev_id) {
            let deviceRepo = db.getRepository(Device);
            let device = await deviceRepo.findOne(dev_id, {relations:["collection"]});
            if (device) {
                res.locals.device = device;
                next();
            } else {
                res_error(res, errors.auth_missing);
            }
        } else {
            res_error(res, errors.auth_bad);
        }
    } catch (exc) {
        res_error(res, errors.auth_exc);
    }
});

// ADD COLLECTION IF FIRST TIME FOR THE USER
router.use("", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        let device: Device | undefined = res.locals.device;
        if (device) {
            if (!device.collection) {
                let deviceRepo = db.getRepository(Device);
                let collectionRepo = db.getRepository(Collection);
                device.collection = await collectionRepo.save(collectionRepo.create());
                device = await deviceRepo.save(device);
                res.locals.device = device;
            }
            next();
        } else {
            res_error(res, errors.generic);
        }
    } catch (exc) {
        res_error(res, errors.collgen_exc);
    }
});

// TEST AUTHORIZATION
router.get("/test-auth", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        log("worker", "beginning testing", "d");
        let device: Device | undefined = res.locals.device;
        if (device) {
            log("worker", "finishing testing", "d");
            res.json(device);
        } else {
            log("worker", "finishing testing", "d");
            res_error(res, errors.generic);
        }
    } catch (exc) {
        res_error(res, errors.generic);
    }
});

// GET COLLECTION
router.get("/collection", async (req: express.Request, res: express.Response) => {
    try {
        let device: Device | undefined = res.locals.device;
        if (device) {
            let path = `${config.collections.folder}/${device.collection.id}.${config.collections.format}`;
            if (fs.existsSync(path)) {
                res.sendFile(path, {root: "./"});
            } else {
                if (!fs.existsSync(config.collections.folder)) fs.mkdirSync(config.collections.folder)
                fs.copyFileSync(config.collections.prototype, path);
                res.sendFile(path, {root: "./"});
            }
        } else {
            res_error(res, errors.generic);
        }
    } catch (exc) {
        res_error(res, errors.generic);
    }
});

// POST COLLECTION
router.post("/collection", async (req: express.Request, res: express.Response) => {
    try {
        let device: Device | undefined = res.locals.device;
        if (device) {
            let path = `${config.collections.folder}/${device.collection.id}.${config.collections.format}`;
            let data = Buffer.alloc(0);
            let safe = true;
            req.on('data', (chunk) => {
                if (safe) {
                    data = Buffer.concat([data, chunk]);
                    safe = Buffer.byteLength(data) <= 1000000
                }
            });
            req.on('end', async () => {
                fs.writeFileSync(path, data, "binary");
                if (device && safe) {
                    device.collection.lastDevice = device;
                    let deviceRepo = db.getRepository(Device);
                    await deviceRepo.save(device);
                    res.status(200).send('OK');
                } else {
                    res_error(res, errors.generic); // not safe
                }
            });
        } else {
            res_error(res, errors.generic); // device unfined (imp)
        }
    } catch (exc) {
        res_error(res, errors.generic); // something else (imp)
    }
});

// 
router.get("/collection/time", async (req: express.Request, res: express.Response) => {
    try {
        let device: Device | undefined = res.locals.device;
        if (device) {
            let path = `${config.collections.folder}/${device.collection.id}.${config.collections.format}`;
            if (fs.existsSync(path)) {
                res.json({mtime: fs.statSync(path).mtime, ctime: fs.statSync(path).ctime})
            } else {
                res_error(res, errors.generic);
            }
        } else {
            res_error(res, errors.generic);
        }
    } catch (exc) {
        res_error(res, errors.generic);
    }
});

// GET guarantee
router.get("/guarantee", async (req: express.Request, res: express.Response) => {
    try {
        let device: Device | undefined = res.locals.device;
        if (device) {
            let guaranteeRepo = db.getRepository(Guarantee);
            // sqlite: datetime('now')
            // mysql: CURRENT_TIMESTAMP()
            await guaranteeRepo.createQueryBuilder().delete().where(`expiration < datetime('now')`).execute();
            let guarantee = await guaranteeRepo.save(guaranteeRepo.create({device: device}))
            res.json(guarantee)
        } else {
            res_error(res, errors.generic);
        }
    } catch (exc) {
        res_error(res, errors.generic);
    }
});

// GET track
router.get("/track", async (req: express.Request, res: express.Response) => {
    try {
        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        log("track", `platform: ${platform}`, "d");
        log("track", `code: ${code}`, "d");
        if (platform && code) {
            let url = "";
            if (platform == config.platform.youtube) {
                url = `https://www.youtube.com/watch?v=${code}`;
            } else {
                throw new Error();
            }
            log("track", `url: ${url}`, "d");
            let prefix = `${platform}=`;
            let path = `${config.tracks.folder}/${prefix}${code}.${config.tracks.format}`;
            if (fs.existsSync(path)) {
                log("track", "file exists", "b");
                res.sendFile(path, {root: "./"});
            } else {
                if (!fs.existsSync(config.tracks.folder)) fs.mkdirSync(config.tracks.folder)
                let stream = ytdl(url);
                let proc = ffmpeg({source: stream});
                if (config.tracks.spec_ffmpeg) {
                    proc.setFfmpegPath(config.tracks.ffmpeg);
                }
                proc.on("error", (err) => { throw new Error(err); });
                proc.on("progress", (prog) => { log("track", JSON.stringify(prog), "b"); });
                proc.on("end", () => { res.sendFile(path, {root: "./"}); });
                proc.saveToFile(path);
            }
        } else {
            res_error(res, errors.generic);
        }
    } catch (exc) {
        res_error(res, errors.generic);
    }
});

export default { router, init };