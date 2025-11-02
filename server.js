const express = require("express");
const { google } = require("googleapis");
const cors = require("cors"); // Import the cors middleware
require("dotenv").config(); // Load .env variables at the top

const app = express();

// Use cors middleware to allow requests from your React app
app.use(cors());

// --- Load Credentials from .env ---
// Make sure your .env file has these variables
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
// Replace escaped newlines (\\n) with actual newlines (\n)
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

// This is the API endpoint your React app will call
app.get("/api/data", async (req, res) => {
  try {
    // --- Authenticate using environment variables ---
    const auth = new google.auth.GoogleAuth({
      credentials: {
        project_id: GOOGLE_PROJECT_ID,
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client }); // --- PASTE YOUR SPREADSHEET ID HERE ---

    const spreadsheetId = "1QRtKALF2yzzh5yMU-ClStTLYX-GSVzuJjJJtJO-7Ed4";

    console.log("Fetching all data from Google Sheets..."); // Read all 4,320 rows from the sheet

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A1:D4321", // Read from cell A1 down to D4321
    }); // Remove the header row from the data

    const allRows = response.data.values;
    const dataWithoutHeader = allRows.slice(1); // Convert the array of arrays into an array of objects

    const headers = allRows[0];
    const jsonData = dataWithoutHeader.map((row) => {
      let rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });
      return rowObject;
    });

    console.log("✅ Data fetched successfully! Sending to client.");
    res.json(jsonData);
  } catch (error) {
    console.error("❌ Error fetching from Google Sheets:", error.message);
    res.status(500).send("Server Error");
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`🚀 Server is live at http://localhost:${PORT}`)
);
