/* global config */

(function() {

  var deps = [
    'composer/formatting',
    'plugins/expiring-uploads/modals',
    'plugins/expiring-uploads/sockets'
  ];
  require(deps, function(composer, modals, sockets) {
    'use strict';

    sockets.getUploadModalSettings(function(settings) {
      if (config.allowFileUploads && settings.expireAfter > 0) {
        composer.addButton('fa fa-clock-upload', function(textarea, selectionStart, selectionEnd) {
          modals.showUploadModal({
            textarea: textarea,
            selectionStart: selectionStart,
            selectionEnd: selectionEnd
          });
        });
        composer.addComposerButtons();
      }
    });

  });
})();
