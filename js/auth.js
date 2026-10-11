// ==========================================
// ROPHIM AUTHENTICATION & USER MANAGEMENT MODULE
// ==========================================

const AUTH_CONFIG = {
  DEFAULT_AVATARS: [
    "assets/images/defaults/default-avatar1.jpg",
    "assets/images/defaults/default-avatar2.jpg",
    "assets/images/defaults/default-avatar3.jpg",
    "assets/images/defaults/default-avatar4.jpg",
    "assets/images/defaults/default-avatar5.jpg",
    "assets/images/defaults/default-avatar6.jpg",
    "assets/images/defaults/default-avatar7.jpg",
  ],
};

// 1. Quản lý trạng thái LocalStorage
function getUsers() {
  const users = getFromStorage(STORAGE_KEYS.USERS, null);
  if (!users) {
    // Khởi tạo tài khoản mẫu demo để dễ kiểm tra
    const demoUsers = [
      {
        id: "user_admin",
        username: "Nguyễn Văn Admin",
        email: "admin@rophim.vn",
        password: "password123",
        avatar: "assets/images/defaults/default-avatar1.jpg",
        createdAt: new Date().toISOString(),
      },
      {
        id: "user_hoang",
        username: "Hoàng Minh",
        email: "hoang@gmail.com",
        password: "password123",
        avatar: "assets/images/defaults/default-avatar2.jpg",
        createdAt: new Date().toISOString(),
      },
    ];
    saveToStorage(STORAGE_KEYS.USERS, demoUsers);
    return demoUsers;
  }
  return users;
}

function getCurrentUser() {
  return getFromStorage(STORAGE_KEYS.CURRENT_USER, null);
}

function setCurrentUser(user) {
  if (user) {
    // Không lưu password trong current_user để an toàn
    const safeUser = { ...user };
    delete safeUser.password;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, safeUser);
  } else {
    removeFromStorage(STORAGE_KEYS.CURRENT_USER);
  }
  document.dispatchEvent(new CustomEvent("authStateChanged", { detail: user }));
}

// 2. Các hàm Đăng nhập / Đăng ký / Đăng xuất
function login(emailOrUsername, password) {
  const users = getUsers();
  const found = users.find(
    (u) =>
      (u.email.toLowerCase() === emailOrUsername.toLowerCase().trim() ||
        u.username.toLowerCase() === emailOrUsername.toLowerCase().trim()) &&
      u.password === password,
  );

  if (found) {
    setCurrentUser(found);
    if (typeof showToast === "function") {
      showToast(`Chào mừng ${found.username} quay trở lại!`, "success");
    }
    closeAuthModal();
    updateHeaderAuthUI();
    return { success: true, user: found };
  } else {
    return {
      success: false,
      error: "Tài khoản hoặc mật khẩu không chính xác!",
    };
  }
}

