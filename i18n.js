/**
 * ============================================================
 *  i18n.js — 语言模块（中文 / 英语）
 *  - LOCALE:        当前语言（默认 zh）
 *  - t(s):          翻译字符串，回退到原文
 *  - tCatName(id):  默认分类的本地化名称
 *  - fmtDate():     公历日期本地化格式
 *  - fmtMonth():    月份标题本地化格式
 *  - tHoliday():    德国假期名称本地化
 *  - toggleLang():  切换语言并持久化
 * ============================================================
 */

const LANG_KEY = 'daily_checkin_lang';
let LOCALE = 'zh';
try { LOCALE = localStorage.getItem(LANG_KEY) || 'zh'; } catch (e) {}

// ─── 德语假期名称翻译（键 = 中文原名） ──────────────────────
const HOLIDAY_EN = {
  '元旦':              'New Year\'s Day',
  '劳动节':            'Labour Day',
  '德国统一日':        'German Unity Day',
  '圣诞节':            'Christmas Day',
  '圣诞节次日':        '2nd Christmas Day',
  '三王节':            'Epiphany',
  '万圣节':            'All Saints\' Day',
  '耶稣受难日':        'Good Friday',
  '复活节周一':        'Easter Monday',
  '耶稣升天节':        'Ascension Day',
  '圣灵降临节周一':    'Whit Monday',
  '圣体节':            'Corpus Christi',
};

// ─── 公历补充节日翻译（键 = 中文原名） ──────────────────────
const FESTIVAL_EN = {
  '情人节': 'Valentine\'s Day',
  '妇女节': 'International Women\'s Day',
  '植树节': 'Arbor Day',
  '愚人节': 'April Fools\' Day',
  '青年节': 'Youth Day',
  '儿童节': 'Children\'s Day',
  '建党节': 'Founding Day',
  '建军节': 'Armed Forces Day',
  '教师节': 'Teachers\' Day',
  '平安夜': 'Christmas Eve',
};

const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ─── UI 字符串翻译字典（键 = 中文原文，值 = 英文翻译） ──────
// 覆盖 index.html 静态文本 + render.js 动态文本
const STRINGS = {
  // ── index.html 静态 ──
  '每日打卡':           'Daily Check-in',
  '日省吾身':           'Daily Reflection',
  '今日功课':           'Today\'s Tasks',
  '📌 存为默认':        '📌 Set as Default',
  '🔄 重置今日':        '🔄 Reset Today',
  '📊 月统计':          '📊 Monthly Stats',
  '📤 导出数据':        '📤 Export Data',
  '📥 导入数据':        '📥 Import Data',
  '今天':               'Today',
  '取消':               'Cancel',
  '确定':               'Confirm',
  '确认':               'Confirm',
  '确定要执行此操作吗？': 'Are you sure you want to proceed?',

  // ── 日期导航 ──
  '计划中':             'Planned',
  '历史':               'History',
  '选择日期':           'Select Date',

  // ── 头部 ──
  '节气：':             'Term: ',

  // ── 打卡区 ──
  '该日期还没有打卡记录': 'No check-in records for this date',
  '还没有分类，点下方"添加新组"开始吧': 'No categories yet. Tap "Add Group" below to get started',
  '编辑/隐藏':          'Edit / Hide',
  '删除':               'Delete',
  '添加新组':           'Add Group',

  // ── 进度条 ──
  '今日进度':           'Today\'s Progress',
  '该日进度':           'This Day\'s Progress',

  // ── 统计 ──
  '打卡天数':           'Days Checked In',
  '今日完成率':         'Today\'s Rate',
  '连续天数':           'Streak',
  '平均完成率':         'Avg. Completion',
  '当前连续':           'Current Streak',
  '最长连续':           'Longest Streak',
  '暂无数据':           'No Data',

  // ── 月统计 ──
  '未来':               'Future',
  '完成':               'Done',
  '📋 返回打卡':        '📋 Back to Check-in',

  // ── 组管理 ──
  '添加新组':           'Add Group',
  '组名称（必填，最多8字）': 'Group name (required, max 8 chars)',
  '图标 emoji（可选，如 📚）': 'Icon emoji (optional, e.g. 📚)',
  '✅ 已添加':          '✅ Added',
  '添加失败':           'Add Failed',
  '请填写组名称':       'Please enter a group name',
  '已创建，快添加你的计划吧！': 'has been created. Add your plans!',
  '⚠️ 此组当前已隐藏':  '⚠️ This group is currently hidden',
  '修改失败':           'Update Failed',
  '组名称不能为空':     'Group name cannot be empty',
  '✅ 已修改':          '✅ Updated',
  '已更新。':           'updated.',
  '管理组':             'Manage Groups',
  '暂无分类':           'No categories',
  '👁 恢复':            '👁 Show',
  '🙈 隐藏':            '🙈 Hide',

  // ── 操作弹窗 ──
  '提示':               'Notice',
  '请先回到今天再重置。': 'Please go back to today before resetting.',
  '请回到今天再保存默认值。': 'Please go back to today before saving defaults.',
  '确认重置':           'Confirm Reset',
  '今日所有打卡内容将被清空，确定吗？': 'All check-in items for today will be cleared. Continue?',
  '保存为默认值':       'Save as Default',
  '将今天的打卡条目保存为每日默认值？': 'Save today\'s check-in items as daily defaults?',
  '以后每天打开、重置时，会自动使用这些条目。': 'They will be used automatically when opening or resetting on future days.',
  '✅ 已保存默认值':     '✅ Defaults Saved',
  '已保存':             'Saved',
  '个组的每日默认条目。': ' groups\' daily default items.',
  '今天所有组的条目都是空的。': 'All groups have empty items today.',
  '已跳过空组，保留原有默认条目不变。': 'Empty groups skipped; existing defaults kept unchanged.',
  '另外已把未来':         'Also synced the next ',
  '天的计划同步为今天的样子（已打勾的不受影响）。': ' days to match today (checked items kept).',
  '以后新建的日期会自动带上这些条目。': 'Future dates will automatically include these items.',
  '保存失败':             'Save Failed',
  '请先添加一些打卡条目。': 'Please add some check-in items first.',
  '导入成功':             'Import Successful',
  '数据已导入。':         'Data imported.',
  '导入失败':             'Import Failed',

  // ── 导出文件名 ──
  '打卡数据':           'checkin_data',

  // ── 日历星期 ──
  '一': 'Mon', '二': 'Tue', '三': 'Wed', '四': 'Thu', '五': 'Fri', '六': 'Sat', '日': 'Sun',
};

