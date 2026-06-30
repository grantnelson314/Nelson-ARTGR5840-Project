/* SubTrack — Subscription Tracker Application */

const STORAGE_KEY = 'subtrack_subscriptions';
const REMINDERS_KEY = 'subtrack_reminders';

const CATEGORIES = {
  streaming: 'Streaming',
  software: 'Software',
  music: 'Music',
  fitness: 'Fitness',
  news: 'News',
  other: 'Other',
};

const CATEGORY_COLORS = {
  streaming: '#2563EB',
  software: '#64748B',
  music: '#22C55E',
  fitness: '#F59E0B',
  news: '#8B5CF6',
  other: '#94A3B8',
};

const CYCLE_LABELS = {
  weekly: 'week',
  monthly: 'month',
  quarterly: 'quarter',
  yearly: 'year',
};

const SCREEN_TITLES = {
  dashboard: 'Dashboard',
  subscriptions: 'My Subscriptions',
  analytics: 'Analytics',
  renewals: 'Renewals',
  add: 'Add Subscription',
  detail: 'Subscription',
};

// --- State ---

let subscriptions = [];
let currentScreen = 'dashboard';
let previousScreen = 'dashboard';
let selectedDetailId = null;
let calendarMonth = new Date();
let spendingChart = null;
let categoryChart = null;

// --- Utilities ---

function generateId() {
  return 'sub_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatCurrency(amount) {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMonthlyEquivalent(cost, cycle) {
  switch (cycle) {
    case 'weekly': return cost * (52 / 12);
    case 'monthly': return cost;
    case 'quarterly': return cost / 3;
    case 'yearly': return cost / 12;
    default: return cost;
  }
}

function getYearlyEquivalent(cost, cycle) {
  return getMonthlyEquivalent(cost, cycle) * 12;
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function getCategoryIcon(category) {
  const icons = {
    streaming: '📺',
    software: '💻',
    music: '🎵',
    fitness: '💪',
    news: '📰',
    other: '📦',
  };
  return icons[category] || '📦';
}

// --- Data ---

function seedData() {
  const today = new Date();
  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  return [
    { id: generateId(), serviceName: 'Netflix', category: 'streaming', cost: 15.99, billingCycle: 'monthly', renewalDate: addDays(2), status: 'active', createdAt: new Date().toISOString() },
    { id: generateId(), serviceName: 'Spotify', category: 'music', cost: 10.99, billingCycle: 'monthly', renewalDate: addDays(4), status: 'active', createdAt: new Date().toISOString() },
    { id: generateId(), serviceName: 'Adobe Creative Cloud', category: 'software', cost: 54.99, billingCycle: 'monthly', renewalDate: addDays(12), status: 'active', createdAt: new Date().toISOString() },
    { id: generateId(), serviceName: 'Disney+', category: 'streaming', cost: 7.99, billingCycle: 'monthly', renewalDate: addDays(18), status: 'active', createdAt: new Date().toISOString() },
    { id: generateId(), serviceName: 'Planet Fitness', category: 'fitness', cost: 24.99, billingCycle: 'monthly', renewalDate: addDays(7), status: 'active', createdAt: new Date().toISOString() },
    { id: generateId(), serviceName: 'The New York Times', category: 'news', cost: 17.00, billingCycle: 'monthly', renewalDate: addDays(25), status: 'paused', createdAt: new Date().toISOString() },
    { id: generateId(), serviceName: 'Microsoft 365', category: 'software', cost: 99.99, billingCycle: 'yearly', renewalDate: addDays(90), status: 'active', createdAt: new Date().toISOString() },
  ];
}

function loadSubscriptions() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    subscriptions = JSON.parse(stored);
  } else {
    subscriptions = seedData();
    saveSubscriptions();
  }
}

function saveSubscriptions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

function getActiveSubscriptions() {
  return subscriptions.filter(s => s.status === 'active');
}

// --- Navigation ---

