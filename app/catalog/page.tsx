"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useGetPublicLocationsQuery } from "./_service/catalogApi";

function LocSkeletons() {
  return (
    <div className="loc-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skel-loc" />
      ))}
    </div>
  );
}

export default function CatalogLocationsPage() {
  const { data: locations, isLoading, isError, refetch } = useGetPublicLocationsQuery();

  return (
    <div className="loc-page">
      <div className="loc-page__heading">
        <div className="loc-page__icon">
          <Icon name="storefront" />
        </div>
        <h1 className="loc-page__title">Elige tu tienda</h1>
        <p className="loc-page__desc">
          Selecciona una ubicación para explorar los productos
        </p>
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

      {!isLoading && !isError && locations && locations.length > 0 && (
        <div className="loc-grid">
          {locations.map((loc) => (
            <Link key={loc.id} href={`/catalog/${loc.id}`} className="loc-card">
              <div className="loc-card__avatar">
                <Icon name="store" />
              </div>
              <div className="loc-card__body">
                <div className="loc-card__name">{loc.name}</div>
                <div className="loc-card__org">{loc.organizationName}</div>
                {loc.description && <p className="loc-card__desc">{loc.description}</p>}
              </div>
              <div className="loc-card__go">
                <Icon name="chevron_right" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
