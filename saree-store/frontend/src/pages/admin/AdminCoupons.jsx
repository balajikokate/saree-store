import { useEffect, useState } from "react";
import { adminCouponApi } from "../../services/adminApi";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const emptyForm = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  minOrderValue: "",
  maxDiscount: "",
  usageLimit: "",
  active: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCoupons = () => {
    setLoading(true);
    adminCouponApi
      .list()
      .then((res) => setCoupons(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchCoupons, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrderValue: c.minOrderValue ? String(c.minOrderValue) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      active: c.active,
    });
    setError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.code.trim() || !form.value) {
      setError("Code and value are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        active: form.active,
      };
      if (editingId) {
        await adminCouponApi.update(editingId, payload);
      } else {
        await adminCouponApi.create(payload);
      }
      setFormOpen(false);
      fetchCoupons();
    } catch (err) {
      setError(err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c) => {
    try {
      await adminCouponApi.update(c.id, { active: !c.active });
      fetchCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await adminCouponApi.remove(c.id);
      fetchCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Coupons</h1>
        <Button onClick={openNew}>+ New Coupon</Button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4 rounded-sm border border-ink/10 bg-white p-6">
          <h2 className="font-display text-lg text-ink">{editingId ? "Edit Coupon" : "New Coupon"}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/80">Code</label>
              <input
                className="input-field uppercase"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME10"
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/80">Type</label>
              <select
                className="input-field"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="PERCENTAGE">Percentage off</option>
                <option value="FIXED">Fixed amount off (₹)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/80">
                Value {form.type === "PERCENTAGE" ? "(%)" : "(₹)"}
              </label>
              <input
                type="number"
                className="input-field"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/80">Min order (₹)</label>
              <input
                type="number"
                className="input-field"
                value={form.minOrderValue}
                onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
              />
            </div>
            {form.type === "PERCENTAGE" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink/80">Max discount (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.maxDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                  placeholder="No cap"
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/80">Usage limit</label>
            <input
              type="number"
              className="input-field max-w-[160px]"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              placeholder="Unlimited"
            />
          </div>
          {error && <p className="text-sm text-maroon">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" isLoading={saving}>
              Save Coupon
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <Loader label="Loading coupons" />
      ) : coupons.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No coupons yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mt-6 space-y-3 sm:hidden">
            {coupons.map((c) => (
              <div key={c.id} className="rounded-sm border border-ink/10 bg-white p-4">
                <div className="flex items-start justify-between">
                  <p className="font-mono font-semibold text-maroon">{c.code}</p>
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${c.active ? "bg-emerald/10 text-emerald" : "bg-ink/10 text-ink/50"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  {c.type === "PERCENTAGE" ? `${c.value}% off` : `₹${c.value} off`}
                  {c.minOrderValue > 0 && ` · min ₹${c.minOrderValue}`}
                </p>
                <p className="mt-1 text-xs text-ink/50">
                  Used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </p>
                <div className="mt-3 flex gap-3 text-xs">
                  <button onClick={() => openEdit(c)} className="font-medium text-maroon underline">Edit</button>
                  <button onClick={() => handleToggleActive(c)} className="font-medium text-ink/60 underline">
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDelete(c)} className="font-medium text-maroon underline">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="mt-6 hidden overflow-x-auto rounded-sm border border-ink/10 bg-white sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-blush/40 text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min Order</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono font-medium text-maroon">{c.code}</td>
                    <td className="px-4 py-3 text-ink/70">
                      {c.type === "PERCENTAGE" ? `${c.value}%` : `₹${c.value}`}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{c.minOrderValue > 0 ? `₹${c.minOrderValue}` : "—"}</td>
                    <td className="px-4 py-3 text-ink/70">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${c.active ? "bg-emerald/10 text-emerald" : "bg-ink/10 text-ink/50"}`}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-xs">
                        <button onClick={() => openEdit(c)} className="font-medium text-maroon underline">Edit</button>
                        <button onClick={() => handleToggleActive(c)} className="font-medium text-ink/60 underline">
                          {c.active ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => handleDelete(c)} className="font-medium text-maroon underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
