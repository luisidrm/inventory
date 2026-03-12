"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { addItem, updateQuantity, setLocation } from "@/store/cartSlice";
import {
  useGetPublicCatalogQuery,
  useGetPublicLocationsQuery,
} from "../_service/catalogApi";
import type { PublicCatalogItem } from "@/lib/dashboard-types";

function ProductSkeletons() {
  return (
    <div className="catalog-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="catalog-skeleton--card">
          <div className="catalog-skeleton--card-img" />
          <div className="catalog-skeleton--card-body">
            <div className="catalog-skeleton--line catalog-skeleton--line-sm" />
            <div className="catalog-skeleton--line catalog-skeleton--line-lg" />
            <div className="catalog-skeleton--line catalog-skeleton--line-md" />
            <div className="catalog-skeleton--line catalog-skeleton--line-price" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function ProductCard({ item }: { item: PublicCatalogItem }) {
  const dispatch = useAppDispatch();
  const cartItem = useAppSelector((s) =>
    s.cart.items.find((i) => i.productId === item.id)
  );

  const soldOut = item.stockAtLocation === 0;
  const catColor = item.categoryColor ?? "#6366f1";

  const handleAdd = () => {
    dispatch(
      addItem({
        productId: item.id,
        name: item.name,
        unitPrice: item.precio,
        quantity: 1,
        imagenUrl: item.imagenUrl,
        stockAtLocation: item.stockAtLocation,
      })
    );
  };

  const handleQty = (newQty: number) =>
    dispatch(updateQuantity({ productId: item.id, quantity: newQty }));

  return (
    <div className={`product-card ${soldOut ? "product-card--soldout" : ""}`}>
      <div className="product-card__img-wrap">
        {item.imagenUrl ? (
          <img
            src={item.imagenUrl}
            alt={item.name}
            className="product-card__img"
            loading="lazy"
          />
        ) : (
          <div className="product-card__img-placeholder">
            <Icon name="inventory_2" />
          </div>
        )}
        {soldOut && (
          <div className="product-card__soldout-overlay">
            <span className="product-card__soldout-badge">Agotado</span>
          </div>
        )}
      </div>

      <div className="product-card__body">
        {item.categoryName && (
          <span
            className="product-card__category"
            style={{
              background: `rgba(${hexToRgb(catColor)}, 0.1)`,
              color: catColor,
              border: `1px solid rgba(${hexToRgb(catColor)}, 0.2)`,
            }}
          >
            {item.categoryName}
          </span>
        )}

        <div className="product-card__name">{item.name}</div>

        {item.description && (
          <p className="product-card__desc">{item.description}</p>
        )}

        <div className="product-card__footer">
          <span className="product-card__price">{formatPrice(item.precio)}</span>
          {soldOut ? (
            <span className="product-card__stock-badge product-card__stock-badge--soldout">
              <Icon name="block" />
              Agotado
            </span>
          ) : (
            <span className="product-card__stock-badge product-card__stock-badge--available">
              <Icon name="check_circle" />
              Disponible
            </span>
          )}
        </div>

        {/* Cart controls */}
        {!soldOut && (
          cartItem ? (
            <div className="product-card__qty-ctrl">
              <button
                type="button"
                className="product-card__qty-btn"
                onClick={() => handleQty(cartItem.quantity - 1)}
              >
                −
              </button>
              <span className="product-card__qty-display">{cartItem.quantity}</span>
              <button
                type="button"
                className="product-card__qty-btn"
                disabled={cartItem.quantity >= item.stockAtLocation}
                onClick={() => handleQty(cartItem.quantity + 1)}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="product-card__add-btn"
              onClick={handleAdd}
            >
              <Icon name="add_shopping_cart" />
              Agregar
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function CatalogProductsPage() {
  const params = useParams();
  const locationId = Number(params.locationId);
  const dispatch = useAppDispatch();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useGetPublicCatalogQuery(locationId);

  const { data: locations } = useGetPublicLocationsQuery();
  const currentLocation = locations?.find((l) => l.id === locationId);

  // Sync cart location when location data loads
  useEffect(() => {
    if (currentLocation) {
      dispatch(
        setLocation({
          id: currentLocation.id,
          name: currentLocation.name,
          whatsAppContact: currentLocation.whatsAppContact ?? null,
        })
      );
    }
  }, [currentLocation?.id, dispatch]);

  const categories = useMemo(() => {
    if (!products) return [];
    const map = new Map<string, { name: string; color: string }>();
    for (const p of products) {
      if (p.categoryName && !map.has(p.categoryName)) {
        map.set(p.categoryName, {
          name: p.categoryName,
          color: p.categoryColor ?? "#6366f1",
        });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (selectedCategory)
      result = result.filter((p) => p.categoryName === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, search]);

  return (
    <>
      <div className="catalog-header">
        <div className="catalog-header__left">
          <div className="catalog-header__location-icon">
            <Icon name="store" />
          </div>
          <div>
            <h1 className="catalog-header__title">
              {currentLocation?.name ?? "Catálogo"}
            </h1>
            {currentLocation?.organizationName && (
              <p className="catalog-header__org">
                {currentLocation.organizationName}
              </p>
            )}
          </div>
        </div>

        <Link href="/catalog" className="catalog-topbar__btn">
          <Icon name="arrow_back" />
          <span>Cambiar local</span>
        </Link>
      </div>

      {/* Search */}
      <div className="catalog-search">
        <div className="catalog-search__icon">
          <Icon name="search" />
        </div>
        <input
          type="text"
          className="catalog-search__input"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category chips */}
      {!isLoading && !isError && categories.length > 0 && (
        <div className="catalog-categories">
          <button
            type="button"
            className={`catalog-chip ${!selectedCategory ? "catalog-chip--active" : ""}`}
            style={
              !selectedCategory
                ? { background: "var(--gradient-primary)", borderColor: "transparent" }
                : undefined
            }
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={`catalog-chip ${selectedCategory === cat.name ? "catalog-chip--active" : ""}`}
              style={
                selectedCategory === cat.name
                  ? { background: cat.color, borderColor: "transparent" }
                  : undefined
              }
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.name ? null : cat.name
                )
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {isLoading && <ProductSkeletons />}

      {isError && (
        <div className="catalog-error">
          <div className="catalog-error__icon">
            <Icon name="wifi_off" />
          </div>
          <p className="catalog-error__text">
            No pudimos cargar el catálogo. Verifica tu conexión e intenta de nuevo.
          </p>
          <button type="button" className="catalog-error__retry" onClick={refetch}>
            <Icon name="refresh" />
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && products && products.length === 0 && (
        <div className="catalog-empty">
          <div className="catalog-empty__icon">
            <Icon name="inventory_2" />
          </div>
          <p className="catalog-empty__text">
            Este local no tiene productos disponibles por el momento
          </p>
        </div>
      )}

      {!isLoading && !isError && products && products.length > 0 && filtered.length === 0 && (
        <div className="catalog-empty">
          <div className="catalog-empty__icon">
            <Icon name="search_off" />
          </div>
          <p className="catalog-empty__text">No se encontraron productos</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="catalog-grid">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
