// handler.js (the new entry point for AWS Lambda)

// 1. Import your existing Express application
const app = require('./app');

// 2. Import the serverless wrapper
const serverless = require('serverless-http');

// 3. Export the handler function for Lambda to invoke
module.exports.handler = serverless(app);
    
