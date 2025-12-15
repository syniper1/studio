# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Create the production server
FROM node:20-slim
WORKDIR /app
# We need to install all dependencies for the backend, including @google-cloud/aiplatform
COPY package.json ./
RUN npm install --omit=dev

# Copy built frontend from the builder stage
COPY --from=builder /app/dist ./dist
# Copy server file
COPY server.js .

# Expose the port the app runs on
EXPOSE 8080

# Set the entrypoint
CMD ["npm", "start"]
