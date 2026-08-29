FROM node:18-slim

WORKDIR /app

# Copy root files
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/

# Install dependencies
RUN npm install --no-bin-links
RUN cd server && npm install --no-bin-links
RUN cd web && npm install --no-bin-links

# Copy source
COPY . .

# Build frontend
RUN cd web && npm run build

# Start server
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
