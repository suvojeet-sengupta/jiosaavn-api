mod api;
mod crypto;
mod handlers;
mod models;

use axum::{
    extract::Request,
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use chrono::{Duration, Local};
use once_cell::sync::Lazy;
use std::net::SocketAddr;
use std::time::Instant;
use tokio::fs::{create_dir_all, OpenOptions};
use tokio::io::AsyncWriteExt;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use bb8_redis::RedisConnectionManager;
use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};

#[tokio::main]
async fn main() {
    // Load environment variables from .env file
    let _ = dotenvy::dotenv();

    // 1. Initialize tracer logging
    tracing_subscriber::fmt::init();

    // 1.5 Initialize Redis Pool
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379/0".to_string());
    if let Ok(manager) = RedisConnectionManager::new(redis_url) {
        if let Ok(pool) = bb8_redis::bb8::Pool::builder().build(manager).await {
            let _ = api::REDIS_POOL.set(pool);
            println!("✅ Connected to Redis successfully");
        } else {
            eprintln!("⚠️ Failed to create Redis pool");
        }
    } else {
        eprintln!("⚠️ Invalid REDIS_URL");
    }

    // Start background log rotation cleanup
    tokio::spawn(clean_old_logs_task());

    // 2. Setup CORS
    let cors = CorsLayer::permissive();

    // 2.5 Setup Rate Limiter (2 req/sec, burst size of 10)
    let governor_conf = std::sync::Arc::new(
        GovernorConfigBuilder::default()
            .per_second(2)
            .burst_size(10)
            .finish()
            .unwrap(),
    );

    // 3. Define routes
    let dist_dir = if std::path::Path::new("./dist").exists() {
        "./dist".to_string()
    } else {
        "../frontend/dist".to_string()
    };

    let app = Router::new()
        // API Base Info
        .route("/", get(home_handler))
        // API Docs / Playground
        .nest_service(
            "/docs",
            tower_http::services::ServeDir::new(&dist_dir)
                .fallback(tower_http::services::ServeFile::new(format!("{}/index.html", dist_dir))),
        )
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
        // Logs UI & Viewer
        .route("/logs", get(handlers::logs_ui))
        .route("/api/logs/files", post(handlers::get_log_files))
        .route("/api/logs/view", post(handlers::view_log_file))
        .route("/api/logs/ws", get(handlers::logs_ws))
        .route("/api/logs/clear", post(handlers::clear_log_file))
        // Middlewares
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(GovernorLayer { config: governor_conf })
        .layer(middleware::from_fn(logging_middleware))
        .fallback(not_found_handler);

    // 4. Bind and start Axum server
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Started Rust server: http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
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

pub static LOG_BROADCAST: Lazy<tokio::sync::broadcast::Sender<String>> = Lazy::new(|| {
    let (tx, _) = tokio::sync::broadcast::channel(100);
    tx
});

pub static LOG_CHANNEL: Lazy<tokio::sync::mpsc::UnboundedSender<String>> = Lazy::new(|| {
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();
    
    tokio::spawn(async move {
        let log_dir = "logs";
        if let Err(e) = create_dir_all(log_dir).await {
            eprintln!("Failed to create logs directory: {}", e);
            return;
        }

        let mut current_date = String::new();
        let mut current_file: Option<tokio::io::BufWriter<tokio::fs::File>> = None;

        while let Some(raw_msg) = rx.recv().await {
            let now = Local::now();
            let timestamp = now.format("%Y-%m-%d %H:%M:%S").to_string();
            let date_str = now.format("%Y-%m-%d").to_string();
            
            let log_line = format!("[{}] {}", timestamp, raw_msg);
            
            // Print to stdout
            println!("{}", log_line);

            // If date changed, rotate file
            if date_str != current_date || current_file.is_none() {
                current_date = date_str.clone();
                let log_path = format!("{}/requests_{}.log", log_dir, current_date);
                
                // Flush and close previous file if it exists
                if let Some(mut file) = current_file.take() {
                    let _ = file.flush().await;
                }

                match OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&log_path)
                    .await
                {
                    Ok(file) => {
                        current_file = Some(tokio::io::BufWriter::new(file));
                    }
                    Err(e) => {
                        eprintln!("Failed to open log file {}: {}", log_path, e);
                    }
                }
            }

            if let Some(ref mut file) = current_file {
                let file_log_line = format!("{}\n", log_line);
                if let Err(e) = file.write_all(file_log_line.as_bytes()).await {
                    eprintln!("Failed to write request log: {}", e);
                }
                let _ = file.flush().await;
            }

            // Broadcast to all active WebSocket connections
            let _ = LOG_BROADCAST.send(log_line);
        }
    });
    
    tx
});

async fn logging_middleware(req: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = req.method().to_string();
    let uri = req.uri().to_string();
    
    // Smart Logging: Extract IP Address
    let ip = req
        .extensions()
        .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
        .map(|ci| ci.0.ip().to_string())
        .unwrap_or_else(|| "unknown".to_string());
    
    let response = next.run(req).await;
    
    // Smart Logging: Ignore /logs and /api/logs requests to avoid spamming our own logs
    if uri.starts_with("/logs") || uri.starts_with("/api/logs") {
        return response;
    }
    
    let duration = start.elapsed();
    let status = response.status().as_u16();
    
    // Add IP to the log format
    let log_line = format!("[IP: {}] {} {} {} {}ms", ip, method, uri, status, duration.as_millis());
    let _ = LOG_CHANNEL.send(log_line);
    
    response
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
