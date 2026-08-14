import logging
import sys
import json
from datetime import datetime


class StructuredFormatter(logging.Formatter):
    """
    JSON / Structured text formatter for application logging.
    Ensures passwords, tokens, and secrets are sanitized.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        
        # Sanitize any sensitive strings in message
        msg = log_obj["message"]
        for sensitive_key in ["password", "secret", "token", "authorization"]:
            if sensitive_key in msg.lower():
                log_obj["message"] = "[REDACTED SENSITIVE DATA]"
                
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_obj)


def setup_logging():
    logger = logging.getLogger("cams_platform")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
        
    return logger
