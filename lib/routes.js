'use strict';

const path = require('path');
const nconf = require.main.require('nconf');
const validator = require.main.require('validator');
const async = require.main.require('async');
const settings = require('./settings');
const ExpiringFile = require('./expiring-file');
const Uploader = require('./uploader');

/**
 * @class - Sets and handles express routes
 */
class Routes {

  /**
   * Adds GET routes to resolve file download requests
   * @param {Object} router     - Express router
   * @param {Object} middleware - Express middlewares
   */
  static setFileRequests(router, middleware) {
    router.get(nconf.get('upload_url') + ':hash/:tstamp/:fname',
                       middleware.buildHeader,
                       Routes.resolveRequest);
    router.get('/api/' + nconf.get('upload_url') + ':hash/:tstamp/:fname',
                       Routes.resolveRequest);
  }
  /**
   * Adds POST route to receive files
   * @param {Object} router     - Express router
   * @param {Object} middleware - Express middlewares
   */
  static setFileUpload(router, middleware) {
    //
    // https://github.com/NodeBB/nodebb/blob/master/src/routes/api.js#L29-L31
    //
    let multipart = require.main.require('connect-multiparty');
    let multipartMiddleware = multipart();
    let middlewares = [multipartMiddleware,
                       middleware.validateFiles,
                       middleware.applyCSRF];
    router.post('/plugins/expiring-uploads/upload',
                middlewares, Uploader.receiveFiles);
  }

  static resolveRequest(data, cb) {}

  static sendError(req, res, errCode) {
    // 403 Forbidden, 404 Not Found, 410 Gone
    var tpl = (errCode === '404') ? '404' : 'expiring-uploads_' + errCode;
    // res.locals.isPlugin = true;
    res.status(parseInt(errCode, 10));
    res.render(tpl, {path: req.path});
  };

  /*
  static handleUpload(req, res, next) {
    if (settings.fileTypes.indexOf(path.extname(data.file.name)) > -1) {
      var expTstamp = Date.now() + settings.expireAfter;
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
        hash: ExpiringUploads.getHash(data),
        deleted: false,
        uid: data.uid
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
    console.log('handling upload', data);
    cb(new Error('moep'));
  };
  */
}

module.exports = Routes;
