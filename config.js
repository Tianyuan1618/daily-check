/**
 * ============================================================
 *  config.js — 用户配置模块
 * ============================================================
 */

const CONFIG = {

  // ─── 每日打卡分类（每个分类下有多个条目） ────────────────
  categories: [
    {
      id: 'health',
      name: '健康',
      icon: '💪',
      defaults: ['运动 30 分钟']
    },
    {
      id: 'work',
      name: '工作',
      icon: '💼',
      defaults: []
    },
    {
      id: 'family',
      name: '家庭',
      icon: '🏠',
      defaults: ['陪伴孩子']
    },
  ],

  // ─── 年份范围 ─────────────────────────────────────────────
  yearRange: { start: 2025, end: 2075 },

  // ─── 黄历显示风格 ─────────────────────────────────────────
  almanacStyle: 'detailed',

  // ─── 主题配色 ─────────────────────────────────────────────
  theme: {
    primary: '#8B2500',
    secondary: '#D4A574',
    bg: '#F5F0E1',
    cardBg: '#FFFBF0',
    text: '#2C1810',
    textLight: '#8B7355',
    accent: '#C41E3A',
    gold: '#C9A96E',
    border: '#D4C5A9',
    done: '#A0A090',
    success: '#2E7D32',
    font: '"Noto Serif SC", "Source Han Serif SC", "SimSun", "STSong", serif',
  },

  // ─── 本地存储键名 ─────────────────────────────────────────
  storageKey: 'daily_checkin_data',

  // ─── 应用信息 ─────────────────────────────────────────────
  app: {
    name: '每日打卡',
    subtitle: '日省吾身',
    footer: '© 每日打卡 · 不积跬步，无以至千里',
  },

};