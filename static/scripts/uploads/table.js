/* global define socket app */

define('plugin/expiring-uploads/uploads/table', function() {
  'use strict';

  /**
   * Meta data for file from DB
   * @typedef {ExpiringFile}
   * @property {number}  id         - File id (expiring-uploads:#)
   * @property {string}  filename   - Original filename
   * @property {string}  user       - Username of uploader
   * @property {?string} path       - Path of file in filesystem or
   *                                  undefined if deleted
   * @property {number}  expiration - Timestamp of expiration
   */

  /**
   * Retrieves meta data of files from the DB.
   * Optional parameters start, end can define a range.
   * @param  {?number} start        - Id of file to start request range
   * @param  {?number} end          - Id of file to end request range
   * @return {Array.<ExpiringFile>} - Meta data objects of files in range or
   *                                  all of them
   */
  var getFileData = function(cb, start, end) {
    var data = { start: start || null, end: end || null };
    socket.emit('admin.plugins.ExpiringUploads.getFileData', data,
      function(err, fileData) {
        if(err) return cb(err);
        return cb(null, fileData);
      });
  };

  var _Cache = new function() {
    this._cache = [];
    this.remove = function(cacheId) {
      this._cache[cacheId] = null;
    };
    this.add = function(cacheFile) {
      return this._cache.push(cacheFile);
    };
    this.getId = function(cacheId) {
      return this._cache[cacheId].data.id;
    };
    return this;
  }();
  /**
   * Cache element
   * @typedef {CacheFile}
   * @param {HTMLTableRowElement} trElement
   * @param {ExpiringFile}        data
   */
  var CacheFile = function(trElement, data) {
    this.element = trElement;
    this.data = data;
    return this;
  };

  /**
   * Creates HTML Elements for one table row
   * @param  {ExpiringFile} data - Rows file meta data
   * @return {HTMLTableRowElement}
   */
  var createRow = function(data) {
    var tr = document.createElement('tr');
    tr.appendChild(columns.createTextElement(data.id));
    tr.appendChild(columns.createTextElement(data.filename));
    tr.appendChild(columns.createTextElement(data.user));
    tr.appendChild(columns.createFS(data.path));
    tr.appendChild(columns.createExpiration(data.expiration));
    tr.appendChild(columns.createDelete());
    isExpired(data.expiration) ? tr.className = 'expiredFile' : void 0;
    tr.dataset.cache = _Cache.add(new CacheFile(tr, data)) - 1;
    _hookRowButtons(tr);
    return tr;
  };

  var removeRow = function(trElement) {
    var cacheId = trElement.dataset.cache;
    _Cache.remove(cacheId);
    trElement.remove();
  };

  var _hookRowButtons = function(trElement) {
    trElement.querySelector('.fa-times').addEventListener('click',
                                                          _removeEntry);
  };

  var _removeEntry = function(event) {
    var trElement = event.path[2];
    socket.emit('admin.plugins.ExpiringUploads.deleteFile',
                _Cache.getId(trElement.dataset.cache), function(err) {
                  if (err) return app.alertError(err.message);
                });
    removeRow(trElement);
  };

  var isExpired = function(tstamp) {
    return tstamp - Date.now() < 1;
  };

  var columns = {
    createDelete: function() {
      var td = document.createElement('td');
      var icon = document.createElement('i');
      icon.className = 'fa fa-times';
      td.className = 'iconDelete';
      td.appendChild(icon);
      return td;
    },
    createFS: function(path) {
      var td = document.createElement('td');
      var icon = document.createElement('i');
      icon.className = !path ? 'fa fa-minus' : 'fa fa-check';
      // td.className = 'iconFS';
      td.appendChild(icon);
      return td;
    },
    createExpiration: function(expiration) {
      var td = document.createElement('td');
      var exp = document.createElement('div');
      exp.className = 'textExpiration ' + (isExpired(expiration) ?
                                           'expired' : 'active');
      exp.innerText = new Date(expiration).toLocaleString();
      td.appendChild(exp);
      return td;
    },
    createTextElement: function(content) {
      var td = document.createElement('td');
      var text = document.createElement('div');
      text.innerText = content;
      td.appendChild(text);
      return td;
    }
  };

  /**
   * Creates a <tbody> with rows out of fileData
   * @param  {Array.<ExpiringFile>} fileData
   * @return {HTMLTableSectionElement}
   */
  var addRows = function(fileData) {
    var tbody = document.createElement('tbody');
    fileData = fileData.sort(function(a, b) {
      return a.id > b.id;
    });
    for (var file of fileData) {
      var row = createRow(file);
      tbody.appendChild(row);
    }
    return tbody;
  };

  var loadTable = function(fileData) {
    return addRows(fileData);
  };

  return {
    _Cache: _Cache,
    loadTable: loadTable,
    createRow: createRow,
    getFileData: getFileData
  };

});
