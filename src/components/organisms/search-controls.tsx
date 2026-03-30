"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";

type SearchControlsProps = {
  manualQuery: string;
  radiusKm: number;
  isLoading: boolean;
  onManualQueryChange: (value: string) => void;
  onManualSubmit: (value: string) => void | Promise<void>;
  onUseCurrentLocation: () => void;
  onRadiusChange: (radiusKm: number) => void;
};

export function SearchControls({
  manualQuery,
  radiusKm,
  isLoading,
  onManualQueryChange,
  onManualSubmit,
  onUseCurrentLocation,
  onRadiusChange,
}: SearchControlsProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = manualQuery.trim();
    if (!query) {
      return;
    }
    await onManualSubmit(query);
  };

  return (
    <>
      <header className="workspace-head">
        <div className="workspace-title">
          <p className="workspace-kicker">BarberKilat</p>
          <h2>Cari Tukang Cukur Terdekat</h2>
        </div>
        <div className="action-row">
          <Button
            variant="primary"
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLoading}
          >
            {isLoading ? "Sedang Mencari..." : "Gunakan Lokasi Saya"}
          </Button>
          <label className="radius-wrap" htmlFor="radius">
            Radius
            <Select
              id="radius"
              value={radiusKm}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
              aria-label="Pilih radius pencarian"
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
            </Select>
          </label>
        </div>
      </header>

      <form className="manual-form" onSubmit={handleSubmit}>
        <label htmlFor="manual-location">Atau masukkan lokasi secara manual</label>
        <div className="manual-row">
          <Input
            id="manual-location"
            value={manualQuery}
            onChange={(event) => onManualQueryChange(event.target.value)}
            placeholder="Contoh: Tebet, Jakarta Selatan, Indonesia"
            autoComplete="off"
            required
          />
          <Button variant="secondary" type="submit" disabled={isLoading}>
            Cari dari Lokasi Ini
          </Button>
        </div>
      </form>
    </>
  );
}