function showScreen(screen) {
  if (screen !== currentScreen) {
    if (screen === 'add' || screen === 'detail') {
      if (currentScreen !== 'add' && currentScreen !== 'detail') {
        previousScreen = currentScreen;
      }
    } else {
      previousScreen = currentScreen === 'add' || currentScreen === 'detail' ? previousScreen : currentScreen;
    }
  }

  currentScreen = screen;

  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  document.getElementById('screen-' + screen).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => {
    const isActive = btn.dataset.screen === screen;
    btn.classList.toggle('nav-active', isActive);
  });

  document.querySelectorAll('.mobile-nav-item').forEach(btn => {
    const isActive = btn.dataset.screen === screen;
    btn.classList.toggle('nav-mobile-active', isActive);
  });

  const title = SCREEN_TITLES[screen] || 'SubTrack';
  const mobileTitle = document.getElementById('mobile-header-title');
  if (mobileTitle) mobileTitle.textContent = title;

  const mobileHeader = document.querySelector('.mobile-header');
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  const hideChrome = screen === 'add' || screen === 'detail';
  if (mobileHeader) mobileHeader.classList.toggle('hidden', hideChrome);
  if (bottomNav) bottomNav.classList.toggle('hidden', hideChrome);

  renderCurrentScreen();
}

function renderCurrentScreen() {
  switch (currentScreen) {
    case 'dashboard': renderDashboard(); break;
    case 'subscriptions': renderSubscriptionsList(); break;
    case 'analytics': renderAnalytics(); break;
    case 'renewals': renderRenewals(); break;
    case 'detail': renderDetail(); break;
  }
}

// --- Toast ---

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2500);
}

// --- Status Badge ---

function statusBadgeHTML(status) {
  const labels = { active: 'Active', paused: 'Paused', cancelled: 'Cancelled' };
  const badgeClass = status === 'active' ? 'badge-active' : `badge-${status}`;
  return `<span class="badge ${badgeClass}"><span class="badge-dot" aria-hidden="true"></span>${labels[status]}</span>`;
}

