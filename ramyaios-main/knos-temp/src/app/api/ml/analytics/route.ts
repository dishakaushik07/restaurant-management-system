import { NextResponse } from "next/server";
import { analyticsInputs, anomalyPayload, loadRestaurantMlState } from "@/lib/firestore-ml";
import { MlServiceError, mlClient } from "@/lib/ml-client";
import { numberValue, requireUserId } from "@/lib/ml-mappers";

export const runtime = "nodejs";

type Available<T> = { available: true; data: T } | { available: false; error: string; code?: string };

async function safely<T>(action: () => Promise<T>): Promise<Available<T>> {
  try {
    return { available: true, data: await action() };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "ML request failed.",
      code: error instanceof MlServiceError ? error.code : undefined,
    };
  }
}

function wasteRequest(record: Record<string, any>) {
  const item = record.ingredientName ?? record.ingredient_name ?? record.item ?? record.name;
  const stock = record.stockQuantity ?? record.stock_available ?? record.quantity;
  const demand = record.historicalDailyDemand ?? record.averageDailyDemand ?? record.dailyDemand;
  const expiry = record.daysToExpiry ?? record.days_to_expiry;
  if (!item || stock === undefined || demand === undefined || expiry === undefined) return null;
  return {
    item: String(item),
    stock_quantity: Math.max(0, numberValue(stock)),
    historical_daily_demand: Math.max(0, numberValue(demand)),
    daily_usage: Math.max(0, numberValue(record.dailyUsage ?? record.quantity_used)),
    days_to_expiry: Math.max(0, numberValue(expiry)),
    unsold_quantity: Math.max(0, numberValue(record.unsoldQuantity ?? record.wastage_quantity)),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = requireUserId(body.userId);
    const state = await loadRestaurantMlState(userId);
    const inputs = analyticsInputs(state);
    const demandForecast = await Promise.all(Array.from({ length: 12 }, (_, offset) => {
      const forecastAt = new Date();
      forecastAt.setHours(forecastAt.getHours() + offset);
      return safely(() => mlClient.demand({
        hour: forecastAt.getHours(),
        day_of_week: (forecastAt.getDay() + 6) % 7,
        month: forecastAt.getMonth() + 1,
        is_weekend: forecastAt.getDay() === 0 || forecastAt.getDay() === 6,
        item: inputs.item,
        recent_demand: inputs.recent_demand,
        horizon_minutes: 60,
      }));
    }));
    const currentDemand = demandForecast[0];
    const kitchenLoad = currentDemand.available
      ? await safely(() => mlClient.kitchenLoad({ predicted_orders: currentDemand.data.predicted_orders, active_orders: inputs.activeOrders }))
      : { available: false as const, error: "Demand prediction is unavailable, so kitchen load cannot be calculated." };
    const serviceTime = inputs.averageItemCount > 0
      ? await safely(() => mlClient.serviceTime({
        item_count: inputs.averageItemCount,
        dish_type: inputs.item,
        kitchen_load: kitchenLoad.available ? kitchenLoad.data.load_ratio : 0,
        active_orders: inputs.activeOrders,
        hour: inputs.hour,
        robot_available: Boolean(inputs.robot),
      }))
      : await safely(() => mlClient.serviceTime({
        item_count: 2,
        dish_type: "mixed",
        kitchen_load: kitchenLoad.available ? kitchenLoad.data.load_ratio : 0.15,
        active_orders: 0,
        hour: inputs.hour,
        robot_available: true,
      }));
    const defaultWasteItems = [
      { item: "Lettuce / Salad Greens", stock_quantity: 40, historical_daily_demand: 8, daily_usage: 4, days_to_expiry: 1, unsold_quantity: 34 },
      { item: "Fresh Milk & Cream", stock_quantity: 30, historical_daily_demand: 15, daily_usage: 12, days_to_expiry: 2, unsold_quantity: 10 },
      { item: "Burger Buns", stock_quantity: 50, historical_daily_demand: 30, daily_usage: 26, days_to_expiry: 3, unsold_quantity: 14 },
    ];
    const liveWasteRequests = state.inventory.map(wasteRequest).filter(Boolean).slice(0, 20);
    const wasteRequests = liveWasteRequests.length ? liveWasteRequests : defaultWasteItems;
    const wasteRisk = await Promise.all(wasteRequests.map((payload) => safely(() => mlClient.waste(payload))));
    const anomaly = await safely(() => mlClient.anomaly(anomalyPayload(state, serviceTime.available ? serviceTime.data.estimated_minutes : undefined)));

    return NextResponse.json({
      demandForecast: demandForecast.map((result, offset) => ({
        hourOffset: offset,
        ...result,
      })),
      kitchenLoad,
      serviceTime,
      wasteRisk,
      anomaly,
      sourceCounts: { activeOrders: state.activeOrders.length, inventoryRecords: state.inventory.length, robots: state.robots.length },
      warnings: state.warnings,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load ML analytics." }, { status: 400 });
  }
}
