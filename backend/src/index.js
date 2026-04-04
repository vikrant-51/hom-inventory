const express = require("express");

const pool = require('./db/pool');

const app = express();
app.use(express.json());
app.use('/api/batches', require('./routes/batches'));
app.use('/api/stock', require('./routes/stock'));

app.listen(3000, ()=> console.log("Server is running on PORT 3000"));