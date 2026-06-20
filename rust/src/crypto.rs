use base64::{engine::general_purpose::STANDARD, Engine};
use des::cipher::{generic_array::GenericArray, BlockDecrypt, KeyInit};
use des::Des;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadLink {
    pub quality: String,
    pub url: String,
}

pub fn decrypt_media_url(encrypted_url: &str) -> Result<String, String> {
    if encrypted_url.is_empty() {
        return Ok(String::new());
    }

    // 1. Decode base64
    let encrypted_bytes = STANDARD
        .decode(encrypted_url.trim())
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    if encrypted_bytes.len() % 8 != 0 {
        return Err("Encrypted data length must be a multiple of 8 bytes".to_string());
    }

    // 2. Initialize DES cipher with key "38346591"
    let key = b"38346591";
    let des = Des::new_from_slice(key).map_err(|e| format!("DES init error: {}", e))?;

    let mut decrypted_bytes = encrypted_bytes.clone();

    // 3. Decrypt block by block (ECB mode)
    for chunk in decrypted_bytes.chunks_exact_mut(8) {
        let block = GenericArray::from_mut_slice(chunk);
        des.decrypt_block(block);
    }

    // 4. Remove PKCS7 padding
    if let Some(&last_byte) = decrypted_bytes.last() {
        let padding_len = last_byte as usize;
        if padding_len > 0 && padding_len <= 8 {
            let mut is_padding = true;
            for &byte in &decrypted_bytes[decrypted_bytes.len() - padding_len..] {
                if byte != last_byte {
                    is_padding = false;
                    break;
                }
            }
            if is_padding {
                decrypted_bytes.truncate(decrypted_bytes.len() - padding_len);
            }
        }
    }

    // 5. Convert to String
    String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("UTF-8 conversion error: {}", e))
}

pub fn create_download_links(encrypted_url: &str) -> Vec<DownloadLink> {
    let decrypted = match decrypt_media_url(encrypted_url) {
        Ok(url) => url,
        Err(_) => return Vec::new(),
    };

    if decrypted.is_empty() {
        return Vec::new();
    }

    let qualities = [
        ("_12", "12kbps"),
        ("_48", "48kbps"),
        ("_96", "96kbps"),
        ("_160", "160kbps"),
        ("_320", "320kbps"),
    ];

    qualities
        .iter()
        .map(|(suffix, bitrate)| {
            // Replace quality suffixes like _96.mp4 / _96.m4a with the desired suffix
            // We can do this with simple replace logic matching _12, _48, _96, _160, _320
            let url = if decrypted.contains("_96") {
                decrypted.replace("_96", suffix)
            } else {
                decrypted.clone()
            };
            DownloadLink {
                quality: bitrate.to_string(),
                url,
            }
        })
        .collect()
}

pub fn create_image_links(url: &str) -> Vec<DownloadLink> {
    if url.is_empty() {
        return Vec::new();
    }

    // Clean up http protocol to https
    let secure_url = if url.starts_with("http://") {
        url.replacen("http://", "https://", 1)
    } else {
        url.to_string()
    };

    let qualities = ["50x50", "150x150", "500x500"];
    qualities
        .iter()
        .map(|quality| {
            let formatted_url = if secure_url.contains("150x150") {
                secure_url.replace("150x150", quality)
            } else if secure_url.contains("50x50") {
                secure_url.replace("50x50", quality)
            } else {
                secure_url.clone()
            };
            DownloadLink {
                quality: quality.to_string(),
                url: formatted_url,
            }
        })
        .collect()
}
