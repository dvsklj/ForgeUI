# Forge Server — Docker Image
# Usage: docker build -t forge-server . && docker run -p 3000:3000 forge-server

FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Copy only what we need
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/server ./src/server

# Data directory for SQLite
RUN mkdir -p /data
ENV FORGEUI_DB_PATH=/data/forge.db

EXPOSE 3000

# Non-root user
RUN addgroup -S forge && adduser -S forge -G forge
RUN chown -R forge:forge /data
USER forge

CMD ["node", "dist/forgeui-server.js", "--port", "3000", "--db", "/data/forge.db"]
