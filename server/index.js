const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// In-memory mock DB
let currentWeek = [];

// Helper to generate initial week
const generateWeek = () => {
    const today = new Date();
    // Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);

        week.push({
            id: `day-${i}`,
            date: d.toISOString(),
            dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
            plannedActivity: "Plan",
            isRestDay: false,
            status: 'pending',
            extras: []
        });
    }
    return week;
};

// Initialize
currentWeek = generateWeek();

app.get('/api/week', (req, res) => {
    res.json(currentWeek);
});

app.post('/api/day/:id', (req, res) => {
    const { id } = req.params;
    const updatedDay = req.body;

    const index = currentWeek.findIndex(d => d.id === id);
    if (index !== -1) {
        currentWeek[index] = { ...currentWeek[index], ...updatedDay };
        res.json(currentWeek[index]);
    } else {
        res.status(404).json({ error: "Day not found" });
    }
});

app.listen(port, () => {
    console.log(`Track Star server running on port ${port}`);
});
