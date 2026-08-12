"""
behavior_engine.py

Milestone 3
Customer Behaviour Intelligence

Purpose
-------
Provides shopper behaviour analytics and the five required
Milestone 3 shopper segments.

Required shopper segments
-------------------------
1. Explorer
2. Quick Buyer
3. Comparison Shopper
4. Impulse Buyer
5. Brand Loyal Customer

This module works with the customer tracking information
already produced by ai_detector.py.

IMPORTANT
---------
This module does NOT perform:
- YOLO detection
- ByteTrack tracking
- video processing
- heatmap generation
- trajectory detection

It only analyses existing customer/session data.
"""

from statistics import mean


class BehaviorEngine:

    # ==========================================================
    # BASIC JOURNEY ANALYTICS
    # ==========================================================

    def average_journey(self, customers):

        if not customers:
            return 0

        journeys = []

        for customer in customers.values():

            journeys.append(
                len(
                    customer.get(
                        "zone_history",
                        []
                    )
                )
            )

        return round(
            mean(journeys),
            2
        )

    # ==========================================================
    # AVERAGE UNIQUE ZONES
    # ==========================================================

    def average_zones(self, customers):

        if not customers:
            return 0

        zones = []

        for customer in customers.values():

            history = customer.get(
                "zone_history",
                []
            )

            zones.append(
                len(set(history))
            )

        return round(
            mean(zones),
            2
        )

    # ==========================================================
    # REVISIT COUNT
    # ==========================================================

    def revisit_count(self, history):

        if not history:
            return 0

        return max(
            0,
            len(history) - len(set(history))
        )

    # ==========================================================
    # CLEAN ZONE HISTORY
    # ==========================================================

    def _clean_history(self, customer):

        history = customer.get(
            "zone_history",
            []
        )

        if not isinstance(history, list):
            return []

        # Remove empty values.
        # Walking is retained because it represents movement,
        # but repeated identical zones are still handled separately.
        return [
            zone
            for zone in history
            if zone
        ]

    # ==========================================================
    # CUSTOMER FEATURES
    # ==========================================================

    def customer_features(self, customer):

        history = self._clean_history(
            customer
        )

        unique_zones = len(
            set(history)
        )

        journey_length = len(
            history
        )

        revisits = self.revisit_count(
            history
        )

        journey_time = float(
            customer.get(
                "journey_time",
                customer.get(
                    "dwell_time",
                    0
                )
            ) or 0
        )

        product_interactions = int(
            customer.get(
                "product_interactions",
                0
            ) or 0
        )

        checkout = bool(
            customer.get(
                "checkout",
                False
            )
        )

        current_zone = customer.get(
            "current_zone",
            ""
        )

        return {

            "journey_time":
                journey_time,

            "journey_length":
                journey_length,

            "unique_zones":
                unique_zones,

            "revisits":
                revisits,

            "product_interactions":
                product_interactions,

            "checkout":
                checkout,

            "current_zone":
                current_zone,

        }

    # ==========================================================
    # LEGACY BEHAVIOUR CLASSIFICATION
    # ==========================================================
    #
    # Kept intentionally so existing frontend functionality
    # depending on "behaviour" does not break.
    #

    def behaviour_type(self, customer):

        history = self._clean_history(
            customer
        )

        unique = len(
            set(history)
        )

        revisits = self.revisit_count(
            history
        )

        if unique >= 6:

            return "Explorer"

        if revisits >= 3:

            return "Wanderer"

        return "Focused"

    # ==========================================================
    # MILESTONE 3 SHOPPER SEGMENTATION
    # ==========================================================
    #
    # The project specification requires:
    #
    # Explorer
    # Quick Buyer
    # Comparison Shopper
    # Impulse Buyer
    # Brand Loyal Customer
    #
    # We use transparent rule-based heuristics so the existing
    # YOLO/ByteTrack/tracking pipeline remains unchanged.
    #

    def shopper_segment(self, customer):

        features = self.customer_features(
            customer
        )

        journey_time = features[
            "journey_time"
        ]

        journey_length = features[
            "journey_length"
        ]

        unique_zones = features[
            "unique_zones"
        ]

        revisits = features[
            "revisits"
        ]

        product_interactions = features[
            "product_interactions"
        ]

        checkout = features[
            "checkout"
        ]

        current_zone = features[
            "current_zone"
        ]

        # ------------------------------------------------------
        # 1. QUICK BUYER
        # ------------------------------------------------------
        #
        # Required behaviour:
        # - short/low dwell
        # - limited zones
        # - direct shopping behaviour
        # - product interaction
        # - checkout/conversion indication
        #

        if (
            checkout
            and journey_time <= 60
            and unique_zones <= 3
            and product_interactions >= 1
        ):

            return "Quick Buyer"

        # ------------------------------------------------------
        # 2. COMPARISON SHOPPER
        # ------------------------------------------------------
        #
        # Required behaviour:
        # - extended dwell
        # - repeated movement/revisits
        # - multiple product interactions
        #

        if (
            product_interactions >= 3
            and (
                revisits >= 2
                or journey_time >= 45
            )
        ):

            return "Comparison Shopper"

        # ------------------------------------------------------
        # 3. IMPULSE BUYER
        # ------------------------------------------------------
        #
        # Required behaviour:
        # - relatively short journey
        # - product engagement
        # - limited exploration
        # - quick interaction
        #
        # Since the current pipeline does not yet have a dedicated
        # promotional-display detector, this classification uses
        # the interaction + short-journey signals already available.
        #

        if (
            product_interactions >= 1
            and journey_time <= 45
            and unique_zones <= 4
            and not checkout
        ):

            return "Impulse Buyer"

        # ------------------------------------------------------
        # 4. BRAND LOYAL CUSTOMER
        # ------------------------------------------------------
        #
        # Required behaviour:
        # - targeted movement
        # - limited number of zones
        # - repeated engagement
        #
        # The current tracking data does not contain a dedicated
        # brand-ID signal, so we use repeated focused interaction
        # with a limited zone set as the available proxy.
        #

        if (
            product_interactions >= 2
            and unique_zones <= 2
            and revisits >= 1
        ):

            return "Brand Loyal Customer"

        # ------------------------------------------------------
        # 5. EXPLORER
        # ------------------------------------------------------
        #
        # Required behaviour:
        # - high journey coverage
        # - multiple zones
        # - longer dwell
        # - broader store movement
        #

        if (
            unique_zones >= 5
            or journey_length >= 6
            or journey_time >= 90
        ):

            return "Explorer"

        # ------------------------------------------------------
        # DEFAULT
        # ------------------------------------------------------
        #
        # When the available evidence is insufficient to strongly
        # classify the shopper, Explorer is used as the neutral
        # broad-browsing segment.
        #

        return "Explorer"

    # ==========================================================
    # PURCHASE INTENT
    # ==========================================================

    def purchase_intent(self, customer):

        score = 0

        if customer.get(
            "checkout",
            False
        ):

            score += 40

        if customer.get(
            "product_interactions",
            0
        ) >= 2:

            score += 20

        if len(
            customer.get(
                "zone_history",
                []
            )
        ) >= 5:

            score += 20

        if customer.get(
            "average_dwell",
            0
        ) >= 30:

            score += 20

        return min(
            score,
            100
        )

    # ==========================================================
    # CUSTOMER SUMMARY
    # ==========================================================

    def customer_summary(self, customers):

        summary = []

        for track_id, customer in customers.items():

            history = self._clean_history(
                customer
            )

            summary.append({

                "track_id":
                    track_id,

                "journey_length":
                    len(history),

                "zones":
                    len(set(history)),

                "revisits":
                    self.revisit_count(
                        history
                    ),

                # ------------------------------------------------
                # Existing behaviour field
                # ------------------------------------------------
                "behaviour":
                    self.behaviour_type(
                        customer
                    ),

                # ------------------------------------------------
                # NEW Milestone 3 segment
                # ------------------------------------------------
                "segment":
                    self.shopper_segment(
                        customer
                    ),

                "purchase_intent":
                    self.purchase_intent(
                        customer
                    ),

            })

        return summary

    # ==========================================================
    # LEGACY BEHAVIOUR DISTRIBUTION
    # ==========================================================
    #
    # Preserved so existing UI/API behaviour does not disappear.
    #

    def distribution(self, customers):

        result = {

            "Explorer": 0,

            "Focused": 0,

            "Wanderer": 0,

        }

        for customer in customers.values():

            behaviour = self.behaviour_type(
                customer
            )

            result[behaviour] += 1

        return result

    # ==========================================================
    # MILESTONE 3 SEGMENT DISTRIBUTION
    # ==========================================================

    def segment_distribution(self, customers):

        result = {

            "Explorer": 0,

            "Quick Buyer": 0,

            "Comparison Shopper": 0,

            "Impulse Buyer": 0,

            "Brand Loyal Customer": 0,

        }

        for customer in customers.values():

            segment = self.shopper_segment(
                customer
            )

            # Safety check so an unexpected classification
            # never breaks the analytics endpoint.
            if segment not in result:

                segment = "Explorer"

            result[segment] += 1

        return result

    # ==========================================================
    # SEGMENT DETAILS
    # ==========================================================

    def segment_details(self, customers):

        details = []

        for track_id, customer in customers.items():

            features = self.customer_features(
                customer
            )

            segment = self.shopper_segment(
                customer
            )

            details.append({

                "track_id":
                    track_id,

                "segment":
                    segment,

                "journey_time":
                    features[
                        "journey_time"
                    ],

                "journey_length":
                    features[
                        "journey_length"
                    ],

                "unique_zones":
                    features[
                        "unique_zones"
                    ],

                "revisits":
                    features[
                        "revisits"
                    ],

                "product_interactions":
                    features[
                        "product_interactions"
                    ],

                "checkout":
                    features[
                        "checkout"
                    ],

                "current_zone":
                    features[
                        "current_zone"
                    ],

            })

        return details


# ==========================================================
# GLOBAL ENGINE INSTANCE
# ==========================================================

behavior_engine = BehaviorEngine()