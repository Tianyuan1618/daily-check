/**
 * ============================================================
 *  data.js — 农历 & 节气数据模块
 *  农历计算完全基于官方库 lunar-javascript（离线本地文件）
 *  职责：
 *  1. 公历 → 农历（官方库，200年覆盖，精确可靠）
 *  2. 天干地支、生肖、节日（农历+公历）
 *  3. 二十四节气（官方库）
 *  4. 德国公共假期（固定 + 复活节算法推算）
 *  5. 星期计算
 * ============================================================
 */

/* ==================== 一、基础常量 ==================== */

// 星期
const WEEK_DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 农历月份名（映射官方 getMonthInChinese 输出）
const LUNAR_MONTH_NAMES = {
  '正': '正月', '二': '二月', '三': '三月', '四': '四月', '五': '五月', '六': '六月',
  '七': '七月', '八': '八月', '九': '九月', '十': '十月', '冬': '冬月', '腊': '腊月',
};

// 公历节日（补充官方库没有的）
const SOLAR_FESTIVALS = {
  '2-14':  '情人节',
  '3-8':   '妇女节',
  '3-12':  '植树节',
  '4-1':   '愚人节',
  '5-4':   '青年节',
  '6-1':   '儿童节',
  '7-1':   '建党节',
  '8-1':   '建军节',
  '9-10':  '教师节',
  '12-24': '平安夜',
};

/* ==================== 二、德国公共假期 ==================== */

// 固定日期假期（全德国统一）
const GERMAN_FIXED_HOLIDAYS = {
  '1-1':   { name: '元旦', note: '' },
  '5-1':   { name: '劳动节', note: '' },
  '10-3':  { name: '德国统一日', note: '' },
  '12-25': { name: '圣诞节', note: '' },
  '12-26': { name: '圣诞节次日', note: '' },
};

// 部分州才有的固定假期
const GERMAN_STATE_HOLIDAYS = {
  '1-6':   { name: '三王节', note: 'BW, BY, ST' },
  '11-1':  { name: '万圣节', note: 'BW, BY, NW, RP, SL' },
};

/**
 * 计算某年复活节日期（Anonymous Gregorian 算法，1900-2099 精确）
 */
function _easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

/**
 * 获取某天的德国公共假期
 * @returns {Array<{name: string, note: string}>}
 */
function getGermanHolidays(year, month, day) {
  const result = [];
  const key = month + '-' + day;

  const fixed = GERMAN_FIXED_HOLIDAYS[key];
  if (fixed) result.push({ name: fixed.name, note: fixed.note });

  const state = GERMAN_STATE_HOLIDAYS[key];
  if (state) result.push({ name: state.name, note: state.note });

  // 复活节相关移动假期
  const easter = _easterDate(year);
  const easterDate = new Date(year, easter.month - 1, easter.day);
  const target = new Date(year, month - 1, day);
  const diff = Math.floor((target - easterDate) / 86400000);

  const movable = {
    [-2]: { name: '耶稣受难日', note: '' },
    [1]:  { name: '复活节周一', note: '' },
    [39]: { name: '耶稣升天节', note: '' },
    [50]: { name: '圣灵降临节周一', note: '' },
    [60]: { name: '圣体节', note: 'BW, BY, HE, NW, RP, SL' },
  };
  const mv = movable[diff];
  if (mv) result.push({ name: mv.name, note: mv.note });

  return result;
}

/* ==================== 三、农历核心（官方库） ==================== */

/**
 * 公历 → 农历（全部由 lunar-javascript 官方库计算）
 * @param {number} year  - 公历年份（支持 1900-2100）
 * @param {number} month - 公历月份（1-12）
 * @param {number} day   - 公历日（1-31）
 */
function getLunarDate(year, month, day) {
  // 使用官方 lunar-javascript 库（全局变量 Solar）
  if (typeof Solar === 'undefined') {
    console.error('lunar-javascript 库未加载！');
    return null;
  }
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  const lunarYear = lunar.getYear();
  const isLeap = lunar.getMonth() < 0;
  const lunarMonth = Math.abs(lunar.getMonth());
  const lunarDay = lunar.getDay();

  // 月名（官方返回 '正'/'二'/.../ '闰六'）
  const rawMonth = lunar.getMonthInChinese();
  const lepPrefix = rawMonth.startsWith('闰') ? '闰' : '';
  const monthName = lepPrefix + (LUNAR_MONTH_NAMES[rawMonth.replace('闰', '')] || rawMonth + '月');

  // 日名（官方返回 '初一'/'十五'/'廿九'）
  const dayName = lunar.getDayInChinese();

  // 干支年 / 生肖 / 干支日（官方）
  const ganZhiYear = lunar.getYearInGanZhi();
  const ganZhiDay = lunar.getDayInGanZhi();
  const shengXiao = lunar.getYearShengXiao();

  // 节气（官方：当天是节气则返回名字，否则空字符串）
  const jieQi = (lunar.getJieQi && lunar.getJieQi()) || '';

  // 节日：官网农历节日 + 官方公历节日 + 补充公历节日表（合并去重）
  const lunarFestivals = (lunar.getFestivals && lunar.getFestivals()) || [];
  const solarFestivals = (solar.getFestivals && solar.getFestivals()) || [];
  const extraFestival = SOLAR_FESTIVALS[month + '-' + day];
  const festivals = [];
  lunarFestivals.concat(solarFestivals).concat(extraFestival ? [extraFestival] : []).forEach(f => {
    if (f && festivals.indexOf(f) === -1) festivals.push(f);
  });

  // 德国公共假期
  const germanHolidays = getGermanHolidays(year, month, day);

  // 星期
  const weekDay = WEEK_DAYS[new Date(year, month - 1, day).getDay()];

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeap,
    monthName,
    dayName,
    ganZhiYear,
    ganZhiDay,
    shengXiao,
    jieQi,
    festivals,
    germanHolidays,
    weekDay,
    dateString: `${lunarYear}年${monthName}${dayName}`,
    fullDateString: `农历${ganZhiYear}年 ${monthName}${dayName}（${ganZhiDay}日）`,
  };
}

/* ==================== 四、工具函数 ==================== */

/**
 * 获取公历某日完整信息（供 render 使用）
 */
function getDateInfo(dateStr) {
  let year, month, day;
  if (dateStr) {
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return null;
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
    day = now.getDate();
  }

  const now = new Date(year, month - 1, day);
  const lunar = getLunarDate(year, month, day);
  const weekDay = WEEK_DAYS[now.getDay()];

  return {
    solarYear: year,
    solarMonth: month,
    solarDay: day,
    weekDay,
    date: now,
    dateStr: `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`,
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    ...lunar,
  };
}

/**
 * 获取今日完整信息（兼容旧调用）
 */
function getTodayInfo() {
  return getDateInfo(null);
}