'use strict';

const nconf = require.main.require('nconf');
// const settings = require('./settings');
class Routes {

  static setFileRequests(router, middleware) {
    router.get(nconf.get('upload_url') + ':hash/:tstamp/:fname',
                       middleware.buildHeader,
                       Routes.resolveRequest);
    router.get('/api/' + nconf.get('upload_url') + ':hash/:tstamp/:fname',
                       Routes.resolveRequest);
  }
  static setFileUpload(router, middleware) {
    //
    // https://github.com/NodeBB/nodebb/blob/master/src/routes/api.js#L29-L31
    //
    let multipart = require.main.require('connect-multiparty');
    let multipartMiddleware = multipart();
    let middlewares = [multipartMiddleware, middleware.validateFiles, middleware.applyCSRF];
    router.post('/plugins/nodebb-plugin-expiring-uploads/upload', middlewares, Routes.handleUpload);
  }
}

module.exports = Routes;
