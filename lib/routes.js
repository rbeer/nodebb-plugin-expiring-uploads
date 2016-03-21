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

  static resolveRequest(req, res, next) {
    var hash = req.params.hash;
    // timestamp comes in as hex string
    var tstamp = parseInt(req.params.tstamp, 36);
    var fname = req.params.fname;

    // return when downloading files requires to be logged in
    if (parseInt(meta.config.privateUploads, 10) === 1 && !req.user) {
      return Routes.sendError(req, res, '403');
    }
    // return when file (according to request url) is expired.
    // the url could be wrong, but then it's up for grabs, anyway :)
    if (settings().expireAfter !== 0 && Date.now() > tstamp) {
      return Routes.sendError(req, res, '410');
    }
    async.waterfall([
      function(next) {
        // get ID of upload
        DB.getSortedSetRevRangeByScore('expiring-uploads:ids', 0, 1,
                                       tstamp, tstamp, next);
      },
      function(id, next) {
        if (id.length === 0) {
          return Routes.sendError(req, res, '404');
        }
        // get upload info to perform checks
        DB.getObject('expiring-uploads:' + id[0], next);
      }], function(err, fields) {
      if (err) {
        return next(err);
      }
      if (!fields) {
        console.log('no fields');
        return Routes.sendError(req, res, '410');
      }
      var hashMatch = (fields.hash === hash);
      var timeMatch = (parseInt(fields.expTstamp, 10) === tstamp);
      var nameMatch = (fields.fileName.toLowerCase() === tstamp + '-' + fname);
      if (hashMatch && timeMatch && nameMatch) {
        res.status(200);
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1
        res.setHeader('Content-Disposition', 'attachement; filename="' +
                                             fields.origName + '"');
        res.sendFile(nconf.get('base_dir') + Routes.storage +
                     fields.fileName);
      } else {
        Routes.sendError(req, res, '404');
      }
    });
  };

  static sendError(req, res, errCode) {
    // 403 Forbidden, 404 Not Found, 410 Gone
    var tpl = (errCode === '404') ? '404' : 'expiring-uploads_' + errCode;
    // res.locals.isPlugin = true;
    res.status(parseInt(errCode, 10));
    res.render(tpl, {path: req.path});
  };
}

module.exports = Routes;
