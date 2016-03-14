'use strict';

var fs = require('fs');
var path = require('path');
var xxh = require('xxhash');
var nconf = require.main.require('nconf');
var winston = require.main.require('winston');
var async = require.main.require('async');
var db = require.main.require('./src/database');
var utils = require.main.require('./public/src/utils');
var meta = require.main.require('./src/meta');
var validator = require.main.require('validator');
var file = require.main.require('./src/file');
// var PluginSocket = require.main.require('./src/socket.io/plugins');

var ExpiringUploads = {
  storage: '/expiring_uploads/', // relative to nconf.get('base_dir')
  hiddenTypes: [],
  expireAfter: 0,
  customTstamp: false,
  delFiles: false,
  delInterval: undefined,
  linkText: '',
  setLinkText: false,
  Admin: require('./expups_admin')
};

ExpiringUploads.init = function(app, cb) {
  async.series([
    function(next) {
      // get config or create if none found
      db.getObject('settings:expiring-uploads', function(err, config) {
        if (err || !config || !config.storage) {
          config = {
            storage: ExpiringUploads.storage,
            expireAfter: ExpiringUploads.expireAfter,
            hiddenTypes: ExpiringUploads.hiddenTypes,
            customTstamp: ExpiringUploads.customTstamp,
            delFiles: ExpiringUploads.delFiles,
            linkText: ExpiringUploads.linkText,
            setLinkText: ExpiringUploads.setLinkText,
            lastID: '0'
          };
          db.setObject('settings:expiring-uploads', config);
        } else {
          ExpiringUploads.storage = config.storage;
          ExpiringUploads.expireAfter = parseInt(config.expireAfter, 10);
          ExpiringUploads.hiddenTypes = config.hiddenTypes.split(',');
          ExpiringUploads.customTstamp = (config.customTstamp === 'true');
          ExpiringUploads.delFiles = (config.delFiles === 'true');
          ExpiringUploads.linkText = config.linkText;
          ExpiringUploads.setLinkText = (config.setLinkText === 'true');
        }
        next();
      });
    },
    function(next) {
      // everything in /public is out of the question, since it is
      // automatically exposed to the public (hence the name - maybe? ^_^)
      var pubTestPath = nconf.get('base_dir') + '/public';
      if (ExpiringUploads.storage.indexOf(pubTestPath) > -1) {
        winston.error('[plugin:expiring-uploads] Upload directory is ' +
                      'publicly accessible. Refusing to activate plugin!');
        return next(new Error('Public directory \'' + pubTestPath +
                              '\' not allowed as storage.'));
      }
      next();
    },
    function(next) {
      ExpiringUploads.createStorage(next);
    }], function(err) {
    if (err) {
      return cb(err);
    }
    // route to catch file requests
    app.router.get(nconf.get('upload_url') + ':hash/:tstamp/:fname',
                   app.middleware.buildHeader,
                   ExpiringUploads.resolveRequest);
    app.router.get('/api/' + nconf.get('upload_url') + ':hash/:tstamp/:fname',
                   ExpiringUploads.resolveRequest);
    // set interval for deleting files, when set
    if (ExpiringUploads.delFiles && ExpiringUploads.expireAfter > 0) {
      ExpiringUploads.setDelInterval();
    }
    // init admin
    ExpiringUploads.Admin.init(app, cb);
  });
};

ExpiringUploads.setDelInterval = function() {
  winston.info('[plugins:expiring-uploads] ' +
               'Scheduled deleting expired files every ' +
               (ExpiringUploads.expireAfter / 1000) + ' seconds');
  ExpiringUploads.delInterval = setInterval(ExpiringUploads.deleteExpiredFiles,
                                            ExpiringUploads.expireAfter);
};

ExpiringUploads.clearDelInterval = function() {
  clearInterval(ExpiringUploads.delInterval);
  ExpiringUploads.delInterval = undefined;
};

