"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useGetPublicLocationsQuery } from "./_service/catalogApi";
import type { PublicLocation } from "@/lib/dashboard-types";

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

function LocationCard({ loc }: { loc: PublicLocation }) {
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
      </div>
      <div className="loc2-card__body">
        <h3 className="loc2-card__name">{loc.name}</h3>
        <span className="loc2-card__org">{loc.organizationName}</span>
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
  const { data: locations, isLoading, isError, refetch } = useGetPublicLocationsQuery();
  const [search, setSearch] = useState("");

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

  const groups = useMemo(() => groupByProvinceAndMunicipality(filtered), [filtered]);

  return (
    <div className="loc2-page">
      <div className="loc2-hero">
        <div className="loc2-hero__icon">
          <Icon name="storefront" />
        </div>
        <h1 className="loc2-hero__title">Elige tu tienda</h1>
        <p className="loc2-hero__subtitle">
          Selecciona una ubicación para explorar los productos disponibles
        </p>

        {!isLoading && !isError && locations && locations.length > 0 && (
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

      {isLoading && <LocSkeletons />}

      {isError && (
        <div className="store-empty">
          <div className="store-empty__icon"><Icon name="wifi_off" /></div>
          <p className="store-empty__text">No pudimos cargar los locales.</p>
          <button type="button" className="store-empty__btn" onClick={refetch}>
            <Icon name="refresh" /> Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && locations && locations.length === 0 && (
        <div className="store-empty">
          <div className="store-empty__icon"><Icon name="store" /></div>
          <p className="store-empty__text">No hay locales disponibles</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && locations && locations.length > 0 && (
        <div className="store-empty">
          <div className="store-empty__icon"><Icon name="search_off" /></div>
          <p className="store-empty__text">
            No se encontraron ubicaciones para &ldquo;{search}&rdquo;
          </p>
        </div>
      )}

      {!isLoading && !isError && groups.length > 0 && (
        <div className="loc2-content">
          {groups.map((pGroup) => (
            <section key={pGroup.province} className="loc2-province">
              <div className="loc2-province__header">
                <Icon name="map" />
                <span className="loc2-province__name">{pGroup.province}</span>
                <span className="loc2-province__badge">{pGroup.totalLocations}</span>
              </div>

              <div className="loc2-province__body">
                {pGroup.municipalities.map((mGroup) => (
                  <div key={mGroup.municipality} className="loc2-muni">
                    <div className="loc2-muni__header">
                      <Icon name="location_city" />
                      <span className="loc2-muni__name">{mGroup.municipality}</span>
                      <span className="loc2-muni__count">
                        {mGroup.locations.length} {mGroup.locations.length === 1 ? "tienda" : "tiendas"}
                      </span>
                    </div>
                    <div className="loc2-muni__grid">
                      {mGroup.locations.map((loc) => (
                        <LocationCard key={loc.id} loc={loc} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
