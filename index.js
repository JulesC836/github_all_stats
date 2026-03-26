const express = require('express');
const { fetchGitHubData } = require('./src/fetcher');
const { generateSVG } = require('./src/svg-generator');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api', async (req, res) => {
    const username = req.query.username;
    
    if (!username) {
        return res.status(400).send('Please provide a username, e.g., ?username=raghu24k');
    }

    try {
        const data = await fetchGitHubData(username);
        const svg = await generateSVG(data);

        res.setHeader('Content-Type', 'image/svg+xml');
        // Tell GitHub/browsers to cache for 15 minutes max
        res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600');
        res.send(svg);
    } catch (error) {
        res.status(500).send(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><text x="10" y="50" fill="red">${error.message}</text></svg>`);
    }
});

app.get('/', (req, res) => {
    res.send('GitHub Stats API is running. Use /api?username=YOUR_USERNAME to get your stats SVG.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
