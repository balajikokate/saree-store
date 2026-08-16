import { useEffect, useState } from "react";
import { accountApi } from "../../services/api";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

const emptyForm = { label: "Home", fullName: "", phone: "", addressLine: "", city: "", state: "", pincode: "" };

const FIELD_VALIDATORS = {
  fullName: (v) => (v.trim().length < 2 ? "Enter a name" : ""),
  phone: (v) => (!/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit mobile number" : ""),
  addressLine: (v) => (v.trim().length < 5 ? "Enter the full address" : ""),
  city: (v) => (v.trim().length < 2 ? "Enter a city" : ""),
  state: (v) => (v.trim().length < 2 ? "Enter a state" : ""),
  pincode: (v) => (!/^\d{6}$/.test(v) ? "Enter a valid 6-digit pincode" : ""),
};

export default function AccountAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const fetchAddresses = () => {
    setLoading(true);
    accountApi.addresses
      .list()
      .then((res) => setAddresses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchAddresses, []);

  const openNewForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setServerError("");
    setFormOpen(true);
  };

  const openEditForm = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setErrors({});
    setServerError("");
    setFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (FIELD_VALIDATORS[name]) {
      setErrors((prev) => ({ ...prev, [name]: FIELD_VALIDATORS[name](value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const allErrors = {};
    for (const field of Object.keys(FIELD_VALIDATORS)) {
      allErrors[field] = FIELD_VALIDATORS[field](form[field]);
    }
    setErrors(allErrors);
    if (Object.values(allErrors).some(Boolean)) return;

    setSaving(true);
    try {
      if (editingId) {
        await accountApi.addresses.update(editingId, form);
      } else {
        await accountApi.addresses.create(form);
      }
      setFormOpen(false);
      fetchAddresses();
    } catch (err) {
      setServerError(err.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await accountApi.addresses.remove(id);
      fetchAddresses();
    } catch (err) {
      alert(err.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      await accountApi.addresses.update(addr.id, { isDefault: true });
      fetchAddresses();
    } catch (err) {
      alert(err.message || "Failed to set default address");
    }
  };

  if (loading) return <Loader label="Loading addresses" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink/60">Saved addresses can be picked at checkout to skip retyping.</p>
        <Button onClick={openNewForm}>Add Address</Button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-sm border border-ink/10 bg-white p-6">
          <h3 className="font-display text-lg text-ink">{editingId ? "Edit Address" : "New Address"}</h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/80">Label</label>
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Home, Work, etc."
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
            <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} />
          </div>
          <FormField label="Address" name="addressLine" value={form.addressLine} onChange={handleChange} error={errors.addressLine} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} />
            <FormField label="State" name="state" value={form.state} onChange={handleChange} error={errors.state} />
            <FormField label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} />
          </div>
          {serverError && <p className="text-sm text-maroon">{serverError}</p>}
          <div className="flex gap-3">
            <Button type="submit" isLoading={saving}>
              Save Address
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !formOpen ? (
        <EmptyState title="No saved addresses yet" description="Add one to speed up checkout next time." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-sm border border-ink/10 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-xs font-medium text-emerald">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-ink/70">{addr.fullName}</p>
              <p className="text-sm text-ink/70">{addr.phone}</p>
              <p className="mt-1 text-sm text-ink/60">
                {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <button onClick={() => openEditForm(addr)} className="font-medium text-maroon underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(addr.id)} className="font-medium text-maroon underline">
                  Delete
                </button>
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr)} className="font-medium text-ink/60 underline">
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, name, value, onChange, error }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink/80">{label}</label>
      <input name={name} value={value} onChange={onChange} className="input-field" />
      {error && <p className="mt-1 text-xs text-maroon">{error}</p>}
    </div>
  );
}
