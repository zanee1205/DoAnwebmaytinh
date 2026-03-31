FROM node:18-alpine AS frontend-build
WORKDIR /app

# Install frontend deps and build
COPY frontend/package*.json frontend/
RUN npm install --prefix frontend
COPY frontend/ frontend/
RUN npm run --prefix frontend build

FROM node:18-alpine AS backend-build
WORKDIR /app

# Install backend deps
COPY backend/package*.json backend/
RUN npm install --prefix backend --production
COPY backend/ backend/
# Debug: print the db stub contents to verify build context (temporary)
RUN echo '--- BEGIN db.js ---' && cat backend/src/db.js || true && echo '--- END db.js ---'

# Copy built frontend into backend public folder (server will serve it)
COPY --from=frontend-build /app/frontend/build backend/public

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy backend runtime files
COPY --from=backend-build /app/backend /app/backend
COPY --from=backend-build /app/backend/node_modules /app/backend/node_modules
COPY start.sh /app/start.sh

EXPOSE 4000
RUN chmod +x /app/start.sh || true
CMD ["sh", "/app/start.sh"]
