const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: '🐴 Welcome to PicPals Horse Photo API! 🐴' });
});

app.get('/auth', (req, res) => {
  res.json({ message: 'Authentication endpoint' });
});

app.listen(PORT, () => {
  console.log(`🐎 PicPals backend running on port ${PORT} 🐎`);
});
