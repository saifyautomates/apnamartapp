"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Price, EtaBadge } from "@/components/ui";
import Link from "next/link";

type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export function AccountPageView() {
  const [profile, setProfile] = useState<{ phone: string; name: string | null; email: string | null } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loyalty, setLoyalty] = useState<{ points: number } | null>(null);
  const [credit, setCredit] = useState<{ balancePaise: number } | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newAddr, setNewAddr] = useState({ label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [needLogin, setNeedLogin] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, a, l, c] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/addresses"),
        fetch("/api/account/loyalty"),
        fetch("/api/account/credit"),
      ]);
      if (p.status === 401) {
        setNeedLogin(true);
        return;
      }
      const pj = await p.json();
      setProfile(pj.data);
      setName(pj.data?.name ?? "");
      setEmail(pj.data?.email ?? "");
      setAddresses((await a.json()).data ?? []);
      setLoyalty((await l.json()).data);
      setCredit((await c.json()).data);
    })().catch(() => setError("Failed to load account"));
  }, []);

  async function saveProfile() {
    setError("");
    setSavedSuccess(false);
    try {
      await api("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name || undefined, email: email || undefined }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function addAddress() {
    setError("");
    try {
      await api("/api/account/addresses", { method: "POST", body: JSON.stringify(newAddr) });
      const res = await fetch("/api/account/addresses");
      setAddresses((await res.json()).data ?? []);
      setNewAddr({ label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add address failed");
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    window.location.href = "/";
  }

  if (needLogin) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 shadow-xs">
        <div className="h-16 w-16 rounded-2xl bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center text-3xl mx-auto mb-4">
          👤
        </div>
        <h1 className="text-xl font-black text-[#1c1c1c]">My Account</h1>
        <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
          Sign in to manage your addresses, rewards, and track your instant 8-minute grocery orders.
        </p>
        <Link
          href="/login?next=/account"
          className="mt-6 inline-block w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-5 py-3 text-sm font-black text-white shadow-md transition active:scale-[0.99] cursor-pointer"
        >
          Sign in with Mobile OTP →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center text-xl font-black">
            {profile?.name ? profile.name[0].toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#1c1c1c]">{profile?.name ?? "Grocery Shopper"}</h1>
            <p className="text-xs text-neutral-500 font-medium">+91 {profile?.phone}</p>
          </div>
        </div>
        <EtaBadge minutes={8} className="px-3 py-1 text-xs" />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-bold text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Personal Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1c1c1c] mb-1">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs font-bold text-[#1c1c1c] focus:border-[#0c831f] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1c1c1c] mb-1">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs font-bold text-[#1c1c1c] focus:border-[#0c831f] focus:outline-hidden"
              />
            </div>
            <button
              onClick={saveProfile}
              className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2.5 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
            >
              Save Profile
            </button>
            {savedSuccess ? (
              <span className="ml-3 text-xs font-bold text-[#0c831f]">✓ Saved!</span>
            ) : null}
          </div>
        </section>

        {/* Rewards & Wallet */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Rewards &amp; Wallet</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#e8f5e9]/60 border border-[#0c831f]/20 p-3.5">
              <p className="text-[11px] font-bold text-[#0c831f] uppercase">Loyalty Points</p>
              <p className="text-2xl font-black text-[#0c831f] mt-1">{loyalty?.points ?? 0}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">Use at checkout for discount</p>
            </div>
            <div className="rounded-xl bg-amber-50/60 border border-amber-200/60 p-3.5">
              <p className="text-[11px] font-bold text-amber-800 uppercase">Store Credit</p>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {credit ? <Price paise={credit.balancePaise} /> : "₹0"}
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">Instant refunds &amp; cashbacks</p>
            </div>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0c831f] hover:underline pt-2"
          >
            📦 View Order History &amp; Tracking →
          </Link>
        </section>

        {/* Saved Addresses */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4 lg:col-span-2">
          <h2 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Saved Delivery Addresses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-xl border border-neutral-200 p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1c1c1c]">{a.label}</span>
                  {a.isDefault ? (
                    <span className="text-[10px] font-bold text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded">Default</span>
                  ) : null}
                </div>
                <p className="text-neutral-600">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                <p className="text-neutral-400">{a.city}, {a.state} - {a.pincode}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <h3 className="text-xs font-black text-[#1c1c1c] mb-3">Add New Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                placeholder="Label (Home/Work)"
                value={newAddr.label}
                onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
              <input
                placeholder="Recipient Name"
                value={newAddr.name}
                onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
              <input
                placeholder="Phone Number"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
              <input
                placeholder="Flat / House / Building"
                value={newAddr.line1}
                onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                className="sm:col-span-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
              <input
                placeholder="Area / Sector / Street (optional)"
                value={newAddr.line2}
                onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
              <input
                placeholder="City"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
              <input
                placeholder="State"
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
              <input
                placeholder="6-digit PIN code"
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium focus:border-[#0c831f]"
              />
            </div>
            <button
              onClick={addAddress}
              className="mt-3 rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2.5 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
            >
              Save Address
            </button>
          </div>
        </section>

        {/* Logout */}
        <div className="lg:col-span-2 pt-2">
          <button
            onClick={logout}
            className="rounded-xl border border-neutral-200 bg-white hover:bg-red-50 hover:text-red-600 px-6 py-2.5 text-xs font-black text-neutral-700 transition cursor-pointer"
          >
            Log Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountPageView;

