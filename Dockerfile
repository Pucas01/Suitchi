# -------- Stage 1: Build frontend --------
FROM node:20 AS frontend-build

WORKDIR /app

# Copy frontend package files and install dependencies
COPY src/app/package*.json ./ 
RUN npm install

# Copy frontend source and build Next.js
COPY src/app/ ./ 
RUN npm run build

# -------- Stage 2: Install backend --------
FROM node:20 AS backend-build

WORKDIR /app

# Copy root and backend package files
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install
RUN cd backend && npm install

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build from previous stage
COPY --from=frontend-build /app/.next ./src/app/.next
COPY --from=frontend-build /app/public ./src/app/public
COPY --from=frontend-build /app/package.json ./src/app/package.json

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Use pm2 to run both servers
RUN npm install -g pm2

# Start both servers
CMD ["pm2-runtime", "start", "backend/server.js", "--name", "backend", "--", "&&", "cd src/app && npm run start --name frontend"]
