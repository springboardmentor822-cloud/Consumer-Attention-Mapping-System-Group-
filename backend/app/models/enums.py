from enum import StrEnum


class UserRole(StrEnum):
    admin = "Admin"
    store_manager = "Store Manager"
    retail_analyst = "Retail Analyst"
    marketing_manager = "Marketing Manager"


class StoreStatus(StrEnum):
    active = "Active"
    inactive = "Inactive"


class CameraStatus(StrEnum):
    online = "Online"
    offline = "Offline"
    maintenance = "Maintenance"


class CampaignStatus(StrEnum):
    draft = "Draft"
    active = "Active"
    paused = "Paused"
    completed = "Completed"
    cancelled = "Cancelled"


class CampaignType(StrEnum):
    in_store = "In-Store"
    digital = "Digital"
    social_media = "Social Media"
    email = "Email"
    print = "Print"
    event = "Event"


class PromotionType(StrEnum):
    product_promotion = "Product Promotion"
    bundle_offer = "Bundle Offer"
    festival_offer = "Festival Offer"
    seasonal_campaign = "Seasonal Campaign"
    flash_sale = "Flash Sale"
    discount_offer = "Discount Offer"


class PromotionStatus(StrEnum):
    scheduled = "Scheduled"
    active = "Active"
    expired = "Expired"
    cancelled = "Cancelled"
