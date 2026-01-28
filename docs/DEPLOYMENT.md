# Deployment Guide

This guide explains how to build, run, and deploy the Track Star application using Docker and Firebase.

## Prerequisites

- **Docker Desktop** (or equivalent Docker engine) installed and running.
- **Google Cloud CLI** (for deployment).
- **Firebase Project** set up ([PROJECT-ID]).

## 1. Build the Docker Image

The frontend uses Vite, which requires environment variables to be available at **build time**. You must pass these as build arguments:

```bash
docker build -t track-star \
  --build-arg VITE_FIREBASE_API_KEY="your-api-key" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="[PROJECT-ID].firebaseapp.com" \
  --build-arg VITE_FIREBASE_PROJECT_ID="[PROJECT-ID]" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="[PROJECT-ID].firebasestorage.app" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  --build-arg VITE_FIREBASE_APP_ID="your-app-id" \
  --build-arg VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id" .
```

## 2. Run Locally

To test the container locally, you need to provide your Google Cloud Project ID and authentication (for the backend Admin SDK).

### Option A: Using Local Credentials (ADC)

**Windows (PowerShell):**
```powershell
docker run -p 3000:3000 `
  -v "$env:APPDATA\gcloud:/root/.config/gcloud" `
  -e GOOGLE_CLOUD_PROJECT="[PROJECT-ID]" `
  track-star
```

**macOS / Linux:**
```bash
docker run -p 3000:3000 \
  -v "$HOME/.config/gcloud:/root/.config/gcloud" \
  -e GOOGLE_CLOUD_PROJECT="[PROJECT-ID]" \
  track-star
```

### Option B: Using a Service Account Key
1. Place your key in the project root as `key.json`.
2. Run:
```bash
docker run -p 3000:3000 \
  -v "$(pwd)/key.json:/app/key.json" \
  -e GOOGLE_APPLICATION_CREDENTIALS="/app/key.json" \
  -e GOOGLE_CLOUD_PROJECT="[PROJECT-ID]" \
  track-star
```

- Access the app at `http://localhost:3000`.

## 3. Deploy to Google Cloud Run

To deploy to Cloud Run, use Google Cloud Build to handle the build-time arguments.

1.  **Set the active project**:
    ```bash
    gcloud config set project [PROJECT-ID]
    ```

2.  **Submit to Cloud Build**:
    You must use the `cloudbuild.yaml` file and pass the variables via `--substitutions`:

    ```bash
    gcloud builds submit --config cloudbuild.yaml \
      --substitutions=_VITE_FIREBASE_API_KEY="your-api-key",_VITE_FIREBASE_AUTH_DOMAIN="[PROJECT-ID].firebaseapp.com",_VITE_FIREBASE_PROJECT_ID="[PROJECT-ID]",_VITE_FIREBASE_STORAGE_BUCKET="[PROJECT-ID].firebasestorage.app",_VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id",_VITE_FIREBASE_APP_ID="your-app-id",_VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
    ```

3.  **Deploy to Cloud Run**:
    The backend only needs the `GOOGLE_CLOUD_PROJECT` ID.

    ```bash
    gcloud run deploy track-star \
      --image gcr.io/[PROJECT-ID]/track-star \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="GOOGLE_CLOUD_PROJECT=[PROJECT-ID]"
    ```

## 4. Console Configuration

### Firebase Console (Authentication)
1.  Go to **Authentication > Sign-in method**.
2.  Enable **Email/Password** and **Google**.
3.  Go to **Settings > Authorized domains** and add:
    - `localhost`
    - `track-star-xxxxxx.a.run.app` (your Cloud Run URL)

### Google Cloud Console (OAuth)
1.  Go to **APIs & Services > Credentials**.
2.  Edit your **Web client** OAuth 2.0 Client ID.
3.  Add the Firebase Auth handler to **Authorized redirect URIs**:
    - `https://[PROJECT-ID].firebaseapp.com/__/auth/handler`

### Firestore Setup
1. **Enable the API**: Ensure the **Firestore API** and **Identity Toolkit API** are enabled.
2. **Create the Database**: Use **(default)** database ID in **Native Mode**.
3. **IAM Roles**: The Cloud Run service account needs the **Cloud Datastore User** and **Firebase Auth Admin** (or similar) roles.

## Troubleshooting

### Error: auth/configuration-not-found
- **Cause**: Email/Password provider is not enabled in the Firebase Console.
- **Fix**: Enable it under Authentication > Sign-in method.

### Error: auth/unauthorized-domain
- **Cause**: The current domain (e.g., localhost) is not in the Authorized Domains list.
- **Fix**: Add it in Firebase Console > Authentication > Settings.

### Error: redirect_uri_mismatch
- **Cause**: The Firebase OAuth handler URL is not added to the GCP OAuth Client.
- **Fix**: Add `https://[PROJECT-ID].firebaseapp.com/__/auth/handler` to Authorized redirect URIs in GCP Console.