ExpiringUploads.deleteExpiredFiles = function() {
  async.waterfall([
    function(next) {
      // get ids for expired uploads
      db.getSortedSetRangeByScoreWithScores('expiring-uploads:ids', 0, -1,
                                            1, Date.now(), next);
    },
    function(fileIds, next) {
      // no expired files; exit
      if (fileIds.length === 0) {
        var err = new RangeError('No expired uploads found.');
        err.code = 'ENOEXP';
        return next(err);
      }
      // get filenames of expired files
      var keys = fileIds.map(function(id) {
        return 'expiring-uploads:' + id.value;
      });
      db.getObjectsFields(keys, ['fileName'], function(err, files) {
        if (err) {
          return next(err);
        }
        next(null, fileIds, keys, files);
      });
    },
    function(fileIds, keys, files, next) {
      // delete files in fs
      async.each(files, function(file, cb) {
        var filePath = path.join(nconf.get('base_dir'),
                                 ExpiringUploads.storage, file.fileName);
        fs.unlink(filePath, function(err) {
          if (err) {
            if (err.code === 'ENOENT') {
              // no reason to panic, if file is not found
              winston.warn('[plugins:expiring-uploads] Couldn\'t delete ' +
                           filePath + ' [Not found]');
            } else {
              // everything else could be a serious problem; abort
              cb(err);
              return next(err);
            }
          } else {
            winston.verbose('[plugins:expiring-uploads] Deleted ' + filePath);
          }
          cb();
        });
      }, function(err) {
        if (err) {
          return winston.warn(err);
        }
      });
      next(null, fileIds, keys);
    },
    function(fileIds, keys, next) {
      // delete files objects in DB
      db.deleteAll(keys, function(err) {
        if (err) {
          return next(err);
        }
        // delete files references from ID store in DB
        var scores = Array.apply(null, { length: fileIds.length })
                     .map(function() { return 0; });
        var values = Array.apply(null, { length: fileIds.length })
                     .map(function() { return fileIds[arguments[1]].value; });
        db.sortedSetAdd('expiring-uploads:ids', scores, values, next);
      });
    }
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

ExpiringUploads.createStorage = function(cb) {
  var absPath = nconf.get('base_dir') + ExpiringUploads.storage;
  // create 'storage' directory
  fs.mkdir(absPath, function(err) {
    if (err) {
      if (err.code === 'EEXIST') {
        // if folder exists, we're good.
        // could become a point to do some cleanup, though.
        return cb();
      } else {
        // unexpected error; scream panic back into the log ;)
        winston.error('[plugin:expiring-uploads] Unexpected error while ' +
                      'creating ' + absPath);
        return cb(err);
      }
    }
    winston.warn('[plugin:expiring-uploads] Storage folder \'' +
                    absPath + '\' not found. Created it.');
    cb();
  });
};

ExpiringUploads.handleUpload = function(data, cb) {
  if (!ExpiringUploads.checkPermissions(data, cb)) {
    return;
  }
  if (ExpiringUploads.hiddenTypes.indexOf(path.extname(data.file.name)) > -1) {
    var expTstamp = Date.now() + ExpiringUploads.expireAfter;
    // only used for the link; all internals use the numeric expTstamp
    var hexTstamp = expTstamp.toString(16);

    var filename = data.file.name.split('.');
    filename.map((name) => utils.slugify(name));
    filename = filename.join('.');
    filename = validator.escape(filename).substr(0, 255);
    var uploadData = {
      fileName: expTstamp + '-' + filename,
      origName: data.file.name,
      expTstamp: expTstamp,
      hash: ExpiringUploads.getHash(data)
    };

    async.parallel({
      fs: function(next) {
        ExpiringUploads.saveFile(data.file.path, uploadData.fileName, next);
      },
      db: function(next) {
        ExpiringUploads.writeToDB(uploadData, next);
      }
    }, function(err) {
      if (err) {
        return cb(err);
      }
      cb(null, {
        url: nconf.get('upload_url') + uploadData.hash + '/' + hexTstamp +
             '/' + uploadData.fileName.substring(14),
        name: data.file.name
      });
    });
  } else {
    ExpiringUploads.doStandard(data, cb);
  }
};

ExpiringUploads.getHash = function(uploadData) {
  // key is generated from 'NodeBB secret'
  var key = nconf.get('secret');
  key = parseInt('0x' + key.substring(0, key.indexOf('-')), 16);
  return xxh.hash(new Buffer(JSON.stringify(uploadData)), key).toString(16);
};

ExpiringUploads.checkPermissions = function(data, cb) {
  if (parseInt(meta.config.allowFileUploads, 10) !== 1) {
    cb(new Error('[[error:uploads-are-disabled]]'));
    return false;
  }

  if (!data.file) {
    cb(new Error('[[error:invalid-file]]'));
    return false;
  }

  if (data.file.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
    cb(new Error('[[error:file-too-big, ' +
                 meta.config.maximumFileSize + ']]'));
    return false;
  }
  return true;
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

ExpiringUploads.writeToDB = function(uploadData, cb) {
  async.waterfall([
    function(next) {
      db.incrObjectField('settings:expiring-uploads', 'lastID', next);
    },
    function(id, next) {
      db.sortedSetAdd('expiring-uploads:ids', uploadData.expTstamp, id, function() {
        return next(null, id);
      });
    },
    function(id, next) {
      db.setObject('expiring-uploads:' + id, uploadData, next);
    }
  ],
  function(err) {
    if (err) {
      return cb(err);
    }
  });
  return cb();
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

module.exports = ExpiringUploads;
