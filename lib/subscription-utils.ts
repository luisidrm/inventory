import type {
  MySubscriptionDto,
  SubscriptionBillingCycle,
  SubscriptionStatus,
} from "./dashboard-types";

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

function normalizeStatus(raw: unknown): SubscriptionStatus {
  const s = str(raw).toLowerCase();
  if (s === "active" || s === "pending" || s === "expired" || s === "cancelled") return s;
  return "pending";
}

function normalizeBilling(raw: unknown): SubscriptionBillingCycle {
  const s = str(raw).toLowerCase();
  if (s === "annual" || s === "yearly" || s === "anual") return "annual";
  return "monthly";
}

function planNameFrom(inner: Record<string, unknown>): string {
  const direct =
    inner.planName ??
    inner.PlanName ??
    inner.planDisplayName ??
    inner.PlanDisplayName;
  if (direct !== undefined && direct !== null) return str(direct);
  const plan = inner.plan ?? inner.Plan;
  if (plan && typeof plan === "object") {
    const p = plan as Record<string, unknown>;
    return str(p.displayName ?? p.DisplayName ?? p.name ?? p.Name);
  }
  return "";
}

export function parseMySubscriptionResponse(raw: unknown): MySubscriptionDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const inner = (o.result ?? o.Result ?? o.data ?? o.Data ?? o) as unknown;
  if (!inner || typeof inner !== "object") return null;
  const r = inner as Record<string, unknown>;

  const planName = planNameFrom(r);
  const status = normalizeStatus(r.status ?? r.Status);
  const billingCycle = normalizeBilling(r.billingCycle ?? r.BillingCycle);
  const startDate = str(r.startDate ?? r.StartDate ?? "");
  const endDate = str(r.endDate ?? r.EndDate ?? "");
  const daysRemaining = num(r.daysRemaining ?? r.DaysRemaining, 0);

  const limits = (r.limits ?? r.Limits) as Record<string, unknown> | undefined;
  const fromLimits = limits && typeof limits === "object" ? limits : null;
  const productsLimit = num(
    fromLimits?.productsLimit ??
      fromLimits?.ProductsLimit ??
      fromLimits?.maxProducts ??
      fromLimits?.MaxProducts ??
      r.productsLimit ??
      r.ProductsLimit ??
      r.maxProducts ??
      r.MaxProducts,
    -1,
  );
  const usersLimit = num(
    fromLimits?.usersLimit ??
      fromLimits?.UsersLimit ??
      fromLimits?.maxUsers ??
      fromLimits?.MaxUsers ??
      r.usersLimit ??
      r.UsersLimit,
    -1,
  );
  const locationsLimit = num(
    fromLimits?.locationsLimit ??
      fromLimits?.LocationsLimit ??
      fromLimits?.maxLocations ??
      fromLimits?.MaxLocations ??
      r.locationsLimit ??
      r.LocationsLimit,
    -1,
  );

  return {
    planName: planName || "—",
    status,
    billingCycle,
    startDate,
    endDate,
    daysRemaining,
    productsLimit,
    usersLimit,
    locationsLimit,
  };
}
