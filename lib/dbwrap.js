'use strict';

const DB = require.main.require('./src/database');
const ExpiringFile = require('./expiring-file');
const async = require.main.require('async');

/**
 * @class Wraps NodeBB database
 */
class DBWrap {
  constructor() {
  }

  /**
   * Adds one new File to the store
   * @param  {ExpiringFile.uploadMeta} uploadData
   * @param  {Function} cb         [description]
   */
  static saveUpload(uploadData, cb) {
    var file;
    async.waterfall([
      function(next) {
        DB.incrObjectField('settings:expiring-uploads', 'lastID', next);
      },
      function(id, next) {
        file = new ExpiringFile(id, uploadData);
        DB.sortedSetAdd('expiring-uploads:ids', uploadData.expTstamp, id, function() {
          return next(null, id);
        });
      },
      function(id, next) {
        DB.setObject('expiring-uploads:' + id, uploadData, next);
      }
    ],
    function(err) {
      if (err) {
        return cb(err);
      }
    });
    return cb(null, file);
  };

  /**
   * Looks up all expired file ids
   * @param  {DBWrap~cbExpiredIds} cb
   */
  static getExpiredIds(cb) {
    DB.getSortedSetRangeByScoreWithScores('expiring-uploads:ids', 0, -1,
                                          1, Date.now(), cb);
  }

  /**
   * Creates ExpiringFile instaces
   * @param  {Array.<Object>} fileIds      - A SortedSetRangeWithScores with
   *                                         file ids as value
   * @param  {DBWrap~cbExpiringFiles} cb
   */
  static getExpiringFiles(fileIds, cb) {
    if (fileIds.length === 0) {
      var err = new RangeError('No expired uploads found.');
      err.code = 'ENOEXP';
      return cb(err);
    }
    let files = fileIds.map((id) => new ExpiringFile(id.value));
    let keys = files.map((file) => file.key);
    DB.getObjectsFields(keys, ['fileName'], function(err, fileNames) {
      if (err) {
        return cb(err);
      }
      files.forEach((file, idx) => (file.fileName = fileNames[idx]));
      cb(null, files);
    });
  }

  /**
   * Sets scores of id list entry to 0
   * @param {Array.<ExpiringFile>} files
   * @param {Function} cb
   */
  static setFilesDeleted(files, cb) {
    async.each(files, (file, eachNext) => {
      DB.setObjectField(file.key, 'deleted', true, eachNext);
    }, (err) => {
      if (err) return cb(err);
      let ids = files.map((file) => file.id);
      let scores = Array(files.length).fill(0);
      DB.sortedSetAdd('expiring-uploads:ids', scores, ids, cb);
    });
  }

  /**
   * Gets called with a new instance of {@link ExpiringFile}, describing
   * added file.
   * @callback DBWrap~cbSaveUpload
   * @param  {?Error} err
   * @param  {ExpiringFile} file
   */

  /**
   * Gets called with an Array of {@link ExpiringFile} instances
   * @callback DBWrap~cbExpiringFiles
   * @param {?Error} err
   * @param {Array.<ExpiringFile>} files
   */

  /**
   * Gets called with the result of a getSortedSetRangeByScoreWithScores request
   * @callback DBWrap~cbExpiredIds
   * @param  {?Error} err
   * @param  {Array.<Object>} fileIds - A SortedSetRangeWithScores
   *                                    with file ids as value
   */
}

module.exports = DBWrap;
