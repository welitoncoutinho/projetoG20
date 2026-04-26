const titles = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  estoque: "Estoque",
  vendas: "Nova Venda",
  relatorios: "Relatórios"
};

const loginPassword = "g20";
const adminLoginName = "admin";
const adminPasswords = ["adm", "g20"];
const stockStorageKey = "g20StockByStore";
const productPrices = {
  "Capinha iPhone 14": 49.9,
  "Película Samsung A15": 29.9,
  "Cabo USB-C Turbo": 39.9,
  "Carregador 20W": 69.9
};

const stores = {
  saoBernado: {
    name: "G20 São Bernado",
    products: "248",
    stock: "1.120",
    salesToday: "R$ 980,00",
    salesCount: "32",
    lowStock: "5",
    monthlyRevenue: "R$ 18.600",
    sellers: [
      { name: "Ana Paula", sales: 14, revenue: "R$ 7.840,00", averageTicket: "R$ 560,00", highlight: "Capinhas" },
      { name: "Bruno Silva", sales: 10, revenue: "R$ 5.420,00", averageTicket: "R$ 542,00", highlight: "Películas" },
      { name: "Carla Mendes", sales: 8, revenue: "R$ 5.340,00", averageTicket: "R$ 667,50", highlight: "Carregadores" }
    ]
  },
  floramar: {
    name: "G20 Floramar",
    products: "231",
    stock: "984",
    salesToday: "R$ 1.230,00",
    salesCount: "41",
    lowStock: "4",
    monthlyRevenue: "R$ 16.920",
    sellers: [
      { name: "Diego Lima", sales: 17, revenue: "R$ 7.210,00", averageTicket: "R$ 424,12", highlight: "Películas" },
      { name: "Fernanda Rocha", sales: 13, revenue: "R$ 5.980,00", averageTicket: "R$ 460,00", highlight: "Fones" },
      { name: "Lucas Costa", sales: 11, revenue: "R$ 3.730,00", averageTicket: "R$ 339,09", highlight: "Cabos" }
    ]
  },
  guarani: {
    name: "G20 Guarani",
    products: "196",
    stock: "860",
    salesToday: "R$ 420,00",
    salesCount: "18",
    lowStock: "3",
    monthlyRevenue: "R$ 6.840",
    sellers: [
      { name: "Mariana Alves", sales: 7, revenue: "R$ 2.790,00", averageTicket: "R$ 398,57", highlight: "Capinhas" },
      { name: "Rafael Souza", sales: 6, revenue: "R$ 2.160,00", averageTicket: "R$ 360,00", highlight: "Películas" },
      { name: "Nathalia Reis", sales: 5, revenue: "R$ 1.890,00", averageTicket: "R$ 378,00", highlight: "Cabos" }
    ]
  },
  primeiroDeMaio: {
    name: "G20 1º de maio",
    products: "204",
    stock: "878",
    salesToday: "R$ 650,00",
    salesCount: "25",
    lowStock: "5",
    monthlyRevenue: "R$ 6.560",
    sellers: [
      { name: "Paulo Henrique", sales: 10, revenue: "R$ 2.780,00", averageTicket: "R$ 278,00", highlight: "Películas" },
      { name: "Juliana Castro", sales: 9, revenue: "R$ 2.350,00", averageTicket: "R$ 261,11", highlight: "Capinhas" },
      { name: "Sergio Martins", sales: 6, revenue: "R$ 1.430,00", averageTicket: "R$ 238,33", highlight: "Carregadores" }
    ]
  }
};

let activeStoreKey = null;
let activeRole = null;
let stockData = {};
let toastTimer;

