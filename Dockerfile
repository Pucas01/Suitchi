# -------- Stage 1: Build frontend --------
FROM node:24.8.0 AS frontend-build

WORKDIR /app/src/app

# Copy frontend package files and install dependencies
COPY src/app/package*.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source and build Next.js
COPY src/app/ ./
RUN npm run build

# -------- Stage 2: Build backend --------
FROM node:24.8.0 AS backend-build

WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy backend package and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --legacy-peer-deps

# Copy backend source code
COPY backend/ ./backend/

# Copy frontend build from previous stage
COPY --from=frontend-build /app/src/app/.next ./src/app/.next
COPY --from=frontend-build /app/src/app/public ./src/app/public
COPY --from=frontend-build /app/src/app/package.json ./src/app/package.json

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Install pm2 to run both servers
RUN npm install -g pm2

# Start both servers with pm2
# Using ecosystem file ensures both backend and frontend run properly
COPY ecosystem.config.js ./

CMD ["pm2-runtime", "ecosystem.config.js"]
