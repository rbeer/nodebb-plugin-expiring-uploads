/* global define socket */

define('plugins/expiring-uploads/sockets', () => {
  'use strict';

  var sockets = {};

  sockets.getUploadModalSettings = (cb) => {
    socket.emit('admin.settings.get', {
      hash: 'expiring-uploads'
    }, (err, values) => {
      if (err) {
        return cb(null);
      }
      try {
        let settings = JSON.parse(values._);
        return cb(null, {
          accept: settings.expiringTypes.join(',')
        });
      } catch (e) {
        return cb(e);
      }
    });
  };
  return sockets;
});
