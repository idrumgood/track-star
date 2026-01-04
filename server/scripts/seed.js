const { Firestore } = require('@google-cloud/firestore');
require('dotenv').config();

const db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)'
});

const defaultActivities = [
    { name: 'Running', icon: '🏃' },
    { name: 'Cycling', icon: '🚴' },
    { name: 'Swimming', icon: '🏊' },
    { name: 'Gym', icon: '🏋️' },
    { name: 'Yoga', icon: '🧘' },
    { name: 'Walking', icon: '🚶' },
    { name: 'Hiking', icon: '🥾' },
    { name: 'Pilates', icon: '🤸' },
    { name: 'Basketball', icon: '🏀' },
    { name: 'Soccer', icon: '⚽' },
    { name: 'Tennis', icon: '🎾' },
    { name: 'Boxing', icon: '🥊' },
    { name: 'Bouldering', icon: '🧗' },
    { name: 'Dancing', icon: '💃' },
    { name: 'Diving', icon: '🤿' },
    { name: 'Fencing', icon: '🤺' },
    { name: 'Golf', icon: '🏌️' },
    { name: 'Horseback Riding', icon: '🏇' },
    { name: 'Ice Hockey', icon: '🏒' },
    { name: 'Judo', icon: '🥋' },
    { name: 'Karate', icon: '🥋' },
    { name: 'Kendo', icon: '🥋' },
    { name: 'Kickboxing', icon: '🥊' },
    { name: 'Kung Fu', icon: '🥋' },
    { name: 'Martial Arts', icon: '🥋' },
    { name: 'Meditation', icon: '🧘' },
    { name: 'Muay Thai', icon: '🥊' },
    { name: 'Racquetball', icon: '🎾' },
    { name: 'Rock Climbing', icon: '🧗' },
    { name: 'Rowing', icon: '🚣' },
    { name: 'Sailing', icon: '⛵' },
    { name: 'Skiing', icon: '⛷' },
    { name: 'Snowboarding', icon: '🏂' },
    { name: 'Surfing', icon: '🏄' },
    { name: 'Table Tennis', icon: '🏓' },
    { name: 'Taekwondo', icon: '🥋' },
    { name: 'Tennis', icon: '🎾' },
    { name: 'Volleyball', icon: '🏐' },
    { name: 'Water Polo', icon: '🤽' },
    { name: 'Wrestling', icon: '🤿' },
    { name: 'Yoga', icon: '🧘' },
    { name: 'Zumba', icon: '💃' }
];

async function seed() {
    console.log('--- Seeding Default Activities ---');
    try {
        const batch = db.batch();
        const collectionRef = db.collection('activity_types');

        for (const activity of defaultActivities) {
            const docRef = collectionRef.doc(); // Auto-generated ID
            batch.set(docRef, activity);
            console.log(`Adding: ${activity.name}`);
        }

        await batch.commit();
        console.log('SUCCESS: Default activities seeded successfully!');
    } catch (error) {
        console.error('FAILURE: Seeding failed.', error);
    }
}

seed();
