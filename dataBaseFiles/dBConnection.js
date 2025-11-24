const { default: mongoose } = require("mongoose");
require('dotenv').config();

const mongoUrl = process.env.MONGO_URL

mongoose.connect(mongoUrl)
  .then(() => {
    console.log('Connected to MongoDB database');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });