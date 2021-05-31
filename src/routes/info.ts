// IMPORTS
import log from "../utils/log";
import {query_get} from "../utils/get";
import config from '../config.json';

import express from "express";

import ytdl from "ytdl-core";
import ytpl from "ytpl";
import fs from  'fs';

// ROUTING STUFF
let router: express.Router = express.Router();

//http://localhost:3001/music-downloader/info?t_plat=youtube&t_code=BhMC23ll2Rk
router.get("/info", async (req: express.Request, res: express.Response) => {
    try {
        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {
            
            let info, raw;
            if (platform in config.platforms && platform == "youtube") {
                let url = (config.platforms[platform] as string).replace("$", code);
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
            res.json({info, raw});

        } else {
            res.status(500).send("Unsupported platform");
        }
    } catch (exc) {
        res.status(500).send("Generic exception OR Unsupported platform");
    }
});

export default router;