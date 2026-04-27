const titles = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  estoque: "Estoque",
  vendas: "Vendas",
  cadastros: "Cadastros",
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
let stockEditMode = false;
let selectedSaleProducts = [];
let saleProductQuantities = {};
let salesSortState = { column: null, direction: "asc" };
let sellerSortState = { column: null, direction: "asc" };
let stockSortState = { key: null, direction: "asc" };
let productsSortState = { column: null, direction: "asc" };
let editingSaleRow = null;
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
  stockEditMode = false;
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
  if (pageId === "cadastros" && activeRole !== "admin") {
    showMessage("Somente o administrador pode acessar cadastros.");
    return;
  }

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

function saveProductType() {
  const typeInput = document.getElementById("newProductTypeInput");
  const statusInput = document.getElementById("newProductTypeStatus");
  const descriptionInput = document.getElementById("newProductTypeDescription");
  const tableBody = document.getElementById("productTypesTableBody");
  const productTypeSelect = document.getElementById("productTypeSelect");
  const typeName = typeInput?.value.trim() || "";

  if (!typeName) {
    showMessage("Informe o nome do tipo de produto.");
    typeInput?.focus();
    return;
  }

  if (isDuplicateTableValue(tableBody, typeName)) {
    showMessage("Esse tipo de produto já está cadastrado.");
    return;
  }

  const row = document.createElement("tr");
  appendTextCell(row, typeName);
  appendTextCell(row, descriptionInput?.value.trim() || "-");
  appendBadgeCell(row, statusInput?.value || "Ativo");
  tableBody?.appendChild(row);

  if (productTypeSelect && !Array.from(productTypeSelect.options).some((option) => option.value === typeName)) {
    addSelectOption(productTypeSelect, typeName, typeName);
  }

  typeInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (statusInput) statusInput.value = "Ativo";
  showMessage("Tipo de produto cadastrado.");
}

function saveStoreRegistration() {
  const nameInput = document.getElementById("newStoreNameInput");
  const managerInput = document.getElementById("newStoreManagerInput");
  const statusInput = document.getElementById("newStoreStatus");
  const phoneInput = document.getElementById("newStorePhoneInput");
  const addressInput = document.getElementById("newStoreAddressInput");
  const tableBody = document.getElementById("storesRegistrationTableBody");
  const storeName = nameInput?.value.trim() || "";

  if (!storeName) {
    showMessage("Informe o nome da loja.");
    nameInput?.focus();
    return;
  }

  if (isDuplicateTableValue(tableBody, storeName)) {
    showMessage("Essa loja já está cadastrada.");
    return;
  }

  const row = document.createElement("tr");
  appendTextCell(row, storeName);
  appendTextCell(row, managerInput?.value.trim() || "-");
  appendTextCell(row, phoneInput?.value.trim() || "-");
  appendTextCell(row, addressInput?.value.trim() || "-");
  appendBadgeCell(row, statusInput?.value || "Operando");
  tableBody?.appendChild(row);

  addStoreOption("storeOptions", storeName);
  addStoreOption("initialStoreSelect", storeName);
  addStoreOption("saleStoreSelect", storeName);

  [nameInput, managerInput, phoneInput, addressInput].forEach((input) => {
    if (input) input.value = "";
  });

  if (statusInput) statusInput.value = "Operando";
  showMessage("Loja cadastrada.");
}

function isDuplicateTableValue(tableBody, value) {
  if (!tableBody) {
    return false;
  }

  return Array.from(tableBody.querySelectorAll("tr td:first-child")).some((cell) => {
    return normalizeText(cell.textContent) === normalizeText(value);
  });
}

function appendTextCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
}

function appendBadgeCell(row, value) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `badge ${getStatusBadgeClass(value)}`;
  badge.textContent = value;
  cell.appendChild(badge);
  row.appendChild(cell);
}

function getStatusBadgeClass(value) {
  const normalizedValue = normalizeText(value);

  if (normalizedValue.includes("inativo") || normalizedValue.includes("inativa")) {
    return "low";
  }

  if (normalizedValue.includes("implantacao")) {
    return "info";
  }

  return "ok";
}

