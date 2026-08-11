let shops = [];
let selectedShop = null;
let cart = [];

let currentLatitude = 23.3600;
let currentLongitude = 85.3300;
let currentCategory = "All";

const shopList = document.getElementById("shopList");
const shopSection = document.getElementById("shopSection");
const productList = document.getElementById("productList");

const shopName = document.getElementById("shopName");
const shopCategory = document.getElementById("shopCategory");

const cartSection = document.getElementById("cartSection");
const cartItems = document.getElementById("cartItems");

const cartTotal = document.getElementById("cartTotal");
const grandTotal = document.getElementById("grandTotal");
const cartCount = document.getElementById("cartCount");

const orderList = document.getElementById("orderList");

const shopTitle = document.getElementById("shopTitle");
const shopSubtitle = document.getElementById("shopSubtitle");
const shopCount = document.getElementById("shopCount");

const searchInput = document.getElementById("searchInput");
const productSearch = document.getElementById("productSearch");

const locationText = document.getElementById("locationText");


/* =========================
   LOAD SHOPS
========================= */

async function loadNearbyShops() {

    shopList.innerHTML =
        `<div class="loading">Loading nearby shops...</div>`;

    try {

        const url =
            `/api/shops?lat=${currentLatitude}` +
            `&lon=${currentLongitude}` +
            `&radius=3` +
            `&category=${encodeURIComponent(currentCategory)}` +
            `&search=${encodeURIComponent(searchInput.value)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Shop API failed");
        }

        shops = await response.json();

        renderShops();

    } catch (error) {

        console.error(error);

        shopList.innerHTML = `
            <div class="empty">
                Unable to load shops from the server.
            </div>
        `;
    }
}


/* =========================
   RENDER SHOPS
========================= */

function renderShops() {

    shopList.innerHTML = "";

    if (shops.length === 0) {

        shopList.innerHTML = `
            <div class="empty">
                No shops found within 3 km in this category.
            </div>
        `;

        shopCount.textContent = "0 shops";

        return;
    }

    shopCount.textContent =
        `${shops.length} shop${shops.length > 1 ? "s" : ""}`;

    shops.forEach(shop => {

        const card =
            document.createElement("div");

        card.className = "shop-card";

        let icon = "🏪";

        if (shop.category === "Grocery") {
            icon = "🛒";
        }

        if (shop.category === "Electronics") {
            icon = "📱";
        }

        if (shop.category === "Electrical") {
            icon = "⚡";
        }

        if (shop.category === "Fruits & Vegetables") {
            icon = "🍎";
        }

        if (shop.category === "Medical") {
            icon = "🏥";
        }

        if (shop.category === "Fashion") {
            icon = "👕";
        }

        if (shop.category === "Food") {
            icon = "🍔";
        }

        card.innerHTML = `

            <div class="shop-image">
                ${icon}
            </div>

            <h3>${shop.name}</h3>

            <div class="shop-category">
                ${shop.category}
            </div>

            <div class="shop-info">
                <span>⭐ ${shop.rating || "4.5"}</span>
                <span>📍 ${shop.distance_km} km</span>
                <span>🛵 Delivery</span>
            </div>

            <button class="view-shop">
                View Shop
            </button>
        `;

        card
            .querySelector(".view-shop")
            .addEventListener(
                "click",
                () => openShop(shop)
            );

        shopList.appendChild(card);
    });
}


/* =========================
   OPEN SHOP
========================= */

function openShop(shop) {

    selectedShop = shop;

    shopSection.classList.remove("hidden");

    shopName.textContent =
        shop.name;

    shopCategory.textContent =
        `${shop.category} • ${shop.distance_km} km away`;

    productSearch.value = "";

    renderProducts(shop.products);

    shopSection.scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================
   PRODUCTS
========================= */

function renderProducts(products) {

    productList.innerHTML = "";

    const query =
        productSearch.value
            .trim()
            .toLowerCase();

    const filteredProducts =
        products.filter(product =>
            product.name
                .toLowerCase()
                .includes(query)
        );

    if (filteredProducts.length === 0) {

        productList.innerHTML = `
            <div class="empty">
                No products found.
            </div>
        `;

        return;
    }

    filteredProducts.forEach(product => {

        const card =
            document.createElement("div");

        card.className =
            "product-card";

        card.innerHTML = `

            <div class="product-image">
                🛍️
            </div>

            <h3>
                ${product.name}
            </h3>

            <div class="product-price">
                ₹${product.price}
            </div>

            <div class="stock">
                ${product.stock > 0
                ? `${product.stock} available`
                : "Out of stock"}
            </div>

            <button
                class="add-button"
                ${product.stock <= 0 ? "disabled" : ""}
            >
                ${product.stock > 0 ? "ADD" : "OUT OF STOCK"}
            </button>
        `;

        if (product.stock > 0) {

            card
                .querySelector(".add-button")
                .addEventListener(
                    "click",
                    () => addToCart(product)
                );
        }

        productList.appendChild(card);
    });
}


/* =========================
   ADD TO CART
========================= */

function addToCart(product) {

    if (!selectedShop) {

        alert(
            "Please select a shop first."
        );

        return;
    }

    const existing =
        cart.find(
            item =>
                item.product_id === product.id
        );

    if (existing) {

        existing.qty += 1;

    } else {

        cart.push({

            product_id: product.id,

            name: product.name,

            price: product.price,

            qty: 1

        });
    }

    updateCart();

    showCartMessage(
        `${product.name} has been added to your cart`
    );
}


/* =========================
   CART
========================= */

function updateCart() {

    cartItems.innerHTML = "";

    let total = 0;
    let count = 0;

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty">
                🛒 Your cart is empty.
            </div>
        `;
    }

    cart.forEach(item => {

        const itemTotal =
            item.price * item.qty;

        total += itemTotal;

        count += item.qty;

        const div =
            document.createElement("div");

        div.className =
            "cart-item";

        div.innerHTML = `

            <div>
                <h4>${item.name}</h4>

                <p>
                    ₹${item.price} × ${item.qty}
                    = ₹${itemTotal}
                </p>
            </div>

            <div class="quantity">

                <button
                    class="minus"
                >
                    −
                </button>

                <strong>
                    ${item.qty}
                </strong>

                <button
                    class="plus"
                >
                    +
                </button>

            </div>
        `;

        div
            .querySelector(".minus")
            .addEventListener(
                "click",
                () => changeQuantity(
                    item.product_id,
                    -1
                )
            );

        div
            .querySelector(".plus")
            .addEventListener(
                "click",
                () => changeQuantity(
                    item.product_id,
                    1
                )
            );

        cartItems.appendChild(div);
    });

    cartTotal.textContent =
        total;

    grandTotal.textContent =
        total;

    cartCount.textContent =
        count;
}