function daysBadgeHTML(days) {
  if (days < 0) return '';
  const cls = days <= 3 ? 'badge-count badge-count-urgent' : 'badge-count badge-count-soon';
  const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`;
  return `<span class="${cls}">${label}</span>`;
}

// --- Subscription Card ---

function subscriptionListCardHTML(sub) {
  const monthly = getMonthlyEquivalent(sub.cost, sub.billingCycle);
  const days = daysUntil(sub.renewalDate);
  const renewalUrgent = sub.status === 'active' && days >= 0 && days <= 3;
  const renewalClass = renewalUrgent ? 'text-warning-strong' : 'text-slate-900';

  return `
    <button type="button" data-detail="${sub.id}" aria-label="${sub.serviceName}, ${CATEGORIES[sub.category]}, ${formatCurrency(monthly)} per month, renews ${formatDate(sub.renewalDate)}, ${sub.status}" class="subscription-list-card w-full text-left bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="text-base font-bold text-slate-900 truncate">${sub.serviceName}</h3>
          <p class="text-sm text-muted mt-0.5">${CATEGORIES[sub.category]}</p>
        </div>
        ${statusBadgeHTML(sub.status)}
      </div>
      <div class="mobile-list-meta grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
        <div>
          <p class="text-xs font-semibold text-muted">Monthly cost</p>
          <p class="text-base font-bold text-slate-900 mt-1">${formatCurrency(monthly)}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted">Renewal date</p>
          <p class="text-base font-bold ${renewalClass} mt-1">${formatDate(sub.renewalDate)}</p>
        </div>
      </div>
    </button>`;
}

function subscriptionCardHTML(sub) {
  const monthly = getMonthlyEquivalent(sub.cost, sub.billingCycle);

  return `
    <button type="button" data-detail="${sub.id}" class="subscription-card subscription-card--compact text-left rounded-lg p-4 w-full group">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-lg">${getCategoryIcon(sub.category)}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-900 truncate">${sub.serviceName}</p>
          <p class="text-sm dash-muted">${CATEGORIES[sub.category]}</p>
        </div>
        <p class="text-sm font-bold text-slate-900 flex-shrink-0">${formatCurrency(monthly)}<span class="text-sm font-medium dash-muted">/mo</span></p>
      </div>
    </button>`;
}

function upcomingRowHTML(sub) {
  const days = daysUntil(sub.renewalDate);
  const urgent = days <= 3;
  return `
    <button type="button" data-detail="${sub.id}" class="subscription-card subscription-card--row w-full text-left flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 -mx-2 px-2 rounded-lg">
      <div class="w-10 h-10 rounded-lg ${urgent ? 'bg-warning-surface' : 'bg-primary-surface'} flex items-center justify-center text-lg flex-shrink-0">${getCategoryIcon(sub.category)}</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-slate-900 truncate">${sub.serviceName}</p>
        <p class="text-sm dash-muted">${formatShortDate(sub.renewalDate)}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="text-sm font-bold text-slate-900">${formatCurrency(sub.cost)}</p>
        ${daysBadgeHTML(days)}
      </div>
    </button>`;
}

function categoryBarHTML(category, amount, total) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  const color = CATEGORY_COLORS[category] || '#94A3B8';
  return `
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-sm font-medium text-slate-700">${CATEGORIES[category]}</span>
        <span class="text-sm font-semibold text-slate-900">${formatCurrency(amount)}<span class="dash-muted font-medium"> · ${pct.toFixed(0)}%</span></span>
      </div>
      <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${color}"></div>
      </div>
    </div>`;
}

function emptyStateHTML(message, showAdd = true, showClearFilters = false) {
  return `
    <div class="empty-state text-center py-12 px-4">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-2xl" aria-hidden="true">📋</div>
      <p class="text-sm text-muted mb-4">${message}</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        ${showClearFilters ? '<button type="button" class="empty-clear-btn btn-secondary px-4 py-2.5 text-sm rounded-lg">Clear filters</button>' : ''}
        ${showAdd ? '<button type="button" class="empty-add-btn btn-primary px-4 py-2.5 text-sm rounded-lg">Add Subscription</button>' : ''}
      </div>
    </div>`;
}

// --- Dashboard ---

function renderDashboard() {
  const active = getActiveSubscriptions();
  const monthlyTotal = active.reduce((sum, s) => sum + getMonthlyEquivalent(s.cost, s.billingCycle), 0);
  const yearlyTotal = monthlyTotal * 12;
  const dailyEquiv = monthlyTotal / 30;

  document.getElementById('dash-monthly-total').textContent = formatCurrency(monthlyTotal);
  document.getElementById('dash-yearly-total').textContent = formatCurrency(yearlyTotal);
  document.getElementById('dash-active-count-num').textContent = active.length;
  document.getElementById('dash-active-count').textContent =
    active.length === 1 ? 'subscription' : 'subscriptions';

  const dailyEl = document.getElementById('dash-daily-equiv');
  if (active.length > 0) {
    dailyEl.textContent = `${formatCurrency(dailyEquiv)} per day · ${active.length} subscription${active.length !== 1 ? 's' : ''} found`;
  } else {
    dailyEl.textContent = 'Add subscriptions to start tracking';
  }

  const avgPerService = active.length > 0 ? monthlyTotal / active.length : 0;
  document.getElementById('dash-avg-per-service').textContent = formatCurrency(avgPerService);

  const renewalsThisWeek = active.filter(s => {
    const d = daysUntil(s.renewalDate);
    return d >= 0 && d <= 7;
  }).length;
  document.getElementById('dash-renewals-week').textContent = renewalsThisWeek;

  const categoryTotals = {};
  active.forEach(s => {
    categoryTotals[s.category] = (categoryTotals[s.category] || 0) + getMonthlyEquivalent(s.cost, s.billingCycle);
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    document.getElementById('dash-top-category').textContent = CATEGORIES[topCategory[0]];
    document.getElementById('dash-top-category-amount').textContent = `${formatCurrency(topCategory[1])}/mo`;
  } else {
    document.getElementById('dash-top-category').textContent = '—';
    document.getElementById('dash-top-category-amount').textContent = 'No data';
  }

  const nextRenewal = active
    .filter(s => daysUntil(s.renewalDate) >= 0)
    .sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate))[0];
  if (nextRenewal) {
    document.getElementById('dash-next-renewal-name').textContent = nextRenewal.serviceName;
    const days = daysUntil(nextRenewal.renewalDate);
    const dateEl = document.getElementById('dash-next-renewal-date');
    dateEl.textContent =
      days === 0 ? 'Renews today' : days === 1 ? 'Renews tomorrow' : `Renews in ${days} days · ${formatShortDate(nextRenewal.renewalDate)}`;
    dateEl.className = days <= 3 ? 'text-sm text-warning-strong mt-0.5' : 'text-sm dash-muted mt-0.5';
  } else {
    document.getElementById('dash-next-renewal-name').textContent = '—';
    document.getElementById('dash-next-renewal-date').textContent = 'No upcoming';
    document.getElementById('dash-next-renewal-date').className = 'text-sm dash-muted mt-0.5';
  }

  const categorySection = document.getElementById('sectionCategoryBreakdown');
  const categoryBars = document.getElementById('dash-category-bars');
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    categorySection.classList.remove('hidden');
    categoryBars.innerHTML = sortedCategories.map(([cat, amt]) =>
      categoryBarHTML(cat, amt, monthlyTotal)
    ).join('');
  } else {
    categorySection.classList.add('hidden');
  }

  const upcoming = active
    .filter(s => daysUntil(s.renewalDate) >= 0 && daysUntil(s.renewalDate) <= 30)
    .sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate))
    .slice(0, 5);

  const upcomingList = document.getElementById('dash-upcoming-list');
  upcomingList.innerHTML = upcoming.length
    ? upcoming.map(upcomingRowHTML).join('')
    : '<p class="text-sm dash-muted py-4 text-center">No upcoming renewals in the next 30 days.</p>';

  const recent = [...subscriptions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const recentList = document.getElementById('dash-recent-list');
  recentList.innerHTML = recent.length
    ? recent.map(s => subscriptionCardHTML(s)).join('')
    : emptyStateHTML('No subscriptions yet. Add your first subscription to get started.');
}

// --- My Subscriptions ---

function getFilteredSubscriptions() {
  const search = document.getElementById('search-input').value.toLowerCase().trim();
  const category = document.getElementById('filter-category').value;
  const status = document.getElementById('filter-status').value;
  const sort = document.getElementById('filter-sort').value;

  let filtered = [...subscriptions];

  if (search) {
    filtered = filtered.filter(s =>
      s.serviceName.toLowerCase().includes(search) ||
      CATEGORIES[s.category].toLowerCase().includes(search)
    );
  }
  if (category !== 'all') filtered = filtered.filter(s => s.category === category);
  if (status !== 'all') filtered = filtered.filter(s => s.status === status);

  switch (sort) {
    case 'renewal':
      filtered.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
      break;
    case 'cost-desc':
      filtered.sort((a, b) => getMonthlyEquivalent(b.cost, b.billingCycle) - getMonthlyEquivalent(a.cost, a.billingCycle));
      break;
    case 'name':
      filtered.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
      break;
  }

  return filtered;
}

function renderSubscriptionsList() {
  const filtered = getFilteredSubscriptions();
  const list = document.getElementById('subscriptions-list');
  const summary = document.getElementById('subscriptions-summary');

  const hasFilters = document.getElementById('search-input').value ||
    document.getElementById('filter-category').value !== 'all' ||
    document.getElementById('filter-status').value !== 'all';

  if (summary) {
    if (!filtered.length) {
      summary.textContent = hasFilters ? 'No matches' : 'No subscriptions yet';
    } else {
      const total = subscriptions.length;
      summary.textContent = filtered.length === total
        ? `${total} subscription${total !== 1 ? 's' : ''}`
        : `Showing ${filtered.length} of ${total}`;
    }
  }

  if (!filtered.length) {
    list.innerHTML = emptyStateHTML(
      hasFilters ? 'No subscriptions match your filters.' : 'No subscriptions yet.',
      !hasFilters,
      hasFilters
    );
    return;
  }

  list.innerHTML = filtered.map(s => subscriptionListCardHTML(s)).join('');
}

// --- Add / Edit Form ---

function openAddForm(editSub = null) {
  const form = document.getElementById('add-form');
  form.reset();
  clearFormErrors();

  document.getElementById('edit-id').value = editSub ? editSub.id : '';
  document.getElementById('add-form-title').textContent = editSub ? 'Edit Subscription' : 'Add Subscription';
  document.getElementById('add-submit-btn').textContent = editSub ? 'Save Changes' : 'Save Subscription';

  if (editSub) {
    document.getElementById('input-name').value = editSub.serviceName;
    document.getElementById('input-category').value = editSub.category;
    document.getElementById('input-cost').value = editSub.cost;
    document.getElementById('input-cycle').value = editSub.billingCycle;
    document.getElementById('input-renewal').value = editSub.renewalDate;
  }

  showScreen('add');
}

function clearFormErrors() {
  ['name', 'category', 'cost', 'cycle', 'renewal'].forEach(field => {
    const el = document.getElementById('error-' + field);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
  document.querySelectorAll('#add-form .form-input, #add-form .form-select').forEach(el => {
    el.removeAttribute('aria-invalid');
  });
}

function validateForm() {
  clearFormErrors();
  let valid = true;

  const name = document.getElementById('input-name').value.trim();
  const category = document.getElementById('input-category').value;
  const costRaw = document.getElementById('input-cost').value;
  const cost = parseFloat(costRaw);
  const cycle = document.getElementById('input-cycle').value;
  const renewal = document.getElementById('input-renewal').value;

  if (!name || name.length < 2) {
    showFieldError('name', 'Service name must be at least 2 characters.');
    valid = false;
  }
  if (!category) {
    showFieldError('category', 'Please select a category.');
    valid = false;
  }
  if (!costRaw || isNaN(cost) || cost <= 0) {
    showFieldError('cost', 'Please enter a valid cost greater than 0.');
    valid = false;
  }
  if (!cycle) {
    showFieldError('cycle', 'Please select a billing cycle.');
    valid = false;
  }
  if (!renewal) {
    showFieldError('renewal', 'Please select a renewal date.');
    valid = false;
  }

  if (!valid) {
    const firstInvalid = document.querySelector('#add-form [aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
  }

  return valid;
}

function showFieldError(field, message) {
  const el = document.getElementById('error-' + field);
  const input = document.getElementById('input-' + field);
  el.textContent = message;
  el.classList.remove('hidden');
  if (input) input.setAttribute('aria-invalid', 'true');
}

function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const editId = document.getElementById('edit-id').value;
  const data = {
    serviceName: document.getElementById('input-name').value.trim(),
    category: document.getElementById('input-category').value,
    cost: parseFloat(document.getElementById('input-cost').value),
    billingCycle: document.getElementById('input-cycle').value,
    renewalDate: document.getElementById('input-renewal').value,
  };

  if (editId) {
    const idx = subscriptions.findIndex(s => s.id === editId);
    if (idx !== -1) {
      subscriptions[idx] = { ...subscriptions[idx], ...data };
      showToast('Subscription updated.');
    }
  } else {
    subscriptions.push({ id: generateId(), ...data, status: 'active', createdAt: new Date().toISOString() });
    showToast('Subscription added.');
  }

  saveSubscriptions();
  if (editId) {
    selectedDetailId = editId;
    showScreen('detail');
  } else {
    showScreen(previousScreen);
  }
}

// --- Detail ---

function openDetail(id) {
  selectedDetailId = id;
  showScreen('detail');
}

function renderDetail() {
  const sub = subscriptions.find(s => s.id === selectedDetailId);
  if (!sub) { showScreen('subscriptions'); return; }

  document.getElementById('detail-icon').textContent = getInitial(sub.serviceName);
  document.getElementById('detail-name').textContent = sub.serviceName;
  document.getElementById('detail-category').textContent = CATEGORIES[sub.category];

  const statusEl = document.getElementById('detail-status');
  statusEl.outerHTML = statusBadgeHTML(sub.status).replace(
    'class="badge',
    'id="detail-status" class="badge mt-2'
  );

  const cycleLabel = sub.billingCycle.charAt(0).toUpperCase() + sub.billingCycle.slice(1);
  document.getElementById('detail-cost').textContent = `${formatCurrency(sub.cost)} / ${CYCLE_LABELS[sub.billingCycle]}`;
  document.getElementById('detail-cycle').textContent = cycleLabel;
  document.getElementById('detail-monthly').textContent = `${formatCurrency(getMonthlyEquivalent(sub.cost, sub.billingCycle))} / month`;

  const days = daysUntil(sub.renewalDate);
  const renewalEl = document.getElementById('detail-renewal');
  if (sub.status === 'active' && days >= 0) {
    const urgency = days === 0 ? 'Renews today' : days === 1 ? 'Renews tomorrow' : `In ${days} days`;
    renewalEl.textContent = `${formatDate(sub.renewalDate)} · ${urgency}`;
    renewalEl.className = days <= 3 ? 'text-sm font-semibold text-warning-strong' : 'text-sm font-semibold text-slate-900';
  } else {
    renewalEl.textContent = formatDate(sub.renewalDate);
    renewalEl.className = 'text-sm font-semibold text-slate-900';
  }

  const pauseBtn = document.getElementById('detail-pause-btn');
  if (sub.status === 'active') {
    pauseBtn.textContent = 'Pause';
    pauseBtn.classList.remove('hidden');
  } else if (sub.status === 'paused') {
    pauseBtn.textContent = 'Resume';
    pauseBtn.classList.remove('hidden');
  } else {
    pauseBtn.classList.add('hidden');
  }
}

function handlePause() {
  const sub = subscriptions.find(s => s.id === selectedDetailId);
  if (!sub) return;
  sub.status = sub.status === 'active' ? 'paused' : 'active';
  saveSubscriptions();
  showToast(sub.status === 'active' ? 'Subscription resumed.' : 'Subscription paused.');
  renderDetail();
}

function handleDelete() {
  const sub = subscriptions.find(s => s.id === selectedDetailId);
  if (!sub) return;
  if (!confirm(`Delete "${sub.serviceName}"? This cannot be undone.`)) return;
  subscriptions = subscriptions.filter(s => s.id !== selectedDetailId);
  saveSubscriptions();
  showToast('Subscription deleted.');
  showScreen('subscriptions');
}

// --- Analytics ---

function renderAnalytics() {
  const active = getActiveSubscriptions();
  const monthlyTotal = active.reduce((sum, s) => sum + getMonthlyEquivalent(s.cost, s.billingCycle), 0);
  const yearlyTotal = monthlyTotal * 12;
  const hasActive = active.length > 0;

  document.getElementById('analytics-avg-monthly').textContent = formatCurrency(monthlyTotal);
  document.getElementById('analytics-monthly-summary').textContent = formatCurrency(monthlyTotal);
  document.getElementById('analytics-monthly-subs').textContent = hasActive
    ? `${active.length} active subscription${active.length !== 1 ? 's' : ''}`
    : 'No active subscriptions yet';
  document.getElementById('analytics-yearly-summary').textContent = formatCurrency(yearlyTotal);

  const emptyNotice = document.getElementById('analytics-empty-notice');
  if (emptyNotice) emptyNotice.classList.toggle('hidden', hasActive);

  const months = parseInt(document.getElementById('analytics-period').value, 10);
  renderSpendingChart(months);
  renderCategoryChart();
}

function getMonthLabels(count) {
  const labels = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
  }
  return labels;
}

function renderSpendingChart(months) {
  const active = getActiveSubscriptions();
  const monthlyTotal = active.reduce((sum, s) => sum + getMonthlyEquivalent(s.cost, s.billingCycle), 0);
  const labels = getMonthLabels(months);
  const data = labels.map(() => monthlyTotal);
  const hasData = active.length > 0;

  const emptyOverlay = document.getElementById('chart-spending-empty');
  if (emptyOverlay) emptyOverlay.classList.toggle('hidden', hasData);

  const ctx = document.getElementById('chart-spending');
  if (spendingChart) spendingChart.destroy();

  spendingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Spend',
        data: hasData ? data : labels.map(() => 0),
        backgroundColor: hasData ? '#2563EB' : '#E2E8F0',
        borderRadius: 6,
        barThickness: months <= 6 ? 40 : 24,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: hasData,
          callbacks: {
            label: (ctx) => formatCurrency(ctx.raw),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => '$' + v,
            color: '#64748B',
            font: { family: 'Inter' },
          },
          grid: { color: '#F1F5F9' },
        },
        x: {
          ticks: { color: '#64748B', font: { family: 'Inter', size: 11 }, maxRotation: 45, minRotation: 0 },
          grid: { display: false },
        },
      },
    },
  });
}

function renderCategoryChart() {
  const active = getActiveSubscriptions();
  const totals = {};
  active.forEach(s => {
    const cat = s.category;
    totals[cat] = (totals[cat] || 0) + getMonthlyEquivalent(s.cost, s.billingCycle);
  });

  const labels = Object.keys(totals).map(k => CATEGORIES[k]);
  const data = Object.values(totals);
  const colors = Object.keys(totals).map(k => CATEGORY_COLORS[k]);
  const hasData = labels.length > 0;

  const emptyOverlay = document.getElementById('chart-category-empty');
  if (emptyOverlay) emptyOverlay.classList.toggle('hidden', hasData);

  const ctx = document.getElementById('chart-category');
  if (categoryChart) categoryChart.destroy();

  if (!hasData) {
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['#E2E8F0'] }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
    return;
  }

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#64748B', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return `${ctx.label}: ${formatCurrency(ctx.raw)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// --- Renewals / Calendar ---

function renderRenewals() {
  renderCalendar();
  renderTimeline();
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  document.getElementById('cal-month-label').textContent =
    calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewalDays = {};
  getActiveSubscriptions().forEach(s => {
    const d = new Date(s.renewalDate + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!renewalDays[day]) renewalDays[day] = [];
      renewalDays[day].push(s);
    }
  });

  const grid = document.getElementById('cal-grid');
  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-cell empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const isToday = dateObj.getTime() === today.getTime();
    const hasRenewal = renewalDays[day];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    html += `<button type="button" data-cal-date="${dateStr}" class="cal-cell cal-day ${isToday ? 'cal-today' : ''} ${hasRenewal ? 'cal-has-renewal' : ''} rounded-lg text-sm">
      <span class="cal-day-num">${day}</span>
      ${hasRenewal ? `<span class="cal-dot"></span>` : ''}
    </button>`;
  }

  grid.innerHTML = html;
  document.getElementById('cal-day-detail').classList.add('hidden');
}

