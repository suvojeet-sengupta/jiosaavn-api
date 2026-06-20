mod api;
mod crypto;
mod handlers;
mod models;

use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    // 1. Initialize tracer logging
    tracing_subscriber::fmt::init();

    // 2. Setup CORS
    let cors = CorsLayer::permissive();

    // 3. Define routes
    let app = Router::new()
        // API Base Info
        .route("/", get(home_handler))
        // API Endpoints
        .route("/api/search", get(handlers::search_all))
        .route("/api/search/songs", get(handlers::search_songs))
        .route("/api/search/artists", get(handlers::search_artists))
        .route("/api/search/albums", get(handlers::search_albums))
        .route("/api/search/playlists", get(handlers::search_playlists))
        .route("/api/songs", get(handlers::get_songs))
        .route("/api/songs/:id", get(handlers::get_song_by_id))
        .route("/api/songs/:id/suggestions", get(handlers::get_song_suggestions))
        .route("/api/songs/:id/lyrics", get(handlers::get_song_lyrics))
        .route("/api/albums", get(handlers::get_album_details))
        .route("/api/playlists", get(handlers::get_playlist_details))
        .route("/api/artists/:id", get(handlers::get_artist_details))
        // Middlewares
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .fallback(not_found_handler);

    // 4. Bind and start Axum server
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Started Rust server: http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn home_handler() -> impl IntoResponse {
    (
        StatusCode::OK,
        [("Content-Type", "application/json")],
        r#"{"success":true,"message":"Welcome to JioSaavn API in Rust! Check out docs at https://hqaudio.suvojeetsengupta.in/docs"}"#,
    )
}

async fn not_found_handler() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        [("Content-Type", "application/json")],
        r#"{"success":false,"message":"Route not found, check docs at https://hqaudio.suvojeetsengupta.in/docs"}"#,
    )
}
