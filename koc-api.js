// koc-api.js

// BASE SETUP
// =============================================================================

// Dependencies
// -----------------------------------------------------------------------------
var express    = require('express');        // call express
var app        = express(); 				        // define our app using express
var bodyParser = require('body-parser');
var KoC        = require('koc');            // the API we use to call KoC

// Constants
// -----------------------------------------------------------------------------
const KOC_SESSION_HEADER_NAME = 'x-koc-session';

// Helpers
// -----------------------------------------------------------------------------

var getTimeStamp = function() {
    return +new Date();
};

var checkRequiredParameters = function(req, res, required_parameters, action) {
    var request_parameters = req.body;
    if(request_parameters === undefined) {
        res.json({
            success: false,
            error: "Please specify parameters to " + action,
            timestamp: getTimeStamp()
        });
        return false;
    }
    required_parameters.forEach(function(required_parameter){
        var param_value = request_parameters[required_parameter];
        if(param_value===undefined) {
            res.json({
                success: false,
                error: "Please specify '" + required_parameter + "' to " + action,
                timestamp: getTimeStamp()
            });
            return false;
        }
    });
    return true;
};

var loggedIn = function( res, action ) {
  if( action === undefined || action === null || !action.length )
    action = "perform that action";
  if( res.koc !== undefined && res.koc.hasSession() )
    return true;
  res.json({
     success: false,
     error: "You need to be logged in to " + action,
     timestamp: getTimeStamp()
  });
  return false;
};

var passPromise = function( promise, req, res, requireSession, required_parameters, optional_parameters, action ) {
    // Check the session
    if( requireSession === undefined || !requireSession  || ( requireSession && loggedIn( res, action ) ) ) {
        // Check the parameters
        if( required_parameters === undefined || required_parameters === null
                || !required_parameters.length
                || ( required_parameters.length && checkRequiredParameters(req, res, required_parameters, action) ) ) {
            // Prepare the parameters
            var parameters = [];
            if( required_parameters !== undefined && required_parameters !== null && required_parameters.length ) {
                required_parameters.forEach(function(parameter){
                    parameters.push(req.body[parameter]);
                });
            }
            if( optional_parameters !== undefined && optional_parameters !== null && optional_parameters.length ) {
                optional_parameters.forEach(function(parameter){
                    parameters.push(req.body[parameter]);
                });
            }
            promise.apply(res.koc,parameters)
            .then( function(result) {
                result.timestamp = getTimeStamp();
                res.json(result);
            }).fail( function(result) {
                result.timestamp = getTimeStamp();
                res.json(result);
            });
        }
    }
};

// configure app to use bodyParser()
// this will let us easily get the data from a POST
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.all('/*', function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    //res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Origin, X-KoC-Session');
    next();
});

// Home
// =============================================================================
var router = express.Router(); // get an instance of the express Router
router.use(express.static(__dirname + '/public'));
router.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/home.html');
});

// API
// =============================================================================

// Get an instance of express Router
var api = express.Router();

// API Middleware to use for all requests to capture the X-KoC-Session header
api.use(function(req, res, next) {
  // create our KoC helper
  res.koc = new KoC();
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var now = new Date().toJSON();
  console.log("[" + now + "][" + ip + "]["+req.method+"][" + req.originalUrl + "]");
  // set the session_id, if one was passed
	if( req.headers[KOC_SESSION_HEADER_NAME] !== undefined
	        && req.headers[KOC_SESSION_HEADER_NAME].length )
	    res.koc.setSession(req.headers[KOC_SESSION_HEADER_NAME]);
	next(); // make sure we go to the next routes and don't stop here
});

// API Home
api.get('/', function(req, res) {
	res.json({
	    message: 'API Root. Read the doc to learn how to use it.',
        timestamp: getTimeStamp()
	});
});

// Logo
api.get('/logo.png', function(req, res) {
  res.sendFile(__dirname + '/public/koc_logo_png24.png');
});

// CAPTCHA
api.route('/captcha').get(function(req, res) {
    passPromise( res.koc.getReCaptchaChallenge, req, res, false );
});

// REGISTER
api.route('/register').post(function(req, res) {
    passPromise( res.koc.register, req, res, false, ["race", "username", "password", "email", "challenge", "challenge_response"], [], "register" );
});

// VERIFY
api.route('/verify').post(function(req, res) {
    passPromise( res.koc.verify, req, res, false, [ "username", "password", "password2" ], [], "verify" );
});

// VERIFY E-MAIL
api.route('/:var(verify-email|verify_email|verifyEmail)').post(function(req, res) {
    passPromise( res.koc.verifyEmail, req, res, true, [ "email" ], [], "verify the e-mail" );
});

// LOGIN
api.route('/login').post(function(req, res) {
  if(process.env.DYNO !== undefined || process.env.OPENSHIFT_NODEJS_IP !== undefined) {
    res.json({
      message: 'Login disabled from the API',
      timestamp: getTimeStamp()
    });
  }
  else { // local
    passPromise(res.koc.login, req, res, false, ["username", "password"], [], "login");
  }
});

// Get User Info (from the Base)
api.route('/:var(user|base|userinfo)').get(function(req, res) {
    passPromise( res.koc.getUserInfo, req, res, true );
});

// Get Races Information
api.route('/races').get(function(req, res) {
    passPromise( res.koc.getRacesInformation, req, res, false );
});

// Get Left-Side Menu (Command Center, etc...)
api.route('/menu').get(function(req, res) {
    passPromise( res.koc.getLeftMenuInfo, req, res, true );
});

// Toggle Advisor
api.route( '/:var(toggle-advisor|toggleAdvisor|toggle_advisor)' ).get( function( req, res ) {
    passPromise( res.koc.toggleAdvisor, req, res, true );
});

// Change Race
api.route( '/:var(change-race|changeRace|change_race)' ).post( function( req, res ) {
    passPromise( res.koc.changeRace, req, res, true, ["new_race"], [], "change race" );
});

// Toggle Advisor
api.route( '/menu' ).get( function( req, res ) {
    passPromise( res.koc.getLeftMenuInfo, req, res, true );
});

// Change Commander Info
api.route( '/:var(change-commander-info|changeCommanderInfo|change_commander_info)' ).get( function( req, res ) {
    passPromise( res.koc.getChangeCommanderInfo, req, res, true, [], [], "get change commander info" );
});

// Change Commander
api.route( '/:var(change-commander|changeCommander|change_commander)' ).post( function( req, res ) {
    passPromise( res.koc.changeCommander, req, res, true, ["new_commander_id","password"], ["statement"], "change your commander" );
});

// Ditch Commander
api.route( '/:var(ditch-commander|ditchCommander|ditch_commander)' ).post( function( req, res ) {
    passPromise( res.koc.ditchCommander, req, res, true, ["password"], ["statement"], "ditch your poor commander" );
});

// Get Help
api.route('/help').get(function(req, res) {
    var result = res.koc.getHelp();
    result.timestamp = getTimeStamp();
    res.json( result );
});

// Forgot Pass
api.route( '/:var(forgot-pass|forgotPass|forgot_pass)' ).post( function( req, res ) {
    passPromise( res.koc.forgotPass, req, res, false, ["username","email"], [], "recover your pass (even if empty)" );
});

// Logout
api.route( '/logout' ).get( function( req, res ) {
    passPromise( res.koc.logout, req, res, true );
});

// Get User Stats (Full)
api.route('/stats/:userid').get(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)) {
        res.json({
           success: false,
           error: "'userid' must be a number"
        });
        return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.getFullStats, req, res, true, [ 'userid' ], [], 'see user stats' );
});

// Armory
api.route('/armory')
    .get(function(req, res) {
        passPromise( res.koc.getArmory, req, res, true );
    })
    .post(function(req, res) {
        passPromise( res.koc.buyWeapons, req, res, true, [ 'turing', 'inputNameValue' ], [], 'update your inventory' );
    });

// Train
api.route('/train')
    .get(function(req, res) {
        passPromise( res.koc.getTraining, req, res, true );
    })
    .post(function(req, res) {
        passPromise( res.koc.train, req, res, true, [ 'turing', 'inputNameValue' ], [], 'train your troops' );
    });

// Mercenaries
api.route('/:var(mercs|mercenaries)')
    .get(function(req, res) {
        passPromise( res.koc.getMercenaries, req, res, true );
    })
    .post(function(req, res) {
        passPromise( res.koc.hireMercenaries, req, res, true, [ 'turing', 'inputNameValue' ], [], 'hire mercenaries' );
    });

// Recruit & Clicker
[ 'recruit', 'clicker' ].forEach(function(action){
    api.route('/'+action)
        .get(function(req, res) {
            passPromise( res.koc[action], req, res, true );
        })
        .post(function(req, res) {
            passPromise( res.koc[action], req, res, true, [ 'data' ], [], 'recruit soliders' );
        });
});

// Attack
api.route('/attackfield')
  .get(function(req, res) {
      passPromise( res.koc.attackfield, req, res, true );
  });

// Battlefield
api.route('/battlefield/:page')
  .get(function(req, res) {
      var page = req.params.page;
      if(!isFinite(page)||page==0) {
        passPromise( res.koc.attackfield, req, res, true );
      }
      else {
        req.body.page = Number(page);
        passPromise( res.koc.battlefield, req, res, true, [ 'page' ], [] );
      }
  });

// Attack Log
api.route('/:var(attacklog|attack-log|attack_log)')
  .post(function(req, res) {
      passPromise( res.koc.attackLog, req, res, true, [], [ 'b_start', 'o_start' ], 'retrieve the attack log' );
  });

