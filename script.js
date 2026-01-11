// SYSTEM MOTYWU
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

const savedTheme = Storage.getTheme();
if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
  if (darkModeToggle) darkModeToggle.checked = true;
}

if (darkModeToggle) {
  darkModeToggle.addEventListener('change', function() {
    body.classList.toggle('dark-mode', this.checked);
    Storage.saveTheme(this.checked ? 'dark' : 'light');
  });
}

// ZMIENNE GLOBALNE
let currentUser = Storage.getCurrentUser();
let users = Storage.getUsers();
let measurements = [];

// Konfiguracja poziomów glukozy
const glucoseLevels = {
  veryLow: { max: 50, class: 'glucose-very-low', color: '#dc3545' },
  low: { max: 70, class: 'glucose-low', color: '#ffc107' },
  normal: { max: 140, class: 'glucose-normal', color: '#28a745' },
  high: { max: 180, class: 'glucose-high', color: '#ffc107' },
  veryHigh: { max: Infinity, class: 'glucose-very-high', color: '#dc3545' }
};

function getGlucoseClass(val) {
  if (val < 50) return glucoseLevels.veryLow.class;
  if (val < 70) return glucoseLevels.low.class;
  if (val <= 140) return glucoseLevels.normal.class;
  if (val <= 180) return glucoseLevels.high.class;
  return glucoseLevels.veryHigh.class;
}

function getGlucoseColor(val) {
  if (val < 50) return glucoseLevels.veryLow.color;
  if (val < 70) return glucoseLevels.low.color;
  if (val <= 140) return glucoseLevels.normal.color;
  if (val <= 180) return glucoseLevels.high.color;
  return glucoseLevels.veryHigh.color;
}

function getGlucoseStatus(val) {
  if (val < 50) return { message: 'Bardzo niski cukier', icon: '⚠️' };
  if (val < 70) return { message: 'Niski cukier', icon: '⚠️' };
  if (val > 180) return { message: 'Bardzo wysoki cukier', icon: '🚨' };
  if (val > 140) return { message: 'Za wysoki poziom cukru', icon: '⚠️' };
  return { message: 'Prawidłowy poziom cukru', icon: '✅' };
}

// FUNKCJE POMOCNICZE
function $(id) { return document.getElementById(id); }
function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
function setHTML(id, html) { const el = $(id); if (el) el.innerHTML = html; }

function initializeUserData() {
  if (currentUser && users[currentUser]) {
    measurements = users[currentUser].measurements || [];
    updateLoginUI();
    updateUsernameDisplay();
  } else {
    measurements = Storage.getMeasurements();
  }
}

function updateUsernameDisplay() {
  setText('username-display', currentUser || 'Gość');
}

function updateLoginUI() {
  const loginForm = $('login-form');
  const userInfo = $('user-info');
  
  if (currentUser) {
    if (loginForm) loginForm.classList.add('hidden');
    if (userInfo) userInfo.classList.remove('hidden');
    setText('logged-user', currentUser);
    setText('user-id', users[currentUser]?.userId || 'N/A');
  } else {
    if (loginForm) loginForm.classList.remove('hidden');
    if (userInfo) userInfo.classList.add('hidden');
  }
}

function saveUserData() {
  if (currentUser && users[currentUser]) {
    users[currentUser].measurements = measurements;
    Storage.saveUsers(users);
  } else {
    Storage.saveMeasurements(measurements);
  }
}

function refreshUI() {
  initializeUserData();
  updateUsernameDisplay();
  updateLoginUI();
  updateAllSections();
}

function showNotification(message, type = 'info') {
  let notification = $('system-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'system-notification';
    notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;border-radius:5px;color:white;font-weight:bold;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s,transform 0.3s';
    document.body.appendChild(notification);
  }
  clearTimeout(notification.hideTimeout);
  clearTimeout(notification.showTimeout);
  const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
  notification.style.backgroundColor = colors[type] || colors.info;
  notification.textContent = message;
  notification.style.cssText += ';opacity:0;transform:translateY(-20px)';
  notification.showTimeout = setTimeout(() => notification.style.cssText += ';opacity:1;transform:translateY(0)', 10);
  notification.hideTimeout = setTimeout(() => notification.style.cssText += ';opacity:0;transform:translateY(-20px)', 3500);
}

