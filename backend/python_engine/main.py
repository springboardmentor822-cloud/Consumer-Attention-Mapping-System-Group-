import sys
import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Add directory to sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from behavior_engine import behavior_engine
from heatmap_engine import heatmap_engine
from attractiveness_engine import attractiveness_engine
from recommendation_engine import recommendation_engine

app = FastAPI(
  title="CAMS Retail Analytics AI Engine",
  description="Consumer Attention Mapping System - Behavior, Heatmap, Attractiveness, and Recommendation API",
  version="3.0.0"
)

# Enable CORS for React frontend connection
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

class TrackingPoint(BaseModel):
  x: float
  y: float
  t: Optional[float] = None

class TrajectoryRequest(BaseModel):
  shopper_id: str
  points: List[TrackingPoint]
  pickups: Optional[int] = 0
  returns: Optional[int] = 0
  comparisons: Optional[int] = 0

@app.get("/")
def read_root():
  return {
    "system": "Consumer Attention Mapping System (CAMS) Engine",
    "version": "3.0.0",
    "status": "Online",
    "docs_url": "/docs"
  }

@app.get("/api/v1/health")
def health_check():
  return {"status": "healthy", "engine": "CAMS Milestone 3 Platform"}

@app.post("/api/v1/behavior/trajectory")
def calculate_shopper_trajectory(req: TrajectoryRequest):
  pts = [{"x": p.x, "y": p.y, "t": p.t} for p in req.points]
  trajectory = behavior_engine.calculate_trajectory(pts)
  segment = behavior_engine.classify_shopper_segment(trajectory, req.pickups, req.returns, req.comparisons)
  return {
    "shopper_id": req.shopper_id,
    "trajectory": trajectory,
    "segmentation": segment
  }

@app.get("/api/v1/heatmap")
def get_heatmap(
  layer: str = Query("Store Traffic", description="Layer type: Store Traffic, Customer Attention, Product Gaze, Shelf Interaction, Zone Activity"),
  period: str = Query("Last 7 Days", description="Time period filter")
):
  return heatmap_engine.get_heatmap_layer(layer, period)

@app.get("/api/v1/attractiveness/scores")
def get_attractiveness_scores():
  return attractiveness_engine.compute_sku_scores()

@app.get("/api/v1/recommendations")
def get_merchandising_recommendations():
  scores = attractiveness_engine.compute_sku_scores()
  return recommendation_engine.generate_recommendations(scores)

@app.get("/api/v1/dashboards/store-manager")
def get_store_manager_analytics(period: str = Query("Last 7 Days")):
  heatmap_data = heatmap_engine.get_heatmap_layer("Store Traffic", period)
  scores = attractiveness_engine.compute_sku_scores()
  recs = recommendation_engine.generate_recommendations(scores)
  return {
    "period": period,
    "kpis": {
      "totalVisitors": 2450 if period == "Last 7 Days" else 350,
      "avgDwellTime": 18.5,
      "conversionRate": 24.2,
      "productsPicked": 1245
    },
    "heatmap": heatmap_data,
    "attractiveness_scores": scores[:5],
    "recommendations": recs
  }

@app.get("/api/v1/dashboards/retail-analyst")
def get_retail_analyst_analytics(period: str = Query("Last 7 Days")):
  scores = attractiveness_engine.compute_sku_scores()
  return {
    "period": period,
    "segmentation": [
      {"segment": "Explorer", "share": "32%", "count": 784},
      {"segment": "Quick Buyer", "share": "28%", "count": 686},
      {"segment": "Comparison Shopper", "share": "18%", "count": 441},
      {"segment": "Impulse Buyer", "share": "14%", "count": 343},
      {"segment": "Brand Loyal Customer", "share": "8%", "count": 196}
    ],
    "sku_rankings": scores
  }

@app.get("/api/v1/dashboards/marketing-manager")
def get_marketing_manager_analytics(period: str = Query("Last 7 Days")):
  return {
    "period": period,
    "campaigns": [
      {"name": "Summer Organic Festival", "reach": 4200, "conversion": "32.4%", "roi": "4.2x"},
      {"name": "Bakery Artisan Promo", "reach": 2800, "conversion": "28.6%", "roi": "3.8x"},
      {"name": "Beverages Hydration Hub", "reach": 5100, "conversion": "41.2%", "roi": "5.1x"}
    ]
  }

if __name__ == "__main__":
  import uvicorn
  uvicorn.run(app, host="0.0.0.0", port=8000)
