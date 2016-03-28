'use strict';

const nconf = require.main.require('nconf');
const Uploader = require('./uploader');
const settings = require('./settings');
const meta = require.main.require('./src/meta');
const DB = require('./dbwrap');
const async = require.main.require('async');

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

  /**
   * Tries to resolve a file GET request.
   * Answers to client with found file or error page.
   * @param  {IncomingMessage}   req  - Express request
   * @param  {ServerResponse}    res  - Express response
   * @param  {Function}          next - Express callback
   */
  static resolveRequest(req, res, next) {
    var hash = req.params.hash;
    var tstamp = parseInt(req.params.tstamp, 36);
    var fname = req.params.fname;

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
        console.log('no file found');
        return Routes.sendError(req, res, '410');
      }
      var hashMatch = (files.uploadMeta.hash === hash);
      var timeMatch = (parseInt(files.uploadMeta.expTstamp, 10) === tstamp);
      var nameMatch = (files.uploadMeta.fileName.toLowerCase() === tstamp + '-' + fname);
      if (hashMatch && timeMatch && nameMatch) {
        res.status(200);
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1
        res.setHeader('Content-Disposition', 'attachement; filename="' +
                                             files.uploadMeta.origName + '"');
        res.sendFile(nconf.get('base_dir') + settings().storage +
                     files.uploadMeta.fileName);
      } else {
        Routes.sendError(req, res, '404');
      }
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
