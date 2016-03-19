'use strict';

var fs = require('fs');
var nconf = require.main.require('nconf');
var winston = require.main.require('winston');
var async = require.main.require('async');
var db = require.main.require('./src/database');
var meta = require.main.require('./src/meta');
var validator = require.main.require('validator');
var file = require.main.require('./src/file');
// ---------------------------
const settings = require('./lib/settings');
const FileHandler = require('./lib/filehandler');
const filehandler = new FileHandler();
const DB = require('./lib/dbwrap');
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
/*DB.getExpiredIds(function() {
  console.log(arguments[1]);
});*/
const Routes = require('./lib/routes');
// ---------------------------
var ExpiringUploads = {
  Admin: require('./expups_admin')
};

const logTag = (strings) => '[plugin:expiring-uploads]' + strings[0];

ExpiringUploads.init = function(app, cb) {
  async.series([
    settings,
    function(next) {
      winston.info(logTag` Settings loaded.`);
      // everything in /public is out of the question, since it is
      // automatically exposed to the public (hence the name - maybe? ^_^)
      var pubTestPath = nconf.get('base_dir') + '/public';
      if (settings().storage.indexOf(pubTestPath) > -1) {
        winston.error(logTag` Upload directory is publicly accessible. Refusing to activate plugin!`);
        return next(new Error(`Public directory '${pubTestPath}' not allowed as storage.`));
      }
      next();
    },
    function(next) {
      FileHandler.createStorage(next);
    }], function(err) {
    if (err) {
      return cb(err);
    }
    Routes.setFileRequests(app.router, app.middleware);
    Routes.setFileUpload(app.router, app.middleware);
    // set interval for deleting files, when set
    if (settings.deleteFiles && settings.expireAfter > 0) {
      filehandler.startFileDelete();
    }
    // init admin
    ExpiringUploads.Admin.init(app, cb);
  });
};

ExpiringUploads.deleteExpiredFiles = function() {
  async.waterfall([
    DB.getExpiredIds,
    DB.getExpiringFiles,
    FileHandler.deleteFiles,
    DB.setFilesDeleted
  ], function(err, keys) {
    if (err) {
      if (err.code === 'ENOEXP') {
        return winston.info('[plugins:expiring-uploads] ' + err.message);
      }
      winston.error('[plugins:expiring-uploads] ' +
                    'Error while deleting expired files');
      winston.error(err);
    }
  });
};



ExpiringUploads.doStandard = function(data, cb) {
  var filename = data.file.name || 'upload';

  filename = Date.now() + '-' + validator.escape(filename).substr(0, 255);
  file.saveFileToLocal(filename, 'files', data.file.path,
                       function(err, upload) {
                         if (err) {
                           return cb(err);
                         }
                         cb(null, {
                           url: nconf.get('relative_path') + upload.url,
                           name: data.file.name
                         });
                       });
};

ExpiringUploads.saveFile = function(src, dest, cb) {
  var is = fs.createReadStream(src);
  var os = fs.createWriteStream(nconf.get('base_dir') +
                                ExpiringUploads.storage + dest);

  is.on('end', cb);
  os.on('error', cb);
  is.pipe(os);
};

ExpiringUploads.resolveRequest = function(req, res, cb) {
  var hash = req.params.hash;
  // timestamp comes in as hex string
  var tstamp = parseInt('0x' + req.params.tstamp, 16);
  var fname = req.params.fname;

  // return when downloading files requires to be logged in
  if (parseInt(meta.config.privateUploads, 10) === 1 && !req.user) {
    return ExpiringUploads.sendError(req, res, '403');
  }
  // return when file (according to request url) is expired.
  // the url could be wrong, but then it's up for grabs, anyway :)
  if (ExpiringUploads.expireAfter !== 0 && Date.now() > tstamp) {
    return ExpiringUploads.sendError(req, res, '410');
  }
  async.waterfall([
    function(next) {
      // get ID of upload
      db.getSortedSetRevRangeByScore('expiring-uploads:ids', 0, 1,
                                     tstamp, tstamp, next);
    },
    function(id, next) {
      if (id.length === 0) {
        return ExpiringUploads.sendError(req, res, '404');
      }
      // get upload info to perform checks
      db.getObject('expiring-uploads:' + id[0], next);
    }], function(err, fields) {
      if (err) {
        return cb(err);
      }
      if (!fields) {
        console.log('no fields');
        return ExpiringUploads.sendError(req, res, '410');
      }
      var hashMatch = (fields.hash === hash);
      var timeMatch = (parseInt(fields.expTstamp, 10) === tstamp);
      var nameMatch = (fields.fileName.toLowerCase() === tstamp + '-' + fname);
      if (hashMatch && timeMatch && nameMatch) {
        res.status(200);
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1
        res.setHeader('Content-Disposition', 'attachement; filename="' +
                                             fields.origName + '"');
        res.sendFile(nconf.get('base_dir') + ExpiringUploads.storage +
                     fields.fileName);
      } else {
        ExpiringUploads.sendError(req, res, '404');
      }
    });
};

ExpiringUploads.sendError = function(req, res, errCode) {
  // 403 Forbidden, 404 Not Found, 410 Gone
  var tpl = (errCode === '404') ? '404' : 'expiring-uploads_' + errCode;
  // res.locals.isPlugin = true;
  res.status(parseInt(errCode, 10));
  res.render(tpl, {path: req.path});
};

ExpiringUploads.reload = function(data, cb) {
  settings.persist();
  cb(null);
};

module.exports = ExpiringUploads;
