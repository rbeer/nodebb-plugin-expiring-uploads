'use strict';

var db = require.main.require('./src/database');
var nconf = require.main.require('nconf');
var AdminSocket = require.main.require('./src/socket.io/admin');
var Admin = {};
Admin.init = function(app, cb) {
  Admin.createSocket();
  // admin routes
  app.router.get('/admin/plugins/expiring-uploads',
                 app.middleware.applyCSRF, app.middleware.admin.buildHeader,
                 Admin.render);
  app.router.get('/api/admin/plugins/expiring-uploads',
                 app.middleware.applyCSRF,
                 Admin.render);
  cb(null, app);
};

Admin.createSocket = function() {
  AdminSocket.plugins.ExpiringUploads = {};
  AdminSocket.plugins.ExpiringUploads.saveSettings = (socket, data, cb) => {
    Admin.saveSettings(data, cb);
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
  var types = ExpiringUploads.hiddenTypes.map(function(type) {
    return {ftype: type};
  });
  var tplData = {
    csrf: req.csrfToken(),
    storagePath: ExpiringUploads.storage,
    expTstamp: ExpiringUploads.expireAfter / 1000, // humans do time in sec...
    hiddenTypes: types,
    customTstamp: ExpiringUploads.customTstamp,
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
    hiddenTypes: settings.hiddenTypes,
    customTstamp: settings.customTstamp,
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
    ExpiringUploads.hiddenTypes = dbData.hiddenTypes.split(',');
    ExpiringUploads.customTstamp = dbData.customTstamp;
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
          e.code = 'ECREATESTORAGE';
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
