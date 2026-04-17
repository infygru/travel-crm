"use client"

import { useState } from "react"
import { updateProfile, changePassword, inviteTeamMember } from "@/lib/actions/settings"
import { Check, AlertCircle } from "lucide-react"

type User = {
  id: string
  name: string | null
  email: string
  phone: string | null
  department: string | null
  role: string
}

export function ProfileForm({ user }: { user: User }) {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    const fd = new FormData(e.currentTarget)
    try {
      await updateProfile({
        name: fd.get("name") as string,
        phone: fd.get("phone") as string || undefined,
        department: fd.get("department") as string || undefined,
      })
      setStatus({ type: "success", message: "Profile updated successfully" })
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      {status && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
          status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {status.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            name="name"
            type="text"
            defaultValue={user.name ?? ""}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
          <input
            name="department"
            type="text"
            defaultValue={user.department ?? ""}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}

export function ChangePasswordForm() {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    const fd = new FormData(e.currentTarget)
    const newPassword = fd.get("newPassword") as string
    const confirmPassword = fd.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match" })
      setSaving(false)
      return
    }
    if (newPassword.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters" })
      setSaving(false)
      return
    }

    try {
      await changePassword({
        currentPassword: fd.get("currentPassword") as string,
        newPassword,
      })
      setStatus({ type: "success", message: "Password changed successfully" })
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to change password" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {status && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
          status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {status.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
          <input
            name="currentPassword"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <input
            name="newPassword"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  )
}

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ tempPassword: string; name: string } | null>(null)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await inviteTeamMember({
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        role: fd.get("role") as string,
      })
      setResult({ tempPassword: res.tempPassword, name: res.user.name ?? "User" })
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResult(null); setError("") }}
        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Invite Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6">
              {result ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">
                      {result.name} has been invited!
                    </p>
                    <p className="text-sm text-green-700 mb-1">Share these credentials:</p>
                    <div className="bg-white border border-green-200 rounded-lg p-3 font-mono text-sm">
                      <p>Temporary password: <strong>{result.tempPassword}</strong></p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">Ask them to change their password after first login.</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <input name="name" required placeholder="Jane Smith" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input name="email" type="email" required placeholder="jane@company.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select name="role" defaultValue="AGENT" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="AGENT">Agent</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      {submitting ? "Inviting..." : "Send Invite"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
