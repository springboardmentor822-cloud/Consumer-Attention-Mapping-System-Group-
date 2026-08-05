import cv2
import time


from pathlib import Path
from copy import deepcopy

from ultralytics import YOLO
from datetime import datetime

from heatmap import heatmaps
from live_stats import (get_stats,update_ai_insights,)
from behavior.trajectory import analyse_customer_paths
from behavior.zone_transition import analyse_zone_transitions


# ==========================================================
# BASE DIRECTORY
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent


# ==========================================================
# LOAD AI MODELS
# ==========================================================

print("\n========================================")
print("Loading AI Models...")
print("========================================")

person_model = YOLO("yolov8n.pt")

product_model = YOLO(
    str(BASE_DIR / "models" / "product_detector.pt")
)

PERSON_CLASS_ID = 0

print("✓ Person Detection Model Loaded")
print("✓ Product Detection Model Loaded")
print("========================================\n")


# ==========================================================
# CAMERA STATES
# ==========================================================

def create_camera_state():

    return {

        # Unique Customers
        "seen_ids": set(),

        # Entry Time
        "entry_times": {},

        # Dwell Time
        "dwell_times": {},

        # Product Interaction
        "interaction_ids": set(),

        "interaction_start": {},

        # Customer Paths
        "customer_paths": {},
        
        # Current Zone
        "customer_zone": {},

        # Zone History
        "zone_history": {},

        # Zone Transitions
        "zone_transitions": {},

        # Behaviour
        "attention_history": [],

        "customer_activity": {},

        # Performance
        "frame_counter": 0,

        # Recommendation
        "last_recommendation":
            "Monitoring customer behaviour..."
    }


camera_states = {

    1: create_camera_state(),
    2: create_camera_state(),
    

}
# ==========================================================
# CUSTOMER JOURNEY DATABASE (IN MEMORY)
# ==========================================================

customer_journeys = {}

CUSTOMER_TIMEOUT = 20


def get_customer_journeys():
    """
    Return all customer journeys.
    """
    return list(customer_journeys.values())


def get_customer(track_id: int):
    return customer_journeys.get(track_id)


def update_customer(
    camera_id,
    track_id,
    dwell_time,
    interacted,
):

    now = datetime.now()

    # ---------------------------------------
    # New Customer
    # ---------------------------------------

    if track_id not in customer_journeys:

        customer_journeys[track_id] = {

            "track_id": track_id,

            "camera_id": camera_id,

            "entry_time": now.strftime(
                "%d-%m-%Y %H:%M:%S"
            ),

            "last_seen": now,

            "exit_time": None,

            "status": "Active",

            "dwell_time": dwell_time,

            "attention_score": 0,

            "product_interactions": 0,

            "path_points": 0,

        }

    customer = customer_journeys[track_id]

    customer["last_seen"] = now

    customer["status"] = "Active"

    customer["exit_time"] = None

    customer["dwell_time"] = dwell_time

    if interacted:

        customer["product_interactions"] += 1

    customer["attention_score"] = min(
        100,
        customer["product_interactions"] * 20,
    )


def refresh_customer_status():

    now = datetime.now()

    for customer in customer_journeys.values():

        elapsed = (
            now - customer["last_seen"]
        ).total_seconds()

        if elapsed > CUSTOMER_TIMEOUT:

            customer["status"] = "Exited"

            if customer["exit_time"] is None:

                customer["exit_time"] = now.strftime(
                    "%d-%m-%Y %H:%M:%S"
                )

def get_camera_state(camera_id):

    if camera_id not in camera_states:

        camera_states[camera_id] = create_camera_state()

    return camera_states[camera_id]


# ==========================================================
# SETTINGS
# ==========================================================

PROCESS_EVERY_N_FRAME = 5

MAX_PATH_POINTS = 80


# ==========================================================
# SHELF ZONES
# ==========================================================

ENTRANCE = (
    0,
    0,
    120,
    480,
)

SHELF_A = (
    120,
    0,
    220,
    480,
)

