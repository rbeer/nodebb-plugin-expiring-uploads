'use strict';

var db = require.main.require('./src/database');
var nconf = require.main.require('nconf');
var AdminSocket = require.main.require('./src/socket.io/admin');
const UIError = require('../uierror');
var Admin = {};

Admin.init = function(app, cb) {
  Admin._initSockets();
  // admin routes
  app.router.get('/admin/plugins/expiring-uploads',
                 app.middleware.applyCSRF, app.middleware.admin.buildHeader,
                 Admin.render);
  app.router.get('/api/admin/plugins/expiring-uploads',
                 app.middleware.applyCSRF,
                 Admin.render);
  cb(null, app);
};

Admin._initSockets = function() {
  AdminSocket.plugins.ExpiringUploads = {};
  AdminSocket.plugins.ExpiringUploads.saveSettings = (socket, data, cb) => {
    Admin.saveSettings(data, cb);
  };
  AdminSocket.plugins.ExpiringUploads.getFileData = (socket, data, cb) => {
    let keys = Array(data.end - data.start).fill('').map((key, idx) =>
      'expiring-uploads:' + (data.start + idx));
    db.getObjects(keys, (err, fileData) => {
      if (err) {
        return cb(new UIError('Error while retrieving files data from DB.',
                              'EDBREAD', err));
      }
      console.log(fileData);
    });
  };
  AdminSocket.plugins.ExpiringUploads.deleteFile = (socket, id, cb) => {
    
    db.setObject('expiring-uploads:' + id, (err) => {
      if (err) {
        return cb(new UIError('Error while deleting file from DB.',
                              'EDBWRITE', err));
      }
    });
  };
};

Admin.addMenuItem = function(custom_header, cb) {
  custom_header.plugins.push({
    route: '/plugins/expiring-uploads',
    icon: 'fa-clock-o',
    name: 'Expiring Uploads'
  });
  cb(null, custom_header);
};

Admin.render = function(req, res) {
  var ExpiringUploads = module.parent.exports;
  // templates.js can only access objects in arrays - I think. :/
  var types = ExpiringUploads.expiringTypes
              .map(function(type) {
                return {ftype: type};
              });
  var tplData = {
    csrf: req.csrfToken(),
    storagePath: ExpiringUploads.storage,
    expTstamp: ExpiringUploads.expireAfter / 1000, // humans do time in sec...
    expiringTypes: types,
    delFiles: ExpiringUploads.delFiles,
    basePath: nconf.get('base_dir'),
    linkText: ExpiringUploads.linkText,
    setLinkText: ExpiringUploads.setLinkText
  };
  res.render('admin/plugins/expiring-uploads', tplData);
};

Admin.saveSettings = function(settings, cb) {
  var ExpiringUploads = module.parent.exports;
  var dbData = {
    storage: settings.storage,
    expireAfter: parseInt(settings.expireAfter, 10) * 1000, // ...js in msec
    expiringTypes: settings.expiringTypes,
    delFiles: settings.delFiles,
    linkText: settings.linkText,
    setLinkText: settings.setLinkText
  };
  var storageChanged = (ExpiringUploads.storage !== settings.storage);
  var expireAfterChanged = dbData.delFiles &&
                           ExpiringUploads.expireAfter !== dbData.expireAfter;
  db.setObject('settings:expiring-uploads', dbData, function(err) {
    if (err) {
      let e = new Error('Writing settings to DB failed.');
      e.code = 'EDBWRITE';
      e.reason = err;
      return cb(e);
    }
    // clear possibly set delete file interval, before changing values
    if (expireAfterChanged && ExpiringUploads.delInterval !== undefined) {
      ExpiringUploads.clearDelInterval();
    }
    ExpiringUploads.storage = dbData.storage;
    ExpiringUploads.expireAfter = dbData.expireAfter;
    ExpiringUploads.expiringTypes = dbData.expiringTypes.split(',');
    ExpiringUploads.delFiles = dbData.delFiles;
    ExpiringUploads.linkText = dbData.linkText;
    ExpiringUploads.setLinkText = dbData.setLinkText;
    if (expireAfterChanged && ExpiringUploads.expireAfter > 0) {
      ExpiringUploads.setDelInterval();
    }
    if (storageChanged) {
      ExpiringUploads.createStorage(function(err) {
        if (err) {
          let e = new Error('Creating storage directory failed.');
          e.code = 'EFSWRITE';
          e.reason = err;
          return cb(e);
        }
        cb();
      });
    } else {
      cb();
    }
  });
};

module.exports = Admin;
