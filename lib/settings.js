'use strict';

const SettingsCore = require.main.require('./src/settings');

/**
 * @class - ExpiringUploads settings
 * @extends {SettingsCore}
 */
class Settings extends SettingsCore {
  constructor(cb) {
    let HASH = 'expiring-uploads';
    let DEVMODE = process.env.NODE_ENV === 'development';
    let CONFIG_VERSION = '0.0.2';
    let DEFAULT_SETTINGS = {
      storage: '/expiring_uploads/',
      expiringTypes: [],
      expireAfter: 0,
      delFiles: false,
      delFilesInterval: 8000,
      linkText: '',
      setLinkText: false,
      lastId: 0
    };
    super(HASH, CONFIG_VERSION, DEFAULT_SETTINGS, cb, DEVMODE, false);
    this._hash = HASH;
    this._devmode = DEVMODE;
  }

  /**
   * Idle time between file deletion attempts
   * @type {number}
   * @example
   * // 5 minutes
   * 300
   * // 1 hour
   * 3600
   * // 20 seconds
   * new Buffer(':p').toString('hex').split('').reduce((time, d) => time + parseInt(d, 16), 0);
   */
  get deleteFilesInterval() {
    return this.get('delFilesInterval');
  }
  set deleteFilesInterval(seconds) {
    this.set('delFilesInterval', seconds);
  }
  /**
   * Whether plugin should look up expired files and delete
   * them from the file-system every [Settings.deleteFilesInterval]{@link Settings#deleteFilesInterval} seconds
   * @type {bool}
   * @example
   * true || false
   */
  get deleteFiles() {
    return this.get('delFiles');
  }
  set deleteFiles(val) {
    this.set('delFiles', val);
  }

  /**
   * Milliseconds uploads are available
   * @type {number}
   * @example
   * // 3 days
   * 25920000
   * // 1 week
   * 60480000
   * // 7 months, 3 weeks, 5 days - and 42 seconds
   * 2065464300
   */
  get expireAfter() {
    return this.get('expireAfter');
  }
  set expireAfter(timestamp) {
    this.member = timestamp;
  }

  /**
   * Path to upload folder, relative to nconf.get('base_dir')
   * @type {string}
   * @example
   * '/expiring_uploads/'
   */
  get storage() {
    return this.get('storage');
  }
  set storage(path) {
    this.set('storage', path);
  }

  /**
   * Filename extensions considered expiring uploads
   * @type {Array.<string>}
   * @example
   * ['.deb', '.txt', '.tar']
   */
  get fileTypes() {
    return this.get('expiringTypes');
  }
  set fileTypes(types) {
    this.set('expiringTypes', types);
  }

  /**
   * Advances id counter by 1 and returns that new id
   * @return {number} - Next, unused file id
   */
  get nextId() {
    return this.set('lastId', this.get('lastId') + 1);
  }
}
var exposed;
module.exports = (cb) => !exposed && cb ? (exposed = new Settings(cb)) : exposed;
