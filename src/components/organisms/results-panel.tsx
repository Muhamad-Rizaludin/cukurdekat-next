"use client";

import { useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import type { BarberShop } from "@/features/barber-finder/types";
import { formatTravelEstimate } from "@/features/barber-finder/utils/travel-estimate";

type ResultsPanelProps = {
  shops: BarberShop[];
};

export function ResultsPanel({ shops }: ResultsPanelProps) {
  const PAGE_SIZE = 8;
  const nearest = shops[0] ?? null;
  const listShops = nearest ? shops.slice(1) : shops;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const paneRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [shops]);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) {
      return;
    }

    if (visibleCount < listShops.length && pane.scrollHeight <= pane.clientHeight + 2) {
      setVisibleCount((current) => Math.min(current + PAGE_SIZE, listShops.length));
    }
  }, [listShops.length, visibleCount]);

  const displayedShops = listShops.slice(0, visibleCount);
  const hasMore = visibleCount < listShops.length;

  const handleScroll = (event: UIEvent<HTMLElement>) => {
    if (!hasMore) {
      return;
    }

    const target = event.currentTarget;
    const reachedBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 120;

    if (reachedBottom) {
      setVisibleCount((current) => Math.min(current + PAGE_SIZE, listShops.length));
    }
  };

  return (
    <aside
      ref={paneRef}
      className="results-pane"
      aria-label="Daftar barber shop terdekat"
      onScroll={handleScroll}
    >
      <div className="results-head">
        <h3>Rekomendasi Terdekat</h3>
        <span className="results-count">{shops.length} tempat</span>
      </div>
      <p className="hint">Diurutkan otomatis dari jarak paling dekat.</p>

      {shops.length === 0 ? (
        <div className="empty">
          <p>Belum ada hasil. Mulai dengan langkah berikut:</p>
          <p>1) Klik &quot;Gunakan Lokasi Saya&quot; atau isi lokasi manual.</p>
          <p>2) Sesuaikan radius jika area belum cukup luas.</p>
        </div>
      ) : (
        <>
          {nearest ? (
            <article className="nearest-card" aria-label="Rekomendasi terdekat">
              <p className="nearest-label">Pilihan utama</p>
              <h4>{nearest.name}</h4>
              <p className="nearest-distance">{nearest.distanceKm.toFixed(2)} km</p>
              <p className="eta-text">
                Estimasi waktu tempuh: {formatTravelEstimate(nearest.distanceKm)}
              </p>
              <a
                className="go-link"
                href={`https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lon}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka navigasi tercepat
              </a>
            </article>
          ) : null}

          <ul className="results-list">
            {displayedShops.map((shop, index) => (
              <li className="result-item" key={shop.id}>
                <div className="result-top">
                  <span className="place">
                    {nearest ? index + 2 : index + 1}. {shop.name}
                  </span>
                  <span className="distance">{shop.distanceKm.toFixed(2)} km</span>
                </div>
                <p className="eta-text">
                  Estimasi waktu tempuh: {formatTravelEstimate(shop.distanceKm)}
                </p>
                <a
                  className="go-link"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buka rute di Google Maps
                </a>
              </li>
            ))}
          </ul>

          {hasMore ? (
            <p className="scroll-hint">Scroll ke bawah untuk memuat hasil berikutnya...</p>
          ) : null}
        </>
      )}
    </aside>
  );
}
