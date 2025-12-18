const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', apiRoutes);

app.listen(port, () => {
    console.log(`Track Star server running on port ${port}`);
});
