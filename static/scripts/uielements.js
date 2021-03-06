/* globals define */

define('plugin/expiring-uploads/uielements', function() {
  'use strict';

  /**
   * References to UI DOM Elements
   * @typedef {UIElements}
   */
  return {
    uploads: {
      tblUploads: document.getElementById('tblUploads'),
      hidingTitle: document.getElementById('tblHeader')
    },
    settings: {
      // Expiration Time
      expDays: document.getElementById('expDays'),
      expWeeks: document.getElementById('expWeeks'),
      expMonths: document.getElementById('expMonths'),
      chkCustomTstamp: document.getElementById('chkCustomTstamp'),
      expTstamp: document.getElementById('expTstamp'),
      // Storage Path & Delete Files
      storagePath: document.getElementById('storagePath'),
      chkDelFiles: document.getElementById('chkDelFiles'),
      // Expiring Filetypes
      lstFiletypes: document.getElementById('lstFiletypes'),
      btnAddFiletype: document.getElementById('btnAddFiletype'),
      txtFiletype: document.getElementById('txtFiletype'),
      // Link Text
      chkLinkText: document.getElementById('chkLinkText'),
      linkText: document.getElementById('linkText'),
      // Save Settings
      btnSave: document.getElementById('btnSave')
    }
  };

});
