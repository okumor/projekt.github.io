// SYSTEM ZARZĄDZANIA LOCALSTORAGE
const Storage = {
  // Użytkownicy
  getUsers: () => JSON.parse(localStorage.getItem('glucoseUsers')) || {},
  saveUsers: (users) => localStorage.setItem('glucoseUsers', JSON.stringify(users)),
  
  // Aktualny użytkownik
  getCurrentUser: () => JSON.parse(localStorage.getItem('glucoseCurrentUser')) || null,
  saveCurrentUser: (user) => localStorage.setItem('glucoseCurrentUser', JSON.stringify(user)),
  removeCurrentUser: () => localStorage.removeItem('glucoseCurrentUser'),
  
  // Pomiary
  getMeasurements: () => JSON.parse(localStorage.getItem('glucoseMeasurements')) || [],
  saveMeasurements: (data) => localStorage.setItem('glucoseMeasurements', JSON.stringify(data)),
  removeMeasurements: () => localStorage.removeItem('glucoseMeasurements'),
  
  // Motyw
  getTheme: () => localStorage.getItem('glucoseAppTheme'),
  saveTheme: (theme) => localStorage.setItem('glucoseAppTheme', theme)
};
