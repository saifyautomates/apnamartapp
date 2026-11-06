"use client";

import { useState } from "react";
import Image from "next/image";
import { StoreBanner } from "@/lib/banners";

interface BannersClientProps {
  initialBanners: StoreBanner[];
  csrfToken?: string;
}

const PRESET_GRADIENTS = [
  { label: "Emerald Green", value: "from-[#0c831f] via-[#107d22] to-[#146b2b]" },
  { label: "Amber Orange", value: "from-[#d97706] via-[#ea580c] to-[#c2410c]" },
  { label: "Royal Purple", value: "from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]" },
  { label: "Crimson Rose", value: "from-[#9f1239] via-[#e11d48] to-[#be123c]" },
  { label: "Cobalt Blue", value: "from-[#1d4ed8] via-[#2563eb] to-[#1e40af]" },
  { label: "Dark Forest", value: "from-[#052b14] via-[#063319] to-[#04200f]" },
];

const PRESET_ARTWORKS = [
  { label: "Central Mart FMCG Basket", url: "/images/banners/central-mart-fmcg-hero.jpg" },
  { label: "Pharmacy & Wellness", url: "/images/banners/pharmacy.jpg" },
  { label: "Pet Care Essentials", url: "/images/banners/pet-care.jpg" },
  { label: "Baby Care Essentials", url: "/images/banners/baby-care.jpg" },
];

