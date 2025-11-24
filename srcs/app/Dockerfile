FROM node:18-alpine

# Install build dependencies for sqlite3
RUN apk add --no-cache python3 make g++

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies including dev dependencies for build
RUN npm install && \
    npm cache clean --force

# Copy tsconfig for build
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]