// OBSŁUGA REJESTRACJI
$('register-btn')?.addEventListener('click', function() {
  const username = $('username').value.trim();
  const password = $('password').value.trim();
  
  if (!username || !password) return showNotification('Wprowadź nazwę użytkownika i hasło', 'warning');
  if (username.length < 3) return showNotification('Nazwa użytkownika musi mieć min. 3 znaki', 'warning');
  if (password.length < 4) return showNotification('Hasło musi mieć min. 4 znaki', 'warning');
  if (users[username]) return showNotification('❌ Użytkownik już istnieje', 'error');
  
  users[username] = {
    password: password,
    userId: 'user_' + Date.now(),
    measurements: [],
    createdAt: new Date().toISOString(),
    settings: {}
  };
  
  Storage.saveUsers(users);
  showNotification('✅ Konto utworzone! Możesz się zalogować', 'success');
  $('username').value = '';
  $('password').value = '';
});

// OBSŁUGA LOGOWANIA
$('login-btn')?.addEventListener('click', function() {
  const username = $('username').value.trim();
  const password = $('password').value.trim();
  
  if (!username || !password) return showNotification('Wprowadź nazwę użytkownika i hasło', 'warning');
  if (!users[username]) return showNotification('❌ Użytkownik nie istnieje', 'error');
  if (users[username].password !== password) return showNotification('❌ Nieprawidłowe hasło', 'error');
  
  currentUser = username;
  Storage.saveCurrentUser(currentUser);
  Storage.saveUsers(users);
  refreshUI();
  showNotification(`👋 Witaj ${username}!`, 'success');
});

// OBSŁUGA WYLOGOWANIA
$('logout-btn')?.addEventListener('click', function() {
  currentUser = null;
  Storage.removeCurrentUser();
  measurements = Storage.getMeasurements();
  refreshUI();
  showNotification('👋 Wylogowano pomyślnie', 'info');
});

refreshUI();

// NAWIGACJA SPA
const menuLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('main section');

menuLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetId = link.hash.substring(1);
    
    sections.forEach(sec => {
      sec.classList.toggle('hidden', sec.id !== targetId);
    });
    
    if (targetId === 'analytics') {
      setTimeout(() => {
        const range = $('trend-range-select')?.value || 'days';
        renderTrendChart(range);
        updateAnalyticsSummary();
      }, 120);
    }
  });
});

// AKTUALIZACJA WIDOKÓW
function updateAllSections() {
  updateDashboard();
  updateHistoryTable();
  updateMiniChart();
  const range = $('trend-range-select')?.value || 'days';
  renderTrendChart(range);
  updateAnalyticsSummary(range);
}

