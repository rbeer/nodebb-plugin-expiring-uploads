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
   * @param {!(number|string}          fileData
   * @param {?ExpiringFile.uploadMeta} uploadMeta
   */
  constructor(id, uploadMeta) {
    if (!id) return null;
    this.id = typeof id === 'number' ? id : parseInt(id, 10);
    this.absolutePath = null;
    this._fileName = null;
    this.key = `expiring-uploads:${id}`;
    for (let key of Object.keys(uploadMeta)) {
      this[key] = uploadMeta[key];
    }
  }

  /**
   * Meta data of an upload
   * @typedef {ExpiringFile.uploadMeta}
   * @property {string} fileName  - File name on disk
   * @property {string} origName  - Original file name
   * @property {number} expTstamp - Timestamp of expiration
   * @property {string} hash      - Files hash
   * @property {bool}   deleted   - Flag whether file on disk has been deleted
   * @property {number} uid       - User id of uploader
   */

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
