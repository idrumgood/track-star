# Build Stage
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Production Stage
FROM node:22-alpine AS production-stage
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ .

# Copy built assets from build-stage to expected location
# We are currently in /app/server
# The server expects ../client/dist
# So we copy to /app/client/dist
COPY --from=build-stage /app/dist ../client/dist

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "index.js"]
