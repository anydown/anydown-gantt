export function resetHMS(d) {
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}
export function resetHMSfromEpoc(epoc) {
  return resetHMS(new Date(epoc)).getTime();
}
export function roundHMSfromEpoc(epoc) {
  return resetHMS(new Date(epoc + (24 * 60 * 60 * 1000) / 2)).getTime();
}
export function getRelativeDate(day) {
  let d = new Date();
  resetHMS(d);
  d.setDate(d.getDate() + day);
  return d;
}
export function getNewDate(str, offset) {
  const m = str.match(/(\d+)-(\d+)-(\d+)/);
  if (!m) {
    let d = new Date();
    resetHMS(d);
    return d;
  }
  const ny = parseInt(m[1], 10);
  const nm = parseInt(m[2], 10) - 1;
  const nd = parseInt(m[3], 10);
  let d = new Date(ny, nm, nd);
  if (offset !== undefined) {
    d.setDate(d.getDate() + offset);
  }
  return d;
}
export function getMonthArray() {
  return {
    "ja-JP": [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月"
    ],
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ]
  };
}