function showCalendarDayDetail(dateStr) {
  document.querySelectorAll('[data-cal-date]').forEach(btn => {
    btn.classList.toggle('cal-day-selected', btn.dataset.calDate === dateStr);
  });

  const subs = getActiveSubscriptions().filter(s => s.renewalDate === dateStr);
  const detail = document.getElementById('cal-day-detail');
  const label = document.getElementById('cal-day-detail-label');
  const list = document.getElementById('cal-day-detail-list');

  label.textContent = formatDate(dateStr);

  if (!subs.length) {
    list.innerHTML = '<p class="text-sm text-muted py-2">No renewals on this day.</p>';
    detail.classList.remove('hidden');
    return;
  }

  list.innerHTML = subs.map(s => `
    <button type="button" data-detail="${s.id}" class="subscription-card subscription-card--row w-full text-left flex items-center gap-3 p-2 rounded-lg">
      <span class="text-lg">${getCategoryIcon(s.category)}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900">${s.serviceName}</p>
        <p class="text-sm text-muted">${formatCurrency(s.cost)}</p>
      </div>
    </button>
  `).join('');
  detail.classList.remove('hidden');
}

function renderTimeline() {
  const upcoming = getActiveSubscriptions()
    .filter(s => daysUntil(s.renewalDate) >= 0)
    .sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate))
    .slice(0, 10);

  const timeline = document.getElementById('renewal-timeline');
  if (!upcoming.length) {
    timeline.innerHTML = '<p class="text-sm text-muted py-2">No upcoming renewals.</p>';
    return;
  }

  timeline.innerHTML = upcoming.map(s => {
    const days = daysUntil(s.renewalDate);
    const dotColor = days <= 3 ? 'bg-warning' : 'bg-primary';
    return `
      <button type="button" data-detail="${s.id}" class="subscription-card subscription-card--row w-full text-left flex items-start gap-3 group rounded-lg p-1 -m-1">
        <div class="flex flex-col items-center mt-1">
          <span class="w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0"></span>
          <span class="w-px flex-1 bg-slate-200 mt-1 min-h-[16px]"></span>
        </div>
        <div class="flex-1 pb-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors">${s.serviceName}</p>
            ${daysBadgeHTML(days)}
          </div>
          <p class="text-sm text-muted mt-0.5">${formatShortDate(s.renewalDate)} · ${formatCurrency(s.cost)}</p>
        </div>
      </button>`;
  }).join('');
}

