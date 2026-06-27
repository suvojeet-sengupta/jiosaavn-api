use once_cell::sync::Lazy;
use rand::seq::SliceRandom;
use reqwest::Client;
use serde_json::Value;
use bb8_redis::{bb8, RedisConnectionManager};
use redis::AsyncCommands;
use std::collections::HashMap;
use std::time::{Duration, Instant};

pub type RedisPool = bb8::Pool<RedisConnectionManager>;
pub static REDIS_POOL: tokio::sync::OnceCell<RedisPool> = tokio::sync::OnceCell::const_new();

// 1. User Agent List
static USER_AGENTS: &[&str] = &[
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/605.1.15",
];

// Client Instance
static CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .unwrap()
});

fn get_ttl(endpoint: &str) -> Duration {
    match endpoint {
        "lyrics.getLyrics" => Duration::from_secs(12 * 3600), // 12 hours
        "content.getAlbumDetails"
        | "playlist.getDetails"
        | "artist.getArtistPageDetails"
        | "artist.getArtistMoreSong"
        | "artist.getArtistMoreAlbum" => Duration::from_secs(6 * 3600), // 6 hours
        "autocomplete.get"
        | "search.getResults"
        | "search.getAlbumResults"
        | "search.getArtistResults"
        | "search.getPlaylistResults" => Duration::from_secs(3600), // 1 hour
        "song.getDetails"
        | "webapi.get" => Duration::from_secs(30 * 60), // 30 mins
        "webradio.getSong" => Duration::from_secs(5 * 60),            // 5 mins
        _ => Duration::ZERO,                                          // No cache
    }
}

pub async fn use_fetch(
    endpoint: &str,
    params: HashMap<String, String>,
    context: Option<&str>,
) -> Result<Value, String> {
    let mut url = url::Url::parse("https://www.jiosaavn.com/api.php").unwrap();
    {
        let mut query = url.query_pairs_mut();
        query.append_pair("__call", endpoint);
        query.append_pair("_format", "json");
        query.append_pair("_marker", "0");
        query.append_pair("api_version", "4");
        query.append_pair("ctx", context.unwrap_or("web6dot0"));

        for (k, v) in &params {
            query.append_pair(k, v);
        }
    }

    let cache_key = format!("{}:{}", endpoint, url.query().unwrap_or(""));
    let ttl = get_ttl(endpoint);
    // Try cache lookup
    if ttl > Duration::ZERO {
        if let Some(pool) = REDIS_POOL.get() {
            if let Ok(mut conn) = pool.get().await {
                let cached_data: Result<String, _> = conn.get(&cache_key).await;
                if let Ok(data_str) = cached_data {
                    if let Ok(parsed) = serde_json::from_str(&data_str) {
                        let _ = crate::LOG_CHANNEL.send(format!("[CACHE HIT] Key: {}", cache_key));
                        return Ok(parsed);
                    }
                }
            }
        }
    }

    // Random User Agent
    let user_agent = USER_AGENTS
        .choose(&mut rand::thread_rng())
        .copied()
        .unwrap_or(USER_AGENTS[0]);

    let _ = crate::LOG_CHANNEL.send(format!("[CACHE MISS] Fetching upstream from JioSaavn for: {}", cache_key));

    let fetch_start = Instant::now();
    // Send HTTP Request
    let response = CLIENT
        .get(url.as_str())
        .header("User-Agent", user_agent)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP request failed with status: {}", response.status()));
    }

    let data: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    let fetch_duration = fetch_start.elapsed().as_millis();
    let _ = crate::LOG_CHANNEL.send(format!("[UPSTREAM FETCH SUCCESS] Key: {} (Took {}ms)", cache_key, fetch_duration));

    // Cache the result
    if ttl > Duration::ZERO {
        if let Some(pool) = REDIS_POOL.get() {
            if let Ok(mut conn) = pool.get().await {
                if let Ok(data_str) = serde_json::to_string(&data) {
                    let _: Result<(), _> = conn.set_ex(&cache_key, data_str, ttl.as_secs()).await;
                }
            }
        }
    }

    Ok(data)
}
