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

// Helper
var requireParameters = function(request_parameters, required_parameters, action) {
    if(request_parameters === undefined)
        return {
            success: false,
            error: "Please specify parameters to " + action
        };
    for(var i in required_parameters) {
        var required_parameter = required_parameters[i];
        var param_value        = request_parameters[required_parameter];
        if(param_value===undefined||!param_value.length)
            return {
                success: false,
                error: "Please specify '" + required_parameter + "' to " + action
            };
    }
    return null;
}

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

// CAPTCHA
// -----------------------------------------------------------------------------
api.route('/captcha').get(function(req, res) {
    res.koc.getLoginCaptcha()
    .then( function(result) {
        res.json(result);
    }).fail( function(result) {
        res.json(result);
    });
});

// REGISTER
// -----------------------------------------------------------------------------
api.route('/register').post(function(req, res) {
    var checkParameters = requireParameters(req.body, ["race", "username", "password", "email", "challenge", "challenge_response"], "register");
    if(checkParameters!==null) {
        res.json(checkParameters);
        return;
    }
	var username           = req.body.username;
	var password           = req.body.password;
	var race               = req.body.race;
	var email              = req.body.email;
	var challenge          = req.body.challenge;
	var challenge_response = req.body.challenge_response;
    res.koc.register(race, username, password, email, challenge, challenge_response)
    .then( function(result) {
        res.json(result);
    }).fail( function(result) {
        res.json(result);
    });
});

// VERIFY
// -----------------------------------------------------------------------------
api.route('/verify').post(function(req, res) {
    var checkParameters = requireParameters(req.body, ["username",  "password", "password2"], "verify");
    if(checkParameters!==null)
        return checkParameters;
	var username  = req.body.username;
	var password  = req.body.password;
	var password2 = req.body.password2;
    res.koc.verify(username, password, password2)
    .then( function(result) {
        res.json(result);
    }).fail( function(result) {
        res.json(result);
    });
});

// LOGIN
// -----------------------------------------------------------------------------
api.route('/login').post(function(req, res) {
    var checkParameters = requireParameters(req.body, ["username",  "password"], "login");
    if(checkParameters!==null)
        return checkParameters;
	var username = req.body.username;
	var password = req.body.password;
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