'use strict';

/* global define */

((define) => {
  let deps = [
    'plugin/expiring-uploads/uielements',
    'plugin/expiring-uploads/uihandler',
    'plugin/expiring-uploads/uploads/table'
  ];
  define('plugin/expiring-uploads/uploads', deps, (UIElements, UIHandler, Table) => {
    var dummyData = [
      {
        id: 20,
        filename: 'testing.txt',
        user: 'rbeer',
        path: './94827-testing.txt',
        expiration: 94827
      },
      {
        id: 55,
        filename: 'most_common_filename_on_the_internet_aka_cat.jpg',
        user: 'pete-the-cat',
        path: undefined,
        expiration: 847371
      },
      {
        id: 44,
        filename: 'prettyLoud.mp3',
        user: 'long-names-are-a-thing_too',
        path: './9503993-prettyLoud.mp3',
        expiration: 9503993
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 1558159051261
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 1558159051261
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 1558159051261
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 1558159051261
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      },
      {
        id: 1,
        filename: 'windowsXP.iso',
        user: 'bob',
        path: './119304402-windowsXP.iso',
        expiration: 119304402
      }
    ];

    var _init = function() {
      _hookElements();
    };

    var _onTabLoad = function() {
      let table = UIElements.uploads.tblUploads;
      table.removeChild(table.querySelector('tbody'));
      table.appendChild(Table.loadTable(dummyData));
      this.removeEventListener('click', _onTabLoad);
    };

    var _hookUploadsTab = () => {
      document.querySelector('[aria-controls=uploads]')
      .addEventListener('click', _onTabLoad);
    };

    var _hookElements = function() {
      _hookUploadsTab();
      document.querySelector('[aria-controls=settings]')
      .addEventListener('click', _hookUploadsTab);
      UIElements.uploads.tblUploads.parentElement
      .addEventListener('scroll', UIHandler.uploads.scrollTable);
    };

    _init();
    return {
      _table: Table,
      _uielements: UIElements.uploads,
      _uihandler: UIHandler.uploads
    };
  });
})(define);
