/**
 * ============================================================
 *  data.js — 农历 & 黄历算法模块
 *  纯算法，无外部依赖，不联网，离线可用
 *  
 *  职责：
 *  1. 公历 → 农历转换（1900-2100 年）
 *  2. 天干地支、生肖、节气
 *  3. 黄历宜忌（建除十二神 + 二十八宿）
 *  4. 星期计算
 * ============================================================
 */

/* ==================== 一、基础常量 ==================== */

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 生肖
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 农历月份名
const LUNAR_MONTHS = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

// 农历日名（1-10）
const LUNAR_DAYS_PREFIX = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十'];
// 农历日名（11-20）
const LUNAR_DAYS_MID = ['十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
// 农历日名（21-30）
const LUNAR_DAYS_SUFFIX = ['廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

// 星期
const WEEK_DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 传统节日（农历月日 → 名称）
const LUNAR_FESTIVALS = {
  '1-1':   '春节',
  '1-15':  '元宵节',
  '2-2':   '龙抬头',
  '3-3':   '上巳节',
  '5-5':   '端午节',
  '6-6':   '天贶节',
  '7-7':   '七夕节',
  '7-15':  '中元节',
  '8-15':  '中秋节',
  '9-9':   '重阳节',
  '10-1':  '寒衣节',
  '10-15': '下元节',
  '12-8':  '腊八节',
  '12-23': '小年',
  '12-30': '除夕',
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

/* ==================== 二、农历数据表 ==================== */

/**
 * 农历年数据表（1900-2100）
 * 每项编码（32位整数）：
 *   bits 0-3:  闰月月份（0=无闰月）
 *   bits 4-15: 12个月大小月（1=30天，0=29天），正月在最高位，腊月在最低位
 *   bits 16-19: 闰月天数（1=30天，0=29天）
 *   bits 20-31: 保留
 */
const LUNAR_YEARS = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a0e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520, // 2100
];

/* ==================== 三、农历核心算法 ==================== */

/**
 * 从数据表中提取某年的农历信息
 */
function _getLunarYearInfo(year) {
  const idx = year - 1900;
  if (idx < 0 || idx >= LUNAR_YEARS.length) return null;
  const code = LUNAR_YEARS[idx];
  return {
    leapMonth: code & 0xf,                     // 闰月月份（0=无闰月）
    leapDays: (code & 0x10000) ? 30 : 29,      // 闰月天数
    monthDays: _decodeMonthDays(code),           // 12个月天数
  };
}

/**
 * 解码月份天数（bits 4-15，12位，正月在 bit15，腊月在 bit4）
 */
function _decodeMonthDays(code) {
  const days = [];
  for (let m = 0; m < 12; m++) {
    days.push((code & (0x8000 >> m)) ? 30 : 29);
  }
  return days;
}

/**
 * 计算公历某年某月有多少天
 */
function _solarMonthDays(year, month) {
  // month 是 1-indexed
  const STANDARD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && _isLeapYear(year)) return 29;
  return STANDARD[month - 1];
}

function _isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * 公历 → 农历
 * @param {number} year  - 公历年份
 * @param {number} month - 公历月份（1-12）
 * @param {number} day   - 公历日（1-31）
 * @returns {object} { year, month, day, isLeap, festival, ganZhiYear, shengXiao, ... }
 */
function getLunarDate(year, month, day) {
  // 计算从 1900-01-31（农历 1900-01-01）到目标日期的天数
  const baseDate = new Date(1900, 0, 31); // 1900-01-31
  const targetDate = new Date(year, month - 1, day);
  let offset = Math.floor((targetDate - baseDate) / 86400000);

  if (offset < 0) return null; // 超出范围

  // 逐月累加找到农历年份
  let lunarYear = 1900;
  let yearInfo = _getLunarYearInfo(lunarYear);
  let yearDays = _getYearDays(yearInfo);

  while (offset >= yearDays) {
    offset -= yearDays;
    lunarYear++;
    yearInfo = _getLunarYearInfo(lunarYear);
    if (!yearInfo) return null;
    yearDays = _getYearDays(yearInfo);
  }

  // 逐月累加找到农历月份
  let lunarMonth = 1;
  let isLeap = false;
  const monthDaysList = [];

  // 先排正月到腊月，再排闰月（如果有）
  for (let m = 1; m <= 12; m++) {
    monthDaysList.push({ month: m, days: yearInfo.monthDays[m - 1], isLeap: false });
  }
  if (yearInfo.leapMonth > 0) {
    // 闰月插入在对应月份之后
    monthDaysList.splice(yearInfo.leapMonth, 0, {
      month: yearInfo.leapMonth,
      days: yearInfo.leapDays,
      isLeap: true,
    });
  }

  for (const mInfo of monthDaysList) {
    if (offset < mInfo.days) {
      lunarMonth = mInfo.month;
      isLeap = mInfo.isLeap;
      break;
    }
    offset -= mInfo.days;
    // 如果已经遍历完所有月份，取最后一个月
    if (monthDaysList.indexOf(mInfo) === monthDaysList.length - 1) {
      lunarMonth = mInfo.month;
      isLeap = mInfo.isLeap;
    }
  }

  const lunarDay = offset + 1;

  // 天干地支年
  const ganZhiIndex = (lunarYear - 4) % 60;
  const ganZhiYear = TIAN_GAN[ganZhiIndex % 10] + DI_ZHI[ganZhiIndex % 12];
  const shengXiao = SHENG_XIAO[(lunarYear - 4) % 12];

  // 农历月名
  const monthName = isLeap ? '闰' + LUNAR_MONTHS[lunarMonth - 1] : LUNAR_MONTHS[lunarMonth - 1];

  // 农历日名
  const dayName = _getLunarDayName(lunarDay);

  // 节日
  const festival = _getFestival(year, month, day, lunarMonth, lunarDay, isLeap);

  // 星期
  const weekDay = WEEK_DAYS[targetDate.getDay()];

  // 干支日
  const dayGanZhi = _getDayGanZhi(year, month, day);

  // 黄历
  const almanac = getAlmanac(lunarYear, lunarMonth, lunarDay, isLeap, dayGanZhi);

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeap,
    monthName,
    dayName,
    ganZhiYear,
    ganZhiDay: dayGanZhi.ganZhi,
    shengXiao,
    festival,
    weekDay,
    almanac,
    // 完整日期字符串
    dateString: `${lunarYear}年${monthName}${dayName}`,
    fullDateString: `农历${ganZhiYear}年 ${monthName}${dayName}（${dayGanZhi.ganZhi}日）`,
  };
}

