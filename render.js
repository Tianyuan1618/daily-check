/**
 * ============================================================
 *  render.js — DOM 渲染模块
 * ============================================================
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const Renderer = {

  init() {
    this._bindEvents();
    this.render();
  },

  render() {
    const todayInfo = getTodayInfo();
    const dayData = checkinApp.getToday();
    this._renderHeader(todayInfo);
    this._renderCategories(dayData);
    this._renderProgress(dayData);
    this._renderStats();
  },

  _renderHeader(info) {
    const header = $('#header');
    if (!header) return;
    const festivalHtml = info.festival ? `<div class="festival">${info.festival}</div>` : '';
    // 黄历
    const alma = info.almanac || { jianChu: '—', xiu: '—', yi: [], ji: [], luck: '平' };
    const yiTags = alma.yi.map(t => `<span class="almanac-tag yi">${t}</span>`).join('');
    const jiTags = alma.ji.map(t => `<span class="almanac-tag ji">${t}</span>`).join('');
    header.innerHTML = `
      <div class="date-card">
        <div class="solar-date">${info.dateStr}</div>
        <div class="week-day">${info.weekDay}</div>
        <div class="divider"></div>
        <div class="lunar-date">
          <span class="gan-zhi">${info.ganZhiYear}</span> 年 · ${info.shengXiao}年 · ${info.monthName}${info.dayName}
        </div>
        <div class="lunar-date" style="font-size:0.85rem;margin-top:2px;">${info.ganZhiDay}日</div>
        ${festivalHtml}
        <div class="almanac">
          <div class="almanac-col">
            <div class="almanac-label">建除</div>
            <div class="almanac-value">${alma.jianChu}</div>
          </div>
          <div class="almanac-col">
            <div class="almanac-label">星宿</div>
            <div class="almanac-value luck-${alma.xiuLuck}">${alma.xiu}</div>
            <div class="xiu-display">${alma.xiuLuck}</div>
          </div>
          <div class="almanac-col">
            <div class="almanac-label">宜</div>
            <div class="almanac-items">${yiTags || '<span class="almanac-tag">—</span>'}</div>
          </div>
          <div class="almanac-col">
            <div class="almanac-label">忌</div>
            <div class="almanac-items">${jiTags || '<span class="almanac-tag">—</span>'}</div>
          </div>
        </div>
      </div>
    `;
  },

  _renderCategories(dayData) {
    const container = $('#checklist');
    if (!container) return;

    if (!dayData || !dayData.categories) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--textLight);">暂无分类</div>';
      return;
    }

    container.innerHTML = dayData.categories.map(cat => `
      <div class="category-card" data-category="${cat.id}">
        <div class="category-header">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-name">${cat.name}</span>
          <span class="cat-count">${cat.completed}/${cat.total}</span>
        </div>
        <div class="item-list">
          ${cat.items.map(item => `
            <div class="item-row" data-category="${cat.id}" data-item-id="${item.id}">
              <div class="item-checkbox ${item.done ? 'checked' : ''}" data-action="toggle"></div>
              <span class="item-text ${item.done ? 'done' : ''}">${this._escapeHtml(item.text)}</span>
              <button class="item-del" data-action="delete" title="删除">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="add-item-row">
          <input type="text" class="add-item-input" data-category="${cat.id}" placeholder="添加 ${cat.name} 计划…" autocomplete="off">
          <button class="add-item-btn" data-category="${cat.id}">+</button>
        </div>
      </div>
    `).join('');
  },

  _renderProgress(dayData) {
    const container = $('#progress-section');
    if (!container) return;
    container.innerHTML = `
      <div class="progress-header">
        <span>今日进度</span>
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
    // 动态渲染页脚
    const footer = $('.footer');
    if (footer) footer.textContent = CONFIG.app.footer;
  },

  _bindEvents() {
    const list = $('#checklist');
    if (!list) return;

    // checkbox 点击
    list.addEventListener('click', (e) => {
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
      if (e.key === 'Enter') {
        const input = e.target.closest('.add-item-input');
        if (input && input.value.trim()) {
          const catId = input.dataset.category;
          checkinApp.addItem(catId, input.value.trim());
          input.value = '';
          this.render();
        }
      }
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

    // 保存图片
    const saveImgBtn = $('#save-img-btn');
    if (saveImgBtn) saveImgBtn.addEventListener('click', () => this._handleSaveImage());
  },

  _handleReset() {
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

  async _handleSaveImage() {
    const saveBtn = $('#save-img-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '⏳ 生成中…';
    saveBtn.disabled = true;
    try {
      if (typeof html2canvas === 'undefined') {
        this._showModal('保存失败', 'html2canvas 库未加载。');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        return;
      }
      const container = $('.container');
      if (!container) return;
      await new Promise(r => setTimeout(r, 200));
      const canvas = await html2canvas(container, {
        backgroundColor: '#F5F0E1', scale: 2, logging: false, allowTaint: true, useCORS: false,
        onclone: (doc) => {
          const s = doc.createElement('style');
          s.textContent = 'body::before,body::after{display:none!important}';
          doc.head.appendChild(s);
        },
      });
      const dataUrl = canvas.toDataURL('image/png');
      const fileName = `每日打卡_${new Date().toISOString().slice(0, 10)}.png`;

      // 方案一：Share API（移动端，分享到相册/文件管理器）
      if (navigator.share) {
        try {
          // 先转 blob 再分享
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          if (blob) {
            const file = new File([blob], fileName, { type: 'image/png' });
            await navigator.share({ files: [file], title: '每日打卡' });
            saveBtn.textContent = '✅ 已分享';
            setTimeout(() => { saveBtn.textContent = originalText; }, 2000);
            saveBtn.disabled = false;
            return;
          }
        } catch (e) {
          if (e.name !== 'AbortError') { /* 用户取消，继续尝试其他方案 */ }
        }
      }

      // 方案二：新窗口打开图片（用户长按保存）
      const imgWin = window.open('', '_blank');
      if (imgWin) {
        imgWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>每日打卡</title><style>body{text-align:center;background:#F5F0E1;padding:20px;font-family:sans-serif;}img{max-width:100%;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.1);}p{color:#666;margin-top:16px;font-size:14px;}</style></head><body><img src="${dataUrl}" alt="每日打卡"><p>👆 长按图片，选择「保存到相册」</p></body></html>`);
        imgWin.document.close();
        saveBtn.textContent = '✅ 已打开';
      } else {
        // 方案三：直接下载（桌面端，部分 Android 也支持）
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        saveBtn.textContent = '✅ 已保存';
      }
      setTimeout(() => { saveBtn.textContent = originalText; }, 2000);
    } catch (e) {
      console.error('保存失败:', e);
      this._showModal('保存失败', '[' + e.message + '] 请用截图功能保存。');
      saveBtn.textContent = originalText;
    } finally {
      saveBtn.disabled = false;
    }
  },

  _showModal(title, text, onConfirm) {
    const overlay = $('#modal-overlay');
    if (!overlay) return;
    const titleEl = $('#modal-title');
    const textEl = $('#modal-text');
    const confirmBtn = $('#modal-confirm');
    const cancelBtn = $('#modal-cancel');
    titleEl.textContent = title;
    textEl.textContent = text;
    if (onConfirm) {
      confirmBtn.style.display = 'inline-block';
      confirmBtn.onclick = () => { overlay.classList.remove('show'); onConfirm(); };
    } else {
      confirmBtn.style.display = 'none';
    }
    cancelBtn.onclick = () => overlay.classList.remove('show');
    overlay.classList.add('show');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => { Renderer.init(); });