/* global config define */

(() => {
  'use strict';

  let deps = [
    'uploader',
    'plugins/expiring-uploads/controller',
    'plugins/expiring-uploads/sockets'
  ];
  define('plugins/expiring-uploads/modals', deps, (uploader, controller, sockets) => {
    var modals = {};
    modals.showUploadModal = function(composer) {
      sockets.getUploadModalSettings((err, settings) => {
        if (err) return console.error('Error getting settings from backend');
        uploader.show({
          route: config.relative_path + '/plugins/expiring-uploads/upload',
          params: {},
          fileSize: config.maximumFileSize,
          title: '[[user:upload_picture]]',
          description: '[[user:upload_a_picture]]',
          accept: settings.expiringTypes
        }, (response) => controller.validateUpload(response, composer));
      });
    };
    return modals;
  });
})();
