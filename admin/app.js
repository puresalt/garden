/* global __dirname */

const serverPort = 4002;

const fs = require('fs');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const url = require('url');
const fetch = require('node-fetch');
const Config = require(path.join(__dirname, '../common/config'));
const CONFIG = Config(process.env);
const express = require('express');
const session = require('express-session');
const mustache = require('mustache');
mustache.escape = _ => _;

const templateFileDirectory = path.join(__dirname, 'template');
const stateLookup = require(path.join(__dirname, '../src/data/stateLookup.json'));
const STREAMER_PERMISSION = 0x00000100;

const accessConfig = {
  authorizeUrl: CONFIG.discord.client.authorizeUrl,
  clientId: CONFIG.discord.client.id,
  redirectUrl: CONFIG.discord.client.redirectUrl,
  responseType: CONFIG.discord.client.responseType,
  scope: CONFIG.discord.client.scope
};

const runApp = () => {

  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(session({secret: CONFIG.session.secret}));

  app.get('/', (req, res) => {
    if (req.session.isAdmin) {
      return res.redirect('/admin');
    }
    res.send(mustache.render(fs.readFileSync(path.join(templateFileDirectory, 'index.html.mustache'), 'utf8'), accessConfig));
  });

  app.get('/callback', (req, res) => {
    if (req.query.code) {
      const accessCode = req.query.code;
      const data = {
        client_id: CONFIG.discord.client.id,
        client_secret: CONFIG.discord.client.secret,
        grant_type: 'authorization_code',
        redirect_uri: CONFIG.discord.client.redirectUrl,
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
              const guild = guildData.find(item => item.id === CONFIG.discord.guild.id);
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

  app.get('/admin', (req, res) => {
    if (false && !req.session.isAdmin) {
      return res.send(mustache.render(fs.readFileSync(path.join(templateFileDirectory, 'unauthorized.html.mustache'), 'utf8'), accessConfig));
    }

    const stateList = [];
    for (const key in stateLookup) {
      if (!stateLookup.hasOwnProperty(key)) {
        continue;
      }
      stateList.push({
        key: key,
        name: stateLookup[key],
        selected: key === 'PA'
      });
    }

    res.send(mustache.render(fs.readFileSync(path.join(templateFileDirectory, 'admin.html.mustache'), 'utf8'), {
      stateList: stateList
    }));
  });

  app.post('/admin/save', (req, res) => {
    console.log(req);
    return res.json(req.body);
    
    if (!req.session.isAdmin) {
      return res.status(401).json({error: 'unauthorized'});
    }

    return res.status(200).json({});
  });

  app.get('/quit', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/');
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
