FROM ubuntu:20.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Update and install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    wget \
    --no-install-recommends

# Add Node.js repository and install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxss1 \
    libxrandr2 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    libgbm1 \
    fonts-liberation \
    --no-install-recommends

# Install Chrome instead of Chromium (more reliable in Docker)
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*
    
# Create app directory
WORKDIR /app

# Copy package files only (not the whole directory)
COPY package.json pnpm-lock.yaml ./

# Install dependencies inside the container
RUN pnpm install --frozen-lockfile

# Copy source code separately (excluding node_modules)
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript code
RUN pnpm exec tsc

# Create temp directory for PDF generation
RUN mkdir -p temp && chmod -R 777 temp

# Set environment variables
ENV NODE_ENV=production

# Point Puppeteer to the Chrome executable instead of Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Run the application
CMD ["node", "dist/index.js"]
