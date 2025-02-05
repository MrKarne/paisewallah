require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
// const { logger } = require('./middleware/logEvents');
// const errorHandler = require('./middleware/errorHandler');
const credentials = require('./middleware/credentials');
const cookieParser = require('cookie-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// const verifyAccessTokenOrRefresh = require('./middleware/checkToken')

const PORT = process.env.PORT || 8080;


// custom middleware logger
// app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json 
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

//serve static files
app.use('/', express.static(path.join(__dirname, '/views')));

const genAI = new GoogleGenerativeAI(process.env.geminiapi); // API key is safe here
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// refer this: https://ai.google.dev/gemini-api/docs#node.js

app.post('/api/gemini', async (req, res) => {
    const prompt = req.body.prompt;
    const modeType = req.body.modeType;
    
    const systemPrompt = "You are a financial assistant. Only answer questions related to finance, investment, money, property, stocks, and cryptocurrency or simply greeting or bye. If a question is unrelated, politely decline to answer. Be concise while answering but answer should not be too short. Answer should be in markdown format.";
    
    try {
        const result = await model.generateContent(systemPrompt+modeType+'\n'+prompt);
        // console.log(result.response.text());
        const text = result.response ? result.response.text() : "No response from AI.";
        res.json({ text });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Gemini API error' });
    }
});

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ "error": "404 Not Found" });
    } else {
        res.type('txt').send("404 Not Found");
    }
});

// app.use(errorHandler);

app.listen(PORT, () => console.log('Server listening on port '+PORT));