function _getYearDays(yearInfo) {
  if (!yearInfo) return 0;
  let total = yearInfo.monthDays.reduce((a, b) => a + b, 0);
  if (yearInfo.leapMonth > 0) total += yearInfo.leapDays;
  return total;
}

function _getLunarDayName(day) {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  if (day <= 10) return LUNAR_DAYS_PREFIX[day - 1];
  if (day <= 20) return LUNAR_DAYS_MID[day - 11];
  return LUNAR_DAYS_SUFFIX[day - 21];
}

/**
 * 计算日干支（60天周期）
 * 基准：1900-01-01 = 甲戌日 → 周期索引 10
 */
function _getDayGanZhi(year, month, day) {
  const base = new Date(1900, 0, 1);
  const target = new Date(year, month - 1, day);
  const offset = Math.floor((target - base) / 86400000);
  const idx = ((offset + 10) % 60 + 60) % 60;
  return {
    ganZhi: TIAN_GAN[idx % 10] + DI_ZHI[idx % 12],
    tianGan: TIAN_GAN[idx % 10],
    diZhi: DI_ZHI[idx % 12],
    index: idx,
  };
}

/**
 * 获取节日
 */
function _getFestival(sYear, sMonth, sDay, lMonth, lDay, isLeap) {
  if (isLeap) return null;
  const lunarKey = lMonth + '-' + lDay;
  if (LUNAR_FESTIVALS[lunarKey]) return '🎉 ' + LUNAR_FESTIVALS[lunarKey];
  const solarKey = sMonth + '-' + sDay;
  if (SOLAR_FESTIVALS[solarKey]) return '🎉 ' + SOLAR_FESTIVALS[solarKey];
  return null;
}

/* ==================== 四、黄历（建除十二神 + 二十八宿） ==================== */

/**
 * 建除十二神名称
 * 顺序：建除满平定执破危成收开闭
 */
const JIAN_CHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];

/**
 * 建除十二神对应的宜忌
 */
const ALMANAC_YI_JI = {
  '建': {
    yi: ['建屋', '立柱', '起基', '开工', '创业'],
    ji: ['动土', '破土', '嫁娶', '出行'],
  },
  '除': {
    yi: ['扫除', '沐浴', '治病', '除服', '破屋', '求医'],
    ji: ['嫁娶', '开市', '入宅', '出行'],
  },
  '满': {
    yi: ['进货', '置产', '开市', '交易', '纳财', '祈福'],
    ji: ['诉讼', '动土', '嫁娶', '出行'],
  },
  '平': {
    yi: ['修路', '平基', '工作', '学习', '祭祀'],
    ji: ['开市', '入宅', '嫁娶', '远行'],
  },
  '定': {
    yi: ['定盟', '订婚', '签约', '交易', '祭祀', '祈福'],
    ji: ['出行', '诉讼', '开市', '动土'],
  },
  '执': {
    yi: ['执持', '捕捉', '诉讼', '追债', '收账'],
    ji: ['嫁娶', '出行', '开市', '入宅'],
  },
  '破': {
    yi: ['破旧', '求医', '治病', '诉讼'],
    ji: ['大事勿用', '嫁娶', '出行', '开市', '入宅', '动土'],
  },
  '危': {
    yi: ['谨慎', '安分', '守成', '静养'],
    ji: ['远行', '开市', '嫁娶', '冒险'],
  },
  '成': {
    yi: ['婚嫁', '开业', '入宅', '签约', '交易', '祈福'],
    ji: ['诉讼', '动土', '破土'],
  },
  '收': {
    yi: ['收获', '纳财', '收账', '收藏', '完成'],
    ji: ['出行', '开市', '嫁娶', '动土'],
  },
  '开': {
    yi: ['开市', '开业', '出行', '嫁娶', '入宅', '开工'],
    ji: ['安葬', '破土', '诉讼'],
  },
  '闭': {
    yi: ['埋葬', '建墓', '封顶', '闭藏'],
    ji: ['开市', '出行', '嫁娶', '开业'],
  },
};

