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
    return settings().fileTypes.indexOf(extension) > -1;
  }

  /**
   * Handles POST requests caught by {@link Routes.setFileUpload}
   * @param  {Express.IncomingMessage}   req
   * @param  {Express.ServerResponse}    res
   * @param  {Function} next
   */
  static receiveFiles(req, res, next) {
    uploadsController.upload(req, res, (file, iterNext) => Uploader.uploadIterator(file, req.uid, iterNext), next);
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
   * @param  {Object}   file       - File object from IncomingMessage
   * @param  {number}   uid        - User id of uploader
   * @param  {function} uploadNext - Callback for file iteration
   * @todo Use socket to describe upload modals 'error uploading, code: 500'
   * when extensions don't match
   */
  static uploadIterator(file, uid, uploadNext) {
    if (!Uploader.checkGlobalPermissions(file, uploadNext)) {
      winston.verbose(logTag` Uploaded file '${file.name}' failed global permission check.`);
      return;
    }

    let extension = path.extname(file.name);
    if (!Uploader.checkPluginTypes(extension)) {
      winston.verbose(logTag` Denied request to handle file with extension '${extension}'`);
      // add socket to report error
      uploadNext(true);
    } else {
      let expTstamp = Date.now() + settings().expireAfter;
      // only used for the link; all internals use the numeric expTstamp
      // let hexTstamp = expTstamp.toString(16);

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
        if (err) return uploadNext(err);
        return uploadNext(null, {
          url: {
            linkText: file.name,
            url: expFile.url
          }
        });
      });
    }
  }

  /**
   * Verifies that uploaded file has all global permissions.
   * @param  {Object}   fileMeta - File data object from IncomingMessage
   * @param  {Function} next     - - Express callback to send Error to frontend
   * - Only called on error, i.e. denied permission
   * @return {bool}              - `True` if all conditions are met
   * - `False` if one test fails.
   */
  static checkGlobalPermissions(fileMeta, next) {
    if (parseInt(meta.config.allowFileUploads, 10) !== 1) {
      next(new Error('[[error:uploads-are-disabled]]'));
      return false;
    }

    if (!fileMeta) {
      next(new Error('[[error:invalid-file]]'));
      return false;
    }

    if (fileMeta.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
      next(new Error('[[error:file-too-big, ' +
                   meta.config.maximumFileSize + ']]'));
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
