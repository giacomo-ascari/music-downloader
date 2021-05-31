# music-downloader

## Project
Got bored, thinking about retiring in the mountains, where Internet connection might be nearly absent. With this, I can download my favorite music wherever I am, even with terrible bandiwth.

## API
* GET music-downloader/info
  * Retrieves relevant information about that track
  * Parameters: `t_plat, t_code`
* GET music-downloader/tracks
  * Retrieves the track (helped by a cache)
  * Parameters: `t_plat, t_code`

## Supported platforms
* YouTube `example: {t_plat:youtube, t_code:dQw4w9WgXcQ}`
