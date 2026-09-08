"""
restaurant_analytics_dataset_generator.py
Generates realistic relational CSV datasets (with ~5-10% dirty data)
for a Restaurant Analytics Dashboard project.

Run: python restaurant_analytics_dataset_generator.py
Output: ./output/*.csv
"""

import os
import csv
import random
from datetime import datetime, timedelta

random.seed(21)

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

START_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2024, 12, 31)

INDIAN_FIRST_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan",
    "Ananya","Diya","Aadhya","Saanvi","Anika","Myra","Pari","Riya","Isha","Kavya",
    "Rohan","Karan","Nikhil","Rahul","Amit","Sanjay","Deepak","Manish","Suresh","Ramesh",
    "Priya","Neha","Pooja","Sneha","Divya","Shreya","Kritika","Meera","Sunita","Anjali"]

INDIAN_LAST_NAMES = ["Sharma","Verma","Gupta","Iyer","Nair","Reddy","Patel","Mehta","Singh","Kumar",
    "Agarwal","Bansal","Chopra","Malhotra","Rao","Pillai","Joshi","Desai","Kapoor","Bhatt"]

INDIAN_CITIES = ["Mumbai","Delhi","Bengaluru","Hyderabad","Ahmedabad","Chennai","Kolkata","Pune",
    "Jaipur","Surat","Lucknow","Kanpur","Nagpur","Indore","Bhopal","Patna","Vadodara","Ludhiana",
    "Agra","Nashik"]

COMPANY_WORDS1 = ["Bharat","Shree","Om","Royal","National","Sunrise","Silver","Golden","Prime","Trident"]
COMPANY_WORDS2 = ["Foods","Farm Supplies","Traders","Distributors","Agro","Fresh Mart","Wholesale","Impex"]
COMPANY_SUFFIX = ["Pvt Ltd","LLP","& Co","Group","Industries"]

BRANCH_AREA_WORDS = ["Central","Uptown","Riverside","Heritage","Metro","Palm","Garden","Lakeview","Highstreet","Old City"]
ORDER_TYPES = ["Dine-In", "Takeaway", "Online"]
ORDER_STATUS = ["Completed", "Cancelled", "In Progress", "Pending"]
PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "UPI", "Wallet"]
GENDERS = ["Male", "Female", "Other"]
FEEDBACK_CATEGORIES = ["Food Quality", "Service", "Ambience", "Delivery Time", "Value for Money", "Cleanliness"]

MENU_CATEGORY_NAMES = ["Starters", "Soups", "Main Course - Veg", "Main Course - Non-Veg", "Breads",
    "Rice & Biryani", "Chinese", "South Indian", "Desserts", "Beverages", "Salads", "Pizza & Pasta"]

DISH_NAME_BY_CATEGORY = {
    "Starters": ["Paneer Tikka", "Chicken 65", "Veg Spring Roll", "Chilli Potato", "Seekh Kebab"],
    "Soups": ["Tomato Soup", "Sweet Corn Soup", "Hot & Sour Soup", "Manchow Soup"],
    "Main Course - Veg": ["Paneer Butter Masala", "Dal Makhani", "Veg Kolhapuri", "Malai Kofta", "Chana Masala"],
    "Main Course - Non-Veg": ["Butter Chicken", "Mutton Rogan Josh", "Chicken Curry", "Fish Curry", "Egg Curry"],
    "Breads": ["Butter Naan", "Tandoori Roti", "Garlic Naan", "Lachha Paratha"],
    "Rice & Biryani": ["Chicken Biryani", "Veg Pulao", "Mutton Biryani", "Jeera Rice", "Egg Biryani"],
    "Chinese": ["Veg Manchurian", "Chicken Fried Rice", "Hakka Noodles", "Chilli Chicken"],
    "South Indian": ["Masala Dosa", "Idli Sambar", "Uttapam", "Medu Vada"],
    "Desserts": ["Gulab Jamun", "Rasmalai", "Chocolate Brownie", "Ice Cream Sundae", "Kheer"],
    "Beverages": ["Masala Chai", "Cold Coffee", "Fresh Lime Soda", "Mango Lassi", "Buttermilk"],
    "Salads": ["Green Salad", "Caesar Salad", "Fruit Salad", "Kachumber Salad"],
    "Pizza & Pasta": ["Margherita Pizza", "Farmhouse Pizza", "White Sauce Pasta", "Red Sauce Pasta"]
}