function updateDashboard() {
  if (measurements.length === 0) {
    setText('glucose-value', '-');
    setText('glucose-date', 'Brak pomiarów. Dodaj pierwszy pomiar!');
    setHTML('glucose-status', '');
    setHTML('summary-avg', '-');
    setText('summary-count', '0');
    setHTML('summary-min', '-');
    setHTML('summary-max', '-');
    return;
  }
  
  const latest = measurements[measurements.length - 1];
  const g = latest.glucose;
  const status = getGlucoseStatus(g);
  
  const date = new Date(latest.date + 'T' + latest.time);
  const formattedDate = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  
  const valueEl = $('glucose-value');
  if (valueEl) {
    valueEl.textContent = g + ' mg/dL';
    valueEl.className = 'glucose-value ' + getGlucoseClass(g);
  }
  setText('glucose-date', formattedDate);
  setHTML('glucose-status', `<span class="status-icon">${status.icon}</span> ${status.message}`);
  
  const now = Date.now();
  const last24h = measurements.filter(m => now - m.timestamp <= 24 * 60 * 60 * 1000);
  
  if (last24h.length > 0) {
    const values = last24h.map(m => m.glucose);
    const avg = Math.round(values.reduce((a,b) => a+b) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    setHTML('summary-avg', `<span class="${getGlucoseClass(avg)}">${avg} mg/dL</span>`);
    setText('summary-count', last24h.length);
    setHTML('summary-min', `<span class="${getGlucoseClass(min)}">${min} mg/dL</span>`);
    setHTML('summary-max', `<span class="${getGlucoseClass(max)}">${max} mg/dL</span>`);
  } else {
    setHTML('summary-avg', '-');
    setText('summary-count', '0');
    setHTML('summary-min', '-');
    setHTML('summary-max', '-');
  }
}

function updateMiniChart() {
  const miniChartDiv = document.querySelector('#mini-chart');
  if (!miniChartDiv) return;
  
  const now = Date.now();
  const last24h = measurements.filter(m => now - m.timestamp <= 24 * 60 * 60 * 1000);
  
  if (last24h.length === 0) {
    miniChartDiv.innerHTML = '<p><em>Brak pomiarów w ciągu ostatnich 24 godzin</em></p>';
    return;
  }
  
  const recent = [...last24h].sort((a, b) => a.timestamp - b.timestamp).slice(-12);
  const values = recent.map(m => m.glucose);
  const times = recent.map(m => m.time.slice(0, 5));
  
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  
  const chartHTML = `
    <div style="width: 100%; height: 150px; display: flex; align-items: flex-end; justify-content: space-between; padding: 10px 0;">
      ${values.map((val, i) => {
        const heightPercent = range > 0 ? 10 + ((val - minVal) / range * 80) : 50;
        const barColor = getGlucoseColor(val);
        return `
          <div style="display: flex; flex-direction: column; align-items: center; height: 100%;">
            <div style="width: 20px; height: ${heightPercent}%; background: ${barColor}; border-radius: 3px 3px 0 0; 
              transition: height 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="${val} mg/dL - ${times[i]}"></div>
            <div style="margin-top: 5px; font-size: 0.7em; color: #666;">${times[i]}</div>
            <div style="margin-top: 2px; font-size: 0.7em; color: #999; font-weight: bold;">${val}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  miniChartDiv.innerHTML = chartHTML;
}

function updateHistoryTable() {
  const tbody = document.querySelector('#history table tbody');
  if (!tbody) return;
  
  if (measurements.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;"><em>Brak pomiarów</em></td></tr>';
    return;
  }
  
  const sorted = [...measurements].sort((a,b) => b.timestamp - a.timestamp);
  tbody.innerHTML = sorted.map(m => `
    <tr>
      <td>${new Date(m.date).toLocaleDateString('pl-PL')}</td>
      <td>${m.time}</td>
      <td><span class="${getGlucoseClass(m.glucose)}"><strong>${m.glucose} mg/dL</strong></span></td>
      <td>${m.insulin === '-' ? '-' : m.insulin + ' IU'}</td>
      <td>${m.carbs === '-' ? '-' : m.carbs + ' g'}</td>
      <td>${m.note}</td>
    </tr>
  `).join('');
}

function calcAverage(data) {
  if (data.length === 0) return null;
  return Math.round(data.reduce((s, m) => s + m.glucose, 0) / data.length);
}

function renderTrendChart(range = 'days') {
  const placeholder = $('trend-placeholder');
  if (!placeholder) return;
  
  const now = new Date();
  const labels = [], avgs = [];
  
  if (range === 'days') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }));
      const dayData = measurements.filter(m => m.date === d.toISOString().split('T')[0]);
      avgs.push(calcAverage(dayData));
    }
  } else if (range === 'weeks') {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      labels.push(`T${12 - i}`);
      const weekData = measurements.filter(m => {
        const date = new Date(m.date);
        return date >= start && date <= end;
      });
      avgs.push(calcAverage(weekData));
    }
  } else if (range === 'months') {
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(month.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' }));
      const monthData = measurements.filter(m => {
        const date = new Date(m.date);
        return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
      });
      avgs.push(calcAverage(monthData));
    }
  }
  
  const validAvgs = avgs.filter(v => v !== null);
  if (validAvgs.length === 0) {
    placeholder.innerHTML = '<div class="empty-state">Brak danych do wykresu</div>';
    setText('stat-avg', '-');
    setText('stat-range', '-');
    setText('stat-period', '-');
    const trendEl = $('stat-trend');
    if (trendEl) {
      trendEl.textContent = '-';
      trendEl.style.color = '#666';
    }
    return;
  }
  
  const minAvg = Math.min(...validAvgs);
  const maxAvg = Math.max(...validAvgs);
  const rangeAvg = maxAvg - minAvg || 1;
  
  placeholder.innerHTML = `
    <div style="height:200px;display:flex;align-items:flex-end;padding:20px 10px;position:relative">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:space-between;z-index:1;pointer-events:none">
        <div style="border-top:1px dashed rgba(0,0,0,0.1);width:100%"></div>
        <div style="border-top:1px dashed rgba(0,0,0,0.1);width:100%"></div>
        <div style="border-top:1px dashed rgba(0,0,0,0.1);width:100%"></div>
        <div style="border-top:1px dashed rgba(0,0,0,0.1);width:100%"></div>
        <div style="border-top:1px dashed rgba(0,0,0,0.1);width:100%"></div>
      </div>
      <div style="display:flex;align-items:flex-end;width:100%;height:100%;position:relative;z-index:2">
        ${avgs.map((avg, i) => {
          const hasData = avg !== null;
          const color = hasData ? getGlucoseColor(avg) : '#e9ecef';
          const height = avg === null ? 5 : validAvgs.length === 1 ? 50 : Math.round(10 + ((avg - minAvg) / rangeAvg) * 80);
          const displayVal = hasData ? avg + ' mg/dL' : '-';
          
          return `<div style="display:flex;flex-direction:column;align-items:center;height:100%;flex:1;margin:0 2px">
            <div style="width:85%;height:${hasData?'0':'5'}%;background:${color};border-radius:4px 4px 0 0;transition:height .5s;margin-bottom:5px;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.1)" 
              data-target="${height}" title="${hasData?displayVal:'Brak danych'}" onclick="showTooltip(${avg||0},'${labels[i]}')"></div>
            <div style="font-size:.8em;font-weight:bold;color:#333">${displayVal}</div>
            <div style="margin-top:5px;font-size:.7em;color:#666">${labels[i]}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const bars = placeholder.querySelectorAll('[data-target]');
    bars.forEach((bar, i) => {
      const target = bar.getAttribute('data-target');
      if (target && target !== '5') {
        setTimeout(() => bar.style.height = target + '%', i * 80);
      }
    });
  }, 100);
  
  const avg = Math.round(validAvgs.reduce((a, b) => a + b) / validAvgs.length);
  const trend = validAvgs.length > 1 ? ((validAvgs[validAvgs.length - 1] - validAvgs[0]) / validAvgs[0] * 100).toFixed(1) : '0.0';
  const trendVal = parseFloat(trend);
  const periodText = range === 'days' ? 'dni' : range === 'weeks' ? 'tygodni' : 'miesięcy';
  
  setText('stat-avg', avg + ' mg/dL');
  setText('stat-range', `${minAvg}-${maxAvg}`);
  setText('stat-period', `(12 ${periodText})`);
  
  const trendEl = $('stat-trend');
  trendEl.textContent = `${trendVal > 0 ? '↗' : trendVal < 0 ? '↘' : '→'} ${Math.abs(trend)}%`;
  trendEl.style.color = trendVal > 0 ? '#dc3545' : trendVal < 0 ? '#28a745' : '#666';
}

