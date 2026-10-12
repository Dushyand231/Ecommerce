import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile, updatePassword } = useAuth();
  const { show } = useToast();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [err, setErr] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await updateProfile(profile);
      show('Profile updated');
    } catch (e2) {
      setErr(e2.userMessage);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw.newPassword.length < 6) return setErr('New password must be at least 6 characters.');
    if (pw.newPassword !== pw.confirm) return setErr('Passwords do not match.');
    setPwSaving(true);
    try {
      await updatePassword(pw.currentPassword, pw.newPassword);
      show('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e2) {
      setErr(e2.userMessage);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Profile Settings</h1>
      {err && <div className="form-error">{err}</div>}
      <div className="two-col">
        <form className="panel-card" onSubmit={saveProfile}>
          <h2>Personal Details</h2>
          <div className="field"><label>Full name</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
          <div className="field"><label>Email (read-only)</label><input value={user?.email || ''} disabled /></div>
          <div className="field"><label>Phone</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} maxLength={10} /></div>
          <div className="field"><label>Default address</label><textarea rows={2} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>

        <form className="panel-card" onSubmit={savePassword}>
          <h2>Change Password</h2>
          <div className="field"><label>Current password</label><input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></div>
          <div className="field"><label>New password</label><input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></div>
          <div className="field"><label>Confirm new password</label><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></div>
          <button className="btn btn-outline" disabled={pwSaving}>{pwSaving ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}