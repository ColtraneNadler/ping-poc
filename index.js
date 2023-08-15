"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const querystring_1 = __importDefault(require("querystring"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let accessToken = req.headers['Authorization'];
    const userResponse = yield axios_1.default.get('https://auth.pingone.com/f5561d77-6f62-4dd3-b7d9-581d9aa5ffaa/as/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = userResponse.data;
    req.user = user;
    if (req.user) {
        next();
    }
    else {
        res.redirect('/login'); // Redirect to the login page
    }
});
// Endpoint for initiating the authentication flow
app.get('/auth/ping', (req, res) => {
    const redirectUri = process.env.BASE_URL + '/auth/ping/callback';
    const authEndpoint = process.env.ENDPOINT;
    const clientId = process.env.PING_CLIENT_ID; // Replace with your client ID
    const scope = 'openid profile'; // Replace with the required scopes
    const queryParams = querystring_1.default.stringify({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
    });
    const authorizationUrl = `${authEndpoint}?${queryParams}`;
    console.log(authorizationUrl);
    res.redirect(authorizationUrl);
});
app.get('/auth/ping/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenEndpoint = 'https://ping.example.com/as/token.oauth2'; //
    const clientId = process.env.PING_CLIENT_ID;
    const clientSecret = process.env.PING_CLIENT_SECRET;
    const redirectUri = process.env.BASE_URI + '/auth/ping/callback';
    const code = req.query.code;
    const tokenParams = {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
    };
    try {
        // Exchange authorization code for access token
        const response = yield axios_1.default.post(tokenEndpoint, querystring_1.default.stringify(tokenParams));
        const accessToken = response.data.access_token;
        // Handle the access token and perform further actions, such as retrieving user information
        res.send(`Access Token: ${accessToken}`);
    }
    catch (error) {
        console.error('Error fetching access token:', error);
        res.status(500).send('Error fetching access token');
    }
}));
// Example protected route
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.send('Welcome to the Tunecast dashboard!');
});
app.post('/hook', (req, res) => {
    console.log('PAYLOAD', req.body);
    res.status(201).json({ success: true });
});
// Start the server
app.listen(process.env.PORT, () => {
    console.log('Server running on port 3000');
});
