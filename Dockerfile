# -------- Stage 1: Build frontend --------
FROM node:24.8.0 AS builder

WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy full project
COPY . .

# Build Next.js frontend (root package.json, frontend in src/app)
RUN npx next build src/app

# -------- Stage 2: Runtime --------
FROM node:24.8.0 AS runtime

WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Install pm2 globally
RUN npm install -g pm2

# Copy ecosystem config
COPY ecosystem.config.js ./

# Start both servers
CMD ["pm2-runtime", "ecosystem.config.js"]
