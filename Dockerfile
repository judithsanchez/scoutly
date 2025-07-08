# Use a Debian-based Node.js image for better ARM compatibility
FROM node:20-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies including Chromium using Debian's package manager
RUN apt-get update && apt-get install -y \
    chromium \
    wget \
    python3 \
    python3-pip \
    g++ \
    make \
    libmupdf-dev \
    # Font and graphics libraries for headless Chromium
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libexpat1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libasound2 \
    # Clean up the cache to keep the image smaller
    && rm -rf /var/lib/apt/lists/*

# Symlink chromium-browser to chromium for compatibility with scraping libraries
RUN ln -s /usr/bin/chromium /usr/bin/chromium-browser || true

# Install Python library
RUN pip3 install PyMuPDF==1.24.1 --break-system-packages

# Install Node.js dependencies first
COPY package*.json ./
RUN npm install
RUN npm install -g tsx typescript

# Copy source code
COPY . .

# Copy .env for build-time environment variables
COPY .env .env

# Build Next.js app for production (only if not in dev)
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN if [ "$NODE_ENV" != "development" ]; then npm run build; fi

# Start server: dev or prod based on NODE_ENV
CMD [ "sh", "-c", "if [ \"$NODE_ENV\" = 'development' ]; then npm run dev; else npm run start; fi" ]
