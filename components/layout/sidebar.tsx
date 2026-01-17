"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Car,
  Wrench,
  Users,
  UserCheck,
  History,
  Tag,
  Percent,
  UserCircle,
  Settings,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Car, label: "Taxi", href: "/taxi" },
  { icon: Wrench, label: "Services", href: "/services" },
  { icon: Users, label: "Drivers", href: "/drivers" },
  { icon: UserCheck, label: "Driver Request", href: "/driver-request" },
  { icon: History, label: "Ride History", href: "/ride-history" },
  { icon: Percent, label: "Commission", href: "/commission" },
  { icon: UserCircle, label: "Users Profile", href: "/users-profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    toast.success("Logged out successfully")
    await signOut({ redirect: true, callbackUrl: "/login" })
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[204px] bg-white border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-[70px] items-center justify-center border-b border-border px-4">
          <Image
            src="/logo.png"
            width={68}
            height={60}
            alt="Logo"
            className="h-[60px] w-[68px]"
          />
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#8B0000] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="flex items-center gap-3 px-4 py-3 mx-2 mb-4 text-sm font-medium text-[#8B0000] hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You will need to login again to
                access the dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex justify-end gap-3">
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Logout
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  )
}
