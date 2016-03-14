'use strict';
/* globals app, socket config, define */

define('expiring-uploads.settings', function() {

  var UIElements = {
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
  };
  var UIHandler = {
    calcExpiration: function() {
      // 1 month resolves to the Gregorian calendar's
      // mean month length of 30.44 days (precise: 30.436875 days)
      UIElements.expTstamp.value = (parseInt(UIElements.expDays.value, 10) * 86400) +
                        (parseInt(UIElements.expWeeks.value, 10) * 604800) +
                        (parseInt(UIElements.expMonths.value, 10) * 2629743);
    },
    validateExpiration: function() {
      if (this.value === '') {
        app.alert({
          type: 'warning',
          alert_id: 'expiring-uploads-tstamp-invalid',
          title: 'Invalid value',
          message: 'Please enter numbers in the custom timestamp field, only!',
          clickfn: function() {
            UIElements.expTstamp.focus();
          }
        });
        this.value = this.defaultValue;
      } else {
        UIHandler.splitExpiration(parseInt(this.value, 10));
      }
    },
    splitExpiration: function(totalVal) {
      var monthVal = Math.floor(totalVal / 2629743);
      var weekVal = Math.floor((totalVal - (2629743 * monthVal)) / 604800);
      var dayVal = Math.floor((totalVal - (2629743 * monthVal) -
                              (604800 * weekVal)) / 86400);
      UIElements.expMonths.value = (monthVal <= 12) ? monthVal : 13;
      UIElements.expWeeks.value = (weekVal <= 3) ? weekVal : 0;
      UIElements.expDays.value = (dayVal <= 6) ? dayVal : 0;
    },
    toggleCustomTimestamp: function() {
      UIElements.expTstamp.disabled = !this.checked;
      UIElements.expDays.disabled = UIElements.expWeeks.disabled =
        UIElements.expMonths.disabled = this.checked;
    },
    validateStoragePath: function() {
      if (this.value.substr(-1) !== '/') {
        this.value = this.value + '/';
      }
    },
    addFileType: function() {
      _addFileTypes(UIElements.txtFiletype.value);
      UIElements.txtFiletype.value = '';
    },
    removeFileType: function() {
      if (this.selectedIndex > -1) _FileTypes.remove(this.selectedIndex);
    },
    saveSettings: function(e) {
      var ftypes = '';
      for (var i = 0; i < UIElements.lstFiletypes.options.length; i++) {
        ftypes = ftypes + UIElements.lstFiletypes.options[i].value + ',';
      }
      ftypes = ftypes.substring(0, ftypes.length - 1);
      $.post(config.relative_path + '/api/admin/plugins/expiring-uploads/save', {
        _csrf: config.csrf_token,
        storage: UIElements.storagePath.value,
        expireAfter: UIElements.expTstamp.value,
        customTstamp: UIElements.chkCustomTstamp.checked,
        hiddenTypes: ftypes,
        delFiles: UIElements.chkDelFiles.checked,
        linkText: UIElements.linkText.value,
        setLinkText: UIElements.chkLinkText.checked
      }, function(data) {
        if (data === 'OK') {
          app.alert({
            type: 'success',
            alert_id: 'expiring-uploads-saved',
            title: 'Settings Saved',
            message: 'Please reload your NodeBB to apply these settings',
            clickfn: function() {
              socket.emit('admin.reload');
            }
          });
        } else {
          app.alertError('Error while saving settings: ' + data);
        }
      });
      e.preventDefault();
    }/*,
    toggleCustomLinkText: function() {
      UIElements.linkText.disabled = !this.checked;
    }*/
  };
  var _hookMap = [
    ['expDays', 'change', 'calcExpiration'],
    ['expWeeks', 'change', 'calcExpiration'],
    ['expMonths', 'change', 'calcExpiration'],
    ['expTstamp', 'blur', 'validateExpiration'],
    ['chkCustomTstamp', 'click', 'toggleCustomTimestamp'],
    ['storagePath', 'blur', 'validateStoragePath'],
    ['btnAddFiletype', 'click', 'addFileType'],
    ['lstFiletypes', 'dblclick', 'removeFileType'],
    ['btnSave', 'click', 'saveSettings']/*,
    ['chkLinkText', 'click', 'toggleCustomLinkText']*/
  ];

  var _init = function() {
    _hookElements();
    UIHandler.splitExpiration(parseInt(UIElements.expTstamp.value, 10));
  };
  var _hookElements = function() {
    _hookMap.forEach((hook) =>
      UIElements[hook[0]]
      .addEventListener(hook[1], UIHandler[hook[2]])
    );
  };
  var _FileTypes = {

    types: Array.prototype.slice.call(UIElements.lstFiletypes.options)
           .map((typeElement) => typeElement.value.substring(1)),
    hasType: (type) => _FileTypes.types.indexOf(type) > -1,
    add: (type) => {
      if (!_FileTypes.hasType(type)) {
        UIElements.lstFiletypes.add(new Option('.' + type));
        return _FileTypes.types.push(type);
      } else {
        return void 0;
      }
    },
    remove: (idx) => {
      UIElements.lstFiletypes.options.remove(idx);
      return _FileTypes.types.splice(idx, 1);
    }
  };

  var _addFileTypes = function(typeString) {
    var regex = /\.?([^, ][\w]*)/g;
    var match;
    if (!regex.test(typeString)) {
      return app.alertError('Please add at least one filetype!');
    }
    regex.lastIndex = 0;
    while ((match = regex.exec(typeString))) {
      console.log(match);
      _FileTypes.add(match[1]);
    }
  };

  _init();
  return {
    _elements: UIElements,
    _handler: UIHandler
  };
});