function addStoreOption(selectId, storeName) {
  const select = document.getElementById(selectId);

  if (!select || Array.from(select.children).some((option) => option.value === storeName)) {
    return;
  }

  const option = document.createElement("option");
  option.value = storeName;
  option.textContent = select.tagName === "DATALIST" ? "" : storeName;
  select.appendChild(option);
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
      const canEdit = activeRole === "admin" && stockEditMode;

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

function enableStockEditing() {
  if (activeRole !== "admin") {
    showMessage("Somente o administrador pode editar o estoque.");
    return;
  }

  stockEditMode = true;
  renderStockTable();
  updateAdminControls();
  showMessage("Edição de estoque ativada.");
}

function saveStockChanges() {
  if (activeRole !== "admin") {
    showMessage("Somente o administrador pode alterar o estoque.");
    return;
  }

  if (!stockEditMode) {
    showMessage("Clique em Editar estoque antes de salvar.");
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

  stockEditMode = false;
  applyAdminContext();

  showMessage("Estoque atualizado com sucesso.");
}

function showStockColumns(storeKey) {
  document.querySelectorAll("[data-store-stock]").forEach((cell) => {
    const shouldHide = storeKey !== "all" && cell.dataset.storeStock !== storeKey;
    cell.classList.toggle("hidden", shouldHide);
  });

  document.querySelectorAll("[data-stock-status]").forEach((cell) => {
    cell.classList.toggle("hidden", storeKey === "all");
  });
}

function filterStockRows(searchTerm) {
  const normalizedSearch = normalizeText(searchTerm);

  document.querySelectorAll("[data-stock-row]").forEach((row) => {
    const productName = row.querySelector("td:first-child")?.textContent || "";
    row.classList.toggle("hidden", !normalizeText(productName).includes(normalizedSearch));
  });
}

function sortStockTable(sortKey, type) {
  const firstStockRow = document.querySelector("[data-stock-row]");
  const tableBody = firstStockRow?.parentElement;

  if (!tableBody) {
    return;
  }

  const direction = stockSortState.key === sortKey && stockSortState.direction === "asc" ? "desc" : "asc";
  const rows = Array.from(tableBody.querySelectorAll("[data-stock-row]"));

  rows.sort((firstRow, secondRow) => {
    const firstValue = getStockSortValue(firstRow, sortKey, type);
    const secondValue = getStockSortValue(secondRow, sortKey, type);
    const comparison = type === "text"
      ? String(firstValue).localeCompare(String(secondValue), "pt-BR")
      : firstValue - secondValue;

    return direction === "asc" ? comparison : -comparison;
  });

  rows.forEach((row) => tableBody.appendChild(row));
  stockSortState = { key: sortKey, direction };
}

function getStockSortValue(row, sortKey, type) {
  let cell;

  if (sortKey === "product") {
    cell = row.querySelector("td:first-child");
  } else if (sortKey === "status") {
    cell = row.querySelector("[data-stock-status]");
  } else {
    cell = row.querySelector(`[data-store-stock="${sortKey}"]`);
  }

  if (!cell) {
    return type === "number" ? 0 : "";
  }

  const input = cell.querySelector("input");
  const value = input ? input.value : cell.textContent;

  if (type === "number") {
    return Number(value) || 0;
  }

  return normalizeText(value);
}

function sortProductsTable(columnIndex, type) {
  const firstProductRow = document.querySelector("#produtos table tbody tr");
  const tableBody = firstProductRow?.parentElement;

  if (!tableBody) {
    return;
  }

  const direction = productsSortState.column === columnIndex && productsSortState.direction === "asc" ? "desc" : "asc";
  const rows = Array.from(tableBody.querySelectorAll("tr"));

  rows.sort((firstRow, secondRow) => {
    const firstValue = getProductsSortValue(firstRow, columnIndex, type);
    const secondValue = getProductsSortValue(secondRow, columnIndex, type);
    const comparison = type === "text"
      ? String(firstValue).localeCompare(String(secondValue), "pt-BR")
      : firstValue - secondValue;

    return direction === "asc" ? comparison : -comparison;
  });

  rows.forEach((row) => tableBody.appendChild(row));
  productsSortState = { column: columnIndex, direction };
}

function getProductsSortValue(row, columnIndex, type) {
  const value = row.children[columnIndex]?.textContent.trim() || "";

  if (type === "money") {
    return parseBrazilianMoney(value);
  }

  if (type === "number") {
    return Number(value) || 0;
  }

  return normalizeText(value);
}

function openProductFilters() {
  document.getElementById("productFilterModal")?.classList.remove("hidden");
}

function closeProductFilters() {
  document.getElementById("productFilterModal")?.classList.add("hidden");
}

function applyProductFilters() {
  const text = normalizeText(document.getElementById("productTextFilter")?.value || "");
  const type = document.getElementById("productTypeFilter")?.value || "all";
  const status = document.getElementById("productStatusFilter")?.value || "all";
  const minPrice = parseBrazilianMoney(document.getElementById("productMinPriceFilter")?.value || "");
  const maxPriceValue = document.getElementById("productMaxPriceFilter")?.value || "";
  const maxPrice = maxPriceValue.trim() ? parseBrazilianMoney(maxPriceValue) : Infinity;
  const minStock = Number(document.getElementById("productMinStockFilter")?.value || 0);
  const maxStockValue = document.getElementById("productMaxStockFilter")?.value || "";
  const maxStock = maxStockValue.trim() ? Number(maxStockValue) : Infinity;

  document.querySelectorAll("#productsTableBody tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    const rowSku = normalizeText(cells[0]?.textContent || "");
    const rowProduct = normalizeText(cells[1]?.textContent || "");
    const rowType = cells[2]?.textContent || "";
    const rowPrice = parseBrazilianMoney(cells[3]?.textContent || "");
    const rowStock = Number(cells[4]?.textContent || 0);
    const rowStatus = cells[5]?.textContent || "";
    const matchesText = !text || rowSku.includes(text) || rowProduct.includes(text);
    const matchesType = type === "all" || normalizeText(rowType) === normalizeText(type);
    const matchesStatus = status === "all" || normalizeText(rowStatus) === normalizeText(status);
    const matchesPrice = rowPrice >= minPrice && rowPrice <= maxPrice;
    const matchesStock = rowStock >= minStock && rowStock <= maxStock;

    row.classList.toggle("hidden", !(matchesText && matchesType && matchesStatus && matchesPrice && matchesStock));
  });

  closeProductFilters();
}

function clearProductFilters() {
  const filterIds = [
    "productTextFilter",
    "productMinPriceFilter",
    "productMaxPriceFilter",
    "productMinStockFilter",
    "productMaxStockFilter"
  ];

  filterIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });

  const type = document.getElementById("productTypeFilter");
  const status = document.getElementById("productStatusFilter");

  if (type) type.value = "all";
  if (status) status.value = "all";

  document.querySelectorAll("#productsTableBody tr").forEach((row) => {
    row.classList.remove("hidden");
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
  const discountInput = document.getElementById("saleDiscountInput");

  if (!productSelect || !discountInput) {
    return;
  }

  const productNames = getSelectedSaleProducts();
  const itemCount = productNames.reduce((sum, productName) => sum + getSaleProductQuantity(productName), 0);
  const subtotal = productNames.reduce((sum, productName) => {
    return sum + (productPrices[productName] || 0) * getSaleProductQuantity(productName);
  }, 0);
  const discount = Math.max(0, parseBrazilianMoney(discountInput.value));
  const total = Math.max(0, subtotal - discount);

  setText("saleSummaryItems", itemCount);
  setText("saleSummaryProducts", productNames.length ? productNames.join(", ") : "-");
  setText("saleSummarySubtotal", formatCurrency(subtotal));
  setText("saleSummaryDiscount", formatCurrency(discount));
  setText("saleSummaryTotal", formatCurrency(total));
  updatePaymentSummary();
}

function populateSaleProductSearch() {
  renderSaleProductResults("");
}

function getSelectedSaleProducts() {
  return selectedSaleProducts.length ? selectedSaleProducts : [];
}

function getSaleProductQuantity(productName) {
  return Math.max(1, Number(saleProductQuantities[productName] || 1));
}

function renderSaleProductResults(searchTerm) {
  const results = document.getElementById("saleProductResults");

  if (!results) {
    return;
  }

  const normalizedSearch = normalizeText(searchTerm);
  const products = getStockProductNames().filter((productName) => {
    return !normalizedSearch || normalizeText(productName).includes(normalizedSearch);
  });

  results.innerHTML = "";

  if (products.length === 0) {
    results.classList.add("hidden");
    return;
  }

  products.forEach((productName) => {
    const item = document.createElement("label");
    item.className = "product-search-option";
    const isSelected = selectedSaleProducts.includes(productName);
    item.innerHTML = `
      <input type="checkbox" value="${productName}" ${isSelected ? "checked" : ""}>
      <span>${productName}</span>
      <input class="product-quantity-input" type="number" min="1" placeholder="Qtd" value="${isSelected ? getSaleProductQuantity(productName) : ""}" data-product-quantity="${productName}" ${isSelected ? "" : "disabled"}>
      <small>Estoque: ${getProductTotalStock(productName)} | ${formatCurrency(productPrices[productName] || 0)}</small>
    `;
    results.appendChild(item);
  });

  results.classList.remove("hidden");
}

function toggleSaleProduct(productName, checked) {
  if (checked && !selectedSaleProducts.includes(productName)) {
    selectedSaleProducts.push(productName);
    saleProductQuantities[productName] = getSaleProductQuantity(productName);
  }

  if (!checked) {
    selectedSaleProducts = selectedSaleProducts.filter((selectedProduct) => selectedProduct !== productName);
  }
}

function updateSaleProductQuantity(productName, quantity) {
  saleProductQuantities[productName] = Math.max(1, Number(quantity || 1));
}

function getStockProductNames() {
  return Array.from(document.querySelectorAll("[data-stock-row] td:first-child")).map((cell) => {
    return cell.textContent.trim();
  });
}

function getProductTotalStock(productName) {
  const row = Array.from(document.querySelectorAll("[data-stock-row]")).find((stockRow) => {
    const nameCell = stockRow.querySelector("td:first-child");
    return nameCell && nameCell.textContent.trim() === productName;
  });

  if (!row) {
    return 0;
  }

  return getStoreKeys().reduce((total, storeKey) => {
    return total + Number(stockData[row.dataset.stockRow]?.[storeKey] || 0);
  }, 0);
}

function updatePaymentSummary() {
  const paymentSelect = document.getElementById("salePaymentSelect");
  const installmentsGroup = document.getElementById("saleInstallmentsGroup");
  const installmentsSelect = document.getElementById("saleInstallmentsSelect");
  const mixedPaymentGroup = document.getElementById("mixedPaymentGroup");

  if (!paymentSelect || !installmentsGroup || !installmentsSelect || !mixedPaymentGroup) {
    return;
  }

  const paymentMethod = paymentSelect.value;
  const normalizedPayment = normalizeText(paymentMethod);
  const isCredit = normalizedPayment === "cartao de credito";
  const isMixed = normalizedPayment === "pagamento misto";

  installmentsGroup.classList.toggle("hidden", !isCredit);
  mixedPaymentGroup.classList.toggle("hidden", !isMixed);

  if (!isCredit) {
    installmentsSelect.value = "1";
  }

  const installmentText = installmentsSelect.value === "1" ? "À vista" : `${installmentsSelect.value}x`;

  setText("saleSummaryPayment", paymentMethod);
  setText("saleSummaryInstallments", installmentText);
  setText("saleSummaryMixedPayment", isMixed ? getMixedPaymentSummary() : "-");
}

function getMixedPaymentSummary() {
  const methodFields = document.querySelectorAll(".mixed-payment-method");
  const valueFields = document.querySelectorAll(".mixed-payment-value");
  const payments = [];

  valueFields.forEach((valueField, index) => {
    const value = parseBrazilianMoney(valueField.value);

    if (value > 0) {
      payments.push(`${methodFields[index].value}: ${formatCurrency(value)}`);
    }
  });

  return payments.length ? payments.join(" | ") : "Informe os valores";
}

function finalizeSale() {
  const salesTableBody = document.getElementById("salesTableBody");
  const customerInput = document.getElementById("saleCustomerInput");

  if (!salesTableBody) {
    return;
  }

  if (selectedSaleProducts.length === 0) {
    showMessage("Selecione pelo menos um produto para finalizar a venda.");
    return;
  }

  const row = document.createElement("tr");
  const values = [
    formatSaleDateTime(new Date()),
    customerInput?.value.trim() || "Cliente não informado",
    getSaleProductsText(),
    document.getElementById("saleSellerSelect")?.value || "-",
    getSalePaymentText(),
    document.getElementById("saleSummaryTotal")?.textContent || "R$ 0,00"
  ];

  values.forEach((value) => {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  });

  const actionCell = document.createElement("td");
  actionCell.dataset.saleAction = "";
  const actionWrapper = document.createElement("div");
  actionWrapper.className = "sale-action-buttons";
  const editButton = document.createElement("button");
  editButton.className = "btn secondary sale-edit-btn";
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => openSaleEditModal(editButton));
  actionWrapper.appendChild(editButton);
  actionCell.appendChild(actionWrapper);
  row.appendChild(actionCell);

  salesTableBody.prepend(row);
  updateSaleEditControls();
  filterSalesRows();
  resetSaleForm();
  showMessage("Venda finalizada e adicionada em vendas realizadas.");
}

