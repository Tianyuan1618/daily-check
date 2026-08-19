/**
 * ============================================================
 *  render.js — DOM 渲染模块
 *  支持：日期切换（查看历史/未来）、节气节日假期显示、组管理
 * ============================================================
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const Renderer = {

  currentDateKey: null, // 当前查看的日期；null = 今天

  init() {
    this._bindEvents();
    this.render();
  },

  _todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _isToday() {
    return (this.currentDateKey || this._todayKey()) === this._todayKey();
  },

  render() {
    const dateKey = this.currentDateKey || this._todayKey();
    const info = getDateInfo(dateKey);
    if (!info) return;

    this._renderDateNav(info);
    this._renderHeader(info);

    if (this._isToday()) {
      const dayData = checkinApp.getDay(dateKey);
      this._renderCategories(dayData, true);
      this._renderProgress(dayData);
    } else {
      const dayData = checkinApp.getDayReadOnly(dateKey);
      this._renderCategories(dayData, false);
      this._renderProgress(dayData);
    }
    this._renderStats();
  },

  /* ==================== 日期导航 ==================== */

  _renderDateNav(info) {
    const nav = $('#date-nav');
    if (!nav) return;
    const isToday = this._isToday();
    nav.innerHTML = `
      <button class="nav-btn" id="prev-day">‹</button>
      <div class="nav-date">
        <span class="nav-date-main">${info.dateStr}</span>
        <span class="nav-date-week">${info.weekDay}</span>
        ${isToday ? '<span class="nav-badge">今天</span>' : '<span class="nav-badge ' + (info.solarDay > new Date().getDate() ? 'future' : 'past') + '">' + (info.solarDay > new Date().getDate() ? '未来' : '历史') + '</span>'}
      </div>
      <button class="nav-btn" id="next-day">›</button>
      ${isToday ? '' : '<button class="nav-today-btn" id="go-today-btn">📅 今天</button>'}
    `;
    const prev = $('#prev-day');
    const next = $('#next-day');
    const goToday = $('#go-today-btn');
    if (prev) prev.addEventListener('click', () => this._shiftDate(-1));
    if (next) next.addEventListener('click', () => this._shiftDate(1));
    if (goToday) goToday.addEventListener('click', () => { this.currentDateKey = null; this.render(); });
  },

  _shiftDate(delta) {
    const base = this.currentDateKey || this._todayKey();
    const d = new Date(base + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    this.currentDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.render();
  },

  /* ==================== 头部（日期+农历+节气节日假期） ==================== */

  _renderHeader(info) {
    const header = $('#header');
    if (!header) return;

    const jieQiHtml = info.jieQi ? `<div class="head-tag jieqi">🍂 节气：${info.jieQi}</div>` : '';
    const festivalHtml = (info.festivals && info.festivals.length > 0)
      ? `<div class="head-tag festival">🎉 ${info.festivals.join('、')}</div>` : '';
    const deHtml = (info.germanHolidays && info.germanHolidays.length > 0)
      ? `<div class="head-tag de">🇩🇪 ${info.germanHolidays.map(h => h.name + (h.note ? '(' + h.note + ')' : '')).join('、')}</div>` : '';

    header.innerHTML = `
      <div class="date-card">
        <div class="solar-date">${info.dateStr}</div>
        <div class="week-day">${info.weekDay}</div>
        <div class="divider"></div>
        <div class="lunar-date">
          <span class="gan-zhi">${info.ganZhiYear}</span> 年 · ${info.shengXiao}年 · ${info.monthName}${info.dayName}
        </div>
        <div class="lunar-date sub">${info.ganZhiDay}日</div>
        <div class="head-tags">
          ${jieQiHtml}${festivalHtml}${deHtml}
        </div>
      </div>
    `;
  },

  /* ==================== 打卡区 ==================== */

  _renderCategories(dayData, editable) {
    const container = $('#checklist');
    if (!container) return;

    if (!dayData || !dayData.categories) {
      container.innerHTML = '<div class="empty-tip">该日期还没有打卡记录</div>';
      return;
    }

    const cats = dayData.categories;
    if (cats.length === 0) {
      container.innerHTML = '<div class="empty-tip">还没有分类，点下方"添加新组"开始吧</div>';
      return;
    }

    container.innerHTML = cats.map(cat => `
      <div class="category-card" data-category="${cat.id}">
        <div class="category-header">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-name">${this._escapeHtml(cat.name)}</span>
          ${editable ? '<button class="cat-edit-btn" data-action="edit-cat" title="编辑/隐藏">✏️</button>' : ''}
          <span class="cat-count">${cat.completed}/${cat.total}</span>
        </div>
        <div class="item-list">
          ${cat.items.map(item => `
            <div class="item-row" data-category="${cat.id}" data-item-id="${item.id}">
              ${editable
                ? `<div class="item-checkbox ${item.done ? 'checked' : ''}" data-action="toggle"></div>`
                : `<div class="item-checkbox-static ${item.done ? 'checked' : ''}"></div>`}
              <span class="item-text ${item.done ? 'done' : ''}">${this._escapeHtml(item.text)}</span>
              ${editable ? '<button class="item-del" data-action="delete" title="删除">✕</button>' : ''}
            </div>
          `).join('')}
        </div>
        ${editable ? `
          <div class="add-item-row">
            <input type="text" class="add-item-input" data-category="${cat.id}" placeholder="添加 ${this._escapeHtml(cat.name)} 计划…" autocomplete="off">
            <button class="add-item-btn" data-category="${cat.id}">+</button>
          </div>` : ''}
      </div>
    `).join('')
    + (editable ? '<div class="add-category-row"><button id="add-cat-btn" class="add-cat-btn">＋ 添加新组</button></div>' : '');
  },

  _renderProgress(dayData) {
    const container = $('#progress-section');
    if (!container) return;
    if (!dayData) {
      container.innerHTML = '<div class="progress-header">今日进度</div>';
      return;
    }
    container.innerHTML = `
      <div class="progress-header">
        <span>${this._isToday() ? '今日进度' : '该日进度'}</span>
        <span>${dayData.totalDone} / ${dayData.totalItems} · ${dayData.progress}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${dayData.progress}%"></div>
      </div>
    `;
  },

  _renderStats() {
    const container = $('#stats-section');
    if (!container) return;
    const stats = checkinApp.getStats();
    const today = checkinApp.getToday();
    container.innerHTML = `
      <div class="stat-item">
        <div class="stat-number">${stats.totalDays}</div>
        <div class="stat-label">打卡天数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${today.progress}%</div>
        <div class="stat-label">今日完成率</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${stats.streak}</div>
        <div class="stat-label">连续天数</div>
      </div>
    `;
    const footer = $('.footer');
    if (footer) footer.textContent = CONFIG.app.footer;
  },

  /* ==================== 事件绑定 ==================== */

  _bindEvents() {
    const list = $('#checklist');
    if (!list) return;

    // checkbox 点击
    list.addEventListener('click', (e) => {
      // 编辑分类（✏️）
      const editCat = e.target.closest('[data-action="edit-cat"]');
      if (editCat) {
        const catId = editCat.closest('.category-card').dataset.category;
        this._handleEditCategory(catId);
        return;
      }

      // 添加新组
      if (e.target.closest('#add-cat-btn')) {
        this._handleAddCategory();
        return;
      }

      // 下面的操作只在"今天"有效
      if (!this._isToday()) return;

      const checkbox = e.target.closest('.item-checkbox');
      if (checkbox) {
        const row = checkbox.closest('.item-row');
        const catId = row.dataset.category;
        const itemId = row.dataset.itemId;
        checkinApp.toggleItem(catId, itemId);
        this.render();
        return;
      }

      // 删除按钮
      const delBtn = e.target.closest('.item-del');
      if (delBtn) {
        const row = delBtn.closest('.item-row');
        const catId = row.dataset.category;
        const itemId = row.dataset.itemId;
        checkinApp.removeItem(catId, itemId);
        this.render();
        return;
      }

      // 添加按钮
      const addBtn = e.target.closest('.add-item-btn');
      if (addBtn) {
        const catId = addBtn.dataset.category;
        const input = list.querySelector(`.add-item-input[data-category="${catId}"]`);
        if (input && input.value.trim()) {
          checkinApp.addItem(catId, input.value.trim());
          input.value = '';
          this.render();
        }
        return;
      }
    });

    // 回车添加
    list.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this._isToday()) {
        const input = e.target.closest('.add-item-input');
        if (input && input.value.trim()) {
          const catId = input.dataset.category;
          checkinApp.addItem(catId, input.value.trim());
          input.value = '';
          this.render();
        }
      }
    });

    // 键盘左右键切日期（不在输入框时）
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') this._shiftDate(-1);
      if (e.key === 'ArrowRight') this._shiftDate(1);
    });

    // 重置
    const resetBtn = $('#reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', () => this._handleReset());

    // 导出
    const exportBtn = $('#export-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => this._handleExport());

    // 导入
    const importBtn = $('#import-btn');
    if (importBtn) importBtn.addEventListener('click', () => this._handleImport());

    // 保存为默认值按钮
    const saveDefaultsBtn = $('#save-defaults-btn');
    if (saveDefaultsBtn) saveDefaultsBtn.addEventListener('click', () => this._handleSaveDefaults());

    // 管理组按钮
    const manageBtn = $('#manage-btn');
    if (manageBtn) manageBtn.addEventListener('click', () => this._handleManageCategories());
  },

  /* ==================== 组管理 ==================== */

  _handleAddCategory() {
    this._showModal(
      '添加新组',
      '<input type="text" id="cat-name-input" class="modal-input" placeholder="组名称（必填，最多8字）" maxlength="8" autocomplete="off">' +
      '<input type="text" id="cat-icon-input" class="modal-input" placeholder="图标 emoji（可选，如 📚）" maxlength="4" autocomplete="off">',
      () => {
        const name = $('#cat-name-input') ? $('#cat-name-input').value.trim() : '';
        const icon = $('#cat-icon-input') ? $('#cat-icon-input').value.trim() : '';
        // emoji 校验（允许空白时给默认图标）
        const result = checkinApp.addCategory(name, icon);
        if (result.success) {
          this.render();
          this._showModal('✅ 已添加', `新组「${name}」已创建，快添加你的计划吧！`);
        } else {
          this._showModal('添加失败', result.error || '请填写组名称');
        }
      }
    );
    // 聚焦名称输入框
    setTimeout(() => { const n = $('#cat-name-input'); if (n) n.focus(); }, 100);
  },

  _handleEditCategory(catId) {
    // 获取当前分类信息
    const allCats = checkinApp._getAllCategories();
    const cat = allCats.find(c => c.id === catId);
    if (!cat) return;
    this._showModal(
      `编辑「${cat.name}」`,
      `<input type="text" id="cat-name-input" class="modal-input" value="${this._escapeHtml(cat.name)}" maxlength="8" autocomplete="off">` +
      `<input type="text" id="cat-icon-input" class="modal-input" value="${this._escapeHtml(cat.icon)}" maxlength="4" autocomplete="off">` +
      `<div class="modal-hint">${cat.hidden ? '⚠️ 此组当前已隐藏' : ''}</div>`,
      () => {
        const name = $('#cat-name-input') ? $('#cat-name-input').value.trim() : '';
        const icon = $('#cat-icon-input') ? $('#cat-icon-input').value.trim() : '';
        if (!name) { this._showModal('修改失败', '组名称不能为空'); return; }
        checkinApp.updateCategoryMeta(catId, { name, icon });
        this.render();
        this._showModal('✅ 已修改', `「${name}」已更新。`);
      }
    );
  },

  _handleManageCategories() {
    const allCats = checkinApp._getAllCategories();
    const rows = allCats.map(cat => `
      <div class="mgmt-row" data-cat-id="${cat.id}" data-cat-hidden="${cat.hidden}">
        <span class="mgmt-icon">${cat.icon}</span>
        <span class="mgmt-name ${cat.hidden ? 'mgmt-hidden' : ''}">${this._escapeHtml(cat.name)}</span>
        <button class="mgmt-btn edit" data-action="edit">✏️</button>
        <button class="mgmt-btn ${cat.hidden ? 'show' : 'hide'}" data-action="toggle">${cat.hidden ? '👁 恢复' : '🙈 隐藏'}</button>
      </div>
    `).join('');

    this._showModal(
      '管理组',
      `<div class="mgmt-list">${rows || '<div class="modal-hint">暂无分类</div>'}</div>`,
      null,
      {
        // 弹窗内部按钮事件（事件委托）
        bind: (overlay) => {
          const listEl = overlay.querySelector('.mgmt-list');
          if (!listEl) return;
          listEl.addEventListener('click', (e) => {
            const row = e.target.closest('.mgmt-row');
            if (!row) return;
            const catId = row.dataset.catId;
            const action = e.target.closest('[data-action]');
            if (!action) return;
            const act = action.dataset.action;
            overlay.classList.remove('show');
            if (act === 'edit') { this._handleEditCategory(catId); }
            else if (act === 'toggle') {
              checkinApp.toggleCategoryHidden(catId);
              this.render();
              this._handleManageCategories(); // 刷新弹窗
            }
          });
        }
      }
    );
  },

  /* ==================== 其他操作 ==================== */

  _handleReset() {
    if (!this._isToday()) { this._showModal('提示', '请先回到今天再重置。'); return; }
    this._showModal('确认重置', '今日所有打卡内容将被清空，确定吗？', () => {
      checkinApp.resetToday();
      this.render();
    });
  },

  _handleExport() {
    const data = checkinApp.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `打卡数据_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  _handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = checkinApp.importData(ev.target.result);
        if (result.success) { this.render(); this._showModal('导入成功', '数据已导入。'); }
        else { this._showModal('导入失败', result.error); }
      };
      reader.readAsText(file);
    });
    input.click();
  },

  _handleSaveDefaults() {
    if (!this._isToday()) { this._showModal('提示', '请回到今天再保存默认值。'); return; }
    this._showModal(
      '保存为默认值',
      '将今天的打卡条目保存为每日默认值？\n\n以后每天打开、重置时，会自动使用这些条目。',
      () => {
        const result = checkinApp.saveCurrentAsDefaults();
        if (result.success) {
          this._showModal('✅ 已保存默认值', '每日默认值已更新。\n\n明天开始，打卡会自动带上这些条目。');
        } else {
          this._showModal('保存失败', result.error || '请先添加一些打卡条目。');
        }
      }
    );
  },

  /* ==================== 弹窗 ==================== */

  /**
   * 通用弹窗。content 为 HTML，onConfirm 可选；opts.bind 可在弹窗打开后绑定内部事件
   */
  _showModal(title, content, onConfirm, opts) {
    const overlay = $('#modal-overlay');
    if (!overlay) return;
    const titleEl = $('#modal-title');
    const textEl = $('#modal-text');
    const confirmBtn = $('#modal-confirm');
    const cancelBtn = $('#modal-cancel');
    titleEl.textContent = title;
    textEl.innerHTML = content.replace(/\n/g, '<br>');
    if (onConfirm) {
      confirmBtn.style.display = 'inline-block';
      confirmBtn.onclick = () => { overlay.classList.remove('show'); onConfirm(); };
    } else {
      confirmBtn.style.display = 'none';
    }
    cancelBtn.onclick = () => overlay.classList.remove('show');
    overlay.classList.add('show');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };
    if (opts && opts.bind) opts.bind(overlay);
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => { Renderer.init(); });