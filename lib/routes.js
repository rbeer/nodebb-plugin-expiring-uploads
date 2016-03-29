'use strict';

const fs = require('fs');
const nconf = require.main.require('nconf');
const Uploader = require('./uploader');
const meta = require.main.require('./src/meta');
const DB = require('./dbwrap');
const async = require.main.require('async');
const Admin = require('./admin');

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
               middleware.buildHeader, Routes.resolveRequest);
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

  static setAdmin(router, middleware) {
    router.get('/admin/plugins/expiring-uploads',
               middleware.applyCSRF, middleware.admin.buildHeader,
               Admin.render);
    router.get('/api/admin/plugins/expiring-uploads',
               middleware.applyCSRF,
               Admin.render);
  }

  /**
   * Tries to resolve a file GET request.
   * Answers to client with found file or error page.
   * @param  {IncomingMessage}   req  - Express request
   * @param  {ServerResponse}    res  - Express response
   * @param  {Function}          next - Express callback
   */
  static resolveRequest(req, res, next) {
    let hash = req.params.hash;
    let tstamp = parseInt(req.params.tstamp, 36);
    let fname = req.params.fname;

    // Return 403 when downloading files requires to be logged in
    if (parseInt(meta.config.privateUploads, 10) === 1 && !req.user) {
      return Routes.sendError(req, res, '403');
    }
    // Return 404 when file is expired, according to request url.
    // The url could be wrong, but then it's up for grabs, anyway :)
    if (Date.now() > tstamp) {
      return Routes.sendError(req, res, '410');
    }

    async.waterfall([
      function(next) {
        // get ID of upload
        DB.getFileId(tstamp, next);
      },
      function(id, next) {
        if (id.length === 0) {
          return Routes.sendError(req, res, '404');
        }
        // get upload info to perform checks
        DB.getExpiringFiles(null, [ { value: id[0] } ], next);
      }], function(err, files) {
      if (err) {
        return next(err);
      }
      if (!files || !files[0]) {
        return Routes.sendError(req, res, '410');
      }
      let file = files[0];
      let hashMatch = (file._uploadMeta.hash === hash);
      let timeMatch = (parseInt(file._uploadMeta.expTstamp, 10) === tstamp);
      let nameMatch = (file._uploadMeta.fileName.toLowerCase() === tstamp + '-' + fname);
      fs.access(file.absolutePath, fs.R_OK, (err) => {
        if (err || !(hashMatch && timeMatch && nameMatch)) {
          return Routes.sendError(req, res, '404');
        } else {
          res.status(200);
          // http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1
          res.setHeader('Content-Disposition', `attachement; filename="${file._uploadMeta.origName}"`);
          res.sendFile(file.absolutePath);
        }
      });
    });
  };

  /**
   * Sends error page to client
   * @param  {IncomingMessage} req     - Express request
   * @param  {ServerResponse}  res     - Express response
   * @param  {String}          errCode - HTTP Error code (one of 403 Forbidden, 404 Not Found, 410 Gone)
   */
  static sendError(req, res, errCode) {
    var tpl = (errCode === '404') ? '404' : 'expiring-uploads_' + errCode;
    res.status(parseInt(errCode, 10));
    res.render(tpl, {path: req.path});
  };
}

module.exports = Routes;
