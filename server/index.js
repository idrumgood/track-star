const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// In-memory mock DB
// Map<string, Array> where key is Monday's date YYYY-MM-DD
const weeks = new Map();

// Helper: Get Monday of a date
const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

// Helper: Generate ID from date YYYY-MM-DD (Local)
const generateId = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Helper: Generate week for a specific monday
const generateWeek = (mondayDate) => {
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        const id = generateId(d);

        week.push({
            id: id,
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

app.get('/api/week', (req, res) => {
    // Client sends ?date=... or we use today
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const monday = getMonday(targetDate);
    const key = generateId(monday);

    if (!weeks.has(key)) {
        weeks.set(key, generateWeek(monday));
    }

    res.json(weeks.get(key));
});

app.post('/api/day/:id', (req, res) => {
    const { id } = req.params; // id is YYYY-MM-DD
    const updatedDay = req.body;

    // Find which week this day belongs to
    // Parse ID YYYY-MM-DD as local date to avoid UTC shifts
    const [y, m, d] = id.split('-').map(Number);
    const dayDate = new Date(y, m - 1, d);

    const monday = getMonday(dayDate);
    const key = generateId(monday);

    if (weeks.has(key)) {
        const week = weeks.get(key);
        const index = week.findIndex(d => d.id === id);

        if (index !== -1) {
            week[index] = { ...week[index], ...updatedDay };
            res.json(week[index]);
        } else {
            res.status(404).json({ error: "Day not found in week" });
        }
    } else {
        res.status(404).json({ error: "Week not found" });
    }
});

app.listen(port, () => {
    console.log(`Track Star server running on port ${port}`);
});
