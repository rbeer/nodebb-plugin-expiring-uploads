'use strict';

var async = require.main.require('async');

// ---------------------------
const settings = require('./lib/settings');
const FileHandler = require('./lib/filehandler');
var deleteScheduler;
const Routes = require('./lib/routes');
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ---------------------------
var ExpiringUploads = {
  Admin: require('./expups_admin')
};

ExpiringUploads.init = function(app, cb) {
  async.series([
    // init settings
    settings,
    // setup storage
    FileHandler.checkPublicStorage,
    FileHandler.createStorage,
    function setupRoutes(next) {
      try {
        Routes.setFileRequests(app.router, app.middleware);
        Routes.setFileUpload(app.router, app.middleware);
        next();
      } catch (err) {
        next(err);
      }
    }
  ], (err) => {
    if (err) return cb(err);
    deleteScheduler = new FileHandler();
    // set interval for deleting files
    if (settings().deleteFiles && settings().deleteFilesInterval > 0 && settings().expireAfter > 0) {
      deleteScheduler.startFileDelete();
    }
    // init admin
    ExpiringUploads.Admin.init(app, cb);
  });
};

ExpiringUploads.reload = function(data, cb) {
  settings().persist();
  cb(null);
};

module.exports = ExpiringUploads;