INGREDIENT_NAMES = ["Paneer","Chicken","Mutton","Basmati Rice","Wheat Flour","Tomato","Onion","Garlic",
    "Ginger","Green Chilli","Cooking Oil","Butter","Milk","Cream","Cheese","Capsicum","Potato",
    "Coriander Leaves","Yogurt","Garam Masala","Turmeric Powder","Red Chilli Powder","Salt","Sugar",
    "Eggs","Fish","Corn","Cabbage","Carrot","Noodles","Soy Sauce","Vinegar","Lemon","Mint Leaves",
    "Cashew Nuts","Ghee","Curd","Bread","Beans","Peas"]

INGREDIENT_UNITS = ["kg", "litre", "packet", "dozen"]

DIRTY_TEXT_VARIANTS = lambda s: random.choice([s.upper(), s.lower(), f" {s} ", s.replace("a", "@"), s + "  "])


def rand_date(start=START_DATE, end=END_DATE):
    return start + timedelta(days=random.randint(0, (end - start).days))


def maybe_blank(value, prob=0.05):
    return "" if random.random() < prob else value


def dirty_email(name):
    base = name.lower().replace(" ", ".")
    domain = random.choice(["gmail.com", "yahoo.com", "outlook.com", "rediffmail.com", "hotmail.com"])
    email = f"{base}{random.randint(1,999)}@{domain}"
    r = random.random()
    if r < 0.05:
        email = email.replace("@", "")
    elif r < 0.09:
        email = email.replace(".com", "")
    return email


def dirty_phone():
    num = "".join([str(random.randint(0, 9)) for _ in range(10)])
    num = random.choice(["9", "8", "7"]) + num[1:]
    r = random.random()
    if r < 0.04:
        num = num[:-random.randint(1, 3)]
    elif r < 0.08:
        num = "+91-" + num
    return num


def indian_name():
    return f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}"


def company_name():
    return f"{random.choice(COMPANY_WORDS1)} {random.choice(COMPANY_WORDS2)} {random.choice(COMPANY_SUFFIX)}"


def write_csv(filename, header, rows):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"Written {len(rows):>7} rows -> {filename}")


# -------------------------------------------------------------------
# 1. DIM_BRANCHES (Master, ~28)
# -------------------------------------------------------------------
NUM_BRANCHES = 28
branches = []
branch_ids = list(range(1, NUM_BRANCHES + 1))
for bid in branch_ids:
    city = random.choice(INDIAN_CITIES)
    area = random.choice(BRANCH_AREA_WORDS)
    branch_name = f"{city} {area} Branch"
    manager = indian_name()
    seating_capacity = random.randint(20, 150)
    opening_date = rand_date(datetime(2016, 1, 1), datetime(2022, 12, 31))

    r = random.random()
    if r < 0.04:
        city = DIRTY_TEXT_VARIANTS(city)
    if r < 0.03:
        seating_capacity = -seating_capacity  # invalid negative

    branches.append([
        bid, branch_name, city, manager, seating_capacity,
        opening_date.strftime("%Y-%m-%d")
    ])

write_csv("dim_branches.csv",
          ["branch_id", "branch_name", "city", "manager_name", "seating_capacity", "opening_date"],
          branches)

# -------------------------------------------------------------------
# 2. DIM_MENU_CATEGORIES (Master)
# -------------------------------------------------------------------
menu_categories = [(i + 1, name) for i, name in enumerate(MENU_CATEGORY_NAMES)]
menu_category_ids = [c[0] for c in menu_categories]
write_csv("dim_menu_categories.csv", ["category_id", "category_name"], menu_categories)

# -------------------------------------------------------------------
# 3. DIM_SUPPLIERS (Master, ~35)
# -------------------------------------------------------------------
NUM_SUPPLIERS = 35
suppliers = []
supplier_ids = list(range(1, NUM_SUPPLIERS + 1))
for spid in supplier_ids:
    name = company_name()
    city = random.choice(INDIAN_CITIES)
    contact_name = indian_name()
    email = dirty_email(contact_name)
    phone = dirty_phone()
    rating = round(random.uniform(1.0, 5.0), 1)

    r = random.random()
    if r < 0.03:
        rating = round(random.uniform(6.0, 10.0), 1)  # invalid outlier
    if r < 0.03:
        phone = ""

    suppliers.append([spid, name, city, contact_name, email, phone, rating])

write_csv("dim_suppliers.csv",
          ["supplier_id", "supplier_name", "city", "contact_name", "contact_email", "contact_phone", "rating"],
          suppliers)

