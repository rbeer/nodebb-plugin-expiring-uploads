'use strict';

const nconf = require.main.require('nconf');
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
}

module.exports = Routes;
