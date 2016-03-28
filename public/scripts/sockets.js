/* global define socket */

define('plugins/expiring-uploads/sockets', function() {
  'use strict';

  var sockets = {};

  sockets.settingsCache = null;

  sockets.getUploadModalSettings = function(cb) {
    if (sockets.settingsCache) return cb(null, sockets.settingsCache);
    socket.emit('admin.settings.get', {
      hash: 'expiring-uploads'
    }, function(err, values) {
      if (err) {
        return cb(null);
      }
      try {
        var settings = JSON.parse(values._);
        sockets.settingsCache = {
          expiringTypes: settings.expiringTypes,
          expireAfter: settings.expireAfter
        };
        return cb(null, sockets.settingsCache);
      } catch (e) {
        return cb(e);
      }
    });
  };
  return sockets;

});
