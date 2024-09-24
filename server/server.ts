const express = require('express');
const ngrok = require('ngrok');
const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/heart', (req, res) => {
    const heartData = req.body;

    console.log('Heart data received:', heartData);

    res.status(200).json({ message: 'Heart data received successfully', data: heartData });
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        const url = await ngrok.connect(PORT);
        console.log(`Ngrok tunnel created: ${url}`);
    } catch (error) {
        console.error('Error starting ngrok:', error);
    }
});