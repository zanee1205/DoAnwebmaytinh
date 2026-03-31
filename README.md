# Zanee Store

Zanee Store is a full-stack demo e-commerce project for computers and PC parts.

Core stack:
- Frontend: React
- Backend: Express
- Database: SQL Server
- Cloud deployment: Fly.io
- Containerization: Docker
- CRM / cloud integration: Salesforce

## Deployment model

The project is now prepared for a simple real-world cloud deployment:
- one Docker image builds the React frontend and the Express backend
- Fly.io runs the public application
- Salesforce is used as the cloud integration target
- SQL Server remains the source-of-truth database

This keeps the submission aligned with the teacher's request for:
- deployment to a real cloud environment
- Docker-based packaging
- integration with a platform in the suggested cloud ecosystem

## Main files

- `Dockerfile`: builds the full-stack production image
- `fly.toml`: Fly.io app configuration
- `docker-compose.yml`: local full-stack container run with SQL Server
- `README_DEPLOY.md`: step-by-step deployment guide
- `DEPLOY_CLOUD.md`: teacher-facing cloud submission checklist

## Local development

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Frontend can use `frontend/.env.example` as a starting point for local API configuration.
