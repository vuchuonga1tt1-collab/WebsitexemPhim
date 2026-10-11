// ==========================================
// ROPHIM ADVANCED MOVIE FILTER BAR MODULE
// ==========================================

function renderFilterBar(containerId = "movie-filter-bar", defaultType = "") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const selectedCat = urlParams.get("category") || urlParams.get("slug") || "";
  const selectedCountry = urlParams.get("country") || "";
  const selectedYear = urlParams.get("year") || "";
  const selectedSort = urlParams.get("sort") || "newest";

  const categories = typeof CATEGORIES !== "undefined" ? CATEGORIES : [];
  const countries = typeof COUNTRIES !== "undefined" ? COUNTRIES : [];

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 2018; y--) {
    yearOptions.push(y);
  }

  container.innerHTML = `
    <div class="filter-bar-container">
      <div class="filter-group">
        <label for="filter-category"><i class="fa-solid fa-layer-group"></i> Thể loại:</label>
        <select id="filter-category" class="filter-select">
          <option value="">Tất cả thể loại</option>
          ${categories
            .map(
              (c) =>
                `<option value="${c.slug}" ${selectedCat === c.slug ? "selected" : ""}>${c.name}</option>`,
            )
            .join("")}
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-country"><i class="fa-solid fa-earth-asia"></i> Quốc gia:</label>
        <select id="filter-country" class="filter-select">
          <option value="">Tất cả quốc gia</option>
          ${countries
            .map(
              (c) =>
                `<option value="${c.slug}" ${selectedCountry === c.slug ? "selected" : ""}>${c.name}</option>`,
            )
            .join("")}
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-year"><i class="fa-solid fa-calendar"></i> Năm phát hành:</label>
        <select id="filter-year" class="filter-select">
          <option value="">Tất cả các năm</option>
          ${yearOptions
            .map(
              (y) =>
                `<option value="${y}" ${String(selectedYear) === String(y) ? "selected" : ""}>${y}</option>`,
            )
            .join("")}
          <option value="older" ${selectedYear === "older" ? "selected" : ""}>Trước 2018</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-sort"><i class="fa-solid fa-arrow-down-wide-short"></i> Sắp xếp:</label>
        <select id="filter-sort" class="filter-select">
          <option value="newest" ${selectedSort === "newest" ? "selected" : ""}>Mới cập nhật</option>
          <option value="year-desc" ${selectedSort === "year-desc" ? "selected" : ""}>Năm giảm dần</option>
          <option value="year-asc" ${selectedSort === "year-asc" ? "selected" : ""}>Năm tăng dần</option>
          <option value="name-asc" ${selectedSort === "name-asc" ? "selected" : ""}>Tên A - Z</option>
        </select>
      </div>

      <div class="filter-actions">
        <button id="btn-apply-filter" class="btn-filter-apply" title="Áp dụng bộ lọc">
          <i class="fa-solid fa-filter"></i> Lọc Phim
        </button>
        <button id="btn-reset-filter" class="btn-filter-reset" title="Đặt lại bộ lọc">
          <i class="fa-solid fa-rotate-right"></i>
        </button>
      </div>
    </div>
  `;
}

function getFilterValues() {
  const catEl = document.getElementById("filter-category");
  const countryEl = document.getElementById("filter-country");
  const yearEl = document.getElementById("filter-year");
  const sortEl = document.getElementById("filter-sort");

  return {
    category: catEl ? catEl.value : "",
    country: countryEl ? countryEl.value : "",
    year: yearEl ? yearEl.value : "",
    sort: sortEl ? sortEl.value : "newest",
  };
}

function applyClientFilterAndSort(movies, { year, sort }) {
  if (!movies || !Array.isArray(movies)) return [];
  let filtered = [...movies];

  // Lọc theo năm
  if (year) {
    if (year === "older") {
      filtered = filtered.filter((m) => parseInt(m.year) < 2018);
    } else {
      filtered = filtered.filter((m) => String(m.year) === String(year));
    }
  }

  // Sắp xếp
  if (sort === "year-desc") {
    filtered.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  } else if (sort === "year-asc") {
    filtered.sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
  } else if (sort === "name-asc") {
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  return filtered;
}

