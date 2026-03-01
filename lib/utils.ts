import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PERMISSIONS = [
  { id: 1,  code: "admin",                      name: "Administrador" },
  { id: 11, code: "inventory.manage",            name: "Gestionar Inventario" },
  { id: 10, code: "inventory.read",              name: "Ver Inventario" },
  { id: 13, code: "inventorymovement.create",    name: "Crear Movimiento de Inventario" },
  { id: 12, code: "inventorymovement.read",      name: "Ver Movimientos de Inventario" },
  { id: 30, code: "location.create",             name: "Crear Ubicación" },
  { id: 32, code: "location.delete",             name: "Eliminar Ubicación" },
  { id: 29, code: "location.read",               name: "Ver Ubicaciones" },
  { id: 31, code: "location.update",             name: "Editar Ubicación" },
  { id: 22, code: "log.read",                    name: "Ver Registros de Actividad" },
  { id: 34, code: "organization.create",         name: "Crear Organización" },
  { id: 36, code: "organization.delete",         name: "Eliminar Organización" },
  { id: 33, code: "organization.read",           name: "Ver Organizaciones" },
  { id: 35, code: "organization.update",         name: "Editar Organización" },
  { id: 3,  code: "product.create",              name: "Crear Producto" },
  { id: 5,  code: "product.delete",              name: "Eliminar Producto" },
  { id: 2,  code: "product.read",                name: "Ver Productos" },
  { id: 4,  code: "product.update",              name: "Editar Producto" },
  { id: 19, code: "productcategory.create",      name: "Crear Categoría de Producto" },
  { id: 21, code: "productcategory.delete",      name: "Eliminar Categoría de Producto" },
  { id: 18, code: "productcategory.read",        name: "Ver Categorías de Producto" },
  { id: 20, code: "productcategory.update",      name: "Editar Categoría de Producto" },
  { id: 26, code: "role.create",                 name: "Crear Rol" },
  { id: 28, code: "role.delete",                 name: "Eliminar Rol" },
  { id: 25, code: "role.read",                   name: "Ver Roles" },
  { id: 27, code: "role.update",                 name: "Editar Rol" },
  { id: 24, code: "setting.manage",              name: "Gestionar Configuración" },
  { id: 23, code: "setting.read",                name: "Ver Configuración" },
  { id: 15, code: "supplier.create",             name: "Crear Proveedor" },
  { id: 17, code: "supplier.delete",             name: "Eliminar Proveedor" },
  { id: 14, code: "supplier.read",               name: "Ver Proveedores" },
  { id: 16, code: "supplier.update",             name: "Editar Proveedor" },
  { id: 7,  code: "user.create",                 name: "Crear Usuario" },
  { id: 9,  code: "user.delete",                 name: "Eliminar Usuario" },
  { id: 6,  code: "user.read",                   name: "Ver Usuarios" },
  { id: 8,  code: "user.update",                 name: "Editar Usuario" },
];
