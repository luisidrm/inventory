"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useGetPublicLocationsQuery } from "./_service/catalogApi";
import type { PublicLocation } from "@/lib/dashboard-types";
import { useFavorites } from "@/lib/useFavorites";
import { FavoriteButton } from "@/components/FavoriteButton";
import AllProductsView from "./AllProductsView";

interface MunicipalityGroup {
  municipality: string;
  locations: PublicLocation[];
}

interface ProvinceGroup {
  province: string;
  municipalities: MunicipalityGroup[];
  totalLocations: number;
}

function groupByProvinceAndMunicipality(locations: PublicLocation[]): ProvinceGroup[] {
  const provinceMap = new Map<string, Map<string, PublicLocation[]>>();

  for (const loc of locations) {
    const prov = loc.province?.trim() || "Sin provincia";
    const muni = loc.municipality?.trim() || "Sin municipio";

    if (!provinceMap.has(prov)) provinceMap.set(prov, new Map());
    const muniMap = provinceMap.get(prov)!;
    if (!muniMap.has(muni)) muniMap.set(muni, []);
    muniMap.get(muni)!.push(loc);
  }

  const groups: ProvinceGroup[] = [];
  for (const [province, muniMap] of provinceMap) {
    const municipalities: MunicipalityGroup[] = [];
    let totalLocations = 0;
    for (const [municipality, locs] of muniMap) {
      municipalities.push({ municipality, locations: locs });
      totalLocations += locs.length;
    }
    municipalities.sort((a, b) => a.municipality.localeCompare(b.municipality));
    groups.push({ province, municipalities, totalLocations });
  }
  groups.sort((a, b) => a.province.localeCompare(b.province));
  return groups;
}

function LocSkeletons() {
  return (
    <div className="loc2-skel-wrap">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="loc2-skel-card" />
      ))}
    </div>
  );
}

function LocationCard({
  loc,
  isFavorite,
  onToggle,
}: {
  loc: PublicLocation;
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const hasHours = !!loc.businessHours;
  const showBadge = hasHours && loc.isOpenNow != null;
  const isOpen = loc.isOpenNow === true;

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(e);
  };

  return (
    <Link href={`/catalog/${loc.id}`} className="loc2-card">
      <div className="loc2-card__img">
        {loc.photoUrl ? (
          <img src={loc.photoUrl} alt={loc.name} />
        ) : (
          <div className="loc2-card__placeholder">
            <Icon name="storefront" />
          </div>
        )}
        <div className="loc2-card__overlay">
          <div className="loc2-card__overlay-top">
            <FavoriteButton
              active={isFavorite}
              onToggle={handleFavoriteClick}
              ariaAdd="Agregar tienda a favoritos"
              ariaRemove="Quitar tienda de favoritos"
            />
            {showBadge && (
              <div className={`loc2-badge ${isOpen ? "loc2-badge--open" : "loc2-badge--closed"}`}>
                {isOpen && <span className="loc2-badge__dot" />}
                <span>{isOpen ? "Abierto" : "Cerrado"}</span>
              </div>
            )}
          </div>
          <div className="loc2-card__overlay-bottom">
            <h3 className="loc2-card__name">{loc.name}</h3>
            <span className="loc2-card__org">{loc.organizationName}</span>
          </div>
        </div>
      </div>
      <div className="loc2-card__body">
        {loc.description && (
          <p className="loc2-card__desc">{loc.description}</p>
        )}
      </div>
      <div className="loc2-card__footer">
        <span className="loc2-card__cta">Ver productos</span>
        <Icon name="arrow_forward" />
      </div>
    </Link>
  );
}

