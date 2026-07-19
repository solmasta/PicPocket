const express = require('express');
const app = express();

app.use(express.json());

let settings = {
  googlePhotos: false,
  googleDrive: false,
  autoBackup: false,
  horseProfile: {}
};

app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const { googlePhotos, googleDrive, autoBackup, horseProfile } = req.body;
  settings = {
    googlePhotos: Boolean(googlePhotos),
    googleDrive: Boolean(googleDrive),
    autoBackup: Boolean(autoBackup),
    horseProfile: horseProfile && typeof horseProfile === 'object' ? horseProfile : {}
  };
  res.json(settings);
});

module.exports = app;
