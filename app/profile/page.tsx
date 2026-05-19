"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  providers: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Update failed");
        return;
      }

      setMessage("Profile updated successfully");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: "/auth/login" });
    } catch {
      setError("Failed to delete account");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-64 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">{error || "Profile not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>

      {/* Profile Info */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-4">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name || "Avatar"}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {(profile.name || profile.email)[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {profile.name || "No name set"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
            {profile.providers.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Connected: {profile.providers.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Edit Name */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {message && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              className="min-h-[44px] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Account</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>Member since: {new Date(profile.createdAt).toLocaleDateString()}</p>
          <p>Email verified: {profile.emailVerified ? "Yes ✓" : "No"}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Change Password */}
      {profile.providers.length === 0 && <ChangePasswordSection />}

      {/* Danger Zone */}
      <div className="card p-6 space-y-4 border-red-200 dark:border-red-800">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Danger Zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Delete account
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Change Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="min-h-[44px] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="min-h-[44px] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Min 8 characters, 1 uppercase, 1 number
          </p>
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm New Password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="min-h-[44px] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Changing..." : "Change password"}
        </button>
      </form>
    </div>
  );
}
