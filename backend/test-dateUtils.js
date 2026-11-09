const { addCalendarMonths, computeMembershipStatus, formatDateToYYYYMMDD, getTodayDateOnly } = require('./utils/dateUtils');

console.log('Testing dateUtils...');

// 1. Jan 31 + 1 month in non-leap year (e.g. 2026-01-31)
const d1 = new Date(Date.UTC(2026, 0, 31));
const r1 = addCalendarMonths(d1, 1);
console.log('Jan 31, 2026 + 1 month:', formatDateToYYYYMMDD(r1));
if (formatDateToYYYYMMDD(r1) !== '2026-02-28') {
  console.error('FAIL: Expected 2026-02-28, got', formatDateToYYYYMMDD(r1));
  process.exit(1);
}

// 2. Jan 31 + 1 month in leap year (e.g. 2028-01-31)
const d2 = new Date(Date.UTC(2028, 0, 31));
const r2 = addCalendarMonths(d2, 1);
console.log('Jan 31, 2028 + 1 month (leap):', formatDateToYYYYMMDD(r2));
if (formatDateToYYYYMMDD(r2) !== '2028-02-29') {
  console.error('FAIL: Expected 2028-02-29, got', formatDateToYYYYMMDD(r2));
  process.exit(1);
}

// 3. Aug 31 + 1 month -> Sep 30
const d3 = new Date(Date.UTC(2026, 7, 31));
const r3 = addCalendarMonths(d3, 1);
console.log('Aug 31, 2026 + 1 month:', formatDateToYYYYMMDD(r3));
if (formatDateToYYYYMMDD(r3) !== '2026-09-30') {
  console.error('FAIL: Expected 2026-09-30, got', formatDateToYYYYMMDD(r3));
  process.exit(1);
}

// 4. Status check
const pastDate = new Date(Date.UTC(2020, 0, 1));
const futureDate = new Date(Date.UTC(2030, 0, 1));
console.log('Status past date:', computeMembershipStatus(pastDate));
console.log('Status future date:', computeMembershipStatus(futureDate));

if (computeMembershipStatus(pastDate) !== 'Expired' || computeMembershipStatus(futureDate) !== 'Active') {
  console.error('FAIL: Status check failed');
  process.exit(1);
}

console.log('ALL DATE TESTS PASSED SUCCESSFULLY! 🎉');

