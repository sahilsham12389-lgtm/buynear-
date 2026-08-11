from flask import Flask, jsonify, request, send_from_directory
import os
import psycopg
from math import radians, sin, cos, sqrt, atan2
from pathlib import Path


# ==========================================
# BUYNEAR APP SETUP
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    static_folder=str(BASE_DIR),
    static_url_path=""
)


# ==========================================
# DATABASE
# ==========================================

DATABASE_URL = os.getenv("DATABASE_URL")


def get_db():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL environment variable nahi mila."
        )

    return psycopg.connect(DATABASE_URL)


# ==========================================
# DATABASE TABLES
# ==========================================

def init_db():

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                CREATE TABLE IF NOT EXISTS orders (

                    id SERIAL PRIMARY KEY,

                    shop_id INTEGER NOT NULL,

                    shop_name TEXT NOT NULL,

                    customer_name TEXT NOT NULL,

                    address TEXT NOT NULL,

                    items JSONB NOT NULL,

                    status TEXT NOT NULL DEFAULT 'Pending',

                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

                )
            """)

        conn.commit()


# ==========================================
# DEMO SHOPS
# ==========================================

SHOPS = [

    {
        "id": 1,
        "name": "Apna General Store",
        "category": "General Store",
        "lat": 23.3600,
        "lon": 85.3300,

        "products": [

            {
                "id": 101,
                "name": "Rice 5kg",
                "price": 350,
                "stock": 20
            },

            {
                "id": 102,
                "name": "Sugar 1kg",
                "price": 50,
                "stock": 30
            },

            {
                "id": 103,
                "name": "Cooking Oil 1L",
                "price": 120,
                "stock": 15
            }

        ]
    },


    {
        "id": 2,
        "name": "City Medical Store",
        "category": "Medical",
        "lat": 23.3700,
        "lon": 85.3400,

        "products": [

            {
                "id": 201,
                "name": "Bandage",
                "price": 20,
                "stock": 50
            },

            {
                "id": 202,
                "name": "Thermometer",
                "price": 120,
                "stock": 10
            }

        ]
    },


    {
        "id": 3,
        "name": "Mobile Point",
        "category": "Mobile",
        "lat": 23.3500,
        "lon": 85.3200,

        "products": [

            {
                "id": 301,
                "name": "USB Cable",
                "price": 150,
                "stock": 15
            },

            {
                "id": 302,
                "name": "Phone Charger",
                "price": 450,
                "stock": 8
            }

        ]
    },


    {
        "id": 4,
        "name": "Gupta Electrical",
        "category": "Electrical",
        "lat": 23.3550,
        "lon": 85.3350,

        "products": [

            {
                "id": 401,
                "name": "LED Bulb",
                "price": 100,
                "stock": 25
            },

            {
                "id": 402,
                "name": "Switch",
                "price": 45,
                "stock": 40
            }

        ]
    }

]


# ==========================================
# DISTANCE CALCULATION
# ==========================================

def distance_km(
    lat1,
    lon1,
    lat2,
    lon2
):

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

    return (

        2
        * earth_radius
        * atan2(
            sqrt(a),
            sqrt(1 - a)
        )

    )


# ==========================================
# CUSTOMER HOME PAGE
# ==========================================

@app.route("/")
def home():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


# ==========================================
# ADMIN PAGE
# ==========================================

@app.route("/admin")
def admin():

    return send_from_directory(
        BASE_DIR,
        "admin.html"
    )


# ==========================================
# CSS / JS / OTHER FILES
# ==========================================

@app.route("/<path:filename>")
def static_files(filename):

    return send_from_directory(
        BASE_DIR,
        filename
    )


# ==========================================
# GET NEARBY SHOPS
# ==========================================

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


# ==========================================
# CREATE CUSTOMER ORDER
# ==========================================

@app.route(
    "/api/orders",
    methods=["POST"]
)
def create_order():

    data = request.get_json(
        silent=True
    ) or {}


    # Shop check

    if not data.get("shop_id"):

        return jsonify({
            "error": "Shop select nahi hai"
        }), 400


    # Items check

    if not data.get("items"):

        return jsonify({
            "error": "Cart empty hai"
        }), 400


    # Customer name

    customer_name = str(
        data.get(
            "customer_name",
            ""
        )
    ).strip()


    if not customer_name:

        return jsonify({
            "error": "Customer name required hai"
        }), 400


    # Address

    address = str(
        data.get(
            "address",
            ""
        )
    ).strip()


    if not address:

        return jsonify({
            "error": "Delivery address required hai"
        }), 400


    # Shop find

    try:

        shop_id = int(
            data["shop_id"]
        )

    except (ValueError, TypeError):

        return jsonify({
            "error": "Invalid shop ID"
        }), 400


    shop = next(

        (
            shop
            for shop in SHOPS
            if shop["id"] == shop_id
        ),

        None

    )


    if not shop:

        return jsonify({
            "error": "Shop nahi mili"
        }), 404


    # ======================================
    # SAVE ORDER IN POSTGRESQL
    # ======================================

    try:

        with get_db() as conn:

            with conn.cursor() as cur:

                cur.execute(

                    """
                    INSERT INTO orders
                    (
                        shop_id,
                        shop_name,
                        customer_name,
                        address,
                        items,
                        status
                    )

                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s::jsonb,
                        %s
                    )

                    RETURNING
                        id,
                        created_at
                    """,

                    (

                        shop["id"],

                        shop["name"],

                        customer_name,

                        address,

                        psycopg.types.json.Json(
                            data["items"]
                        ),

                        "Pending"

                    )

                )


                result = cur.fetchone()

            conn.commit()


        order_id = result[0]

        created_at = result[1]


        # Response

        order = {

            "id": order_id,

            "shop_id": shop["id"],

            "shop_name": shop["name"],

            "customer_name": customer_name,

            "address": address,

            "items": data["items"],

            "status": "Pending",

            "created_at": created_at.isoformat()

        }


        return jsonify(order), 201


    except Exception as error:

        print(
            "ORDER DATABASE ERROR:",
            error
        )

        return jsonify({

            "error":
            "Order database mein save nahi ho paya."

        }), 500


# ==========================================
# GET ALL ORDERS
# ==========================================

@app.route("/api/orders")
def get_orders():

    try:

        with get_db() as conn:

            with conn.cursor() as cur:

                cur.execute(

                    """
                    SELECT
                        id,
                        shop_id,
                        shop_name,
                        customer_name,
                        address,
                        items,
                        status,
                        created_at

                    FROM orders

                    ORDER BY
                        id DESC
                    """

                )

                rows = cur.fetchall()


        orders = []


        for row in rows:

            orders.append({

                "id": row[0],

                "shop_id": row[1],

                "shop_name": row[2],

                "customer_name": row[3],

                "address": row[4],

                "items": row[5],

                "status": row[6],

                "created_at":
                    row[7].isoformat()
                    if row[7]
                    else None

            })


        return jsonify(orders)


    except Exception as error:

        print(
            "GET ORDERS ERROR:",
            error
        )

        return jsonify({

            "error":
            "Orders database se load nahi ho rahe."

        }), 500


# ==========================================
# UPDATE ORDER STATUS
# ==========================================

@app.route(
    "/api/orders/<int:order_id>/status",
    methods=["PUT"]
)
def update_order_status(order_id):

    data = request.get_json(
        silent=True
    ) or {}


    status = data.get("status")


    allowed_statuses = [

        "Pending",

        "Accepted",

        "Preparing",

        "Out for Delivery",

        "Delivered",

        "Cancelled"

    ]


    if status not in allowed_statuses:

        return jsonify({

            "error":
            "Invalid order status"

        }), 400


    try:

        with get_db() as conn:

            with conn.cursor() as cur:

                cur.execute(

                    """
                    UPDATE orders

                    SET status = %s

                    WHERE id = %s

                    RETURNING
                        id,
                        status
                    """,

                    (
                        status,
                        order_id
                    )

                )


                result = cur.fetchone()


            conn.commit()


        if not result:

            return jsonify({

                "error":
                "Order nahi mila"

            }), 404


        return jsonify({

            "id": result[0],

            "status": result[1]

        })


    except Exception as error:

        print(
            "STATUS UPDATE ERROR:",
            error
        )

        return jsonify({

            "error":
            "Order status update nahi hua."

        }), 500


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

try:

    init_db()

    print(
        "PostgreSQL database connected."
    )

except Exception as error:

    print(
        "Database initialization error:",
        error
    )


# ==========================================
# FLASK SERVER START
# ==========================================

if __name__ == "__main__":

    print("")

    print("==============================")

    print("BUYNEAR CUSTOMER APP")

    print("==============================")

    print("Server running at:")

    print(
        "http://127.0.0.1:5001"
    )

    print("")

    print(
        "Admin page:"
    )

    print(
        "http://127.0.0.1:5001/admin"
    )

    print("==============================")

    print("")


    app.run(

        host="0.0.0.0",

        port=5001,

        debug=True

    )