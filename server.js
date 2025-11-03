const express = require('express');
const { google } = require('googleapis');
const cors = require('cors'); // Import the cors middleware
require('dotenv').config(); // Load .env variables at the top

const app = express();

// Use cors middleware to allow requests from your React app
app.use(cors());

// --- Load Credentials from .env ---
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

// **FIX 1: Made this check even safer**
const GOOGLE_PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;
let GOOGLE_PRIVATE_KEY = undefined;
if (typeof GOOGLE_PRIVATE_KEY_RAW === 'string' && GOOGLE_PRIVATE_KEY_RAW.length > 0) {
  GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY_RAW.replace(/\\n/g, '\n');
  console.log('✅ GOOGLE_PRIVATE_KEY loaded and formatted.');
} else {
  console.warn('⚠️ GOOGLE_PRIVATE_KEY is missing or empty in environment variables.');
}


// --- NEW: Home Screen Endpoint ---
app.get('/', (req, res) => {
  console.log('✅ DEBUG: Hit / route'); // Added log
  // Send back a simple HTML page
  res.send(`
    <html style="font-family: sans-serif; padding: 2rem; background: #f4f4f4;">
      <head><title>API Home</title></head>
      <body style="max-width: 600px; margin: auto; background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h1>🚀 Server is Live!</h1>
        <p>This is the home screen for your Node.js API server.</p>
        
        <h2 style="border-bottom: 2px solid #eee; padding-bottom: 8px;">Available API Endpoints:</h2>
        <ul>
          <li>
            <strong>GET /api/data</strong>
            <p>Fetches data from your Google Sheet.</p>
          </li>
        </ul>
        
        <a href="/api/data" style="
          display: inline-block;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          background-color: #007bff;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 1rem;
        ">
          Go to /api/data
        </a>
      </body>
    </html>
  `);
});


// This is the API endpoint your React app will call
app.get('/api/data', async (req, res) => {
  console.log('✅ DEBUG: Hit /api/data route'); // Added log
  try {
    // **FIX 3: Check if credentials are even loaded**
    if (!GOOGLE_PROJECT_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      console.error('❌ Missing one or more Google credentials in environment variables.');
      return res.status(500).send('Server configuration error: Missing credentials.');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        project_id: GOOGLE_PROJECT_ID,
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // --- UPDATED SPREADSHEET ID ---
    const spreadsheetId = '1KKEQw8jbc55ZhH56VV37YDFOdzZZl-zLps6eP75x1RQ';

    console.log('Fetching all data from Google Sheets...');

    // --- UPDATED RANGE ---
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:G4321', // Read from cell A1 down to F4321
    });
    
    // **Graceful handling if sheet is empty**
    const allRows = response.data.values;
    if (!allRows || allRows.length === 0) {
      console.log('✅ Sheet is empty, returning empty array.');
      return res.json([]);
    }

    // Remove the header row from the data
    const dataWithoutHeader = allRows.slice(1);

    // Convert the array of arrays into an array of objects
    const headers = allRows[0];
    const jsonData = dataWithoutHeader.map(row => {
      let rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });
      return rowObject;
    });

    console.log('✅ Data fetched successfully! Sending to client.');
    res.json(jsonData);

  } catch (error) {
    console.error('❌ Error fetching from Google Sheets:', error.message);
    // **FIX 2: Add back the error response to the client**
    res.status(500).send('Server Error: Could not fetch data from Google Sheets.');
  // **CRITICAL FIX**: Removed the stray ".js" from this line
  }
});

// **MODIFICATION FOR RENDER**
// Render provides its own port via the PORT environment variable.
// We use that if it exists, otherwise we fall back to 3001 for local dev.
const PORT = process.env.PORT || 3001;

// Added a log to show the server is *about* to start
console.log(`Attempting to start server on port ${PORT}...`);

app.listen(PORT, () => console.log(`🚀 Server is live at http://localhost:${PORT}`));


