# Use official Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
