'use strict';

const meta = require.main.require('./src/meta');
const uploadsController = require.main.require('./src/controllers/uploads');
const settings = require('./settings');
const path = require('path');
const nconf = require.main.require('nconf');
const xxh = require('xxhash');
const ExpiringFile = require('./expiring-file');
const utils = require.main.require('./public/src/utils');
const validator = require.main.require('validator');
const winston = require.main.require('winston');
const FileHandler = require('./filehandler');
const async = require.main.require('async');
const DB = require('./dbwrap');

const logTag = require('./logtag');

/**
 * @class - Handles uploads from frontends uploader modal
 * @example
 * // invoking the frontend modal:
 * require(['uploader'], function(uploader) {
 *   uploader.show({
 *     route: config.relative_path + '/plugins/expiring-uploads/upload',
 *     params: {},
 *     fileSize: ajaxify.data.maximumProfileImageSize,
 *     title: '[[user:upload_picture]]',
 *     description: '[[user:upload_a_picture]]',
 *     accept: '.txt,.jpg,.bmp'
 *   }, function(imageUrlOnServer) {
 *     onUploadComplete(imageUrlOnServer);
 *   });
 * });
 */
class Uploader {
  constructor() {}

  /**
   * Checks whether given extension string is handled by the plugin
   * @param  {string} extension - `'.txt'`, `'.zip'`, `'.deb'`
   * @return {bool}
   * @todo Move to more general class
   */
  static checkPluginTypes(extension) {
    return settings().fileTypes.indexOf(extension.substring(1)) > -1;
  }

  /**
   * Handles POST requests caught by {@link Routes.setFileUpload}
   * @param  {Express.IncomingMessage}   req
   * @param  {Express.ServerResponse}    res
   * @param  {Function} next
   */
  static receiveFiles(req, res, next) {
    uploadsController.upload(req, res, (file, iterNext) => Uploader.uploadIterator(file, req.uid, iterNext, res), next);
  }

  /**
   * Slugifies and escapes filename
   * @param  {string}  filename  - `'scribble.txt'`, `'meanNumbers.xls'`
   * @param  {?string} extension - - Filenames extension (`'.txt'`, `'.xls'`)
   * - Gets extension from filename if omitted
   * @return {string}
   */
  static slugScape(filename, extension) {
    extension = extension || path.extname(filename);
    let rawName = path.basename(filename, extension);
    let slugName = utils.slugify(rawName);
    return validator.escape(slugName) + extension;
  }

  /**
   * Handles the file in received request
   * @param  {Object}         file       - File object from IncomingMessage
   * @param  {number}         uid        - User id of uploader
   * @param  {function}       uploadNext - Callback for file iteration
   * @param  {ServerResponse} res        - Used to report errors
   * when extensions don't match
   */
  static uploadIterator(file, uid, uploadNext, res) {
    if (!Uploader.checkGlobalPermissions(file, res)) {
      return winston.verbose(logTag` Uploaded file '${file.name}' failed global permission check.`);
    }

    let extension = path.extname(file.name);
    if (!Uploader.checkPluginTypes(extension)) {
      winston.verbose(logTag` Denied request to handle file with extension '${extension}'`);
      /**
       * @todo Add translator
       */
      return Uploader.respondJSONError(res, 'Filetype not allowed. Please don\'t change the default!');
    }
    let expTstamp = Date.now() + settings().expireAfter;

    /**
     * @type {ExpiringFile.uploadMeta}
     */
    let uploadMeta = {
      fileName: `${expTstamp}-${Uploader.slugScape(file.name)}`,
      origName: file.name,
      expTstamp: expTstamp,
      hash: Uploader.getHash(file),
      deleted: false,
      uid: uid
    };

    let expFile = new ExpiringFile(null);
    expFile.uploadMeta = uploadMeta;

    async.waterfall([
      function(next) {
        FileHandler.saveUpload(expFile, file.path, next);
      }, function(next) {
        DB.saveUpload(expFile.uploadMeta, next);
      }
    ], function(err) {
      /**
       * @todo Add translator
       */
      if (err) return Uploader.respondJSONError(res, 'Unexpected Error while saving your file. Please contact someone!');
      return uploadNext(null, {
        url: {
          linkText: file.name,
          url: expFile.url
        }
      });
    });
  }

  /**
   * Responds with a custom error object to meet uploader modules needs
   * @param  {ServerResponse} res     - ServerResponse to send the error with
   * @param  {string}         langKey - Key for translation
   * @todo Implement translations
   */
  static respondJSONError(res, langKey) {
    res.contentType('json');
    res.send({ error: langKey});
  }

  /**
   * Verifies that uploaded file has all global permissions.
   * @param  {Object}         fileMeta - File data object from IncomingMessage
   * @param  {ServerResponse} res - Used to send possible error, i.e. not granted permission
   * @return {bool}              - `True` if all conditions are met
   * - `False` if one test fails.
   */
  static checkGlobalPermissions(fileMeta, res) {
    /**
     * @todo Add translator for respondJSONError calls
     */

    if (parseInt(meta.config.allowFileUploads, 10) !== 1) {
      Uploader.respondJSONError(res, 'Uploads are disabled');
      return false;
    }

    if (!fileMeta) {
      Uploader.respondJSONError(res, 'No file received');
      return false;
    }

    if (fileMeta.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
      Uploader.respondJSONError(res, 'File too big. Maximum file size: ' +
        meta.config.maximumFileSize);
      return false;
    }
    return true;
  };

  /**
   * Creates hash for a file from its meta data
   * @param  {Object} fileMeta
   * @return {string} 8-character base16 hash
   */
  static getHash(fileMeta) {
    // key is generated from 'NodeBB secret'
    var key = nconf.get('secret');
    key = parseInt('0x' + key.substring(0, key.indexOf('-')), 16);
    return xxh.hash(new Buffer(JSON.stringify(fileMeta)), key).toString(16);
  };
}

module.exports = Uploader;
