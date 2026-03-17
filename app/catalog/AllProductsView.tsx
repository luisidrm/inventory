"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useCatalogCtx } from "./layout";
import { useGetAllPublicProductsQuery } from "./_service/catalogApi";
import type { PublicCatalogItem } from "@/lib/dashboard-types";

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const PAGE_SIZE = 50;

function fmtPrice(v: number) {
  return `$${v.toFixed(2)}`;
}

function hexToRgb(hex: string): string | null {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r}, ${g}, ${b}`;
}

function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const range = max - min || 1;
  const leftPct = ((value[0] - min) / range) * 100;
  const rightPct = ((value[1] - min) / range) * 100;

  return (
    <>
      <div className="filter-price-display">
        <span>{fmtPrice(value[0])}</span>
        <span>{fmtPrice(value[1])}</span>
      </div>
      <div className="filter-range-wrap">
        <div className="filter-range-track" />
        <div
          className="filter-range-fill"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        <input
          type="range"
          className="filter-range-input"
          min={min}
          max={max}
          step={0.01}
          value={value[0]}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), value[1] - 0.01);
            onChange([v, value[1]]);
          }}
        />
        <input
          type="range"
          className="filter-range-input"
          min={min}
          max={max}
          step={0.01}
          value={value[1]}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), value[0] + 0.01);
            onChange([value[0], v]);
          }}
        />
      </div>
    </>
  );
}

function FilterSidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  priceExtent,
  onlyInStock,
  setOnlyInStock,
  sortKey,
  setSortKey,
}: {
  categories: { name: string; color: string; count: number }[];
  selectedCategory: string | null;
  setSelectedCategory: (v: string | null) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  priceExtent: [number, number];
  onlyInStock: boolean;
  setOnlyInStock: (v: boolean) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
}) {
  return (
    <aside className="allprod-sidebar">
      {categories.length > 0 && (
        <section className="filter-section">
          <div className="filter-title">Categorías</div>
          <div className="filter-cat-list">
            <button
              type="button"
              className={`filter-cat${!selectedCategory ? " filter-cat--active" : ""}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span className="filter-cat__dot" />
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`filter-cat${
                  selectedCategory === c.name ? " filter-cat--active" : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === c.name ? null : c.name,
                  )
                }
              >
                <span
                  className="filter-cat__dot"
                  style={{ background: c.color }}
                />
                {c.name}
                <span className="filter-cat__count">({c.count})</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="filter-section">
        <div className="filter-title">Precio</div>
        <PriceRangeSlider
          min={priceExtent[0]}
          max={priceExtent[1]}
          value={priceRange}
          onChange={setPriceRange}
        />
      </section>

      <section className="filter-section">
        <div className="filter-title">Disponibilidad</div>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
          />
          Solo en stock
        </label>
      </section>

      <section className="filter-section">
        <div className="filter-title">Ordenar por</div>
        <select
          className="filter-select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="default">Relevancia</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
        </select>
      </section>
    </aside>
  );
}

function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="allprod-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel-card">
          <div className="skel-card__img" />
          <div className="skel-card__body">
            <div className="skel-line skel-line--lg" />
            <div className="skel-line skel-line--md" />
            <div className="skel-line skel-line--price" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({
  item,
  onGoToStore,
}: {
  item: PublicCatalogItem;
  onGoToStore: () => void;
}) {
  const isOpen = item.isOpenNow === true;
  const isClosed = item.isOpenNow === false;

  const baseColor = item.categoryColor ?? "#378ADD";
  const rgb = hexToRgb(baseColor);
  const catStyle =
    rgb != null
      ? {
          background: `rgba(${rgb}, 0.09)`,
          color: baseColor,
          border: `1px solid rgba(${rgb}, 0.25)`,
        }
      : {
          background: "#E6F1FB",
          color: "#0C447C",
          border: "1px solid #85B7EB",
        };

  return (
    <div className="p-card p-card--explore">
      <div className="p-explore-img" onClick={onGoToStore}>
        {item.imagenUrl ? (
          <img
            src={item.imagenUrl}
            alt={item.name}
            className="p-explore-img__inner"
            loading="lazy"
          />
        ) : (
          <div className="p-explore-img__placeholder">
            <Icon name="inventory_2" />
          </div>
        )}
      </div>

      <div className="p-explore-img-badges">
        {item.categoryName && (
          <div className="p-explore-cat-badge" style={catStyle}>
            <span
              className="p-explore-cat-badge__dot"
              style={{ backgroundColor: baseColor }}
            />
            <span className="p-explore-cat-badge__label">
              {item.categoryName}
            </span>
          </div>
        )}

        {item.isOpenNow != null && (
          <div
            className={`p-explore-open-badge${
              isOpen ? " p-explore-open-badge--open" : " p-explore-open-badge--closed"
            }`}
          >
            <span className="p-explore-open-badge__dot" />
            <span>{isOpen ? "Abierto" : "Cerrado"}</span>
          </div>
        )}
      </div>

      <div className="p-explore-body">
        <button
          type="button"
          className="p-explore-name"
          onClick={onGoToStore}
        >
          {item.name}
        </button>

        {item.locationName && item.locationId != null && (
          <button
            type="button"
            className="p-explore-location"
            onClick={onGoToStore}
          >
            <span className="p-explore-location__icon">
              <Icon name="location_on" />
            </span>
            <span className="p-explore-location__label">
              {item.locationName}
            </span>
          </button>
        )}

        <div className="p-explore-price">{fmtPrice(item.precio)}</div>

        <button
          type="button"
          className="p-explore-cta"
          onClick={onGoToStore}
        >
          Ver en tienda
        </button>
      </div>
    </div>
  );
}

export default function AllProductsView() {
  const router = useRouter();
  const { search: globalSearch } = useCatalogCtx();

  const [search, setSearch] = useState(globalSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PublicCatalogItem[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAllPublicProductsQuery({ page, pageSize: PAGE_SIZE });

  const pagination = data?.pagination;

  // Reset página cuando cambian filtros principales
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, priceRange, onlyInStock, sortKey]);

  // Sincronizar items con la respuesta del backend cuando cambia page
  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setItems(data.data);
    } else {
      setItems((prev) => [...prev, ...data.data]);
    }
  }, [data, page]);

  // Inicializar rango de precios
  useEffect(() => {
    if (!items.length) return;
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of items) {
      if (p.precio < mn) mn = p.precio;
      if (p.precio > mx) mx = p.precio;
    }
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return;
    setPriceRange([Math.floor(mn), Math.ceil(mx)]);
  }, [items.length]);

  const priceExtent: [number, number] = useMemo(() => {
    if (!items.length) return [0, 100];
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of items) {
      if (p.precio < mn) mn = p.precio;
      if (p.precio > mx) mx = p.precio;
    }
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return [0, 100];
    return [Math.floor(mn), Math.ceil(mx)];
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.categoryName ?? "").toLowerCase().includes(q) ||
          (p.locationName ?? "").toLowerCase().includes(q),
      );
    }

    if (selectedCategory) {
      list = list.filter((p) => p.categoryName === selectedCategory);
    }

    list = list.filter(
      (p) => p.precio >= priceRange[0] && p.precio <= priceRange[1],
    );

    if (onlyInStock) {
      list = list.filter(
        (p) => p.tipo === "elaborado" || p.stockAtLocation > 0,
      );
    }

    switch (sortKey) {
      case "price-asc":
        list.sort((a, b) => a.precio - b.precio);
        break;
      case "price-desc":
        list.sort((a, b) => b.precio - a.precio);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return list;
  }, [
    items,
    search,
    selectedCategory,
    priceRange,
    onlyInStock,
    sortKey,
  ]);

  const categories = useMemo(() => {
    const m = new Map<string, { name: string; color: string; count: number }>();
    for (const p of filtered) {
      if (!p.categoryName) continue;
      const existing = m.get(p.categoryName);
      if (existing) {
        existing.count += 1;
      } else {
        m.set(p.categoryName, {
          name: p.categoryName,
          color: p.categoryColor ?? "#3b82f6",
          count: 1,
        });
      }
    }
    return Array.from(m.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [filtered]);

  const totalProducts = filtered.length;
  const totalLocations =
    new Set(filtered.map((p) => p.locationId).filter((v) => v != null)).size ||
    0;

  const hasMore =
    !!pagination && page < pagination.totalPages && !isLoading && !isError;

  const loadMore = () => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const resetFilters = () => {
    setSearch(globalSearch ?? "");
    setSelectedCategory(null);
    setOnlyInStock(false);
    setSortKey("default");
    setPriceRange(priceExtent);
  };

  const goToStore = useCallback(
    (locationId: number | null) => {
      if (locationId == null) return;
      router.push(`/catalog/${locationId}`);
    },
    [router],
  );

  const loadingFirstPage = isLoading && page === 1;
  const loadingMore = isFetching && page > 1;

  if (isError) {
    return (
      <div className="store-empty">
        <div className="store-empty__icon">
          <Icon name="wifi_off" />
        </div>
        <p className="store-empty__text">
          No pudimos cargar los productos.
        </p>
        <button
          type="button"
          className="store-empty__btn"
          onClick={() => refetch()}
        >
          <Icon name="refresh" /> Reintentar
        </button>
      </div>
    );
  }

  if (!loadingFirstPage && !filtered.length && !items.length) {
    return (
      <div className="store-empty">
        <div className="store-empty__icon">
          <Icon name="inventory_2" />
        </div>
        <p className="store-empty__text">No hay productos disponibles</p>
      </div>
    );
  }

  const hasFilterResults = filtered.length > 0;

  return (
    <div className="allprod-page">
      {/* HERO */}
      <section className="allprod-hero">
        <div className="allprod-hero__inner">
          <header className="allprod-hero__header">
            <h1 className="allprod-hero__title">Todos los productos</h1>
            <p className="allprod-hero__subtitle">
              {totalProducts > 0
                ? `${totalProducts} productos en ${totalLocations} tiendas`
                : "Sin resultados para los filtros actuales"}
            </p>
          </header>

          <div className="allprod-hero__pills">
            <button
              type="button"
              className={`allprod-pill${
                !selectedCategory ? " allprod-pill--active" : ""
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              <span className="allprod-pill__dot allprod-pill__dot--all" />
              <span className="allprod-pill__label">Todos</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`allprod-pill${
                  selectedCategory === c.name ? " allprod-pill--active" : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === c.name ? null : c.name,
                  )
                }
              >
                <span
                  className="allprod-pill__dot"
                  style={{ backgroundColor: c.color }}
                />
                <span className="allprod-pill__label">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BARRA SUPERIOR DEL GRID */}
      <div className="allprod-gridbar">
        <div className="allprod-gridbar__left">
          <span className="allprod-gridbar__count">
            <strong>{totalProducts}</strong> productos
          </span>
        </div>
        <div className="allprod-gridbar__right">
          <button
            type="button"
            className="prod-mobile-filter-btn"
            onClick={() => setMobileFilters(true)}
          >
            <Icon name="tune" /> Filtros
          </button>
          <select
            className="allprod-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="default">Relevancia</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name-asc">Nombre: A-Z</option>
            <option value="name-desc">Nombre: Z-A</option>
          </select>
        </div>
      </div>

      {/* ESTADO: sin resultados por filtros */}
      {!hasFilterResults && items.length > 0 && (
        <div className="store-empty store-empty--compact">
          <div className="store-empty__icon">
            <Icon name="search_off" />
          </div>
          <p className="store-empty__text">
            No se encontraron productos con esos filtros.
          </p>
          <button
            type="button"
            className="store-empty__btn"
            onClick={resetFilters}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* LAYOUT PRINCIPAL */}
      <div className="allprod-layout">
        <FilterSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          priceExtent={priceExtent}
          onlyInStock={onlyInStock}
          setOnlyInStock={setOnlyInStock}
          sortKey={sortKey}
          setSortKey={setSortKey}
        />

        <div className="allprod-grid-wrap">
          {loadingFirstPage ? (
            <SkeletonGrid />
          ) : (
            <>
              <div className="allprod-grid">
                {filtered.map((item) => (
                  <ProductCard
                    key={`${item.id}-${item.locationId ?? "x"}`}
                    item={item}
                    onGoToStore={() => goToStore(item.locationId)}
                  />
                ))}
              </div>

              {loadingMore && <SkeletonGrid count={6} />}

              {hasMore && !loadingMore && (
                <div className="allprod-more">
                  <button
                    type="button"
                    className="allprod-more__btn"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    Ver más
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SIDEBAR MOBILE (drawer) */}
      {mobileFilters && (
        <div
          className="mobile-filter-overlay open"
          onClick={() => setMobileFilters(false)}
        >
          <div
            className="mobile-filter-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-filter-head">
              Filtros
              <button
                type="button"
                className="mobile-filter-close"
                onClick={() => setMobileFilters(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <FilterSidebar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              priceExtent={priceExtent}
              onlyInStock={onlyInStock}
              setOnlyInStock={setOnlyInStock}
              sortKey={sortKey}
              setSortKey={setSortKey}
            />
          </div>
        </div>
      )}
    </div>
  );
}