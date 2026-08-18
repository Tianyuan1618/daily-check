/**
 * ============================================================
 *  data.js — 农历 & 黄历数据模块
 *  农历计算完全基于官方库 lunar-javascript（离线本地文件）
 *  职责：
 *  1. 公历 → 农历（官方库，200年覆盖，精确可靠）
 *  2. 天干地支、生肖、节日
 *  3. 黄历宜忌（官方程式：建除十二神/值星、二十八宿）
 *  4. 星期计算
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

// 公历节日
const SOLAR_FESTIVALS = {
  '1-1':   '元旦',
  '2-14':  '情人节',
  '3-8':   '妇女节',
  '3-12':  '植树节',
  '4-1':   '愚人节',
  '5-1':   '劳动节',
  '5-4':   '青年节',
  '6-1':   '儿童节',
  '7-1':   '建党节',
  '8-1':   '建军节',
  '9-10':  '教师节',
  '10-1':  '国庆节',
  '12-25': '圣诞节',
};

/* ==================== 二、农历核心（官方库） ==================== */

/**
 * 公历 → 农历（全部由 lunar-javascript 官方库计算）
 * @param {number} year  - 公历年份（支持 iSolarYear 1900-2100）
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

  // 节日（官方农历节日 + 公历节日表）
  const lunarFestivals = lunar.getFestivals && lunar.getFestivals();
  const solarKey = month + '-' + day;
  const festival = (lunarFestivals && lunarFestivals.length > 0)
    ? '🎉 ' + lunarFestivals.join('、')
    : (SOLAR_FESTIVALS[solarKey] ? '🎉 ' + SOLAR_FESTIVALS[solarKey] : null);

  // 星期
  const weekDay = WEEK_DAYS[new Date(year, month - 1, day).getDay()];

  // 黄历（官方）
  const almanac = getAlmanac(lunar);

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
    festival,
    weekDay,
    almanac,
    dateString: `${lunarYear}年${monthName}${dayName}`,
    fullDateString: `农历${ganZhiYear}年 ${monthName}${dayName}（${ganZhiDay}日）`,
  };
}

/* ==================== 三、黄历（官方） ==================== */

/**
 * 获取黄历信息（官方库计算：值星/建除、二十八宿、宜忌）
 * @param {object} lunar - lunar-javascript 的 Lunar 对象
 */
function getAlmanac(lunar) {
  // 建除十二神（官方称之为"值星"）：建除满平定执破危成收开闭
  const jianChu = lunar.getZhiXing ? lunar.getZhiXing() : '—';
  // 二十八宿
  const xiu = lunar.getXiu ? lunar.getXiu() : '—';
  const xiuLuck = lunar.getXiuLuck ? lunar.getXiuLuck() : '平';
  // 宜忌（官方完整列表，按配置截取条数）
  const style = typeof CONFIG !== 'undefined' ? CONFIG.almanacStyle : 'standard';
  const maxItems = style === 'detailed' ? 6 : style === 'standard' ? 4 : 2;
  const yi = (lunar.getDayYi && lunar.getDayYi() || []).slice(0, maxItems);
  const ji = (lunar.getDayJi && lunar.getDayJi() || []).slice(0, maxItems);

  return {
    jianChu,
    xiu,
    xiuLuck,
    yi,
    ji,
    ganZhi: lunar.getDayInGanZhi(),
    luck: xiuLuck,
  };
}

/* ==================== 四、工具函数 ==================== */

/**
 * 获取今日完整信息（供 render 使用）
 */
function getTodayInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const lunar = getLunarDate(year, month, day);
  const weekDay = WEEK_DAYS[now.getDay()];

  return {
    solarYear: year,
    solarMonth: month,
    solarDay: day,
    weekDay,
    date: now,
    dateStr: `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`,
    ...lunar,
  };
}

/**
 * 根据日期字符串获取信息（'YYYY-MM-DD'）
 */
function getDateInfo(dateStr) {
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
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
    ...lunar,
  };
}