export default function CatalogLocationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "tiendas";

  const { data: locations, isLoading, isError, refetch } = useGetPublicLocationsQuery();
  const [search, setSearch] = useState("");
  const {
    favoriteLocations,
    toggleFavoriteLocation,
    isFavoriteLocation,
  } = useFavorites();

  const filtered = useMemo(() => {
    if (!locations) return [];
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.organizationName?.toLowerCase().includes(q) ||
        l.province?.toLowerCase().includes(q) ||
        l.municipality?.toLowerCase().includes(q) ||
        l.street?.toLowerCase().includes(q)
    );
  }, [locations, search]);

  const favoriteLocationEntities = useMemo(() => {
    if (!locations || favoriteLocations.length === 0) return [];
    const ids = new Set(favoriteLocations);
    return locations.filter((l) => ids.has(String(l.id)));
  }, [locations, favoriteLocations]);

  const groups = useMemo(() => groupByProvinceAndMunicipality(filtered), [filtered]);

  const setTab = (next: "tiendas" | "productos") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "tiendas") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : "/catalog");
  };

  const showTiendas = tab === "tiendas";

  return (
    <div className="loc2-page">
      <div className="loc2-tabs-bar">
        <div className="catalog-tabs">
          <button
            type="button"
            className={`catalog-tab${showTiendas ? " catalog-tab--active" : ""}`}
            onClick={() => setTab("tiendas")}
          >
            Tiendas
          </button>
          <button
            type="button"
            className={`catalog-tab${!showTiendas ? " catalog-tab--active" : ""}`}
            onClick={() => setTab("productos")}
          >
            Productos
          </button>
        </div>

        {showTiendas &&
          !isLoading &&
          !isError &&
          locations &&
          locations.length > 0 && (
            <div className="loc2-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Buscar por nombre, provincia, municipio…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="loc2-search__input"
              />
              {search && (
                <button
                  type="button"
                  className="loc2-search__clear"
                  onClick={() => setSearch("")}
                >
                  <Icon name="close" />
                </button>
              )}
            </div>
          )}
      </div>

      {showTiendas ? (
        <>
          {isLoading && <LocSkeletons />}

          {isError && (
            <div className="store-empty">
              <div className="store-empty__icon">
                <Icon name="wifi_off" />
              </div>
              <p className="store-empty__text">
                No pudimos cargar los locales.
              </p>
              <button
                type="button"
                className="store-empty__btn"
                onClick={refetch}
              >
                <Icon name="refresh" /> Reintentar
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            locations &&
            locations.length === 0 && (
              <div className="store-empty">
                <div className="store-empty__icon">
                  <Icon name="store" />
                </div>
                <p className="store-empty__text">
                  No hay locales disponibles
                </p>
              </div>
            )}

          {!isLoading &&
            !isError &&
            filtered.length === 0 &&
            locations &&
            locations.length > 0 && (
              <div className="store-empty">
                <div className="store-empty__icon">
                  <Icon name="search_off" />
                </div>
                <p className="store-empty__text">
                  No se encontraron ubicaciones para &ldquo;{search}&rdquo;
                </p>
              </div>
            )}

          {!isLoading && !isError && groups.length > 0 && (
            <div className="loc2-content">
              {favoriteLocationEntities.length > 0 && (
                <section className="loc2-province">
                  <div className="loc2-province__header">
                    <Icon name="favorite" />
                    <span className="loc2-province__name">
                      Tus tiendas favoritas
                    </span>
                    <span className="loc2-province__badge">
                      {favoriteLocationEntities.length}
                    </span>
                  </div>
                  <div className="loc2-province__body">
                    <div className="loc2-muni__grid">
                      {favoriteLocationEntities.map((loc) => (
                        <LocationCard
                          key={loc.id}
                          loc={loc}
                          isFavorite={true}
                          onToggle={() =>
                            toggleFavoriteLocation(String(loc.id))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}
              {groups.map((pGroup) => (
                <section key={pGroup.province} className="loc2-province">
                  <div className="loc2-province__header">
                    <Icon name="map" />
                    <span className="loc2-province__name">
                      {pGroup.province}
                    </span>
                    <span className="loc2-province__badge">
                      {pGroup.totalLocations}
                    </span>
                  </div>

                  <div className="loc2-province__body">
                    {pGroup.municipalities.map((mGroup) => (
                      <div
                        key={mGroup.municipality}
                        className="loc2-muni"
                      >
                        <div className="loc2-muni__header">
                          <Icon name="location_city" />
                          <span className="loc2-muni__name">
                            {mGroup.municipality}
                          </span>
                          <span className="loc2-muni__count">
                            {mGroup.locations.length}{" "}
                            {mGroup.locations.length === 1
                              ? "tienda"
                              : "tiendas"}
                          </span>
                        </div>
                        <div className="loc2-muni__grid">
                          {mGroup.locations.map((loc) => (
                            <LocationCard
                              key={loc.id}
                              loc={loc}
                              isFavorite={isFavoriteLocation(
                                String(loc.id),
                              )}
                              onToggle={() =>
                                toggleFavoriteLocation(String(loc.id))
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      ) : (
        <AllProductsView />
      )}
    </div>
  );
}
