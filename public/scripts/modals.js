/* global config define */

(function() {
  'use strict';

  var deps = [
    'uploader',
    'translator',
    'plugins/expiring-uploads/controller',
    'plugins/expiring-uploads/sockets'
  ];
  define('plugins/expiring-uploads/modals', deps, function(uploader, translator, controller, sockets) {

    var modals = {};

    modals.showUploadModal = function(composer) {
      sockets.getUploadModalSettings(function(err, settings) {
        if (err) return console.error('Error getting settings from backend');
        var translateKeys = '[[expiringuploads:modal.title]];[[expiringuploads:modal.description]]';
        translator.translate(translateKeys, function(translated) {
          var strings = translated.split(';');

          (new MutationObserver(hoistModal)).observe(document.body, {childList: true});

          uploader.show({
            route: config.relative_path + '/plugins/expiring-uploads/upload',
            params: {},
            fileSize: config.maximumFileSize,
            title: strings[0],
            description: wrapDescription(strings[1] + '<br />' +
                                         expireString(settings.expireAfter)),
            accept: settings.expiringTypes
          }, function(response) {
            controller.validateUpload(response, composer);
          });

        });
      });
    };

    var hoistModal = function(mutations, observer) {
      var addedNodes = mutations.map(function(mutation) {
        return mutation.addedNodes[0];
      });
      var target = addedNodes.filter(targetNodeFilter)[0];
      if (target) {
        target.classList.add('hoisted');
        observer.disconnect();
      }
    };
    var targetNodeFilter = function(node) {
      if (!node || !node.classList.contains('modal')) return false;
      var aria = node.attributes.getNamedItem('aria-labelledby');
      return (aria || {value: 0}).value === 'upload-file';
    };

    var expireString = function(expireAfter) {
      expireAfter = (expireAfter * 1000) + Date.now();
      return new Date(expireAfter).toLocaleString(config.userLang);
    };
    var wrapDescription = function(text) {
      return '<div class="alert">' + text + '</div>';
    };

    return modals;

  });
})();
