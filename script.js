const titles = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  estoque: "Estoque",
  vendas: "Nova Venda",
  relatorios: "Relatórios"
};

const loginPassword = "g20";

const stores = {
  saoBernado: {
    name: "G20 São Bernado",
    products: "248",
    stock: "1.120",
    salesToday: "R$ 980,00",
    salesCount: "32",
    lowStock: "5",
    monthlyRevenue: "R$ 18.600"
  },
  floramar: {
    name: "G20 Floramar",
    products: "231",
    stock: "984",
    salesToday: "R$ 1.230,00",
    salesCount: "41",
    lowStock: "4",
    monthlyRevenue: "R$ 16.920"
  },
  guarani: {
    name: "G20 Guarani",
    products: "196",
    stock: "860",
    salesToday: "R$ 420,00",
    salesCount: "18",
    lowStock: "3",
    monthlyRevenue: "R$ 6.840"
  },
  primeiroDeMaio: {
    name: "G20 1º de maio",
    products: "204",
    stock: "878",
    salesToday: "R$ 650,00",
    salesCount: "25",
    lowStock: "5",
    monthlyRevenue: "R$ 6.560"
  }
};

let activeStoreKey = null;
let toastTimer;

function loginStore(event) {
  event.preventDefault();

  const storeName = document.getElementById("storeName").value;
  const password = document.getElementById("storePassword").value;
  const storeKey = findStoreKeyByName(storeName);

  if (!storeKey) {
    showMessage("Nome da loja não encontrado.");
    return;
  }

  if (password !== loginPassword) {
    showMessage("Senha incorreta.");
    return;
  }

  activeStoreKey = storeKey;
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");

  applyStoreContext();
  showPage("dashboard", document.querySelector(".menu button"));
  showMessage(`Login realizado: ${stores[storeKey].name}`);
}

function logoutStore() {
  activeStoreKey = null;
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.querySelector(".login-form").reset();
}

function applyStoreContext() {
  const store = stores[activeStoreKey];

  if (!store) {
    return;
  }

  setText("currentStore", store.name);
  setText("userBox", `${store.name} | ${store.salesCount} vendas hoje`);
  setText("dashboardProducts", store.products);
  setText("dashboardStock", store.stock);
  setText("dashboardSales", store.salesToday);
  setText("dashboardLow", store.lowStock);
  setText("dashboardSummaryTitle", `Resumo da ${store.name}`);
  setText("reportRevenue", store.monthlyRevenue);
  setText("reportLowStock", store.lowStock);
  setText("reportsTitle", `Relatórios da ${store.name}`);

  filterDashboardRows(activeStoreKey);
  showStockColumns("all");
  selectStoreOption("initialStoreSelect", store.name);
  selectStoreOption("saleStoreSelect", store.name);
  activateStoreFilter("all");
}

function showPage(pageId, button) {
  const selectedPage = document.getElementById(pageId);
  const pageTitle = document.getElementById("pageTitle");

  if (!selectedPage || !pageTitle) {
    return;
  }

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  document.querySelectorAll(".menu button").forEach((btn) => {
    btn.classList.remove("active");
  });

  selectedPage.classList.add("active");

  if (button) {
    button.classList.add("active");
  }

  pageTitle.textContent = titles[pageId] || "Sistema de Estoque";
}

function showMessage(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    return;
  }

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function findStoreKeyByName(storeName) {
  const normalizedName = normalizeText(storeName);

  return Object.keys(stores).find((storeKey) => {
    return normalizeText(stores[storeKey].name) === normalizedName;
  });
}

function normalizeText(value) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filterDashboardRows(storeKey) {
  document.querySelectorAll("[data-store-row]").forEach((row) => {
    row.classList.toggle("hidden", row.dataset.storeRow !== storeKey);
  });
}

function showStockColumns(storeKey) {
  document.querySelectorAll("[data-store-stock]").forEach((cell) => {
    const shouldHide = storeKey !== "all" && cell.dataset.storeStock !== storeKey;
    cell.classList.toggle("hidden", shouldHide);
  });
}

function selectStoreOption(selectId, storeName) {
  const select = document.getElementById(selectId);

  if (!select) {
    return;
  }

  select.value = storeName;
  select.disabled = true;
}

function activateStoreFilter(storeKey) {
  document.querySelectorAll("[data-store-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.storeFilter === storeKey);
  });
}

document.querySelectorAll("[data-store-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.storeFilter;

    showStockColumns(selectedFilter);
    activateStoreFilter(selectedFilter);
  });
});
