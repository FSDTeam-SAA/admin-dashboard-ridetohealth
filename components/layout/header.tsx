"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useQuery } from "@tanstack/react-query"
import { notificationApi, profileApi } from "@/lib/api"
import ChangePasswordDialog from "@/app/settings/_components/chenge-password"

export function Header() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // 1. Fetch notifications using the SAME queryKey as the page for instant updates
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll().then((res) => res.data),
    refetchInterval: 30000, // Reduced to 30s for better UX
  })

  // 2. FIXED: Correctly check .isRead and navigate nested data structure
  const notifications = notificationsData?.data?.notifications || []
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => profileApi.getProfile().then((res) => res.data.data),
  })

  const fullName = profileData?.fullName || "Admin"
  const profileImage = profileData?.profileImage || null
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <header className="fixed top-0 right-0 left-[173px] z-30 h-[70px] bg-white border-b border-border">
        <div className="flex h-full items-center justify-end px-6 gap-4">
          
          <button
            onClick={() => router.push("/notifications")}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <>
                {/* Red Dot Animation */}
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-ping" />
                
                {/* Optional: Number count badge */}
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {profileLoading ? "Loading..." : fullName}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>

            <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-gray-200">
              <AvatarImage src={profileImage || undefined} alt={fullName} />
              <AvatarFallback className="bg-gray-100 text-gray-700">
                {initials || "AD"}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  )
}