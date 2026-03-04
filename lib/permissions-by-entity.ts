/**
 * Permisos agrupados por entidad para el modal de roles.
 * Cada entidad tiene un permiso "read" (Ver) y opcionalmente create, update, delete, manage.
 */

export type PermissionOp = "read" | "create" | "update" | "delete" | "manage";

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  op: PermissionOp;
}

export interface EntityGroup {
  key: string;
  label: string;
  description: string;
  permissions: PermissionItem[];
}

const OP_NAMES: Record<PermissionOp, string> = {
  read: "Ver",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
  manage: "Gestionar",
};

/** Nombre legible cuando la API no envía name (evita mostrar "product.create"). */
function friendlyName(code: string, op: PermissionOp): string {
  const [entity] = code.split(".");
  const opLabel = OP_NAMES[op] ?? op;
  const entityLabels: Record<string, string> = {
    product: "Producto",
    productcategory: "Categoría de producto",
    supplier: "Proveedor",
    user: "Usuario",
    role: "Rol",
    location: "Ubicación",
    inventory: "Inventario",
    inventorymovement: "Movimiento de inventario",
    setting: "Configuración",
    log: "Registros de actividad",
    organization: "Organización",
    admin: "Administrador",
  };
  const entityLabel = entityLabels[entity] ?? entity;
  if (entity === "admin") return "Administrador";
  if (op === "read") return `Ver ${entityLabel}${entity === "productcategory" || entity === "inventorymovement" ? "" : "s"}`;
  return `${opLabel} ${entityLabel}`;
}

/** Construye grupos desde una lista de permisos { id, code, name }. */
export function buildEntityGroups(
  list: { id: number; code: string; name?: string }[]
): EntityGroup[] {
  const byEntity = new Map<string, PermissionItem[]>();

  for (const p of list) {
    const [entity, op] = p.code.split(".") as [string, PermissionOp];
    const opVal = (op ?? "read") as PermissionOp;
    const rawName = (p.name && p.name.trim()) ? p.name : "";
    const name =
      rawName && !rawName.includes(".") && rawName !== p.code
        ? rawName
        : friendlyName(p.code, opVal);
    const item: PermissionItem = { id: p.id, code: p.code, name, op: opVal };
    if (!byEntity.has(entity)) byEntity.set(entity, []);
    byEntity.get(entity)!.push(item);
  }

  const ORDER: Record<string, number> = {
    admin: 0,
    product: 1,
    productcategory: 2,
    supplier: 3,
    location: 4,
    inventory: 5,
    inventorymovement: 6,
    user: 7,
    role: 8,
    setting: 9,
    log: 10,
    organization: 11,
  };

  const LABELS: Record<string, string> = {
    admin: "Administrador",
    product: "Productos",
    productcategory: "Categorías de producto",
    supplier: "Proveedores",
    location: "Ubicaciones",
    inventory: "Inventario",
    inventorymovement: "Movimientos de inventario",
    user: "Usuarios",
    role: "Roles",
    setting: "Configuración",
    log: "Registros de actividad",
    organization: "Organización",
  };

  const DESCRIPTIONS: Record<string, string> = {
    admin: "Acceso total al sistema.",
    product: "Catálogo de productos, precios y stock.",
    productcategory: "Categorías para organizar productos.",
    supplier: "Directorio de proveedores y contactos.",
    location: "Ubicaciones y almacenes.",
    inventory: "Stock por producto y ubicación.",
    inventorymovement: "Entradas, salidas y ajustes de inventario.",
    user: "Usuarios y acceso a la plataforma.",
    role: "Roles y permisos por módulo.",
    setting: "Ajustes generales del sistema.",
    log: "Auditoría y registro de actividades.",
    organization: "Datos de la organización.",
  };

  const groups: EntityGroup[] = [];
  for (const [entity, perms] of byEntity) {
    const sorted = perms.sort((a, b) => {
      const order: PermissionOp[] = ["read", "create", "update", "delete", "manage"];
      return order.indexOf(a.op) - order.indexOf(b.op);
    });
    groups.push({
      key: entity,
      label: LABELS[entity] ?? entity,
      description: DESCRIPTIONS[entity] ?? "",
      permissions: sorted,
    });
  }
  groups.sort((a, b) => (ORDER[a.key] ?? 99) - (ORDER[b.key] ?? 99));
  return groups;
}

/** Obtiene el permiso "read" de un grupo (para el toggle Ver). */
export function getReadPermission(group: EntityGroup): PermissionItem | null {
  return group.permissions.find((p) => p.op === "read") ?? group.permissions[0] ?? null;
}

/** Permisos que no son "read" (operaciones extra: crear, editar, eliminar, gestionar). */
export function getOtherPermissions(group: EntityGroup): PermissionItem[] {
  return group.permissions.filter((p) => p.op !== "read");
}
