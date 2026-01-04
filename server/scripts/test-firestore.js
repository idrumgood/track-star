const { Firestore } = require('@google-cloud/firestore');
require('dotenv').config();

console.log('--- Firestore Diagnostics ---');
console.log('Environment Variables:');
console.log('  GOOGLE_CLOUD_PROJECT:', process.env.GOOGLE_CLOUD_PROJECT || 'NOT SET');
console.log('  FIRESTORE_DATABASE_ID:', process.env.FIRESTORE_DATABASE_ID || '(default)');
console.log('  GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT SET (SDK will use default path)');

const db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)'
});

async function runDiagnostics() {
    try {
        console.log('\nAttempting to list collections in database...');
        const collections = await db.listCollections();
        console.log('SUCCESS: Successfully connected and listed collections.');
        console.log('Collections found:', collections.map(c => c.id));
    } catch (error) {
        console.error('\nFAILURE: Connection failed.');
        console.error('Error Code:', error.code);
        console.error('Error Details:', error.details);
        console.error('Full Error Message:', error.message);

        if (error.message.includes('data access is disabled')) {
            console.log('\n--- Troubleshooting Tips ---');
            console.log('1. Verify you are using the correct project ID. Is it track-star-481601?');
            console.log('2. Ensure "Cloud Firestore API" is enabled for THIS specific project.');
            console.log('3. If using WSL, run "gcloud auth application-default login" INSIDE your WSL terminal.');
            console.log('4. Ensure the database "track-star" was created in "Native Mode" and not "Datastore Mode".');
        }
    }
}

runDiagnostics();
