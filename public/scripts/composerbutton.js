/* global config */

(function() {

  var deps = [
    'composer/formatting',
    'plugins/expiring-uploads/modals',
    'plugins/expiring-uploads/sockets'
  ];
  require(deps, function(composer, modals, sockets) {
    'use strict';

    sockets.getUploadModalSettings(function(err, settings) {
      if (err) {
        return console.error('[plugin:expiring-uploads] Error getting settings');
      }
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
