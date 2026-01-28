# Build Stage
FROM node:22-alpine AS build-stage
WORKDIR /app

# Build arguments for Firebase (baked into the frontend at build time)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

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
