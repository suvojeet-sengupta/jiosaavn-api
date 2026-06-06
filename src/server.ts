import {
  AlbumController,
  ArtistController,
  BrowseController,
  PlaylistController,
  ResolveController,
  SearchController,
  SongController
} from '#modules/index'
import { App } from './app'

const app = new App([
  new SearchController(),
  new SongController(),
  new AlbumController(),
  new ArtistController(),
  new PlaylistController(),
  new BrowseController(),
  new ResolveController()
]).getApp()

export default app
