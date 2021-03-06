/* globals define */

define('plugin/expiring-uploads/settings/time', function() {
  'use strict';

  /**
   * Convert days/weeks/months values to seconds.
   * 1 month resolves to the Gregorian calendar's mean month length
   * of 30.44 days.
   * @param {string} days   - Positive int as string.
   * @param {string} weeks  - Positive int as string.
   * @param {string} months - Positive int as string.
   * @return {number}
   * @todo Find a better, more descriptive name
   */
  var toSeconds = function(days, weeks, months) {
    return parseInt(days, 10) * 86400 +
           parseInt(weeks, 10) * 604800 +
           parseInt(months, 10) * 2629743;
  };

  /**
   * Check whether custom seconds string is valid.
   * @param {string} seconds - Positive int as string
   * @return {bool}
   */
  var validateCustomSeconds = function(seconds) {
    return seconds !== '';
  };

  /**
   * Returned by toDaysWeeksMonths
   * @typedef {Object} DaysWeeksMonths
   * @property {number} days     - Number of days in given seconds
   * @property {number} weeks    - Number of weeks in given seconds
   * @property {number} months   - Number of months in given seconds
   * @property {bool}   isCustom - Indicates whether given seconds are a custom setting
   */

  /**
   * Convert seconds to days/weeks/months values
   * @param  {number} seconds
   * @return {DaysWeeksMonths}
   */
  var toDaysWeeksMonths = function(seconds) {
    var months = Math.floor(seconds / 2629743);
    var weeks = Math.floor((seconds - (2629743 * months)) / 604800);
    var days = Math.floor((seconds - (2629743 * months) -
                            (604800 * weeks)) / 86400);

    return {
      days: days,
      weeks: weeks,
      months: months,
      isCustom: toSeconds(days, weeks, months) !== seconds
    };
  };
  /**
   * Functions for expiration time part of settings UI
   * @typedef {Time}
   * @property {function} toSeconds Converts days/weeks/months to seconds
   * @property {function} validateCustomSeconds Check whether custom seconds string is valid
   * @property {function} toDaysWeeksMonths Converts seconds to DaysWeeksMonths object
   */
  return {
    toSeconds: toSeconds,
    validateCustomSeconds: validateCustomSeconds,
    toDaysWeeksMonths: toDaysWeeksMonths
  };

});
