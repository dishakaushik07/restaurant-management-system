# RAMYA ML Implementation Notes

## 1. Overview

This implementation adds an independent Python/FastAPI ML service for RAMYA - Restaurant Automation, Management & Yield Analytics. The service is responsible for explainable robot task priority scoring, task queue reranking, demand prediction, kitchen load recommendations, waste-risk prediction, service-time estimation, anomaly detection, guest intent classification, and sentiment analysis.

The existing web app was not redesigned. It now integrates this service through server-side Next.js route handlers, so the browser calls only local application routes and never calls FastAPI directly.

## 2. Architecture

Target integration architecture:

React dashboard or guest assistant
-> Next.js route handler
-> Firestore client/data adapter
-> FastAPI ML service
-> ML/rule intelligence
-> Next.js response
-> dashboard/robot control recommendation

In this repository, the current checked-in app is a Next.js/Firebase app. No Express server, MongoDB schemas, or Mongoose models were present at the time of implementation. The ML service is therefore implemented independently under `ml-service/` and exposes REST APIs for the future Node/Express backend or existing Next.js route handlers.

## 3. ML Dev 1 - Task Priority Engine

Implemented files:

- `ml-service/priority/priority_engine.py`
- `ml-service/priority/thermal_decay.py`
- `ml-service/priority/ranking.py`

Input features supported:

- `waiting_time_minutes`
- `food_age_minutes`
- `food_temperature_c`
- `distance_m`
- `robot_battery_percent`
- `urgency_flag`
- `order_delay_minutes`
- `robot_available`
- `task_type`

Priority scoring is explainable weighted scoring, not FIFO. Inputs are normalized to configurable caps before scoring.

Default weights:

| Feature | Weight |
| --- | ---: |
| Waiting time | 0.22 |
| Thermal risk | 0.22 |
| Urgency | 0.18 |
| Order delay | 0.15 |
| Food age | 0.12 |
| Task type | 0.08 |
| Distance penalty | 0.09 |
| Low battery penalty | 0.18 |

Formula:

```text
positive_score =
  waiting_weight * normalized_waiting
  + thermal_weight * thermal_risk
  + urgency_weight * urgency
  + delay_weight * normalized_order_delay
  + food_age_weight * normalized_food_age
  + task_type_weight * task_type_boost

penalties =
  distance_penalty_weight * normalized_distance
  + low_battery_penalty_weight * battery_penalty

priority_score = clamp((positive_score - penalties) * 100, 0, 100)
```

Normalization caps:

- Waiting time: 45 minutes
- Food age: 60 minutes
- Order delay: 45 minutes
- Distance: 30 meters

Thermal decay:

- `thermal_decay.py` implements Newton-style cooling through `estimate_temperature`.
- `thermal_risk` returns a normalized 0-1 risk using current food temperature when available.
- If no temperature is available, food age is used as a fallback risk signal.

Battery handling:

- Battery below 20% makes a task not assignable.
- Battery below 35% adds a penalty.
- Battery rules are deterministic safety constraints and do not depend on ML.

Distance handling:

- Distance reduces score through a normalized penalty.
- A farther table can still outrank a nearer table when waiting time, urgency, thermal risk, or order delay is high.

Priority levels:

- `LOW`: score below 30 or not assignable
- `MEDIUM`: 30-54.99
- `HIGH`: 55-77.99
- `CRITICAL`: 78+

Real-time reranking:

- `rerank_tasks` scores every pending task and sorts assignable tasks by priority.
- `select_next_best_task` returns the top assignable task.
- The backend should call `/api/ml/priority/rerank` whenever order, robot, table, sensor, or task state changes.

API endpoints:

- `POST /api/ml/priority`
- `POST /api/ml/priority/rerank`

## 4. ML Dev 2 - AI Analytics

Implemented files:

- `ml-service/analytics/demand_prediction.py`
- `ml-service/analytics/kitchen_load.py`
- `ml-service/analytics/service_time.py`
- `ml-service/analytics/waste_prediction.py`
- `ml-service/analytics/anomaly_detection.py`
- `ml-service/data_sources.py`

Real dataset folder inspected:

`ml-service/Resturant Analytics Dashboard/output`

Dataset mapping:

