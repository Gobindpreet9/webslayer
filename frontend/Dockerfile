# Build stage
FROM node:20-slim as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Development stage
FROM node:20-slim

WORKDIR /app

# Copy package files and installed dependencies
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy source files
COPY . .

EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]