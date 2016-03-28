'use strict';

const DB = require.main.require('./src/database');
const ExpiringFile = require('./expiring-file');
const async = require.main.require('async');

/**
 * @class - Wraps NodeBB database
 */
class DBWrap {
  constructor() {
  }

  /**
   * Adds one new File to the database
   * @param  {ExpiringFile.uploadMeta} uploadData
   * @param  {Function} cb
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
    ], err => err ? cb(err) : cb(null, file));
  };

  /**
   * Looks up all expired file ids
   * @param  {DBWrap~cbExpiredIds} cb
   */
  static getExpiredIds(cb) {
    DB.getSortedSetRangeByScoreWithScores('expiring-uploads:ids', 0, -1,
                                          1, Date.now(), cb);
  }

  static getFileId(tstamp, cb) {
    DB.getSortedSetRevRangeByScore('expiring-uploads:ids', 0, 1,
                                   tstamp, tstamp, cb);
  }

  /**
   * Creates {@link ExpiringFile} instaces from DB entries
   * @param  {Array.<{value: string, score: string}>} fileIds - A SortedSetRangeWithScores with
   *                                                            file ids as value
   * @param  {DBWrap~cbExpiringFiles} cb
   */
  static getExpiringFiles(err, fileIds, cb) {
    if (err) {
      return cb(err);
    }
    if (fileIds.length === 0) {
      err = new RangeError('No expired uploads found.');
      err.code = 'ENOEXP';
      return cb(err);
    }
    console.log(fileIds);
    let files = fileIds.map((id) => new ExpiringFile(id.value));
    let keys = files.map((file) => file.key);
    DB.getObjects(keys, function(err, uploadMeta) {
      if (err) {
        return cb(err);
      }
      console.log(files);
      files.forEach((file, idx) => (file.uploadMeta = uploadMeta[idx]));
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
   * @param  {Array.<{value: string, score: string}>} fileIds - A SortedSetRangeWithScores
   *                                            with file ids as value and timestamp as score. See example.
   * @example
   * [ {'value': '14', 'score': '1458469845127'}, {'value': '1', 'score': '1458470075706'}]
   */
}

module.exports = DBWrap;
