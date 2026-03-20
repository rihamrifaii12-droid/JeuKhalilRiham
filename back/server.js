const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static files from the 'front' directory
app.use(express.static(path.join(__dirname, '../front')));

// Basic API route
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running 🏎️' });
});

// For any other request, serve the index.html from front
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
