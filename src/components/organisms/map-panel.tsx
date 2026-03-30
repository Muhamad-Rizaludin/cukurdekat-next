"use client";

import dynamic from "next/dynamic";
import type { BarberShop, UserPosition } from "@/features/barber-finder/types";

const BarberMap = dynamic(
  async () =>
    import("@/features/barber-finder/components/barber-map").then(
      (module) => module.BarberMap
    ),
  {
    ssr: false,
    loading: () => <div className="map-loading">Menyiapkan peta...</div>,
  }
);

type MapPanelProps = {
  userPosition: UserPosition | null;
  shops: BarberShop[];
};

export function MapPanel({ userPosition, shops }: MapPanelProps) {
  return (
    <div className="map-shell">
      <div className="panel-head">
        <h3>Peta Lokasi</h3>
        <p>
          Titik biru adalah lokasi Anda, pin menunjukkan barber sekitar ({shops.length}).
        </p>
      </div>
      <BarberMap userPosition={userPosition} shops={shops} />
    </div>
  );
}
