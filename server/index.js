const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', apiRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

app.listen(port, () => {
    console.log(`Track Star server running on port ${port}`);
});
