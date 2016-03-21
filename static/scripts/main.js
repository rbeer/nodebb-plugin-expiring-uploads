'use strict';

/* global require */

((require) => {
  let deps = [
    'plugin/expiring-uploads/settings',
    'plugin/expiring-uploads/uploads'
  ];
  require(deps, (Settings, Uploads) => {
    console.log('Settings', Settings);
    console.log('Uploads', Uploads);
  });
})(require);
