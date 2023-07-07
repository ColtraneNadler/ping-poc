import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import dotenv from 'dotenv';
dotenv.config()

const app = express();

const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userResponse = await axios.get('https://api.pingfederate.example.com/userinfo', {
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
app.get('/auth/pingfederate', (req, res) => {
  const redirectUri = process.env.BASE_URI + '/auth/pingfederate/callback'; 
  const authEndpoint = 'https://pingfederate.example.com/as/authorization.oauth2';  
  const clientId = process.env.PING_CLIENT_ID // Replace with your client ID
  const scope = 'openid profile'; // Replace with the required scopes

  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
  });

  const authorizationUrl = `${authEndpoint}?${queryParams}`;
  res.redirect(authorizationUrl);
});

app.get('/auth/pingfederate/callback', async (req, res) => {
  const tokenEndpoint = 'https://pingfederate.example.com/as/token.oauth2'; // PingFederate token endpoint
  const clientId = process.env.PING_CLIENT_ID; 
  const clientSecret = process.env.PING_CLIENT_SECRET; 
  const redirectUri = process.env.BASE_URI + '/auth/pingfederate/callback'; 

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

// Start the server
app.listen(process.env.PORT, () => {
  console.log('Server running on port 3000');
});

