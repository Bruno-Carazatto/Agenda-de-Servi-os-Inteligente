(() => {
  "use strict";

  // ---------- Elementos ----------
  const daysGrid = document.getElementById("daysGrid");
  const monthsMini = document.getElementById("monthsMini");
  const txtMonthYear = document.getElementById("txtMonthYear");

  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnAddEvent = document.getElementById("btnAddEvent");

  const eventsBannerText = document.getElementById("eventsBannerText");
  const eventList = document.getElementById("eventList");

  const modalEl = document.getElementById("modalEvent");
  const modal = new bootstrap.Modal(modalEl);

  const eventForm = document.getElementById("eventForm");
  const evtTitle = document.getElementById("evtTitle");
  const evtTime = document.getElementById("evtTime");
  const evtDuration = document.getElementById("evtDuration");
  const evtNote = document.getElementById("evtNote");
  const selectedDateText = document.getElementById("selectedDateText");

  const themeDots = Array.from(document.querySelectorAll(".theme-dot"));

  // ---------- Constantes ----------
  const STORAGE_KEY = "agenda_servicos_events_v1";
  const STORAGE_THEME = "agenda_servicos_theme_v1";

  const MONTHS_MINI = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const THEMES = {
    azul:   { panel:"#1f7aff", accent:"#2a6bff", bg:"#f5f8ff" },
    green:  { panel:"#19c37d", accent:"#12b76a", bg:"#f4fffa" },
    laranja:{ panel:"#ff8a00", accent:"#ff7a00", bg:"#fff7ef" },
    red:    { panel:"#ff3b30", accent:"#ff453a", bg:"#fff5f5" },
    roxo:   { panel:"#6f2cf3", accent:"#7a36ff", bg:"#f6f7fb" }
  };

  // ---------- Tema ----------
  function applyTheme(themeKey) {
    const key = (themeKey && THEMES[themeKey]) ? themeKey : "roxo";
    const t = THEMES[key];

    // vars
    document.documentElement.style.setProperty("--panel-color", t.panel);
    document.documentElement.style.setProperty("--accent-color", t.accent);
    document.documentElement.style.setProperty("--bg", t.bg);

    // classes do body (fundo vem do CSS)
    document.body.classList.remove("theme-azul","theme-green","theme-laranja","theme-red","theme-roxo");
    document.body.classList.add(`theme-${key}`);

    // bolinhas
    themeDots.forEach(btn => btn.classList.toggle("active", btn.dataset.theme === key));

    try { localStorage.setItem(STORAGE_THEME, key); } catch {}
  }

  function loadTheme() {
    try {
      const key = localStorage.getItem(STORAGE_THEME);
      return key && THEMES[key] ? key : "roxo";
    } catch {
      return "roxo";
    }
  }

  // ---------- Estado calendário ----------
  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let selectedDate = new Date(viewYear, viewMonth, now.getDate());

  // ---------- Storage Eventos ----------
  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveEvents(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatPrettyDate(d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  function formatBanner(d, qty) {
    const dia = d.getDate();
    const mes = MONTHS_FULL[d.getMonth()];
    if (qty <= 0) return `Não há eventos para ${dia} de ${mes}.`;
    if (qty === 1) return `1 evento agendado para ${dia} de ${mes}.`;
    return `${qty} eventos agendados para ${dia} de ${mes}.`;
  }

  // ---------- Render ----------
  function renderMonthsMini() {
    monthsMini.innerHTML = "";
    MONTHS_MINI.forEach((m, idx) => {
      const span = document.createElement("span");
      span.textContent = m;
      if (idx === viewMonth) span.classList.add("active");
      span.addEventListener("click", () => {
        viewMonth = idx;
        const maxDay = new Date(viewYear, viewMonth + 1, 0).getDate();
        const newDay = Math.min(selectedDate.getDate(), maxDay);
        selectedDate = new Date(viewYear, viewMonth, newDay);
        renderAll();
      });
      monthsMini.appendChild(span);
    });
  }

  function renderCalendarGrid() {
    daysGrid.innerHTML = "";

    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);

    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const allEvents = loadEvents();
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`;
    const daysWithEvents = new Set(
      allEvents
        .filter(ev => typeof ev.dateKey === "string" && ev.dateKey.startsWith(monthPrefix))
        .map(ev => ev.dateKey)
    );

    for (let i = 0; i < startWeekday; i++) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "day muted";
      empty.textContent = "";
      daysGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      btn.textContent = String(day);

      const thisDate = new Date(viewYear, viewMonth, day);
      const thisKey = getDateKey(thisDate);

      if (getDateKey(selectedDate) === thisKey) btn.classList.add("selected");
      if (daysWithEvents.has(thisKey)) btn.classList.add("has-event");

      btn.addEventListener("click", () => {
        selectedDate = thisDate;
        renderAll();
      });

      daysGrid.appendChild(btn);
    }

    const totalCells = startWeekday + totalDays;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
      const toAdd = 7 - remainder;
      for (let i = 0; i < toAdd; i++) {
        const empty = document.createElement("button");
        empty.type = "button";
        empty.className = "day muted";
        empty.textContent = "";
        daysGrid.appendChild(empty);
      }
    }
  }

  function renderEventPanel() {
    const key = getDateKey(selectedDate);
    const items = loadEvents()
      .filter(ev => ev.dateKey === key)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    eventsBannerText.textContent = formatBanner(selectedDate, items.length);

    eventList.innerHTML = "";
    if (items.length === 0) return;

    items.forEach(ev => {
      const card = document.createElement("div");
      card.className = "event-card";

      const title = escapeHtml(ev.title || "Evento");
      const time = escapeHtml(ev.time || "--:--");
      const note = escapeHtml(ev.note || "");
      const dur = ev.duration ? `${escapeHtml(String(ev.duration))} min` : "";

      card.innerHTML = `
        <div class="d-flex align-items-start justify-content-between gap-2">
          <div>
            <div class="fw-bold">${title}</div>
            <div class="opacity-75 small">${dur ? `Duração: ${dur}` : "Serviço agendado"}</div>
          </div>
          <span class="badge rounded-pill">${time}</span>
        </div>

        ${note ? `<div class="mt-2 small opacity-75">${note}</div>` : ""}

        <div class="mt-3 d-flex justify-content-end">
          <button class="btn btn-sm btn-remove" type="button" data-id="${ev.id}">
            Remover
          </button>
        </div>
      `;

      card.querySelector(".btn-remove").addEventListener("click", () => removeEvent(ev.id));
      eventList.appendChild(card);
    });
  }

  function renderHeader() {
    txtMonthYear.textContent = `${MONTHS_FULL[viewMonth]} ${viewYear}`;
  }

  function renderAll() {
    renderHeader();
    renderMonthsMini();
    renderCalendarGrid();
    renderEventPanel();
  }

  // ---------- Ações ----------
  function openAddModal() {
    selectedDateText.textContent = formatPrettyDate(selectedDate);

    eventForm.classList.remove("was-validated");
    evtTitle.value = "";
    evtTime.value = "";
    evtDuration.value = "";
    evtNote.value = "";

    modal.show();
    setTimeout(() => evtTitle.focus(), 150);
  }

  function addEvent(payload) {
    const all = loadEvents();
    all.push(payload);
    saveEvents(all);
  }

  function removeEvent(id) {
    const all = loadEvents();
    saveEvents(all.filter(ev => ev.id !== id));
    renderAll();
  }

  function uid() {
    return "ev_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Eventos UI ----------
  btnPrev.addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    const maxDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    selectedDate = new Date(viewYear, viewMonth, Math.min(selectedDate.getDate(), maxDay));
    renderAll();
  });

  btnNext.addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    const maxDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    selectedDate = new Date(viewYear, viewMonth, Math.min(selectedDate.getDate(), maxDay));
    renderAll();
  });

  btnAddEvent.addEventListener("click", openAddModal);

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!evtTitle.value.trim() || !evtTime.value) {
      eventForm.classList.add("was-validated");
      return;
    }

    const duration = Number(evtDuration.value || 0);
    addEvent({
      id: uid(),
      dateKey: getDateKey(selectedDate),
      title: evtTitle.value.trim(),
      time: evtTime.value,
      duration: duration > 0 ? duration : null,
      note: evtNote.value.trim()
    });

    modal.hide();
    renderAll();
  });

  // tema: clique
  themeDots.forEach(btn => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
  });

  // ---------- Init ----------
  applyTheme(loadTheme());   // <<< garante a classe no body
  renderAll();

})();