function loginStore(event) {
  event.preventDefault();

  const storeName = document.getElementById("storeName").value;
  const password = document.getElementById("storePassword").value;
  const normalizedLogin = normalizeText(storeName);
  const storeKey = findStoreKeyByName(storeName);

  if (normalizedLogin === adminLoginName || normalizedLogin === "administrador") {
    if (!adminPasswords.includes(password)) {
      showMessage("Senha de administrador incorreta.");
      return;
    }

    activeStoreKey = null;
    activeRole = "admin";
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");

    applyAdminContext();
    showPage("dashboard", document.querySelector(".menu button"));
    showMessage("Login administrador realizado.");
    return;
  }

  if (!storeKey) {
    showMessage("Nome da loja não encontrado.");
    return;
  }

  if (password !== loginPassword) {
    showMessage("Senha incorreta.");
    return;
  }

  activeStoreKey = storeKey;
  activeRole = "store";
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");

  applyStoreContext();
  showPage("dashboard", document.querySelector(".menu button"));
  showMessage(`Login realizado: ${stores[storeKey].name}`);
}

function logoutStore() {
  activeStoreKey = null;
  activeRole = null;
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.querySelector(".login-form").reset();
  updateStoreFilterVisibility();
  updateAdminControls();
  renderStockTable();
}

function applyStoreContext() {
  const store = stores[activeStoreKey];

  if (!store) {
    return;
  }

  setText("currentStore", store.name);
  setText("userBox", `${store.name} | ${store.salesCount} vendas hoje`);
  setText("dashboardProducts", store.products);
  setText("dashboardStock", formatNumber(getStoreStockAmount(activeStoreKey)));
  setText("dashboardSales", store.salesToday);
  setText("dashboardLow", store.lowStock);
  setText("dashboardSummaryTitle", `Resumo da ${store.name}`);
  setText("reportRevenue", store.monthlyRevenue);
  setText("reportLowStock", store.lowStock);
  setText("reportsTitle", `Relatórios da ${store.name}`);

  filterDashboardRows(activeStoreKey);
  populateSellerSelect(store.sellers);
  renderSellerReport(store.sellers);
  showStockColumns("all");
  selectStoreOption("initialStoreSelect", store.name, true);
  selectStoreOption("saleStoreSelect", store.name, true);
  updateStoreFilterVisibility();
  updateAdminControls();
  activateStoreFilter("all");
  renderStockTable();
}

function applyAdminContext() {
  const storeList = Object.values(stores);
  const totalProducts = storeList.reduce((sum, store) => sum + parseStockNumber(store.products), 0);
  const totalStock = getTotalStockAmount();
  const totalSales = storeList.reduce((sum, store) => sum + parseCurrency(store.salesToday), 0);
  const totalSalesCount = storeList.reduce((sum, store) => sum + Number(store.salesCount), 0);
  const totalLowStock = storeList.reduce((sum, store) => sum + Number(store.lowStock), 0);
  const monthlyRevenue = storeList.reduce((sum, store) => sum + parseCurrency(store.monthlyRevenue), 0);
  const sellers = Object.values(stores).flatMap((store) => {
    return store.sellers.map((seller) => ({ ...seller, storeName: store.name }));
  });

  setText("currentStore", "Administrador");
  setText("userBox", `Admin | ${totalSalesCount} vendas hoje`);
  setText("dashboardProducts", formatNumber(totalProducts));
  setText("dashboardStock", formatNumber(totalStock));
  setText("dashboardSales", formatCurrency(totalSales));
  setText("dashboardLow", formatNumber(totalLowStock));
  setText("dashboardSummaryTitle", "Resumo de todas as lojas");
  setText("reportRevenue", formatCurrency(monthlyRevenue));
  setText("reportLowStock", formatNumber(totalLowStock));
  setText("reportsTitle", "Relatórios de todas as lojas");

  filterDashboardRows("all");
  populateSellerSelect(sellers);
  renderSellerReport(sellers);
  showStockColumns("all");
  selectStoreOption("initialStoreSelect", "", false);
  selectStoreOption("saleStoreSelect", "", false);
  updateStoreFilterVisibility();
  updateAdminControls();
  activateStoreFilter("all");
  renderStockTable();
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
    row.classList.toggle("hidden", storeKey !== "all" && row.dataset.storeRow !== storeKey);
  });
}

