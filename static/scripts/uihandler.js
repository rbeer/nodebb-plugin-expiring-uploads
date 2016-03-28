/* globals define, app, socket */

(function() {
  'use strict';

  var deps = [
    'plugin/expiring-uploads/uielements',
    'plugin/expiring-uploads/settings/filetypes',
    'plugin/expiring-uploads/settings/time'
  ];
  define('plugin/expiring-uploads/uihandler', deps, function(UIElements, FileTypes, Time) {

  /**
   * ---------------------------------------------------------------------------
   *                                 Settings Tab
   * ---------------------------------------------------------------------------
   */

    /**
     * Sets days/weeks/months select fields values
     * Sets custom timestamp checkbox
     * @this {expTstamp}
     */
    var setCustomSeconds = function() {
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
        var dwm = Time.toDaysWeeksMonths(parseInt(this.value, 10));
        UIElements.settings.expMonths.value = (dwm.months <= 12) ? dwm.months : 13;
        UIElements.settings.expWeeks.value = (dwm.weeks <= 3) ? dwm.weeks : 0;
        UIElements.settings.expDays.value = (dwm.days <= 6) ? dwm.days : 0;
        toggleCustomTimestamp.call({ checked: dwm.isCustom });
        UIElements.settings.chkCustomTstamp.checked = dwm.isCustom;
      }
    };

    /**
     * Sets expTstamp value when days/weeks/months selects change
     * @this {UIElements.settings.expDays|UIElements.settings.expWeeks|UIElements.settings.expMonths}
     */
    var onTimeSelectChange = function() {
      UIElements.settings.expTstamp.value = Time.toSeconds(UIElements.settings.expDays.value,
                                                            UIElements.settings.expWeeks.value,
                                                            UIElements.settings.expMonths.value);
    };

    /**
     * Toggles disabled state of time selects and custom input field
     * @this {UIElements.settings.chkCustomTstamp}
     */
    var toggleCustomTimestamp = function() {
      UIElements.settings.expTstamp.disabled = !this.checked;
      UIElements.settings.expDays.disabled = UIElements.settings.expWeeks.disabled =
        UIElements.settings.expMonths.disabled = this.checked;
    };

    /**
     * Validates and corrects storage path input value
     * @this {storagePath}
     */
    var validateStoragePath = function() {
      if (this.value.substr(-1) !== '/') {
        this.value = this.value + '/';
      }
    };

    /**
     * Adds filetypes from text input to list
     * @param {MouseEvent|KeyboardEvent} event
     */
    var addFileType = function(event) {
      if (event instanceof KeyboardEvent && !!event.code.indexOf('Enter')) {
        return;
      }
      event.preventDefault();
      FileTypes.parse(UIElements.settings.txtFiletype.value);
      UIElements.settings.txtFiletype.value = '';
    };

    /**
     * Removes filetypes from list
     * @this {lstFiletypes}
     */
    var removeFileType = function() {
      if (this.selectedIndex > -1) FileTypes.remove(this.selectedIndex);
    };

    /**
     * Saves settings
     * @param  {MouseEvent} event
     */
    var saveSettings = function(event) {
      event.preventDefault();
      var ftypes = FileTypes.getAll();
      var data = {
        storage: UIElements.settings.storagePath.value,
        expireAfter: UIElements.settings.expTstamp.value,
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
          clickfn: function() {
            socket.emit('admin.reload');
          }
        });
      });
    };

    /*,
    var toggleCustomLinkText = function() {
      UIElements.settings.linkText.disabled = !this.checked;
    };*/

  /**
   * ---------------------------------------------------------------------------
   *                                 Uploads Tab
   * ---------------------------------------------------------------------------
   */

    /**
     * User clicked clean button
     */
    // var clean = function(a) {
    //   return a;
    // };

    /**
     * UI Element handlers
     * @typedef {UIHandler}
     * @property {function} setCustomSeconds      - Sets days/weeks/months select fields values
     * @property {function} onTimeSelectChange    - Sets expTstamp value when days/weeks/months selects change
     * @property {function} toggleCustomTimestamp - Toggles disabled state of time selects and custom input field
     * @property {function} validateStoragePath   - Validates and corrects storage path input value
     * @property {function} addFileType           - Adds filetypes from text input to list
     * @property {function} removeFileType        - Removes filetypes from list
     * @property {function} saveSettings          - Saves settings
     */
    return {
      /*uploads: {
        clean: clean
      },*/
      settings: {
        setCustomSeconds: setCustomSeconds,
        onTimeSelectChange: onTimeSelectChange,
        toggleCustomTimestamp: toggleCustomTimestamp,
        validateStoragePath: validateStoragePath,
        addFileType: addFileType,
        removeFileType: removeFileType,
        saveSettings: saveSettings
      }
    };

  }); // define
})();
