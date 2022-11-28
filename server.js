const express = require('express');

const app = express();
app.use('/', express.static('asset'));
app.use('/', express.static('dist'));

const port = process.argv[3] || 4000;
app.listen(port, () => console.log(`Running on port ${port}`));