SHELF_B = (
    220,
    0,
    320,
    480,
)

SHELF_C = (
    320,
    0,
    420,
    480,
)

SHELF_D = (
    420,
    0,
    520,
    480,
)

SHELF_E = (
    520,
    0,
    620,
    480,
)

CHECKOUT = (
    620,
    0,
    640,
    240,
)

EXIT = (
    620,
    240,
    640,
    480,
)


# ==========================================================
# HELPER FUNCTIONS
# ==========================================================

def inside_zone(cx, cy, zone):

    x1, y1, x2, y2 = zone

    return (
        x1 <= cx <= x2
        and
        y1 <= cy <= y2
    )


def draw_customer_path(frame, path):

    if len(path) < 2:
        return

    for i in range(1, len(path)):

        cv2.line(

            frame,

            path[i - 1],

            path[i],

            (255, 0, 255),

            2,

        )

    cv2.circle(

        frame,

        path[-1],

        5,

        (255, 255, 0),

        -1,

    )
    # ==========================================================
# DETECT PEOPLE
# ==========================================================

def detect_people(camera_id, frame):
    print(f"[AI] detect_people() called for Camera {camera_id}")

    # ---------------------------------------------
    # Camera State
    # ---------------------------------------------

    state = get_camera_state(camera_id)

    stats = get_stats(camera_id)

    seen_ids = state["seen_ids"]

    entry_times = state["entry_times"]

    dwell_times = state["dwell_times"]

    interaction_ids = state["interaction_ids"]

    interaction_start = state["interaction_start"]

    customer_paths = state["customer_paths"]
    
    customer_zone = state["customer_zone"]

    zone_history = state["zone_history"]

    zone_transitions = state["zone_transitions"]
    # ---------------------------------------------
    # Customer Journey Tracking
    # ---------------------------------------------

    active_track_ids = set()

    # ---------------------------------------------
    # Frame Counter
    # ---------------------------------------------

    state["frame_counter"] += 1

    frame_counter = state["frame_counter"]

    # ---------------------------------------------
    # Resize Frame
    # ---------------------------------------------

    frame = cv2.resize(
        frame,
        (640, 480)
    )

    # ---------------------------------------------
    # Frame Skipping
    # ---------------------------------------------

    if frame_counter % PROCESS_EVERY_N_FRAME != 0:
        return frame

    # ---------------------------------------------
    # PERSON DETECTION (YOLO + ByteTrack)
    # ---------------------------------------------

    results = person_model.track(
    source=frame,
    persist=True,
    tracker="bytetrack.yaml",
    classes=[0],
    conf=0.35,
    iou=0.50,
    imgsz=960,
    stream=False,
    verbose=False,
    )
    print("\n========== YOLO DEBUG ==========")

    for result in results:

        if result.boxes is None:
            print("No boxes detected")
            continue

    print("Total Boxes:", len(result.boxes))

    for box in result.boxes:

        cls = int(box.cls.item())
        conf = float(box.conf.item())

        print(
            f"Class={cls}, Confidence={conf:.2f}, TrackID={box.id}"
        )

    print("================================\n")

    # ---------------------------------------------
    # PRODUCT DETECTION
    # ---------------------------------------------

    product_results = product_model.predict(

        frame,

        conf=0.45,

        imgsz=640,

        verbose=False,

    )

    product_count = 0

    # ---------------------------------------------
    # Live Counters
    # ---------------------------------------------

    current = 0
    entrance = 0
    shelf_a = 0
    shelf_b = 0
    shelf_c = 0
    shelf_d = 0
    shelf_e = 0
    checkout = 0

    average_dwell = 0

    # =====================================================
    # DRAW PRODUCT DETECTIONS
    # =====================================================

    for result in product_results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            product_count += 1

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )

            cls = int(box.cls.item())

            conf = float(box.conf.item())

            product_name = product_model.names[cls]

            cv2.rectangle(

                frame,

                (x1, y1),

                (x2, y2),

                (255, 120, 0),

                2,

            )

            cv2.putText(

                frame,

                f"{product_name} {conf:.2f}",

                (x1, y1 - 8),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.5,

                (255, 120, 0),

                2,

            )
                # ==========================================================
    # PERSON TRACKING
    # ==========================================================

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            if box.id is None:
                continue

            current += 1

            track_id = int(box.id.item())
            # ------------------------------------------
            # Active Customer
            # ------------------------------------------

            active_track_ids.add(track_id)

            # ------------------------------------------
            # Unique Customer
            # ------------------------------------------

            seen_ids.add(track_id)

            # ------------------------------------------
            # Entry Time
            # ------------------------------------------

            if track_id not in entry_times:

                entry_times[track_id] = time.time()

            dwell = int(
                time.time() - entry_times[track_id]
            )

            dwell_times[track_id] = dwell
            # ------------------------------------------
            # Customer Journey Update
            # ------------------------------------------

           

            # ------------------------------------------
            # Bounding Box
            # ------------------------------------------

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )

            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            # ------------------------------------------
            # Heatmap
            # ------------------------------------------

            heatmaps[camera_id].update(cx, cy)

            # ------------------------------------------
            # Customer Path
            # ------------------------------------------

            if track_id not in customer_paths:

                customer_paths[track_id] = []

            new_point = (cx, cy)

            if not customer_paths[track_id]:
                customer_paths[track_id].append(new_point)
            else:
                last_x, last_y = customer_paths[track_id][-1]

                if abs(last_x - cx) > 5 or abs(last_y - cy) > 5:
                    customer_paths[track_id].append(new_point)

            if len(customer_paths[track_id]) > MAX_PATH_POINTS:

                customer_paths[track_id].pop(0)

            # Uncomment if path visualization is required

            # draw_customer_path(
            #     frame,
            #     customer_paths[track_id]
            # )

            # ------------------------------------------
            # Zone Detection
            # ------------------------------------------

            zone = "Walking"

            if inside_zone(cx, cy, ENTRANCE):
                entrance += 1
                zone = "Entrance"

            elif inside_zone(cx, cy, SHELF_A):
                shelf_a += 1
                zone = "Shelf A"

            elif inside_zone(cx, cy, SHELF_B):
                shelf_b += 1
                zone = "Shelf B"

            elif inside_zone(cx, cy, SHELF_C):
                shelf_c += 1
                zone = "Shelf C"

            elif inside_zone(cx, cy, SHELF_D):
                shelf_d += 1
                zone = "Shelf D"

            elif inside_zone(cx, cy, SHELF_E):
                shelf_e += 1
                zone = "Shelf E"

            elif inside_zone(cx, cy, CHECKOUT):
                checkout += 1
                zone = "Checkout"

            elif inside_zone(cx, cy, EXIT):
                zone = "Exit"
            
            previous = customer_zone.get(track_id)

            if previous != zone:

                customer_zone[track_id] = zone

                if track_id not in zone_history:
                    zone_history[track_id] = []

                zone_history[track_id].append(zone)

                transition = f"{previous}->{zone}"

                if previous is not None:

                    zone_transitions[transition] = (
                        zone_transitions.get(transition, 0) + 1
                    )

            # ------------------------------------------
            # Product Interaction
            # ------------------------------------------

            if zone in ("Shelf A", "Shelf B", "Shelf C","Shelf D","Shelf E",):

                if track_id not in interaction_start:

                    interaction_start[track_id] = time.time()

                elif (
                    time.time()
                    - interaction_start[track_id]
                ) >= 3:

                    interaction_ids.add(track_id)

                    cv2.putText(

                        frame,

                        "Picking Product",

                        (x1, y2 + 20),

                        cv2.FONT_HERSHEY_SIMPLEX,

                        0.55,

                        (0, 255, 255),

                        2,

                    )

            else:

                interaction_start.pop(
                    track_id,
                    None
                )
            update_customer(
                camera_id=camera_id,
                track_id=track_id,
                dwell_time=dwell,
                interacted=(track_id in interaction_ids),
            )
            # ------------------------------------------
            # Customer Behaviour Analytics
            # ------------------------------------------

            if "customers" not in stats:
                stats["customers"] = {}

            stats["customers"][track_id] = {

                "track_id": track_id,

                "journey_time": dwell,

                "zones_visited": len(
                    zone_history.get(track_id, [])
                ),

                "zone_history": zone_history.get(
                    track_id,
                    []
                ),

                "current_zone": zone,

                "product_interactions": customer_journeys[track_id]["product_interactions"],
                "checkout": (
                    zone == "Checkout"
                )
            }

            # ------------------------------------------
            # Draw Person Bounding Box
            # ------------------------------------------

            cv2.rectangle(

                frame,

                (x1, y1),

                (x2, y2),

                (0, 255, 0),

                2,

            )

            cv2.circle(

                frame,

                (cx, cy),

                4,

                (0, 0, 255),

                -1,

            )

            cv2.putText(

                frame,

                f"ID:{track_id} | {dwell}s",

                (x1, y1 - 10),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.55,

                (0, 255, 0),

                2,

            )

    # ==========================================================
    # HEATMAP OVERLAY (OPTIONAL)
    # ==========================================================

    # frame = heatmap.overlay(frame)

    # ==========================================================
    # AVERAGE DWELL TIME
    # ==========================================================

    if dwell_times:

        average_dwell = int(

            sum(dwell_times.values())

            / len(dwell_times)

        )

    else:

        average_dwell = 0
            # ==========================================================
    # LIVE STATISTICS (PER CAMERA)
    # ==========================================================

    stats["products_detected"] = product_count
    stats["current_persons"] = current
    print("\n========== LIVE STATS ==========")
    print("Current Persons :", current)
    print("Total Customers :", len(seen_ids))
    print("Heatmap Points :", heatmaps[camera_id].total_points())
    print("Tracked Paths :", len(customer_paths))
    print("===============================\n")
    
    stats["total_customers"] = len(seen_ids)
    stats["average_dwell"] = average_dwell

    stats["entrance"] = entrance
    stats["shelf_a"] = shelf_a
    stats["shelf_b"] = shelf_b
    stats["shelf_c"] = shelf_c
    stats["shelf_d"] = shelf_d
    stats["shelf_e"] = shelf_e
    stats["checkout"] = checkout

    stats["product_interactions"] = len(interaction_ids)

    stats["heatmap_active"] = True
    stats["heatmap_points"] = heatmaps[camera_id].total_points()

    stats["frames_processed"] += 1

    stats["path_tracking"] = True
    stats["tracked_paths"] = len(customer_paths)
    update_ai_insights(camera_id)

    # ==========================================================
    # PEAK ZONE
    # ==========================================================

    zone_counts = {
        
        "Entrance": entrance,

        "Shelf A": shelf_a,

        "Shelf B": shelf_b,

        "Shelf C": shelf_c,

        "Shelf D": shelf_d,

        "Shelf E": shelf_e,

        "Checkout": checkout,

    }

    peak_zone = max(zone_counts, key=zone_counts.get)
    peak_count = zone_counts[peak_zone]

    if peak_count == 0:
        peak_zone = "No Active Zone"

    stats["peak_zone"] = peak_zone
    stats["most_visited_shelf"] = peak_zone
    stats["peak_zone_count"] = peak_count

    # ==========================================================
    # STORE CONGESTION
    # ==========================================================

    if current <= 3:
        congestion = "Low"

    elif current <= 8:
        congestion = "Medium"

    else:
        congestion = "High"

    stats["store_congestion"] = congestion

    # ==========================================================
    # ZONE OCCUPANCY
    # ==========================================================

    total_people = max(
        shelf_a + shelf_b + shelf_c + shelf_d + shelf_e + checkout,
        1
    )

    stats["shelf_a_percent"] = round(
        shelf_a * 100 / total_people,
        1
    )

    stats["shelf_b_percent"] = round(
        shelf_b * 100 / total_people,
        1
    )
    stats["shelf_c_percent"] = round(
        shelf_c * 100 / total_people, 1
    )

    stats["shelf_d_percent"] = round(
        shelf_d * 100 / total_people, 1
    )

    stats["shelf_e_percent"] = round(
        shelf_e * 100 / total_people, 1
    )

    stats["checkout_percent"] = round(
        checkout * 100 / total_people,
        1
    )

    # ==========================================================
    # ATTENTION SCORE
    # ==========================================================

    customers = max(len(seen_ids), 1)

    attention_score = round(
        (
            len(interaction_ids)
            / customers
        ) * 100
    )

    attention_score = min(attention_score, 100)

    stats["attention_score"] = attention_score
    print(
    f"[Camera {camera_id}] "
    f"Current={current}, "
    f"Customers={len(seen_ids)}, "
    f"Products={product_count}, "
    f"Attention={attention_score}"
    )

    # ==========================================================
    # AI RECOMMENDATION
    # ==========================================================

    if current == 0:

        recommendation = (
            f"No customer activity detected on Camera {camera_id}."
        )

    elif attention_score >= 80:

        recommendation = (
            f"High customer attention detected on Camera {camera_id}."
        )

    elif average_dwell >= 40:

        recommendation = (
            f"Customers are spending longer than usual in Camera {camera_id}."
        )

    elif congestion == "High":

        recommendation = (
            f"High crowd density detected on Camera {camera_id}."
        )

    elif len(interaction_ids) >= 10:

        recommendation = (
            f"Frequent customer interactions detected on Camera {camera_id}."
        )

    else:

        recommendation = (
            f"Customer activity is normal on Camera {camera_id}."
        )

    stats["ai_recommendation"] = recommendation
    # ==========================================================
    # CUSTOMER ENGAGEMENT
    # ==========================================================

    if attention_score < 30:

        engagement = "Low"

    elif attention_score < 60:

        engagement = "Medium"

    elif attention_score < 80:

        engagement = "High"

    else:

        engagement = "Excellent"

    stats["engagement_level"] = engagement

    # ==========================================================
    # DASHBOARD SUMMARY
    # ==========================================================

    stats["dashboard_summary"] = {

    "camera_id": camera_id,

    "current_persons": current,

    "total_customers": len(seen_ids),

    "average_dwell": average_dwell,

    "attention_score": attention_score,

    "product_interactions": len(interaction_ids),

    "tracked_paths": len(customer_paths),

    "store_congestion": congestion,

    "engagement": engagement,

    "recommendation": recommendation,

    }

    # ==========================================================
    # PLACEHOLDER ANALYTICS
    # ==========================================================

    stats.setdefault("male_count", 0)
    stats.setdefault("female_count", 0)

    stats.setdefault(
        "dominant_emotion",
        "Neutral"
    )

    stats.setdefault(
        "emotion_distribution",
        {
            "Happy": 0,
            "Neutral": 0,
            "Sad": 0,
            "Angry": 0,
            "Surprised": 0,
        },
    )

    stats["last_updated"] = datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S"
    )

    stats["system_status"] = "Running"
    # ==========================================================
    # Refresh Customer Status
    # ==========================================================

    refresh_customer_status()
        # ==========================================================
    # OPTIONAL DEBUG OVERLAY
    # ==========================================================

    DEBUG_OVERLAY = False

    if DEBUG_OVERLAY:

        cv2.putText(

            frame,

            f"Camera : {camera_id}",

            (10, 25),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (0, 255, 255),

            2,

        )

        cv2.putText(

            frame,

            f"Persons : {current}",

            (10, 50),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (0, 255, 0),

            2,

        )

        cv2.putText(

            frame,

            f"Visitors : {len(seen_ids)}",

            (10, 75),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (0, 255, 0),

            2,

        )

        cv2.putText(

            frame,

            f"Products : {product_count}",

            (10, 100),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 0),

            2,

        )

        cv2.putText(

            frame,

            f"Attention : {attention_score}%",

            (10, 125),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (0, 255, 255),

            2,

        )

        cv2.putText(

            frame,

            f"Zone : {peak_zone}",

            (10, 150),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2,

        )

        cv2.putText(

            frame,

            f"Congestion : {congestion}",

            (10, 175),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (0, 165, 255),

            2,

        )

    # ==========================================================
    # SAVE CAMERA STATE
    # ==========================================================

    state["seen_ids"] = seen_ids

    state["entry_times"] = entry_times

    state["dwell_times"] = dwell_times

    state["interaction_ids"] = interaction_ids

    state["interaction_start"] = interaction_start

    state["customer_paths"] = customer_paths
    
    state["customer_zone"] = customer_zone

    state["zone_history"] = zone_history

    state["zone_transitions"] = zone_transitions
    # ==========================================================
    # TRAJECTORY ANALYTICS
    # ==========================================================

    trajectory_report = analyse_customer_paths(customer_paths)

    stats["trajectory"] = trajectory_report
    stats["trajectory_customers"] = len(trajectory_report)
    
    # ==========================================================
    # ZONE TRANSITION ANALYTICS
    # ==========================================================

    zone_report = analyse_zone_transitions(
        zone_history,
        zone_transitions,
    )

    stats["zone_transition"] = zone_report
    stats["zone_transitions"] = zone_transitions

    stats["zone_history"] = zone_history

    stats["customer_zone"] = customer_zone

    state["last_recommendation"] = recommendation

    camera_states[camera_id] = state
    # Update path count for active customers

    for track_id in active_track_ids:

        if track_id in customer_journeys:

            customer_journeys[track_id]["path_points"] = len(
            customer_paths.get(track_id, [])
            )

    # ==========================================================
    # RETURN FRAME
    # ==========================================================

    return frame