| Dataset | Rows inspected | Used For | Important Columns | Notes |
| --- | ---: | --- | --- | --- |
| `fact_orders.csv` | 32,320 | Demand prediction, service-time training, stuck/delay baselines | `order_id`, `order_date`, `order_hour`, `order_type`, `order_status`, `total_amount_inr`, `completion_time_minutes` | Primary real order fact table |
| `fact_order_items.csv` | 52,000 | Item-level demand, service item count | `order_id`, `menu_item_id`, `quantity`, `line_total_inr` | Joined with orders and menu items |
| `dim_menu_items.csv` | 239 | Item names for demand and menu/category service-time features | `menu_item_id`, `item_name`, `category_id`, `veg_type`, `selling_price_inr` | Maps item IDs to readable item names |
| `dim_menu_categories.csv` | 12 | Dish/category type for service-time features | `category_id`, `category_name` | Joined to menu items |
| `fact_ingredient_consumption.csv` | 28,000 | Waste-risk prediction | `ingredient_id`, `date`, `quantity_used`, `wastage_quantity`, `stock_available` | Primary real waste/stock signal |
| `dim_ingredients.csv` | 160 | Ingredient names for waste-risk features | `ingredient_id`, `ingredient_name`, `unit`, `supplier_id`, `unit_cost_inr` | Joined to ingredient consumption |
| `fact_customer_feedback.csv` | 6,500 | Sentiment reference analytics | `rating`, `feedback_category`, `feedback_date`, `comment_length_words` | Has ratings but not raw comment text |
| `dim_customers.csv` | 7,151 | Future segmentation/personalization | `customer_id`, `city`, `gender`, `age`, `registration_date` | Inspected but not used in current model inference |
| `dim_branches.csv` | 28 | Future branch-level demand/capacity modeling | `branch_id`, `city`, `seating_capacity`, `opening_date` | Inspected; contains some invalid negative seating values |
| `dim_suppliers.csv` | 35 | Future supplier/procurement analytics | `supplier_id`, `rating`, `city` | Inspected but not used in current model inference |

Demand prediction:

- Uses `RandomForestRegressor` when scikit-learn is installed.
- Uses real restaurant CSV data from `fact_orders.csv`, `fact_order_items.csv`, and `dim_menu_items.csv` when that folder exists.
- Builds 47,510 real demand training rows with `hour`, `day_of_week`, `month`, `is_weekend`, `item`, `recent_demand`, and `orders`.
- If scikit-learn is unavailable, uses a historical-average fallback over the real transformed demand table.
- Synthetic/demo demand data remains only as a fallback if the CSV folder is missing.
- Output includes predicted orders, horizon, algorithm, MAE-style confidence metric, and reasons.

Kitchen load:

- Rule-based calculation using predicted orders, active orders, and kitchen capacity per 30 minutes.
- Output includes load ratio, load level, recommendation, and reasons.
- It does not disable menu items.

Waste prediction:

- Uses `RandomForestClassifier` when scikit-learn is installed.
- Uses real restaurant CSV data from `fact_ingredient_consumption.csv` and `dim_ingredients.csv` when available.
- Builds 28,000 real waste training rows with ingredient/item, stock quantity, historical daily demand, daily usage, days-to-expiry proxy, unsold quantity, and LOW/MEDIUM/HIGH risk.
- Fallback first uses real dataset risk frequency by item, then applies explainable threshold logic.
- Some source rows contain negative quantity/stock values; the loader clips those derived numeric fields to non-negative values in memory only. Original CSV files are not modified.
- Output is `LOW`, `MEDIUM`, or `HIGH` waste risk.

Service time:

- Uses `RandomForestRegressor` when scikit-learn is installed.
- Uses real restaurant CSV data from `fact_orders.csv`, `fact_order_items.csv`, `dim_menu_items.csv`, and `dim_menu_categories.csv`.
- Builds 32,320 real service-time training rows using `completion_time_minutes` as the target.
- Fallback uses real dish/category medians plus an explainable formula using item count, kitchen load, active orders, robot availability, and distance.

Stuck order detection:

- Rule-based.
- Creates `STUCK_ORDER` alerts when elapsed time is significantly above expected time.

Idle robot detection:

- Rule-based.
- Creates `IDLE_ROBOT` alerts when pending tasks exist and a robot remains idle beyond threshold with sufficient battery.

