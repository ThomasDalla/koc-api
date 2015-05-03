// server.js

var app = require('./koc-api');

// START THE SERVER
// =============================================================================
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP   || "0.0.0.0";
app.listen(port, ip);
console.log('Magic happens on port ' + port);