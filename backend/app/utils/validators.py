import re

def is_valid_stream_url(url: str) -> bool:
    """
    Validates if a URL is a valid RTSP, HTTP, or HTTPS stream URL or a local file path.
    """
    if not url:
        return False
    if url.endswith(".mp4") or "datasets/" in url:
        return True
    pattern = r"^(rtsp|http|https)://[^\s/$.?#].[^\s]*$"
    return bool(re.match(pattern, url, re.IGNORECASE))
