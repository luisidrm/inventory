"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="dashboard-placeholder">
      <header className="dashboard-placeholder__header">
        <h1>Dashboard</h1>
        <Link href="/login">Cerrar sesión</Link>
      </header>
      <main className="dashboard-placeholder__main">
        <p>Bienvenido al panel principal. (Placeholder)</p>
      </main>
    </div>
  );
}
