const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' })); // Increase limit for image data

// Serve static files from the 'front' directory
app.use(express.static(path.join(__dirname, '../front')));

// Basic API route
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running 🏎️' });
});

// Endpoint to save photo
app.post('/api/save-photo', (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Remove the data URL prefix (data:image/png;base64,)
  const base64Data = data.replace(/^data:image\/png;base64,/, '');

  // Generate filename
  const filename = `ricochet_falaise.png`;
  const filepath = path.join(__dirname, '../front/texture', filename);

  // Write the file
  fs.writeFile(filepath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error saving photo:', err);
      return res.status(500).json({ error: 'Failed to save photo' });
    }
    res.json({ message: 'Photo saved successfully', filename });
  });
});

// For any other request, serve the index.html from front
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
