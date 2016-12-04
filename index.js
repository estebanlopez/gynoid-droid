var fs = require('fs');

module.exports = function(context) {
  return {
    registerDroid: function(req, res) {
      var name = req.params.name === 'me' ? 'gynoid' : req.params.name;
      var token = req.params.token;

      context.gynoid.registerDroid(name, token)
        .then(function() {
          res.text('Droid ' + name + ' successfully registered').send();
        })
        .catch(function(err) {
          res.text('Unable to register Droid.\n```' + err + '```').send();
        });
    },
    unregisterDroid: function(req, res) {
      var name = req.params.name === 'me' ? 'gynoid' : req.params.name;

      context.gynoid.unregisterDroid(name)
        .then(function() {
          res.text('Droid ' + name + ' successfully unregistered').send();
        })
        .catch(function(err) {
          res.text('Unable to unregister Droid.\n```' + err + '```').send();
        });
    },
    reloadDroid: function(req, res) {
      var name = req.params.name === 'me' ? 'gynoid' : req.params.name;
      var droid = context.gynoid.droids[name];

      if (!droid) {
        return res.text('Unable to reload droid.\n```{error: "droid_unknown", message: "Could not find droid in the registry."}```').send();
      }

      context.gynoid.reloadDroid(name)
        .then(function() {
          res.text('Droid ' + name + ' successfully reloaded').send();
        })
        .catch(function(err) {
          res.text('Unable to reload Droid.\n```' + err + '```').send();
        });
    },
    extendDroid: function(req, res) {
      var gynoid = this;
      var name = req.params.name;
      var repo = req.params.repo;

      context.gynoid.installFromGitHub(name, repo)
        .then(function() {
          res.text('Droid ' + name + ' successfully extended').send();
          req.params.name = name;
          return gynoid.reloadDroid(req, res);
        })
        .catch(function(err) {
          res.text('Unable to extend Droid.\n```' + err + '```').send();
        });
    },
    removeExtension: function(req, res) {
      var name = req.params.name === 'me' ? 'gynoid' : req.params.name;
      var extension = req.params.extension;

      context.gynoid.removeExtension(name, extension)
        .then(function() {
          res.text('Extension ' + extension + ' successfully removed').send();
          req.params.name = name;
          return gynoid.reloadDroid(req, res);
        })
        .catch(function(err) {
          res.text('Unable to remove extension ' + extension + '.\n```' + err + '```').send();
        });
    },
    listExtensions: function(req, res) {
      var name = req.params.name === 'me' ? 'gynoid' : req.params.name;
      var droid = context.gynoid.droids[name];

      if (!droid) {
        return res.text('Unable to list extensions.\n```{error: "droid_unknown", message: "Could not find droid in the registry."}```').send();
      }

      var extensions = droid.extensions.map(function(extension) { return '`' + extension + '`';}).join(', ');
      var msg = extensions.length === 0 ? 'No extensions installed' : 'Installed extensions for ' + name + ': ' + extensions;
      return res.text(msg).send();
    },
    ping: function(req, res) {
      return res.text('`Hey Pong!`').send();
    },
    addKey: function(req, res) {
      try {
        var key = req.params.key;
        var value = req.params.value;
        var droid = req.params.droid;

        context.gynoid.addKey(droid, key, value);
        return res.text('Key added').send();
      } catch(e) {
        return res.text('Unable to add Key').send();
      }
    },
    removeKey: function(req, res) {
      try {
        var key = req.params.key;
        var droid = req.params.droid;

        context.gynoid.removeKey(droid, key);
        return res.text('Key was removed').send();
      } catch(e) {
        return res.text('Unable to remove Key').send();
      }
    },
    listKeys: function(req, res) {
      try {
        var droid = req.params.droid;
        var keys = context.gynoid.listKeys(droid);
        var text = keys.length === 0 ? 'No configured keys for this droid.' : keys.join('\n');

        return res.text('Configured keys for ' + droid + ':\n' + text).send();
      } catch(e) {
        return res.text('Unable to list the keys').send();
      }
    },
    listAllKeys: function(req, res) {
      try {
        var keys = context.gynoid.listAllKeys();
        var text = keys.length === 0 ? 'No keys found.' : keys.join('\n');
        return res.text('Configured keys:\n' + text).send();
      } catch(e) {
        return res.text('Unable to list the keys').send();
      }
    },
    secure: function(req, res) {
      try {
        var droid = require('./droid.json');
        droid.actions = droid.actions.map((action) => {
          action.acls = action.acls || {};
          action.acls.channels = req.params.channel;
          return action;
        });

        fs.writeFileSync(__dirname + '/droid.json', JSON.stringify(droid, null, 2));
        req.params.name = 'me';
        res.text('Secured gynoid in channel ' + req.params.channel).send();
        return this.reloadDroid(req, res);
      } catch (err) {
        return res.text('Unable to secure gynoid.\n```' + err + '```').send();
      }
    }
  };
};
