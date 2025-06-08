# Use Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
# ADDED: python3, py3-pip, and the build tools needed by PyMuPDF
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    wget \
    python3 \
    py3-pip \
    g++ \
    make \
    mupdf-dev

# ADDED: Install the Python library using pip, now that the build tools are available
# The --break-system-packages flag is required to bypass the environment protection
RUN pip3 install PyMuPDF --break-system-packages

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