'use strict';

const SettingsCore = require.main.require('./src/settings');

/**
 * @class - ExpiringUploads settings
 * @extends {SettingsCore}
 */
class Settings extends SettingsCore {
  constructor() {
    let HASH = 'expiring-uploads';
    let DEVMODE = process.env.NODE_ENV === 'development';
    let CONFIG_VERSION = 0;
    let DEFAULT_SETTINGS = {
      storage: '/expiring_uploads/',
      expiringTypes: [],
      expireAfter: 0,
      delFiles: false,
      delFilesInterval: 600,
      linkText: '',
      setLinkText: false
    };
    super(HASH, CONFIG_VERSION, DEFAULT_SETTINGS, null, DEVMODE, false);
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
}

module.exports = new Settings();
