async function loadAdminOrders() {

    const container = document.getElementById("adminOrders");

    try {

        const response = await fetch("/api/orders");

        const orders = await response.json();

        container.innerHTML = "";

        if (orders.length === 0) {
            container.innerHTML = "<p>No orders yet.</p>";
            return;
        }

        orders.forEach(order => {

            const card = document.createElement("div");

            card.className = "order-card";

            let productsHTML = "";

            order.items.forEach(item => {

                productsHTML += `
                    <div class="order-product">

                        <strong>${item.name}</strong>

                        <p>
                            Product ID: ${item.product_id}
                        </p>

                        <p>
                            Price: ₹${item.price}
                        </p>

                        <p>
                            Quantity: ${item.qty}
                        </p>

                        <p>
                            Total: ₹${item.price * item.qty}
                        </p>

                    </div>
                `;
            });

            card.innerHTML = `

                <h3>📦 Order #${order.id}</h3>

                <p>
                    👤 <strong>Customer:</strong>
                    ${order.customer_name}
                </p>

                <p>
                    📍 <strong>Address:</strong>
                    ${order.address}
                </p>

                <p>
                    🏪 <strong>Shop:</strong>
                    ${order.shop_name}
                </p>

                <p class="status">
                    🔄 <strong>Status:</strong>
                    ${order.status}
                </p>

                <h4>🛒 Products</h4>

                ${productsHTML}

            `;

            container.appendChild(card);

        });

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Orders load nahi ho rahe.</p>";
    }
}

loadAdminOrders();