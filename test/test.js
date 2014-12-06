/*global describe, it, before, beforeEach, after, afterEach */

// Doesn't make so much sense as we can only test the failure cases (without an approved test account)

var chai           = require('chai'),
    chaiAsPromised = require("chai-as-promised"),
    app            = require('../koc-api'),
    request        = require('supertest');
chai.use(chaiAsPromised);
chai.should();

describe('GET /', function(){
  it('respond with html', function(done){
    request(app)
      .get('/')
      .set('Accept', 'application/html')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
});

describe('GET /api', function(){
  it('respond with json', function(done){
    request(app)
      .get('/api')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('message');
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
});

describe('GET /api/captcha', function(){
  it('respond with json', function(done){
    request(app)
      .get('/api/captcha')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.contain.keys('success','image','server','challenge','error');
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
});

describe('POST /api/login', function(){
  it('invalid username/password', function(done){
    request(app)
      .post('/api/login')
      .send({ username: "invalid", password: "invalid" })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('age').that.is.a('number');
          res.body.should.be.an('object').that.has.property('session').that.is.not.empty;
          res.body.should.be.an('object').that.has.property('stats').that.is.an('object');
          res.body.should.be.an('object').that.has.property('error').that.equals('Invalid Username/Password combination');
          res.body.should.be.an('object').that.has.property('location').that.equals('/error.php');
          res.body.should.be.an('object').that.has.property('success').that.is.false;
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
  it('missing username', function(done){
    request(app)
      .post('/api/login')
      .send({ password: "invalid" })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('error').that.has.string('username');
          res.body.should.be.an('object').that.has.property('success').that.is.false;
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
  it('missing password', function(done){
    request(app)
      .post('/api/login')
      .send({ username: "invalid" })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('error').that.has.string('password');
          res.body.should.be.an('object').that.has.property('success').that.is.false;
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
});

describe('POST /api/register', function(){
  it('invalid Captcha', function(done){
    request(app)
      .post('/api/register')
      .send({ username: "hdbrnfntrvkjdtfd", password: "InvaliD", race: "Humans", email: "mail@mail.abc", challenge: "abc", challenge_response: "def" })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('age').that.is.a('number');
          res.body.should.be.an('object').that.has.property('session').that.is.not.empty;
          res.body.should.be.an('object').that.has.property('stats').that.is.an('object');
          res.body.should.be.an('object').that.has.property('error').that.equals('Invalid captcha');
          res.body.should.be.an('object').that.has.property('location').that.equals('/error.php');
          res.body.should.be.an('object').that.has.property('success').that.is.false;
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
  it('missing username', function(done){
    request(app)
      .post('/api/register')
      .send({ password: "invalid", race: "Humans", email: "mail@mail.abc", challenge: "abc", challenge_response: "def" })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('error').that.has.string('username');
          res.body.should.be.an('object').that.has.property('success').that.is.false;
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
  it('missing email', function(done){
    request(app)
      .post('/api/register')
      .send({ username: "hdbrnfntrvkjdtfd", password: "invalid", race: "Humans", challenge: "abc", challenge_response: "def" })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('error').that.has.string('email');
          res.body.should.be.an('object').that.has.property('success').that.is.false;
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
});

describe('GET /api/logout', function(){
  it('respond with json', function(done){
    request(app)
      .get('/api/logout')
      .set('Accept', 'application/json')
      .set('X-KoC-Session', 'foo')
      .expect(200)
      .expect(function(res){
          res.body.should.be.an('object').that.has.property('error').that.is.empty;
          res.body.should.be.an('object').that.has.property('success').that.is.true;
      })
      .end(function(err, res){
        if (err) return done(err);
        done();
      });
  });
});