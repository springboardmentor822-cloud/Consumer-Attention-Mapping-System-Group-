import enum


class RoleEnum(str, enum.Enum):
    ADMINISTRATOR = "administrator"
    STORE_MANAGER = "store_manager"
    RETAIL_ANALYST = "retail_analyst"
    MARKETING_MANAGER = "marketing_manager"


class CameraTypeEnum(str, enum.Enum):
    CCTV = "cctv"
    WEBCAM = "webcam"
    IP_CAMERA = "ip_camera"
    RTSP = "rtsp"
    UPLOADED_VIDEO = "uploaded_video"


class CameraStatusEnum(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"
    CONFIGURING = "configuring"


class InteractionTypeEnum(str, enum.Enum):
    VIEWED = "viewed"
    PICKED_UP = "picked_up"
    RETURNED = "returned"
    COMPARED = "compared"
    PURCHASED = "purchased"


class CustomerSegmentEnum(str, enum.Enum):
    EXPLORER = "explorer"
    QUICK_BUYER = "quick_buyer"
    COMPARISON_SHOPPER = "comparison_shopper"
    IMPULSE_BUYER = "impulse_buyer"
    BRAND_LOYAL = "brand_loyal"
    UNCLASSIFIED = "unclassified"


class HeatmapTypeEnum(str, enum.Enum):
    TRAFFIC = "traffic"
    SHELF = "shelf"
    PRODUCT_ATTENTION = "product_attention"
    ENGAGEMENT_HOTSPOT = "engagement_hotspot"
    MOVEMENT = "movement"
    OCCUPANCY = "occupancy"


class ReportTypeEnum(str, enum.Enum):
    CONSUMER_ATTENTION = "consumer_attention"
    PRODUCT_ENGAGEMENT = "product_engagement"
    SHELF_PERFORMANCE = "shelf_performance"
    CONVERSION = "conversion"
    MARKETING = "marketing"


class ReportFormatEnum(str, enum.Enum):
    PDF = "pdf"
    EXCEL = "excel"


class NotificationTypeEnum(str, enum.Enum):
    CAMERA_OFFLINE = "camera_offline"
    SHELF_LOW_PERFORMANCE = "shelf_low_performance"
    PRODUCT_LOW_VISIBILITY = "product_low_visibility"
    TRAFFIC_SPIKE = "traffic_spike"
    STORE_CONGESTION = "store_congestion"
    AI_DETECTION_FAILURE = "ai_detection_failure"


class NotificationSeverityEnum(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class RecommendationTypeEnum(str, enum.Enum):
    SHELF_OPTIMIZATION = "shelf_optimization"
    PRODUCT_PLACEMENT = "product_placement"
    PROMOTIONAL_PLACEMENT = "promotional_placement"
    LAYOUT_IMPROVEMENT = "layout_improvement"
    PRODUCT_VISIBILITY = "product_visibility"
    CUSTOMER_ENGAGEMENT = "customer_engagement"
    # Milestone 3 diagnostic rules
    QUALITY_PRICING_REVIEW = "quality_pricing_review"  # high pickup, low purchase conversion
    COLD_ZONE_ANCHOR = "cold_zone_anchor"  # low-traffic aisle needs an anchor product
    EYE_LEVEL_RELOCATION = "eye_level_relocation"  # high-attractiveness product stuck on a bottom shelf


class ShelfLevelEnum(str, enum.Enum):
    """Vertical placement of a shelf, used by the eye-level-optimization rule.
    Eye level draws the most gaze by a wide margin in real retail studies,
    hence it being the placement the recommendation engine steers toward."""
    BOTTOM = "bottom"
    MIDDLE = "middle"
    EYE_LEVEL = "eye_level"
    TOP = "top"
