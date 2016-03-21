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
  constructor(id) {
    this.id = typeof id === 'string' ? parseInt(id, 10) : id;
    this.absolutePath = null;
    this._fileName = null;
    this.key = `expiring-uploads:${id}`;
    this._uploadMeta = null;
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
    this._fileName = name;
    this.absolutePath = path.join(nconf.get('base_dir'),
                                  settings().storage, name);
    return this._fileName;
  }
  get fileName() {
    return this._fileName;
  }

  /**
   * Sets instances [uploadMeta]{@link ExpiringFile.uploadMeta} object
   * @return {ExpiringFile.uploadMeta}
   */
  set uploadMeta(obj) {
    this._uploadMeta = obj;
    this.fileName = obj.fileName;
  }
  get uploadMeta() {
    return this._uploadMeta;
  }

  /**
   * Builds url for this file
   * @return {string}
   * @example
   * expFile.uploadMeta.hash;
   * > '70042d29'
   * expFile.uploadMeta.expTstamp.toString(36);
   * > 'ilzvpkvk'
   * expFile.fileName;
   * > '1458436960496-stuff.txt'
   *
   * expFile.url;
   * > '/uploads/70042d29/ilzvpkvk/stuff.txt'
   */
  get url() {
    let thisMeta = this._uploadMeta;
    let urlName = this._fileName.replace(/^\d*-/, '');
    return nconf.get('upload_url') +
           `${thisMeta.hash}/${thisMeta.expTstamp.toString(36)}/${urlName}`;
  }
}

module.exports = ExpiringFile;
