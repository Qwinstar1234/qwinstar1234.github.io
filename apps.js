const apps = [
  {
    name: "WorkTimer",
    category: "Для работы",
    description: "Настраиваемый таймер для фокус-сессий и перерывов. Поддерживает расписание и уведомления Windows.",
    details:
      "Таймер помогает чередовать работу и отдых, задавать длительность интервалов и сохранять собственное расписание. Приложение работает на компьютере с Windows.",
    features: ["Настройка времени работы и отдыха", "Расписание сессий", "Уведомления Windows"],
    icon: "◷",
    iconBackground: "#e5edda",
    iconColor: "#6e8d38",
    platform: "Windows",
    version: "Версия 1.0",
    download: "downloads/WorkTimer.exe",
    downloadInfo: "WorkTimer.exe · 12 МБ · приложение для Windows",
    screenshot: "images/worktimer-screenshot.png",
    screenshotAlt: "Окно WorkTimer с таймером, настройками времени и расписанием",
    tag: "Опубликовано",
  },
  {
    name: "Сплит",
    category: "Боты",
    description: "Telegram-проект для работы с объявлениями и заявками. Сейчас готовлю его к публикации.",
    details:
      "Проект бота для Telegram с обработкой объявлений и заявок. Публикационная версия пока готовится.",
    features: ["Работа в Telegram", "Обработка заявок"],
    icon: "✳",
    iconBackground: "#f8e9df",
    iconColor: "#c77b55",
    platform: "Telegram",
    version: "В разработке",
    tag: "В разработке",
  },
];

const grid = document.querySelector("#app-grid");
const filters = document.querySelector("#filters");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const emptyState = document.querySelector("#empty-state");
const projectCount = document.querySelector("#project-count");
const projectTotal = document.querySelector("#project-total");
const dialog = document.querySelector("#project-dialog");
const dialogContent = document.querySelector("#dialog-content");
const requestDialog = document.querySelector("#request-dialog");
const requestTypeField = document.querySelector("#request-type");
const requestForm = document.querySelector("#project-request-form");
const formStatus = document.querySelector("#form-status");
const themeButtons = document.querySelectorAll("[data-set-theme]");
const formEndpoint = "";
let activeCategory = "Все";
let favoritesOnly = false;
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem("my-apps-favorites") || "[]");
    return Array.isArray(stored) ? stored.filter((name) => typeof name === "string") : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("my-apps-favorites", JSON.stringify(favorites));
  } catch {
    announce("Браузер не разрешил сохранить избранное. Оно останется до закрытия страницы.");
  }
}

function announce(message) {
  let notice = document.querySelector("#site-notice");
  if (!notice) {
    notice = document.createElement("p");
    notice.id = "site-notice";
    notice.className = "visually-hidden";
    notice.setAttribute("role", "status");
    document.body.append(notice);
  }
  notice.textContent = message;
}

function renderFilters() {
  const categories = ["Все", ...new Set(apps.map((app) => app.category))];
  filters.innerHTML = categories
    .map(
      (category) =>
        `<button class="filter-button" type="button" aria-pressed="${category === activeCategory}" data-category="${escapeAttribute(category)}">${escapeHtml(category)}</button>`,
    )
    .join("");
  filters.insertAdjacentHTML(
    "beforeend",
    `<button class="filter-button favorite-filter" type="button" aria-pressed="${favoritesOnly}" data-favorites="true">Избранное <span aria-hidden="true">☆</span></button>`,
  );
}

function renderApps() {
  const query = search.value.trim().toLocaleLowerCase("ru");
  let visibleApps = apps.filter((app) => {
    const matchesCategory = activeCategory === "Все" || app.category === activeCategory;
    const matchesFavorite = !favoritesOnly || favorites.includes(app.name);
    const matchesSearch = `${app.name} ${app.category} ${app.description} ${app.platform}`
      .toLocaleLowerCase("ru")
      .includes(query);
    return matchesCategory && matchesFavorite && matchesSearch;
  });

  if (sort.value === "name") visibleApps = [...visibleApps].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  if (sort.value === "category") {
    visibleApps = [...visibleApps].sort(
      (a, b) => a.category.localeCompare(b.category, "ru") || a.name.localeCompare(b.name, "ru"),
    );
  }

  projectCount.textContent = String(visibleApps.length).padStart(2, "0");
  projectTotal.textContent = `из ${apps.length} в коллекции`;
  emptyState.hidden = visibleApps.length > 0;
  grid.innerHTML = visibleApps.map(renderCard).join("");
  observeReveal(grid.querySelectorAll(".app-card"));
}

function observeReveal(elements) {
  if (!("IntersectionObserver" in window)) return;
  elements.forEach((element) => {
    element.classList.add("reveal-on-scroll");
    revealObserver.observe(element);
  });
}

const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
      )
    : null;

function updateThemeButtons(theme) {
  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.setTheme === theme));
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content =
    theme === "dark" ? "#171a16" : "#f5f4ef";
  updateThemeButtons(theme);
}

function setTheme(theme) {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) {
    root.classList.add("theme-transition");
    applyTheme(theme);
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  } else {
    applyTheme(theme);
  }

  try {
    localStorage.setItem("my-apps-theme", theme);
  } catch {
    announce("Тема изменена, но браузер не разрешил сохранить выбор.");
  }
}

