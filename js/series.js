const getBaseUrl = () =>
  (typeof API_CONFIG !== "undefined" && API_CONFIG.BASE_URL) ||
  "https://phimapi.com";
const ITEMS_PER_PAGE = 24;

let currentPage = 1;
let totalPages = 1;

let seriesGrid, currentPageEl, totalPageEl;
let firstBtn, prevBtn, nextBtn, lastBtn;

document.addEventListener("DOMContentLoaded", () => {
  seriesGrid = document.getElementById("series-grid");
  currentPageEl = document.getElementById("currentPage");
  totalPageEl = document.getElementById("totalPage");

  firstBtn = document.getElementById("firstPage");
  prevBtn = document.getElementById("prevPage");
  nextBtn = document.getElementById("nextPage");
  lastBtn = document.getElementById("lastPage");

  if (firstBtn) firstBtn.onclick = () => loadSeries(1);
  if (lastBtn) lastBtn.onclick = () => loadSeries(totalPages);
  if (prevBtn)
    prevBtn.onclick = () => currentPage > 1 && loadSeries(currentPage - 1);
  if (nextBtn)
    nextBtn.onclick = () =>
      currentPage < totalPages && loadSeries(currentPage + 1);

  if (typeof renderFilterBar === "function") {
    renderFilterBar("movie-filter-bar");
    setupFilterEvents();
  }

  loadSeries(1);
});

function setupFilterEvents() {
  const applyBtn = document.getElementById("btn-apply-filter");
  const resetBtn = document.getElementById("btn-reset-filter");

  if (applyBtn) {
    applyBtn.onclick = () => {
      currentPage = 1;
      loadSeries(1);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      const catEl = document.getElementById("filter-category");
      const countryEl = document.getElementById("filter-country");
      const yearEl = document.getElementById("filter-year");
      const sortEl = document.getElementById("filter-sort");
      if (catEl) catEl.value = "";
      if (countryEl) countryEl.value = "";
      if (yearEl) yearEl.value = "";
      if (sortEl) sortEl.value = "newest";
      currentPage = 1;
      loadSeries(1);
    };
  }
}

async function loadSeries(page = 1) {
  currentPage = page;
  if (seriesGrid) {
    if (typeof renderSkeleton === "function") {
      renderSkeleton("series-grid", 12);
    } else {
      seriesGrid.innerHTML = "📺 Đang tải danh sách phim bộ...";
    }
  }

  const filters =
    typeof getFilterValues === "function"
      ? getFilterValues()
      : { category: "", country: "", year: "", sort: "newest" };

  let apiUrl = "";
  if (filters.category) {
    apiUrl = `${getBaseUrl()}/v1/api/the-loai/${encodeURIComponent(filters.category)}?page=${page}`;
  } else if (filters.country) {
    apiUrl = `${getBaseUrl()}/v1/api/quoc-gia/${encodeURIComponent(filters.country)}?page=${page}`;
  } else {
    apiUrl = `${getBaseUrl()}/v1/api/danh-sach/phim-bo?page=${page}`;
  }

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
      if (seriesGrid) {
        seriesGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">
            <i class="fa-solid fa-tv" style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;"></i>
            <p>Không tìm thấy phim bộ phù hợp với bộ lọc hiện tại.</p>
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

    if (seriesGrid) {
      seriesGrid.innerHTML = items.map(createMovieCard).join("");
    }

    updatePagination();
  } catch (err) {
    console.error("Lỗi tải phim bộ:", err);
    if (seriesGrid) {
      seriesGrid.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #ff5252;">❌ Không thể tải danh sách phim bộ. Vui lòng thử lại.</div>';
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
