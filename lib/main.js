'use strict';

var async = require.main.require('async');

// ---------------------------
const Routes = require('./routes');
const Settings = require('./settings');
const FileHandler = require('./filehandler');
// ---------------------------
var deleteScheduler;
var ExpiringUploads = {
  Admin: require('./admin')
};

ExpiringUploads.init = function(app, cb) {
  async.series([
    // init settings
    Settings,
    // setup storage
    FileHandler.checkPublicStorage,
    FileHandler.createStorage,
    function setupRoutes(next) {
      try {
        Routes.setFileRequests(app.router, app.middleware);
        Routes.setFileUpload(app.router, app.middleware);
        Routes.setAdmin(app.router, app.middleware);
        next();
      } catch (err) {
        next(err);
      }
    }
  ], (err) => {
    if (err) return cb(err);
    deleteScheduler = new FileHandler();
    // set interval for deleting files
    if (Settings().deleteFiles && Settings().deleteFilesInterval > 0 && Settings().expireAfter > 0) {
      deleteScheduler.startFileDelete();
    }
    // init admin
    ExpiringUploads.Admin.init(app, cb);
  });
};

ExpiringUploads.reload = function(data, cb) {
  Settings().persist();
  cb(null);
};

module.exports = ExpiringUploads;
