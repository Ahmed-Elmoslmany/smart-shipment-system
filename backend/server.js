const app = require('./app') 

const dotenv = require('dotenv'); // require enviroment variables

dotenv.config({ path: './.env' }); // require enviroment variables from our file .env

app.listen(process.env.PORT, '127.0.0.1', () => { // start the server
    console.log('sha8al ya kber');
  });