export type Coordinates = {
  lat: number;
  lon: number;
};

export type UserPosition = Coordinates & {
  label: string;
};

export type BarberShop = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distanceKm: number;
  rating: number | null;
  openingHours: string | null;
  openStatus: "open" | "closed" | "unknown";
};
