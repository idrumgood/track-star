# Deployment Guide

This guide explains how to build, run, and deploy the Track Star application using Docker.

## Prerequisites

- **Docker Desktop** (or equivalent Docker engine) installed and running.
- **Google Cloud CLI** (for deployment).

## 1. Build the Docker Image

From the project root directory, run:

```bash
docker build -t track-star .
```

This will:
1.  Build the Vue frontend.
2.  Set up the Node.js backend.
3.  Package everything into a production-ready image.

## 2. Run Locally

To test the container locally:

```bash
docker run -p 3000:3000 track-star
```

- Access the app at `http://localhost:3000`.
- **Note**: Hot reloading (HMR) is disabled in this mode. This mimics the production environment.

### Stopping the Container
- **Foreground**: Press `Ctrl + C`.
- **Background**: Run `docker ps` to get the ID, then `docker stop <CONTAINER_ID>`.

## 3. Deploy to Google Cloud Run

    *(Replace `[PROJECT-ID]` with your Google Cloud project ID)*

1.  **Set the active project** (if not already set):
    ```bash
    gcloud config set project [PROJECT-ID]
    ```

2.  **Tag the image** and submit build to Google Container Registry (GCR):
    ```bash
    gcloud builds submit --tag gcr.io/[PROJECT-ID]/track-star
    ```

2.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy track-star \
      --image gcr.io/[PROJECT-ID]/track-star \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated
    ```

## Troubleshooting

### Error: HTTPError 404: The requested project was not found
- **Cause**: The active `gcloud` configuration is pointing to a different project or the project ID is incorrect.
- **Fix**: Run `gcloud config set project [PROJECT-ID]` to switch to the correct project.

### Error: PERMISSION_DENIED: The caller does not have permission
- **Cause**: Your local authentication credentials may be stale or missing scopes, even if you are an Owner.
- **Fix**: Refresh your credentials by running `gcloud auth login --update-adc`.

