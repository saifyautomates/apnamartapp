"use client";

export interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (addr: string) => void;
  currentLocation: string;
}

const PRESET_LOCATIONS = [
  {
    title: "Kota Delivery Hub",
    addr: "R K Nagar, Police Line, Kota, Rajasthan - 324001",
    tag: "8 Mins",
  },
  {
    title: "Home",
    addr: "B-Block, Sector 62, Noida, Uttar Pradesh - 201301",
    tag: "10 Mins",
  },
  {
    title: "Office / Work",
    addr: "Tower A, Tech Park, Sector 125, Noida - 201303",
    tag: "10 Mins",
  },
];

export function LocationModal({
  isOpen,
  onClose,
  onSelect,
  currentLocation,
}: LocationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-black text-[#1c1c1c] text-sm">Select Delivery Location</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Instant delivery to your address</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-sm font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-3.5 space-y-2">
          {PRESET_LOCATIONS.map((loc) => {
            const isSelected = currentLocation.includes(loc.title) || currentLocation === loc.addr;
            return (
              <button
                key={loc.title}
                onClick={() => {
                  onSelect(loc.addr);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? "border-[#0c831f] bg-[#e8f5e9]/40"
                    : "border-neutral-100 hover:border-[#0c831f] hover:bg-neutral-50"
                }`}
              >
                <span className="text-xl">📍</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1c1c1c]">{loc.title}</p>
                    <span className="text-[10px] font-bold text-[#0c831f] bg-[#e8f5e9] px-1.5 py-0.5 rounded">
                      ⚡ {loc.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{loc.addr}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LocationModal;

