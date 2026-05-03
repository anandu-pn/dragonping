# =============================================================================
# Stage 1: Build the React frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install dependencies first (layer cache friendly)
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Set API URL to relative path so nginx proxies it correctly.
# This avoids hardcoding any IP — works regardless of where the HPC is.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# =============================================================================
# Stage 2: Serve the built app with nginx on port 7190
# =============================================================================
FROM nginx:alpine

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 7190

CMD ["nginx", "-g", "daemon off;"]
