import requests

url = "https://www.jiosaavn.com/api.php"
params = {
    "__call": "song.getDetails",
    "_format": "json",
    "_marker": "0",
    "api_version": "4",
    "ctx": "web6dot0",
    "pids": "aRZbUYD7"
}
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
}

resp = requests.get(url, params=params, headers=headers)
data = resp.json()
print("Keys:", data.keys())
print("Type of songs:", type(data.get('songs')) if 'songs' in data else 'N/A')
print("Type of data directly:", type(data))
