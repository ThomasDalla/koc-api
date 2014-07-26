// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser');
var KoC        = require('koc');            // the API we use to call KoC

// Constants
const KOC_SESSION_HEADER_NAME = 'x-koc-session';

// configure app to use bodyParser()
// this will let us easily get the data from a POST
app.use(bodyParser());

// Home
// =============================================================================
var router = express.Router(); // get an instance of the express Router
router.use(express.static(__dirname + '/public'));
router.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/home.html');
});

// API
// =============================================================================

// Get an instance of express Router
var api = express.Router();

// API Middleware to use for all requests to capture the X-KoC-Session header
api.use(function(req, res, next) {
    // create our KoC helper
    res.koc = new KoC();
    // set the session_id, if one was passed
	if( req.headers[KOC_SESSION_HEADER_NAME] !== undefined
	        && req.headers[KOC_SESSION_HEADER_NAME].length )
	    res.koc.setSession(req.headers[KOC_SESSION_HEADER_NAME]);
	next(); // make sure we go to the next routes and don't stop here
});

// API Home
// -----------------------------------------------------------------------------
api.get('/', function(req, res) {
	res.json({ message: 'API Root. Read the doc to learn how to use it.' });
});

// LOGIN
// -----------------------------------------------------------------------------
api.route('/login').post(function(req, res) {
	var username = req.body.username;
	if( username === undefined || !username.length )
	    res.json({
	       success: false,
	       error: "Please specify a username to login..."
	    });
	var password = req.body.password;
	if( password === undefined || !password.length )
	    res.json({
	       success: false,
	       error: "Please specify a password to login..."
	    });
    res.koc.login(username, password)
    .then( function(result) {
        res.json(result);
    }).fail( function(result) {
        res.json(result);
    });
});

// REGISTER OUR ROUTES
// =============================================================================
app.use('/'   , router);
app.use('/api', api   );

// START THE SERVER
// =============================================================================
var port = process.env.PORT || 3000;
app.listen(port, process.env.IP || "0.0.0.0");
console.log('Magic happens on port ' + port);