Unusual delay detection:

- Explainable statistical Z-score detection.
- Creates `UNUSUAL_DELAY` alerts when current service/delivery time is abnormal compared with history or configured normal average.

## 5. Guest Assistant / NLP

Implemented files:

- `ml-service/nlp/intent_classifier.py`
- `ml-service/nlp/sentiment.py`
- `ml-service/data/training/intent_examples.csv`

Supported intents:

- `ORDER_STATUS`
- `CALL_STAFF`
- `FAQ`
- `FEEDBACK`
- `MENU_QUERY`
- `ROBOT_HELP`
- `UNKNOWN`

Intent model:

- Uses TF-IDF + Logistic Regression when scikit-learn is installed.
- Falls back to an explainable keyword classifier if scikit-learn is unavailable.
- NLP only identifies intent. It does not invent order status, FAQ answers, or staff actions.

Sentiment:

- Uses a lightweight lexicon/rule-based classifier.
- Outputs `POSITIVE`, `NEGATIVE`, or `NEUTRAL`.
- Includes a real dataset reference summary from `fact_customer_feedback.csv`: 6,500 feedback rows, average rating 3.98, and rating-derived sentiment distribution.
- The feedback CSV does not include raw comment text, so the live sentiment classifier still classifies the incoming guest message text rather than training from hidden comments.

Backend responsibility:

- For `ORDER_STATUS`, backend must query the real order database.
- For `CALL_STAFF`, backend must create a staff-assistance task with table/user context.
- For `FAQ`, backend must fetch answers from configuration or database.
- For `FEEDBACK`, backend must store the message and sentiment result.

## 6. Models and Algorithms Used

| Feature | Algorithm | Why Used | Input | Output |
| --- | --- | --- | --- | --- |
| Task priority | Weighted scoring + deterministic safety rules | Explainable, configurable, reliable for robot safety | Waiting, food age, temperature, distance, battery, urgency, delay, availability, task type | Score, level, assignable flag, reasons |
| Thermal risk | Newton-style cooling + threshold risk | Simple and explainable for hot food decay | Temperature, food age | Thermal risk and reasons |
| Demand prediction | RandomForestRegressor, with real historical-average fallback | Handles nonlinear time/item demand patterns | Hour, day, month, weekend, item, recent demand from restaurant CSVs | Predicted orders, MAE, reasons |
| Kitchen load | Rule-based load ratio | Reliable recommendation logic | Predicted orders, active orders, capacity | Load level and recommendation |
| Waste risk | RandomForestClassifier, with real risk-frequency and rule fallback | Classifies stock/expiry/demand risk | Ingredient, stock, demand, usage, expiry proxy, unsold from restaurant CSVs | LOW/MEDIUM/HIGH |
| Service time | RandomForestRegressor, with real median formula fallback | Practical regression for prep/service estimates | Item count, dish/category type, load, active orders, hour, robot availability, distance | Estimated minutes |
| Stuck order | Threshold rule | Deterministic alerting is safer than forced ML | Status, elapsed time, expected time | Alert or no alert |
| Idle robot | Threshold rule | Deterministic robot operations check | Robot status, idle time, pending tasks, battery | Alert or no alert |
| Unusual delay | Z-score | Explainable anomaly detection | Current duration, historical durations | Alert or no alert |
| Guest intent | TF-IDF + Logistic Regression, with keyword fallback | Lightweight NLP without LLM dependency | Guest message | Intent and confidence |
| Sentiment | Lexicon/rule-based | Lightweight and transparent | Feedback text | Sentiment label |

## 7. Files Created