/* =========================
   QUANTITY
========================= */

function changeQuantity(
    productId,
    change
) {

    const item =
        cart.find(
            x =>
                x.product_id === productId
        );

    if (!item) {
        return;
    }

    item.qty += change;

    if (item.qty <= 0) {

        cart =
            cart.filter(
                x =>
                    x.product_id !== productId
            );
    }

    updateCart();
}


/* =========================
   PLACE ORDER
========================= */

async function placeOrder() {

    if (!selectedShop) {

        alert(
            "Please select a shop first."
        );

        return;
    }

    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;
    }

    const customerName =
        document
            .getElementById(
                "customerName"
            )
            .value
            .trim();

    const address =
        document
            .getElementById(
                "customerAddress"
            )
            .value
            .trim();

    if (!customerName || !address) {

        alert(
            "Please enter your name and delivery address."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/api/orders",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        shop_id:
                            selectedShop.id,

                        customer_name:
                            customerName,

                        address:
                            address,

                        items:
                            cart
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Unable to place the order."
            );

            return;
        }

        alert(
            `Order #${data.id} placed successfully!`
        );

        cart = [];

        updateCart();

        document
            .getElementById(
                "customerName"
            )
            .value = "";

        document
            .getElementById(
                "customerAddress"
            )
            .value = "";

        cartSection.classList.add(
            "hidden"
        );

        loadOrders();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );
    }
}


/* =========================
   ORDERS
========================= */

