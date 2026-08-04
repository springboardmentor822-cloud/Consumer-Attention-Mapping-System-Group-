import re

def is_valid_stream_url(url: str) -> bool:
    """
    Validates if a URL is a valid RTSP, HTTP, or HTTPS stream URL.
    """
    if not url:
        return False
    pattern = r"^(rtsp|http|https)://[^\s/$.?#].[^\s]*$"
    return bool(re.match(pattern, url, re.IGNORECASE))
