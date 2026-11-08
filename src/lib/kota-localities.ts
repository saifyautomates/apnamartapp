export interface KotaLocality {
  name: string;
  pincode: string;
  zone: string;
  lat: number;
  lng: number;
  eta: string;
  isStoreHub?: boolean;
}

export const KOTA_LOCALITIES: KotaLocality[] = [
  {
    name: "80 Feet Road (Central Mart Hub)",
    pincode: "324005",
    zone: "Zone B — Central Store",
    lat: 25.1485,
    lng: 75.8458,
    eta: "8-10 Mins",
    isStoreHub: true,
  },
  {
    name: "Talwandi (Sector A & B)",
    pincode: "324005",
    zone: "Zone B — South Kota",
    lat: 25.1524,
    lng: 75.8315,
    eta: "10-12 Mins",
  },
  {
    name: "Vigyan Nagar",
    pincode: "324005",
    zone: "Zone B — South Kota",
    lat: 25.142,
    lng: 75.84,
    eta: "10-12 Mins",
  },
  {
    name: "Mahaveer Nagar (Ext 1, 2, 3)",
    pincode: "324005",
    zone: "Zone B — South Kota",
    lat: 25.145,
    lng: 75.828,
    eta: "10-14 Mins",
  },
  {
    name: "Jawahar Nagar & Coaching Hub",
    pincode: "324005",
    zone: "Zone B — South Kota",
    lat: 25.15,
    lng: 75.848,
    eta: "10-12 Mins",
  },
  {
    name: "Indra Vihar (Commerce College Rd)",
    pincode: "324005",
    zone: "Zone B — South Kota",
    lat: 25.154,
    lng: 75.839,
    eta: "10-12 Mins",
  },
  {
    name: "Rajeev Gandhi Nagar",
    pincode: "324005",
    zone: "Zone B — South Kota",
    lat: 25.151,
    lng: 75.855,
    eta: "12-14 Mins",
  },
  {
    name: "Dadabari & Shrinath Puram",
    pincode: "324009",
    zone: "Zone B — South Kota",
    lat: 25.156,
    lng: 75.817,
    eta: "12-15 Mins",
  },
  {
    name: "Keshavpura",
    pincode: "324009",
    zone: "Zone B — South Kota",
    lat: 25.138,
    lng: 75.825,
    eta: "12-15 Mins",
  },
  {
    name: "Gumanpura Shopping Market",
    pincode: "324007",
    zone: "Zone A — Central Kota",
    lat: 25.176,
    lng: 75.842,
    eta: "10-14 Mins",
  },
  {
    name: "Chawani & Aerodrome Circle",
    pincode: "324007",
    zone: "Zone A — Central Kota",
    lat: 25.168,
    lng: 75.846,
    eta: "10-14 Mins",
  },
  {
    name: "Nayapura & Collectorate",
    pincode: "324001",
    zone: "Zone A — Central Kota",
    lat: 25.1873,
    lng: 75.845,
    eta: "12-15 Mins",
  },
  {
    name: "Rampura Bazaar",
    pincode: "324006",
    zone: "Zone A — Central Kota",
    lat: 25.195,
    lng: 75.847,
    eta: "14-16 Mins",
  },
  {
    name: "Kunhari (Landmark City & Allen)",
    pincode: "324008",
    zone: "Zone C — North Kota",
    lat: 25.215,
    lng: 75.84,
    eta: "15-18 Mins",
  },
  {
    name: "Borkhera & Baran Road",
    pincode: "324001",
    zone: "Zone D — East Kota",
    lat: 25.19,
    lng: 75.875,
    eta: "15-18 Mins",
  },
];

