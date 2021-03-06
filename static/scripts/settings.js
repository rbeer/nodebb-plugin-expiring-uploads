/* globals define */

(function() {
  'use strict';

  var deps = [
    'plugin/expiring-uploads/uielements',
    'plugin/expiring-uploads/uihandler'
  ];
  define('plugin/expiring-uploads/settings', deps, function(UIElements, UIHandler) {

    var _hookMap = [
      ['expDays', 'change', 'onTimeSelectChange'],
      ['expWeeks', 'change', 'onTimeSelectChange'],
      ['expMonths', 'change', 'onTimeSelectChange'],
      ['expTstamp', 'blur', 'setCustomSeconds'],
      ['chkCustomTstamp', 'click', 'toggleCustomTimestamp'],
      ['storagePath', 'blur', 'validateStoragePath'],
      ['btnAddFiletype', 'click', 'addFileType'],
      ['lstFiletypes', 'dblclick', 'removeFileType'],
      ['txtFiletype', 'keydown', 'addFileType'],
      ['btnSave', 'click', 'saveSettings']/*,
      ['chkLinkText', 'click', 'toggleCustomLinkText']*/
    ];

    var _init = function() {
      _hookElements();
      UIHandler.settings.setCustomSeconds.call({
        value: UIElements.settings.expTstamp.value
      });
    };
    var _hookElements = function() {
      _hookMap.forEach(function(hook) {
        return UIElements.settings[hook[0]]
               .addEventListener(hook[1], UIHandler.settings[hook[2]]);
      });
    };

    _init();
    return {
      _uielements: UIElements.settings,
      _uihandler: UIHandler.settings
    };

  });
})();
