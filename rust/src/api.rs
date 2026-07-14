use once_cell::sync::Lazy;
use rand::seq::SliceRandom;
use reqwest::Client;
use serde_json::Value;
use bb8_redis::{bb8, RedisConnectionManager};
use redis::AsyncCommands;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{Mutex, OnceCell};

pub type RedisPool = bb8::Pool<RedisConnectionManager>;
pub static REDIS_POOL: tokio::sync::OnceCell<RedisPool> = tokio::sync::OnceCell::const_new();

struct ClientIdentity {
    user_agent: &'static str,
    sec_ch_ua: &'static str,
    sec_ch_ua_mobile: &'static str,
    sec_ch_ua_platform: &'static str,
}

// 1. Client Identity List (User Agents + Client Hints)
static CLIENT_IDENTITIES: &[ClientIdentity] = &[
    ClientIdentity {
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        sec_ch_ua: "\"Google Chrome\";v=\"149\", \"Chromium\";v=\"149\", \"Not.A/Brand\";v=\"24\"",
        sec_ch_ua_mobile: "?0",
        sec_ch_ua_platform: "\"Windows\"",
    },
    ClientIdentity {
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        sec_ch_ua: "\"Google Chrome\";v=\"149\", \"Chromium\";v=\"149\", \"Not.A/Brand\";v=\"24\"",
        sec_ch_ua_mobile: "?0",
        sec_ch_ua_platform: "\"macOS\"",
    },
    ClientIdentity {
        user_agent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
        sec_ch_ua: "\"Google Chrome\";v=\"149\", \"Chromium\";v=\"149\", \"Not.A/Brand\";v=\"24\"",
        sec_ch_ua_mobile: "?1",
        sec_ch_ua_platform: "\"Android\"",
    },
    ClientIdentity {
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0",
        sec_ch_ua: "",
        sec_ch_ua_mobile: "?0",
        sec_ch_ua_platform: "\"Windows\"",
    },
    ClientIdentity {
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15",
        sec_ch_ua: "",
        sec_ch_ua_mobile: "?0",
        sec_ch_ua_platform: "\"macOS\"",
    },
    ClientIdentity {
        user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1",
        sec_ch_ua: "",
        sec_ch_ua_mobile: "?1",
        sec_ch_ua_platform: "\"iOS\"",
    },
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

use std::sync::atomic::{AtomicUsize, AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static CONSECUTIVE_ERRORS: AtomicUsize = AtomicUsize::new(0);
static CIRCUIT_OPEN_UNTIL: AtomicU64 = AtomicU64::new(0);

// Request coalescing: deduplicate in-flight requests for same cache key
type FlightCache = Mutex<HashMap<String, Arc<OnceCell<Result<Value, String>>>>>;

static FLIGHT_CACHE: Lazy<FlightCache> = Lazy::new(|| Mutex::new(HashMap::new()));

pub async fn use_fetch(
    endpoint: &str,
    params: HashMap<String, String>,
    context: Option<&str>,
) -> Result<Value, String> {
    // 1. Check Circuit Breaker
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let open_until = CIRCUIT_OPEN_UNTIL.load(Ordering::Relaxed);
    if now < open_until {
        let _ = crate::LOG_CHANNEL.send(format!("[CIRCUIT BREAKER] Rejecting request to HqAudio for {}s", open_until - now));
        return Err("HqAudio API is currently unreachable. Circuit breaker is OPEN.".to_string());
    }

    let mut url = url::Url::parse("https://www.hqaudio.com/api.php").unwrap();
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

    // Random Client Identity
    let identity = CLIENT_IDENTITIES
        .choose(&mut rand::thread_rng())
        .unwrap_or(&CLIENT_IDENTITIES[0]);

    let _ = crate::LOG_CHANNEL.send(format!("[CACHE MISS] Fetching upstream from HqAudio for: {}", cache_key));

    // Request coalescing: check if there's already an in-flight request for this key
    let flight_cell = {
        let mut flight_cache = FLIGHT_CACHE.lock().await;
        flight_cache
            .entry(cache_key.clone())
            .or_insert_with(|| Arc::new(OnceCell::new()))
            .clone()
    };

    // If another request already completed, return its result
    if let Some(result) = flight_cell.get() {
        let _ = crate::LOG_CHANNEL.send(format!("[FLIGHT HIT] Returning existing result for: {}", cache_key));
        return result.clone();
    }

    let fetch_start = Instant::now();
    
    // Build HTTP Request
    let mut req = CLIENT
        .get(url.as_str())
        .header("User-Agent", identity.user_agent)
        .header("Content-Type", "application/json");

    if !identity.sec_ch_ua.is_empty() {
        req = req.header("Sec-CH-UA", identity.sec_ch_ua);
    }
    if !identity.sec_ch_ua_mobile.is_empty() {
        req = req.header("Sec-CH-UA-Mobile", identity.sec_ch_ua_mobile);
    }
    if !identity.sec_ch_ua_platform.is_empty() {
        req = req.header("Sec-CH-UA-Platform", identity.sec_ch_ua_platform);
    }

    // Send HTTP Request
    let response = req.send().await;

    let response = match response {
        Ok(res) => {
            if !res.status().is_success() {
                let fails = CONSECUTIVE_ERRORS.fetch_add(1, Ordering::Relaxed) + 1;
                if fails >= 5 {
                    let next_open = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 60;
                    CIRCUIT_OPEN_UNTIL.store(next_open, Ordering::Relaxed);
                    let _ = crate::LOG_CHANNEL.send("[CIRCUIT BREAKER] Tripped OPEN due to 5 consecutive upstream errors".to_string());
                }
                let err = format!("HTTP request failed with status: {}", res.status());
                let _ = flight_cell.set(Err(err.clone()));
                return Err(err);
            }
            CONSECUTIVE_ERRORS.store(0, Ordering::Relaxed); // Reset on success
            res
        }
        Err(e) => {
            let fails = CONSECUTIVE_ERRORS.fetch_add(1, Ordering::Relaxed) + 1;
            if fails >= 5 {
                let next_open = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 60;
                CIRCUIT_OPEN_UNTIL.store(next_open, Ordering::Relaxed);
                let _ = crate::LOG_CHANNEL.send("[CIRCUIT BREAKER] Tripped OPEN due to network failure".to_string());
            }
            let err = format!("HTTP request failed: {}", e);
            let _ = flight_cell.set(Err(err.clone()));
            return Err(err);
        }
    };

    let data: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    let fetch_duration = fetch_start.elapsed().as_millis();
    let _ = crate::LOG_CHANNEL.send(format!("[UPSTREAM FETCH SUCCESS] Key: {} (Took {}ms)", cache_key, fetch_duration));

    // Store result in flight cache for other waiters
    let _ = flight_cell.set(Ok(data.clone()));

    // Cache the result in Redis
    if ttl > Duration::ZERO {
        if let Some(pool) = REDIS_POOL.get() {
            if let Ok(mut conn) = pool.get().await {
                if let Ok(data_str) = serde_json::to_string(&data) {
                    let _: Result<(), _> = conn.set_ex(&cache_key, data_str, ttl.as_secs()).await;
                }
            }
        }
    }

    // Remove from flight cache after a short delay to allow late waiters
    let cache_key_clone = cache_key.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(100)).await;
        let mut flight_cache = FLIGHT_CACHE.lock().await;
        flight_cache.remove(&cache_key_clone);
    });

    Ok(data)
}
