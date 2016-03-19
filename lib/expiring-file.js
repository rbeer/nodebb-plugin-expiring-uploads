'use strict';

const path = require('path');
const nconf = require.main.require('nconf');
const settings = require('./settings');

/**
 * @class - Meta data for a file handled by the plugin
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
   * Meta data of an upload
   * @typedef {Object} ExpiringFile.uploadMeta
   * @property {string} fileName  - File name on disk
   * @property {string} origName  - Original file name
   * @property {number} expTstamp - Timestamp of expiration
   * @property {string} hash      - Files hash
   * @property {bool}   deleted   - Flag whether file on disk has been deleted
   * @property {number} uid       - User id of uploader
   */

  /**
   * @param {?(number|string)}         fileId     - Id of file in database
   * @param {?ExpiringFile.uploadMeta} uploadMeta
   */
  constructor(id, uploadMeta) {
    this.id = typeof id === 'string' ? parseInt(id, 10) : id;
    this.absolutePath = null;
    this._fileName = null;
    this.key = `expiring-uploads:${id}`;
    this.uploadMeta = uploadMeta;
  }

  /**
   * Sets instances filename and absolute path
   * @param  {string} name
   * @example
   * let expFile = new ExpiringFile(50);
   * expFile.fileName;
   * > null
   * expFile.absolutePath;
   * > null
   *
   * expFile.fileName = 'log.txt';
   *
   * expFile.fileName;
   * > 'log.txt'
   * expFile.absolutePath;
   * > '/opt/NodeBB/[storagePath]{@link Settings#storage}/log.txt'
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
