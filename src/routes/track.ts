// IMPORTS
import log from "../utils/log";
import {query_get, path_get} from "../utils/get";
import config from '../config.json';

import express from "express";

import ytdl from "ytdl-core";
import util from "util";
import {exec as _exec} from "child_process";
import fs from  'fs';

const exec = util.promisify(_exec);

// ROUTING STUFF
let router: express.Router = express.Router();

/*let gc: NodeJS.Timeout;
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
    log("gc", `${total} occupied`, "d");
    while (total > max_size) {
        let file = files.pop();
        total -= fs.statSync(`${config.tracks.folder}/${file}`).size;
        fs.rm(`${config.tracks.folder}/${file}`, () => {
            log("gc", `${file} deleted`, "d");
        });
    }    
}*/

router.get("/retrieve", async (req: express.Request, res: express.Response) => {
    try {

        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {

            let path = path_get(platform, code, config.tracks.folder, config.tracks.format);
            if (!fs.existsSync(config.tracks.folder)) fs.mkdirSync(config.tracks.folder)

            if (!fs.existsSync(path)) {
                
                log("track", `starting retrieve...`, "d");

                if (platform in config.platforms && platform == "youtube") {
                    let temp_path = path_get(platform, code, config.tracks.folder, config.platforms[platform].format);
                    let url = (config.platforms[platform].url as string).replace("$", code);

                    ytdl(url, {filter: "audioonly", quality:"highestaudio"}).pipe(fs.createWriteStream(temp_path)).on("finish", async () => {
                        if (!process.env.FFMPEG_CMD ) throw new Error();
                        log("track", `converting...`, "d");
                        let command = process.env.FFMPEG_CMD.replace("?0", temp_path).replace("?1", path);
                        const { stdout, stderr } = await exec(command);
                        //log("exec", `stdout: ${stdout}`, "w");
                        //log("exec", `stderr: ${stderr}`, "w");
                        //fs.renameSync(temp_path, path);
                        res.status(200).send("ok");
                        fs.rmSync(temp_path);
                        log("track", `done`, "d");
                    })
                } else {
                    throw new Error();
                }
            } else {
                res.status(200).send("ok");
            }

        } else {
            res.status(500).send("Error");
        }
        
    } catch (exc) {
        res.status(500).send("Error");
    }
});

//http://localhost:3001/music-downloader/download?t_plat=youtube&t_code=BhMC23ll2Rk
router.get("/download", async (req: express.Request, res: express.Response) => {
    try {
        //clearTimeout(gc);
        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {
            let path = path_get(platform, code, config.tracks.folder, config.tracks.format);
            if (!fs.existsSync(config.tracks.folder)) fs.mkdirSync(config.tracks.folder)
            if (fs.existsSync(path)) {
                res.sendFile(path, {root: "./"}, (err) => {
                    //gc = setTimeout(removeOldTracks, 5000);
                });
            } else {
                res.status(404).send("not found");
            }
        } else {
            res.status(500).send("Error");
        }
    } catch (exc) {
        res.status(500).send("Error");
    }
});

export default router;