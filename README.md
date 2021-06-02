# music-downloader

## Project
Got bored, thinking about retiring in the mountains. With this I can locally save my favourite tracks.

## API
* GET music-downloader/info
  * Retrieves relevant information about that track
  * Parameters: `t_plat, t_code`
* GET music-downloader/tracks
  * Retrieves the track (helped by a cache)
  * Parameters: `t_plat, t_code`

## .ENV File
This thing needs an .env file in the root folder. I don't know what happens if you "npmrunserve" without the environment file, but please, don't get angry at me if it doesn't work.
```
BASE_URL="/XXXX"
PORT=XXXX
WORKERS_DEFAULT=XXXX
WORKER_FROM_CORES="XXXX"
SIZE_MB=XXXXX
FFMPEG_SPECIFY="XXXX"
FFMPEG_PATH="XXXX"
```
Example (literally what I use):
```
BASE_URL="/music-downloader"
PORT=3001
WORKERS_DEFAULT=2
WORKER_FROM_CORES="true"
SIZE_MB=500
FFMPEG_SPECIFY="true"
FFMPEG_PATH="C:/FFmpeg/bin/ffmpeg.exe"
```

## Supported platforms
* YouTube `example: music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ`

## Samples
[https://asky.hopto.org/music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ](https://asky.hopto.org/music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ)
