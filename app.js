/**
 * ============================================================
 *  app.js — 打卡业务逻辑模块
 *  每个分类下有多个条目（items），每个条目可单独打勾
 * ============================================================
 */

class CheckinApp {
  constructor() {
    this.storageKey = CONFIG.storageKey;
    this.categories = CONFIG.categories;
    this.data = this._load();
  }

  /* ==================== 数据加载与保存 ==================== */

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.days) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('数据加载失败，重新初始化:', e);
    }
    return this._initData();
  }

  _initData() {
    // defaults: 用户自定义的每日默认条目（未设置时为 null，用 config 里的）
    return { version: 3, created: new Date().toISOString(), defaults: null, days: {} };
  }

  /**
   * 获取某分类的默认条目（优先用户自定义，否则用 config）
   */
  _getCategoryDefaults(catId) {
    if (this.data.defaults && this.data.defaults[catId] && this.data.defaults[catId].length > 0) {
      return this.data.defaults[catId];
    }
    const cat = this.categories.find(c => c.id === catId);
    return (cat && cat.defaults) || [];
  }

  _emptyDay() {
    const categories = {};
    this.categories.forEach(cat => {
      categories[cat.id] = {
        items: this._getCategoryDefaults(cat.id).map((text, i) => ({
          id: 'dft_' + i,
          text,
          done: false,
        })),
      };
    });
    return { categories };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error('保存失败:', e);
    }
  }

  /* ==================== 每日数据管理 ==================== */

  getDay(dateKey) {
    const key = dateKey || this._todayKey();
    if (!this.data.days[key]) {
      this.data.days[key] = this._emptyDay();
      this.save();
    }
    // 兼容旧数据格式
    const day = this.data.days[key];
    this._migrateDay(day);
    return this._computeDayStats(key, day);
  }

  getToday() {
    return this.getDay(this._todayKey());
  }

  // 兼容旧数据：确保每个分类有 items 数组，并按最新默认值同步
  _migrateDay(day) {
    if (!day.categories) {
      day.categories = {};
      this.categories.forEach(cat => {
        day.categories[cat.id] = {
          items: this._getCategoryDefaults(cat.id).map((text, i) => ({
            id: 'dft_' + i,
            text,
            done: false,
          })),
        };
      });
    } else {
      this.categories.forEach(cat => {
        if (!day.categories[cat.id]) {
          day.categories[cat.id] = { items: [] };
        }
        const catData = day.categories[cat.id];
        if (!catData.items) {
          catData.items = [];
        }
        // 如果分类没有任何条目，用当前默认值填充（优先用户自定义）
        const defaults = this._getCategoryDefaults(cat.id);
        if (catData.items.length === 0 && defaults.length > 0) {
          catData.items = defaults.map((text, i) => ({
            id: 'dft_' + i,
            text,
            done: false,
          }));
        }
      });
    }
  }

  _computeDayStats(key, day) {
    const cats = this.categories.map(cat => {
      const catData = day.categories[cat.id] || { items: [] };
      const items = catData.items || [];
      const done = items.filter(i => i.done).length;
      return {
        ...cat,
        items,
        completed: done,
        total: items.length,
        progress: items.length > 0 ? Math.round(done / items.length * 100) : 0,
      };
    });
    const totalItems = cats.reduce((s, c) => s + c.total, 0);
    const totalDone = cats.reduce((s, c) => s + c.completed, 0);
    return {
      key,
      categories: cats,
      totalItems,
      totalDone,
      progress: totalItems > 0 ? Math.round(totalDone / totalItems * 100) : 0,
    };
  }

  /* ==================== 条目操作 ==================== */

  addItem(categoryId, text, dateKey) {
    const key = dateKey || this._todayKey();
    text = text.trim();
    if (!text) return null;
    this.getDay(key); // 确保数据存在
    const items = this.data.days[key].categories[categoryId].items;
    const newItem = { id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), text, done: false };
    items.push(newItem);
    this.save();
    return newItem;
  }

  toggleItem(categoryId, itemId, dateKey) {
    const key = dateKey || this._todayKey();
    const day = this.data.days[key];
    if (!day) return null;
    const items = day.categories[categoryId]?.items;
    if (!items) return null;
    const item = items.find(i => i.id === itemId);
    if (!item) return null;
    item.done = !item.done;
    this.save();
    return this.getDay(key);
  }

  removeItem(categoryId, itemId, dateKey) {
    const key = dateKey || this._todayKey();
    const day = this.data.days[key];
    if (!day) return false;
    const items = day.categories[categoryId]?.items;
    if (!items) return false;
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    items.splice(idx, 1);
    this.save();
    return true;
  }

  editItem(categoryId, itemId, newText, dateKey) {
    const key = dateKey || this._todayKey();
    const day = this.data.days[key];
    if (!day) return false;
    const items = day.categories[categoryId]?.items;
    if (!items) return false;
    const item = items.find(i => i.id === itemId);
    if (!item) return false;
    item.text = newText.trim();
    this.save();
    return true;
  }

  /* ==================== 重置与默认值 ==================== */

  resetToday() {
    const key = this._todayKey();
    this.data.days[key] = this._emptyDay();
    this.save();
    return this.getDay(key);
  }

  /**
   * 把某天的打卡条目保存为每日默认值
   * @param {string} dateKey - 日期，默认今天
   * @returns {{success: boolean, defaults?: object}}
   */
  saveCurrentAsDefaults(dateKey) {
    const key = dateKey || this._todayKey();
    const day = this.data.days[key];
    if (!day || !day.categories) return { success: false, error: '没有找到当天的数据' };

    const defaults = {};
    this.categories.forEach(cat => {
      const items = (day.categories[cat.id] && day.categories[cat.id].items) || [];
      // 只保存有条目的文本（去掉空白条目）
      defaults[cat.id] = items.map(i => i.text).filter(t => t && t.trim());
    });

    this.data.defaults = defaults;
    this.save();
    return { success: true, defaults };
  }

  /**
   * 获取当前生效的默认条目（用户自定义优先）
   */
  getDefaultItems() {
    const result = {};
    this.categories.forEach(cat => {
      result[cat.id] = this._getCategoryDefaults(cat.id);
    });
    return result;
  }

  /* ==================== 历史与统计 ==================== */

  getHistoryDates() {
    return Object.keys(this.data.days).sort();
  }

  getHistory(dateKey) {
    return this.getDay(dateKey);
  }

  getStreak() {
    let streak = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = this._formatDateKey(d);
      const day = this.data.days[key];
      if (!day) break;
      // 检查是否有任何条目有内容（填了就算打卡）
      let hasContent = false;
      if (day.categories) {
        for (const catId of Object.keys(day.categories)) {
          const items = day.categories[catId].items || [];
          if (items.length > 0) { hasContent = true; break; }
        }
      }
      if (!hasContent) break;
      streak++;
    }
    return streak;
  }

  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !parsed.days) return { success: false, error: '数据格式无效' };
      this.data = parsed;
      this.save();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'JSON 解析失败: ' + e.message };
    }
  }

  getStats() {
    const allDays = Object.keys(this.data.days);
    const totalDays = allDays.length;
    let totalItems = 0, totalDone = 0;

    for (const key of allDays) {
      const day = this.data.days[key];
      if (day.categories) {
        for (const catId of Object.keys(day.categories)) {
          const items = day.categories[catId].items || [];
          totalItems += items.length;
          totalDone += items.filter(i => i.done).length;
        }
      }
    }

    return {
      totalDays,
      totalItems,
      totalDone,
      completionRate: totalItems > 0 ? Math.round(totalDone / totalItems * 100) : 0,
      streak: this.getStreak(),
    };
  }

  /* ==================== 内部工具 ==================== */

  _todayKey() {
    return this._formatDateKey(new Date());
  }

  _formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

const checkinApp = new CheckinApp();