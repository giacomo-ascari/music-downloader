import express from "express";

function query_get (req: express.Request, field: string) {
    let content: string | undefined = req.query[field] as string | undefined;
    return content;
}

function header_get (req: express.Request, field: string) {
    let content: string | undefined = req.header(field) as string | undefined;
    return content;
}

function path_get(platform: string, code: string, folder: string, format: string) {
    let prefix = `${platform}=`;
    let path = `${folder}/${prefix}${code}.${format}`;
    return path;
}

export {query_get, header_get, path_get};