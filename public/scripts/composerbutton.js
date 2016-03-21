/* global config */

require(['composer/formatting', 'plugins/expiring-uploads/modals'], (composer, modals) => {
  'use strict';
  if (config.allowFileUploads) {
    composer.addButton('fa fa-clock-upload', (textarea, selectionStart, selectionEnd) => {
      modals.showUploadModal({
        textarea: textarea,
        selectionStart: selectionStart,
        selectionEnd: selectionEnd
      });
    });
    composer.addComposerButtons();
  }
});
