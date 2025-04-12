# Use Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies including Playwright requirements
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    wget

# Set Playwright configs
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install dependencies first (including tsx and typescript)
COPY package*.json ./
RUN npm install
RUN npm install -g tsx typescript

# Copy source code
COPY . .

# Start development server
CMD ["npm", "run", "dev"]
