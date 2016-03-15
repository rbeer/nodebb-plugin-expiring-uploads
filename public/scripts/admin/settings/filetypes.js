'use strict';
/* globals define, app */

((define, app) => {
  define('plugin/expiring-uploads/settings/filetypes', ['plugin/expiring-uploads/uielements'], function(UIElements) {
    var types = Array.prototype.slice.call(UIElements.settings.lstFiletypes.options)
                .map((typeElement) => typeElement.value.substring(1));
    var hasType = (type) => types.indexOf(type) > -1;
    var add = (type) => {
      if (!hasType(type)) {
        UIElements.settings.lstFiletypes.add(new Option('.' + type));
        return types.push(type);
      } else {
        return void 0;
      }
    };
    var remove = (idx) => {
      UIElements.settings.lstFiletypes.options.remove(idx);
      return types.splice(idx, 1);
    };

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

    var getAll = function() {
      return types;
    };

    return {
      hasType: hasType,
      remove: remove,
      parse: parse,
      getAll: getAll
    };
  });
})(define, app);