export function BannersClient({ initialBanners, csrfToken = "" }: BannersClientProps) {
  const [banners, setBanners] = useState<StoreBanner[]>(initialBanners);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New / Edit Banner Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("Mega FMCG Grocery Sale");
  const [subtitle, setSubtitle] = useState("Up to 35% OFF on Dairy, Atta, Oil & Snacks");
  const [badgeText, setBadgeText] = useState("⚡ SAME DAY DOORSTEP DELIVERY");
  const [buttonText, setButtonText] = useState("Shop Deals");
  const [href, setHref] = useState("/category/dairy-eggs");
  const [imageUrl, setImageUrl] = useState("/images/banners/central-mart-fmcg-hero.jpg");
  const [bgGradient, setBgGradient] = useState("from-[#0c831f] via-[#107d22] to-[#146b2b]");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getCsrf = async () => {
    if (csrfToken) return csrfToken;
    try {
      const res = await fetch("/api/auth/csrf");
      const json = await res.json();
      return json.csrfToken || "";
    } catch {
      return "";
    }
  };

  // Direct Gallery / Device Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const token = await getCsrf();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "x-csrf-token": token },
        body: formData,
      });

      if (!res.ok) {
        // Fallback to local data URL if server storage not configured
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setImageUrl(reader.result);
            showToast("Image loaded from device gallery!");
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      const json = await res.json();
      if (json.data?.url) {
        setImageUrl(json.data.url);
        showToast("Image uploaded successfully from gallery!");
      }
    } catch {
      // Fallback preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
          showToast("Image selected from gallery!");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Banner (Create or Update)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getCsrf();
      const payload = {
        action: editingId ? "UPDATE" : "CREATE",
        id: editingId || undefined,
        title,
        subtitle,
        badgeText,
        buttonText,
        href,
        imageUrl,
        bgGradient,
      };

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingId ? "Banner updated successfully!" : "New banner published to storefront!");
        setModalOpen(false);
        setEditingId(null);

        // Refresh list
        const refreshRes = await fetch("/api/admin/banners");
        const json = await refreshRes.json();
        if (json.data?.banners) {
          setBanners(json.data.banners);
        }
      } else {
        const err = await res.json();
        alert(err.error?.message || "Failed to save banner");
      }
    } catch (err) {
      alert("Error saving banner: " + String(err));
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggle = async (id: string) => {
    try {
      const token = await getCsrf();
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ action: "TOGGLE", id }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
        );
        showToast("Banner visibility toggled!");
      }
    } catch {
      /* ignore */
    }
  };

  // Delete Banner
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotional banner?")) return;
    try {
      const token = await getCsrf();
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ action: "DELETE", id }),
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        showToast("Banner deleted!");
      }
    } catch {
      /* ignore */
    }
  };

  // Open Edit Form
  const handleEdit = (b: StoreBanner) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setBadgeText(b.badgeText);
    setButtonText(b.buttonText);
    setHref(b.href);
    setImageUrl(b.imageUrl);
    setBgGradient(b.bgGradient);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("Weekend Mega FMCG Sale");
    setSubtitle("Up to 40% OFF on Staples, Snacks & Dairy");
    setBadgeText("🔥 LIMITED TIME OFFER");
    setButtonText("Shop Deals Now");
    setHref("/category/snacks");
    setImageUrl("/images/banners/central-mart-fmcg-hero.jpg");
    setBgGradient("from-[#0c831f] via-[#107d22] to-[#146b2b]");
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#0c831f] text-white px-5 py-3 shadow-2xl flex items-center gap-2.5 text-xs font-black animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Top Header & Add Banner CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
            Storefront Banners &amp; Sale Promotions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 font-semibold">
            Upload and control sale banners on Central Mart customer app directly from your phone/desktop gallery
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0c831f] hover:bg-[#096618] text-white px-5 py-2.5 text-xs font-black shadow-md transition active:scale-95 cursor-pointer shrink-0"
        >
          <span>➕</span>
          <span>Add New Sale Banner</span>
        </button>
      </div>

      {/* Live Notice Pill */}
      <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs text-emerald-900 font-semibold">
        <span className="text-base">📱</span>
        <span>
          <strong>Zero App Rebuild:</strong> Any new banner uploaded here instantly appears on the customer mobile app and website homepage slider.
        </span>
      </div>

      {/* Current Active Banners Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-[#1c1c1c] flex items-center gap-2">
          <span>Active Banners on Customer App</span>
          <span className="rounded-full bg-neutral-200 text-neutral-700 px-2 py-0.5 text-xs">
            {banners.length} total
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {banners.map((b, index) => (
            <div
              key={b.id}
              className={`rounded-3xl border ${
                b.isActive ? "border-neutral-200/90 shadow-sm" : "border-neutral-200/50 opacity-60 bg-neutral-50"
              } bg-white p-5 space-y-4 transition hover:shadow-md`}
            >
              {/* Top Banner Status Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-black text-neutral-700">
                    #{index + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      b.isActive
                        ? "bg-[#e8f5e9] text-[#0c831f] border border-[#0c831f]/20"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${b.isActive ? "bg-[#0c831f] animate-pulse" : "bg-neutral-400"}`} />
                    {b.isActive ? "Live on Storefront" : "Draft / Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(b.id)}
                    className="text-xs font-black text-neutral-500 hover:text-black px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                  >
                    {b.isActive ? "Hide" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(b)}
                    className="text-xs font-black text-[#0c831f] px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="text-xs font-black text-red-600 px-2 py-1 rounded-lg border border-red-200 hover:bg-red-50 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Exact Mobile Preview of this banner */}
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${b.bgGradient} p-4 sm:p-5 text-white flex items-center justify-between min-h-[140px] shadow-sm`}
              >
                <div className="max-w-[65%] space-y-1.5 z-10">
                  <span className="inline-block rounded-full bg-black/25 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#f8cb46] border border-white/10">
                    {b.badgeText}
                  </span>
                  <h3 className="text-sm sm:text-base font-black leading-tight text-white line-clamp-2 drop-shadow-xs">
                    {b.title}
                  </h3>
                  <p className="text-[11px] font-medium text-emerald-100/90 line-clamp-1">
                    {b.subtitle}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block rounded-full bg-white text-[#1c1c1c] font-black text-[10px] px-3.5 py-1 shadow-sm">
                      {b.buttonText} →
                    </span>
                  </div>
                </div>

                {/* Right Image */}
                <div className="h-24 w-24 sm:h-28 sm:w-28 relative rounded-xl overflow-hidden shrink-0 shadow-md">
                  <Image
                    src={b.imageUrl}
                    alt={b.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
              </div>

              {/* Meta details */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold pt-1 border-t border-neutral-100">
                <span>Links to: <strong className="text-neutral-700">{b.href}</strong></span>
                <span>Gradient: {b.bgGradient.split(" ")[0].replace("from-", "")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE / EDIT BANNER MODAL (DIRECT GALLERY UPLOAD & LIVE PREVIEW) */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-neutral-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎨</span>
                <div>
                  <h3 className="text-base font-black text-[#1c1c1c]">
                    {editingId ? "Edit Storefront Banner" : "Create New Storefront Sale Banner"}
                  </h3>
                  <p className="text-xs text-neutral-500 font-semibold">
                    Upload image directly from device gallery or select FMCG preset
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full bg-white border border-neutral-200 h-8 w-8 text-neutral-500 hover:text-black font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form & Live Preview */}
            <form onSubmit={handleSaveBanner} className="p-6 overflow-y-auto space-y-4">
              {/* 1. Direct Gallery Upload Control */}
              <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0c831f] uppercase tracking-wider">
                    🖼️ Direct Gallery / Device Upload
                  </span>
                  {uploadingImage ? (
                    <span className="text-xs text-emerald-700 font-bold animate-pulse">Uploading…</span>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c831f] hover:bg-[#096618] text-white px-4 py-2 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer">
                    <span>📁 Choose from Phone / PC Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[11px] text-neutral-500 font-medium">
                    Supports JPG, PNG, WebP banner images.
                  </span>
                </div>

                {/* Preset FMCG Artworks */}
                <div className="pt-2 border-t border-emerald-200/50">
                  <span className="text-[10px] font-black uppercase text-neutral-400 block mb-1.5">
                    Or pick pre-made retail artwork:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ARTWORKS.map((art) => (
                      <button
                        key={art.url}
                        type="button"
                        onClick={() => setImageUrl(art.url)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          imageUrl === art.url
                            ? "bg-[#0c831f] text-white border-[#0c831f]"
                            : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {art.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Text Content Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-black text-neutral-700 block mb-1">
                    Banner Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mega Weekend FMCG Sale"
                    className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs font-bold focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-neutral-700 block mb-1">
                    Subtitle / Offer Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Up to 40% OFF on Dairy & Staples"
                    className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs font-bold focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-black text-neutral-700 block mb-1">
                    Badge Pill Text
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. ⚡ SAME DAY DOORSTEP"
                    className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs font-bold focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-neutral-700 block mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Shop Now"
                    className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs font-bold focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-neutral-700 block mb-1">
                    Target Category / Link
                  </label>
                  <select
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs font-bold focus:border-[#0c831f] focus:outline-hidden bg-white"
                  >
                    <option value="/category/dairy-eggs">Dairy, Bread &amp; Eggs</option>
                    <option value="/category/snacks">Snacks &amp; Munchies</option>
                    <option value="/category/staples">Atta, Rice &amp; Dal</option>
                    <option value="/category/cold-drinks">Cold Drinks &amp; Juices</option>
                    <option value="/category/personal-care">Personal Care</option>
                    <option value="/category/cleaning-essentials">Cleaning Essentials</option>
                    <option value="/">Storefront Home (All)</option>
                  </select>
                </div>
              </div>

              {/* 3. Gradient Theme Selector */}
              <div>
                <label className="text-xs font-black text-neutral-700 block mb-1.5">
                  Banner Background Theme
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setBgGradient(g.value)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                        bgGradient === g.value
                          ? "border-[#0c831f] ring-2 ring-emerald-400 bg-emerald-50 text-[#0c831f]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full bg-gradient-to-r ${g.value}`} />
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Live Mobile View Preview */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-black uppercase text-neutral-400 block">
                  Live Mobile Screen Preview (Exact size as rendered on customer phone):
                </span>
                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${bgGradient} p-4 text-white flex items-center justify-between min-h-[145px] shadow-sm`}
                >
                  <div className="max-w-[65%] space-y-1.5 z-10">
                    <span className="inline-block rounded-full bg-black/25 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#f8cb46] border border-white/10">
                      {badgeText}
                    </span>
                    <h3 className="text-sm sm:text-base font-black leading-tight text-white line-clamp-2">
                      {title}
                    </h3>
                    <p className="text-[11px] font-medium text-emerald-100 line-clamp-1">
                      {subtitle}
                    </p>
                    <div className="pt-1">
                      <span className="inline-block rounded-full bg-white text-[#1c1c1c] font-black text-[10px] px-3.5 py-1 shadow-sm">
                        {buttonText} →
                      </span>
                    </div>
                  </div>

                  <div className="h-24 w-24 relative rounded-xl overflow-hidden shrink-0 shadow-md">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#0c831f] hover:bg-[#096618] text-white px-5 py-2 text-xs font-black shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingId ? "Update Banner" : "Publish Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

