async function loadAdminOrders() {

    const container =
        document.getElementById("adminOrders");

    try {

        const response =
            await fetch("/api/orders");

        const orders =
            await response.json();

        container.innerHTML = "";

        if (
            !Array.isArray(orders) ||
            orders.length === 0
        ) {

            container.innerHTML =
                "<p>No orders yet.</p>";

            return;
        }


        orders.forEach(order => {

            const card =
                document.createElement("div");

            card.className =
                "order-card";


            let productsHTML = "";

            let orderTotal = 0;


            if (Array.isArray(order.items)) {

                order.items.forEach(item => {

                    const itemTotal =
                        Number(item.price) *
                        Number(item.qty);

                    orderTotal += itemTotal;


                    productsHTML += `
    
                        <div class="order-product">
    
                            <strong>
                                ${item.name}
                            </strong>
    
                            <p>
                                Price: ₹${item.price}
                            </p>
    
                            <p>
                                Quantity: ${item.qty}
                            </p>
    
                            <p>
                                Total: ₹${itemTotal}
                            </p>
    
                        </div>
    
                    `;
                });

            }


            card.innerHTML = `
    
                <h3>
                    📦 Order #${order.id}
                </h3>
    
    
                <p>
                    👤
                    <strong>Customer:</strong>
                    ${order.customer_name}
                </p>
    
    
                <p>
                    📍
                    <strong>Delivery Address:</strong>
                    ${order.address}
                </p>
    
    
                <p>
                    🏪
                    <strong>Shop:</strong>
                    ${order.shop_name}
                </p>
    
    
                <p>
                    🕐
                    <strong>Order Date:</strong>
                    ${order.created_at
                    ? new Date(
                        order.created_at
                    ).toLocaleString()
                    : "N/A"}
                </p>
    
    
                <p class="status">
                    🔄
                    <strong>Status:</strong>
                    ${order.status}
                </p>
    
    
                <h4>
                    🛒 Ordered Products
                </h4>
    
    
                ${productsHTML}
    
    
                <div class="order-total">
    
                    <strong>
                        💰 Order Total:
                        ₹${orderTotal}
                    </strong>
    
                </div>
    
            `;


            container.appendChild(card);

        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load orders.</p>";
    }

}

loadAdminOrders();