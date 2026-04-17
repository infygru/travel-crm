import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { User, Users, TrendingUp, Shield, Building2 } from "lucide-react";
import { ProfileForm, ChangePasswordForm, InviteMemberDialog } from "@/components/settings/profile-form";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { PipelineEditor } from "@/components/settings/pipeline-editor";
import { getCompanySettings } from "@/lib/actions/settings";

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const tab = params.tab ?? "company";

  const [currentUser, teamMembers, pipelines, companySettings] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    db.user.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    db.pipeline.findMany({
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    getCompanySettings(),
  ]);

  const tabs = [
    { id: "company", label: "Company", icon: Building2 },
    { id: "profile", label: "My Profile", icon: User },
    { id: "team", label: "Team", icon: Users },
    { id: "pipeline", label: "Pipeline", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your agency and account settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.id}
                  href={`/settings?tab=${t.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === "company" && (
            <CompanySettingsForm settings={companySettings} />
          )}

          {tab === "profile" && currentUser && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-6">Profile Settings</h2>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                    {currentUser.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{currentUser.name}</h3>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      <Shield className="w-3 h-3" />
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <ProfileForm
                  user={{
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    phone: currentUser.phone,
                    department: currentUser.department,
                    role: currentUser.role,
                  }}
                />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-6">Change Password</h2>
                <ChangePasswordForm />
              </div>
            </div>
          )}

          {tab === "team" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
                <InviteMemberDialog />
              </div>
              <div className="divide-y divide-gray-100">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {member.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      member.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                      member.role === "MANAGER" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "pipeline" && (
            <PipelineEditor initialPipelines={pipelines} />
          )}
        </div>
      </div>
    </div>
  );
}
