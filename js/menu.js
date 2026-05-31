(function () {
  const menu = Array.isArray(window.PIZZA_BALAD_MENU) ? window.PIZZA_BALAD_MENU : [];
  const categories = ["الكل", "بيتسا", "باستا", "رڤيولي", "سلطات", "مشروبات"];
  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const search = document.getElementById("menuSearch");
  const meta = document.getElementById("resultsMeta");
  const empty = document.getElementById("emptyState");
  const year = document.getElementById("year");

  let activeCategory = "الكل";
  let query = "";

  if (year) year.textContent = new Date().getFullYear();

  const formatPrice = (price) => `${price} ₪`;

  const normalize = (value) => String(value || "").trim().toLowerCase();

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const createProductCard = (product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${Math.min(index * 45, 360)}ms`;

    card.innerHTML = `
      <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" width="520" height="410">
      <div class="product-body">
        <span class="category-pill">${escapeHTML(product.category)}</span>
        <div class="product-top">
          <h2>${escapeHTML(product.name)}</h2>
          <span class="price">${escapeHTML(formatPrice(product.price))}</span>
        </div>
        <p>${escapeHTML(product.description)}</p>
      </div>
    `;

    return card;
  };

  const renderTabs = () => {
    const fragment = document.createDocumentFragment();
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = category;
      button.className = category === activeCategory ? "is-active" : "";
      button.setAttribute("aria-pressed", category === activeCategory ? "true" : "false");
      button.addEventListener("click", () => {
        activeCategory = category;
        renderTabs();
        renderProducts();
      });
      fragment.appendChild(button);
    });
    tabs.replaceChildren(fragment);
  };

  const filterProducts = () => {
    const term = normalize(query);
    return menu.filter((product) => {
      const matchesCategory = activeCategory === "الكل" || product.category === activeCategory;
      const searchTarget = normalize(`${product.name} ${product.description} ${product.category}`);
      return matchesCategory && searchTarget.includes(term);
    });
  };

  const renderProducts = () => {
    const products = filterProducts();
    const fragment = document.createDocumentFragment();
    products.forEach((product, index) => fragment.appendChild(createProductCard(product, index)));
    grid.replaceChildren(fragment);
    empty.hidden = products.length > 0;
    meta.textContent = `تم عرض ${products.length} من ${menu.length} منتج`;
  };

  search.addEventListener("input", (event) => {
    query = event.target.value;
    renderProducts();
  });

  renderTabs();
  renderProducts();
})();
