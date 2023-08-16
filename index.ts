import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import dotenv from 'dotenv';
dotenv.config()
import {Request,Response,NextFunction} from 'express';

const app = express();

declare namespace Express {
  interface Request {
    user: any
  }
}

const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  let accessToken = req.headers['Authorization'];
	const userResponse = await axios.get('https://auth.pingone.com/f5561d77-6f62-4dd3-b7d9-581d9aa5ffaa/as/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

  const user = userResponse.data;
  req.user = user;

  if (req.user) {
    next();
  } else {
    res.redirect('/login'); // Redirect to the login page
  }
};

// Endpoint for initiating the authentication flow
app.get('/auth/ping', (req, res) => {
  const redirectUri = process.env.BASE_URL + '/auth/ping/callback'; 
  const authEndpoint = process.env.ENDPOINT 
  const clientId = process.env.PING_CLIENT_ID // Replace with your client ID
  const scope = 'openid profile'; // Replace with the required scopes

  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
  });

  const authorizationUrl = `${authEndpoint}?${queryParams}`;
  console.log(authorizationUrl);
  res.redirect(authorizationUrl);
});

app.get('/auth/ping/callback', async (req, res) => {
  const tokenEndpoint = 'https://ping.example.com/as/token.oauth2'; //
  const clientId = process.env.PING_CLIENT_ID; 
  const clientSecret = process.env.PING_CLIENT_SECRET; 
  const redirectUri = process.env.BASE_URI + '/auth/ping/callback'; 

  const code = req.query.code as string;

  const tokenParams = {
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  };

  try {
    // Exchange authorization code for access token
    const response = await axios.post(tokenEndpoint, querystring.stringify(tokenParams));
    const accessToken = response.data.access_token;
    // Handle the access token and perform further actions, such as retrieving user information
    res.send(`Access Token: ${accessToken}`);
  } catch (error) {
    console.error('Error fetching access token:', error);
    res.status(500).send('Error fetching access token');
  }
});

// Example protected route
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.send('Welcome to the Tunecast dashboard!');
});

app.post('/hook', (req, res) => {
  if(!req.headers['authorization'] || req.headers['authorization'] !== 'Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInVzZXJuYW1lIjoibmFyYXlhbiIsImlhdCI6MTY5MjE4NzI3MiwiZXhwIjoxNjkyMTkwODcyfQ.pJfimMYMdstRNjBx-o6g1WaxkCUBbFOruWoulM9U5Cs') return res.status(400).json({ success: false });

	console.log('PAYLOAD',req.body);
	res.status(201).json({ success: true });
})
// Start the server
app.listen(process.env.PORT, () => {
  console.log('Server running on port 3000');
});

