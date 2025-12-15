# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./

# --- FORCE A CLEAN INSTALL ---
# Clear the npm cache to prevent using stale, broken packages from previous builds.
RUN npm cache clean --force

# Now install dependencies from scratch
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Create the production server
FROM node:20-slim
WORKDIR /app
COPY package.json ./

# --- FORCE A CLEAN INSTALL on the production image as well ---
RUN npm cache clean --force

# Only install production dependencies
RUN npm install --omit=dev

# Copy built frontend from the builder stage
COPY --from=builder /app/dist ./dist
# Copy the server
COPY server.js .

EXPOSE 8080
CMD ["npm", "start"]