// ─── 翻译主函数 ─────────────────────────────────────────────
function t(s) {
  if (typeof s !== 'string' || s === '') return s;
  if (LOCALE === 'en' && STRINGS[s]) return STRINGS[s];
  return s;
}

// ─── 默认分类本地化名称 ─────────────────────────────────────
// key = 中文原名，value = { zh, en }
const CAT_NAMES = {
  '健康': { zh: '健康',   en: 'Health' },
  '工作': { zh: '工作',   en: 'Study' },
  '家庭': { zh: '家庭',   en: 'Other' },
};

function tCatName(id) {
  const cn = { health: '健康', work: '工作', family: '家庭' }[id] || id;
  if (CAT_NAMES[cn]) return CAT_NAMES[cn][LOCALE] || cn;
  return cn;
}

// ─── 日期格式 ───────────────────────────────────────────────
function fmtDateStr(y, m, d) {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return LOCALE === 'en' ? y + '-' + mm + '-' + dd : y + '年' + mm + '月' + dd + '日';
}

function fmtMonth(y, m) {
  return LOCALE === 'en' ? (MONTHS_EN[m] || '') + ' ' + y : y + '年 ' + m + '月';
}

function fmtWeekDay(dayIdx) {
  const zh = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return LOCALE === 'en' ? zh[dayIdx] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIdx];
}

// ─── 假期 / 节日翻译 ────────────────────────────────────────
function tHoliday(name) {
  if (LOCALE !== 'en') return name;
  return HOLIDAY_EN[name] || name;
}

function tFestival(name) {
  if (LOCALE !== 'en') return name;
  return FESTIVAL_EN[name] || name;
}

// ─── 语言切换 ───────────────────────────────────────────────
function toggleLang() {
  LOCALE = LOCALE === 'zh' ? 'en' : 'zh';
  try { localStorage.setItem(LANG_KEY, LOCALE); } catch (e) {}
  return LOCALE;
}

function getLocale() { return LOCALE; }

// ─── 静态 DOM 翻译 ─────────────────────────────────────────
// 扫描所有 [data-i18n] 元素，按当前语言设置 textContent。
// key = data-i18n 属性值（中文原文）；缺失 key 时保留原文。
// 注意：含 emoji 的按钮把 emoji 和文字分开包裹（见 index.html），
// 这样 applyI18n 只改文字部分，emoji 不受影响。
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });
}
