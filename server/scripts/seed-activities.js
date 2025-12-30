const prisma = require('../src/db/prisma');

const defaultActivities = [
    { name: 'Running', icon: '🏃' },
    { name: 'Weightlifting', icon: '🏋️' },
    { name: 'Yoga', icon: '🧘' },
    { name: 'Cycling', icon: '🚲' },
    { name: 'Swimming', icon: '🏊' },
    { name: 'Walking', icon: '🚶' },
    { name: 'Basketball', icon: '🏀' },
    { name: 'Soccer', icon: '⚽' },
    { name: 'Tennis', icon: '🎾' },
    { name: 'Hiking', icon: '🥾' },
    { name: 'CrossFit', icon: '⚔️' },
    { name: 'Pilates', icon: '🤸' },
    { name: 'Boxing', icon: '🥊' },
    { name: 'Rowing', icon: '🚣' },
    { name: 'Climbing', icon: '🧗' },
    { name: 'HIIT', icon: '⚡' },
    { name: 'Dancing', icon: '💃' },
    { name: 'Surfing', icon: '🏄' },
    { name: 'Skating', icon: '🛼' },
    { name: 'Golf', icon: '⛳' },
    { name: 'Stretching', icon: '🙆' },
    { name: 'Badminton', icon: '🏸' }
];

async function seed() {
    console.log('Seeding default activities...');

    for (const activity of defaultActivities) {
        // Manual upsert because Prisma doesn't like null in composite unique find
        const existing = await prisma.activityType.findFirst({
            where: {
                name: activity.name,
                userId: null
            }
        });

        if (existing) {
            await prisma.activityType.update({
                where: { id: existing.id },
                data: { icon: activity.icon }
            });
        } else {
            await prisma.activityType.create({
                data: {
                    name: activity.name,
                    icon: activity.icon,
                    userId: null
                }
            });
        }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
});
