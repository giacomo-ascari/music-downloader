// IMPORTS
import log from "../utils/log";
import {query_get, path_get} from "../utils/get";
import config from '../config.json';

import express from "express";

import ytdl from "ytdl-core";
import fs from  'fs';

// ROUTING STUFF
let router: express.Router = express.Router();

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

//http://localhost:3001/music-downloader/track?t_plat=youtube&t_code=BhMC23ll2Rk
router.get("/track", async (req: express.Request, res: express.Response) => {
    try {

        clearTimeout(gc);

        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {

            let path = path_get(platform, code, config.tracks.folder, config.tracks.format);
            if (!fs.existsSync(config.tracks.folder)) fs.mkdirSync(config.tracks.folder)

            if (!fs.existsSync(path)) {

                if (platform in config.platforms && platform == "youtube") {
                    log("track", `starting download`, "d");
                    let url = (config.platforms[platform] as string).replace("$", code);
                    ytdl(url, {filter: "audioonly"}).pipe(fs.createWriteStream(path)).on("finish", () => {
                        log("track", `ending download and sending`, "d");
                        res.sendFile(path, {root: "./"}, (err) => {
                            log("track", `sent`, "d");
                            gc = setTimeout(removeOldTracks, 5000);
                        });
                    });
                } else {
                    throw new Error();
                }
                
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