import requests

url = "https://www.jiosaavn.com/api.php"
params = {
    "__call": "search.getResults",
    "_format": "json",
    "_marker": "0",
    "api_version": "4",
    "ctx": "web6dot0",
    "q": "tum hi ho",
    "p": "1",
    "n": "20"
}
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
}

resp = requests.get(url, params=params, headers=headers)
print(resp.text[:500])