- `ml-service/__init__.py`
- `ml-service/app.py`
- `ml-service/data_sources.py`
- `ml-service/model_store.py`
- `ml-service/requirements.txt`
- `ml-service/models/.gitkeep`
- `ml-service/priority/__init__.py`
- `ml-service/priority/priority_engine.py`
- `ml-service/priority/thermal_decay.py`
- `ml-service/priority/ranking.py`
- `ml-service/analytics/__init__.py`
- `ml-service/analytics/demand_prediction.py`
- `ml-service/analytics/kitchen_load.py`
- `ml-service/analytics/service_time.py`
- `ml-service/analytics/waste_prediction.py`
- `ml-service/analytics/anomaly_detection.py`
- `ml-service/nlp/__init__.py`
- `ml-service/nlp/intent_classifier.py`
- `ml-service/nlp/sentiment.py`
- `ml-service/data/sample/README.md`
- `ml-service/data/training/intent_examples.csv`
- `ml-service/tests/test_priority_engine.py`
- `ml-service/tests/test_analytics.py`
- `ml-service/tests/test_nlp.py`
- `ml-service/tests/test_api_contract.py`
- `ml-service/tests/test_data_sources.py`
- `ML_IMPLEMENTATION_NOTES.md`
- `.env.example`
- `src/lib/ml-client.js`
- `src/lib/ml-mappers.js`
- `src/lib/firestore-ml.ts`
- `src/app/api/ml/priority/rerank/route.ts`
- `src/app/api/ml/analytics/route.ts`
- `src/app/api/ml/guest/route.ts`
- `src/components/GuestAssistant.tsx`
- `tests/ml-integration.test.mjs`

## 8. Files Modified

- `.gitignore`
- `package.json`
- `src/app/dashboard/analytics/page.tsx`
- `src/app/dashboard/fleet/page.tsx`
- `src/app/dashboard/layout.tsx`

Changes:

- Added Python cache ignores.
- Added virtual environment ignores.
- Added `.pytest_cache`, `.mypy_cache`, and `.ruff_cache`.
- Ignored generated `ml-service/models/*.joblib` model binaries while keeping `ml-service/models/.gitkeep`.

Added `src/lib/ml-client.js`, `src/lib/ml-mappers.js`, and `src/lib/firestore-ml.ts` as the server-side integration layer. Added Next.js routes `POST /api/ml/priority/rerank`, `POST /api/ml/analytics`, and `POST /api/ml/guest` plus the minimal `GuestAssistant` component. The existing robot-control UI and transport code were not modified.

## 9. APIs

Base URL in development:

```text
http://localhost:8000
```

### GET /api/ml/health

Purpose: Service health check.

Response:

```json
{
  "status": "ok",
  "service": "ramya-ml-service",
  "version": "0.1.0",
  "simulation_mode_supported": true,
  "restaurant_dataset_available": true
}
```

### POST /api/ml/priority

Purpose: Score one task.

Request:

```json
{
  "task": {
    "task_id": "task-7",
    "order_id": "order-1048",
    "table_id": "T7",
    "task_type": "delivery",
    "waiting_time_minutes": 20,
    "food_age_minutes": 18,
    "food_temperature_c": 45,
    "distance_m": 8,
    "robot_battery_percent": 80,
    "urgency_flag": true,
    "order_delay_minutes": 12,
    "robot_available": true
  }
}
```

Response:

```json
{
  "task_id": "task-7",
  "priority_score": 73.2,
  "priority_level": "HIGH",
  "assignable": true,
  "safety_flags": [],
  "reasons": ["Customer has waited 20 minutes", "Food temperature is below serving threshold at 45.0 C"]
}
```

### POST /api/ml/priority/rerank

Purpose: Score and sort all pending tasks; returns the next best assignable task.

Request:

```json
{
  "trigger": "food_ready",
  "tasks": [
    {
      "task_id": "task-close-new",
      "task_type": "delivery",
      "waiting_time_minutes": 3,
      "food_age_minutes": 2,
      "distance_m": 2,
      "robot_battery_percent": 90,
      "urgency_flag": false,
      "order_delay_minutes": 0,
      "robot_available": true
    },
    {
      "task_id": "task-table-7",
      "task_type": "delivery",
      "waiting_time_minutes": 20,
      "food_age_minutes": 18,
      "food_temperature_c": 45,
      "distance_m": 8,
      "robot_battery_percent": 80,
      "urgency_flag": true,
      "order_delay_minutes": 12,
      "robot_available": true
    }
  ]
}
```

Response contains `ranked_tasks`, `next_best_task`, `count`, and `trigger`.

### POST /api/ml/demand/predict

Purpose: Predict order demand.

Request:

```json
{
  "hour": 13,
  "day_of_week": 5,
  "month": 9,
  "is_weekend": true,
  "item": "pizza",
  "recent_demand": 24,
  "horizon_minutes": 60
}
```

Response contains `predicted_orders`, `prediction_horizon_minutes`, `confidence_metric`, `algorithm`, and `reasons`.

