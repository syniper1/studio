# Use a full-featured base image to ensure all native dependencies are available.
FROM node:20-bullseye

WORKDIR /app

# Copy package files and install ALL dependencies (including dev) to be safe.
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
