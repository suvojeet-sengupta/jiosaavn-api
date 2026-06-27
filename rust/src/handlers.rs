use crate::api::use_fetch;
use crate::crypto::{create_download_links, create_image_links, DownloadLink};
use crate::models::*;
use axum::{
    extract::{Path as AxumPath, Query},
    response::Html,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

// --- Helper Functions to Safely Extract Data from Raw Upstream JSON ---
fn str_val(v: &Value) -> String {
    v.as_str().unwrap_or("").to_string()
}

fn opt_str_val(v: &Value) -> Option<String> {
    v.as_str().map(|s| s.to_string()).filter(|s| !s.is_empty())
}

fn bool_val(v: &Value) -> bool {
    v.as_str() == Some("1")
        || v.as_str() == Some("true")
        || v.as_bool() == Some(true)
        || v.as_i64() == Some(1)
}

fn i64_val(v: &Value) -> Option<i64> {
    if let Some(s) = v.as_str() {
        s.parse::<i64>().ok()
    } else {
        v.as_i64()
    }
}

fn i32_val(v: &Value) -> i32 {
    if let Some(s) = v.as_str() {
        s.parse::<i32>().unwrap_or(0)
    } else {
        v.as_i64().unwrap_or(0) as i32
    }
}

// --- Parsers for Nested Structs ---
fn parse_artist_map(v: &Value) -> Artist {
    Artist {
        id: str_val(&v["id"]),
        name: str_val(&v["name"]),
        role: str_val(&v["role"]),
        r#type: str_val(&v["type"]),
        image: create_image_links(&str_val(&v["image"])),
        url: str_val(&v["perma_url"]),
    }
}

fn parse_song(v: &Value) -> Song {
    let more_info = &v["more_info"];
    let artist_map = &more_info["artistMap"];

    let primary = artist_map["primary_artists"]
        .as_array()
        .map(|arr| arr.iter().map(parse_artist_map).collect())
        .unwrap_or_default();
    let featured = artist_map["featured_artists"]
        .as_array()
        .map(|arr| arr.iter().map(parse_artist_map).collect())
        .unwrap_or_default();
    let all = artist_map["artists"]
        .as_array()
        .map(|arr| arr.iter().map(parse_artist_map).collect())
        .unwrap_or_default();

    Song {
        id: str_val(&v["id"]),
        name: str_val(&v["title"]),
        r#type: str_val(&v["type"]),
        year: opt_str_val(&v["year"]),
        release_date: opt_str_val(&more_info["release_date"]),
        duration: i64_val(&more_info["duration"]),
        label: opt_str_val(&more_info["label"]),
        explicit_content: bool_val(&v["explicit_content"]),
        play_count: i64_val(&v["play_count"]),
        language: str_val(&v["language"]),
        has_lyrics: bool_val(&more_info["has_lyrics"]),
        lyrics_id: opt_str_val(&more_info["lyrics_id"]),
        url: str_val(&v["perma_url"]),
        copyright: opt_str_val(&more_info["copyright_text"]),
        album: AlbumInfo {
            id: opt_str_val(&more_info["album_id"]),
            name: opt_str_val(&more_info["album"]),
            url: opt_str_val(&more_info["album_url"]),
        },
        artists: ArtistGroup { primary, featured, all },
        image: create_image_links(&str_val(&v["image"])),
        download_url: create_download_links(&str_val(&more_info["encrypted_media_url"])),
    }
}

fn parse_artist(v: &Value) -> Artist {
    Artist {
        id: str_val(&v["id"]),
        name: str_val(&v["title"]),
        role: str_val(&v["role"]),
        r#type: str_val(&v["type"]),
        image: create_image_links(&str_val(&v["image"])),
        url: str_val(&v["perma_url"]),
    }
}

fn parse_album(v: &Value) -> Album {
    Album {
        id: str_val(&v["id"]),
        name: str_val(&v["title"]),
        year: opt_str_val(&v["year"]),
        url: str_val(&v["perma_url"]),
        image: create_image_links(&str_val(&v["image"])),
    }
}

fn parse_playlist(v: &Value) -> Playlist {
    Playlist {
        id: str_val(&v["id"]),
        name: if !str_val(&v["title"]).is_empty() {
            str_val(&v["title"])
        } else if !str_val(&v["listname"]).is_empty() {
            str_val(&v["listname"])
        } else {
            str_val(&v["name"])
        },
        url: if !str_val(&v["perma_url"]).is_empty() {
            str_val(&v["perma_url"])
        } else {
            str_val(&v["url"])
        },
        image: create_image_links(&str_val(&v["image"])),
    }
}

// --- Handler Logic ---

#[derive(Deserialize)]
pub struct SongsQuery {
    pub ids: Option<String>,
    pub link: Option<String>,
}

pub async fn get_songs(
    Query(query): Query<SongsQuery>,
) -> Result<Json<ApiResponse<Vec<Song>>>, AppError> {
    if query.ids.is_none() && query.link.is_none() {
        return Err(AppError::BadRequest("Either 'ids' or 'link' query parameter is required".to_string()));
    }

    let mut params = HashMap::new();
    let endpoint = if let Some(link) = query.link {
        // extract link token
        let token = link
            .split("jiosaavn.com/song/")
            .nth(1)
            .and_then(|s| s.split('/').nth(1))
            .and_then(|s| s.split('?').next())
            .ok_or_else(|| AppError::BadRequest("Invalid JioSaavn song link".to_string()))?;
        params.insert("token".to_string(), token.to_string());
        params.insert("type".to_string(), "song".to_string());
        "webapi.get"
    } else {
        params.insert("pids".to_string(), query.ids.unwrap());
        "song.getDetails"
    };

    let raw = use_fetch(endpoint, params, None).await?;

    let songs_list = if endpoint == "webapi.get" {
        // webapi.get returns a wrapper or a song detail list inside a structured object
        raw["songs"]
            .as_array()
            .map(|arr| arr.iter().map(parse_song).collect::<Vec<Song>>())
            .unwrap_or_else(|| {
                // If it's a direct array response
                raw.as_array()
                    .map(|arr| arr.iter().map(parse_song).collect::<Vec<Song>>())
                    .unwrap_or_default()
            })
    } else {
        // song.getDetails returns {"songs": [...]} or just [...]
        raw["songs"]
            .as_array()
            .map(|arr| arr.iter().map(parse_song).collect::<Vec<Song>>())
            .unwrap_or_else(|| {
                raw.as_array()
                    .map(|arr| arr.iter().map(parse_song).collect::<Vec<Song>>())
                    .unwrap_or_default()
            })
    };

    if songs_list.is_empty() {
        return Err(AppError::NotFound("Song not found".to_string()));
    }

    Ok(Json(ApiResponse { success: true, data: songs_list }))
}

pub async fn get_song_by_id(
    AxumPath(id): AxumPath<String>,
) -> Result<Json<ApiResponse<Vec<Song>>>, AppError> {
    let mut params = HashMap::new();
    params.insert("pids".to_string(), id);

    let raw = use_fetch("song.getDetails", params, None).await?;
    let songs: Vec<Song> = raw["songs"]
        .as_array()
        .map(|arr| arr.iter().map(parse_song).collect())
        .unwrap_or_else(|| {
            raw.as_array()
                .map(|arr| arr.iter().map(parse_song).collect())
                .unwrap_or_default()
        });

    if songs.is_empty() {
        return Err(AppError::NotFound("Song not found".to_string()));
    }

    Ok(Json(ApiResponse { success: true, data: songs }))
}

#[derive(Deserialize)]
pub struct SuggestionsQuery {
    pub limit: Option<String>,
}

pub async fn get_song_suggestions(
    AxumPath(id): AxumPath<String>,
    Query(query): Query<SuggestionsQuery>,
) -> Result<Json<ApiResponse<Vec<Song>>>, AppError> {
    let limit = query.limit.unwrap_or_else(|| "10".to_string());
    
    // First, we need to create an entity station
    let mut station_params = HashMap::new();
    station_params.insert("entity_id".to_string(), id);
    station_params.insert("entity_type".to_string(), "queue".to_string());
    
    let station_raw = use_fetch("webradio.createEntityStation", station_params, None).await?;
    let station_id = station_raw["stationid"].as_str().ok_or_else(|| AppError::Internal("Failed to create station".to_string()))?;

    // Now, get songs from the station
    let mut radio_params = HashMap::new();
    radio_params.insert("stationid".to_string(), station_id.to_string());
    radio_params.insert("k".to_string(), limit);

    let raw = use_fetch("webradio.getSong", radio_params, None).await?;
    
    // suggestions return list of items with details
    let mut songs = Vec::new();
    if let Some(arr) = raw.as_array() {
        for item in arr {
            if let Some(song_val) = item.get("song") {
                songs.push(parse_song(song_val));
            }
        }
    }

    Ok(Json(ApiResponse { success: true, data: songs }))
}

pub async fn get_song_lyrics(
    AxumPath(id): AxumPath<String>,
) -> Result<Json<ApiResponse<Lyrics>>, AppError> {
    let mut params = HashMap::new();
    params.insert("lyrics_id".to_string(), id);

    let raw = use_fetch("lyrics.getLyrics", params, None).await?;
    let lyrics = raw["lyrics"].as_str().ok_or_else(|| AppError::NotFound("Lyrics not found".to_string()))?;

    Ok(Json(ApiResponse {
        success: true,
        data: Lyrics {
            lyrics: lyrics.to_string(),
            copyright: opt_str_val(&raw["copyright"]),
            snippet: opt_str_val(&raw["snippet"]),
        },
    }))
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub query: String,
}

fn parse_category<T>(cat: &Value, mapper: impl Fn(&Value) -> T) -> SearchResultCategory<T> {
    SearchResultCategory {
        results: cat["data"]
            .as_array()
            .map(|arr| arr.iter().map(|item| mapper(item)).collect())
            .unwrap_or_default(),
        position: i32_val(&cat["position"]),
    }
}

pub async fn search_all(
    Query(query): Query<SearchQuery>,
) -> Result<Json<ApiResponse<SearchResponse>>, AppError> {
    let mut params = HashMap::new();
    params.insert("query".to_string(), query.query);

    let raw = use_fetch("autocomplete.get", params, None).await?;

    let map_song = |v: &Value| SongSearchItem {
        id: str_val(&v["id"]),
        title: str_val(&v["title"]),
        image: create_image_links(&str_val(&v["image"])),
        album: str_val(&v["album"]),
        url: str_val(&v["url"]),
        r#type: str_val(&v["type"]),
        description: str_val(&v["description"]),
        primary_artists: str_val(&v["more_info"]["primary_artists"]),
        singers: str_val(&v["more_info"]["singers"]),
        language: str_val(&v["more_info"]["language"]),
    };

    let map_album = |v: &Value| AlbumSearchItem {
        id: str_val(&v["id"]),
        title: str_val(&v["title"]),
        image: create_image_links(&str_val(&v["image"])),
        artist: str_val(&v["music"]),
        url: str_val(&v["url"]),
        r#type: str_val(&v["type"]),
        description: str_val(&v["description"]),
        year: str_val(&v["more_info"]["year"]),
        language: str_val(&v["more_info"]["language"]),
        song_ids: str_val(&v["more_info"]["song_pids"]),
    };

    let map_artist = |v: &Value| ArtistSearchItem {
        id: str_val(&v["id"]),
        title: str_val(&v["title"]),
        image: create_image_links(&str_val(&v["image"])),
        r#type: str_val(&v["type"]),
        description: str_val(&v["description"]),
        position: i32_val(&v["position"]),
    };

    let map_playlist = |v: &Value| PlaylistSearchItem {
        id: str_val(&v["id"]),
        title: str_val(&v["title"]),
        image: create_image_links(&str_val(&v["image"])),
        url: str_val(&v["url"]),
        language: str_val(&v["more_info"]["language"]),
        r#type: str_val(&v["type"]),
        description: str_val(&v["description"]),
    };

    Ok(Json(ApiResponse {
        success: true,
        data: SearchResponse {
            albums: parse_category(&raw["albums"], map_album),
            songs: parse_category(&raw["songs"], map_song),
            artists: parse_category(&raw["artists"], map_artist),
            playlists: parse_category(&raw["playlists"], map_playlist),
            top_query: parse_category(&raw["topquery"], map_song),
        },
    }))
}

#[derive(Deserialize)]
pub struct CategorySearchQuery {
    pub query: String,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

pub async fn search_songs(
    Query(query): Query<CategorySearchQuery>,
) -> Result<Json<ApiResponse<SearchResultCategory<Song>>>, AppError> {
    let mut params = HashMap::new();
    params.insert("p".to_string(), query.page.unwrap_or(1).to_string());
    params.insert("n".to_string(), query.limit.unwrap_or(20).to_string());
    params.insert("q".to_string(), query.query);

    let raw = use_fetch("search.getResults", params, None).await?;
    let results = raw["results"]
        .as_array()
        .map(|arr| arr.iter().map(parse_song).collect())
        .unwrap_or_default();

    Ok(Json(ApiResponse {
        success: true,
        data: SearchResultCategory { results, position: 1 },
    }))
}

pub async fn search_artists(
    Query(query): Query<CategorySearchQuery>,
) -> Result<Json<ApiResponse<SearchResultCategory<Artist>>>, AppError> {
    let mut params = HashMap::new();
    params.insert("p".to_string(), query.page.unwrap_or(1).to_string());
    params.insert("n".to_string(), query.limit.unwrap_or(20).to_string());
    params.insert("q".to_string(), query.query);

    let raw = use_fetch("search.getArtistResults", params, None).await?;
    let results = raw["results"]
        .as_array()
        .map(|arr| arr.iter().map(parse_artist).collect())
        .unwrap_or_default();

    Ok(Json(ApiResponse {
        success: true,
        data: SearchResultCategory { results, position: 1 },
    }))
}

#[derive(Deserialize)]
pub struct IdQuery {
    pub id: String,
}

pub async fn get_album_details(
    Query(query): Query<IdQuery>,
) -> Result<Json<ApiResponse<Vec<Song>>>, AppError> {
    let mut params = HashMap::new();
    params.insert("albumid".to_string(), query.id);

    let raw = use_fetch("content.getAlbumDetails", params, None).await?;
    let songs = raw["songs"]
        .as_array()
        .map(|arr| arr.iter().map(parse_song).collect())
        .unwrap_or_default();

    Ok(Json(ApiResponse { success: true, data: songs }))
}

pub async fn get_playlist_details(
    Query(query): Query<IdQuery>,
) -> Result<Json<ApiResponse<SearchResultCategory<Song>>>, AppError> {
    let mut params = HashMap::new();
    params.insert("listid".to_string(), query.id);

    let raw = use_fetch("playlist.getDetails", params, None).await?;
    let results = raw["list"]
        .as_array()
        .map(|arr| arr.iter().map(parse_song).collect())
        .unwrap_or_default();

    Ok(Json(ApiResponse {
        success: true,
        data: SearchResultCategory { results, position: 1 },
    }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtistQuery {
    pub page: Option<i32>,
    pub song_count: Option<i32>,
    pub album_count: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtistDetail {
    pub id: String,
    pub name: String,
    pub fan_count: Option<String>,
    pub wiki: Option<String>,
    pub image: Vec<DownloadLink>,
    pub top_songs: Vec<Song>,
    pub top_albums: Vec<Album>,
}

pub async fn get_artist_details(
    AxumPath(id): AxumPath<String>,
    Query(query): Query<ArtistQuery>,
) -> Result<Json<ApiResponse<ArtistDetail>>, AppError> {
    let mut params = HashMap::new();
    params.insert("artistId".to_string(), id);
    params.insert("page".to_string(), query.page.unwrap_or(1).to_string());
    params.insert("song_count".to_string(), query.song_count.unwrap_or(20).to_string());
    params.insert("album_count".to_string(), query.album_count.unwrap_or(20).to_string());

    let raw = use_fetch("artist.getArtistPageDetails", params, None).await?;

    let top_songs = raw["topSongs"]
        .as_array()
        .map(|arr| arr.iter().map(parse_song).collect())
        .unwrap_or_default();

    let top_albums = raw["topAlbums"]
        .as_array()
        .map(|arr| arr.iter().map(parse_album).collect())
        .unwrap_or_default();

    Ok(Json(ApiResponse {
        success: true,
        data: ArtistDetail {
            id: str_val(&raw["artistId"]),
            name: str_val(&raw["name"]),
            fan_count: opt_str_val(&raw["fan_count"]),
            wiki: opt_str_val(&raw["wiki"]),
            image: create_image_links(&str_val(&raw["image"])),
            top_songs,
            top_albums,
        },
    }))
}

pub async fn search_albums(
    Query(query): Query<CategorySearchQuery>,
) -> Result<Json<ApiResponse<SearchResultCategory<Album>>>, AppError> {
    let mut params = HashMap::new();
    params.insert("p".to_string(), query.page.unwrap_or(1).to_string());
    params.insert("n".to_string(), query.limit.unwrap_or(20).to_string());
    params.insert("q".to_string(), query.query);

    let raw = use_fetch("search.getAlbumResults", params, None).await?;
    let results = raw["results"]
        .as_array()
        .map(|arr| arr.iter().map(parse_album).collect())
        .unwrap_or_default();

    Ok(Json(ApiResponse {
        success: true,
        data: SearchResultCategory { results, position: 1 },
    }))
}

pub async fn search_playlists(
    Query(query): Query<CategorySearchQuery>,
) -> Result<Json<ApiResponse<SearchResultCategory<Playlist>>>, AppError> {
    let mut params = HashMap::new();
    params.insert("p".to_string(), query.page.unwrap_or(1).to_string());
    params.insert("n".to_string(), query.limit.unwrap_or(20).to_string());
    params.insert("q".to_string(), query.query);

    let raw = use_fetch("search.getPlaylistResults", params, None).await?;
    let results = raw["results"]
        .as_array()
        .map(|arr| arr.iter().map(parse_playlist).collect())
        .unwrap_or_default();

    Ok(Json(ApiResponse {
        success: true,
        data: SearchResultCategory { results, position: 1 },
    }))
}

// --- Logs UI and API Handlers ---

pub async fn logs_ui() -> Html<&'static str> {
    Html(include_str!("logs.html"))
}

#[derive(Deserialize)]
pub struct LogsAuthPayload {
    pub password: String,
}

pub async fn get_log_files(
    Json(payload): Json<LogsAuthPayload>,
) -> Result<Json<ApiResponse<Vec<String>>>, AppError> {
    // 1. Verify password
    let correct_password = std::env::var("LOGS_PASSWORD").unwrap_or_else(|_| "admin123".to_string());
    if payload.password != correct_password {
        return Err(AppError::BadRequest("Unauthorized: Incorrect password".to_string()));
    }

    // 2. Read logs directory
    let log_dir = "logs";
    let mut files = Vec::new();
    if let Ok(entries) = std::fs::read_dir(log_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    if file_name.starts_with("requests_") && file_name.ends_with(".log") {
                        files.push(file_name.to_string());
                    }
                }
            }
        }
    }

    // Sort files in reverse order (newest first)
    files.sort_by(|a, b| b.cmp(a));

    Ok(Json(ApiResponse {
        success: true,
        data: files,
    }))
}

#[derive(Deserialize)]
pub struct ViewLogPayload {
    pub password: String,
    pub file_name: String,
}

pub async fn view_log_file(
    Json(payload): Json<ViewLogPayload>,
) -> Result<Json<ApiResponse<String>>, AppError> {
    // 1. Verify password
    let correct_password = std::env::var("LOGS_PASSWORD").unwrap_or_else(|_| "admin123".to_string());
    if payload.password != correct_password {
        return Err(AppError::BadRequest("Unauthorized: Incorrect password".to_string()));
    }

    // 2. Prevent directory traversal (sanitize file_name)
    let file_name = payload.file_name;
    if !file_name.starts_with("requests_") || !file_name.ends_with(".log") || file_name.contains('/') || file_name.contains('\\') || file_name.contains("..") {
        return Err(AppError::BadRequest("Invalid log file name".to_string()));
    }

    // 3. Read file
    let path = format!("logs/{}", file_name);
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(Json(ApiResponse {
            success: true,
            data: content,
        })),
        Err(e) => Err(AppError::NotFound(format!("Log file not found or unreadable: {}", e))),
    }
}

