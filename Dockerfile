# -------- Stage 1: Build frontend --------
FROM node:24.8.0 AS builder

WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy everything (frontend + backend + public)
COPY . .

# Build Next.js frontend
RUN npm run build --prefix src/app

# -------- Stage 2: Runtime --------
FROM node:24.8.0 AS runtime

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app ./

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Install pm2 globally
RUN npm install -g pm2

# Start both servers with pm2
COPY ecosystem.config.js ./
CMD ["pm2-runtime", "ecosystem.config.js"]
