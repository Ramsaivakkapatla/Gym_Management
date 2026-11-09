/**
 * Gym Membership Management System
 * Date Utility Functions
 * 
 * Handles calendar month additions with month-end clipping (e.g. Jan 31 + 1 mo = Feb 28/29)
 * and date-only normalization to avoid timezone-related 1-day drift.
 */

/**
 * Normalizes a Date or date string to UTC midnight date-only representation.
 * @param {Date|string|number} dateInput 
 * @returns {Date} Normalized Date at UTC 00:00:00.000
 */
function normalizeToDateOnly(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Returns today's date normalized to UTC midnight.
 * @returns {Date}
 */
function getTodayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

/**
 * Formats a Date to YYYY-MM-DD
 * @param {Date|string} dateInput 
 * @returns {string}
 */
function formatDateToYYYYMMDD(dateInput) {
  const d = normalizeToDateOnly(dateInput);
  if (!d) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds calendar months to a given date, handling month-end overflow correctly.
 * Example:
 * Jan 31 + 1 month in non-leap year -> Feb 28
 * Jan 31 + 1 month in leap year -> Feb 29
 * Aug 31 + 1 month -> Sep 30
 * 
 * @param {Date|string} baseDate 
 * @param {number} monthsToAdd 
 * @returns {Date} Normalized Date
 */
function addCalendarMonths(baseDate, monthsToAdd) {
  const normalized = normalizeToDateOnly(baseDate);
  if (!normalized) throw new Error('Invalid base date provided');

  const origYear = normalized.getUTCFullYear();
  const origMonth = normalized.getUTCMonth(); // 0 - 11
  const origDay = normalized.getUTCDate();    // 1 - 31

  const totalMonths = origMonth + Number(monthsToAdd);
  const targetYear = origYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  // Maximum days in target month
  // Passing 0 as day to Date.UTC returns the last day of the previous month
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(origDay, daysInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
}

/**
 * Computes status dynamically:
 * If today <= expiryDate -> 'Active'
 * If today > expiryDate -> 'Expired'
 * 
 * @param {Date|string} expiryDate 
 * @returns {'Active'|'Expired'}
 */
function computeMembershipStatus(expiryDate) {
  const today = getTodayDateOnly();
  const exp = normalizeToDateOnly(expiryDate);
  if (!exp) return 'Expired';
  return today.getTime() <= exp.getTime() ? 'Active' : 'Expired';
}

module.exports = {
  normalizeToDateOnly,
  getTodayDateOnly,
  formatDateToYYYYMMDD,
  addCalendarMonths,
  computeMembershipStatus,
};

