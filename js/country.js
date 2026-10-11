const getBaseUrl = () =>
  (typeof API_CONFIG !== "undefined" && API_CONFIG.BASE_URL) ||
  "https://phimapi.com";
const ITEMS_PER_PAGE = 24;

let currentPage = 1;
let totalPages = 1;
let currentCountrySlug = "han-quoc";

let countryGrid, currentPageEl, totalPageEl, titleEl;
let firstBtn, prevBtn, nextBtn, lastBtn;

document.addEventListener("DOMContentLoaded", () => {
  countryGrid = document.getElementById("country-grid");
  currentPageEl = document.getElementById("currentPage");
  totalPageEl = document.getElementById("totalPage");
  titleEl = document.getElementById("country-page-title");

  firstBtn = document.getElementById("firstPage");
  prevBtn = document.getElementById("prevPage");
  nextBtn = document.getElementById("nextPage");
  lastBtn = document.getElementById("lastPage");

  const urlParams = new URLSearchParams(window.location.search);
  currentCountrySlug = urlParams.get("slug") || "han-quoc";

  updateTitle();

  if (firstBtn) firstBtn.onclick = () => loadCountryMovies(1);
  if (lastBtn) lastBtn.onclick = () => loadCountryMovies(totalPages);
  if (prevBtn)
    prevBtn.onclick = () => currentPage > 1 && loadCountryMovies(currentPage - 1);
  if (nextBtn)
    nextBtn.onclick = () =>
      currentPage < totalPages && loadCountryMovies(currentPage + 1);

  if (typeof renderFilterBar === "function") {
    renderFilterBar("movie-filter-bar");
    setupFilterEvents();
  }

  loadCountryMovies(1);
});

function updateTitle() {
  const country = (typeof COUNTRIES !== "undefined" ? COUNTRIES : []).find(
    (c) => c.slug === currentCountrySlug,
  );
  const name = country
    ? country.name
    : currentCountrySlug.replace(/-/g, " ").toUpperCase();
  if (titleEl) titleEl.textContent = `Phim ${name}`;
  document.title = `Phim ${name} | RoPhim`;
}

function setupFilterEvents() {
  const applyBtn = document.getElementById("btn-apply-filter");
  const resetBtn = document.getElementById("btn-reset-filter");

  if (applyBtn) {
    applyBtn.onclick = () => {
      const filters = getFilterValues();
      if (filters.country && filters.country !== currentCountrySlug) {
        currentCountrySlug = filters.country;
        window.history.pushState(
          {},
          "",
          `country.html?slug=${currentCountrySlug}`,
        );
        updateTitle();
      }
      currentPage = 1;
      loadCountryMovies(1);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      const catEl = document.getElementById("filter-category");
      const countryEl = document.getElementById("filter-country");
      const yearEl = document.getElementById("filter-year");
      const sortEl = document.getElementById("filter-sort");
      if (catEl) catEl.value = "";
      if (countryEl) countryEl.value = currentCountrySlug;
      if (yearEl) yearEl.value = "";
      if (sortEl) sortEl.value = "newest";
      currentPage = 1;
      loadCountryMovies(1);
    };
  }
}

async function loadCountryMovies(page = 1) {
  currentPage = page;
  if (countryGrid) {
    if (typeof renderSkeleton === "function") {
      renderSkeleton("country-grid", 12);
    } else {
      countryGrid.innerHTML = "📺 Đang tải danh sách phim...";
    }
  }

  const filters =
    typeof getFilterValues === "function"
      ? getFilterValues()
      : { category: "", country: currentCountrySlug, year: "", sort: "newest" };

  const targetCountry = filters.country || currentCountrySlug;
  const apiUrl = `${getBaseUrl()}/v1/api/quoc-gia/${encodeURIComponent(targetCountry)}?page=${page}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    let items = data?.data?.items || data?.items || [];
    const pagination = data?.data?.params?.pagination;
    const totalItems = pagination?.totalItems;
    const totalPagesFromApi = pagination?.totalPages;

    if (typeof applyClientFilterAndSort === "function") {
      items = applyClientFilterAndSort(items, filters);
    }

    if (!items || items.length === 0) {
      if (countryGrid) {
        countryGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">
            <i class="fa-solid fa-earth-asia" style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;"></i>
            <p>Không tìm thấy phim phù hợp của quốc gia này.</p>
          </div>
        `;
      }
      totalPages = 1;
      return updatePagination();
    }

    totalPages =
      totalPagesFromApi ||
      Math.ceil((totalItems || items.length) / ITEMS_PER_PAGE) ||
      1;

    if (countryGrid) {
      countryGrid.innerHTML = items.map(createMovieCard).join("");
    }
    updatePagination();
  } catch (err) {
    console.error("Lỗi tải phim theo quốc gia:", err);
    if (countryGrid) {
      countryGrid.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #ff5252;">❌ Không thể tải danh sách phim. Vui lòng thử lại.</div>';
    }
  }
}

function updatePagination() {
  if (currentPageEl) currentPageEl.textContent = currentPage;
  if (totalPageEl) totalPageEl.textContent = totalPages;

  if (firstBtn && prevBtn)
    firstBtn.disabled = prevBtn.disabled = currentPage === 1;
  if (nextBtn && lastBtn)
    nextBtn.disabled = lastBtn.disabled = currentPage === totalPages;
}

