'use strict';
/* globals define */

((define) => {
  define('plugin/expiring-uploads/settings/time', () => {
    /**
     * Calculates seconds from day/week/month values.
     * 1 month resolves to the Gregorian calendar's mean month length
     * of 30.44 days.
     * @param {string} days Positive int as string.
     * @param {string} weeks Positive int as string.
     * @param {string} months Positive int as string.
     * @return {number}
     * @todo Find a better, more descriptive name
     */
    var toSeconds = (days, weeks, months) => parseInt(days, 10) * 86400 +
                                             parseInt(weeks, 10) * 604800 +
                                             parseInt(months, 10) * 2629743;

    /**
     * Check whether custom seconds string is valid.
     * @param {string} seconds Positive int as string
     * @return {bool}
     */
    var validateCustomSeconds = (seconds) => seconds !== '';

    var toDayWeekMonth = function(totalVal) {
      var monthVal = Math.floor(totalVal / 2629743);
      var weekVal = Math.floor((totalVal - (2629743 * monthVal)) / 604800);
      var dayVal = Math.floor((totalVal - (2629743 * monthVal) -
                              (604800 * weekVal)) / 86400);
      return [dayVal, weekVal, monthVal];
    };
    return {
      toSeconds: toSeconds,
      validateCustomSeconds: validateCustomSeconds,
      toDayWeekMonth: toDayWeekMonth
    };
  });
})(define);
