# Use Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies including Chromium
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    wget \
    python3 \
    py3-pip \
    g++ \
    make \
    mupdf-dev \
    ttf-freefont \
    fontconfig \
    xvfb \
    dbus \
    mesa-gl \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates

# Install Python library
RUN pip3 install PyMuPDF --break-system-packages

# Install Node.js dependencies first
COPY package*.json ./
RUN npm install
RUN npm install -g tsx typescript

# Copy source code
COPY . .

# Start development server
CMD ["npm", "run", "dev"]
