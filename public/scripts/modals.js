/* global config define */

(() => {
  'use strict';

  let deps = [
    'uploader',
    'plugins/expiring-uploads/controller',
    'plugins/expiring-uploads/sockets',
    'translator'
  ];
  define('plugins/expiring-uploads/modals', deps, (uploader, controller, sockets, translator) => {
    var modals = {};

    modals.showUploadModal = function(composer) {
      sockets.getUploadModalSettings((err, settings) => {
        if (err) return console.error('Error getting settings from backend');
        let translateKeys = '[[expiringuploads:modal.title]];[[expiringuploads:modal.description]]';
        translator.translate(translateKeys, (translated) => {
          let strings = translated.split(';');
          uploader.show({
            route: config.relative_path + '/plugins/expiring-uploads/upload',
            params: {},
            fileSize: config.maximumFileSize,
            title: strings[0],
            description: wrapDescription(strings[1] + '<br />' +
                                         expireString(settings.expireAfter)),
            accept: settings.expiringTypes
          }, (response) => controller.validateUpload(response, composer));
        });
      });
    };

    const expireString = (expireAfter) => {
      expireAfter = (expireAfter * 1000) + Date.now();
      return new Date(expireAfter).toLocaleString(config.userLang);
    }
    const wrapDescription = (text) => '<div class="alert">' + text + '</div>';

    return modals;
  });
})();
