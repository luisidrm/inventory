/** Plan público devuelto por GET /plan (normalizado a camelCase). */
export interface PublicPlan {
  id: number;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  productsLimit: number;
  usersLimit: number;
  locationsLimit: number;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePlan(item: Record<string, unknown>): PublicPlan {
  return {
    id: num(item.id ?? item.Id ?? item.planId ?? item.PlanId, -1),
    displayName: String(item.displayName ?? item.DisplayName ?? ""),
    monthlyPrice: num(item.monthlyPrice ?? item.MonthlyPrice, 0),
    annualPrice: num(item.annualPrice ?? item.AnnualPrice, 0),
    productsLimit: num(
      item.productsLimit ??
        item.ProductsLimit ??
        item.maxProducts ??
        item.MaxProducts,
      -1,
    ),
    usersLimit: num(
      item.usersLimit ?? item.UsersLimit ?? item.maxUsers ?? item.MaxUsers,
      -1,
    ),
    locationsLimit: num(
      item.locationsLimit ??
        item.LocationsLimit ??
        item.maxLocations ??
        item.MaxLocations,
      -1,
    ),
  };
}

export function parsePlansFromApi(raw: unknown): PublicPlan[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const inner = o.result ?? o.Result ?? o.data ?? o.Data;
    if (Array.isArray(inner)) list = inner;
    else if (Array.isArray(o.plans)) list = o.plans as unknown[];
  }
  return list
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .map(normalizePlan)
    .filter((p) => p.id >= 0 && p.displayName.length > 0);
}

export function formatPlanLimit(value: number): string {
  return value === -1 ? "Ilimitado" : String(value);
}

export function formatPlanPriceDisplay(value: number): string {
  if (value === 0) return "Gratis";
  return new Intl.NumberFormat("es-419", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function isPaidPlan(plan: PublicPlan | undefined): boolean {
  if (!plan) return false;
  return plan.monthlyPrice > 0 || plan.annualPrice > 0;
}
