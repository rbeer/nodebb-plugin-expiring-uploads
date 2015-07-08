'use strict';

var nconf = require.main.require('nconf');
var winston = require.main.require('winston');
var async = require.main.require('async');
var db = require.main.require('./src/database');
// used for standard upload functionality
var meta = require.main.require('./src/meta');
var validator = require.main.require('validator');
var file = require.main.require('./src/file');
//
var fs = require('fs');
var path = require('path');
var xxh = require('xxhash');

var ExpiringUploads = {
  // relative to nconf.get('base_dir')
  storage: '/expiring_uploads/',
  hiddenTypes: ['.zip', '.rar', '.txt', '.html'],
  // 60*60*24 (= 24 hours)
  // will be handled by admin UI
  expireAfter: 86400
};
ExpiringUploads.Admin = {};

ExpiringUploads.init = function(app, cb) {
  async.waterfall([
    function(next) {
      // get config or create if none found
      db.getObject('settings:expiring-uploads', function(err, config) {
        if (err || !config) {
          config = {
            storage: ExpiringUploads.storage,
            expireAfter: ExpiringUploads.expireAfter,
            hiddenTypes: ExpiringUploads.hiddenTypes,
            lastID: '0'
          };
          db.setObject('settings:expiring-uploads', config);
        } else {
          ExpiringUploads.storage = config.storage;
          ExpiringUploads.expireAfter = parseInt(config.expireAfter, 10);
          ExpiringUploads.hiddenTypes = config.hiddenTypes.split(',');
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
      var absPath = nconf.get('base_dir') + ExpiringUploads.storage;
      // create 'storage' directory
      fs.mkdir(absPath, function(err) {
        if (err) {
          if (err.code === 'EEXIST') {
            // if folder exists, we're good.
            // could become a point to do some cleanup, though.
            return next();
          } else {
            // unexpected error; scream panic back into the log ;)
            winston.error('[plugin:expiring-uploads] Unexpected error while ' +
                          'creating ' + absPath);
            return next(err);
          }
        }
        winston.warn('[plugin:expiring-uploads] Storage folder \'' +
                        absPath + '\' not found. Created it.');
        next();
      });
    }],
    function(err) {
      if (err) {
        return cb(err);
      }
      // setup route to catch file requests
      app.router.get(nconf.get('upload_url') + ':hash/:tstamp/:fname',
                     ExpiringUploads.resolveRequest);
      cb(null, app);
    });
};

ExpiringUploads.handleUpload = function(data, cb) {
  // data
  // {
  //   file: {
  //     fieldName: 'files[]',
  //     originalFilename: 'fish-common_2.1.2+dfsg1-1_all.deb',
  //     path: '/tmp/25404-mjr1ur.deb',
  //     headers: [Object],
  //     ws: [Object],
  //     size: 466926,
  //     name: 'fish-common_2.1.2+dfsg1-1_all.deb',
  //     type: 'application/x-deb'
  //   },
  //  uid: '1'
  // }
  //
  // cb(err, {url, name})
  // nconf.get('base_dir'); /var/nodeBB

  if (ExpiringUploads.hiddenTypes.indexOf(path.extname(data.file.name)) > -1) {
    var tstamp = Date.now();
    var hexTstamp = tstamp.toString(16);
    var imgData = {
      tstamp: tstamp,
      hexTstamp: hexTstamp,
      expiration: tstamp + ExpiringUploads.expireAfter,
      safePath: ExpiringUploads.storage + tstamp + '_' + data.file.name,
      hash: ExpiringUploads.getHash(data)
    };

    async.parallel({
      fs: function(next) {
        ExpiringUploads.saveFile(data.file.path, imgData.safePath, next);
      },
      db: function(next) {
        ExpiringUploads.writeToDB(imgData, next);
      }
    }, function(err) {
      if (err) {
        return cb(err);
      }
      cb(null, {
        url: nconf.get('upload_url') + imgData.hash + '/' + hexTstamp +
             '/' + data.file.name,
        name: data.file.name
      });
    });
  } else {
    ExpiringUploads.doStandard(data, cb);
  }
};

ExpiringUploads.getHash = function(imgData) {
  // key is generated from 'NodeBB secret'
  var key = nconf.get('secret');
  key = parseInt('0x' + key.substring(0, key.indexOf('-')), 16);
  return xxh.hash(new Buffer(JSON.stringify(imgData)), key).toString(16);
};

ExpiringUploads.doStandard = function(data, cb) {
  if (parseInt(meta.config.allowFileUploads, 10) !== 1) {
    return cb(new Error('[[error:uploads-are-disabled]]'));
  }

  if (!data.file) {
    return cb(new Error('[[error:invalid-file]]'));
  }

  if (data.file.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
    return cb(new Error('[[error:file-too-big, ' +
                        meta.config.maximumFileSize + ']]'));
  }

  var filename = data.file.name || 'upload';

  filename = Date.now() + '-' + validator.escape(filename).substr(0, 255);
  file.saveFileToLocal(filename, 'files', data.file.path, function(err, upload) {
    if (err) {
      return cb(err);
    }
    console.log(upload.url);
    cb(null, {
			url: nconf.get('relative_path') + upload.url,
      name: data.file.name
		});
  });
};

ExpiringUploads.saveFile = function(src, dest, cb) {
  console.log(src);
  console.log(dest);
  var is = fs.createReadStream(src);
  var os = fs.createWriteStream(nconf.get('base_dir') + dest);

  is.on('end', cb);
  os.on('error', cb);
  is.pipe(os);
};

ExpiringUploads.writeToDB = function(imgData, cb) {
  async.waterfall([
    function(next) {
      db.incrObjectField('settings:expiring-uploads', 'lastID', next);
    },
    function(id, next) {
      db.sortedSetAdd('expiring-uploads:ids', imgData.expiration, id, function() {
        return next(null, id);
      });
    },
    function(id, next) {
      db.setObject('expiring-uploads:' + id, imgData, next);
    }
  ],
  function(err) {
    if (err) {
      return cb(err);
    }
  });

  console.log('writeToDB');
  console.log(imgData);
  return cb();
};

ExpiringUploads.resolveRequest = function(req, res, cb) {
  var hash = req.params.hash;
  var tstamp = req.params.tstamp;
  var fname = req.params.fname;

  console.log('asked for');
  console.log('hash: ' + hash);
  console.log('tstamp: ' + tstamp);
  console.log('filename: ' + fname);
};

ExpiringUploads.sendFile = function() {

};

ExpiringUploads.Admin.addMenuItem = function(custom_header, cb) {
  custom_header.plugins.push({
    route: '/plugins/expups',
    icon: 'fa-clock-o',
    name: 'ExpiringUploads'
  });
  cb(null, custom_header);
};

module.exports = ExpiringUploads;
