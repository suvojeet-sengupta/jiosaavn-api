use once_cell::sync::Lazy;
use rand::seq::SliceRandom;
use reqwest::Client;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

// 1. User Agent List
static USER_AGENTS: &[&str] = &[
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/605.1.15",
];

// 2. In-Memory Cache
struct CacheEntry {
    data: Value,
    expiry: Instant,
}

static CACHE: Lazy<Mutex<HashMap<String, CacheEntry>>> = Lazy::new(|| Mutex::new(HashMap::new()));
static INSERT_COUNT: Lazy<Mutex<usize>> = Lazy::new(|| Mutex::new(0));

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
        "song.getDetails"
        | "webapi.get"
        | "autocomplete.get"
        | "search.getResults"
        | "search.getAlbumResults"
        | "search.getArtistResults"
        | "search.getPlaylistResults" => Duration::from_secs(30 * 60), // 30 mins
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
    let now = Instant::now();

    // Try cache lookup
    if ttl > Duration::ZERO {
        let mut cache = CACHE.lock().unwrap();
        if let Some(entry) = cache.get(&cache_key) {
            if now < entry.expiry {
                return Ok(entry.data.clone());
            } else {
                cache.remove(&cache_key);
            }
        }
    }

    // Lazy cleanup of cache
    {
        let mut count = INSERT_COUNT.lock().unwrap();
        *count += 1;
        if *count >= 100 {
            *count = 0;
            let mut cache = CACHE.lock().unwrap();
            cache.retain(|_, entry| now < entry.expiry);
        }
    }

    // Random User Agent
    let user_agent = USER_AGENTS
        .choose(&mut rand::thread_rng())
        .copied()
        .unwrap_or(USER_AGENTS[0]);

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

    // Cache the result
    if ttl > Duration::ZERO {
        let mut cache = CACHE.lock().unwrap();
        cache.insert(
            cache_key,
            CacheEntry {
                data: data.clone(),
                expiry: now + ttl,
            },
        );
    }

    Ok(data)
}
