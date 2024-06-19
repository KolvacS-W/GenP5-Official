const cors = require('cors');
const express = require('express');
const WebSocket = require('ws');
const fal = require('@fal-ai/serverless-client');
const http = require('http');
const app = express();
const bodyParser = require('body-parser');
let lastreq2fal = {};

// Define WebSocket globally
global.WebSocket = WebSocket;

const corsOptions = {
    origin: '*', // Adjust as necessary for security
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const port = process.env.PORT || 3001; // Use environment port or 3001 as fallback

fal.config({
    credentials: 'API_KEY', // Replace with your actual credentials
});

console.log('key loaded');

app.use(express.json());
app.use(bodyParser.json({ limit: '60mb' })); // Increase the payload limit

// Create an HTTP server and wrap the Express app
const server = http.createServer(app);

// Set up the WebSocket server
const wss = new WebSocket.Server({ server });

// Store client requests
const clientRequests = new Map();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

const imageSavePath = './saved_images'; // Set your image save path
let savedImages = [];
var imagenum = 0; // Number of each saved image
let workedidlist = {};
let requestQueue = []; // Initialize the request queue

// Clear saved images when refresh
app.get('/clear-images', async (req, res) => {
    try {
        const files = await readdir(imageSavePath);
        await Promise.all(files.map(file => unlink(path.join(imageSavePath, file))));
        savedImages = []; // Clear the saved images array
        res.send('All images cleared');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error clearing images');
    }
});

app.post('/save-image', async (req, res) => {
    const { imageUrl } = req.body;

    try {
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'stream'
        });

        if (savedImages.length >= 100) {
            let removedImage = savedImages.shift();
            fs.unlink(removedImage, (err) => {
                if (err) console.error("Error deleting old image:", err);
            });
        }

        imagenum += 1;
        const imageName = `image_${imagenum}.jpg`;
        const imagePath = path.join(imageSavePath, imageName);
        response.data.pipe(fs.createWriteStream(imagePath));

        savedImages.push(imagePath);

        res.json({ message: 'Image saved successfully', imageName });
    } catch (error) {
        console.error('Error saving image:', error);
        res.status(500).send('Error saving image');
    }
});

app.use('/saved_images', express.static(imageSavePath));

app.get('/get-smallest-image-number', (req, res) => {
    fs.readdir(imageSavePath, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading image directory');
        }

        let minNumber = files
            .map(file => parseInt(file.match(/\d+/)[0], 10))
            .filter(num => !isNaN(num))
            .reduce((min, num) => num < min ? num : min, Number.MAX_VALUE);

        if (minNumber === Number.MAX_VALUE) minNumber = 0;

        res.json({ minNumber });
    });
});

// Establish a real-time connection with FAL
const falConnection = fal.realtime.connect("110602490-lcm", {
    onResult: (result) => {
        console.log('get result from fal', result.request_id)
        const requestInfo = clientRequests.get(result.request_id);
        if (requestInfo) {
            const response = {
                result: result,
                count: requestInfo.count,
                request_id: result.request_id
            };
            const request_group = parseInt(result.request_id.split('_')[0]);
            const request_id = parseInt(result.request_id.split('_')[1]);
            addItem(workedidlist, request_group, request_id);
            requestInfo.ws.send(JSON.stringify(response));
            console.log('sent to frontend:', requestInfo.request_id);
            clientRequests.delete(result.request_id);
            clearTimeout(requestInfo.timeoutId);
        }
    },
    onError: (error) => {
        console.error('Real-time error:', error);
    }
});

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);

            if (!data.prompt || !data.image_url || !data.request_id) {
                console.error('Bad request: Missing prompt, image URL, or requestId.');
                console.log(data);
                return;
            }

            clientRequests.set(data.request_id, { ws, count: data.count, request_id: data.request_id });
            requestQueue.push(data);

        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed by the front end. Re-initiating and reloading...');
        clientRequests.forEach((requests) => {
            clearTimeout(requests.timeoutId);
        });

        clientRequests.clear();
        requestQueue = [];
        workedidlist = {};
        lastreq2fal = {};
        imagenum = 0;

        console.log(requestQueue);
        console.log(clientRequests);
    });
});

// Function to process the request queue
function processRequestQueue() {
    if (requestQueue.length > 0) {
        const nextRequest = requestQueue[0];
        const request_group = parseInt(nextRequest.request_id.split('_')[0]);
        const request_id = parseInt(nextRequest.request_id.split('_')[1]);
        if (!workedidlist[request_group]) {
            workedidlist[request_group] = [];
        }
        if (request_id === 1 || workedidlist[request_group].includes(request_id - 1)) {
            const data = requestQueue.shift();
            try {
                falConnection.send({
                    prompt: data.prompt,
                    image_url: data.image_url,
                    strength: data.strength,
                    enable_safety_checks: false,
                    seed: Math.random(),
                    num_images: 1,
                    request_id: data.request_id
                });
                console.log('sent to fal:', data.request_id);
                lastreq2fal[request_group] = data;

                const timeoutId = setTimeout(() => {
                    console.log('timeout. put back request to queue', lastreq2fal[request_group].request_id);
                    requestQueue.unshift(lastreq2fal[request_group]);
                    setTimeout(processRequestQueue, 1000); // Add delay to retry
                }, 3000);

                clientRequests.get(data.request_id).timeoutId = timeoutId;
            } catch (error) {
                console.error('Error sending data to FAL:', error.message);
            }
        }
    }
}

setInterval(processRequestQueue, 1000);

function addItem(dict, key, value) {
    if (!(key in dict)) {
        dict[key] = [];
    }
    dict[key].push(value);
}

app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send('Server: Error processing image');
});

server.listen(port, () => {
    console.log(`WebSocket Server: Running on port ${port}`);
});
