/* global define */

(() => {
  'use strict';
  let deps = [
    'composer/controls'
  ];
  define('plugins/expiring-uploads/controller', deps, (controls) => {
    var controller = {};
    controller.validateUpload = (response, composer) => {
      let insertText = '[' + response.linkText + '](' + response.url + ')';
      controls.insertIntoTextarea(composer.textarea, insertText);
    };

    return controller;
  });
})();
