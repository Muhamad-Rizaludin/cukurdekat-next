"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { DEFAULT_CENTER } from "../constants";
import type { BarberShop, UserPosition } from "../types";
import { formatTravelEstimate } from "../utils/travel-estimate";

const markerIcon = L.icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type MapViewportControllerProps = {
  userPosition: UserPosition | null;
  shops: BarberShop[];
};

function MapViewportController({ userPosition, shops }: MapViewportControllerProps) {
  const map = useMap();

  const bounds = useMemo(() => {
    const latLngs: L.LatLngTuple[] = [];
    if (userPosition) {
      latLngs.push([userPosition.lat, userPosition.lon]);
    }
    shops.forEach((shop) => latLngs.push([shop.lat, shop.lon]));
    return latLngs;
  }, [userPosition, shops]);

  useEffect(() => {
    if (bounds.length === 0) {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lon], 13);
      return;
    }

    if (bounds.length === 1) {
      const [single] = bounds;
      map.setView(single, 15);
      return;
    }

    map.fitBounds(bounds, { padding: [36, 36] });
  }, [bounds, map]);

  return null;
}

type BarberMapProps = {
  userPosition: UserPosition | null;
  shops: BarberShop[];
};

export function BarberMap({ userPosition, shops }: BarberMapProps) {
  return (
    <MapContainer
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lon]}
      zoom={13}
      scrollWheelZoom
      className="map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapViewportController userPosition={userPosition} shops={shops} />

      {userPosition ? (
        <CircleMarker
          center={[userPosition.lat, userPosition.lon]}
          radius={10}
          pathOptions={{
            color: "#004f5d",
            fillColor: "#0f7c90",
            fillOpacity: 0.95,
            weight: 2,
          }}
        >
          <Popup>{userPosition.label}</Popup>
        </CircleMarker>
      ) : null}

      {shops.map((shop) => (
        <Marker key={shop.id} position={[shop.lat, shop.lon]} icon={markerIcon}>
          <Popup>
            <strong>{shop.name}</strong>
            <br />
            {shop.distanceKm.toFixed(2)} km
            <br />
            Estimasi: {formatTravelEstimate(shop.distanceKm)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
