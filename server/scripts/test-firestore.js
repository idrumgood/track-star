require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');

async function testFirestore() {
    console.log("Testing Firestore connection using environment variables...");
    const db = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
        databaseId: process.env.FIRESTORE_DATABASE_ID
    });

    try {
        const testRef = db.collection('test').doc('connection-test');
        await testRef.set({
            timestamp: new Date().toISOString(),
            message: "Firestore is working with specific config!"
        });
        console.log("Write successful.");

        const doc = await testRef.get();
        if (doc.exists) {
            console.log("Read successful:", doc.data());
        } else {
            console.error("Read failed: Document does not exist.");
        }

        await testRef.delete();
        console.log("Delete successful.");
        console.log("Firestore verification COMPLETE.");
    } catch (error) {
        console.error("Firestore verification FAILED:", error);
        console.log("\nDetails:");
        console.log(`- Project ID: ${process.env.GOOGLE_CLOUD_PROJECT}`);
        console.log(`- Database ID: ${process.env.FIRESTORE_DATABASE_ID}`);
        if (error.code === 5) {
            console.log("- Error Code 5 (NOT_FOUND): This usually means the project or database ID is incorrect, or the database hasn't been created yet.");
        }
    }
}

testFirestore();
