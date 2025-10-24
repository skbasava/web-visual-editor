# Docker Deployment Guide

This guide explains how to deploy the SoC Simulator using Docker containers.

## Architecture

The application uses a **multi-container architecture**:

- **Backend Container**: Python FastAPI server on port 8000
- **Frontend Container**: Nginx serving React app on port 80
- **Network**: Both containers communicate on a Docker bridge network

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Build and Start Containers

```bash
docker-compose up --build
```

This command will:
1. Build the backend Docker image (Python + FastAPI)
2. Build the frontend Docker image (Node.js build + nginx serve)
3. Start both containers
4. Create the `soc-network` bridge network

### 2. Access the Application

Once the containers are running:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000/api
- **API Documentation**: http://localhost:8000/docs
- **WebSocket**: ws://localhost/ws (proxied through nginx)

### 3. Stop Containers

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
```

## Container Details

### Backend Container

**Dockerfile**: `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**Key Features**:
- Based on `python:3.11-slim` for smaller image size
- Hot reload enabled (`--reload`) for development
- Volume mounted for live code updates
- Health check on `/api/health` endpoint

**Ports**:
- Internal: 8000
- External: 8000

### Frontend Container

**Dockerfile**: `frontend/Dockerfile`

Multi-stage build for optimized production image:

**Stage 1: Builder**
- Uses `node:18-alpine` to build React app
- Installs dependencies with `npm ci`
- Copies `.env.docker` for environment configuration
- Builds static assets with `npm run build`

**Stage 2: Production**
- Uses `nginx:alpine` for lightweight web server
- Copies built assets from builder stage
- Uses custom nginx configuration
- Includes health check

**Ports**:
- Internal: 80
- External: 80

### Nginx Configuration

The frontend nginx server (`frontend/nginx.conf`) acts as a reverse proxy:

```nginx
# Proxy WebSocket connections
location /ws {
    proxy_pass http://backend:8000/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Proxy API requests
location /api {
    proxy_pass http://backend:8000/api;
}

# Serve static files
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

This configuration:
1. Routes `/ws` to backend WebSocket endpoint
2. Routes `/api` to backend REST API
3. Serves React static files for all other paths
4. Supports React Router with `try_files`

## Environment Configuration

### Frontend Environment

The frontend uses different configuration for local vs Docker deployment:

**Local Development** (`.env`):
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

**Docker Deployment** (`.env.docker`):
```env
VITE_BACKEND_URL=
VITE_WS_URL=/ws
```

In Docker, the frontend uses **relative URLs** because nginx proxies all requests:
- `/api` → proxied to `http://backend:8000/api`
- `/ws` → proxied to `http://backend:8000/ws`

### Centralized Configuration

All URLs are managed in `frontend/src/config.js`:

```javascript
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
export const API_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
```

This allows the same codebase to work in:
- **Electron mode**: Direct connection to localhost:8000
- **Docker mode**: Proxied through nginx

## Development Workflow

### Local Development (No Docker)

1. Start backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

2. Start frontend:
```bash
cd frontend
npm install
npm run dev
```

### Docker Development

1. Start containers with live reload:
```bash
docker-compose up
```

2. Make code changes - both containers auto-reload:
   - Backend: Volume mounted, uvicorn watches for changes
   - Frontend: For updates, rebuild with `docker-compose up --build frontend`

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Troubleshooting

### Issue: Frontend can't connect to backend

**Symptom**: "Not connected to backend" warning in UI

**Solutions**:
1. Check backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify network: `docker network inspect web-visual-editor_soc-network`
4. Test backend health: `curl http://localhost:8000/api/health`

### Issue: WebSocket connection fails

**Symptom**: WebSocket errors in browser console

**Solutions**:
1. Check nginx proxy configuration in `frontend/nginx.conf`
2. Verify WebSocket URL in browser DevTools Network tab
3. Check backend WebSocket endpoint: `docker-compose logs backend | grep ws`

### Issue: "Module not found" errors in frontend

**Symptom**: Build fails with missing dependencies

**Solutions**:
1. Rebuild frontend container: `docker-compose up --build frontend`
2. Clear Docker cache: `docker-compose build --no-cache frontend`
3. Check `package.json` for missing dependencies

### Issue: Port already in use

**Symptom**: `bind: address already in use`

**Solutions**:
1. Stop conflicting services on ports 80 or 8000
2. Change ports in `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "3000:80"  # Change external port
  backend:
    ports:
      - "8001:8000"  # Change external port
```

## Production Deployment

For production deployment, consider these changes:

### 1. Remove Development Features

**Backend Dockerfile**: Remove `--reload` flag
```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Add Environment Variables

Create `.env` file for docker-compose:
```env
BACKEND_URL=https://your-domain.com
CORS_ORIGINS=["https://your-domain.com"]
```

### 3. Use Secrets for Sensitive Data

```yaml
services:
  backend:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 4. Add HTTPS

Use a reverse proxy like Traefik or nginx with Let's Encrypt:

```yaml
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
```

### 5. Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Health Checks

Both containers include health checks:

**Backend**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

**Frontend**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 5s
```

Check container health:
```bash
docker-compose ps
```

Healthy containers show `healthy` status.

## Docker Commands Reference

```bash
# Build and start
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Remove all containers, networks, and volumes
docker-compose down -v

# Rebuild specific service
docker-compose build --no-cache frontend
```

## File Structure

```
web-visual-editor/
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── .dockerignore           # Exclude from backend image
│   ├── requirements.txt        # Python dependencies
│   └── main.py                 # FastAPI app
├── frontend/
│   ├── Dockerfile              # Frontend multi-stage build
│   ├── .dockerignore           # Exclude from frontend image
│   ├── nginx.conf              # Nginx reverse proxy config
│   ├── .env.docker             # Docker environment vars
│   ├── package.json            # Node dependencies
│   └── src/
│       └── config.js           # Centralized URL configuration
└── docker-compose.yml          # Container orchestration
```

## Summary

The Docker setup provides:
- **Isolated environments** for backend and frontend
- **Easy deployment** with single `docker-compose up` command
- **Development-friendly** with hot reload and volume mounting
- **Production-ready** with multi-stage builds and health checks
- **Flexible configuration** supporting both local and Docker deployments

For questions or issues, refer to the logs and troubleshooting section above.