function getStoreKeys() {
  return Object.keys(stores);
}

function parseStockNumber(value) {
  return Number(String(value).replace(/\D/g, "")) || 0;
}

function parseCurrency(value) {
  return Number(String(value).replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
}

function parseBrazilianMoney(value) {
  return Number(String(value).replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
}

function formatNumber(value) {
  return Number(value).toLocaleString("pt-BR");
}

function formatCurrency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getDefaultStockData() {
  const data = {};

  document.querySelectorAll("[data-stock-row]").forEach((row) => {
    data[row.dataset.stockRow] = {};

    getStoreKeys().forEach((storeKey) => {
      const cell = row.querySelector(`[data-store-stock="${storeKey}"]`);
      data[row.dataset.stockRow][storeKey] = cell ? parseStockNumber(cell.textContent) : 0;
    });
  });

  return data;
}

function loadStockData() {
  const defaultData = getDefaultStockData();
  const savedData = JSON.parse(localStorage.getItem(stockStorageKey) || "{}");

  Object.keys(defaultData).forEach((productKey) => {
    defaultData[productKey] = { ...defaultData[productKey], ...savedData[productKey] };
  });

  return defaultData;
}

function getTotalStockAmount() {
  if (!Object.keys(stockData).length) {
    stockData = loadStockData();
  }

  return Object.values(stockData).reduce((total, productStock) => {
    return total + getStoreKeys().reduce((sum, storeKey) => sum + Number(productStock[storeKey] || 0), 0);
  }, 0);
}

function getStoreStockAmount(storeKey) {
  if (!Object.keys(stockData).length) {
    stockData = loadStockData();
  }

  return Object.values(stockData).reduce((total, productStock) => {
    return total + Number(productStock[storeKey] || 0);
  }, 0);
}

function renderStockTable() {
  if (!Object.keys(stockData).length) {
    stockData = loadStockData();
  }

  document.querySelectorAll("[data-stock-row]").forEach((row) => {
    const productKey = row.dataset.stockRow;

    getStoreKeys().forEach((storeKey) => {
      const cell = row.querySelector(`[data-store-stock="${storeKey}"]`);

      if (!cell) {
        return;
      }

      const value = Number(stockData[productKey]?.[storeKey] || 0);
      const canEdit = activeRole === "admin";

      if (canEdit) {
        cell.innerHTML = `<input class="stock-input" type="number" min="0" value="${value}" data-stock-input="${productKey}" data-store-key="${storeKey}">`;
      } else {
        cell.textContent = value;
      }
    });

    updateStockRowTotal(row);
  });
}

function updateStockRowTotal(row) {
  const productKey = row.dataset.stockRow;
  const totalCell = row.querySelector('[data-store-stock="total"]');
  const total = getStoreKeys().reduce((sum, storeKey) => {
    const input = row.querySelector(`[data-store-key="${storeKey}"]`);
    const value = input ? input.value : stockData[productKey]?.[storeKey];
    return sum + Number(value || 0);
  }, 0);

  if (totalCell) {
    totalCell.textContent = total;
  }
}

function saveStockChanges() {
  if (activeRole !== "admin") {
    showMessage("Somente o administrador pode alterar o estoque.");
    return;
  }

  document.querySelectorAll("[data-stock-input]").forEach((input) => {
    const productKey = input.dataset.stockInput;
    const storeKey = input.dataset.storeKey;
    const value = Math.max(0, Number(input.value || 0));

    stockData[productKey][storeKey] = value;
    input.value = value;
    updateStockRowTotal(input.closest("[data-stock-row]"));
  });

  localStorage.setItem(stockStorageKey, JSON.stringify(stockData));

  applyAdminContext();

  showMessage("Estoque atualizado com sucesso.");
}

function showStockColumns(storeKey) {
  document.querySelectorAll("[data-store-stock]").forEach((cell) => {
    const shouldHide = storeKey !== "all" && cell.dataset.storeStock !== storeKey;
    cell.classList.toggle("hidden", shouldHide);
  });
}

function selectStoreOption(selectId, storeName, disabled) {
  const select = document.getElementById(selectId);

  if (!select) {
    return;
  }

  if (storeName) {
    select.value = storeName;
  } else {
    select.selectedIndex = 0;
  }

  select.disabled = disabled;
}

function populateSellerSelect(sellers) {
  const select = document.getElementById("saleSellerSelect");

  if (!select) {
    return;
  }

  select.innerHTML = "";

  sellers.forEach((seller) => {
    const option = document.createElement("option");
    option.value = seller.name;
    option.textContent = seller.name;
    select.appendChild(option);
  });

  updateSaleSummarySeller();
}

function updateSaleSummarySeller() {
  const select = document.getElementById("saleSellerSelect");
  const sellerName = select ? select.value : "-";

  setText("saleSummarySeller", sellerName || "-");
}

function updateSalePrice() {
  const productSelect = document.getElementById("saleProductSelect");
  const quantityInput = document.getElementById("saleQuantityInput");
  const priceInput = document.getElementById("saleUnitPriceInput");
  const discountInput = document.getElementById("saleDiscountInput");

  if (!productSelect || !quantityInput || !priceInput || !discountInput) {
    return;
  }

  const productName = productSelect.value;
  const unitPrice = productPrices[productName] || 0;
  const quantity = Math.max(1, Number(quantityInput.value || 1));
  const discount = Math.max(0, parseBrazilianMoney(discountInput.value));
  const subtotal = unitPrice * quantity;
  const total = Math.max(0, subtotal - discount);

  quantityInput.value = quantity;
  priceInput.value = formatCurrency(unitPrice);
  setText("salePreviewProduct", productName);
  setText("salePreviewQuantity", quantity);
  setText("salePreviewPrice", formatCurrency(unitPrice));
  setText("salePreviewSubtotal", formatCurrency(subtotal));
  setText("saleSummaryItems", quantity);
  setText("saleSummarySubtotal", formatCurrency(subtotal));
  setText("saleSummaryDiscount", formatCurrency(discount));
  setText("saleSummaryTotal", formatCurrency(total));
}

function renderSellerReport(sellers) {
  const tableBody = document.getElementById("sellerReportBody");

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  sellers.forEach((seller) => {
    const row = document.createElement("tr");
    const sellerName = seller.storeName ? `${seller.name} (${seller.storeName})` : seller.name;

    row.innerHTML = `
      <td>${sellerName}</td>
      <td>${seller.sales}</td>
      <td>${seller.revenue}</td>
      <td>${seller.averageTicket}</td>
      <td>${seller.highlight}</td>
    `;

    tableBody.appendChild(row);
  });
}

function activateStoreFilter(storeKey) {
  document.querySelectorAll("[data-store-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.storeFilter === storeKey);
  });
}

function updateStoreFilterVisibility() {
  document.querySelectorAll("[data-store-filter]").forEach((button) => {
    button.classList.toggle("hidden", !activeRole);
  });
}

function updateAdminControls() {
  const saveStockButton = document.getElementById("saveStockButton");

  if (saveStockButton) {
    saveStockButton.classList.toggle("hidden", activeRole !== "admin");
  }
}

document.querySelectorAll("[data-store-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.storeFilter;

    showStockColumns(selectedFilter);
    activateStoreFilter(selectedFilter);
  });
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-stock-input]")) {
    updateStockRowTotal(event.target.closest("[data-stock-row]"));
  }

  if (event.target.matches("#saleQuantityInput, #saleDiscountInput")) {
    updateSalePrice();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#saleProductSelect")) {
    updateSalePrice();
  }
});

const saleSellerSelect = document.getElementById("saleSellerSelect");

if (saleSellerSelect) {
  saleSellerSelect.addEventListener("change", updateSaleSummarySeller);
}

stockData = loadStockData();
updateSalePrice();
