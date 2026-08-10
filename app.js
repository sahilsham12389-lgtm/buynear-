let shops = [];
let selectedShop = null;
let cart = [];

const shopList = document.getElementById("shopList");
const shopSection = document.getElementById("shopSection");
const productList = document.getElementById("productList");
const shopName = document.getElementById("shopName");
const shopCategory = document.getElementById("shopCategory");
const cartSection = document.getElementById("cartSection");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const orderList = document.getElementById("orderList");
const locationStatus = document.getElementById("locationStatus");

// Nearby shops load karna
async function loadNearbyShops(lat = 23.3600, lon = 85.3300) {
    locationStatus.textContent = "Nearby shops loading...";

    try {
        const response = await fetch(
            `/api/shops?lat=${lat}&lon=${lon}&radius=3`
        );

        shops = await response.json();

        renderShops();

        locationStatus.textContent =
            `${shops.length} shop(s) 3 km ke andar mile.`;

    } catch (error) {
        console.error(error);
        locationStatus.textContent =
            "Backend se connection nahi ho raha.";
    }
}


// Shops screen par dikhana
function renderShops() {
    shopList.innerHTML = "";

    if (shops.length === 0) {
        shopList.innerHTML = "<p>Koi shop nahi mili.</p>";
        return;
    }

    shops.forEach(shop => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <h3>🏪 ${shop.name}</h3>
            <p>Category: ${shop.category}</p>
            <p>📍 ${shop.distance_km} km away</p>

            <button>
                View Shop
            </button>
        `;

        card.querySelector("button").addEventListener(
            "click",
            () => openShop(shop)
        );

        shopList.appendChild(card);
    });
}


// Shop open karna
function openShop(shop) {
    selectedShop = shop;

    shopSection.classList.remove("hidden");

    shopName.textContent = shop.name;

    shopCategory.textContent =
        `${shop.category} • ${shop.distance_km} km away`;

    productList.innerHTML = "";

    shop.products.forEach(product => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <h3>${product.name}</h3>

            <p>
                Price: ₹${product.price}
            </p>

            <p>
                Stock: ${product.stock}
            </p>

            <button>
                Add to Cart
            </button>
        `;

        card.querySelector("button").addEventListener(
            "click",
            () => addToCart(product)
        );

        productList.appendChild(card);
    });
}


// Product cart mein add karna
function addToCart(product) {
    const existingProduct = cart.find(
        item => item.product_id === product.id
    );

    if (existingProduct) {
        existingProduct.qty += 1;
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            price: product.price,
            qty: 1
        });
    }

    updateCart();

    alert(`${product.name} cart mein add ho gaya.`);
}


// Cart update karna
function updateCart() {
    cartItems.innerHTML = "";

    let total = 0;
    let itemCount = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;

        total += itemTotal;
        itemCount += item.qty;

        const div = document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `
            <strong>${item.name}</strong>

            <p>
                ₹${item.price} × ${item.qty}
                = ₹${itemTotal}
            </p>

            <button>
                Remove
            </button>
        `;

        div.querySelector("button").addEventListener(
            "click",
            () => removeFromCart(item.product_id)
        );

        cartItems.appendChild(div);
    });

    cartTotal.textContent = total;
    cartCount.textContent = itemCount;
}


// Cart se product remove karna
function removeFromCart(productId) {
    cart = cart.filter(
        item => item.product_id !== productId
    );

    updateCart();
}


// Order place karna
async function placeOrder() {
    if (!selectedShop) {
        alert("Pehle shop select karo.");
        return;
    }

    if (cart.length === 0) {
        alert("Cart empty hai.");
        return;
    }

    const customerName =
        document.getElementById("customerName").value.trim();

    const address =
        document.getElementById("customerAddress").value.trim();

    if (!customerName || !address) {
        alert("Name aur delivery address bharo.");
        return;
    }

    try {
        const response = await fetch("/api/orders", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                shop_id: selectedShop.id,
                customer_name: customerName,
                address: address,
                items: cart
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Order place nahi hua.");
            return;
        }

        alert(
            `Order #${data.id} successfully place ho gaya!`
        );

        cart = [];

        updateCart();

        document.getElementById("customerName").value = "";
        document.getElementById("customerAddress").value = "";

        cartSection.classList.add("hidden");

        loadOrders();

    } catch (error) {
        console.error(error);

        alert(
            "Backend se connection nahi ho raha."
        );
    }
}


// Customer ke orders load karna
async function loadOrders() {
    try {
        const response = await fetch("/api/orders");

        const orders = await response.json();

        orderList.innerHTML = "";

        if (orders.length === 0) {
            orderList.innerHTML =
                "<p>Abhi koi order nahi hai.</p>";

            return;
        }

        orders.forEach(order => {
            const div = document.createElement("div");

            div.className = "order-item";

            div.innerHTML = `
                <strong>
                    Order #${order.id}
                </strong>

                <p>
                    Shop: ${order.shop_name}
                </p>

                <p>
                    Status: ${order.status}
                </p>
            `;

            orderList.appendChild(div);
        });

    } catch (error) {
        console.error(error);
    }
}


// Cart button
document.getElementById("cartButton")
    .addEventListener("click", () => {

        cartSection.classList.remove("hidden");

        cartSection.scrollIntoView({
            behavior: "smooth"
        });
    });


// Back button
document.getElementById("backButton")
    .addEventListener("click", () => {

        shopSection.classList.add("hidden");
    });


// Place order button
document.getElementById("placeOrderButton")
    .addEventListener(
        "click",
        placeOrder
    );


// Location button
document.getElementById("locationButton")
    .addEventListener("click", () => {

        if (!navigator.geolocation) {
            alert(
                "Browser location support nahi karta."
            );

            return;
        }

        locationStatus.textContent =
            "Location permission maang raha hai...";

        navigator.geolocation.getCurrentPosition(

            position => {

                loadNearbyShops(
                    position.coords.latitude,
                    position.coords.longitude
                );
            },

            () => {

                locationStatus.textContent =
                    "Location nahi mili. Demo location use ho rahi hai.";

                loadNearbyShops();
            }
        );
    });


// App start
loadNearbyShops();

loadOrders();

updateCart();