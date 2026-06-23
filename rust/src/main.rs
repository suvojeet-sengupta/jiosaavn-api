mod api;
mod crypto;
mod handlers;
mod models;

use axum::{
    extract::Request,
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use chrono::{Duration, Local};
use std::net::SocketAddr;
use std::time::Instant;
use tokio::fs::{create_dir_all, OpenOptions};
use tokio::io::AsyncWriteExt;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    // 1. Initialize tracer logging
    tracing_subscriber::fmt::init();

    // Start background log rotation cleanup
    tokio::spawn(clean_old_logs_task());

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
        .layer(middleware::from_fn(logging_middleware))
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

async fn logging_middleware(req: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = req.method().to_string();
    let uri = req.uri().to_string();
    
    let response = next.run(req).await;
    
    let duration = start.elapsed();
    let status = response.status().as_u16();
    
    log_request(method, uri, status, duration).await;
    
    response
}

async fn log_request(method: String, uri: String, status: u16, duration: std::time::Duration) {
    let now = Local::now();
    let date_str = now.format("%Y-%m-%d").to_string();
    let timestamp = now.format("%Y-%m-%d %H:%M:%S").to_string();
    
    let log_dir = "logs";
    let log_path = format!("{}/requests_{}.log", log_dir, date_str);
    
    if let Err(e) = create_dir_all(log_dir).await {
        eprintln!("Failed to create logs directory: {}", e);
        return;
    }
    
    let log_line = format!(
        "[{}] {} {} {} {}ms\n",
        timestamp,
        method,
        uri,
        status,
        duration.as_millis()
    );
    
    match OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .await
    {
        Ok(mut file) => {
            if let Err(e) = file.write_all(log_line.as_bytes()).await {
                eprintln!("Failed to write request log: {}", e);
            }
        }
        Err(e) => {
            eprintln!("Failed to open log file {}: {}", log_path, e);
        }
    }
}

async fn clean_old_logs_task() {
    loop {
        cleanup_old_logs().await;
        tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
    }
}

async fn cleanup_old_logs() {
    let now = Local::now();
    let today = now.format("%Y-%m-%d").to_string();
    let yesterday = (now - Duration::days(1)).format("%Y-%m-%d").to_string();
    
    let today_filename = format!("requests_{}.log", today);
    let yesterday_filename = format!("requests_{}.log", yesterday);
    
    let log_dir = "logs";
    if let Ok(mut entries) = tokio::fs::read_dir(log_dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    if file_name.starts_with("requests_") && file_name.ends_with(".log") {
                        if file_name != today_filename && file_name != yesterday_filename {
                            if let Err(e) = tokio::fs::remove_file(&path).await {
                                eprintln!("Failed to delete old log file {:?}: {}", path, e);
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_logging_and_cleanup() {
        let log_dir = "logs";
        let _ = create_dir_all(log_dir).await;
        
        let now = Local::now();
        let today = now.format("%Y-%m-%d").to_string();
        let yesterday = (now - Duration::days(1)).format("%Y-%m-%d").to_string();
        let two_days_ago = (now - Duration::days(2)).format("%Y-%m-%d").to_string();
        
        let path_today = format!("{}/requests_{}.log", log_dir, today);
        let path_yesterday = format!("{}/requests_{}.log", log_dir, yesterday);
        let path_two_days_ago = format!("{}/requests_{}.log", log_dir, two_days_ago);
        
        tokio::fs::write(&path_today, b"test today").await.unwrap();
        tokio::fs::write(&path_yesterday, b"test yesterday").await.unwrap();
        tokio::fs::write(&path_two_days_ago, b"test two days ago").await.unwrap();
        
        assert!(tokio::fs::metadata(&path_today).await.is_ok());
        assert!(tokio::fs::metadata(&path_yesterday).await.is_ok());
        assert!(tokio::fs::metadata(&path_two_days_ago).await.is_ok());
        
        cleanup_old_logs().await;
        
        assert!(tokio::fs::metadata(&path_today).await.is_ok());
        assert!(tokio::fs::metadata(&path_yesterday).await.is_ok());
        assert!(tokio::fs::metadata(&path_two_days_ago).await.is_err());
        
        let _ = tokio::fs::remove_file(&path_today).await;
        let _ = tokio::fs::remove_file(&path_yesterday).await;
    }
}
