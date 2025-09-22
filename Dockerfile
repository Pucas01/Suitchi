# -------- Stage 1: Install & Build frontend --------
FROM node:24.8.0 AS frontend-build

WORKDIR /app

# Copy root package files and install all dependencies (backend + frontend)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the full project (backend + frontend)
COPY . .

# Build Next.js frontend
WORKDIR /app/src/app
RUN npm run build

# -------- Stage 2: Runtime --------
FROM node:24.8.0 AS runtime

WORKDIR /app

# Copy only what's needed for runtime
COPY --from=frontend-build /app/backend ./backend
COPY --from=frontend-build /app/.next ./.next
COPY --from=frontend-build /app/public ./public
COPY --from=frontend-build /app/package*.json ./

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Install pm2 globally
RUN npm install -g pm2

# Copy pm2 ecosystem config
COPY ecosystem.config.js ./

# Start both backend + frontend
CMD ["pm2-runtime", "ecosystem.config.js"]
