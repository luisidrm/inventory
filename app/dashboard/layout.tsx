"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clearSession } from "@/lib/auth-api";
import "./dashboard.css";

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

const navItems: NavItem[] = [
  { icon: "dashboard", label: "Dashboard", route: "/dashboard" },
  { icon: "inventory_2", label: "Productos", route: "/dashboard/products" },
  { icon: "category", label: "Categorías", route: "/dashboard/categories" },
  { icon: "local_shipping", label: "Proveedores", route: "/dashboard/suppliers" },
  { icon: "warehouse", label: "Ubicaciones", route: "/dashboard/locations" },
  { icon: "inventory", label: "Inventario", route: "/dashboard/inventory" },
  { icon: "swap_horiz", label: "Movimientos", route: "/dashboard/movements" },
];

const adminItems: NavItem[] = [
  { icon: "group", label: "Usuarios", route: "/dashboard/users" },
  { icon: "admin_panel_settings", label: "Roles", route: "/dashboard/roles" },
  { icon: "settings", label: "Configuración", route: "/dashboard/settings" },
];

function BrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw) as { fullName?: string };
        setUserName(user.fullName ?? "");
      }
    } catch {
      setUserName("");
    }
  }, []);

  const isActive = (route: string) => {
    if (route === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(route);
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
    router.refresh();
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <div className={`dashboard ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-brand">
          <Link href="/dashboard" className="brand">
            <div className="brand-icon">
              <BrandIcon />
            </div>
            {!collapsed && (
              <span className="brand-text">
                Inventory<span>Pro</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            {!collapsed && <div className="nav-group-label">MENÚ</div>}
            {navItems.map((item) => (
              <Link
                key={item.route}
                href={item.route}
                className={`nav-item ${isActive(item.route) ? "active" : ""}`}
              >
                <Icon name={item.icon} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
          <div className="nav-group">
            {!collapsed && <div className="nav-group-label">ADMIN</div>}
            {adminItems.map((item) => (
              <Link
                key={item.route}
                href={item.route}
                className={`nav-item ${isActive(item.route) ? "active" : ""}`}
              >
                <Icon name={item.icon} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-bottom">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{initial}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{userName || "Usuario"}</span>
                <span className="sidebar-user-role">Admin</span>
              </div>
            </div>
          )}
          <button
            type="button"
            className="nav-item nav-item--danger"
            onClick={handleLogout}
          >
            <Icon name="logout" />
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-toggle"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Abrir menú" : "Cerrar menú"}
            >
              <Icon name={collapsed ? "menu_open" : "menu"} />
            </button>
          </div>
          <div className="topbar-right">
            <button type="button" className="topbar-icon-btn" aria-label="Notificaciones">
              <Icon name="notifications_none" />
            </button>
            <button type="button" className="topbar-icon-btn" aria-label="Mensajes">
              <Icon name="mail_outline" />
            </button>
            <div className="topbar-profile">
              <div className="topbar-avatar">{initial}</div>
              <div className="topbar-user-text">
                <span className="topbar-user-name">{userName || "Usuario"}</span>
                <span className="topbar-user-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
