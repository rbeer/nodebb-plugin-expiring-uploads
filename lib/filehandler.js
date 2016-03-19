'use strict';

const fs = require('fs');
const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const settings = require('./settings');
const async = require.main.require('async');

/**
 * @class Handles file-system operations and scheduled file deletion
 */
class FileHandler {
  constructor() {
    this._timeout = settings.expireAfter;
    this.intervalReference = null;
  }
  startFileDelete() {
    const self = this;
    this.intervalReference = setInterval(() => self.doSome(), 3000);
    winston.info('[plugins:expiring-uploads] Scheduled deleting expired files' +
                 ` every ${settings.expireAfter / 1000} seconds`);
  }
  stopFileDelete() {
    clearInterval(this.intervalReference);
    this.intervalReference = null;
  }
  resetFileDelete() {
    if (this.intervalReference) this.stopFileDelete();
    this.startFileDelete();
  }
  doSome() {
    console.log('doing some');
  }

  static createStorage(next) {
    var absPath = nconf.get('base_dir') + settings.storage;
    // create 'storage' directory
    fs.mkdir(absPath, function(err) {
      if (err) {
        if (err.code === 'EEXIST') {
          // if folder exists, we're good.
          return next();
        } else {
          // unexpected error; scream panic back into the log ;)
          winston.error('[plugin:expiring-uploads] Unexpected error while ' +
                        'creating ' + absPath);
          return next(err);
        }
      }
      winston.warn('[plugin:expiring-uploads] Storage folder \'' +
                      absPath + '\' not found. Created it.');
      next();
    });
  }

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
            winston.warn('[plugins:expiring-uploads] Couldn\'t delete ' +
                         file.absolutePath + ' [Not found]');
          } else {
            // everything else could be a serious problem; abort
            return eachNext(err);
          }
        } else {
          winston.verbose('[plugins:expiring-uploads] Deleted ' +
                          file.absolutePath);
          eachNext();
        }
      });
    }, (err) => err ? next(err) : next(null, files));
  }

  /**
   * @callback FileHandler~cbDeleteFiles
   * @param {?Error} err
   * @param {Array.<ExpiringFile>} files Passed down input
   */
}

module.exports = FileHandler;
