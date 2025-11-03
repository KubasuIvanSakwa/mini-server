const express = require('express');
const { google } = require('googleapis');
const cors = require('cors'); 
require('dotenv').config(); 

const app = express();

app.use(cors());

// --- Load Credentials from .env ---
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;
let GOOGLE_PRIVATE_KEY = undefined;
if (typeof GOOGLE_PRIVATE_KEY_RAW === 'string' && GOOGLE_PRIVATE_KEY_RAW.length > 0) {
  GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY_RAW.replace(/\\n/g, '\n');
  console.log('✅ GOOGLE_PRIVATE_KEY loaded and formatted.');
} else {
  console.warn('⚠️ GOOGLE_PRIVATE_KEY is missing or empty in environment variables.');
}


app.get('/', (req, res) => {
  // simple HTML page
  res.send(`
       <html style="font-family: sans-serif; padding: 2rem; background: #000;">
      <head><title>API Home</title></head>
      <body style="color:white; max-width: 600px; margin: auto; background: #2e2e2e; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h1>Mini Server Runs 🚀</h1>
        <p>Mini-server Home</p>
        
        <h2 style="border-bottom: 2px solid #eee; padding-bottom: 8px;">API Endpoints:</h2>
        <ul style="font-size: 20px">
          <li>
              <a href="/api/data" style="text-decoration: none; color: white;">
                <strong><span style="color: #323d96">GET</span> /api/data</strong>
              </a>
            <p>Fetches data from your Google Sheet.</p>
          </li>
        </ul>
      </body>
    </html>
  `);
});


//API endpoint 
app.get('/api/data', async (req, res) => {
  try {

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

    // --- SPREADSHEET ID ---
    const spreadsheetId = '1KKEQw8jbc55ZhH56VV37YDFOdzZZl-zLps6eP75x1RQ';

    console.log('Fetching all data from Google Sheets...');

    // --- RANGE ---
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:G4321', 
    });
    
    const allRows = response.data.values;
    if (!allRows || allRows.length === 0) {
      console.log('✅ Sheet is empty, returning empty array.');
      return res.json([]);
    }
    
    const dataWithoutHeader = allRows.slice(1);
    
    const headers = allRows[0];
    const jsonData = dataWithoutHeader.map(row => {
      let rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });
      return rowObject;
    });
    
    res.json(jsonData);

  } catch (error) {
    console.error('❌ Error fetching from Google Sheets:', error.message);

    res.status(500).send('Server Error: Could not fetch data from Google Sheets.');

  }
});


const PORT = process.env.PORT || 3001;

console.log(`Attempting to start server on port ${PORT}...`);

app.listen(PORT, () => console.log(`🚀 Server is live at http://localhost:${PORT}`));




