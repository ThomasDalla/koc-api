// server.js

var app = require('./koc-api');

// START THE SERVER
// =============================================================================
var port = process.env.PORT || 3000;
var ip   = process.env.IP   || "0.0.0.0";
app.listen(port, ip);
console.log('Magic happens on port ' + port);