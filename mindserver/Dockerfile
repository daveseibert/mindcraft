# Build stage
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy config files
COPY tsconfig.json tsoa.json ./

# Create required directories
# RUN mkdir -p src/services src/routes src/controllers public

# Copy source files
COPY src/ ./src/
COPY src/public/ ./public/

# Build
RUN npm run build


# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
