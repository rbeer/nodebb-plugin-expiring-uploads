/* global require */

(function() {
  'use strict';

  var deps = [
    'plugin/expiring-uploads/settings',
    'plugin/expiring-uploads/uploads'
  ];
  require(deps, function(Settings, Uploads) {

    console.log('Settings', Settings);
    console.log('Uploads', Uploads);

  });
})();
