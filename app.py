from flask import Flask, jsonify, request, send_from_directory
from math import radians, sin, cos, sqrt, atan2
from pathlib import Path

# BuyNear ka current folder
BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    static_folder=str(BASE_DIR),
    static_url_path=""
)

# Demo shops
SHOPS = [
    {
        "id": 1,
        "name": "Apna General Store",
        "category": "General Store",
        "lat": 23.3600,
        "lon": 85.3300,
        "products": [
            {"id": 101, "name": "Rice 5kg", "price": 350, "stock": 20},
            {"id": 102, "name": "Sugar 1kg", "price": 50, "stock": 30},
            {"id": 103, "name": "Cooking Oil 1L", "price": 120, "stock": 15}
        ]
    },

    {
        "id": 2,
        "name": "City Medical Store",
        "category": "Medical",
        "lat": 23.3700,
        "lon": 85.3400,
        "products": [
            {"id": 201, "name": "Bandage", "price": 20, "stock": 50},
            {"id": 202, "name": "Thermometer", "price": 120, "stock": 10}
        ]
    },

    {
        "id": 3,
        "name": "Mobile Point",
        "category": "Mobile",
        "lat": 23.3500,
        "lon": 85.3200,
        "products": [
            {"id": 301, "name": "USB Cable", "price": 150, "stock": 15},
            {"id": 302, "name": "Phone Charger", "price": 450, "stock": 8}
        ]
    },

    {
        "id": 4,
        "name": "Gupta Electrical",
        "category": "Electrical",
        "lat": 23.3550,
        "lon": 85.3350,
        "products": [
            {"id": 401, "name": "LED Bulb", "price": 100, "stock": 25},
            {"id": 402, "name": "Switch", "price": 45, "stock": 40}
        ]
    }
]

# Orders temporary memory mein
ORDERS = []
NEXT_ORDER_ID = 1001


# Distance calculate karna
def distance_km(lat1, lon1, lat2, lon2):

    earth_radius = 6371.0

    p1 = radians(lat1)
    p2 = radians(lat2)

    dp = radians(lat2 - lat1)
    dl = radians(lon2 - lon1)

    a = (
        sin(dp / 2) ** 2
        + cos(p1)
        * cos(p2)
        * sin(dl / 2) ** 2
    )

    return 2 * earth_radius * atan2(
        sqrt(a),
        sqrt(1 - a)
    )


# Customer App open karna
@app.route("/")
def home():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


# CSS / JS files serve karna
@app.route("/<path:filename>")
def static_files(filename):

    return send_from_directory(
        BASE_DIR,
        filename
    )


# 3 km ke andar shops
@app.route("/api/shops")
def get_shops():

    try:

        lat = float(
            request.args.get(
                "lat",
                "23.3600"
            )
        )

        lon = float(
            request.args.get(
                "lon",
                "85.3300"
            )
        )

        radius = float(
            request.args.get(
                "radius",
                "3"
            )
        )

    except ValueError:

        return jsonify({
            "error": "Invalid location"
        }), 400


    nearby = []

    for shop in SHOPS:

        distance = distance_km(
            lat,
            lon,
            shop["lat"],
            shop["lon"]
        )

        if distance <= radius:

            nearby.append({
                "id": shop["id"],
                "name": shop["name"],
                "category": shop["category"],
                "distance_km": round(
                    distance,
                    2
                ),
                "products": shop["products"]
            })


    return jsonify(nearby)


# Customer order place karega
@app.route("/api/orders", methods=["POST"])
def create_order():

    global NEXT_ORDER_ID

    data = request.get_json(
        silent=True
    ) or {}


    if not data.get("shop_id"):
        return jsonify({
            "error": "Shop select nahi hai"
        }), 400


    if not data.get("items"):
        return jsonify({
            "error": "Cart empty hai"
        }), 400


    shop = next(
        (
            shop
            for shop in SHOPS
            if shop["id"] == data["shop_id"]
        ),
        None
    )


    if not shop:

        return jsonify({
            "error": "Shop nahi mili"
        }), 404


    order = {

        "id": NEXT_ORDER_ID,

        "shop_id": shop["id"],

        "shop_name": shop["name"],

        "customer_name": data.get(
            "customer_name",
            "Customer"
        ),

        "address": data.get(
            "address",
            ""
        ),

        "items": data["items"],

        "status": "Pending"
    }


    ORDERS.append(order)

    NEXT_ORDER_ID += 1


    return jsonify(order), 201


# Customer ke orders
@app.route("/api/orders")
def get_orders():

    return jsonify(ORDERS)


# Flask server start
if __name__ == "__main__":

    print("")
    print("==============================")
    print("BUYNEAR CUSTOMER APP")
    print("==============================")
    print("Server running at:")
    print("http://127.0.0.1:5001")
    print("==============================")
    print("")

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )