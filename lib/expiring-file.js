'use strict';

const path = require('path');
const nconf = require.main.require('nconf');
const settings = require('./settings');

/**
 * @class Meta data for an expiring file
 * @example
 * let expFile = new ExpiringFile(254);
 * expFile {
 *   id: 254,
 *   absolutePath: null,
 *   _fileName: null,
 *   key: 'expiring-uploads:254',
 *   fileName: this.[fileName]{@link ExpiringFile#fileName}
 * }
 */
class ExpiringFile {
  /**
   * @param  {!(number|string)} id Positive integer, ID of file in database
   */
  constructor(id) {
    if (!id) return null;
    this.id = typeof id === 'number' ? id : parseInt(id, 10);
    this.absolutePath = null;
    this._fileName = null;
    this.key = `expiring-uploads:${id}`;
  }

  /**
   * Sets instances filename and absolute path
   * @param  {string} name
   * @example
   * let expFile = new ExpiringFile(50);
   * expFile.fileName;      // null
   * expFile.absolutePath;  // null
   *
   * expFile.fileName = 'log.txt';
   *
   * expFile.fileName;      // 'log.txt'
   * expFile.absolutePath;  // '/opt/NodeBB/[storagePath]{@link Settings#storage}/log.txt'
   */
  set fileName(name) {
    this._fileName;
    this.absolutePath = path.join(nconf.get('base_dir'),
                                   settings.storage, name);
    return this.fileName;
  }
  get fileName() {
    return this._fileName;
  }
}

module.exports = ExpiringFile;
