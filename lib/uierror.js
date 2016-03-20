'use strict';

/**
 * @class Error object to send to frontend
 */
class UIError {
  /**
     * @param  {string}  message - Short message, describing error from a
     *                             frontend POV. e.g. It could be shown in
     *                             a toast or alert box.
     * @param  {?string} code
     * @param  {?Error}  reason  - Optional Error object from backend.
     *                            Might reveal sensible data. Be sure
     *                            what you send!
     * @constructor
     */
  constructor(message, code, reason) {
    this.message = message;
    this.reason = reason;
    this.code = code;
  }
}

module.exports = UIError;
