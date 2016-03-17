'use strict';

/* global define socket*/

((define, socket, app) => {
  let deps = [];
  define('plugin/expiring-uploads/uploads/table', deps, () => {

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
      let data = { start: start || null, end: end || null };
      socket.emit('admin.plugins.ExpiringUploads.getFileData', data,
        (err, fileData) => {
          if(err) return cb(err);
          return cb(null, fileData);
        });
    };

    var _cache = [];
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
      let tr = document.createElement('tr');
      tr.appendChild(columns.createTextElement(data.id));
      tr.appendChild(columns.createTextElement(data.filename));
      tr.appendChild(columns.createTextElement(data.user));
      tr.appendChild(columns.createFS(data.path));
      tr.appendChild(columns.createExpiration(data.expiration));
      tr.appendChild(columns.createDelete());
      isExpired(data.expiration) ? tr.className = 'expiredFile' : void 0;
      tr.dataset.cache = _cache.push(new CacheFile(tr, data)) - 1;
      _hookRowButtons(tr);
      return tr;
    };

    var removeRow = function(trElement) {
      var cacheId = trElement.dataset.cache;
      _cache[cacheId] = null;
      trElement.remove();
    };

    var _hookRowButtons = (trElement) => {
      trElement.querySelector('.fa-times').addEventListener('click',
                                                            _removeEntry);
    };

    var _removeEntry = function(event) {
      removeRow(event.path[2]);
    };

    var isExpired = (tstamp) => tstamp - Date.now() < 1;

    var columns = {
      createDelete: function() {
        let td = document.createElement('td');
        let icon = document.createElement('i');
        icon.className = 'fa fa-times';
        td.className = 'iconDelete';
        td.appendChild(icon);
        return td;
      },
      createFS: function(path) {
        let td = document.createElement('td');
        let icon = document.createElement('i');
        icon.className = !path ? 'fa fa-minus' : 'fa fa-check';
        // td.className = 'iconFS';
        td.appendChild(icon);
        return td;
      },
      createExpiration: function(expiration) {
        let td = document.createElement('td');
        let exp = document.createElement('div');
        exp.className = 'textExpiration ' + (isExpired(expiration) ?
                                             'expired' : 'active');
        exp.innerText = new Date(expiration).toLocaleString();
        td.appendChild(exp);
        return td;
      },
      createTextElement: function(content) {
        let td = document.createElement('td');
        let text = document.createElement('div');
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
      fileData = fileData.sort((a, b) => a.id > b.id);
      for (let file of fileData) {
        let row = createRow(file);
        tbody.appendChild(row);
      }
      return tbody;
    };

    var loadTable = function(fileData) {
      return addRows(fileData);
    };

    return {
      _cache: _cache,
      loadTable: loadTable,
      createRow: createRow,
      getFileData: getFileData
    };
  });
})(define, socket);
