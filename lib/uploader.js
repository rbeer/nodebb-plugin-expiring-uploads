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

/* client modal

require(['uploader'], function(uploader) {
uploader.show({
        route: config.relative_path + '/plugins/expiring-uploads/upload',
        params: {},
        fileSize: ajaxify.data.maximumProfileImageSize,
        title: '[[user:upload_picture]]',
        description: '[[user:upload_a_picture]]',
        accept: '.txt,.jpg,.bmp'
      }, function(imageUrlOnServer) {
        onUploadComplete(imageUrlOnServer);
      });
});
 */

class Uploader {
  constructor() {}

  static receiveFiles(req, res, next) {
    const checkPluginTypes = (extension) => {
      return settings().fileTypes.indexOf(extension) > -1;
    };
    uploadsController.upload(req, res, (file, uploadNext) => {
      if (!Uploader.checkGlobalPermissions(file, uploadNext)) return;
      let extension = path.extname(file.name);
      if (checkPluginTypes(extension)) {
        let expTstamp = Date.now() + settings().expireAfter;
        // only used for the link; all internals use the numeric expTstamp
        // let hexTstamp = expTstamp.toString(16);

        let rawName = path.basename(file.name, extension);
        let slugName = utils.slugify(rawName);
        let filename = validator.escape(slugName) + extension;

        /**
         * @type {ExpiringFile.uploadMeta}
         */
        let uploadMeta = {
          fileName: `${expTstamp}-${filename}`,
          origName: file.name,
          expTstamp: expTstamp,
          hash: Uploader.getHash(file),
          deleted: false,
          uid: req.uid
        };
        let expFile = new ExpiringFile(null, uploadMeta);
        console.log(expFile);

        uploadNext();

      }
    }, next);
  }

  static checkGlobalPermissions(file, cb) {
    if (parseInt(meta.config.allowFileUploads, 10) !== 1) {
      cb(new Error('[[error:uploads-are-disabled]]'));
      return false;
    }

    if (!file) {
      cb(new Error('[[error:invalid-file]]'));
      return false;
    }

    if (file.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
      cb(new Error('[[error:file-too-big, ' +
                   meta.config.maximumFileSize + ']]'));
      return false;
    }
    return true;
  };

  static getHash(fileMeta) {
    // key is generated from 'NodeBB secret'
    var key = nconf.get('secret');
    key = parseInt('0x' + key.substring(0, key.indexOf('-')), 16);
    return xxh.hash(new Buffer(JSON.stringify(fileMeta)), key).toString(16);
  };
}

module.exports = Uploader;
