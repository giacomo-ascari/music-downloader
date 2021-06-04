# music-downloader

## Project
Got bored, thinking about retiring in the mountains. With this I can locally save my favourite tracks.

## API
* GET music-downloader/info
  * Retrieves relevant information about that track
  * Parameters: `t_plat, t_code`
* GET music-downloader/info-pl
  * Retrieves relevant information about the playlist
  * Parameters: `t_plat, t_code`
* GET music-downloader/retrieve
  * The server downloads and converts the track, sending 200 when finished.
  * Parameters: `t_plat, t_code`
* GET music-downloader/download
  * Download the tracks from the server (after the retrieve). Returns 404 if the tracks hasn't been retrieved.
  * Parameters: `t_plat, t_code`

## .ENV File
This thing needs an .env file in the root folder. I don't know what happens if you "npmrunserve" without the environment file, but please, don't get angry at me if it doesn't work.
```
BASE_URL="/XXXX"
PORT=XXXX
WORKERS_DEFAULT=XXXX
WORKER_FROM_CORES="XXXX"
SIZE_MB=XXXXX
FFMPEG_CMD="XXXX -i ?0 ?1"
```
Example (literally what I use):
```
BASE_URL="/music-downloader"
PORT=3001
WORKERS_DEFAULT=2
WORKER_FROM_CORES="true"
SIZE_MB=500
FFMPEG_CMD="C:/ffmpeg/bin/ffmpeg.exe -i ?0 ?1"
```

## Supported platforms
* YouTube `example: music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ`

## Samples
[https://asky.hopto.org/music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ](https://asky.hopto.org/music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ)
