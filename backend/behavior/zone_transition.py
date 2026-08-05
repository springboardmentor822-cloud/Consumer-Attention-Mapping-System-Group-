"""
zone_transition.py

Milestone 3
Phase 2
Zone Transition Analytics

This module analyses customer movement
between different store zones.

It DOES NOT perform AI detection.

It only analyses the zone_history and
zone_transitions collected inside ai_detector.py.
"""

from collections import Counter


class ZoneTransitionEngine:

    def __init__(self):
        pass

    # ----------------------------------------------------
    # Count transitions
    # ----------------------------------------------------

    def transition_frequency(self, transitions):

        return dict(
            sorted(
                transitions.items(),
                key=lambda x: x[1],
                reverse=True,
            )
        )

    # ----------------------------------------------------
    # Most common transition
    # ----------------------------------------------------

    def most_common_transition(self, transitions):

        if not transitions:
            return None

        return max(
            transitions,
            key=transitions.get,
        )

    # ----------------------------------------------------
    # Zone visit frequency
    # ----------------------------------------------------

    def zone_frequency(self, zone_history):

        counter = Counter()

        for history in zone_history.values():

            for zone in history:

                counter[zone] += 1

        return dict(counter)

    # ----------------------------------------------------
    # Most visited zone
    # ----------------------------------------------------

    def most_visited_zone(self, zone_history):

        freq = self.zone_frequency(zone_history)

        if not freq:
            return None

        return max(
            freq,
            key=freq.get,
        )

    # ----------------------------------------------------
    # Least visited zone
    # ----------------------------------------------------

    def least_visited_zone(self, zone_history):

        freq = self.zone_frequency(zone_history)

        if not freq:
            return None

        return min(
            freq,
            key=freq.get,
        )

    # ----------------------------------------------------
    # Customer routes
    # ----------------------------------------------------

    def customer_routes(self, zone_history):

        routes = {}

        for track_id, history in zone_history.items():

            routes[track_id] = " → ".join(history)

        return routes

    # ----------------------------------------------------
    # Completed journeys
    # ----------------------------------------------------

    def completed_journeys(self, zone_history):

        completed = 0

        for history in zone_history.values():

            if (
                "Entrance" in history
                and
                "Checkout" in history
            ):
                completed += 1

        return completed

    # ----------------------------------------------------
    # Total transitions
    # ----------------------------------------------------

    def total_transitions(self, transitions):

        return sum(transitions.values())

    # ----------------------------------------------------
    # AI Insights
    # ----------------------------------------------------

    def ai_insights(
        self,
        zone_history,
        transitions,
    ):

        insights = []

        most_zone = self.most_visited_zone(
            zone_history
        )

        least_zone = self.least_visited_zone(
            zone_history
        )

        common_transition = (
            self.most_common_transition(
                transitions
            )
        )

        if most_zone:

            insights.append(
                f"{most_zone} receives the highest customer traffic."
            )

        if least_zone:

            insights.append(
                f"{least_zone} has the lowest customer engagement."
            )

        if common_transition:

            insights.append(
                f"The most common customer movement is {common_transition}."
            )

        if not insights:

            insights.append(
                "No customer movement detected."
            )

        return insights

    # ----------------------------------------------------
    # Full Summary
    # ----------------------------------------------------

    def summary(
        self,
        zone_history,
        transitions,
    ):

        return {

            "total_transitions":
                self.total_transitions(
                    transitions
                ),

            "transition_frequency":
                self.transition_frequency(
                    transitions
                ),

            "most_common_transition":
                self.most_common_transition(
                    transitions
                ),

            "zone_frequency":
                self.zone_frequency(
                    zone_history
                ),

            "most_visited_zone":
                self.most_visited_zone(
                    zone_history
                ),

            "least_visited_zone":
                self.least_visited_zone(
                    zone_history
                ),

            "completed_journeys":
                self.completed_journeys(
                    zone_history
                ),

            "customer_routes":
                self.customer_routes(
                    zone_history
                ),

            "ai_insights":
                self.ai_insights(
                    zone_history,
                    transitions,
                ),

        }


zone_transition_engine = ZoneTransitionEngine()


# --------------------------------------------------------
# Helper Function
# --------------------------------------------------------

def analyse_zone_transitions(
    zone_history,
    transitions,
):

    return zone_transition_engine.summary(
        zone_history,
        transitions,
    )