# -------------------------------------------------------------------
# 4. DIM_INGREDIENTS (Master, ~150)
# -------------------------------------------------------------------
NUM_INGREDIENTS = len(INGREDIENT_NAMES) * 4  # repeat with variants across suppliers -> ~160
ingredients = []
ingredient_ids = list(range(1, NUM_INGREDIENTS + 1))
for iid in ingredient_ids:
    base_name = INGREDIENT_NAMES[(iid - 1) % len(INGREDIENT_NAMES)]
    unit = random.choice(INGREDIENT_UNITS)
    supplier_id = random.choice(supplier_ids)
    unit_cost = round(random.uniform(10, 900), 2)

    r = random.random()
    fk_supplier = supplier_id
    if r < 0.02:
        fk_supplier = 999  # broken FK
    if r < 0.03:
        unit_cost = -unit_cost  # invalid negative

    ingredients.append([iid, base_name, unit, fk_supplier, maybe_blank(unit_cost, 0.03)])

write_csv("dim_ingredients.csv",
          ["ingredient_id", "ingredient_name", "unit", "supplier_id", "unit_cost_inr"],
          ingredients)

# -------------------------------------------------------------------
# 5. DIM_MENU_ITEMS (Master, ~230)
# -------------------------------------------------------------------
menu_items = []
menu_item_ids = []
mid = 1
for cat_id, cat_name in menu_categories:
    dishes = DISH_NAME_BY_CATEGORY.get(cat_name, [])
    for dish in dishes:
        for variant in range(random.randint(3, 6)):  # multiple pricing/branch variants per dish
            price = round(random.uniform(60, 950), 2)
            cost_price = round(price * random.uniform(0.3, 0.6), 2)
            is_veg = "Veg" if "Non-Veg" not in cat_name and random.random() > 0.15 else "Non-Veg"

            r = random.random()
            if r < 0.03:
                price = round(cost_price * random.uniform(0.5, 0.9), 2)  # sold below cost
            if r < 0.03:
                cost_price = -cost_price  # invalid negative

            menu_items.append([mid, dish, cat_id, is_veg, maybe_blank(cost_price, 0.03), price])
            menu_item_ids.append(mid)
            mid += 1

write_csv("dim_menu_items.csv",
          ["menu_item_id", "item_name", "category_id", "veg_type", "cost_price_inr", "selling_price_inr"],
          menu_items)

# -------------------------------------------------------------------
# 6. DIM_CUSTOMERS (Medium, ~7000)
# -------------------------------------------------------------------
NUM_CUSTOMERS = 7000
customers = []
customer_ids = list(range(1, NUM_CUSTOMERS + 1))
for cid in customer_ids:
    name = indian_name()
    email = dirty_email(name)
    phone = dirty_phone()
    city = random.choice(INDIAN_CITIES)
    gender = random.choice(GENDERS)
    age = random.randint(16, 70)
    registration_date = rand_date(datetime(2019, 1, 1), END_DATE)

    r = random.random()
    if r < 0.03:
        name = ""
    if r < 0.03:
        city = DIRTY_TEXT_VARIANTS(city)
    if r < 0.03:
        age = random.randint(120, 200)  # invalid outlier age
    if r < 0.02:
        customers.append(customers[-1] if customers else [
            cid, name, email, phone, city, gender, age, registration_date.strftime("%Y-%m-%d")
        ])  # duplicate

    customers.append([
        cid, name, email, phone, city, gender, age, registration_date.strftime("%Y-%m-%d")
    ])

write_csv("dim_customers.csv",
          ["customer_id", "customer_name", "email", "phone", "city", "gender", "age", "registration_date"],
          customers)

# -------------------------------------------------------------------
# 7. FACT_ORDERS (Fact, ~32000)
# -------------------------------------------------------------------
NUM_ORDERS = 32000
order_rows = []
order_ids = list(range(1, NUM_ORDERS + 1))
for oid in order_ids:
    customer_id = random.choice(customer_ids)
    branch_id = random.choice(branch_ids)
    order_date = rand_date()
    order_type = random.choice(ORDER_TYPES)
    status = random.choices(ORDER_STATUS, weights=[0.80, 0.08, 0.06, 0.06])[0]
    payment_method = random.choice(PAYMENT_METHODS)
    discount_pct = round(random.choice([0, 0, 0, 5, 10, 15, 20]), 1)
    total_amount = round(random.uniform(150, 6000), 2)
    completion_time_minutes = round(random.uniform(8, 75), 1)
    order_hour = random.choices(range(8, 24), weights=[1,1,1,2,3,4,3,2,2,3,5,6,7,6,4,3])[0]

    r = random.random()
    fk_customer = customer_id
    fk_branch = branch_id
    if r < 0.02:
        fk_customer = 99999  # broken FK
    if r < 0.02:
        fk_branch = 999  # broken FK
    if r < 0.03:
        total_amount = -total_amount  # invalid negative
    if r < 0.03:
        completion_time_minutes = round(random.uniform(150, 400), 1)  # invalid outlier

    order_rows.append([
        oid, fk_customer, fk_branch, order_date.strftime("%Y-%m-%d"), order_hour, order_type,
        status, payment_method, discount_pct, maybe_blank(total_amount, 0.03), completion_time_minutes
    ])

