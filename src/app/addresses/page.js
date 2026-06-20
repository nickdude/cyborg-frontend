"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { addressAPI } from "@/services/api";

const EMPTY = {
  fullName: "", phoneNumber: "", addressLine1: "", addressLine2: "",
  landmark: "", city: "", state: "", country: "India", pincode: "",
};

export default function AddressesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // id | "new" | null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await addressAPI.list();
      setAddresses(res.data || []);
    } catch (e) {
      setError(e.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
  }, [token, load, router]);

  const startNew = () => { setForm(EMPTY); setEditing("new"); };
  const startEdit = (a) => { setForm({ ...EMPTY, ...a }); setEditing(a.id); };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (editing === "new") await addressAPI.create(form);
      else await addressAPI.update(editing, form);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message || "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => { await addressAPI.setDefault(id); await load(); };
  const remove = async (id) => { await addressAPI.remove(id); await load(); };

  const field = "w-full rounded-xl border border-borderColor px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="min-h-screen bg-pageBackground pb-24">
      <div className="mx-auto w-full max-w-[760px] px-4 py-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Addresses</h1>
          {editing === null && (
            <button onClick={startNew} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800">+ Add address</button>
          )}
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {editing !== null && (
          <div className="mt-5 rounded-2xl border border-borderColor bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">{editing === "new" ? "Add address" : "Edit address"}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <input className={field} placeholder="Full name" value={form.fullName} onChange={set("fullName")} />
              <input className={field} placeholder="Phone number" value={form.phoneNumber} onChange={set("phoneNumber")} />
              <input className={`${field} col-span-2`} placeholder="Address line 1" value={form.addressLine1} onChange={set("addressLine1")} />
              <input className={`${field} col-span-2`} placeholder="Address line 2 (optional)" value={form.addressLine2} onChange={set("addressLine2")} />
              <input className={field} placeholder="Landmark (optional)" value={form.landmark} onChange={set("landmark")} />
              <input className={field} placeholder="City" value={form.city} onChange={set("city")} />
              <input className={field} placeholder="State" value={form.state} onChange={set("state")} />
              <input className={field} placeholder="Pincode" value={form.pincode} onChange={set("pincode")} />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-borderColor px-5 py-2.5 text-sm font-semibold text-gray-600">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-10 text-center text-gray-500">Loading…</div>
        ) : addresses.length === 0 && editing === null ? (
          <div className="mt-16 text-center">
            <p className="text-lg font-medium text-gray-700">No saved addresses</p>
            <p className="mt-1 text-sm text-gray-500">Add a delivery address to speed up checkout.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-2xl border border-borderColor bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">
                      {a.fullName} · {a.phoneNumber}
                      {a.isDefault && <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Default</span>}
                    </p>
                    <p className="text-gray-600">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}{a.landmark ? `, ${a.landmark}` : ""}</p>
                    <p className="text-gray-600">{a.city}, {a.state} {a.pincode}, {a.country}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  {!a.isDefault && <button onClick={() => setDefault(a.id)} className="font-semibold text-primary hover:underline">Set default</button>}
                  <button onClick={() => startEdit(a)} className="font-semibold text-gray-700 hover:underline">Edit</button>
                  <button onClick={() => remove(a.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/market-place" className="text-sm font-semibold text-primary hover:underline">← Back to Marketplace</Link>
        </div>
      </div>
    </div>
  );
}