function renderCard(app, index) {
  const isFavorite = favorites.includes(app.name);
  return `
    <article class="app-card" style="--card-index:${index}">
      <div class="card-top">
        <span class="app-icon" style="--icon-bg:${escapeAttribute(app.iconBackground)};--icon-color:${escapeAttribute(app.iconColor)}" aria-hidden="true">${escapeHtml(app.icon)}</span>
        <div class="card-top-actions">
          <span class="app-tag${app.download ? "" : " is-new"}">${escapeHtml(app.tag)}</span>
          <button class="favorite-button" type="button" data-favorite="${escapeAttribute(app.name)}" aria-label="${isFavorite ? "Убрать из избранного" : "Добавить в избранное"}: ${escapeAttribute(app.name)}" aria-pressed="${isFavorite}" title="${isFavorite ? "Убрать из избранного" : "В избранное"}">${isFavorite ? "★" : "☆"}</button>
        </div>
      </div>
      <h3>${escapeHtml(app.name)}</h3>
      <p>${escapeHtml(app.description)}</p>
      <div class="card-meta"><span>${escapeHtml(app.platform)}</span><span>${escapeHtml(app.version)}</span></div>
      <div class="card-action">
        <button class="button button-outline" type="button" data-details="${escapeAttribute(app.name)}">Подробнее <span aria-hidden="true">↗</span></button>
      </div>
    </article>
  `;
}

function showDetails(name) {
  const app = apps.find((item) => item.name === name);
  if (!app) return;

  const features = app.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("");
  const download = app.download
    ? `<div class="download-info"><p>${escapeHtml(app.downloadInfo)}</p><p>Это исполняемый файл Windows (.exe). Запускайте его, только если доверяете источнику.</p><a class="button button-outline" href="${escapeAttribute(app.download)}" download>Скачать файл <span aria-hidden="true">↓</span></a></div>`
    : `<p class="project-status">Проект пока не опубликован.</p>`;
  const screenshot = app.screenshot
    ? `<figure class="project-screenshot"><img src="${escapeAttribute(app.screenshot)}" alt="${escapeAttribute(app.screenshotAlt)}" loading="lazy" /><figcaption>Скриншот приложения ${escapeHtml(app.name)}</figcaption></figure>`
    : "";

  dialogContent.innerHTML = `
    <div class="dialog-heading">
      <span class="app-icon" style="--icon-bg:${escapeAttribute(app.iconBackground)};--icon-color:${escapeAttribute(app.iconColor)}" aria-hidden="true">${escapeHtml(app.icon)}</span>
      <button class="dialog-close" type="button" aria-label="Закрыть окно">×</button>
    </div>
    <p class="eyebrow">${escapeHtml(app.category)} · ${escapeHtml(app.platform)}</p>
    <h2 id="dialog-title">${escapeHtml(app.name)}</h2>
    <p class="dialog-description">${escapeHtml(app.details)}</p>
    ${screenshot}
    <p class="dialog-subheading">Что умеет</p>
    <ul class="feature-list">${features}</ul>
    <div class="dialog-footer"><span>${escapeHtml(app.version)}</span>${download}</div>
  `;
  dialog.showModal();
  dialog.querySelector(".dialog-close").focus();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[character];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-favorites")) {
    favoritesOnly = !favoritesOnly;
  } else if (button.hasAttribute("data-category")) {
    activeCategory = button.dataset.category;
  } else {
    return;
  }
  renderFilters();
  renderApps();
});

grid.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const name = favoriteButton.dataset.favorite;
    favorites = favorites.includes(name)
      ? favorites.filter((favorite) => favorite !== name)
      : [...favorites, name];
    saveFavorites();
    renderFilters();
    renderApps();
    return;
  }
  const detailsButton = event.target.closest("[data-details]");
  if (detailsButton) showDetails(detailsButton.dataset.details);
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog || event.target.closest(".dialog-close")) dialog.close();
});

document.querySelector(".request-section").addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-request]");
  if (!button) return;
  requestTypeField.value = button.dataset.openRequest;
  requestDialog.showModal();
  requestDialog.querySelector("[name=name]").focus();
});

requestDialog.addEventListener("click", (event) => {
  if (event.target === requestDialog || event.target.closest(".dialog-close")) requestDialog.close();
});

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!formEndpoint) {
    formStatus.textContent =
      "Форма пока не подключена. Добавь endpoint Formspree в apps.js — заявка не отправлена.";
    return;
  }

  const submitButton = requestForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  formStatus.textContent = "Отправляю заявку…";
  try {
    const response = await fetch(formEndpoint, {
      method: "POST",
      body: new FormData(requestForm),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Сервис заявок ответил с ошибкой (HTTP ${response.status}).`);
    }
    requestForm.reset();
    formStatus.textContent = "Заявка отправлена. Спасибо! Я свяжусь с тобой по указанному контакту.";
  } catch (error) {
    formStatus.textContent = `Не удалось отправить заявку: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.setTheme));
});

search.addEventListener("input", renderApps);
sort.addEventListener("change", renderApps);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === "Escape" && document.activeElement === search) {
    search.value = "";
    renderApps();
    search.blur();
  }
});

renderFilters();
renderApps();
applyTheme(document.documentElement.dataset.theme || "dark");
observeReveal(document.querySelectorAll(".hero-art, .section-heading, .request-section, .about"));
