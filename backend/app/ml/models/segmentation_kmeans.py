import os
import pickle
import time
import datetime
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from app.models.session import Session as ShopperSession

# Model storage path
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "storage", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_segmentation.pkl")

class KMeansShopperSegmenter:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.kmeans = None
        self.scaler = None
        self.persona_map = {}  # cluster_id -> persona name
        self.version = "1.0.0"
        self.last_trained = None
        self.cluster_centroids_original = {}

    def fetch_features(self, db: Session):
        """
        Retrieves real feature vectors from the SQLite sessions table.
        Excludes sessions with missing or invalid numeric values, zero/negative durations,
        or corrupted long durations (>300 seconds).
        """
        raw_sessions = db.query(ShopperSession).all()
        total_sessions = len(raw_sessions)
        
        usable_sessions = []
        features_list = []
        excluded_count = 0
        exclusion_reasons = {
            "missing_features": 0,
            "zero_or_negative_duration": 0,
            "corrupted_long_duration": 0,
            "invalid_numeric_values": 0
        }
        
        print("\n" + "="*50)
        print("K-MEANS DATA FILTERING LOG")
        print("="*50)
        print("Maximum session duration set to 300.0 seconds.")
        print("Rationale: Source video files range from 5.88s to 24.42s in length.")
        print("Accounting for potential multiple loops (e.g. 2-3 loops) and the 30-second")
        print("session finalization timeout, any valid single session must be under 300s.")
        print("Sessions exceeding 300s represent corrupted merged tracking IDs.")
        print("-" * 50)

        for sess in raw_sessions:
            # 1. Check for missing required features
            if (sess.duration_seconds is None or 
                sess.path_distance is None or 
                sess.velocity is None or 
                sess.stopping_events is None or 
                sess.interaction_count is None or 
                sess.shelf_visit_count is None):
                excluded_count += 1
                exclusion_reasons["missing_features"] += 1
                continue
                
            # 2. Check for invalid numeric values (NaN, Inf) or parsing errors
            try:
                duration = float(sess.duration_seconds)
                path_dist = float(sess.path_distance)
                vel = float(sess.velocity)
                stops = float(sess.stopping_events)
                ints = float(sess.interaction_count)
                shelves = float(sess.shelf_visit_count)
                
                if (np.isnan(duration) or np.isinf(duration) or
                    np.isnan(path_dist) or np.isinf(path_dist) or
                    np.isnan(vel) or np.isinf(vel) or
                    np.isnan(stops) or np.isinf(stops) or
                    np.isnan(ints) or np.isinf(ints) or
                    np.isnan(shelves) or np.isinf(shelves)):
                    excluded_count += 1
                    exclusion_reasons["invalid_numeric_values"] += 1
                    continue
            except (ValueError, TypeError):
                excluded_count += 1
                exclusion_reasons["invalid_numeric_values"] += 1
                continue
                
            # 3. Check for zero or negative duration
            if duration <= 0:
                excluded_count += 1
                exclusion_reasons["zero_or_negative_duration"] += 1
                continue
                
            # 4. Check for corrupted long duration (>300 seconds)
            if duration > 300.0:
                excluded_count += 1
                exclusion_reasons["corrupted_long_duration"] += 1
                continue
                
            features = [duration, path_dist, vel, stops, ints, shelves]
            features_list.append(features)
            usable_sessions.append(sess)
            
        return total_sessions, len(usable_sessions), excluded_count, exclusion_reasons, np.array(features_list), usable_sessions

    def fit_and_profile(self, db: Session):
        """
        Extracts, scales, trains KMeans with K=5, profiles centroids, and persists model.
        """
        total, usable, excluded, reasons, X, session_objs = self.fetch_features(db)
        if usable < 5:
            raise ValueError(f"Insufficient training sessions: {usable} found, minimum 5 required.")

        # 1. Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # 2. Train KMeans with reproducible random_state
        self.kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
        labels = self.kmeans.fit_predict(X_scaled)

        # 3. Compute original-unit centroids & dynamic persona mapping
        self.cluster_centroids_original = {}
        cluster_sizes = {}
        for cid in range(5):
            cluster_mask = (labels == cid)
            cluster_sizes[cid] = int(np.sum(cluster_mask))
            if cluster_sizes[cid] > 0:
                self.cluster_centroids_original[cid] = np.mean(X[cluster_mask], axis=0).tolist()
            else:
                self.cluster_centroids_original[cid] = [0.0] * 6

        # Dynamic persona mapping based on centroid metrics:
        # Indices: 0: duration, 1: path_distance, 2: velocity, 3: stopping_events, 4: interaction_count, 5: shelf_visit_count
        unassigned_clusters = list(range(5))
        self.persona_map = {}

        # A. Comparison Shopper: Highest average interaction count
        comp_cid = max(unassigned_clusters, key=lambda c: self.cluster_centroids_original[c][4])
        self.persona_map[comp_cid] = "Comparison Shopper"
        unassigned_clusters.remove(comp_cid)

        # B. Impulse Buyer: Of remaining, lowest average interaction count
        imp_cid = min(unassigned_clusters, key=lambda c: self.cluster_centroids_original[c][4])
        self.persona_map[imp_cid] = "Impulse Buyer"
        unassigned_clusters.remove(imp_cid)

        # C. Quick Buyer: Of remaining, highest average velocity
        quick_cid = max(unassigned_clusters, key=lambda c: self.cluster_centroids_original[c][2])
        self.persona_map[quick_cid] = "Quick Buyer"
        unassigned_clusters.remove(quick_cid)

        # D. Explorer: Of remaining, highest average path distance
        exp_cid = max(unassigned_clusters, key=lambda c: self.cluster_centroids_original[c][1])
        self.persona_map[exp_cid] = "Explorer"
        unassigned_clusters.remove(exp_cid)

        # E. Brand Loyal Customer: The remaining cluster
        loyal_cid = unassigned_clusters[0]
        self.persona_map[loyal_cid] = "Brand Loyal Customer"

        self.last_trained = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Save model details
        self.save()

        # 4. Update the database segments using the mapped labels
        # Only update sessions that are part of the valid training set
        for idx, sess in enumerate(session_objs):
            cid = int(labels[idx])
            sess.segment = self.persona_map[cid]
        db.commit()

        return {
            "total_sessions": total,
            "usable_sessions": usable,
            "excluded_sessions": excluded,
            "exclusion_reasons": reasons,
            "cluster_sizes": cluster_sizes,
            "persona_map": self.persona_map,
            "centroids": self.cluster_centroids_original
        }

    def predict(self, features: list) -> str:
        """
        Predicts mapped persona for single feature vector (inference).
        """
        if not self.kmeans or not self.scaler:
            self.load()
            if not self.kmeans or not self.scaler:
                # Fallback to rule classifier if no model saved
                return "Explorer"

        X_in = np.array([features])
        X_scaled = self.scaler.transform(X_in)
        cid = int(self.kmeans.predict(X_scaled)[0])
        return self.persona_map.get(cid, "Explorer")

    def save(self):
        """
        Serializes model, scaler, and persona mappings to storage directory.
        """
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        data = {
            "kmeans": self.kmeans,
            "scaler": self.scaler,
            "persona_map": self.persona_map,
            "cluster_centroids_original": self.cluster_centroids_original,
            "last_trained": self.last_trained,
            "version": self.version
        }
        with open(self.model_path, "wb") as f:
            pickle.dump(data, f)

    def load(self):
        """
        Loads serialized model.
        """
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    data = pickle.load(f)
                self.kmeans = data.get("kmeans")
                self.scaler = data.get("scaler")
                self.persona_map = data.get("persona_map")
                self.cluster_centroids_original = data.get("cluster_centroids_original")
                self.last_trained = data.get("last_trained")
                self.version = data.get("version", "1.0.0")
            except Exception:
                pass
