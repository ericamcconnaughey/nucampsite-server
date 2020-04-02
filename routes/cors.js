const cors = require('cors');

const whitelist = ['http://localhost:3000', 'https://localhost:3443'];
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  console.log(req.header('Origin'));
  if (whitelist.indexOf(req.header('Origin')) !== -1) { //.indexOf() array method returns -1 if element is not found
    corsOptions = { origin: true }; //origin was found in whitelist
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions); //null = no error
};

exports.cors = cors(); //allows requests from * origins
exports.corsWithOptions = cors(corsOptionsDelegate); //allows requests from whitelisted origins