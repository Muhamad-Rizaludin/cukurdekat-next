"use client";

import { useCallback, useState } from "react";
import { InfoPopup } from "@/components/organisms/info-popup";
import { MapPanel } from "@/components/organisms/map-panel";
import { ResultsPanel } from "@/components/organisms/results-panel";
import { SearchControls } from "@/components/organisms/search-controls";
import {
  geocodeLocation,
  isOverpassTemporaryError,
  searchBarberShops,
} from "../services/osm";
import type { BarberShop, UserPosition } from "../types";

type StatusState = {
  message: string;
  isError: boolean;
};

type PopupState = {
  open: boolean;
  title: string;
  message: string;
};

export function BarberFinderFeature() {
  const [manualQuery, setManualQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [shops, setShops] = useState<BarberShop[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [status, setStatus] = useState<StatusState>({
    message: 'Klik "Gunakan Lokasi Saya" untuk mulai.',
    isError: false,
  });
  const [popup, setPopup] = useState<PopupState>({
    open: false,
    title: "",
    message: "",
  });

  const showPopup = useCallback((title: string, message: string) => {
    setPopup({ open: true, title, message });
  }, []);

  const closePopup = useCallback(() => {
    setPopup((current) => ({ ...current, open: false }));
  }, []);

  const runSearch = useCallback(
    async (position: UserPosition, selectedRadius: number) => {
      setStatus({
        message: `Mencari barber terdekat dalam radius ${selectedRadius} km dari ${position.label}...`,
        isError: false,
      });

      const results = await searchBarberShops({
        lat: position.lat,
        lon: position.lon,
        radiusKm: selectedRadius,
      });

      setUserPosition(position);
      setShops(results);

      if (results.length === 0) {
        setStatus({
          message:
            "Belum ada hasil dalam radius saat ini. Coba naikkan radius pencarian.",
          isError: false,
        });
        return;
      }

      setStatus({
        message: `BarberKilat menemukan ${results.length} tempat. Terdekat: ${
          results[0].name
        } (${results[0].distanceKm.toFixed(2)} km).`,
        isError: false,
      });
    },
    []
  );

  const withLoading = useCallback(async (task: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await task();
    } catch (error) {
      console.error(error);
      if (isOverpassTemporaryError(error)) {
        const message =
          "Server peta sedang sibuk atau timeout. Coba ulang 5-10 detik lagi, atau kecilkan radius ke 2-5 km.";
        setStatus({
          message,
          isError: true,
        });
        showPopup("Pencarian Sedang Padat", message);
      } else {
        const message =
          "Terjadi kendala saat mengambil data. Silakan coba lagi beberapa saat.";
        setStatus({
          message,
          isError: true,
        });
        showPopup("Terjadi Kendala", message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [showPopup]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const message = "Browser ini belum mendukung fitur geolocation.";
      setStatus({
        message,
        isError: true,
      });
      showPopup("Geolocation Tidak Didukung", message);
      return;
    }

    setStatus({ message: "Mengambil lokasi terkini Anda...", isError: false });
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos: UserPosition = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: "Lokasi Anda",
        };

        void withLoading(async () => {
          await runSearch(userPos, radiusKm);
        });
      },
      () => {
        const message =
          "Izin lokasi ditolak atau gagal didapatkan. Anda bisa gunakan pencarian manual.";
        setIsLoading(false);
        setStatus({
          message,
          isError: true,
        });
        showPopup("Lokasi Tidak Tersedia", message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 120000,
      }
    );
  }, [radiusKm, runSearch, showPopup, withLoading]);

  const handleManualSubmit = useCallback(
    async (query: string) => {
      await withLoading(async () => {
        setStatus({
          message: `Mencari koordinat untuk "${query}"...`,
          isError: false,
        });

        const location = await geocodeLocation(query);
        if (!location) {
          const message = `Lokasi "${query}" tidak ditemukan. Coba nama area yang lebih spesifik.`;
          setStatus({
            message,
            isError: true,
          });
          showPopup("Lokasi Tidak Ditemukan", message);
          return;
        }

        await runSearch(location, radiusKm);
      });
    },
    [radiusKm, runSearch, showPopup, withLoading]
  );

  const handleRadiusChange = useCallback(
    (nextRadius: number) => {
      setRadiusKm(nextRadius);
      if (!userPosition) {
        return;
      }

      void withLoading(async () => {
        await runSearch(userPosition, nextRadius);
      });
    },
    [runSearch, userPosition, withLoading]
  );

  const nearbyCount = shops.length;

  return (
    <main className="app-shell">
      <header className="brand-bar" aria-label="Identitas aplikasi">
        <p className="brand-logo">BarberKilat</p>
      </header>

      <section className="hero">
        <p className="eyebrow">Barber Finder</p>
        <h1>Temukan barber terdekat, berangkat lebih cepat.</h1>
      </section>

      <section className="workspace" aria-label="Pencarian barber shop terdekat">
        <div className="workflow-strip" aria-label="Cara pakai cepat">
          <div className="workflow-item">
            <span className="workflow-step">1</span>
            <p>Aktifkan lokasi otomatis atau ketik area manual.</p>
          </div>
          <div className="workflow-item">
            <span className="workflow-step">2</span>
            <p>Pilih radius agar cakupan hasil sesuai kebutuhan.</p>
          </div>
          <div className="workflow-item">
            <span className="workflow-step">3</span>
            <p>Pilih hasil terbaik dan buka navigasi langsung.</p>
          </div>
        </div>

        <SearchControls
          manualQuery={manualQuery}
          radiusKm={radiusKm}
          isLoading={isLoading}
          onManualQueryChange={setManualQuery}
          onManualSubmit={handleManualSubmit}
          onUseCurrentLocation={handleUseCurrentLocation}
          onRadiusChange={handleRadiusChange}
        />

        <div className={`status-card ${status.isError ? "is-error" : ""}`}>
          <p className="status-label">Status pencarian</p>
          <p className={`status ${status.isError ? "is-error" : ""}`}>
            {status.message}
          </p>
          <div className="status-meta-grid">
            <p className="status-meta">
              Lokasi aktif: {userPosition ? userPosition.label : "belum dipilih"}
            </p>
            <p className="status-meta">Jumlah hasil: {nearbyCount}</p>
            <p className="status-meta">Radius aktif: {radiusKm} km</p>
          </div>
        </div>

        <div className="content-grid">
          <MapPanel userPosition={userPosition} shops={shops} />
          <ResultsPanel shops={shops} />
        </div>
      </section>

      <InfoPopup
        open={popup.open}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />
    </main>
  );
}
