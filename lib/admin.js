'use strict';

const nconf = require.main.require('nconf');
const Sockets = require('./sockets');
const Settings = require('./settings');
const Routes = require('./routes');

class Admin {

  static init(app, cb) {
    Sockets.initAdmin();
    console.log(Routes);
    //Routes.setAdmin(app.router, app.middleware);
    cb(null, app);
  }

  static addMenuItem(custom_header, cb) {
    custom_header.plugins.push({
      route: '/plugins/expiring-uploads',
      icon: 'fa-clock-o',
      name: 'Expiring Uploads'
    });
    cb(null, custom_header);
  }

  static render(req, res) {
    // templates.js can only access objects in arrays - I think. :/
    var types = Settings().fileTypes.map((type) => ({ ftype: type }));
    var tplData = {
      csrf: req.csrfToken(),
      storagePath: Settings().storage,
      expTstamp: Settings().expireAfter / 1000, // humans do time in sec...
      expiringTypes: types,
      delFiles: Settings().delFiles,
      basePath: nconf.get('base_dir'),
      linkText: Settings().linkText,
      setLinkText: Settings().setLinkText
    };
    res.render('admin/plugins/expiring-uploads', tplData);
  }
};

/*
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
*/

module.exports = Admin;
