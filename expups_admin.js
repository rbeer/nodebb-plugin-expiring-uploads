var db = require.main.require('./src/database');
var nconf = require.main.require('nconf');
var Admin = {};
Admin.init = function(app, cb) {
  // admin routes
  app.router.get('/admin/plugins/expiring-uploads',
                 app.middleware.applyCSRF, app.middleware.admin.buildHeader,
                 Admin.render);
  app.router.get('/api/admin/plugins/expiring-uploads',
                 app.middleware.applyCSRF,
                 Admin.render);
  app.router.post('/api/admin/plugins/expiring-uploads/save',
                  app.middleware.applyCSRF,
                  Admin.saveSettings);
  cb(null, app);
};
Admin.addMenuItem = function(custom_header, cb) {
  custom_header.plugins.push({
    route: '/plugins/expiring-uploads',
    icon: 'fa-clock-o',
    name: 'Expiring Uploads'
  });
  cb(null, custom_header);
};

Admin.render = function(req, res, next) {
  var ExpiringUploads = module.parent.exports;
  // templates.js can only access objects in arrays - I think. :/
  var types = ExpiringUploads.hiddenTypes.map(function(type) {
    return {ftype: type};
  });
  var tplData = {
    csrf: req.csrfToken(),
    storagePath: ExpiringUploads.storage,
    expTstamp: ExpiringUploads.expireAfter / 1000, // js does time in msec...
    hiddenTypes: types,
    customTstamp: ExpiringUploads.customTstamp,
    basePath: nconf.get('base_dir')
  };
  res.render('admin/plugins/expiring-uploads', tplData);
};

Admin.saveSettings = function(req, res, next) {
  var ExpiringUploads = module.parent.exports;
  var storageChange = (ExpiringUploads.storage !== req.body.storage);
  var dbData = {
    storage: req.body.storage,
    expireAfter: parseInt(req.body.expireAfter, 10) * 1000, // ...humans in sec
    hiddenTypes: req.body.hiddenTypes,
    customTstamp: (req.body.customTstamp === 'true')
  };
  db.setObject('settings:expiring-uploads', dbData, function(err) {
    if (err) {
      res.json(500, 'Writing settings to DB failed. ' + err);
    }

    ExpiringUploads.storage = dbData.storage;
    ExpiringUploads.expireAfter = dbData.expireAfter;
    ExpiringUploads.hiddenTypes = dbData.hiddenTypes.split(',');
    ExpiringUploads.customTstamp = dbData.customTstamp;
    if (storageChange) {
      ExpiringUploads.createStorage(function(err) {
        if (err) {
          return res.json(500, 'Creating storage directory failed. ' + err);
        }
        res.json('OK');
      });
    } else {
      res.json('OK');
    }
  });
};

module.exports = Admin;
