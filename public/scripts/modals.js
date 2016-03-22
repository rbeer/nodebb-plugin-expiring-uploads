/* global config define */

(() => {
  'use strict';

  let deps = [
    'uploader',
    'translator',
    'plugins/expiring-uploads/controller',
    'plugins/expiring-uploads/sockets'
  ];
  define('plugins/expiring-uploads/modals', deps, (uploader, translator, controller, sockets) => {
    var modals = {};

    modals.showUploadModal = function(composer) {
      sockets.getUploadModalSettings((err, settings) => {
        if (err) return console.error('Error getting settings from backend');
        let translateKeys = '[[expiringuploads:modal.title]];[[expiringuploads:modal.description]]';
        translator.translate(translateKeys, (translated) => {
          let strings = translated.split(';');

          (new MutationObserver(hoistModal)).observe(document.body, {childList: true});

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

    const hoistModal = (mutations, observer) => {
      let addedNodes = mutations.map((mutation) => mutation.addedNodes[0]);
      let target = addedNodes.filter(targetNodeFilter)[0];
      if (target) {
        target.classList.add('hoisted');
        observer.disconnect();
      }
    }
    const targetNodeFilter = (node) => {
      if (!node || !node.classList.contains('modal')) return false;
      let aria = node.attributes.getNamedItem('aria-labelledby');
      return (aria || {value: 0}).value === 'upload-file';
    };

    const expireString = (expireAfter) => {
      expireAfter = (expireAfter * 1000) + Date.now();
      return new Date(expireAfter).toLocaleString(config.userLang);
    }
    const wrapDescription = (text) => '<div class="alert">' + text + '</div>';

    return modals;
  });
})();
