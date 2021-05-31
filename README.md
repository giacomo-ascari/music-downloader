# music-downloader

## Project
Got bored, thinking about retiring in the mountains. With this I can save locally my favourite tracks.

## API
* GET music-downloader/info
  * Retrieves relevant information about that track
  * Parameters: `t_plat, t_code`
* GET music-downloader/tracks
  * Retrieves the track (helped by a cache)
  * Parameters: `t_plat, t_code`

## Supported platforms
* YouTube `example: music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ`

## Samples
[https://asky.hopto.org/music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ](https://asky.hopto.org/music-downloader/track?t_plat=youtube&t_code=dQw4w9WgXcQ)
