# Use official Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for layer caching)
# Note: build context is repo root, so we reference backend/ explicitly
COPY backend/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the backend source code
COPY backend/ .

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
