const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API route to list all novels (folders in public/novels)
app.get('/api/novels', (req, res) => {
  const novelsDir = path.join(__dirname, 'public', 'novels');
  fs.readdir(novelsDir, { withFileTypes: true }, (err, items) => {
    if (err) return res.status(500).json({ error: 'Could not load novels' });

    const novels = items
      .filter(d => d.isDirectory())
      .map(d => ({ id: d.name, title: d.name.replace(/-/g, ' ') }));

    res.json(novels);
  });
});

// API route to get chapters for a novel
app.get('/api/chapters/:novelId', (req, res) => {
  const novelId = req.params.novelId;
  const novelDir = path.join(__dirname, 'public', 'novels', novelId);

  fs.readdir(novelDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not load chapters' });

    const chapters = files
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => a.localeCompare(b)); // simple alphabetical sort

    res.json(chapters);
  });
});

// API route to get a single chapter content
app.get('/api/chapters/:novelId/:chapter', (req, res) => {
  const novelId = req.params.novelId;
  const chapter = req.params.chapter;
  const filePath = path.join(__dirname, 'public', 'novels', novelId, chapter);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Could not read chapter');
    res.send(data);
  });
});

// Serve HTML files
app.get('/:page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params.page));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
