"use client";

import { GoogleMapPicker } from "@/components/location/google-map-picker";

export interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (addr: string) => void;
  currentLocation?: string;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  return <GoogleMapPicker isOpen={isOpen} onClose={onClose} />;
}

export default LocationModal;