### POST /api/ml/kitchen-load/predict

Purpose: Estimate kitchen load from predicted demand.

Request:

```json
{
  "predicted_orders": 30,
  "active_orders": 8,
  "capacity_per_30_min": 28
}
```

Response contains `load_ratio`, `load_level`, `recommendation`, and `reasons`.

### POST /api/ml/service-time/predict

Purpose: Estimate preparation/service time.

Request:

```json
{
  "item_count": 3,
  "dish_type": "pizza",
  "kitchen_load": 0.85,
  "active_orders": 18,
  "hour": 13,
  "historical_prep_time": 18,
  "robot_available": true,
  "distance_m": 9
}
```

Response contains `estimated_minutes`, `confidence_metric`, `algorithm`, and `reasons`.

### POST /api/ml/waste/predict

Purpose: Predict ingredient/item waste risk.

Request:

```json
{
  "item": "lettuce",
  "stock_quantity": 40,
  "historical_daily_demand": 8,
  "daily_usage": 4,
  "days_to_expiry": 1,
  "unsold_quantity": 34
}
```

Response contains `waste_risk`, `risk_score`, `algorithm`, `confidence_metric`, and `reasons`.

### POST /api/ml/anomaly/check

Purpose: Detect stuck orders, idle robots, and unusual delays.

Request:

```json
{
  "pending_tasks": 3,
  "orders": [
    {
      "order_id": "o1",
      "status": "preparing",
      "elapsed_minutes": 40,
      "expected_minutes": 15
    }
  ],
  "robots": [
    {
      "robot_id": "r1",
      "status": "idle",
      "idle_minutes": 8,
      "battery": 75
    }
  ],
  "delays": [
    {
      "order_id": "o2",
      "current_minutes": 32,
      "historical_minutes": [12, 14, 15, 13, 16]
    }
  ]
}
```

Response contains `alerts`, `alert_count`, and `explainable`.

### POST /api/ml/intent

Purpose: Classify guest message intent.

Request:

```json
{
  "message": "Please call a waiter",
  "table_id": "T7",
  "user_id": "user-1",
  "order_id": "order-1048"
}
```

Response contains `intent`, `confidence`, `algorithm`, `reasons`, and passed context.

### POST /api/ml/sentiment

Purpose: Classify feedback sentiment.

Request:

```json
{
  "message": "The food was amazing"
}
```

Response contains `sentiment`, `score`, `algorithm`, and `reasons`.

### Next.js Integration Routes

The frontend calls these same-origin Next.js routes, which in turn call the FastAPI endpoints listed above using `ML_SERVICE_URL`.

| Method | URL | Firestore source/action | FastAPI calls |
| --- | --- | --- | --- |
| POST | `/api/ml/priority/rerank` | Reads pending `qr_orders`, `api_orders`, and `restaurant_tasks`; reads eligible `robots`; writes priority fields | `/api/ml/priority/rerank` |
| POST | `/api/ml/analytics` | Reads active orders plus optional `robots`, `ingredients`, and `inventory` | Demand, kitchen load, service time, waste, anomaly |
| POST | `/api/ml/guest` | Reads the requested order/FAQ; creates a staff task or feedback document when needed | Intent and sentiment |

Every Next.js route requires a JSON `userId`. The priority route accepts an optional `trigger`; the guest route accepts `message` plus optional `tableId` and `orderId`. Errors use a meaningful JSON response and do not expose raw FastAPI fetch errors.

## 10. Database Changes

No Firebase schema files exist in this repository. The integration reads the existing `qr_orders` and `api_orders` collections. It reads `robots`, `ingredients`, and `inventory` only when those optional collections have live data.

The guest assistant creates `restaurant_tasks` for staff assistance and `guest_feedback` for feedback. Reranking persists `priorityScore`, `priorityLevel`, `priorityReasons`, and `priorityUpdatedAt` on each source order/task. It persists `assignedRobot` only for the selected task when a Firestore robot is `idle` or `available`, has at least 20% battery, and has neither `emergencyStop` nor `obstacleDetected` set.

Recommended future backend fields:

