/* global config */

require(['composer/formatting', 'plugins/expiring-uploads/modals'], function(composer, modals) {
  'use strict';

  if (config.allowFileUploads) {
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