function register(username, email, password, avatar = null) {
  const users = getUsers();

  if (!username || username.trim().length < 3) {
    return { success: false, error: "Tên hiển thị phải từ 3 ký tự trở lên!" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return { success: false, error: "Email không đúng định dạng!" };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Mật khẩu phải từ 6 ký tự trở lên!" };
  }

  const emailExists = users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
  );
  if (emailExists) {
    return { success: false, error: "Email này đã được đăng ký!" };
  }

  const usernameExists = users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim(),
  );
  if (usernameExists) {
    return { success: false, error: "Tên người dùng này đã có người sử dụng!" };
  }

  const newUser = {
    id: "user_" + Date.now(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    avatar: avatar || AUTH_CONFIG.DEFAULT_AVATARS[0],
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveToStorage(STORAGE_KEYS.USERS, users);
  setCurrentUser(newUser);

  if (typeof showToast === "function") {
    showToast(`Đăng ký thành công! Chào mừng ${newUser.username}`, "success");
  }

  closeAuthModal();
  updateHeaderAuthUI();
  return { success: true, user: newUser };
}

function logout() {
  const user = getCurrentUser();
  setCurrentUser(null);
  if (typeof showToast === "function") {
    showToast("Đã đăng xuất thành công", "info");
  }
  updateHeaderAuthUI();
}

// 3. Quản lý Modal Popup Giao diện Đăng nhập / Đăng ký
let selectedRegisterAvatar = AUTH_CONFIG.DEFAULT_AVATARS[0];

function initAuthModal() {
  if (document.getElementById("auth-modal")) return;

  const modalHtml = `
    <div id="auth-modal" class="auth-modal-overlay">
      <div class="auth-modal-content">
        <button class="auth-modal-close" onclick="closeAuthModal()" title="Đóng">&times;</button>
        
        <div class="auth-tabs">
          <button class="auth-tab-btn active" data-tab="login" onclick="switchAuthTab('login')">
            <i class="fa-solid fa-right-to-bracket me-2"></i> Đăng Nhập
          </button>
          <button class="auth-tab-btn" data-tab="register" onclick="switchAuthTab('register')">
            <i class="fa-solid fa-user-plus me-2"></i> Đăng Ký
          </button>
        </div>

        <div class="auth-forms-container">
          <!-- FORM ĐĂNG NHẬP -->
          <form id="form-login" class="auth-form active" onsubmit="handleLoginSubmit(event)">
            
    
            <div class="auth-input-group">
              <label for="login-email"><i class="fa-solid fa-envelope me-1"></i> Email hoặc Tên đăng nhập</label>
              <input type="text" id="login-email" placeholder="admin@rophim.vn" required autocomplete="username" />
            </div>

            <div class="auth-input-group">
              <label for="login-password"><i class="fa-solid fa-lock me-1"></i> Mật khẩu</label>
              <div class="password-input-wrapper">
                <input type="password" id="login-password" placeholder="Nhập mật khẩu" required autocomplete="current-password" />
                <button type="button" class="btn-toggle-password" onclick="togglePasswordVisibility('login-password', this)">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="auth-extra-row">
              <label class="remember-me">
                <input type="checkbox" id="login-remember" checked />
                <span>Ghi nhớ tôi</span>
              </label>
              <a href="javascript:void(0)" onclick="showToast('Chức năng quên mật khẩu đang kết nối qua email!', 'info')" class="forgot-link">Quên mật khẩu?</a>
            </div>

            <div id="login-error-msg" class="auth-error-msg"></div>

            <button type="submit" class="auth-submit-btn">
              <i class="fa-solid fa-arrow-right-to-bracket me-2"></i> Đăng Nhập
            </button>
          </form>

          <!-- FORM ĐĂNG KÝ -->
          <form id="form-register" class="auth-form" onsubmit="handleRegisterSubmit(event)">
            <div class="auth-input-group">
              <label for="reg-username"><i class="fa-solid fa-user me-1"></i> Tên người dùng (Hiển thị)</label>
              <input type="text" id="reg-username" required minlength="3" autocomplete="nickname" />
            </div>

            <div class="auth-input-group">
              <label for="reg-email"><i class="fa-solid fa-envelope me-1"></i> Địa chỉ Email</label>
              <input type="email" id="reg-email" " required autocomplete="email" />
            </div>

            <div class="auth-input-group">
              <label for="reg-password"><i class="fa-solid fa-lock me-1"></i> Mật khẩu</label>
              <div class="password-input-wrapper">
                <input type="password" id="reg-password" placeholder="Tối thiểu 6 ký tự" required minlength="6" autocomplete="new-password" />
                <button type="button" class="btn-toggle-password" onclick="togglePasswordVisibility('reg-password', this)">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="auth-input-group">
              <label for="reg-repassword"><i class="fa-solid fa-shield-halved me-1"></i> Nhập lại mật khẩu</label>
              <input type="password" id="reg-repassword" placeholder="Nhập lại mật khẩu trên" required minlength="6" autocomplete="new-password" />
            </div>

            <div class="auth-input-group">
              <label><i class="fa-solid fa-image me-1"></i> Chọn Ảnh Đại Diện</label>
              <div class="avatar-selector-grid" id="avatar-selector-grid">
                ${AUTH_CONFIG.DEFAULT_AVATARS.map(
                  (ava, idx) => `
                  <div class="avatar-option ${idx === 0 ? "selected" : ""}" 
                       onclick="selectAvatarOption('${ava}', this)">
                    <img src="${ava}" alt="Avatar ${idx + 1}" />
                  </div>
                `,
                ).join("")}
              </div>
            </div>

            <div id="register-error-msg" class="auth-error-msg"></div>

            <button type="submit" class="auth-submit-btn">
              <i class="fa-solid fa-user-plus me-2"></i> Đăng Ký Tài Khoản
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Nhấn ESC để đóng modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuthModal();
  });

  // Nhấn ra ngoài để đóng modal
  const overlay = document.getElementById("auth-modal");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAuthModal();
  });
}

function selectAvatarOption(path, el) {
  selectedRegisterAvatar = path;
  document
    .querySelectorAll(".avatar-option")
    .forEach((opt) => opt.classList.remove("selected"));
  if (el) el.classList.add("selected");
}

function switchAuthTab(tab) {
  const tabs = document.querySelectorAll(".auth-tab-btn");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach((t) => {
    if (t.getAttribute("data-tab") === tab) t.classList.add("active");
    else t.classList.remove("active");
  });

  forms.forEach((f) => {
    if (f.id === `form-${tab}`) f.classList.add("active");
    else f.classList.remove("active");
  });

  const errLogin = document.getElementById("login-error-msg");
  const errReg = document.getElementById("register-error-msg");
  if (errLogin) errLogin.textContent = "";
  if (errReg) errReg.textContent = "";
}

function openAuthModal(tab = "login") {
  initAuthModal();
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.classList.add("show");
    switchAuthTab(tab);
    setTimeout(() => {
      if (tab === "login") {
        document.getElementById("login-email")?.focus();
      } else {
        document.getElementById("reg-username")?.focus();
      }
    }, 150);
  }
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.classList.remove("show");
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  const icon = btn.querySelector("i");
  if (icon) {
    icon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById("login-email").value;
  const passInput = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error-msg");

  const res = login(emailInput, passInput);
  if (!res.success) {
    if (errEl) errEl.textContent = res.error;
  }
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value;
  const pass = document.getElementById("reg-password").value;
  const repass = document.getElementById("reg-repassword").value;
  const errEl = document.getElementById("register-error-msg");

  if (pass !== repass) {
    if (errEl) errEl.textContent = "Hai mật khẩu không khớp nhau!";
    return;
  }

  const res = register(username, email, pass, selectedRegisterAvatar);
  if (!res.success) {
    if (errEl) errEl.textContent = res.error;
  }
}

// 4. Cập nhật giao diện Header theo trạng thái Đăng nhập
function updateHeaderAuthUI() {
  const container = document.getElementById("main_user");
  if (!container) return;

  const user = getCurrentUser();

  if (user) {
    container.innerHTML = `
      <div class="user-profile-menu" id="user-profile-menu">
        <button class="button-user user-logged-in-btn" id="user-menu-trigger" title="${user.username}">
          <img src="${user.avatar}" alt="${user.username}" class="user-header-avatar" onerror="this.src='assets/images/defaults/default-avatar1.jpg'" />
          <span class="user-header-name">${user.username}</span>
          <i class="fa-solid fa-caret-down ms-1" style="font-size: 11px;"></i>
        </button>
        <div class="user-dropdown-menu" id="user-dropdown-menu">
          <div class="user-dropdown-header">
            <img src="${user.avatar}" class="dropdown-avatar" onerror="this.src='assets/images/defaults/default-avatar1.jpg'" />
            <div class="dropdown-user-info">
              <strong>${user.username}</strong>
              <small>${user.email}</small>
            </div>
          </div>
          <div class="user-dropdown-divider"></div>
          <a href="favorites.html" class="user-dropdown-item">
            <i class="fa-solid fa-heart me-2 text-warning"></i> Phim yêu thích
          </a>
          <a href="history.html" class="user-dropdown-item">
            <i class="fa-solid fa-clock-rotate-left me-2 text-info"></i> Lịch sử xem
          </a>
          <div class="user-dropdown-divider"></div>
          <button class="user-dropdown-item btn-logout" onclick="logout()">
            <i class="fa-solid fa-right-from-bracket me-2 text-danger"></i> Đăng xuất
          </button>
        </div>
      </div>
    `;

    const trigger = document.getElementById("user-menu-trigger");
    const dropdown = document.getElementById("user-dropdown-menu");
    if (trigger && dropdown) {
      trigger.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
      };
      document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
          dropdown.classList.remove("active");
        }
      });
    }
  } else {
    container.innerHTML = `
      <a class="button-user button-login" href="javascript:void(0)" onclick="openAuthModal('login')">
        <div class="line-center">
          <i class="fa-solid fa-user ms-1"></i>
          <span>Thành viên</span>
        </div>
      </a>
    `;
  }
}

// Tự động khởi tạo khi tài liệu sẵn sàng
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initAuthModal();
    updateHeaderAuthUI();
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    login,
    register,
    logout,
    getCurrentUser,
    openAuthModal,
    closeAuthModal,
    updateHeaderAuthUI,
  };
}