window.showTooltip = function(value, label) {
  if (value === 0) return;
  showNotification(`📊 ${label}: ${value} mg/dL`, 'info');
};

$('trend-range-select')?.addEventListener('change', function() {
  const range = this.value;
  renderTrendChart(range);
  updateAnalyticsSummary(range);
});

function updateAnalyticsSummary(range = 'days') {
  const periodText = range === 'days' ? 'dni' : range === 'weeks' ? 'tygodni' : 'miesięcy';
  setText('summary-title', `Podsumowanie (ostatnie 12 ${periodText})`);
  
  if (measurements.length === 0) {
    setText('avg-glucose', '-');
    setText('time-in-range', '-');
    setText('range-desc', '');
    setText('dist-very-low', '0');
    setText('dist-normal', '0');
    setText('dist-high', '0');
    setText('dist-very-high', '0');
    setText('time-morning', '-');
    setText('time-afternoon', '-');
    setText('time-evening', '-');
    setText('time-night', '-');
    return;
  }
  
  const now = Date.now();
  let periodMs;
  if (range === 'days') periodMs = 12 * 24 * 60 * 60 * 1000;
  else if (range === 'weeks') periodMs = 12 * 7 * 24 * 60 * 60 * 1000;
  else periodMs = 12 * 30 * 24 * 60 * 60 * 1000;
  
  const periodData = measurements.filter(m => now - m.timestamp <= periodMs);
  
  if (periodData.length === 0) {
    setText('avg-glucose', `brak danych z 12 ${periodText}`);
    setText('time-in-range', '-');
    setText('range-desc', '');
    setText('dist-very-low', '0');
    setText('dist-normal', '0');
    setText('dist-high', '0');
    setText('dist-very-high', '0');
    setText('time-morning', '-');
    setText('time-afternoon', '-');
    setText('time-evening', '-');
    setText('time-night', '-');
    return;
  }
  
  const values = periodData.map(m => m.glucose);
  const avg = Math.round(values.reduce((a,b) => a+b) / values.length);
  const veryLow = values.filter(v => v < 70).length;
  const normal = values.filter(v => v >= 70 && v <= 140).length;
  const high = values.filter(v => v > 140 && v <= 180).length;
  const veryHigh = values.filter(v => v > 180).length;
  const inRangePercent = Math.round((normal / values.length) * 100);
  
  const getTimeData = (start, end) => periodData.filter(m => {
    const hour = parseInt(m.time.split(':')[0]);
    return hour >= start && hour < end;
  });
  
  const formatAvg = data => {
    if (data.length === 0) return 'brak danych';
    return `${Math.round(data.reduce((s, m) => s + m.glucose, 0) / data.length)} mg/dL (${data.length})`;
  };
  
  const morning = getTimeData(6, 12);
  const afternoon = getTimeData(12, 18);
  const evening = getTimeData(18, 24);
  const night = getTimeData(0, 6);
  
  setText('avg-glucose', avg + ' mg/dL');
  setText('time-in-range', inRangePercent + '%');
  setText('range-desc', `${normal} z ${values.length} pomiarów`);
  setText('dist-very-low', veryLow);
  setText('dist-normal', normal);
  setText('dist-high', high);
  setText('dist-very-high', veryHigh);
  setText('time-morning', formatAvg(morning));
  setText('time-afternoon', formatAvg(afternoon));
  setText('time-evening', formatAvg(evening));
  setText('time-night', formatAvg(night));
}