// --- Reminders ---

function loadReminders() {
  const stored = localStorage.getItem(REMINDERS_KEY);
  if (stored) {
    const r = JSON.parse(stored);
    document.getElementById('reminder-3').checked = r.days3 ?? true;
    document.getElementById('reminder-1').checked = r.days1 ?? true;
    document.getElementById('reminder-0').checked = r.day0 ?? false;
  }
}

function saveReminders() {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify({
    days3: document.getElementById('reminder-3').checked,
    days1: document.getElementById('reminder-1').checked,
    day0: document.getElementById('reminder-0').checked,
  }));
  showToast('Reminder settings saved.');
}

// --- Event Listeners ---

function clearSubscriptionFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-category').value = 'all';
  document.getElementById('filter-status').value = 'all';
  document.getElementById('filter-sort').value = 'renewal';
  renderSubscriptionsList();
}

function initEventListeners() {
  document.querySelectorAll('[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });

  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.goto));
  });

  document.getElementById('mobile-add-btn').addEventListener('click', () => openAddForm());
  document.getElementById('desktop-add-btn').addEventListener('click', () => openAddForm());
  document.querySelectorAll('.desktop-header-add').forEach(btn => {
    btn.addEventListener('click', () => openAddForm());
  });

  document.getElementById('add-back-btn').addEventListener('click', () => showScreen(previousScreen));
  document.getElementById('add-cancel-btn').addEventListener('click', () => showScreen(previousScreen));
  document.getElementById('add-form').addEventListener('submit', handleFormSubmit);

  document.getElementById('detail-back-btn').addEventListener('click', () => showScreen(previousScreen));
  document.getElementById('detail-edit-btn').addEventListener('click', () => {
    const sub = subscriptions.find(s => s.id === selectedDetailId);
    if (sub) openAddForm(sub);
  });
  document.getElementById('detail-pause-btn').addEventListener('click', handlePause);
  document.getElementById('detail-delete-btn').addEventListener('click', handleDelete);

  ['search-input', 'filter-category', 'filter-status', 'filter-sort'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderSubscriptionsList);
    document.getElementById(id).addEventListener('change', renderSubscriptionsList);
  });

  document.getElementById('analytics-period').addEventListener('change', renderAnalytics);

  document.getElementById('cal-prev').addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  document.getElementById('cal-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cal-date]');
    if (btn) showCalendarDayDetail(btn.dataset.calDate);
  });

  ['reminder-3', 'reminder-1', 'reminder-0'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveReminders);
  });

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-detail]');
    if (card) openDetail(card.dataset.detail);

    const addBtn = e.target.closest('.empty-add-btn');
    if (addBtn) openAddForm();

    const clearBtn = e.target.closest('.empty-clear-btn');
    if (clearBtn) clearSubscriptionFilters();
  });
}

// --- Init ---

function init() {
  loadSubscriptions();
  loadReminders();
  initEventListeners();
  showScreen('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
