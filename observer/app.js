/* global __dirname */

const serverPort = 5205;

const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const common = require('garden-common');
const express = require('express');
const session = require('express-session');
const mustache = require('mustache');
mustache.escape = _ => _;
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));

const templateFileDirectory = path.join(__dirname, 'template');

const runApp = () => {
  const app = express();
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
  }));
  app.use('/admin', express.static(path.join(__dirname, 'build')));

  app.get('/', (req, res) => {
    if (req.session.isAdmin) {
      return res.redirect('/admin');
    }
    res.send(mustache.render(fs.readFileSync(path.join(templateFileDirectory, 'index.html.mustache'), 'utf8')));
  });
  app.use(express.static(path.join(__dirname, 'public')));

  app.post('/login', (req, res) => {
    if (req.body.username === config.observer.username && req.body.password === config.observer.password) {
      req.session.isAdmin = true;
      res.redirect('/observe');
    } else {
      res.redirect('/?action=forbidden');
    }
  });

  app.get('/quit', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/?action=logout');
  });

  app.get('*', (req, res) => {
    if (!req.session.isAdmin) {
      res.redirect('/');
    } else {
      res.sendFile(path.join(__dirname + '/build/index.html'));
    }
  });

  return app;
};

const errorCheck = port => {
  return err => {
    if (err.code === 'EADDRINUSE') {
      console.warn('Port: ' + port + ' is already in use');
    }
  };
};

const testApp = runApp();
testApp.on('error', errorCheck(serverPort));
testApp.listen(serverPort);
console.log('Test app is listening on port ' + serverPort);
