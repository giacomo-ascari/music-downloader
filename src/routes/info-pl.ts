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

//http://localhost:3001/music-downloader/info-pl?t_plat=youtube&t_code=OLAK5uy_msYpWozx77tv-GPWGJFXG527BaSMqgTtY
router.get("/info-pl", async (req: express.Request, res: express.Response) => {
    try {
        let platform = query_get(req, config.req_attr.track_platform);
        let code = query_get(req, config.req_attr.track_code);
        if (platform && code) {
            
            let info, raw;
            if (platform in config.platforms && platform == "youtube") {
                raw = await ytpl(code);
                
                let items: Array<any> = [];
                raw.items.forEach(item => {
                    items.push({title: item.title, code: item.id, url: item.shortUrl})
                });
                info = {
                    title: raw.title,
                    count: raw.estimatedItemCount,
                    items: items
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