export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}


export type ProductTipo = "inventariable" | "elaborado";

export interface ProductResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  categoryId: number;
  precio: number;
  costo: number;
  imagenUrl: string;
  isAvailable: boolean;
  isForSale: boolean;
  tipo?: ProductTipo;
  createdAt: string;
  modifiedAt: string;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  description: string;
  categoryId: number | null;
  precio: number;
  costo: number;
  imagenUrl: string;
  isAvailable: boolean;
  isForSale: boolean;
  tipo?: ProductTipo;
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  description?: string;
  categoryId?: number | null;
  precio?: number;
  costo?: number;
  imagenUrl?: string;
  isAvailable?: boolean;
  isForSale?: boolean;
  tipo?: ProductTipo;
}

export interface ProductCategoryResponse {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
  modifiedAt: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProductCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ─── Proveedor ─────────────────────────────────────────────────────────────────

export interface SupplierResponse {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// ─── Ubicación (LocationResponse en auth-types) ───────────────────────────────

export interface CreateLocationRequest {
  organizationId: number;
  name: string;
  code: string;
  description?: string;
  whatsAppContact?: string;
}

export interface UpdateLocationRequest {
  organizationId?: number;
  name?: string;
  code?: string;
  description?: string;
  whatsAppContact?: string;
}

// ─── Inventario ───────────────────────────────────────────────────────────────

export interface InventoryResponse {
  id: number;
  productId: number;
  currentStock: number;
  minimumStock: number;
  unitOfMeasure: string;
  locationId: number;
  createdAt: string;
  modifiedAt: string;
}

export interface CreateInventoryRequest {
  productId: number;
  locationId: number;
  currentStock: number;
  minimumStock: number;
  unitOfMeasure?: string;
}

export interface UpdateInventoryRequest {
  productId?: number;
  locationId?: number;
  currentStock?: number;
  minimumStock?: number;
  unitOfMeasure?: string;
}

// ─── Movimiento de inventario ─────────────────────────────────────────────────

export interface InventoryMovementResponse {
  id: number;
  productId: number;
  productName?: string;
  locationId: number;
  locationName?: string;
  type: string;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  unitCost?: number;
  unitPrice?: number;
  reason?: string;
  supplierId?: number;
  referenceDocument?: string;
  userId?: number;
  createdAt: string;
}

export interface CreateInventoryMovementRequest {
  productId: number;
  locationId: number;
  type: number;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
  reason?: string;
  supplierId?: number;
  referenceDocument?: string;
  userId?: number;
}

// ─── Rol y permisos ───────────────────────────────────────────────────────────

export interface RoleResponse {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  modifiedAt: string;
  permissionIds: number[];
}

export interface PermissionResponse {
  id: number;
  code: string;
  name: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

// ─── Usuario (UserResponse en auth-types; Create/Update aquí) ──────────────────

export interface CreateUserRequest {
  fullName: string;
  password: string;
  email: string;
  phone?: string;
  birthDate?: string;
  locationId?: number;
  organizationId?: number;
  roleId?: number;
}

export interface UpdateUserRequest {
  fullName?: string;
  oldPassword?: string;
  password?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  locationId?: number;
  organizationId?: number;
  roleId?: number;
}

// ─── Configuración ───────────────────────────────────────────────────────────

export interface SettingResponse {
  id: number;
  key: string;
  value: string;
}

export interface InventorySettingsDto {
  roundingDecimals: number;
  priceRoundingDecimals: number;
  allowNegativeStock: boolean;
  defaultUnitOfMeasure: string;
}

export interface CompanySettingsDto {
  name: string;
  taxId: string;
}

export interface NotificationsSettingsDto {
  alertOnLowStock: boolean;
  lowStockRecipients: string;
}

export interface GroupedSettingsResponse {
  inventory?: InventorySettingsDto;
  company?: CompanySettingsDto;
  notifications?: NotificationsSettingsDto;
}

export interface UpdateGroupedSettingsRequest {
  inventory?: Partial<InventorySettingsDto>;
  company?: Partial<CompanySettingsDto>;
  notifications?: Partial<NotificationsSettingsDto>;
}

// ─── Log ─────────────────────────────────────────────────────────────────────

export interface LogResponse {
  id: number;
  eventType: string;
  logType: string;
  createdAt: string;
  userId: number;
  description: string;
}

// ─── Catálogo público ─────────────────────────────────────────────────────────

export interface PublicLocation {
  id: number;
  name: string;
  description: string | null;
  organizationId: number;
  organizationName: string;
  whatsAppContact: string | null;
}

export interface PublicCatalogItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  imagenUrl: string | null;
  precio: number;
  categoryId: number;
  categoryName: string | null;
  categoryColor: string | null;
  stockAtLocation: number;
 
  tipo?: ProductTipo;
}

// ─── Carrito ──────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  imagenUrl: string | null;
  stockAtLocation: number;
  /** "elaborado" = no se valida stock en backend; permitir cualquier cantidad */
  tipo?: ProductTipo;
}

// ─── Órdenes de venta ─────────────────────────────────────────────────────────

export type SaleOrderStatus = "Draft" | "Confirmed" | "Cancelled";

export interface SaleOrderItemResponse {
  id: number;
  saleOrderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  lineTotal: number;
  grossMargin: number;
}

export interface SaleOrderResponse {
  id: number;
  folio: string;
  organizationId: number;
  locationId: number;
  locationName: string;
  contactId: number | null;
  contactName: string | null;
  status: SaleOrderStatus;
  notes: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  userId: number;
  createdAt: string;
  modifiedAt: string;
  items: SaleOrderItemResponse[];
}

export interface CreateSaleOrderItem {
  productId: number;
  quantity: number;
  unitPrice: number | null;
  discount: number;
}

export interface CreateSaleOrderRequest {
  locationId: number;
  contactId: number | null;
  notes: string | null;
  discountAmount: number;
  items: CreateSaleOrderItem[];
}

export interface UpdateSaleOrderRequest {
  contactId?: number | null;
  notes?: string;
  discountAmount?: number;
}

// ─── Tabla genérica ───────────────────────────────────────────────────────────

export interface TableColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "boolean" | "currency" | "badge";
  width?: string;
}