/**
 * 二十八宿（每宿对应一个地支）
 * 顺序：角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸
 */
const XIU_28 = [
  '角宿', '亢宿', '氐宿', '房宿', '心宿', '尾宿', '箕宿',
  '斗宿', '牛宿', '女宿', '虚宿', '危宿', '室宿', '壁宿',
  '奎宿', '娄宿', '胃宿', '昴宿', '毕宿', '觜宿', '参宿',
  '井宿', '鬼宿', '柳宿', '星宿', '张宿', '翼宿', '轸宿',
];

/**
 * 二十八宿的吉凶属性
 */
const XIU_LUCK = {
  '角宿': '吉', '亢宿': '凶', '氐宿': '吉', '房宿': '吉', '心宿': '凶', '尾宿': '吉', '箕宿': '吉',
  '斗宿': '吉', '牛宿': '凶', '女宿': '凶', '虚宿': '凶', '危宿': '凶', '室宿': '吉', '壁宿': '吉',
  '奎宿': '凶', '娄宿': '吉', '胃宿': '吉', '昴宿': '凶', '毕宿': '吉', '觜宿': '凶', '参宿': '吉',
  '井宿': '吉', '鬼宿': '凶', '柳宿': '凶', '星宿': '吉', '张宿': '吉', '翼宿': '凶', '轸宿': '吉',
};

/**
 * 获取黄历信息
 * @param {number} lunarYear  农历年
 * @param {number} lunarMonth 农历月（1-12）
 * @param {number} lunarDay   农历日（1-30）
 * @param {boolean} isLeap    是否闰月
 * @param {object} dayGanZhi  { ganZhi, tianGan, diZhi, index }
 * @returns {object} { jianChu, xiu, yi, ji, dayGanZhi, luck }
 */
function getAlmanac(lunarYear, lunarMonth, lunarDay, isLeap, dayGanZhi) {
  if (isLeap) {
    // 闰月无黄历
    return {
      jianChu: '—',
      xiu: '—',
      yi: ['诸事不宜'],
      ji: ['诸事不宜'],
      ganZhi: dayGanZhi.ganZhi,
      luck: '平',
    };
  }

  // 1. 建除十二神
  // 月地支：正月寅、二月卯、三月辰、四月巳、五月午、六月未、七月申、八月酉、九月戌、十月亥、十一月子、十二月丑
  const monthDiZhiIndex = (lunarMonth + 1) % 12; // 正月=寅(index 2), 二月=卯(index 3), ...
  // 日地支 index
  const dayDiZhiIndex = dayGanZhi.index % 12;
  // 建除索引 = (日地支 - 月地支 + 12) % 12
  const jianChuIndex = ((dayDiZhiIndex - monthDiZhiIndex + 12) % 12 + 12) % 12;
  const jianChu = JIAN_CHU[jianChuIndex];

  // 2. 二十八宿（基于日干支索引，28宿循环）
  // 起始映射：1900-01-01 的干支索引 10 → 对应的宿
  const xiuIndex = ((dayGanZhi.index + 18) % 28 + 28) % 28;
  const xiu = XIU_28[xiuIndex];
  const xiuLuck = XIU_LUCK[xiu];

  // 3. 宜忌
  const almanacData = ALMANAC_YI_JI[jianChu];
  const style = typeof CONFIG !== 'undefined' ? CONFIG.almanacStyle : 'standard';
  const maxItems = style === 'detailed' ? 6 : style === 'standard' ? 4 : 2;

  return {
    jianChu,
    xiu,
    xiuLuck,
    yi: almanacData.yi.slice(0, maxItems),
    ji: almanacData.ji.slice(0, maxItems),
    ganZhi: dayGanZhi.ganZhi,
    luck: xiuLuck,
  };
}

/* ==================== 五、星期 ==================== */

function getWeekDayName(date) {
  return WEEK_DAYS[date.getDay()];
}

/* ==================== 六、工具函数 ==================== */

/**
 * 获取今日完整信息（供 render 使用）
 */
function getTodayInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const lunar = getLunarDate(year, month, day);
  const weekDay = getWeekDayName(now);

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
 * 根据日期字符串获取信息
 */
function getDateInfo(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  const now = new Date(year, month - 1, day);
  const lunar = getLunarDate(year, month, day);
  const weekDay = getWeekDayName(now);

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