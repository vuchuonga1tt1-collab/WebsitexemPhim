const getBaseUrl = () =>
  (typeof API_CONFIG !== "undefined" && API_CONFIG.BASE_URL) ||
  "https://phimapi.com";
const ITEMS_PER_PAGE = 24;

let currentPage = 1;
let totalPages = 1;
let currentSlug = "hanh-dong";

let categoryGrid, currentPageEl, totalPageEl, titleEl;
let firstBtn, prevBtn, nextBtn, lastBtn;

document.addEventListener("DOMContentLoaded", () => {
  categoryGrid = document.getElementById("category-grid");
  currentPageEl = document.getElementById("currentPage");
  totalPageEl = document.getElementById("totalPage");
  titleEl = document.getElementById("category-page-title");

  firstBtn = document.getElementById("firstPage");
  prevBtn = document.getElementById("prevPage");
  nextBtn = document.getElementById("nextPage");
  lastBtn = document.getElementById("lastPage");

  const urlParams = new URLSearchParams(window.location.search);
  currentSlug = urlParams.get("slug") || "hanh-dong";

  updateTitle();

  if (firstBtn) firstBtn.onclick = () => loadCategoryMovies(1);
  if (lastBtn) lastBtn.onclick = () => loadCategoryMovies(totalPages);
  if (prevBtn)
    prevBtn.onclick = () => currentPage > 1 && loadCategoryMovies(currentPage - 1);
  if (nextBtn)
    nextBtn.onclick = () =>
      currentPage < totalPages && loadCategoryMovies(currentPage + 1);

  if (typeof renderFilterBar === "function") {
    renderFilterBar("movie-filter-bar");
    setupFilterEvents();
  }

  loadCategoryMovies(1);
});

function updateTitle() {
  const cat = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).find(
    (c) => c.slug === currentSlug,
  );
  const name = cat ? cat.name : currentSlug.replace(/-/g, " ").toUpperCase();
  if (titleEl) titleEl.textContent = `Phim ${name}`;
  document.title = `Phim ${name} | RoPhim`;
}

function setupFilterEvents() {
  const applyBtn = document.getElementById("btn-apply-filter");
  const resetBtn = document.getElementById("btn-reset-filter");

  if (applyBtn) {
    applyBtn.onclick = () => {
      const filters = getFilterValues();
      if (filters.category && filters.category !== currentSlug) {
        currentSlug = filters.category;
        window.history.pushState({}, "", `category.html?slug=${currentSlug}`);
        updateTitle();
      }
      currentPage = 1;
      loadCategoryMovies(1);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      const catEl = document.getElementById("filter-category");
      const countryEl = document.getElementById("filter-country");
      const yearEl = document.getElementById("filter-year");
      const sortEl = document.getElementById("filter-sort");
      if (catEl) catEl.value = currentSlug;
      if (countryEl) countryEl.value = "";
      if (yearEl) yearEl.value = "";
      if (sortEl) sortEl.value = "newest";
      currentPage = 1;
      loadCategoryMovies(1);
    };
  }
}

async function loadCategoryMovies(page = 1) {
  currentPage = page;
  if (categoryGrid) {
    if (typeof renderSkeleton === "function") {
      renderSkeleton("category-grid", 12);
    } else {
      categoryGrid.innerHTML = "📺 Đang tải danh sách phim...";
    }
  }

  const filters =
    typeof getFilterValues === "function"
      ? getFilterValues()
      : { category: currentSlug, country: "", year: "", sort: "newest" };

  const targetCategory = filters.category || currentSlug;
  const apiUrl = `${getBaseUrl()}/v1/api/the-loai/${encodeURIComponent(targetCategory)}?page=${page}`;

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
      if (categoryGrid) {
        categoryGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">
            <i class="fa-solid fa-film" style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;"></i>
            <p>Không tìm thấy phim phù hợp trong thể loại này.</p>
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

    if (categoryGrid) {
      categoryGrid.innerHTML = items.map(createMovieCard).join("");
    }
    updatePagination();
  } catch (err) {
    console.error("Lỗi tải phim theo thể loại:", err);
    if (categoryGrid) {
      categoryGrid.innerHTML =
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

