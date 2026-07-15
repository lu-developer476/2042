const translations = {
  es: {
    navPlay: 'Nueva partida', navLeaderboard: 'Ranking', navAdmin: 'Admin', themeToggle: '🌙/☀️',
    heroEyebrow: 'Defensa táctica futurista', heroTitle: 'Protegé el núcleo. Resistí hasta el colapso de la oleada final.',
    heroCopy: 'Colocá torres en nodos predefinidos, mejoralas hasta nivel 5 y detené drones, tanques mecánicos y señales fantasma. Ahora contás con habilidades tácticas, combo de bajas, velocidad x2 y vista previa de amenazas.',
    pilotName: 'Nombre del piloto', pilotPlaceholder: 'Ej: Lu', startSimulation: 'Confirmar partida', loginCopy: 'No requiere login. El ranking guarda nombre, score, oleadas y bajas.',
    credits: 'Créditos', wave: 'Oleada', kills: 'Bajas', startWave: 'Iniciar oleada', pause: 'Pausar', resume: 'Reanudar', restart: 'Reiniciar',
    nextThreat: 'Próxima amenaza', combo: 'Combo táctico', speed: 'Velocidad', speedToggle: 'Velocidad x2', towers: 'Torres', shopHelp: 'Click en un nodo libre para construir la torre seleccionada.', selectedTower: 'Torre seleccionada', selectedHelp: 'Seleccioná una torre ya construida para ver stats, nivel y mejora siguiente.', fullLeaderboard: 'Ver ranking completo', emptyLeaderboard: 'Todavía no hay registros. Sé el primero en romper la simulación.',
    empAbility: 'EMP global (160c)', repairAbility: 'Reparar core (120c)', overclockAbility: 'Overclock torre (90c)',
  },
  en: {
    navPlay: 'New game', navLeaderboard: 'Leaderboard', navAdmin: 'Admin', themeToggle: '🌙/☀️',
    heroEyebrow: 'Futuristic tactical defense', heroTitle: 'Protect the core. Survive until the final wave collapses.',
    heroCopy: 'Place towers on fixed nodes, upgrade them to level 5, and stop drones, mech tanks, and ghost signals. You now have tactical abilities, kill combos, x2 speed, and threat previews.',
    pilotName: 'Pilot name', pilotPlaceholder: 'Ex: Lu', startSimulation: 'Confirm match', loginCopy: 'No login required. The leaderboard stores name, score, waves, and kills.',
    credits: 'Credits', wave: 'Wave', kills: 'Kills', startWave: 'Start wave', pause: 'Pause', resume: 'Resume', restart: 'Restart',
    nextThreat: 'Next threat', combo: 'Tactical combo', speed: 'Speed', speedToggle: 'Speed x2', towers: 'Towers', shopHelp: 'Click an empty node to build the selected tower.', selectedTower: 'Selected tower', selectedHelp: 'Select a built tower to inspect stats, level, and the next upgrade.', fullLeaderboard: 'See full leaderboard', emptyLeaderboard: 'No records yet. Be the first to break the simulation.',
    empAbility: 'Global EMP (160c)', repairAbility: 'Repair core (120c)', overclockAbility: 'Overclock tower (90c)',
  },
};


function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
  dialog.classList.remove('is-open');
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
    return;
  }
  dialog.setAttribute('open', '');
  dialog.classList.add('is-open');
}

function initDialogTriggers() {
  document.querySelectorAll('[data-dialog-target]').forEach((trigger) => {
    if (trigger.dataset.dialogReady === 'true') return;
    trigger.dataset.dialogReady = 'true';
    trigger.addEventListener('click', () => {
      const dialog = document.getElementById(trigger.dataset.dialogTarget);
      openDialog(dialog);
    });
  });

  document.querySelectorAll('.info-dialog').forEach((dialog) => {
    if (dialog.dataset.dialogCloseReady === 'true') return;
    dialog.dataset.dialogCloseReady = 'true';
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-dialog-close]')) {
        closeDialog(dialog);
      }
    });
  });
}

function applyLanguage(language) {
  const dictionary = translations[language] || translations.es;
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = dictionary[element.dataset.i18n];
    if (value) element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const value = dictionary[element.dataset.i18nPlaceholder];
    if (value) element.placeholder = value;
  });
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language, dictionary } }));
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

const storedLanguage = localStorage.getItem('2042-language') || 'es';
const storedTheme = localStorage.getItem('2042-theme') || 'dark';
applyTheme(storedTheme);

document.addEventListener('DOMContentLoaded', () => {
  initDialogTriggers();
  applyLanguage(storedLanguage);
  document.getElementById('language-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.lang === 'es' ? 'en' : 'es';
    localStorage.setItem('2042-language', next);
    applyLanguage(next);
  });
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('2042-theme', next);
    applyTheme(next);
  });
});

window.I18N_2042 = { translations, applyLanguage, initDialogTriggers, openDialog, closeDialog };
