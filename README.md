# BarberKilat

Web app Next.js untuk mencari barber shop atau tukang cukur terdekat berdasarkan lokasi terkini pengguna, dengan UI yang lebih jelas dan mudah dipahami.

## Fitur

- Ambil lokasi realtime dari browser (Geolocation API).
- Fallback pencarian manual berdasarkan nama lokasi/kecamatan/kota.
- Cari tempat cukur terdekat dari OpenStreetMap (Overpass API).
- Urutkan hasil berdasarkan jarak paling dekat.
- Tampilkan estimasi waktu tempuh ke tiap lokasi.
- Daftar hasil dengan infinite scroll.
- Tampilkan marker di peta interaktif (Leaflet).
- Tombol langsung buka rute ke Google Maps.

## Stack

- Next.js (App Router)
- TypeScript
- React Leaflet + OpenStreetMap (Overpass + Nominatim)
- Arsitektur: feature-based + atomic design (atom/organism)

## Menjalankan

```powershell
cd D:\pekerjaan\jalu_punya\idp\explore_product\cukurdekat-next
npm install
npm run dev
```

Lalu buka:

`http://localhost:3000`

## Struktur Folder Inti

```text
src/
  app/
    layout.tsx
    page.tsx
  components/
    atoms/
      button.tsx
      input.tsx
      select.tsx
    organisms/
      search-controls.tsx
      results-panel.tsx
      map-panel.tsx
  features/
    barber-finder/
      components/
        barber-finder-feature.tsx
        barber-map.tsx
      services/
        osm.ts
      utils/
        distance.ts
      constants.ts
      types.ts
```

## Catatan

- Browser akan meminta izin lokasi saat klik `Gunakan Lokasi Saat Ini`.
- Data lokasi barber diambil dari OpenStreetMap, jadi kelengkapan bisa berbeda per wilayah.
- Overpass dan Nominatim adalah API publik; jika sedang padat, request bisa lebih lambat.
