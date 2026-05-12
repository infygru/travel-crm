import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CurrencyProvider } from "@/components/currency-provider";
import { getCompanySettings } from "@/lib/actions/settings";

export const metadata: Metadata = {
  title: {
    template: "%s | Travel CRM",
    default: "Travel CRM",
  },
  description: "Enterprise travel CRM — manage bookings, contacts, deals, and marketing in one place.",
  robots: { index: false, follow: false },
};

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const settings = await getCompanySettings();

  return (
    <CurrencyProvider currency={settings.currency ?? "INR"}>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}
