const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)'
});

module.exports = db;
