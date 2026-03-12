"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CartDrawer } from "./components/CartDrawer";
import "./catalog.css";

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-layout">
      <header className="catalog-topbar">
        <Link href="/" className="catalog-topbar__brand">
          <img
            src="/assets/strova-claro-nobg.png"
            alt="Strova"
            className="catalog-topbar__logo"
          />
          <span className="catalog-topbar__name">Catálogo</span>
        </Link>

        <div className="catalog-topbar__actions">
          <Link href="/login" className="catalog-topbar__btn">
            <Icon name="login" />
            <span>Iniciar Sesión</span>
          </Link>
        </div>
      </header>

      <main className="catalog-main">{children}</main>

      {/* Carrito flotante — disponible en todas las páginas del catálogo */}
      <CartDrawer />
    </div>
  );
}
