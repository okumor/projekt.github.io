// =============================================
// INTERAKTYWNY SYSTEM MONITOROWANIA POZIOMU CUKRU
// =============================================

document.addEventListener('DOMContentLoaded', function() {
  // ===== SYSTEM MOTYWU =====
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;
  
  // Sprawdzamy zapisany motyw
  const savedTheme = localStorage.getItem('glucoseAppTheme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = true;
  }
  
  // Obsługa przełącznika dark mode
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
      if (this.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('glucoseAppTheme', 'dark');
      } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('glucoseAppTheme', 'light');
      }
    });
  }

  // ===== SYSTEM KONT UŻYTKOWNIKÓW =====
  let currentUser = JSON.parse(localStorage.getItem('glucoseCurrentUser')) || null;
  let users = JSON.parse(localStorage.getItem('glucoseUsers')) || {};
  let measurements = [];
  
  // Inicjalizacja danych dla aktualnego użytkownika
  function initializeUserData() {
    if (currentUser && users[currentUser]) {
      measurements = users[currentUser].measurements || [];
      updateLoginUI();
      updateUsernameDisplay();
    } else {
      measurements = JSON.parse(localStorage.getItem('glucoseMeasurements')) || [];
    }
  }
  
  function updateUsernameDisplay() {
    const display = document.getElementById('username-display');
    if (display) {
      display.textContent = currentUser ? currentUser : 'Gość';
    }
  }
  
  function updateLoginUI() {
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
    const loggedUserSpan = document.getElementById('logged-user');
    const userIdSpan = document.getElementById('user-id');
    
    if (currentUser) {
      if (loginForm) loginForm.style.display = 'none';
      if (userInfo) userInfo.style.display = 'block';
      if (loggedUserSpan) loggedUserSpan.textContent = currentUser;
      if (userIdSpan) userIdSpan.textContent = users[currentUser]?.userId || 'N/A';
    } else {
      if (loginForm) loginForm.style.display = 'block';
      if (userInfo) userInfo.style.display = 'none';
    }
  }
  
  function showLoginMessage(message, type = 'info') {
    const messageDiv = document.getElementById('login-message');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = type === 'success' ? '#d4edda' : 
                                       type === 'error' ? '#f8d7da' : 
                                       type === 'warning' ? '#fff3cd' : '#d1ecf1';
    messageDiv.style.color = type === 'success' ? '#155724' : 
                             type === 'error' ? '#721c24' : 
                             type === 'warning' ? '#856404' : '#0c5460';
    messageDiv.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : 
                               type === 'error' ? '#f5c6cb' : 
                               type === 'warning' ? '#ffeaa7' : '#bee5eb'}`;
    
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
  
  // Rejestracja użytkownika
  document.getElementById('register-btn')?.addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
      showLoginMessage('Wprowadź nazwę użytkownika i hasło', 'warning');
      return;
    }
    
    if (username.length < 3) {
      showLoginMessage('Nazwa użytkownika musi mieć co najmniej 3 znaki', 'warning');
      return;
    }
    
    if (password.length < 4) {
      showLoginMessage('Hasło musi mieć co najmniej 4 znaki', 'warning');
      return;
    }
    
    if (users[username]) {
      showLoginMessage('Użytkownik już istnieje', 'error');
      return;
    }
    
    // Tworzenie nowego użytkownika
    users[username] = {
      password: password, // W prawdziwej aplikacji powinno być hashowane!
      userId: 'user_' + Date.now(),
      measurements: [],
      createdAt: new Date().toISOString(),
      settings: {}
    };
    
    localStorage.setItem('glucoseUsers', JSON.stringify(users));
    showLoginMessage('Konto zostało utworzone! Możesz się zalogować', 'success');
    
    // Czyścimy formularz
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
  });
  
  // Logowanie
  document.getElementById('login-btn')?.addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
      showLoginMessage('Wprowadź nazwę użytkownika i hasło', 'warning');
      return;
    }
    
    if (!users[username]) {
      showLoginMessage('Użytkownik nie istnieje', 'error');
      return;
    }
    
    if (users[username].password !== password) {
      showLoginMessage('Nieprawidłowe hasło', 'error');
      return;
    }
    
    currentUser = username;
    localStorage.setItem('glucoseCurrentUser', JSON.stringify(currentUser));
    
    // Przenosimy stare dane do konta użytkownika (jeśli istnieją)
    const oldMeasurements = JSON.parse(localStorage.getItem('glucoseMeasurements')) || [];
    if (oldMeasurements.length > 0 && users[currentUser].measurements.length === 0) {
      users[currentUser].measurements = [...oldMeasurements];
      localStorage.removeItem('glucoseMeasurements');
    }
    
    localStorage.setItem('glucoseUsers', JSON.stringify(users));
    
    initializeUserData();
    updateAllSections();
    showLoginMessage(`Witaj ${username}!`, 'success');
    showNotification(`👋 Witaj ${username}!`, 'success');
  });
  
  // Wylogowanie
  document.getElementById('logout-btn')?.addEventListener('click', function() {
    currentUser = null;
    localStorage.removeItem('glucoseCurrentUser');
    measurements = JSON.parse(localStorage.getItem('glucoseMeasurements')) || [];
    updateUsernameDisplay();
    updateLoginUI();
    updateAllSections();
    showLoginMessage('Wylogowano pomyślnie', 'info');
    showNotification('👋 Wylogowano pomyślnie', 'info');
  });
  
  // Inicjalizacja UI logowania
  updateUsernameDisplay();
  updateLoginUI();
  initializeUserData();
  
  // ===== PRZECHOWYWANIE DANYCH =====
  function saveUserData() {
    if (currentUser && users[currentUser]) {
      users[currentUser].measurements = measurements;
      localStorage.setItem('glucoseUsers', JSON.stringify(users));
    } else {
      localStorage.setItem('glucoseMeasurements', JSON.stringify(measurements));
    }
  }
  
  // ===== MENU SPA =====
  const menuLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('main section');

  menuLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');

      sections.forEach(sec => {
        if (targetId === 'dashboard') {
          if (sec.id === 'dashboard') sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        } else {
          if (sec.id === targetId) sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        }
      });

      if (targetId === 'analytics') {
        setTimeout(() => {
          const rangeSelect = document.getElementById('trend-range-select');
          const range = rangeSelect ? rangeSelect.value : 'days';
          renderTrendChart(range);
          updateAnalyticsSummary();
        }, 120);
      }
    });
  });

  // ===== POMOCNICZE FUNKCJE =====
  function getGlucoseClass(value) {
    if (value < 50) return 'glucose-very-low';
    if (value < 70) return 'glucose-low';
    if (value <= 140) return 'glucose-normal';
    if (value <= 180) return 'glucose-high';
    return 'glucose-very-high';
  }

  function getGlucoseColor(value) {
    if (value < 50) return '#dc3545';
    if (value < 70) return '#ffc107';
    if (value <= 140) return '#28a745';
    if (value <= 180) return '#ffc107';
    return '#dc3545';
  }

  function showNotification(message, type = 'info') {
    let notification = document.getElementById('system-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'system-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.3s, transform 0.3s;
      `;
      document.body.appendChild(notification);
    }
    
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
    }, 3000);
  }

  // ===== AKTUALIZACJA WSZYSTKICH SEKCJI =====
  function updateAllSections() {
    updateDashboard();
    updateHistoryTable();
    updateMiniChart();
    updateAnalyticsSummary();
    
    const rangeSelect = document.getElementById('trend-range-select');
    const range = rangeSelect ? rangeSelect.value : 'days';
    renderTrendChart(range);
  }

  // ===== DASHBOARD =====
  function updateDashboard() {
    const currentGlucoseCard = document.querySelector('#current-glucose-card p');
    const summaryList = document.querySelector('#daily-summary ul');
    
    if (measurements.length === 0) {
      if (currentGlucoseCard) {
        currentGlucoseCard.innerHTML = '<em>Brak pomiarów. Dodaj pierwszy pomiar!</em>';
      }
      if (summaryList) {
        summaryList.innerHTML = '<li><em>Brak danych do wyświetlenia</em></li>';
      }
      return;
    }
    
    // Najnowszy pomiar
    const latest = measurements[measurements.length - 1];
    if (currentGlucoseCard) {
      const glucoseClass = getGlucoseClass(latest.glucose);
      const g = latest.glucose;
      
      let statusMsg = 'prawidłowy poziom cukru';
      let statusIcon = '✅';
      if (g < 50) { statusMsg = 'Bardzo niski cukier'; statusIcon = '⚠️'; }
      else if (g < 70) { statusMsg = 'Niski cukier'; statusIcon = '⚠️'; }
      else if (g <= 140) { statusMsg = 'Prawidłowy poziom cukru'; statusIcon = '✅'; }
      else if (g <= 180) { statusMsg = 'Za wysoki poziom cukru'; statusIcon = '⚠️'; }
      else { statusMsg = 'Bardzo wysoki cukier'; statusIcon = '🚨'; }

      const date = new Date(latest.date + 'T' + latest.time);
      const formattedDate = date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      currentGlucoseCard.innerHTML = `
        <span class="${glucoseClass}" style="font-size: 2em; font-weight: bold; display: block; margin-bottom: 10px;">
          ${g} mg/dL
        </span>
        <small style="color: #666;">${formattedDate}</small>
        <div class="glucose-status-message" style="margin-top:10px; font-weight:600; padding: 10px; background: #f8f9fa; border-radius: 5px;">
          ${statusIcon} ${statusMsg}
        </div>
      `;
    }
    
    // Statystyki ostatnich 24h
    const now = Date.now();
    const last24h = measurements.filter(m => now - m.timestamp <= 24 * 60 * 60 * 1000);
    
    if (last24h.length > 0) {
      const values = last24h.map(m => m.glucose);
      const avg = Math.round(values.reduce((a,b) => a+b) / values.length);
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      const summaryHTML = `
        <li><strong>Średni poziom glukozy:</strong> <span class="${getGlucoseClass(avg)}">${avg} mg/dL</span></li>
        <li><strong>Liczba pomiarów:</strong> ${last24h.length}</li>
        <li><strong>Minimalna wartość:</strong> <span class="${getGlucoseClass(min)}">${min} mg/dL</span></li>
        <li><strong>Maksymalna wartość:</strong> <span class="${getGlucoseClass(max)}">${max} mg/dL</span></li>
      `;
      
      if (summaryList) summaryList.innerHTML = summaryHTML;
    }
  }

  // ===== MINI WYKRES 24H =====
  function updateMiniChart() {
    const miniChartDiv = document.querySelector('#mini-chart');
    if (!miniChartDiv) return;
    
    const chartContent = miniChartDiv.querySelector('p') || document.createElement('p');
    
    // Pobieramy pomiary z ostatnich 24h
    const now = Date.now();
    const last24h = measurements.filter(m => now - m.timestamp <= 24 * 60 * 60 * 1000);
    
    if (last24h.length === 0) {
      chartContent.innerHTML = '<em>Brak pomiarów w ciągu ostatnich 24 godzin</em>';
      if (!miniChartDiv.querySelector('p')) miniChartDiv.appendChild(chartContent);
      return;
    }
    
    // Sortujemy od najstarszego do najnowszego, potem wybieramy ostatnie 12 pomiarów
    const sorted = [...last24h].sort((a, b) => a.timestamp - b.timestamp);

    // Jeśli jest więcej niż 12 pomiarów, bierzemy tylko 12 najnowszych
    const recent = sorted.length > 12 ? sorted.slice(-12) : sorted;

    // Przygotowujemy dane (ostatnie 12 pomiarów)
    const values = recent.map(m => m.glucose);
    const times = recent.map(m => {
      const hour = parseInt(m.time.substring(0, 2));
      const minute = m.time.substring(3, 5);
      return `${hour}:${minute}`;
    });
    
    // Obliczamy zakres dla skalowania (słupki rosną DO GÓRY)
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;
    
    // Tworzymy wykres słupkowy
    const chartHTML = `
      <div style="width: 100%; height: 150px; display: flex; align-items: flex-end; justify-content: space-between; padding: 10px 0;">
        ${values.map((val, index) => {
          // Wysokość słupka: im większa wartość, tym wyższy słupek
          const heightPercent = range > 0 ? 10 + ((val - minVal) / range * 80) : 50;
          const barColor = getGlucoseColor(val);
          
          return `
            <div style="display: flex; flex-direction: column; align-items: center; height: 100%;">
              <div style="
                width: 20px;
                height: ${heightPercent}%;
                background: ${barColor};
                border-radius: 3px 3px 0 0;
                transition: height 0.3s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              " title="${val} mg/dL - ${times[index]}"></div>
              <div style="margin-top: 5px; font-size: 0.7em; color: #666;">${times[index]}</div>
              <div style="margin-top: 2px; font-size: 0.7em; color: #999; font-weight: bold;">${val}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    chartContent.innerHTML = chartHTML;
    if (!miniChartDiv.querySelector('p')) miniChartDiv.appendChild(chartContent);
  }

  // ===== HISTORIA POMIARÓW =====
  function updateHistoryTable() {
    const tbody = document.querySelector('#history table tbody');
    if (!tbody) return;
    
    if (measurements.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <em>Brak pomiarów. Dodaj pierwszy pomiar!</em>
          </td>
        </tr>
      `;
      return;
    }
    
    const sorted = [...measurements].sort((a,b) => b.timestamp - a.timestamp);
    
    tbody.innerHTML = sorted.map(measurement => {
      const date = new Date(measurement.date);
      const formattedDate = date.toLocaleDateString('pl-PL');
      
      return `
        <tr>
          <td>${formattedDate}</td>
          <td>${measurement.time}</td>
          <td>
            <span class="${getGlucoseClass(measurement.glucose)}">
              <strong>${measurement.glucose} mg/dL</strong>
            </span>
          </td>
          <td>${measurement.insulin === '-' ? '-' : measurement.insulin + ' IU'}</td>
          <td>${measurement.carbs === '-' ? '-' : measurement.carbs + ' g'}</td>
          <td>${measurement.note}</td>
        </tr>
      `;
    }).join('');
  }

  // ===== WYKRES TRENDÓW (12 dni/tygodni/miesięcy) =====
  function renderTrendChart(range = 'days') {
    const placeholder = document.getElementById('trend-placeholder');
    const statsDiv = document.getElementById('chart-stats');
    if (!placeholder) return;
    
    const now = new Date();
    let labels = [];
    let avgs = [];
    let periodCount = 12;
    
    if (range === 'days') {
      // Ostatnie 12 dni
      for (let i = periodCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }));
        
        const dayMeasurements = measurements.filter(m => m.date === iso);
        if (dayMeasurements.length === 0) {
          avgs.push(null);
        } else {
          const avg = Math.round(dayMeasurements.reduce((s, m) => s + m.glucose, 0) / dayMeasurements.length);
          avgs.push(avg);
        }
      }
    } else if (range === 'weeks') {
      // Ostatnie 12 tygodni
      for (let i = periodCount - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        labels.push(`T${periodCount - i}`);
        
        const weekMeasurements = measurements.filter(m => {
          const date = new Date(m.date);
          return date >= weekStart && date <= weekEnd;
        });
        
        if (weekMeasurements.length > 0) {
          const avg = Math.round(weekMeasurements.reduce((s, m) => s + m.glucose, 0) / weekMeasurements.length);
          avgs.push(avg);
        } else {
          avgs.push(null);
        }
      }
    } else if (range === 'months') {
      // Ostatnie 12 miesięcy
      for (let i = periodCount - 1; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(month.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' }));
        
        const monthMeasurements = measurements.filter(m => {
          const date = new Date(m.date);
          return date.getFullYear() === month.getFullYear() && 
                 date.getMonth() === month.getMonth();
        });
        
        if (monthMeasurements.length > 0) {
          const avg = Math.round(monthMeasurements.reduce((s, m) => s + m.glucose, 0) / monthMeasurements.length);
          avgs.push(avg);
        } else {
          avgs.push(null);
        }
      }
    }
    
    const validAvgs = avgs.filter(v => v !== null);
    if (validAvgs.length === 0) {
      placeholder.innerHTML = '<div class="empty-state">Brak danych do wykresu</div>';
      if (statsDiv) statsDiv.innerHTML = '';
      return;
    }
    
    const minAvg = Math.min(...validAvgs);
    const maxAvg = Math.max(...validAvgs);
    const rangeAvg = maxAvg - minAvg || 1;
    
    // Tworzymy HTML wykresu
    placeholder.innerHTML = `
      <div style="height: 200px; display: flex; align-items: flex-end; justify-content: space-between; padding: 20px 10px; position: relative;">
        <!-- Linie pomocnicze -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; justify-content: space-between; z-index: 1; pointer-events: none;">
          ${[0, 0.25, 0.5, 0.75, 1].map(pct => `
            <div style="border-top: 1px dashed rgba(0,0,0,0.1); width: 100%;"></div>
          `).join('')}
        </div>
        
        <!-- Słupki -->
        <div style="display: flex; align-items: flex-end; justify-content: space-between; width: 100%; height: 100%; position: relative; z-index: 2;">
          ${avgs.map((avg, idx) => {
            let heightPct;
            if (avg === null) heightPct = 5;
            else if (validAvgs.length === 1) heightPct = 50;
            else heightPct = Math.round(10 + ((avg - minAvg) / rangeAvg) * 80);
            
            const displayVal = avg === null ? '-' : (avg + ' mg/dL');
            const hasData = avg !== null;
            const barColor = hasData ? getGlucoseColor(avg) : '#e9ecef';
            
            return `
              <div style="display: flex; flex-direction: column; align-items: center; height: 100%; flex: 1; margin: 0 2px;">
                <div style="
                  width: 85%;
                  height: ${hasData ? '0%' : '5%'};
                  background: ${barColor};
                  border-radius: 4px 4px 0 0;
                  transition: height 0.5s;
                  margin-bottom: 5px;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                " data-target="${heightPct}" title="${hasData ? displayVal : 'Brak danych'}" onclick="showTooltip(${avg || 0}, '${labels[idx]}')"></div>
                <div style="font-size: 0.8em; font-weight: bold; color: #333; text-align: center;">${displayVal}</div>
                <div style="margin-top: 5px; font-size: 0.7em; color: #666; text-align: center;">${labels[idx]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    // Animacja słupków
    setTimeout(() => {
      const bars = placeholder.querySelectorAll('[data-target]');
      bars.forEach((bar, i) => {
        const target = bar.getAttribute('data-target');
        if (target && target !== '5') {
          setTimeout(() => {
            bar.style.height = target + '%';
          }, i * 80);
        }
      });
    }, 100);
    
    // Aktualizacja statystyk wykresu
    if (statsDiv && validAvgs.length > 0) {
      const avg = Math.round(validAvgs.reduce((a, b) => a + b) / validAvgs.length);
      const min = Math.min(...validAvgs);
      const max = Math.max(...validAvgs);
      const trend = validAvgs.length > 1 ? 
        ((validAvgs[validAvgs.length - 1] - validAvgs[0]) / validAvgs[0] * 100).toFixed(1) : '0.0';
      
      const rangeText = range === 'days' ? 'dni' : range === 'weeks' ? 'tygodni' : 'miesięcy';
      
      statsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
          <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
            <div style="font-size: 0.8em; color: #666;">Średnia</div>
            <div style="font-size: 1.2em; font-weight: bold; color: #1e3a8a;">${avg} mg/dL</div>
          </div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
            <div style="font-size: 0.8em; color: #666;">Zakres</div>
            <div style="font-size: 1.2em; font-weight: bold; color: #1e3a8a;">${min}-${max}</div>
          </div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
            <div style="font-size: 0.8em; color: #666;">Trend (12 ${rangeText})</div>
            <div style="font-size: 1.2em; font-weight: bold; color: ${parseFloat(trend) > 0 ? '#dc3545' : parseFloat(trend) < 0 ? '#28a745' : '#666'}">
              ${parseFloat(trend) > 0 ? '↗' : parseFloat(trend) < 0 ? '↘' : '→'} ${Math.abs(trend)}%
            </div>
          </div>
        </div>
      `;
    }
  }
  
  // Funkcja do wyświetlania tooltipa
  window.showTooltip = function(value, label) {
    if (value === 0) return; // Pomijamy puste słupki
    
    showNotification(`📊 ${label}: ${value} mg/dL`, 'info');
  };

  // ===== OBSŁUGA ZMIANY ZAKRESU WYKRESU =====
  document.getElementById('trend-range-select')?.addEventListener('change', function() {
    renderTrendChart(this.value);
  });

  // ===== PODSUMOWANIE ANALIZ =====
  function updateAnalyticsSummary() {
    const summaryDiv = document.getElementById('analytics-summary');
    if (!summaryDiv) return;
    
    if (measurements.length === 0) {
      summaryDiv.innerHTML = '<div class="empty-state">Brak danych do analizy</div>';
      return;
    }
    
    // Ostatnie 30 dni
    const now = Date.now();
    const last30Days = measurements.filter(m => now - m.timestamp <= 30 * 24 * 60 * 60 * 1000);
    
    if (last30Days.length === 0) {
      summaryDiv.innerHTML = '<div class="empty-state">Brak pomiarów z ostatnich 30 dni</div>';
      return;
    }
    
    const values = last30Days.map(m => m.glucose);
    const avg = Math.round(values.reduce((a,b) => a+b) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Rozkład poziomów
    const veryLow = values.filter(v => v < 70).length;
    const normal = values.filter(v => v >= 70 && v <= 140).length;
    const high = values.filter(v => v > 140 && v <= 180).length;
    const veryHigh = values.filter(v => v > 180).length;
    
    const inRangePercent = Math.round((normal / values.length) * 100);
    
    // Analiza por dnia
    const morning = last30Days.filter(m => {
      const hour = parseInt(m.time.split(':')[0]);
      return hour >= 6 && hour < 12;
    });
    
    const afternoon = last30Days.filter(m => {
      const hour = parseInt(m.time.split(':')[0]);
      return hour >= 12 && hour < 18;
    });
    
    const evening = last30Days.filter(m => {
      const hour = parseInt(m.time.split(':')[0]);
      return hour >= 18 && hour < 24;
    });
    
    const calculateAvg = (data) => data.length > 0 
      ? Math.round(data.reduce((sum, m) => sum + m.glucose, 0) / data.length)
      : 'brak danych';
    
    summaryDiv.innerHTML = `
      <div style="padding: 15px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.9em; color: #666;">Średni poziom</div>
            <div style="font-size: 2em; font-weight: bold; color: #1e3a8a;">${avg} mg/dL</div>
            <div style="font-size: 0.8em; color: #666;">ostatnie 30 dni</div>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.9em; color: #666;">Czas w zakresie</div>
            <div style="font-size: 2em; font-weight: bold; color: #28a745;">${inRangePercent}%</div>
            <div style="font-size: 0.8em;">${normal} z ${values.length} pomiarów</div>
          </div>
        </div>
        
        <!-- Rozkład poziomów -->
        <h4 style="color: #1e3a8a; margin: 20px 0 10px 0;">Rozkład poziomów glukozy</h4>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
          <div style="background: rgba(220, 53, 69, 0.1); padding: 10px; border-radius: 6px; border-left: 4px solid #dc3545; text-align: center;">
            <div style="font-size: 0.8em; color: #666;">Bardzo niski</div>
            <div style="font-size: 1.2em; font-weight: bold;">${veryLow}</div>
            <div style="font-size: 0.7em; color: #666;">(&lt;70)</div>
          </div>
          <div style="background: rgba(40, 167, 69, 0.1); padding: 10px; border-radius: 6px; border-left: 4px solid #28a745; text-align: center;">
            <div style="font-size: 0.8em; color: #666;">W normie</div>
            <div style="font-size: 1.2em; font-weight: bold;">${normal}</div>
            <div style="font-size: 0.7em; color: #666;">(70-140)</div>
          </div>
          <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 6px; border-left: 4px solid #ffc107; text-align: center;">
            <div style="font-size: 0.8em; color: #666;">Wysoki</div>
            <div style="font-size: 1.2em; font-weight: bold;">${high}</div>
            <div style="font-size: 0.7em; color: #666;">(141-180)</div>
          </div>
          <div style="background: rgba(220, 53, 69, 0.2); padding: 10px; border-radius: 6px; border-left: 4px solid #dc3545; text-align: center;">
            <div style="font-size: 0.8em; color: #666;">Bardzo wysoki</div>
            <div style="font-size: 1.2em; font-weight: bold;">${veryHigh}</div>
            <div style="font-size: 0.7em; color: #666;">(&gt;180)</div>
          </div>
        </div>
        
        <!-- Analiza por dnia -->
        <h4 style="color: #1e3a8a; margin: 20px 0 10px 0;">Średnie według pory dnia</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div style="padding: 12px; background: #e8f4f8; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.9em; color: #666;">🌅 Poranne (6-12)</div>
            <div style="font-size: 1.5em; font-weight: bold;">${calculateAvg(morning)}</div>
            <div style="font-size: 0.8em; color: #666;">${morning.length} pomiarów</div>
          </div>
          <div style="padding: 12px; background: #f0f8e8; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.9em; color: #666;">🌞 Popołudniowe (12-18)</div>
            <div style="font-size: 1.5em; font-weight: bold;">${calculateAvg(afternoon)}</div>
            <div style="font-size: 0.8em; color: #666;">${afternoon.length} pomiarów</div>
          </div>
          <div style="padding: 12px; background: #f8f0e8; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.9em; color: #666;">🌆 Wieczorne (18-24)</div>
            <div style="font-size: 1.5em; font-weight: bold;">${calculateAvg(evening)}</div>
            <div style="font-size: 0.8em; color: #666;">${evening.length} pomiarów</div>
          </div>
        </div>
      </div>
    `;
  }

  // ===== OBSŁUGA FORMULARZA =====
  const quickForm = document.getElementById('quick-measurement-form');
  if (quickForm) {
    quickForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const glucose = document.getElementById('quick-glucose').value;
      const insulin = document.getElementById('quick-insulin').value;
      const carbs = document.getElementById('quick-carbs').value;
      const note = document.getElementById('quick-note').value;
      
      if (!glucose) {
        showNotification('❌ Wprowadź poziom glukozy!', 'error');
        return;
      }

      const glucoseVal = parseInt(glucose, 10);
      if (isNaN(glucoseVal) || glucoseVal < 20 || glucoseVal > 800) {
        showNotification('❌ Poziom glukozy musi być w zakresie 20–800 mg/dL', 'error');
        return;
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
      
      showNotification(`✅ Dodano pomiar: ${glucose} mg/dL`, 'success');
    });
  }

  // ===== EKSPORT DANYCH =====
  document.getElementById('export-data')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    if (measurements.length === 0) {
      showNotification('Brak danych do eksportu', 'warning');
      return;
    }
    
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

  // ===== DODAWANIE PRZYKŁADOWYCH DANYCH =====
  document.getElementById('add-sample-data')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    const today = new Date();
    const sampleData = [];
    
    // Generujemy 90 dni danych (dla wszystkich zakresów)
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 1-4 pomiarów dziennie
      const numMeasurements = Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < numMeasurements; j++) {
        const hour = 6 + Math.floor(Math.random() * 15); // 6-21
        const minute = Math.floor(Math.random() * 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Realistyczne wartości glukozy
        let glucose;
        const rand = Math.random();
        if (i < 7) {
          // Ostatni tydzień: lepsza kontrola
          glucose = 85 + Math.floor(Math.random() * 70);
        } else if (i < 30) {
          // Ostatni miesiąc: normalna kontrola
          if (rand < 0.1) glucose = 65 + Math.floor(Math.random() * 10);
          else if (rand < 0.8) glucose = 80 + Math.floor(Math.random() * 70);
          else glucose = 150 + Math.floor(Math.random() * 40);
        } else {
          // Starsze dane: większa zmienność
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
    
    // Dodajemy do istniejących danych
    measurements = [...measurements, ...sampleData];
    saveUserData();
    
    updateAllSections();
    showNotification(`✅ Dodano ${sampleData.length} przykładowych pomiarów!`, 'success');
  });

  // ===== USUWANIE DANYCH =====
  document.getElementById('clear-all-data')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    if (confirm('⚠️ UWAGA! Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) {
      measurements = [];
      if (currentUser && users[currentUser]) {
        users[currentUser].measurements = [];
        localStorage.setItem('glucoseUsers', JSON.stringify(users));
      } else {
        localStorage.removeItem('glucoseMeasurements');
      }
      updateAllSections();
      showNotification('🗑️ Wszystkie dane zostały usunięte', 'warning');
    }
  });

  // ===== INICJALIZACJA =====
  updateAllSections();
  
  // Jeśli brak danych, pokaż komunikat
  if (measurements.length === 0) {
    setTimeout(() => {
      showNotification('👋 Witaj! Dodaj pierwszy pomiar lub załaduj przykładowe dane w ustawieniach.', 'info');
    }, 1000);
  }
});