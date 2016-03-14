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
    }
  };

  // Jedi Math Tricks <|:)
  UIElements.expDays.addEventListener('change', UIHandler.calcExpiration);
  UIElements.expWeeks.addEventListener('change', UIHandler.calcExpiration);
  UIElements.expMonths.addEventListener('change', UIHandler.calcExpiration);
  UIElements.expTstamp.addEventListener('blur', UIHandler.validateExpiration);
  UIElements.chkCustomTstamp.addEventListener('click', UIHandler.toggleCustomTimestamp);

  UIElements.storagePath.addEventListener('blur', function() {
    if (this.value.substr(-1) !== '/') {
      this.value = this.value + '/';
    }
  });

  UIElements.btnAddFiletype.addEventListener('click', function() {
    addFiletypes(UIElements.txtFiletype.value);
    UIElements.txtFiletype.value = '';
  });
  UIElements.lstFiletypes.addEventListener('dblclick', function() {
    this.options.remove(this.selectedIndex);
  });

  UIElements.chkLinkText.addEventListener('click', function() {
    UIElements.linkText.disabled = !this.checked;
  });

  UIElements.btnSave.addEventListener('click', function(e) {
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
  });

  function addFiletypes(types) {
    var listhas = false;
    if (types === '') {
      return app.alertError('Please add at least one filetype! ' +
                            '(e.g. .zip, rar,.html)');
    }
    types = types.split(',');
    for (var i = 0; i < types.length; i++) {
      types[i] = types[i].trim();
      if (types[i].substring(0, 1) !== '.') {
        types[i] = '.' + types[i];
      }
      listhas = false;
      for (var j = 0; j < UIElements.lstFiletypes.options.length; j++) {
        if (UIElements.lstFiletypes.options[j].value === types[i]) {
          listhas = true;
          break;
        }
      }
      if (!listhas) {
        UIElements.lstFiletypes.add(new Option(types[i]));
      }
    }
  }

  UIHandler.splitExpiration(parseInt(UIElements.expTstamp.value, 10));
  return {
    _elements: UIElements,
    _handler: UIHandler
  };
});
