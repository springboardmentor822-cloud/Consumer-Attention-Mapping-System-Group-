"""
behavior_engine.py

Milestone 3
Customer Behaviour Analytics
"""

from statistics import mean


class BehaviorEngine:

    # -----------------------------
    # Average Journey Length
    # -----------------------------
    def average_journey(self, customers):

        if not customers:
            return 0

        journeys = []

        for customer in customers.values():
            journeys.append(
                len(customer.get("zone_history", []))
            )

        return round(mean(journeys), 2)

    # -----------------------------
    # Average Zones Visited
    # -----------------------------
    def average_zones(self, customers):

        if not customers:
            return 0

        zones = []

        for customer in customers.values():

            zones.append(
                len(
                    set(
                        customer.get(
                            "zone_history",
                            []
                        )
                    )
                )
            )

        return round(mean(zones), 2)

    # -----------------------------
    # Revisits
    # -----------------------------
    def revisit_count(self, history):

        if not history:
            return 0

        return len(history) - len(set(history))

    # -----------------------------
    # Behaviour Type
    # -----------------------------
    def behaviour_type(self, customer):

        history = customer.get(
            "zone_history",
            []
        )

        unique = len(set(history))

        revisits = self.revisit_count(history)

        if unique >= 6:
            return "Explorer"

        if revisits >= 3:
            return "Wanderer"

        return "Focused"

    # -----------------------------
    # Purchase Intent
    # -----------------------------
    def purchase_intent(self, customer):

        score = 0

        if customer.get("checkout", False):
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

        return min(score, 100)

    # -----------------------------
    # Customer Table
    # -----------------------------
    def customer_summary(self, customers):

        summary = []

        for track_id, customer in customers.items():

            history = customer.get(
                "zone_history",
                []
            )

            summary.append({

                "track_id": track_id,

                "journey_length": len(history),

                "zones": len(set(history)),

                "revisits":
                    self.revisit_count(history),

                "behaviour":
                    self.behaviour_type(customer),

                "purchase_intent":
                    self.purchase_intent(customer),

            })

        return summary

    # -----------------------------
    # Behaviour Distribution
    # -----------------------------
    def distribution(self, customers):

        result = {

            "Explorer": 0,

            "Focused": 0,

            "Wanderer": 0,

        }

        for customer in customers.values():

            result[
                self.behaviour_type(customer)
            ] += 1

        return result


behavior_engine = BehaviorEngine()