import type { ReactNode } from "react"
import { Globe } from "lucide-react"
import { getPortalSession } from "@/lib/portal-auth"
import Link from "next/link"

interface PortalLayoutProps {
  children: ReactNode
}

export default async function PortalLayout({ children }: PortalLayoutProps) {
  const contact = await getPortalSession()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={contact ? "/portal/dashboard" : "/portal/login"} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Travel CRM</p>
              <p className="text-gray-400 text-xs">Customer Portal</p>
            </div>
          </Link>

          {/* Nav links (when logged in) */}
          {contact && (
            <nav className="hidden sm:flex items-center gap-6">
              <Link href="/portal/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/portal/bookings" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                My Bookings
              </Link>
              <Link href="/portal/itineraries" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Itineraries
              </Link>
              <Link href="/portal/tickets" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Support
              </Link>
            </nav>
          )}

          {/* User info */}
          {contact && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {contact.firstName} {contact.lastName}
                </p>
                <p className="text-xs text-gray-400">{contact.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <a
                href="/api/portal/logout"
                className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
              >
                Logout
              </a>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        {contact && (
          <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex gap-4 overflow-x-auto">
            <Link href="/portal/dashboard" className="text-xs font-medium text-gray-600 whitespace-nowrap">Dashboard</Link>
            <Link href="/portal/bookings" className="text-xs font-medium text-gray-600 whitespace-nowrap">Bookings</Link>
            <Link href="/portal/itineraries" className="text-xs font-medium text-gray-600 whitespace-nowrap">Itineraries</Link>
            <Link href="/portal/tickets" className="text-xs font-medium text-gray-600 whitespace-nowrap">Support</Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Travel CRM · Customer Portal · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  )
}