- Task documents can store `priorityScore`, `priorityLevel`, `priorityReasons`, `assignedRobot`, and `lastRankedAt`.
- Orders can store `expectedPreparationTime`, `readyTime`, `deliveredTime`, and derived `orderDelayMinutes`.
- Robot documents can store `battery`, `status`, `location`, `currentTask`, and `lastTelemetryAt`.
- Sensor/telemetry documents can store MLX90614 temperature, HC-SR04 distance/obstacle data, MPU6050 motion data, BLE position, and timestamp.

These remain recommended fields for future robot telemetry documents. The listed priority fields are now written by the integration.

## 11. Frontend Changes

The existing analytics page now shows live model responses from the local Next.js analytics route. Fleet Management now includes a compact FastAPI-ranked task queue. The existing assistant button now opens a compact form backed by the local guest route. No global layout, styling system, or robot controls were redesigned.

Connected dashboard integration points:

- Task priority queue: call backend -> `/api/ml/priority/rerank`.
- AI analytics cards: call backend -> demand, kitchen-load, service-time, waste, anomaly APIs.
- Guest assistant widget: call backend -> `/api/ml/intent`; backend decides order lookup, staff task creation, FAQ answer, or feedback storage.

The frontend should not calculate task priority locally.

Analytics uses a 12-hour forecast from the demand model. Waste risk is shown only when a live `ingredients` or `inventory` document contains an item/name, stock quantity, historical/average daily demand, and days to expiry. The UI explicitly identifies this missing live data instead of fabricating a waste prediction.

## 12. Environment Variables

Required for the current Next.js server-route integration:

```text
ML_SERVICE_URL=http://localhost:8000
```

Optional:

```text
ML_REQUEST_TIMEOUT_MS=5000
```

No secrets were added. `.env.example` contains these non-secret variables.

## 13. How To Run

From `knos-temp/ml-service`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Then open:

```text
http://localhost:8000/api/ml/health
http://localhost:8000/docs
```

Existing Next.js frontend:

```bash
cd knos-temp
npm install
npm run dev
```

Future MERN backend:

```bash
set ML_SERVICE_URL=http://localhost:8000
npm run dev
```

The actual backend command depends on the future Express server package because no Express backend currently exists in this repository.

## 14. How To Test

From `knos-temp/ml-service`:

```bash
python -m unittest discover -s tests
python -m compileall .
```

With dependencies installed, also run:

```bash
pytest
```

Example API request:

```bash
curl -X POST http://localhost:8000/api/ml/priority/rerank ^
  -H "Content-Type: application/json" ^
  -d "{\"trigger\":\"food_ready\",\"tasks\":[{\"task_id\":\"new-close\",\"waiting_time_minutes\":3,\"food_age_minutes\":2,\"distance_m\":2,\"robot_battery_percent\":90},{\"task_id\":\"old-food\",\"waiting_time_minutes\":20,\"food_age_minutes\":21,\"food_temperature_c\":45,\"distance_m\":8,\"robot_battery_percent\":80,\"urgency_flag\":true,\"order_delay_minutes\":12}]}"
```

Tests implemented:

- Restaurant CSV availability and schema transforms
- Priority engine normal task
- Urgent task
- Old/cold food
- Low battery robot
- Far/near table
- Multiple task ranking
- Real-time reranking
- Demand prediction response
- Kitchen load
- Service time under different loads
- Waste prediction
- Normal/stuck order anomaly
- Idle robot anomaly
- Unusual delay anomaly
- NLP `ORDER_STATUS`
- NLP `CALL_STAFF`
- NLP `FAQ`
- NLP `FEEDBACK`
- NLP unknown intent
- FastAPI endpoint contract tests

Local verification result during implementation:

- Bundled Python: `python -m unittest discover -s tests` passed 26 tests with 3 endpoint tests skipped because FastAPI is not installed in that bundled runtime.
- `python -m compileall app.py model_store.py data_sources.py analytics nlp priority tests`: passed.
- Project virtual environment: `.venv\Scripts\python.exe -m unittest tests\test_api_contract.py` passed all 3 FastAPI endpoint contract tests.
- `npm run lint`: failed because local `node_modules`/`eslint` are not installed; no frontend code was modified.

## 15. Mock/Simulation Data

Real restaurant CSVs are now the primary analytics data source when present:

- Demand uses `fact_orders.csv`, `fact_order_items.csv`, and `dim_menu_items.csv`.
- Service-time uses `fact_orders.csv`, `fact_order_items.csv`, `dim_menu_items.csv`, and `dim_menu_categories.csv`.
- Waste risk uses `fact_ingredient_consumption.csv` and `dim_ingredients.csv`.
- Sentiment reference analytics use `fact_customer_feedback.csv`.

Simulation data remains as fallback only:

- Demand data is generated in `synthetic_demand_data`.
- Service-time data is generated in `synthetic_service_time_data`.
- Waste data is generated in `synthetic_waste_data`.
- Intent examples are stored in `data/training/intent_examples.csv` and mirrored in code.

Synthetic outputs are labelled with `training_data: synthetic/demo` only when the real CSV folder is unavailable. Real CSV-backed outputs use `training_data: restaurant_analytics_csv`.

## 16. Real Hardware Integration

Real ESP32/sensor data should enter through the backend, not directly into the ML service from hardware.

Recommended flow:

ESP32/robot telemetry -> backend telemetry endpoint -> database/task state -> backend calls ML service.

Sensor mapping:

- MLX90614 food temperature -> `food_temperature_c`
- HC-SR04 distance/obstacle -> robot safety layer and optionally `distance_m`
- MPU6050 motion/telemetry -> robot status and anomaly context
- BLE beacons -> robot/table location and distance estimation

Safety controls such as obstacle detection, emergency stop, and minimum battery assignment must remain deterministic in robot/backend code.

## 17. SIH Presentation Explanation

What ML/AI does:

- Ranks robot tasks intelligently instead of FIFO.
- Predicts demand and service time.
- Estimates kitchen load and waste risk.
- Detects operational anomalies.
- Classifies guest assistant intent and feedback sentiment.

What is rule-based:

- Battery safety gates.
- Robot availability gate.
- Kitchen load recommendations.
- Stuck order detection.
- Idle robot detection.
- Z-score delay anomaly detection.
- Sentiment fallback.

Core innovation:

- Hybrid intelligence for robot task priority: waiting time, food temperature, food age, urgency, order delay, battery, availability, distance, and task type are combined into an explainable priority score.

How priority works:

- Every pending task receives a score.
- Unsafe/unavailable robot assignments are blocked.
- Tasks are reranked whenever relevant state changes.
- The highest assignable task becomes the next robot recommendation.

How demand prediction works:

- The model uses hour, day, month, weekend flag, item, and recent demand.
- Random Forest is used when dependencies are installed.
- Synthetic/demo data is used until real historical data is connected.

How the robot receives the decision:

- Backend calls `/api/ml/priority/rerank`.
- Backend selects `next_best_task`.
- Backend applies deterministic robot safety checks.
- Backend sends the task to robot control.

## 18. Limitations

- The current repository does not include an Express/MongoDB backend.
- The current repository uses Firebase/Firestore from Next.js pages and route handlers.
- Real restaurant historical demand, waste, service-time, menu, ingredient, and feedback datasets are present under `ml-service/Resturant Analytics Dashboard/output` and are now used by the analytics loaders.
- Some dataset rows contain quality issues such as negative stock/quantity/seating values. The implementation cleans only derived in-memory ML feature frames where needed and does not modify source files.
- The bundled Python does not contain FastAPI, so its test run skips the endpoint module. The project virtual environment contains FastAPI and completed all 3 endpoint contract tests successfully.
- The service includes fallback logic so pure Python tests can still verify behavior without those packages.
- No live ESP32, MLX90614, HC-SR04, MPU6050, or BLE data is connected.
- The frontend was not integrated by request.
- The service recommends and scores; it does not override robot physical safety logic.

## 19. Future Improvements

- Connect real MongoDB/Firestore exports for orders, prep times, delivery times, stock, and waste.
- Add a real Node/Express ML client using `ML_SERVICE_URL`.
- Persist task scores and explanations in the task/order database.
- Add scheduled retraining jobs once enough real data exists.
- Replace CSV reads with production database/export pipelines once the backend data layer is finalized.
- Add XGBoost or LightGBM after baseline metrics exist.
- Add Isolation Forest for anomaly detection after enough historical service telemetry exists.
- Add per-dish thermal profiles and container-specific cooling rates.
- Add calibrated confidence intervals from real validation datasets.
- Add dashboard polling or server-sent updates for live priority queue refresh.