# ==========================================================
# CUSTOMER JOURNEY API HELPERS
# ==========================================================

def get_all_customer_journeys():
    """
    Return all customer journey records.
    """

    refresh_customer_status()

    journeys = []

    for customer in customer_journeys.values():

        item = customer.copy()

        # Convert datetime to string
        if isinstance(item["last_seen"], datetime):

            item["last_seen"] = item["last_seen"].strftime(
                "%d-%m-%Y %H:%M:%S"
            )

        journeys.append(item)

    journeys.sort(
        key=lambda x: x["track_id"]
    )

    return journeys


# ==========================================================
# SINGLE CUSTOMER
# ==========================================================

def get_customer_journey(track_id: int):

    refresh_customer_status()

    customer = customer_journeys.get(track_id)

    if customer is None:
        return None

    item = customer.copy()

    if isinstance(item["last_seen"], datetime):

        item["last_seen"] = item["last_seen"].strftime(
            "%d-%m-%Y %H:%M:%S"
        )

    return item


# ==========================================================
# ACTIVE CUSTOMERS
# ==========================================================

def get_active_customers():

    refresh_customer_status()

    active = []

    for customer in customer_journeys.values():

        if customer["status"] == "Active":

            item = customer.copy()

            if isinstance(item["last_seen"], datetime):

                item["last_seen"] = item["last_seen"].strftime(
                    "%d-%m-%Y %H:%M:%S"
                )

            active.append(item)

    return active


# ==========================================================
# EXITED CUSTOMERS
# ==========================================================

def get_exited_customers():

    refresh_customer_status()

    exited = []

    for customer in customer_journeys.values():

        if customer["status"] == "Exited":

            item = customer.copy()

            if isinstance(item["last_seen"], datetime):

                item["last_seen"] = item["last_seen"].strftime(
                    "%d-%m-%Y %H:%M:%S"
                )

            exited.append(item)

    return exited


# ==========================================================
# RESET CUSTOMER JOURNEY
# ==========================================================

def reset_customer_journeys():

    customer_journeys.clear()
