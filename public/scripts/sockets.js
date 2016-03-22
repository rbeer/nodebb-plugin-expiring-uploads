/* global define socket */

define('plugins/expiring-uploads/sockets', () => {
  'use strict';

  var sockets = {};

  sockets.settingsCache = null;

  sockets.getUploadModalSettings = (cb) => {
    if (sockets.settingsCache) return cb(null, sockets.settingsCache);
    socket.emit('admin.settings.get', {
      hash: 'expiring-uploads'
    }, (err, values) => {
      if (err) {
        return cb(null);
      }
      try {
        let settings = JSON.parse(values._);
        sockets.settingsCache = {
          expiringTypes: settings.expiringTypes.join(','),
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
