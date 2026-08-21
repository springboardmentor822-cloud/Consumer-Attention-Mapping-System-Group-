# Cloud Deployment & Containerization Guide
**System**: AI-Powered Consumer Attention Intelligence Platform  
**Target Infrastructure**: AWS (Amazon Web Services) / Microsoft Azure / Docker Orchestration

---

## 1. Local & On-Premise Docker Compose Orchestration

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+
- Minimum Server Hardware: 4 CPU Cores, 16 GB RAM, NVIDIA GPU (Optional for YOLO acceleration)

### Step-by-Step Execution
1. Clone repository and navigate to root directory:
   ```bash
   git clone <REPOSITORY_URL>
   cd "Parvath infosys"
   ```

2. Seed initial PostgreSQL database schema and user credentials:
   ```bash
   python backend/scripts/seed.py
   ```

3. Launch multi-container stack in daemon mode:
   ```bash
   docker-compose up -d --build
   ```

4. Verify status of active containers:
   ```bash
   docker-compose ps
   ```

5. Access applications:
   - **Frontend UI Console**: `http://localhost:3000`
   - **FastAPI OpenAPI Specification**: `http://localhost:8000/docs`
   - **Health Telemetry Check**: `http://localhost:8000/health`

---

## 2. Cloud Infrastructure Architecture (AWS / Azure)

### Cloud Architecture Diagram
```
                     +---------------------------------------+
                     |         Cloudflare / AWS CloudFront   |
                     +-------------------+-------------------+
                                         |
                                         v
                     +-------------------+-------------------+
                     |           Application Load Balancer    |
                     +---------+-------------------+---------+
                               |                   |
            +------------------+                   +------------------+
            v                                                         v
+-----------+-----------+                                 +-----------+-----------+
|  Frontend Container   |                                 |   FastAPI Backend Cluster |
|   (AWS ECS / Fargate) |                                 |    (AWS ECS / Fargate)    |
+-----------------------+                                 +-----------+-----------+
                                                                      |
                                         +----------------------------+----------------------------+
                                         v                                                         v
                             +-----------+-----------+                                 +-----------+-----------+
                             |   PostgreSQL RDS DB   |                                 | Amazon S3 / Blob Storage  |
                             |   (TimeScaleDB)       |                                 | (Raw Videos/Export Files) |
                             +-----------------------+                                 +-----------------------+
```

---

## 3. Cloud Object Storage Integration (AWS S3 / Azure Blob)

### AWS S3 Configuration
- **Bucket Name**: `retail-attention-intelligence-bucket`
- **Prefix Structure**:
  - `videos/raw/` -> Video stream snapshots & RTSP clips.
  - `exports/reports/` -> Generated CSV, Excel, and PDF operational reports.
  - `exports/heatmaps/` -> Rendered high-resolution spatial heatmap overlays.

---

## 4. Continuous Integration & Deployment (CI/CD)

The project includes an automated GitHub Actions pipeline (`.github/workflows/deploy.yml`):
1. **Automated Testing Stage**: Executes `pytest backend/tests/test_end_to_end.py` and `pytest backend/tests/test_security_audit.py`.
2. **Performance Audit Stage**: Runs `python backend/scripts/benchmark.py` to ensure latency stays < 50ms.
3. **Container Build & Push**: Compiles backend & frontend Docker images and pushes to GitHub Container Registry (`ghcr.io`).
4. **Cloud Production Deployment**: Triggers automated rolling updates on AWS ECS / Azure Container Apps.
