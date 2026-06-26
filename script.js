/**
 * 领世1对1 · 提分案例库 - 筛选逻辑
 */

let allRecords = [];
let currentFilters = {
  grade: '', base: '', subject: '', category: '', feedback_type: '', region: '', teacher: ''
};
let searchQuery = '';

// DOM refs
const cardGrid = document.getElementById('cardGrid');
const resultCount = document.getElementById('resultCount');
const activeFiltersDiv = document.getElementById('activeFilters');
const quickStats = document.getElementById('quickStats');
const searchInput = document.getElementById('searchInput');
const searchCount = document.getElementById('searchCount');
const modalOverlay = document.getElementById('modalOverlay');
const modalImage = document.getElementById('modalImage');
const modalInfo = document.getElementById('modalInfo');
const resetBtn = document.getElementById('resetBtn');

const filterSelects = {
  grade: document.getElementById('filterGrade'),
  base: document.getElementById('filterBase'),
  subject: document.getElementById('filterSubject'),
  category: document.getElementById('filterCategory'),
  feedback_type: document.getElementById('filterFeedback'),
  region: document.getElementById('filterRegion'),
  teacher: document.getElementById('filterTeacher')
};

const filterLabels = {
  grade: '年级', base: '基地', subject: '学科',
  category: '考试类型', feedback_type: '好评类型', region: '地区', teacher: '伴学师'
};

// ==================== Init ====================

async function init() {
  try {
    const resp = await fetch('data.json');
    allRecords = await resp.json();
    populateFilters();
    renderCards();
  } catch (err) {
    cardGrid.innerHTML = `<div class="loading">数据加载失败: ${err.message}</div>`;
  }
}

// ==================== Populate Filters ====================

function populateFilters() {
  for (const field of Object.keys(filterSelects)) {
    const values = [...new Set(allRecords.map(r => r[field]).filter(Boolean))].sort();
    const select = filterSelects[field];
    const group = select.closest('.filter-group');

    // 无有效值时隐藏该筛选器
    if (values.length === 0) {
      if (group) group.style.display = 'none';
      continue;
    }
    if (group) group.style.display = '';

    while (select.options.length > 1) select.remove(1);
    for (const val of values) {
      const option = document.createElement('option');
      option.value = val;
      option.textContent = val;
      select.appendChild(option);
    }
  }
}

// ==================== Filter Logic ====================

function getFilteredRecords() {
  return allRecords.filter(record => {
    for (const [field, value] of Object.entries(currentFilters)) {
      if (value && record[field] !== value) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable = [
        record.student, record.teacher, record.grade, record.subject,
        record.base, record.region, record.category, record.feedback_type,
        record.description, record.copywriting
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });
}

// ==================== Render ====================

function renderCards() {
  const filtered = getFilteredRecords();
  if (filtered.length === 0) {
    cardGrid.innerHTML = `<div class="no-results"><div class="icon">🔍</div><p>没有匹配的案例</p></div>`;
  } else {
    cardGrid.innerHTML = filtered.map(buildCard).join('');
  }
  updateStats();
}

function buildCard(record) {
  const tags = [];
  if (record.grade) tags.push(`<span class="card-tag tag-grade">${record.grade}</span>`);
  if (record.subject) tags.push(`<span class="card-tag tag-subject">${record.subject}</span>`);
  if (record.region) tags.push(`<span class="card-tag tag-region">${record.region}</span>`);
  if (record.category) tags.push(`<span class="card-tag tag-category">${record.category}</span>`);
  if (record.feedback_type) tags.push(`<span class="card-tag tag-feedback">${record.feedback_type}</span>`);

  return `
    <div class="card" onclick="openModal(${allRecords.indexOf(record)})">
      <img class="card-image" src="${record.image}" alt="${record.student}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="card-image-placeholder" style="display:none;">📷</div>
      <div class="card-body">
        <div class="card-student">${record.student}</div>
        <div class="card-meta">${tags.join('')}</div>
        <div class="card-teacher">${record.teacher} · ${record.base}</div>
        <div class="card-desc">${(record.description||'').substring(0,60)}</div>
      </div>
    </div>
  `;
}

function updateStats() {
  const filtered = getFilteredRecords();
  const total = allRecords.length;
  resultCount.textContent = filtered.length === total
    ? `${total} 条记录`
    : `${filtered.length} / ${total} 条`;

  if (filtered.length > 0 && filtered.length < total) {
    const grades = [...new Set(filtered.map(r => r.grade))].sort();
    quickStats.textContent = `当前: ${grades.join('、')}`;
  } else {
    quickStats.textContent = '';
  }
  searchCount.textContent = searchQuery ? `匹配 ${filtered.length} 条` : '';
}

// ==================== Active Filter Chips ====================

function renderActiveFilters() {
  const chips = [];
  for (const [field, value] of Object.entries(currentFilters)) {
    if (value) {
      chips.push(`<span class="filter-chip" onclick="clearFilter('${field}')" title="点击清除">${filterLabels[field]}: ${value}<span class="chip-close">×</span></span>`);
    }
  }
  activeFiltersDiv.innerHTML = chips.join('');
}

function clearFilter(field) {
  filterSelects[field].value = '';
  currentFilters[field] = '';
  renderActiveFilters();
  renderCards();
}

// ==================== Events ====================

for (const [field, select] of Object.entries(filterSelects)) {
  select.addEventListener('change', () => {
    currentFilters[field] = select.value;
    renderActiveFilters();
    renderCards();
  });
}

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  renderCards();
});

resetBtn.addEventListener('click', () => {
  for (const [field, select] of Object.entries(filterSelects)) {
    select.value = '';
    currentFilters[field] = '';
  }
  searchQuery = '';
  searchInput.value = '';
  renderActiveFilters();
  renderCards();
});

// ==================== Modal ====================

function openModal(index) {
  const record = allRecords[index];
  if (!record) return;

  modalImage.src = record.image;
  modalInfo.innerHTML = `
    <h3>${record.student} <small style="font-weight:400;color:#64748b;">${record.grade} · ${record.subject}</small></h3>
    <div class="meta-row" style="margin-bottom:8px;">
      <span class="card-tag tag-grade">${record.grade||''}</span>
      <span class="card-tag tag-subject">${record.subject||''}</span>
      <span class="card-tag tag-category">${record.category||''}</span>
      <span class="card-tag tag-feedback">${record.feedback_type||''}</span>
    </div>
    <div class="meta-row" style="margin-bottom:8px;">
      <span class="card-tag tag-teacher">👩‍🏫 ${record.teacher||''}</span>
      <span class="card-tag tag-base">🏢 ${record.base||''}</span>
      ${record.region ? `<span class="card-tag tag-region">📍 ${record.region}</span>` : ''}
    </div>
    ${record.description ? `<p style="margin-top:8px;font-size:0.9rem;color:#475569;">💬 ${record.description}</p>` : ''}
    ${record.copywriting ? `<div style="margin-top:8px;padding:10px;background:#f8fafc;border-radius:8px;font-size:0.85rem;color:#334155;white-space:pre-wrap;line-height:1.5;">${record.copywriting}</div>` : ''}
  `;

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  modalImage.src = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); }
});

document.addEventListener('DOMContentLoaded', init);
