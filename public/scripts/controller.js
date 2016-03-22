/* global define */

(function() {
  'use strict';

  var deps = [
    'composer/controls'
  ];
  define('plugins/expiring-uploads/controller', deps, function(controls) {

    var controller = {};
    controller.validateUpload = function(response, composer) {
      var selAfterInsert = 0;
      var insertText = '';
      if (composer.selectionStart === composer.selectionEnd) {
        insertText = '[' + response.linkText + '](' + response.url + ')';
        selAfterInsert = composer.selectionEnd + insertText.length;
        controls.insertIntoTextarea(composer.textarea, insertText);
      } else {
        insertText = '](' + response.url + ')';
        selAfterInsert = composer.selectionEnd + response.url.length + 4;
        controls.wrapSelectionInTextareaWith(composer.textarea, '[', insertText);
      }
      /**
       * Modal timeout takes the focus from textarea if set too early
       * https://github.com/nodebb/nodebb/blob/master/public/src/modules/uploader.js#L85-L88
       */
      setTimeout(function() {
        controls.updateTextareaSelection(composer.textarea,
                                         selAfterInsert,
                                         selAfterInsert);
      }, 1000);
    };
    return controller;

  });
})();
