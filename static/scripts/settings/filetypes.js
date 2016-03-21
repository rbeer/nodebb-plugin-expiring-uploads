'use strict';
/* globals define, app */

((define, app) => {
  define('plugin/expiring-uploads/settings/filetypes', ['plugin/expiring-uploads/uielements'], function(UIElements) {
    /**
     * List of filetypes to expire
     * @type {Array}
     */
    var types = Array.prototype.slice.call(UIElements.settings.lstFiletypes.options)
                .map((typeElement) => typeElement.value.substring(1));

    /**
     * Checks whether given filetype is in types list
     * @param  {string} type - String to check for presence
     * @return {bool}
     */
    var hasType = (type) => types.indexOf(type) > -1;

    /**
     * Adds given filetype to list
     * @param  {string} type - Filetype to add
     * @return {!Array}      - Index of newly added type or undefined
     */
    var add = (type) => {
      if (!hasType(type)) {
        UIElements.settings.lstFiletypes.add(new Option('.' + type));
        return types.push(type);
      } else {
        return void 0;
      }
    };

    /**
     * Removes filetype at given index from list
     * @param  {number} idx - Index of filetype to remove
     * @return {Array}      - Removed item in, or empty array
     */
    var remove = (idx) => {
      UIElements.settings.lstFiletypes.options.remove(idx);
      return types.splice(idx, 1);
    };

    /**
     * Parses text from 'Add' input field and add valid parts
     * @param  {string} typeString - String of filetypes to parse and add
     */
    var parse = function(typeString) {
      var regex = /\.?([^, ][\w]*)/g;
      var match;
      if (!regex.test(typeString)) {
        return app.alertError('Please add at least one filetype!');
      }
      regex.lastIndex = 0;
      while ((match = regex.exec(typeString))) {
        add(match[1]);
      }
    };

    /**
     * Returns list of filetypes
     * @return {Array}
     */
    var getAll = function() {
      return types;
    };

    /**
     * Functions for filetypes part of the settings UI
     * @typedef {FileTypes}
     * @property {function} hasType - Checks whether given filetype is in types list
     * @property {function} remove  - Removes filetype at given index from list
     * @property {function} parse   - Parses text from 'Add' input field and add valid parts
     * @property {function} getAll  - Returns list of filetypes
     */
    return {
      hasType: hasType,
      remove: remove,
      parse: parse,
      getAll: getAll
    };
  });
})(define, app);