// FORMULARZ DODAWANIA POMIARU
const quickForm = $('quick-measurement-form');
if (quickForm) {
  quickForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const glucose = $('quick-glucose').value;
    const insulin = $('quick-insulin').value;
    const carbs = $('quick-carbs').value;
    const note = $('quick-note').value;
    
    if (!glucose) return showNotification('❌ Wprowadź poziom glukozy!', 'error');
    
    const glucoseVal = parseInt(glucose, 10);
    if (isNaN(glucoseVal) || glucoseVal < 20 || glucoseVal > 800) {
      return showNotification('❌ Poziom glukozy musi być w zakresie 20–800 mg/dL', 'error');
    }
    
    const now = new Date();
    const measurement = {
      id: Date.now(),
      glucose: glucoseVal,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0,5),
      insulin: insulin ? parseFloat(insulin) : '-',
      carbs: carbs ? parseInt(carbs, 10) : '-',
      note: note || '-',
      timestamp: now.getTime()
    };
    
    measurements.push(measurement);
    saveUserData();
    updateAllSections();
    quickForm.reset();
    setTimeout(() => showNotification(`✅ Dodano pomiar: ${glucose} mg/dL`, 'success'), 100);
  });
}

// EKSPORT DANYCH
$('export-data')?.addEventListener('click', function(e) {
  e.preventDefault();
  if (measurements.length === 0) return showNotification('Brak danych do eksportu', 'warning');
  
  const dataStr = JSON.stringify(measurements, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `pomiary-glukozy-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('✅ Dane wyeksportowane pomyślnie!', 'success');
});

// GENEROWANIE PRZYKŁADOWYCH DANYCH
$('add-sample-data')?.addEventListener('click', function(e) {
  e.preventDefault();
  
  const today = new Date();
  const sampleData = [];
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const numMeasurements = Math.floor(Math.random() * 4) + 1;
    
    for (let j = 0; j < numMeasurements; j++) {
      const hour = 6 + Math.floor(Math.random() * 15);
      const minute = Math.floor(Math.random() * 60);
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      let glucose;
      const rand = Math.random();
      
      if (i < 7) {
        glucose = 85 + Math.floor(Math.random() * 70);
      } else if (i < 30) {
        if (rand < 0.1) glucose = 65 + Math.floor(Math.random() * 10);
        else if (rand < 0.8) glucose = 80 + Math.floor(Math.random() * 70);
        else glucose = 150 + Math.floor(Math.random() * 40);
      } else {
        if (rand < 0.15) glucose = 60 + Math.floor(Math.random() * 20);
        else if (rand < 0.75) glucose = 85 + Math.floor(Math.random() * 80);
        else if (rand < 0.95) glucose = 165 + Math.floor(Math.random() * 50);
        else glucose = 215 + Math.floor(Math.random() * 60);
      }
      
      sampleData.push({
        id: Date.now() - (i * 100000) - (j * 10000),
        glucose: glucose,
        date: dateStr,
        time: timeStr,
        insulin: Math.random() > 0.4 ? Math.floor(Math.random() * 12) : 0,
        carbs: Math.random() > 0.3 ? Math.floor(Math.random() * 50) : 0,
        note: ['Na czczo', 'Po śniadaniu', 'Po obiedzie', 'Przed snem', 'Po treningu', 'Przed posiłkiem', 'Po posiłku'][Math.floor(Math.random() * 7)],
        timestamp: new Date(`${dateStr}T${timeStr}`).getTime()
      });
    }
  }
  
  measurements = [...measurements, ...sampleData];
  saveUserData();
  updateAllSections();
  setTimeout(() => showNotification(`✅ Dodano ${sampleData.length} przykładowych pomiarów!`, 'success'), 100);
});

// USUWANIE DANYCH
$('clear-all-data')?.addEventListener('click', function(e) {
  e.preventDefault();
  
  if (confirm('⚠️ UWAGA! Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) {
    measurements = [];
    
    if (currentUser && users[currentUser]) {
      users[currentUser].measurements = [];
      Storage.saveUsers(users);
    } else {
      Storage.removeMeasurements();
    }
    
    updateAllSections();
    showNotification('🗑️ Wszystkie dane zostały usunięte', 'warning');
  }
});

// INICJALIZACJA
updateAllSections();

if (measurements.length === 0) {
  setTimeout(() => {
    showNotification('👋 Witaj! Dodaj pierwszy pomiar lub załaduj przykładowe dane w ustawieniach.', 'info');
  }, 1000);
}
