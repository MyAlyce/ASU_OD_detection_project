const express = require('express');
const ngrok = require('ngrok');
const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/post', (req, res) => {
    const data = req.body;
    // Process stuff here
    console.log(`Received data: ${JSON.stringify(data)}`);
    res.status(200).json({ message: 'Received data received successfully', data });
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        const url = await ngrok.connect(PORT);
        console.log(`Ngrok tunnel created: ${url}`);
    } catch (error) {
        console.error(`Error starting ngrok: ${error}`)
    }
});