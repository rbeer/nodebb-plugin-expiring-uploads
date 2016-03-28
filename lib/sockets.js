'use strict';

const AdminSocket = require.main.require('./src/socket.io/admin');
const UIError = require('./uierror');
const DB = require('./dbwrap');
const Settings = require('./settings');

class Sockets {

  static initAdmin() {
    AdminSocket.plugins.ExpiringUploads = {
      saveSettings: Sockets.saveSettings,
      getFileData: Sockets.getFileData,
      deleteFile: Sockets.deleteFile
    };
  }

  static saveSettings(socket, data, cb) {
    Settings().saveSettings(data, cb);
  }

  static getFileData(socket, data, cb) {
    let keys = Array(data.end - data.start).fill('').map((key, idx) =>
      'expiring-uploads:' + (data.start + idx));
    DB.getObjects(keys, (err, fileData) => {
      if (err) {
        return cb(new UIError('Error while retrieving files data from DB.',
                              'EDBREAD', err));
      }
      console.log(fileData);
    });
  }

  static deleteFile(socket, id, cb) {

    DB.setObject('expiring-uploads:' + id, (err) => {
      if (err) {
        return cb(new UIError('Error while deleting file from DB.',
                              'EDBWRITE', err));
      }
    });
  }
}

module.exports = Sockets;
