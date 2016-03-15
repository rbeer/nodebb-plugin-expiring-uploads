'use strict';
/* globals define, app, socket */

((define, app, socket) => {
  let deps = [
    'plugin/expiring-uploads/uielements',
    'plugin/expiring-uploads/settings/filetypes',
    'plugin/expiring-uploads/settings/time'
  ];
  define('plugin/expiring-uploads/uihandler', deps, (UIElements, FileTypes, Time) => {
    return {
      setCustomSeconds: function() {
        if (!Time.validateCustomSeconds(this.value)) {
          app.alert({
            type: 'warning',
            alert_id: 'expiring-uploads-tstamp-invalid',
            title: 'Invalid value',
            message: 'Please enter numbers in the custom timestamp field, only!',
            clickfn: function() {
              UIElements.settings.expTstamp.focus();
            }
          });
          this.value = this.defaultValue;
        } else {
          let dwm = Time.toDayWeekMonth(parseInt(this.value, 10));
          UIElements.settings.expMonths.value = (dwm[2] <= 12) ? dwm[2] : 13;
          UIElements.settings.expWeeks.value = (dwm[1] <= 3) ? dwm[1] : 0;
          UIElements.settings.expDays.value = (dwm[0] <= 6) ? dwm[0] : 0;
        }
      },
      onTimeSelectChange: function() {
        UIElements.settings.expTstamp.value = Time.toSeconds(UIElements.settings.expDays.value,
                                                              UIElements.settings.expWeeks.value,
                                                              UIElements.settings.expMonths.value);
      },
      toggleCustomTimestamp: function() {
        UIElements.settings.expTstamp.disabled = !this.checked;
        UIElements.settings.expDays.disabled = UIElements.settings.expWeeks.disabled =
          UIElements.settings.expMonths.disabled = this.checked;
      },
      validateStoragePath: function() {
        if (this.value.substr(-1) !== '/') {
          this.value = this.value + '/';
        }
      },
      addFileType: function(event) {
        if (event instanceof KeyboardEvent && !!event.code.indexOf('Enter')) {
          return;
        }
        event.preventDefault();
        FileTypes.parse(UIElements.settings.txtFiletype.value);
        UIElements.settings.txtFiletype.value = '';
      },
      removeFileType: function() {
        if (this.selectedIndex > -1) FileTypes.remove(this.selectedIndex);
      },
      saveSettings: function(event) {
        event.preventDefault();
        var ftypes = '.' + FileTypes.getAll().join(',.');
        var data = {
          storage: UIElements.settings.storagePath.value,
          expireAfter: UIElements.settings.expTstamp.value,
          customTstamp: UIElements.settings.chkCustomTstamp.checked,
          expiringTypes: ftypes,
          delFiles: UIElements.settings.chkDelFiles.checked,
          linkText: UIElements.settings.linkText.value,
          setLinkText: UIElements.settings.chkLinkText.checked
        };
        socket.emit('admin.plugins.ExpiringUploads.saveSettings', data, function(err) {
          if (err) {
            console.error(err);
            return app.alertError(err.message);
          }
          app.alert({
            type: 'success',
            alert_id: 'expiring-uploads-saved',
            title: 'Settings Saved',
            message: 'Please reload your NodeBB to apply these settings',
            clickfn: () => socket.emit('admin.reload')
          });
        });
      }/*,
      toggleCustomLinkText: function() {
        UIElements.settings.linkText.disabled = !this.checked;
      }*/
    }; // return
  }); // define
})(define, app, socket);
