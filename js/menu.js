(function () {
  const site = window.PIZZA_BALAD_SITE || {};
  const menu = Array.isArray(window.PIZZA_BALAD_MENU) ? window.PIZZA_BALAD_MENU : [];
  const categories = ["الكل", "بيتسا", "باستا", "رڤيولي", "سلطات", "مشروبات"];
  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const search = document.getElementById("menuSearch");
  const meta = document.getElementById("resultsMeta");
  const empty = document.getElementById("emptyState");
  const year = document.getElementById("year");
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const emptyCart = document.getElementById("emptyCart");
  const clearCart = document.getElementById("clearCart");
  const cartPanel = document.querySelector(".cart-panel");
  const cartToggle = document.getElementById("cartToggle");
  const cartClose = document.getElementById("cartClose");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartFloatCount = document.getElementById("cartFloatCount");
  const cartFloatTotal = document.getElementById("cartFloatTotal");
  const customizer = document.getElementById("customizer");
  const closeCustomizer = document.getElementById("closeCustomizer");
  const saveCartItem = document.getElementById("saveCartItem");

  const customizerImage = document.getElementById("customizerImage");
  const customizerCategory = document.getElementById("customizerCategory");
  const customizerTitle = document.getElementById("customizerTitle");
  const customizerDescription = document.getElementById("customizerDescription");
  const customizerPrice = document.getElementById("customizerPrice");
  const ingredientsOptions = document.getElementById("ingredientsOptions");
  const freeAddonOptions = document.getElementById("freeAddonOptions");
  const paidAddonOptions = document.getElementById("paidAddonOptions");
  const itemNotes = document.getElementById("itemNotes");
  const itemQty = document.getElementById("itemQty");

  let activeCategory = "الكل";
  let query = "";
  let cart = [];
  let activeProduct = null;
  let editingCartId = null;

  if (year) year.textContent = new Date().getFullYear();

  if (site.phone?.tel) {
    document.querySelectorAll("[data-site-phone-link]").forEach((link) => {
      link.href = `tel:${site.phone.tel}`;
    });
  }

  const formatPrice = (price) => `${price} ₪`;
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const toArray = (value) => Array.isArray(value) ? value : [];
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const getProduct = (id) => menu.find((product) => product.id === Number(id));

  const itemAddonTotal = (item) => toArray(item.paidAddons).reduce((sum, addon) => sum + Number(addon.price || 0), 0);

  const itemTotal = (item) => {
    const product = getProduct(item.productId);
    if (!product) return 0;
    return (Number(product.price || 0) + itemAddonTotal(item)) * Number(item.qty || 1);
  };

  const productHasOptions = (product) => (
    toArray(product.ingredients).length > 0 ||
    toArray(product.freeAddons).length > 0 ||
    toArray(product.paidAddons).length > 0
  );

  const createChips = (items, emptyText) => {
    if (!toArray(items).length) return `<p class="muted-line">${escapeHTML(emptyText)}</p>`;
    return `<div class="chips">${items.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>`;
  };

  const createProductCard = (product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${Math.min(index * 45, 360)}ms`;
    const freeAddons = toArray(product.freeAddons);
    const paidAddons = toArray(product.paidAddons);
    const ingredients = toArray(product.ingredients);

    card.innerHTML = `
      <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" width="520" height="410">
      <div class="product-body">
        <span class="category-pill">${escapeHTML(product.category)}</span>
        <div class="product-top">
          <h2>${escapeHTML(product.name)}</h2>
          <span class="price">${escapeHTML(formatPrice(product.price))}</span>
        </div>
        <p>${escapeHTML(product.description)}</p>
        <div class="product-options-preview">
          <strong>المكونات</strong>
          ${createChips(ingredients, "لا توجد مكونات قابلة للتعديل")}
          ${freeAddons.length ? `<strong>إضافات مجانية</strong>${createChips(freeAddons, "")}` : ""}
          ${paidAddons.length ? `<strong>إضافات مدفوعة</strong><div class="chips">${paidAddons.map((addon) => `<span>${escapeHTML(addon.name)} +${escapeHTML(formatPrice(addon.price))}</span>`).join("")}</div>` : ""}
        </div>
        <button class="add-cart-btn product-add" type="button" data-product-id="${product.id}">
          ${productHasOptions(product) ? "اختيار وتعديل" : "إضافة للسلة"}
        </button>
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
      const searchTarget = normalize([
        product.name,
        product.description,
        product.category,
        ...toArray(product.ingredients),
        ...toArray(product.freeAddons),
        ...toArray(product.paidAddons).map((addon) => addon.name)
      ].join(" "));
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

  const createCheckbox = ({ name, value, checked = false, price = null, group }) => `
    <label class="option-check">
      <input type="checkbox" name="${escapeHTML(group)}" value="${escapeHTML(value)}" ${checked ? "checked" : ""} data-price="${price ?? ""}">
      <span>${escapeHTML(name)}${price ? ` <small>+${escapeHTML(formatPrice(price))}</small>` : ""}</span>
    </label>
  `;

  const renderOptionGroup = ({ container, title, help, options, selected = [], group, isPaid = false, invertSelection = false }) => {
    const list = toArray(options);
    if (!list.length) {
      container.innerHTML = "";
      return;
    }

    const checkboxes = list.map((option) => {
      const name = typeof option === "string" ? option : option.name;
      const price = typeof option === "string" ? null : option.price;
      const isSelected = selected.includes(name);
      return createCheckbox({
        name: invertSelection ? `بدون ${name}` : name,
        value: name,
        checked: isSelected,
        price: isPaid ? price : null,
        group
      });
    }).join("");

    container.innerHTML = `
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(help)}</p>
      <div class="option-list">${checkboxes}</div>
    `;
  };

  const openCustomizer = (product, cartItem = null) => {
    activeProduct = product;
    editingCartId = cartItem?.cartId || null;
    customizerImage.src = product.image;
    customizerImage.alt = product.name;
    customizerCategory.textContent = product.category;
    customizerTitle.textContent = product.name;
    customizerDescription.textContent = product.description;
    customizerPrice.textContent = `السعر الأساسي: ${formatPrice(product.price)}`;
    itemNotes.value = cartItem?.notes || "";
    itemQty.value = cartItem?.qty || 1;

    renderOptionGroup({
      container: ingredientsOptions,
      title: "إزالة مكونات",
      help: "اختر أي مكون تريد إزالةه من الوجبة.",
      options: product.removableIngredients || product.ingredients,
      selected: cartItem?.removedIngredients || [],
      group: "removedIngredients",
      invertSelection: true
    });

    renderOptionGroup({
      container: freeAddonOptions,
      title: "إضافات مجانية",
      help: "اختر الإضافات المجانية التي تريدها.",
      options: product.freeAddons,
      selected: cartItem?.freeAddons || [],
      group: "freeAddons"
    });

    renderOptionGroup({
      container: paidAddonOptions,
      title: "إضافات مدفوعة",
      help: "كل إضافة مدفوعة تضاف إلى سعر الوجبة.",
      options: product.paidAddons,
      selected: toArray(cartItem?.paidAddons).map((addon) => addon.name),
      group: "paidAddons",
      isPaid: true
    });

    saveCartItem.textContent = editingCartId ? "حفظ التعديل" : "إضافة للسلة";
    customizer.classList.add("is-open");
    customizer.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    customizer.classList.remove("is-open");
    customizer.setAttribute("aria-hidden", "true");
    activeProduct = null;
    editingCartId = null;
  };

  const checkedValues = (group) => [...customizer.querySelectorAll(`input[name="${group}"]:checked`)].map((input) => input.value);

  const checkedPaidAddons = () => [...customizer.querySelectorAll('input[name="paidAddons"]:checked')].map((input) => ({
    name: input.value,
    price: Number(input.dataset.price || 0)
  }));

  const openCart = () => {
    cartPanel.classList.add("is-open");
    cartBackdrop.classList.add("is-open");
    cartBackdrop.setAttribute("aria-hidden", "false");
  };

  const closeCart = () => {
    cartPanel.classList.remove("is-open");
    cartBackdrop.classList.remove("is-open");
    cartBackdrop.setAttribute("aria-hidden", "true");
  };

  const saveItem = () => {
    if (!activeProduct) return;

    const item = {
      cartId: editingCartId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      productId: activeProduct.id,
      qty: Math.max(1, Number(itemQty.value || 1)),
      removedIngredients: checkedValues("removedIngredients"),
      freeAddons: checkedValues("freeAddons"),
      paidAddons: checkedPaidAddons(),
      notes: itemNotes.value.trim()
    };

    if (editingCartId) {
      cart = cart.map((cartItem) => cartItem.cartId === editingCartId ? item : cartItem);
    } else {
      cart.push(item);
    }

    renderCart();
    closeModal();
  };

  const renderItemDetails = (item) => {
    const details = [];
    if (item.removedIngredients.length) details.push(`بدون: ${item.removedIngredients.join("، ")}`);
    if (item.freeAddons.length) details.push(`إضافات مجانية: ${item.freeAddons.join("، ")}`);
    if (item.paidAddons.length) details.push(`إضافات مدفوعة: ${item.paidAddons.map((addon) => `${addon.name} +${formatPrice(addon.price)}`).join("، ")}`);
    if (item.notes) details.push(`ملاحظة: ${item.notes}`);
    return details.length ? details.map((detail) => `<p>${escapeHTML(detail)}</p>`).join("") : `<p>بدون تعديلات خاصة</p>`;
  };

  const renderCart = () => {
    const fragment = document.createDocumentFragment();
    let total = 0;
    let count = 0;

    cart.forEach((item) => {
      const product = getProduct(item.productId);
      if (!product) return;
      total += itemTotal(item);
      count += Number(item.qty || 1);

      const row = document.createElement("article");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-top">
          <div>
            <h3>${escapeHTML(product.name)}</h3>
            <span>${escapeHTML(formatPrice(product.price))} × ${escapeHTML(item.qty)}</span>
          </div>
          <strong>${escapeHTML(formatPrice(itemTotal(item)))}</strong>
        </div>
        <div class="cart-item-details">${renderItemDetails(item)}</div>
        <div class="cart-actions">
          <button type="button" data-edit-id="${escapeHTML(item.cartId)}">تعديل</button>
          <button type="button" data-remove-id="${escapeHTML(item.cartId)}">إزالة</button>
        </div>
      `;
      fragment.appendChild(row);
    });

    cartItems.replaceChildren(fragment);
    cartCount.textContent = count;
    cartTotal.textContent = formatPrice(total);
    cartFloatCount.textContent = count;
    cartFloatTotal.textContent = formatPrice(total);
    cartToggle.classList.toggle("has-items", count > 0);
    emptyCart.hidden = cart.length > 0;
    clearCart.disabled = cart.length === 0;
  };

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) return;
    const product = getProduct(button.dataset.productId);
    if (product) openCustomizer(product);
  });

  cartItems.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const removeButton = event.target.closest("[data-remove-id]");

    if (editButton) {
      const item = cart.find((cartItem) => cartItem.cartId === editButton.dataset.editId);
      const product = item ? getProduct(item.productId) : null;
      if (product && item) openCustomizer(product, item);
    }

    if (removeButton) {
      cart = cart.filter((cartItem) => cartItem.cartId !== removeButton.dataset.removeId);
      renderCart();
    }
  });

  search.addEventListener("input", (event) => {
    query = event.target.value;
    renderProducts();
  });

  clearCart.addEventListener("click", () => {
    cart = [];
    renderCart();
  });

  cartToggle.addEventListener("click", openCart);
  cartClose.addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);

  closeCustomizer.addEventListener("click", closeModal);
  saveCartItem.addEventListener("click", saveItem);
  customizer.addEventListener("click", (event) => {
    if (event.target === customizer) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && customizer.classList.contains("is-open")) closeModal();
    if (event.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart();
  });

  renderTabs();
  renderProducts();
  renderCart();
})();