dupe_count = int(NUM_ORDERS * 0.01)
for _ in range(dupe_count):
    order_rows.append(random.choice(order_rows))

write_csv("fact_orders.csv",
          ["order_id", "customer_id", "branch_id", "order_date", "order_hour", "order_type",
           "order_status", "payment_method", "discount_pct", "total_amount_inr", "completion_time_minutes"],
          order_rows)

# -------------------------------------------------------------------
# 8. FACT_ORDER_ITEMS (Fact, ~52000)
# -------------------------------------------------------------------
NUM_ITEMS = 52000
item_rows = []
for i in range(1, NUM_ITEMS + 1):
    order_id = random.choice(order_ids)
    menu_item_id = random.choice(menu_item_ids)
    quantity = random.randint(1, 6)
    unit_price = round(random.uniform(60, 950), 2)
    discount_amount = round(unit_price * quantity * random.uniform(0, 0.25), 2)
    line_total = round((unit_price * quantity) - discount_amount, 2)

    r = random.random()
    fk_order = order_id
    fk_item = menu_item_id
    if r < 0.02:
        fk_order = 999999  # broken FK
    if r < 0.02:
        fk_item = 99999  # broken FK
    if r < 0.03:
        quantity = -quantity  # invalid
    if r < 0.03:
        line_total = round(line_total * random.uniform(3, 6), 2)  # outlier

    item_rows.append([
        i, fk_order, fk_item, quantity, unit_price, maybe_blank(discount_amount, 0.03), line_total
    ])

write_csv("fact_order_items.csv",
          ["order_item_id", "order_id", "menu_item_id", "quantity", "unit_price_inr",
           "discount_amount_inr", "line_total_inr"],
          item_rows)

# -------------------------------------------------------------------
# 9. FACT_INGREDIENT_CONSUMPTION (Fact, ~28000)
# -------------------------------------------------------------------
NUM_CONSUMPTION = 28000
consumption_rows = []
for i in range(1, NUM_CONSUMPTION + 1):
    ingredient_id = random.choice(ingredient_ids)
    branch_id = random.choice(branch_ids)
    date = rand_date()
    quantity_used = round(random.uniform(0.5, 100), 2)
    wastage_quantity = round(quantity_used * random.uniform(0, 0.1), 2)
    stock_available = round(random.uniform(0, 500), 2)

    r = random.random()
    fk_ingredient = ingredient_id
    fk_branch = branch_id
    if r < 0.02:
        fk_ingredient = 9999  # broken FK
    if r < 0.02:
        fk_branch = 888  # broken FK
    if r < 0.03:
        quantity_used = -quantity_used  # invalid negative
    if r < 0.03:
        stock_available = -stock_available  # invalid negative stock

    consumption_rows.append([
        i, fk_ingredient, fk_branch, date.strftime("%Y-%m-%d"),
        quantity_used, maybe_blank(wastage_quantity, 0.03), stock_available
    ])

write_csv("fact_ingredient_consumption.csv",
          ["consumption_id", "ingredient_id", "branch_id", "date", "quantity_used",
           "wastage_quantity", "stock_available"],
          consumption_rows)

# -------------------------------------------------------------------
# 10. FACT_CUSTOMER_FEEDBACK (Medium, ~6500)
# -------------------------------------------------------------------
NUM_FEEDBACK = 6500
feedback_rows = []
for i in range(1, NUM_FEEDBACK + 1):
    customer_id = random.choice(customer_ids)
    order_id = random.choice(order_ids)
    branch_id = random.choice(branch_ids)
    rating = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.08, 0.17, 0.35, 0.35])[0]
    feedback_category = random.choice(FEEDBACK_CATEGORIES)
    feedback_date = rand_date()
    comment_length_words = random.randint(0, 40)

    r = random.random()
    fk_customer = customer_id
    fk_order = order_id
    fk_branch = branch_id
    if r < 0.02:
        fk_customer = 99999  # broken FK
    if r < 0.02:
        fk_order = 999999  # broken FK
    if r < 0.02:
        fk_branch = 999  # broken FK
    if r < 0.03:
        rating = random.randint(6, 10)  # invalid outlier rating

    feedback_rows.append([
        i, fk_customer, fk_order, fk_branch, rating, feedback_category,
        feedback_date.strftime("%Y-%m-%d"), maybe_blank(comment_length_words, 0.04)
    ])

write_csv("fact_customer_feedback.csv",
          ["feedback_id", "customer_id", "order_id", "branch_id", "rating", "feedback_category",
           "feedback_date", "comment_length_words"],
          feedback_rows)

print("\nAll datasets generated successfully in the 'output' folder.")
