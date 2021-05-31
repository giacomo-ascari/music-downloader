// IMPORTS
import log from "./utils/log";
import delay from "./utils/delay";
import config from './config.json';

import express, { response } from "express";
import cors from 'cors';

import ytdl from "ytdl-core";
import ytpl from "ytpl";
import fs, { stat } from  'fs';
import { Readable } from "stream";

// ROUTING STUFF
let router: express.Router = express.Router();
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: false }))

function query_get (req: express.Request, field: string) {
    let content: string | undefined = req.query[field] as string | undefined;
    return content;
}

function header_get (req: express.Request, field: string) {
    let content: string | undefined = req.header(field) as string | undefined;
    return content;
}

let gc: NodeJS.Timeout;
function removeOldTracks() {
    let files = fs.readdirSync(config.tracks.folder);
    let total = 0;
    let max_size = (process.env.SIZE_MB as unknown as number) * 1000000;
    files.sort((x, y) => {
        let x_stats = fs.statSync(`${config.tracks.folder}/${x}`).mtime;
        let y_stats = fs.statSync(`${config.tracks.folder}/${y}`).mtime;
        return (x_stats < y_stats) ? 1 : -1;
    })
    files.forEach(file => { total += fs.statSync(`${config.tracks.folder}/${file}`).size; });
    while (total > max_size) {
        let file = files.pop();
        total -= fs.statSync(`${config.tracks.folder}/${file}`).size;
        fs.rmSync(`${config.tracks.folder}/${file}`);
        log("gc", `${file} deleted`, "d");
    }    
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


router.get("/test", async (req: express.Request, res: express.Response) => {
    log("worker", "beginning testing", "d");
    await delay(250);
    log("worker", "finishing testing", "d");
    res.status(200).send('OK, here it is');
});

function getUrl(platform: string, code: string) {
    let url = "";
    if (platform == config.platform.youtube) {
        url = `https://www.youtube.com/watch?v=${code}`;
    } else {
        throw new Error();
    }
    return url;
}

function getPath(platform: string, code: string) {
    let prefix = `${platform}=`;
    let path = `${config.tracks.folder}/${prefix}${code}.${config.tracks.format}`;
    return path;
}

//http://localhost:3001/music-downloader/info-pl?t_plat=youtube&t_code=UU_aEa8K-EOJ3D6gOs7HcyNg
router.get("/info-pl", async (req: express.Request, res: express.Response) => {
    try {
        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {
            
            let playlist;
            if (platform == config.platform.youtube) {
                playlist = await ytpl(code);
            } else {
                throw new Error();
            }
            res.json(playlist);

        } else {
            res.status(500).send("Unsupported platform");
        }
    } catch (exc) {
        res.status(500).send("Generic exception OR Unsupported platform");
    }
});

//http://localhost:3001/music-downloader/info?t_plat=youtube&t_code=BhMC23ll2Rk
router.get("/info", async (req: express.Request, res: express.Response) => {
    try {
        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {
            
            let url = getUrl(platform, code);
            let raw: any, info: any;

            if (platform == config.platform.youtube) {
                raw = await ytdl.getBasicInfo(url);
                info = {
                    title: raw.videoDetails.title,
                    author: raw.videoDetails.author.name,
                    mediaSong: raw.videoDetails.media.song,
                    mediaArtist: raw.videoDetails.media.artist
                };
            } else {
                throw new Error();
            }
            res.json({raw, info});

        } else {
            res.status(500).send("Unsupported platform");
        }
    } catch (exc) {
        res.status(500).send("Generic exception OR Unsupported platform");
    }
});

//http://localhost:3001/music-downloader/track?t_plat=youtube&t_code=BhMC23ll2Rk
router.get("/track", async (req: express.Request, res: express.Response) => {
    try {

        clearTimeout(gc);

        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {

            let url = getUrl(platform, code);
            let path = getPath(platform, code);
            if (!fs.existsSync(path)) {
                if (!fs.existsSync(config.tracks.folder)) fs.mkdirSync(config.tracks.folder)
                log("track", `starting download`, "d");
                ytdl(url, {filter: "audioonly"}).pipe(fs.createWriteStream(path)).on("finish", () => {
                    log("track", `ending download and sending`, "d");
                    res.sendFile(path, {root: "./"}, (err) => {
                        log("track", `sent`, "d");
                        gc = setTimeout(removeOldTracks, 5000);
                    });
                });
            } else {
                log("track", `sending file`, "d");
                res.sendFile(path, {root: "./"}, (err) => {
                    log("track", `sent`, "d");
                    gc = setTimeout(removeOldTracks, 5000);
                });
                
            }
        } else {
            res.status(500).send("Unsupported platform");
        }
    } catch (exc) {
        res.status(500).send("Generic exception");
    }
});

export default router;