const DEFAULT_ML_SERVICE_URL = "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 15000;

export class MlServiceError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "MlServiceError";
    this.code = code;
    this.status = status;
  }
}

function serviceUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export function createMlClient({
  baseUrl = process.env.ML_SERVICE_URL || DEFAULT_ML_SERVICE_URL,
  timeoutMs = Number(process.env.ML_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  fetchImpl = fetch,
} = {}) {
  async function post(path, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetchImpl(serviceUrl(baseUrl, path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error) {
      const code = controller.signal.aborted ? "ML_SERVICE_TIMEOUT" : "ML_SERVICE_UNAVAILABLE";
      throw new MlServiceError(code, "RAMYA ML service is unavailable. Please try again shortly.");
    } finally {
      clearTimeout(timeout);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new MlServiceError("ML_INVALID_RESPONSE", "RAMYA ML service returned an invalid response.", response.status);
    }

    if (!response.ok) {
      const detail = typeof payload?.detail === "string" ? payload.detail : "ML request was rejected.";
      throw new MlServiceError("ML_REQUEST_FAILED", detail, response.status);
    }
    if (!payload || Array.isArray(payload) || typeof payload !== "object") {
      throw new MlServiceError("ML_INVALID_RESPONSE", "RAMYA ML service returned an invalid response.", response.status);
    }
    return payload;
  }

  return {
    rerank: (body) => post("/api/ml/priority/rerank", body),
    demand: (body) => post("/api/ml/demand/predict", body),
    kitchenLoad: (body) => post("/api/ml/kitchen-load/predict", body),
    serviceTime: (body) => post("/api/ml/service-time/predict", body),
    waste: (body) => post("/api/ml/waste/predict", body),
    anomaly: (body) => post("/api/ml/anomaly/check", body),
    intent: (body) => post("/api/ml/intent", body),
    sentiment: (body) => post("/api/ml/sentiment", body),
  };
}

export const mlClient = createMlClient();
