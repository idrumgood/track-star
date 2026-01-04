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

To test the container locally, you need to provide your Google Cloud Project ID and authentication. 

### Option A: Using Local Credentials (ADC)
This is the easiest way to test if you have `gcloud` installed locally. 

**Windows (PowerShell):**
```powershell
docker run -p 3000:3000 `
  -v "$env:APPDATA\gcloud:/root/.config/gcloud" `
  -e GOOGLE_CLOUD_PROJECT="your-project-id" `
  -e GOOGLE_CLIENT_ID="your-google-id" `
  track-star
```

**macOS / Linux:**
```bash
docker run -p 3000:3000 \
  -v "$HOME/.config/gcloud:/root/.config/gcloud" \
  -e GOOGLE_CLOUD_PROJECT="your-project-id" \
  -e GOOGLE_CLIENT_ID="your-google-id" \
  track-star
```

### Option B: Using a Service Account Key
If you prefer to use a JSON key file:
1. Place your key in the project root as `key.json`.
2. Run:
```bash
docker run -p 3000:3000 \
  -v "$(pwd)/key.json:/app/key.json" \
  -e GOOGLE_APPLICATION_CREDENTIALS="/app/key.json" \
  -e GOOGLE_CLOUD_PROJECT="your-project-id" \
  -e GOOGLE_CLIENT_ID="your-google-id" \
  track-star
```

- Access the app at `http://localhost:3000`.
- **Note**: Hot reloading (HMR) is disabled in this mode. This mimics the production environment.

### Stopping the Container
- **Foreground**: Press `Ctrl + C`.
- **Background**: Run `docker ps` to get the ID, then `docker stop <CONTAINER_ID>`.

### Local Development

1. **Local Authentication**: Ensure the SDK can access your project:
   ```bash
   gcloud auth application-default login
   ```

2. **Database Creation**: If this is a new project, you MUST create the Firestore database in the console (see section 4).

The application will connect to Firestore in the project specified by the `GOOGLE_CLOUD_PROJECT` environment variable (or your default gcloud project).

## 3. Deploy to Google Cloud Run

    *(Replace `[PROJECT-ID]` with your Google Cloud project ID)*

1.  **Set the active project** (if not already set):
    ```bash
    gcloud config set project [PROJECT-ID]
    ```

2.  **Tag the image** and submit build to Google Cloud Build:
    ```bash
    gcloud builds submit --tag gcr.io/[PROJECT-ID]/track-star
    ```

3.  **Deploy to Cloud Run**:
    Pass the necessary environment variables:

    ```bash
    gcloud run deploy track-star \
      --image gcr.io/[PROJECT-ID]/track-star \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="GOOGLE_CLOUD_PROJECT=[PROJECT-ID],GOOGLE_CLIENT_ID=[GOOGLE-CLIENT-ID]"
    ```

## 4. Google Cloud Console Configuration

After deploying, you must update your Google Cloud Console settings to allow the live URL to use Google Sign-In.

### OAuth 2.0 Client ID
1.  Go to **APIs & Services > Credentials** in the Google Cloud Console.
2.  Edit your **OAuth 2.0 Client ID** used for this app.
3.  Under **Authorized JavaScript origins**, add your Cloud Run URL:
    - `https://track-star-xxxxxx.a.run.app`
4.  (Optional but recommended) Add the same URL to **Authorized redirect URIs**.
5.  Save the changes.

### Firestore Permissions & Setup
1. **Enable the API**: Ensure the **Firestore API** is enabled for your project.
2. **Create the Database**: 
   - Go to **Firestore** in the console.
   - Click **Create Database**.
   - Select **Native Mode** (recommended).
   - Choose a region (e.g., `us-central1`).
   - Use the **(default)** database ID.
3. **IAM Roles**: The Cloud Run service account must have the **Cloud Datastore User** role.


## Troubleshooting

### Error: HTTPError 404: The requested project was not found
- **Cause**: The active `gcloud` configuration is pointing to a different project or the project ID is incorrect.
- **Fix**: Run `gcloud config set project [PROJECT-ID]` to switch to the correct project.

### Error: PERMISSION_DENIED: The caller does not have permission
- **Cause**: Your local authentication credentials may be stale or missing scopes, even if you are an Owner.
- **Fix**: Refresh your credentials by running `gcloud auth login --update-adc`.

