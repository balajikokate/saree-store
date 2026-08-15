import { useState } from "react";
import { accountApi } from "../../services/api";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import Button from "../../components/common/Button";

export default function AccountProfile() {
  const { user, updateUser } = useCustomerAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setProfileSaving(true);
    try {
      const res = await accountApi.updateProfile(profileForm);
      updateUser(res.data);
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMessage("");
    setPwError("");
    if (pwForm.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    try {
      await accountApi.changePassword(pwForm);
      setPwMessage("Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwError(err.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <form onSubmit={handleProfileSubmit} className="space-y-4 rounded-sm border border-ink/10 bg-white p-6">
        <h2 className="font-display text-lg text-ink">Profile details</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Full Name</label>
          <input
            className="input-field"
            value={profileForm.name}
            onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Phone</label>
          <input
            className="input-field"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Email</label>
          <input className="input-field bg-blush/40" value={user?.email || ""} disabled />
          <p className="mt-1 text-xs text-ink/40">Email can't be changed.</p>
        </div>
        {profileMessage && <p className="text-sm text-emerald">{profileMessage}</p>}
        {profileError && <p className="text-sm text-maroon">{profileError}</p>}
        <Button type="submit" isLoading={profileSaving}>
          Save changes
        </Button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-4 rounded-sm border border-ink/10 bg-white p-6">
        <h2 className="font-display text-lg text-ink">Change password</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Current Password</label>
          <input
            type="password"
            className="input-field"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">New Password</label>
          <input
            type="password"
            className="input-field"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            autoComplete="new-password"
          />
        </div>
        {pwMessage && <p className="text-sm text-emerald">{pwMessage}</p>}
        {pwError && <p className="text-sm text-maroon">{pwError}</p>}
        <Button type="submit" isLoading={pwSaving}>
          Update password
        </Button>
      </form>
    </div>
  );
}
