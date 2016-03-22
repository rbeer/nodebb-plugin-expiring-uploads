'use strict';

const fs = require('fs');
const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const settings = require('./settings');
const async = require.main.require('async');
const logTag = require('./logtag');
const DB = require('./dbwrap');

/**
 * @class - Handles file-system operations.
 * - Instances can also schedule deletion of expired files
 */
class FileHandler {
  constructor() {
    this._timeout = settings().expireAfter;
    this._intervalReference = null;
  }
  /**
   * Sets interval for expired file deletion
   */
  startFileDelete() {
    this._intervalReference = setInterval(() => FileHandler.deleteExpired(), settings().deleteFilesInterval);
    winston.info(logTag` Scheduled deleting expired files every ${settings().expireAfter / 1000} seconds`);
  }
  /**
   * Clears interval for expired file deletion
   */
  stopFileDelete() {
    clearInterval(this._intervalReference);
    this._intervalReference = null;
  }
  /**
   * Resets interval for expired file deletion
   */
  resetFileDelete() {
    if (this._intervalReference) this.stopFileDelete();
    this.startFileDelete();
  }

  /**
   * Moves uploaded file from its temp path to the storage folder
   * @param  {ExpiringFile} expFile - Meta data of file to move
   * @param  {string}       tmpPath - Temporary upload path
   * @param  {function}     cb
   */
  static saveUpload(expFile, tmpPath, cb) {
    var is = fs.createReadStream(tmpPath);
    var os = fs.createWriteStream(expFile.absolutePath);

    is.on('end', cb);
    os.on('error', cb);
    is.pipe(os);
  }

  /**
   * Regular cleanup routine
   */
  static deleteExpired() {
    async.waterfall([
      DB.getExpiredIds,
      DB.getExpiringFiles,
      FileHandler.deleteFiles,
      DB.setFilesDeleted
    ], function(err, keys) {
      if (err) {
        if (err.code === 'ENOEXP') {
          return winston.info(logTag`${err.message}`);
        }
        winston.error(logTag`Error while deleting expired files`);
        winston.error(err);
      }
    });
  };

  /**
   * Deletes files described by given ExpiringFile intances
   * @param  {Array.<ExpiringFile>} files
   * @param  {FileHandler~cbDeleteFiles} next
   */
  static deleteFiles(files, next) {
    async.each(files, (file, eachNext) => {
      fs.unlink(file.absolutePath, function(err) {
        if (err) {
          if (err.code === 'ENOENT') {
            // no reason to panic, if file is not found
            winston.warn(logTag` Couldn't delete ${file.absolutePath} [Not found]`);
          } else {
            // everything else could be a serious problem; abort
            return eachNext(err);
          }
        } else {
          winston.verbose(logTag` Deleted ${file.absolutePath}`);
          eachNext();
        }
      });
    }, (err) => err ? next(err) : next(null, files));
  }

  /**
   * Creates storage folder on disk if not already present
   * @param  {Function} next
   */
  static createStorage(next) {
    var absPath = nconf.get('base_dir') + settings().storage;
    // create 'storage' directory
    fs.mkdir(absPath, function(err) {
      if (err) {
        if (err.code === 'EEXIST') {
          // if folder exists, we're good.
          return next();
        } else {
          // unexpected error; scream panic back into the log ;)
          winston.error(logTag` Unexpected error while creating ${absPath}`);
          return next(err);
        }
      }
      winston.warn(logTag` Storage folder '${absPath}' not found. Created it.`);
      next();
    });
  }

  /**
   * Makes sure {@link Settings.storage} isn't part of /public/
   * @param  {Function} next
   */
  static checkPublicStorage(next) {
    winston.info(logTag` Settings loaded.`);
    // everything in /public is out of the question, since it is
    // automatically exposed to the public (hence the name - maybe? ^_^)
    var pubTestPath = nconf.get('base_dir') + '/public';
    if (settings().storage.indexOf(pubTestPath) > -1) {
      winston.error(logTag` Upload directory is publicly accessible. Refusing to activate plugin!`);
      return next(new Error(`Public directory '${pubTestPath}' not allowed as storage.`));
    }
    next();
  }

  /**
   * @callback FileHandler~cbDeleteFiles
   * @param {?Error} err
   * @param {Array.<ExpiringFile>} files - Passed down input
   */
}

module.exports = FileHandler;
