const titles = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  estoque: "Estoque",
  vendas: "Vendas",
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
let selectedSaleProducts = [];
let saleProductQuantities = {};
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

  if (!searchTerm.trim() || products.length === 0) {
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
    new Date().toLocaleDateString("pt-BR"),
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
  const editButton = document.createElement("button");
  editButton.className = "btn secondary";
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => showMessage("Edição da venda aberta no protótipo!"));
  actionCell.appendChild(editButton);
  row.appendChild(actionCell);

  salesTableBody.prepend(row);
  resetSaleForm();
  showMessage("Venda finalizada e adicionada em vendas realizadas.");
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
});

document.addEventListener("click", (event) => {
  const results = document.getElementById("saleProductResults");

  if (results && !event.target.closest("#saleProductResults") && !event.target.matches("#saleProductSelect")) {
    results.classList.add("hidden");
  }
});

const saleSellerSelect = document.getElementById("saleSellerSelect");

if (saleSellerSelect) {
  saleSellerSelect.addEventListener("change", updateSaleSummarySeller);
}

stockData = loadStockData();
populateSaleProductSearch();
updateSalePrice();
