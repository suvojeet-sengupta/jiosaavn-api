import { AlbumController, ArtistController, SearchController, SongController } from '#modules/index'
import { PlaylistController } from '#modules/playlists/playlist.controller'
import { App } from './app'

const app = new App([
  new SearchController(),
  new SongController(),
  new AlbumController(),
  new ArtistController(),
  new PlaylistController()
]).getApp()

export default app
