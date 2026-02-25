import { isRejectedWithValue, isFulfilled, type Middleware } from "@reduxjs/toolkit";
import { create } from "domain";
import { toast } from "sonner";

// Endpoints that should stay silent (e.g. background fetches)
const SILENT_ENDPOINTS = new Set([
  "getProducts",
  "getProductCategories",
  "refreshToken",
  "getInventory",
  "getCategories",
  "getSuppliers",
  "getLocations",
  "getMovements",
  "getUsers",
  "getRoles",
  "getLogs",
  "getSettings",
  // add any GET/query endpoints you don't want toasting
]);

// Custom messages per endpoint — optional
const SUCCESS_MESSAGES: Record<string, string> = {
  createProduct:  "Producto creado correctamente",
  updateProduct:  "Producto actualizado correctamente",
  deleteProduct:  "Producto eliminado correctamente",
  login:          "Sesión iniciada correctamente",
  logout:         "Sesión cerrada",
  resetPassword:  "Correo de recuperación enviado",
  createUser:     "Usuario creado correctamente",
  updateUser:     "Usuario actualizado correctamente",
  deleteUser:     "Usuario eliminado correctamente",
  createInventory:  "Entrada de inventario creada",
  updateInventory:  "Entrada de inventario actualizada",
  deleteInventory:  "Entrada de inventario eliminada",
  createCategory:   "Categoría creada correctamente",
  updateCategory:   "Categoría actualizada correctamente",
  deleteCategory:   "Categoría eliminada correctamente",
  createSupplier:   "Proveedor creado correctamente",
  updateSupplier:   "Proveedor actualizado correctamente",
  deleteSupplier:   "Proveedor eliminado correctamente",
  createLocation:   "Ubicación creada correctamente",
  updateLocation:   "Ubicación actualizada correctamente",
  deleteLocation:   "Ubicación eliminada correctamente",
  createRole:       "Rol creado correctamente",
  updateRole:       "Rol actualizado correctamente",
  deleteRole:       "Rol eliminado correctamente",
};

const ERROR_MESSAGES: Record<string, string> = {
  login:         "Credenciales incorrectas",
  deleteProduct: "No se pudo eliminar el producto",
};

export const toastMiddleware: Middleware = () => (next) => (action) => {
  console.log("[toast]", (action as any).type); // should log EVERYTHING
  const result = next(action);

  // Log every action so we can see what's coming through
  console.log("[toastMiddleware] action:", (action as any).type, action);

  const type = (action as any).type as string | undefined;
  if (!type) return result;

  // RTK Query fulfilled actions look like: "authApi/executeMutation/fulfilled"
  // or "productsApi/executeQuery/fulfilled"
  const endpointName = (action as any)?.meta?.arg?.endpointName as string | undefined;
  if (!endpointName || SILENT_ENDPOINTS.has(endpointName)) return result;

  if (type.endsWith("/fulfilled")) {
    const message = SUCCESS_MESSAGES[endpointName] ?? "Operación exitosa";
    toast.success(message);
  }

  if (type.endsWith("/rejected")) {
    const payload = (action as any).payload;
    const serverMessage =
      payload?.data?.message ??
      payload?.data?.error ??
      payload?.error ??
      payload?.message ??
      null;
    const message = serverMessage ?? ERROR_MESSAGES[endpointName] ?? "Ocurrió un error";
    toast.error(message);
  }

  return result;
};