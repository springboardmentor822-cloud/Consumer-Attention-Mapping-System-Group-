# Deployment Guide - Consumer Attention Mapping System

This guide outlines step-by-step instructions for deploying CAMS locally, containerized via Docker Compose, and deploying to AWS or Azure cloud environments.

---

## 1. Local Development Setup

1. **Clone Repository & Copy Environment**:
   ```bash
   cp .env.example .env
   ```

2. **Initialize Database & Start FastAPI Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   python reinit_db.py
   uvicorn app.main:app --reload --port 8000
   ```

3. **Start React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 2. Docker Compose Stack Deployment

Run full containerized stack (PostgreSQL, Redis, FastAPI, Nginx Frontend):

```bash
docker compose up --build -d
```

### Checking Services Health
```bash
docker compose ps
curl http://localhost:8000/health
```

---

## 3. AWS Cloud Deployment (ECS / EC2 / RDS / S3)

### Storage Infrastructure (AWS S3)
Create an S3 bucket for storing raw uploaded videos, processed annotated feeds, and generated PDF/Excel reports:
- Bucket Name: `cams-retail-analytics-media-bucket`
- Encryption: AES-256 enabled
- Block Public Access: Enabled (Presigned URLs or CloudFront distribution for access)

### Compute Infrastructure (AWS ECS Fargate / EC2)
1. **Build and Push Container Images to Amazon ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com
   docker tag cams-backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/cams-backend:latest
   docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/cams-backend:latest
   ```

2. **Deploy Task Definitions & Services**:
   - Launch ECS Task Definition with `cams-backend` and `cams-frontend` containers.
   - Configure AWS Application Load Balancer (ALB) listening on ports 80 and 443 with SSL/TLS certificate.

3. **Database Setup (AWS RDS PostgreSQL)**:
   - Provision PostgreSQL 16 DB instance.
   - Set `DATABASE_URL` secret in AWS Secrets Manager.

*Note: Deployment configuration is ready, but final cloud deployment requires cloud account credentials/access.*