function formatSaleDateTime(date) {
  return `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function getSaleProductsText() {
  return selectedSaleProducts.map((productName) => {
    return `${getSaleProductQuantity(productName)}x ${productName}`;
  }).join(", ");
}

function getSalePaymentText() {
  const payment = document.getElementById("saleSummaryPayment")?.textContent || "-";
  const installments = document.getElementById("saleSummaryInstallments")?.textContent || "À vista";
  const mixed = document.getElementById("saleSummaryMixedPayment")?.textContent || "-";

  if (normalizeText(payment) === "pagamento misto") {
    return mixed !== "-" ? `Pagamento misto - ${mixed}` : "Pagamento misto";
  }

  if (normalizeText(payment) === "cartao de credito" && installments !== "À vista") {
    return `${payment} - ${installments}`;
  }

  return payment;
}

function resetSaleForm() {
  const customerInput = document.getElementById("saleCustomerInput");
  const productInput = document.getElementById("saleProductSelect");
  const discountInput = document.getElementById("saleDiscountInput");
  const paymentSelect = document.getElementById("salePaymentSelect");
  const results = document.getElementById("saleProductResults");

  selectedSaleProducts = [];
  saleProductQuantities = {};

  if (customerInput) {
    customerInput.value = "";
  }

  if (productInput) {
    productInput.value = "";
  }

  if (discountInput) {
    discountInput.value = "";
  }

  if (paymentSelect) {
    paymentSelect.value = "Pix";
  }

  document.querySelectorAll(".mixed-payment-value").forEach((input) => {
    input.value = "";
  });

  if (results) {
    results.classList.add("hidden");
    results.innerHTML = "";
  }

  updateSalePrice();
}

function filterSalesRows() {
  const period = document.getElementById("salesPeriodFilter")?.value || "all";
  const minPrice = parseBrazilianMoney(document.getElementById("salesMinPriceFilter")?.value || "");
  const maxPriceValue = document.getElementById("salesMaxPriceFilter")?.value || "";
  const maxPrice = maxPriceValue.trim() ? parseBrazilianMoney(maxPriceValue) : Infinity;
  const seller = normalizeText(document.getElementById("salesSellerFilter")?.value || "");
  const payment = document.getElementById("salesPaymentFilter")?.value || "all";

  document.querySelectorAll("#salesTableBody tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    const rowDate = parseBrazilianDate(cells[0]?.textContent || "");
    const rowSeller = normalizeText(cells[3]?.textContent || "");
    const rowPayment = normalizeText(cells[4]?.textContent || "");
    const rowTotal = parseBrazilianMoney(cells[5]?.textContent || "");
    const matchesPeriod = matchesSalesPeriod(rowDate, period);
    const matchesPrice = rowTotal >= minPrice && rowTotal <= maxPrice;
    const matchesSeller = !seller || rowSeller.includes(seller);
    const matchesPayment = payment === "all" || rowPayment.includes(normalizeText(payment));

    row.classList.toggle("hidden", !(matchesPeriod && matchesPrice && matchesSeller && matchesPayment));
  });
}

function parseBrazilianDate(value) {
  const dateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

  if (!dateMatch) {
    return null;
  }

  const [, day, month, year, hour = "0", minute = "0"] = dateMatch;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

function matchesSalesPeriod(date, period) {
  if (period === "all") {
    return true;
  }

  if (!date) {
    return false;
  }

  const saleDate = new Date(date);
  saleDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "0") {
    return saleDate.getTime() === today.getTime();
  }

  if (period === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return saleDate.getTime() === yesterday.getTime();
  }

  const days = Number(period);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days);

  return saleDate >= startDate;
}

function openSalesFilters() {
  document.getElementById("salesFilterModal")?.classList.remove("hidden");
}

function closeSalesFilters() {
  document.getElementById("salesFilterModal")?.classList.add("hidden");
}

function applySalesFilters() {
  filterSalesRows();
  closeSalesFilters();
}

function openSaleEditModal(button) {
  if (activeRole !== "admin") {
    showMessage("Somente o administrador pode editar vendas.");
    return;
  }

  const row = button.closest("tr");

  if (!row) {
    return;
  }

  const cells = row.querySelectorAll("td");
  editingSaleRow = row;
  populateEditSaleSellerSelect(cells[3]?.textContent || "");
  populateEditSalePaymentSelect(cells[4]?.textContent || "");

  setInputValue("editSaleDateInput", cells[0]?.textContent || "");
  setInputValue("editSaleCustomerInput", cells[1]?.textContent || "");
  setInputValue("editSaleProductsInput", cells[2]?.textContent || "");
  setInputValue("editSaleTotalInput", cells[5]?.textContent || "");
  setInputValue("editSaleReasonInput", "");

  document.getElementById("saleEditModal")?.classList.remove("hidden");
}

function populateEditSaleSellerSelect(currentSeller) {
  const select = document.getElementById("editSaleSellerInput");

  if (!select) {
    return;
  }

  const sellerNames = getAllSellerNames();
  select.innerHTML = "";

  sellerNames.forEach((sellerName) => {
    addSelectOption(select, sellerName, sellerName);
  });

  if (currentSeller && !sellerNames.includes(currentSeller)) {
    addSelectOption(select, currentSeller, currentSeller);
  }

  select.value = currentSeller || sellerNames[0] || "";
}

function populateEditSalePaymentSelect(currentPayment) {
  const select = document.getElementById("editSalePaymentInput");

  if (!select) {
    return;
  }

  const paymentOptions = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Pagamento misto"];
  const selectedPayment = getBasePaymentMethod(currentPayment);

  select.innerHTML = "";
  paymentOptions.forEach((payment) => addSelectOption(select, payment, payment));
  select.value = selectedPayment || paymentOptions[0];
}

function getAllSellerNames() {
  return [...new Set(Object.values(stores).flatMap((store) => {
    return store.sellers.map((seller) => seller.name);
  }))];
}

function getBasePaymentMethod(payment) {
  const normalizedPayment = normalizeText(payment);

  if (normalizedPayment.includes("pagamento misto")) return "Pagamento misto";
  if (normalizedPayment.includes("cartao de credito")) return "Cartão de crédito";
  if (normalizedPayment.includes("cartao de debito")) return "Cartão de débito";
  if (normalizedPayment.includes("dinheiro")) return "Dinheiro";
  if (normalizedPayment.includes("pix")) return "Pix";

  return "";
}

function addSelectOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function closeSaleEditModal() {
  document.getElementById("saleEditModal")?.classList.add("hidden");
  editingSaleRow = null;
}

function saveSaleEdit() {
  if (!editingSaleRow) {
    return;
  }

  const reason = getSaleEditReason();

  if (!reason) {
    showMessage("Informe o motivo da edição da venda.");
    document.getElementById("editSaleReasonInput")?.focus();
    return;
  }

  const cells = editingSaleRow.querySelectorAll("td");
  const values = [
    cells[0]?.textContent || "",
    document.getElementById("editSaleCustomerInput")?.value.trim(),
    document.getElementById("editSaleProductsInput")?.value.trim(),
    document.getElementById("editSaleSellerInput")?.value.trim(),
    document.getElementById("editSalePaymentInput")?.value.trim(),
    document.getElementById("editSaleTotalInput")?.value.trim()
  ];

  values.forEach((value, index) => {
    if (cells[index]) {
      cells[index].textContent = value || "-";
    }
  });

  editingSaleRow.dataset.editReason = reason;
  ensureSaleReasonButton(editingSaleRow);
  filterSalesRows();
  closeSaleEditModal();
  showMessage("Venda atualizada com sucesso.");
}

function deleteSaleFromEdit() {
  if (!editingSaleRow) {
    return;
  }

  const reason = getSaleEditReason();

  if (!reason) {
    showMessage("Informe o motivo da edição antes de excluir a venda.");
    document.getElementById("editSaleReasonInput")?.focus();
    return;
  }

  const confirmed = window.confirm("Deseja realmente excluir esta venda?");

  if (!confirmed) {
    return;
  }

  editingSaleRow.remove();
  closeSaleEditModal();
  filterSalesRows();
  showMessage("Venda excluída com sucesso.");
}

function getSaleEditReason() {
  return document.getElementById("editSaleReasonInput")?.value.trim() || "";
}

function ensureSaleReasonButton(row) {
  const actionCell = row.querySelector("[data-sale-action]");

  if (!actionCell) {
    return;
  }

  let actionWrapper = actionCell.querySelector(".sale-action-buttons");

  if (!actionWrapper) {
    actionWrapper = document.createElement("div");
    actionWrapper.className = "sale-action-buttons";
    actionWrapper.append(...Array.from(actionCell.childNodes));
    actionCell.appendChild(actionWrapper);
  }

  if (actionWrapper.querySelector(".sale-history-btn")) {
    return;
  }

  const reasonButton = document.createElement("button");
  reasonButton.type = "button";
  reasonButton.className = "btn secondary icon-btn sale-history-btn";
  reasonButton.title = "Ver motivo da edição";
  reasonButton.setAttribute("aria-label", "Ver motivo da edição");
  reasonButton.innerHTML = getEyeIconMarkup();
  reasonButton.addEventListener("click", () => openSaleEditReasonModal(reasonButton));
  actionWrapper.appendChild(reasonButton);
  updateSaleEditControls();
}

function getEyeIconMarkup() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;
}

function openSaleEditReasonModal(button) {
  const row = button.closest("tr");
  const reason = row?.dataset.editReason || "Motivo não informado.";

  setText("saleEditReasonText", reason);
  document.getElementById("saleEditReasonModal")?.classList.remove("hidden");
}

function closeSaleEditReasonModal() {
  document.getElementById("saleEditReasonModal")?.classList.add("hidden");
}

function setInputValue(id, value) {
  const input = document.getElementById(id);

  if (input) {
    input.value = value;
  }
}

function clearSalesFilters() {
  const period = document.getElementById("salesPeriodFilter");
  const minPrice = document.getElementById("salesMinPriceFilter");
  const maxPrice = document.getElementById("salesMaxPriceFilter");
  const seller = document.getElementById("salesSellerFilter");
  const payment = document.getElementById("salesPaymentFilter");

  if (period) period.value = "all";
  if (minPrice) minPrice.value = "";
  if (maxPrice) maxPrice.value = "";
  if (seller) seller.value = "";
  if (payment) payment.value = "all";

  filterSalesRows();
}

function sortSalesTable(columnIndex, type) {
  const tableBody = document.getElementById("salesTableBody");

  if (!tableBody) {
    return;
  }

  const direction = salesSortState.column === columnIndex && salesSortState.direction === "asc" ? "desc" : "asc";
  const rows = Array.from(tableBody.querySelectorAll("tr"));

  rows.sort((firstRow, secondRow) => {
    const firstValue = getSalesSortValue(firstRow, columnIndex, type);
    const secondValue = getSalesSortValue(secondRow, columnIndex, type);
    const comparison = type === "text"
      ? String(firstValue).localeCompare(String(secondValue), "pt-BR")
      : firstValue - secondValue;

    return direction === "asc" ? comparison : -comparison;
  });

  rows.forEach((row) => tableBody.appendChild(row));
  salesSortState = { column: columnIndex, direction };
  filterSalesRows();
}

function getSalesSortValue(row, columnIndex, type) {
  const value = row.children[columnIndex]?.textContent.trim() || "";

  if (type === "date") {
    return parseBrazilianDate(value)?.getTime() || 0;
  }

  if (type === "money") {
    return parseBrazilianMoney(value);
  }

  return normalizeText(value);
}

function sortSellerReport(columnIndex, type) {
  const tableBody = document.getElementById("sellerReportBody");

  if (!tableBody) {
    return;
  }

  const direction = sellerSortState.column === columnIndex && sellerSortState.direction === "asc" ? "desc" : "asc";
  const rows = Array.from(tableBody.querySelectorAll("tr"));

  rows.sort((firstRow, secondRow) => {
    const firstValue = getSellerSortValue(firstRow, columnIndex, type);
    const secondValue = getSellerSortValue(secondRow, columnIndex, type);
    const comparison = type === "text"
      ? String(firstValue).localeCompare(String(secondValue), "pt-BR")
      : firstValue - secondValue;

    return direction === "asc" ? comparison : -comparison;
  });

  rows.forEach((row) => tableBody.appendChild(row));
  sellerSortState = { column: columnIndex, direction };
}

function getSellerSortValue(row, columnIndex, type) {
  const value = row.children[columnIndex]?.textContent.trim() || "";

  if (type === "money") {
    return parseBrazilianMoney(value);
  }

  if (type === "number") {
    return Number(value) || 0;
  }

  return normalizeText(value);
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
  const editStockButton = document.getElementById("editStockButton");
  const saveStockButton = document.getElementById("saveStockButton");
  const canManageStock = activeRole === "admin";

  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.classList.toggle("hidden", !canManageStock);
  });

  if (editStockButton) {
    editStockButton.classList.toggle("hidden", !canManageStock || stockEditMode);
  }

  if (saveStockButton) {
    saveStockButton.classList.toggle("hidden", !canManageStock || !stockEditMode);
  }

  updateSaleEditControls();
}

function updateSaleEditControls() {
  document.querySelectorAll("[data-sale-action]").forEach((cell) => {
    cell.classList.toggle("hidden", activeRole !== "admin");
  });

  document.querySelectorAll(".sale-edit-btn, .sale-history-btn").forEach((button) => {
    button.classList.toggle("hidden", activeRole !== "admin");
  });
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

  if (event.target.matches("#stockSearchInput")) {
    filterStockRows(event.target.value);
  }

  if (event.target.matches("#saleProductSelect")) {
    renderSaleProductResults(event.target.value);
    updateSalePrice();
  }

  if (event.target.matches("#saleDiscountInput")) {
    updateSalePrice();
  }

  if (event.target.matches("[data-product-quantity]")) {
    updateSaleProductQuantity(event.target.dataset.productQuantity, event.target.value);
    updateSalePrice();
  }

  if (event.target.matches(".mixed-payment-value")) {
    updatePaymentSummary();
  }

  if (event.target.matches("#salesMinPriceFilter, #salesMaxPriceFilter, #salesSellerFilter")) {
    filterSalesRows();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#saleProductResults input[type='checkbox']")) {
    toggleSaleProduct(event.target.value, event.target.checked);
    const quantityInput = event.target.closest(".product-search-option").querySelector("[data-product-quantity]");

    if (quantityInput) {
      quantityInput.disabled = !event.target.checked;

      if (event.target.checked && !quantityInput.value) {
        quantityInput.value = getSaleProductQuantity(event.target.value);
      }
    }

    updateSalePrice();
  }

  if (event.target.matches("#salePaymentSelect, #saleInstallmentsSelect, .mixed-payment-method")) {
    updatePaymentSummary();
  }

  if (event.target.matches("#salesPeriodFilter, #salesPaymentFilter")) {
    filterSalesRows();
  }
});

const saleSellerSelect = document.getElementById("saleSellerSelect");

if (saleSellerSelect) {
  saleSellerSelect.addEventListener("change", updateSaleSummarySeller);
}

stockData = loadStockData();
populateSaleProductSearch();
updateSalePrice();
