"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useGetPublicLocationsQuery } from "./_service/catalogApi";

function LocationSkeletons() {
  return (
    <div className="catalog-locations__grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="catalog-skeleton--location" />
      ))}
    </div>
  );
}

export default function CatalogLocationsPage() {
  const { data: locations, isLoading, isError, refetch } = useGetPublicLocationsQuery();

  return (
    <>
      <div className="catalog-locations__header">
        <div className="catalog-locations__icon">
          <Icon name="storefront" />
        </div>
        <h1 className="catalog-locations__title">¿En qué local estás?</h1>
        <p className="catalog-locations__subtitle">
          Selecciona una ubicación para ver los productos disponibles
        </p>
      </div>

      {isLoading && <LocationSkeletons />}

      {isError && (
        <div className="catalog-error">
          <div className="catalog-error__icon">
            <Icon name="wifi_off" />
          </div>
          <p className="catalog-error__text">
            No pudimos cargar los locales. Verifica tu conexión e intenta de nuevo.
          </p>
          <button type="button" className="catalog-error__retry" onClick={refetch}>
            <Icon name="refresh" />
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && locations && locations.length === 0 && (
        <div className="catalog-empty">
          <div className="catalog-empty__icon">
            <Icon name="store" />
          </div>
          <p className="catalog-empty__text">
            No hay locales disponibles por el momento
          </p>
        </div>
      )}

      {!isLoading && !isError && locations && locations.length > 0 && (
        <div className="catalog-locations__grid">
          {locations.map((loc) => (
            <Link
              key={loc.id}
              href={`/catalog/${loc.id}`}
              className="location-card"
            >
              <div className="location-card__icon-wrap">
                <Icon name="store" />
              </div>
              <div className="location-card__info">
                <div className="location-card__name">{loc.name}</div>
                <div className="location-card__org">{loc.organizationName}</div>
                {loc.description && (
                  <p className="location-card__desc">{loc.description}</p>
                )}
              </div>
              <div className="location-card__arrow">
                <Icon name="arrow_forward_ios" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
