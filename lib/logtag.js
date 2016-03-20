'use strict';

module.exports = function(strings) {
  let vars = Array.from(arguments).slice(1);
  let compiled = strings.reduce((line, part, idx) => line + part + (idx < vars.length ? vars[idx] : ''), '');
  return '[plugins:expiring-uploads]' + compiled;
};
