/* global __dirname */

const serverPort = 4002;

const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const common = require('gscc-common');
const express = require('express');
const session = require('express-session');
const mustache = require('mustache');
mustache.escape = _ => _;
const config = common.Config(process.env, require('../common/config/runtime.json'));

const templateFileDirectory = path.join(__dirname, 'template');
const STREAMER_PERMISSION = 0x00000100;

const accessConfig = {
  authorizeUrl: config.discord.client.authorizeUrl,
  clientId: config.discord.client.id,
  redirectUrl: config.discord.client.redirectUrl,
  responseType: config.discord.client.responseType,
  scope: config.discord.client.scope
};

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
    res.send(mustache.render(fs.readFileSync(path.join(templateFileDirectory, 'index.html.mustache'), 'utf8'), accessConfig));
  });
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/callback', (req, res) => {
    if (req.query.code) {
      const accessCode = req.query.code;
      const data = {
        client_id: config.discord.client.id,
        client_secret: config.discord.client.secret,
        grant_type: 'authorization_code',
        redirect_uri: config.discord.client.redirectUrl,
        code: accessCode,
        scope: 'identify guilds'
      };

      fetch('https://discordapp.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams(data),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
        .then(discordRes => discordRes.json())
        .then(info => {
          console.log(info);
          return info;
        })
        .then(info => {
          fetch(`https://discordapp.com/api/users/@me/guilds`, {
            headers: {
              authorization: `${info.token_type} ${info.access_token}`
            }
          })
            .then(guildRes => guildRes.json())
            .then(guildData => {
              console.log('guildData:', guildData);
              const guild = guildData.find(item => item.id === config.discord.guild.id);
              if (!guild || (STREAMER_PERMISSION !== (guild.permissions & STREAMER_PERMISSION))) {
                return res
                  .status(401)
                  .send(mustache.render(fs.readFileSync(path.join(templateFileDirectory, 'unauthorized.html.mustache'), 'utf8'), accessConfig));
              }
              req.session.isAdmin = true;
              res.redirect('/admin');
            })
            .catch(err => {
              console.warn(err);
              res.redirect('/');
            })
        });
    }
  });

  app.get('/quit', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/');
  });

  app.get('*', (req, res) => {
    if (!req.session.isAdmin) {
      res.redirect('/');
    } else {
      res.sendFile(path.join(__dirname + '/build/admin.html'));
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
