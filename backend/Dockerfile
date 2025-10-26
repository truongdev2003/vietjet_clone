# Backend Dockerfile
FROM node:18-alpine

# Cài đặt các dependencies cần thiết cho Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set environment variables cho Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Tạo thư mục làm việc
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Tạo thư mục logs và uploads nếu chưa có
RUN mkdir -p logs uploads/avatars uploads/documents uploads/temp

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