// Intelligence
api.route('/:var(intelligence|intel)')
  .post(function(req, res) {
      passPromise( res.koc.intelligence, req, res, true, [], [ 'files_start', 'intercepted_start' ], 'retrieve the intelligence' );
  });

// Battle Report
api.route('/:var(battleReport|battle-report|battle_report)/:attack_id')
  .get(function(req, res) {
    var attack_id = req.params.attack_id;
    if(!isFinite(attack_id)) {
      res.json({
        success: false,
        error: "'attack_id' must be a number"
      });
      return;
    }
    req.body.attack_id = Number(attack_id);
    passPromise( res.koc.battleReport, req, res, true, [ 'attack_id' ], [], 'retrieve the battle reports' );
  });

// Intel File
api.route('/:var(intelFile|intel-file|intel_file)/:asset_id')
  .get(function(req, res) {
    var asset_id = req.params.asset_id;
    if(!isFinite(asset_id)) {
      res.json({
        success: false,
        error: "'asset_id' must be a number"
      });
      return;
    }
    req.body.asset_id = Number(asset_id);
    passPromise( res.koc.intelFile, req, res, true, [ 'asset_id' ], [], 'retrieve the intelligence file' );
  });

// Intel Detail
api.route('/:var(intelDetail|intel-detail|intel_detail)/:report_id')
  .get(function(req, res) {
    var report_id = req.params.report_id;
    if(!isFinite(report_id)) {
      res.json({
        success: false,
        error: "'report_id' must be a number"
      });
      return;
    }
    req.body.report_id = Number(report_id);
    passPromise( res.koc.intelDetail, req, res, true, [ 'report_id' ], [], 'retrieve the spy report detail' );
  });

// Index
api.route('/index')
  .get(function(req, res) {
    passPromise( res.koc.index, req, res, false );
  });

// Get User Stats (XHR)
api.route('/quickstats/:userid').get(function(req, res) {
  var userid = req.params.userid;
  if(!isFinite(userid)) {
    res.json({
      success: false,
      error: "'userid' must be a number",
    });
    return;
  }
  req.body.userid = Number(userid);
  passPromise( res.koc.getQuickStats, req, res, true, [ 'userid' ], [], 'see user stats' );
});

// Spy (recon)
api.route('/:var(spy|recon)/:userid')
  .get(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)&&userid>0) {
      res.json({
        success: false,
        error: "'userid' must be a positive number",
      });
      return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.recon, req, res, true, [ 'userid' ] );
  })
  .post(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)&&userid>0) {
      res.json({
        success: false,
        error: "'userid' must be a positive number",
      });
      return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.recon, req, res, true, [ 'userid', 'turing' ], [], 'recon a user' );
  });

// Attack
api.route('/attack/:userid')
  .get(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)&&userid>0) {
      res.json({
        success: false,
        error: "'userid' must be a positive number",
      });
      return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.attack, req, res, true, [ 'userid' ] );
  })
  .post(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)&&userid>0) {
      res.json({
        success: false,
        error: "'userid' must be a positive number",
      });
      return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.attack, req, res, true, [ 'userid', 'turing' ], [], 'attack a user' );
  });

// Raid
api.route('/raid/:userid')
  .get(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)&&userid>0) {
      res.json({
        success: false,
        error: "'userid' must be a positive number",
      });
      return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.raid, req, res, true, [ 'userid' ] );
  })
  .post(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)&&userid>0) {
      res.json({
        success: false,
        error: "'userid' must be a positive number",
      });
      return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.raid, req, res, true, [ 'userid', 'turing' ], [], 'raid a user' );
  });

// Version
api.route('/version')
  .get(function(req, res) {
    var apiVersion = require('./package.json').version;
    var kocVersion = require('./node_modules/koc/package.json').version;
    res.json({
      api: apiVersion,
      koc: kocVersion,
    });
  });

// Set Resolution
api.route('/setres')
  .get(function(req, res) {
    passPromise( res.koc.setres, req, res, false, [] );
  });

// Inbox
api.route('/inbox')
  .get(function(req, res) {
      passPromise( res.koc.inbox, req, res, true );
  });

// Send a message
api.route('/writemail/:userid')
  .post(function(req, res) {
    var userid = req.params.userid;
    if(!isFinite(userid)&&userid>0) {
      res.json({
        success: false,
        error: "'userid' must be a positive number",
      });
      return;
    }
    req.body.userid = Number(userid);
    passPromise( res.koc.writemail, req, res, true, [ 'userid', 'subject', 'message' ], [ 'turing' ], 'send a message' );
  });

// REGISTER OUR ROUTES
// =============================================================================
app.use('/'   , router);
app.use('/api', api   );

module.exports = app;