async function loadOrders() {

    try {

        const response =
            await fetch(
                "/api/orders"
            );

        const orders =
            await response.json();

        orderList.innerHTML = "";

        if (
            !Array.isArray(orders) ||
            orders.length === 0
        ) {

            orderList.innerHTML = `
                <div class="empty">
                    No orders yet.
                </div>
            `;

            return;
        }

        orders.forEach(order => {

            const div =
                document.createElement("div");

            div.className =
                "order-item";

            const success =
                order.status === "Delivered";

            div.innerHTML = `

                <div class="order-top">

                    <strong>
                        Order #${order.id}
                    </strong>

                    <span
                        class="order-status
                        ${success ? "success" : "pending"}"
                    >
                        ${order.status}
                    </span>

                </div>

                <p>
                    🏪 ${order.shop_name}
                </p>

                <p>
                    📍 ${order.address}
                </p>

            `;

            orderList.appendChild(div);
        });

    } catch (error) {

        console.error(error);

        orderList.innerHTML = `
            <div class="empty">
                Unable to load orders.
            </div>
        `;
    }
}


/* =========================
   CATEGORY
========================= */

document
    .querySelectorAll(".category")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".category"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );

                currentCategory =
                    button.dataset.category;

                shopTitle.textContent =
                    currentCategory === "All"
                        ? "Nearby Shops"
                        : `${currentCategory} Shops`;

                shopSubtitle.textContent =
                    `Showing ${currentCategory === "All"
                        ? "all shops"
                        : currentCategory + " shops"} within 3 km`;

                loadNearbyShops();
            }
        );
    });


/* =========================
   SEARCH
========================= */

let searchTimer;

searchInput.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimer
        );

        searchTimer =
            setTimeout(
                () => {

                    loadNearbyShops();

                },
                350
            );
    }
);


/* =========================
   PRODUCT SEARCH
========================= */

productSearch.addEventListener(
    "input",
    () => {

        if (
            selectedShop
        ) {

            renderProducts(
                selectedShop.products
            );
        }
    }
);


/* =========================
   CART BUTTON
========================= */

document
    .getElementById(
        "cartButton"
    )
    .addEventListener(
        "click",
        () => {

            cartSection.classList.remove(
                "hidden"
            );

            cartSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    );


/* =========================
   CART NAV
========================= */

document
    .getElementById(
        "cartNav"
    )
    .addEventListener(
        "click",
        () => {

            cartSection.classList.remove(
                "hidden"
            );

            cartSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    );


/* =========================
   HOME NAV
========================= */

document
    .getElementById(
        "homeNav"
    )
    .addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );


/* =========================
   ORDERS NAV
========================= */

document
    .getElementById(
        "ordersNav"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "orderList"
                )
                .scrollIntoView({
                    behavior: "smooth"
                });
        }
    );


/* =========================
   ACCOUNT NAV
========================= */

document
    .getElementById(
        "accountNav"
    )
    .addEventListener(
        "click",
        () => {

            document
                .querySelector(
                    ".account"
                )
                .scrollIntoView({
                    behavior: "smooth"
                });
        }
    );


/* =========================
   BACK
========================= */

document
    .getElementById(
        "backButton"
    )
    .addEventListener(
        "click",
        () => {

            shopSection.classList.add(
                "hidden"
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );


/* =========================
   PLACE ORDER BUTTON
========================= */

document
    .getElementById(
        "placeOrderButton"
    )
    .addEventListener(
        "click",
        placeOrder
    );


/* =========================
   LOCATION
========================= */

document
    .getElementById(
        "locationButton"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !navigator.geolocation
            ) {

                alert(
                    "This browser does not support location services."
                );

                return;
            }

            locationText.textContent =
                "Getting location...";

            navigator.geolocation.getCurrentPosition(

                position => {

                    currentLatitude =
                        position.coords.latitude;

                    currentLongitude =
                        position.coords.longitude;

                    locationText.textContent =
                        "Your Location";

                    loadNearbyShops();
                },

                error => {

                    console.error(error);

                    locationText.textContent =
                        "Demo Location";

                    loadNearbyShops();
                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        }
    );


/* =========================
   MESSAGE
========================= */

function showCartMessage(message) {

    const oldTitle =
        document.title;

    document.title =
        message;

    setTimeout(
        () => {
            document.title =
                oldTitle;
        },
        1200
    );
}


/* =========================
   START
========================= */

loadNearbyShops();

loadOrders();

updateCart();