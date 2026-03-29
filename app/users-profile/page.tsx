"use client"

import { useMemo, useState } from "react"
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { usersApi } from "@/lib/api"
import { toast } from "sonner"
import { Eye, Trash2, Loader2 } from "lucide-react"

// ✅ shadcn alert dialog (delete)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ✅ shadcn dialog (details)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type UsersResponse = {
  success: boolean
  data: {
    users: ApiUser[]
    pagination: { current: number; pages: number; total: number }
  }
}

type ApiUser = {
  _id: string
  fullName: string
  phoneNumber: string
  profileImage: string | null
  isActive: boolean
  rideHistory?: { createdAt?: string }[]
  totalCompletedRides?: number
}

type UserDetailsResponse = {
  success: boolean
  data: UserDetails
}

type UserDetails = {
  _id: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  profileImage: string | null
  isActive: boolean
  isEmailVerified: boolean
  isPhoneVerified: boolean
  createdAt?: string
  lastActive?: string
  lastSeen?: string
  wallet?: { balance?: number }
  paymentMethods?: {
    _id: string
    type: string
    cardNumber?: string
    cardHolderName?: string
    expiryDate?: string
    isDefault?: boolean
  }[]
  loginHistory?: { _id: string; device?: string; ipAddress?: string; loginTime?: string }[]
  rideHistory?: {
    _id: string
    createdAt?: string
    status?: string
    totalFare?: number
    paymentMethod?: string
    paymentStatus?: string
    pickupLocation?: { address?: string }
    dropoffLocation?: { address?: string }
  }[]
  totalCompletedRides?: number
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}

function formatDateTime(iso?: string) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getLastRideDate(u: ApiUser) {
  const list = u.rideHistory ?? []
  if (list.length === 0) return undefined

  const latest = list.map((r) => r.createdAt).filter(Boolean) as string[]
  if (latest.length === 0) return undefined
  latest.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  return latest[0]
}

function statusBadge(active: boolean) {
  return (
    <Badge
      variant="default"
      className={
        active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
      }
    >
      {active ? "Active" : "Deactive"}
    </Badge>
  )
}

export default function UsersProfilePage() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  // ✅ delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null)

  // ✅ details modal state
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ["users", page],
    queryFn: async () => {
      const res = await usersApi.getAll(page)
      return res.data as UsersResponse
    },
    placeholderData: keepPreviousData,
  })

  const users = useMemo<ApiUser[]>(() => data?.data?.users ?? [], [data])
  const totalPages = data?.data?.pagination?.pages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deleted successfully")
      setDeleteOpen(false)
      setUserToDelete(null)
    },
    onError: () => {
      toast.error("Failed to delete user")
    },
  })

  const askDelete = (user: ApiUser) => {
    setUserToDelete(user)
    setDeleteOpen(true)
  }

  const openDetails = (id: string) => {
    setSelectedUserId(id)
    setDetailsOpen(true)
  }

  // ✅ single user details query
  const {
    data: userDetailsRes,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    isFetching: isDetailsFetching,
  } = useQuery({
    queryKey: ["user", selectedUserId],
    queryFn: async () => {
      const res = await usersApi.getOne(selectedUserId as string)
      return res.data as UserDetailsResponse
    },
    enabled: detailsOpen && !!selectedUserId,
  })

  const userDetails = userDetailsRes?.data

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Profile</h1>
          <p className="text-gray-600 mt-1">Dashboard › Users Profile</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Users Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Phone Number</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Last Ride</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Total Rides</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  [...Array(9)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-200 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-28" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-9" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => {
                    const lastRide = getLastRideDate(user)
                    const rides = user.totalCompletedRides ?? 0
                    const active = !!user.isActive

                    return (
                      <tr key={user._id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profileImage || undefined} />
                              <AvatarFallback>{initials(user.fullName) || "?"}</AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                          </div>
                        </td>

                        <td className="p-4">{statusBadge(active)}</td>

                        <td className="p-4">
                          <p className="text-sm text-gray-900">{user.phoneNumber || "-"}</p>
                        </td>

                        <td className="p-4">
                          <p className="text-sm text-gray-600">{formatDateTime(lastRide)}</p>
                        </td>

                        <td className="p-4">
                          <p className="text-sm text-gray-900">{rides}</p>
                        </td>

                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-gray-100"
                              onClick={() => openDetails(user._id)}
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => askDelete(user)}
                              className="h-9 w-9 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* ✅ Delete Modal Yes/No */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
              {userToDelete?.fullName ? (
                <span className="block mt-2 text-sm text-gray-700">
                  User: <span className="font-medium">{userToDelete.fullName}</span>
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => {
                setUserToDelete(null)
                setDeleteOpen(false)
              }}
            >
              No
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={!userToDelete?._id || deleteMutation.isPending}
              onClick={() => userToDelete?._id && deleteMutation.mutate(userToDelete._id)}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ User Details Modal */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(v) => {
          setDetailsOpen(v)
          if (!v) setSelectedUserId(null)
        }}
      >
        <DialogContent className=" overflow-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              User Details {isDetailsFetching ? <span className="ml-2 text-xs text-gray-400">Updating…</span> : null}
            </DialogTitle>
          </DialogHeader>

          {isDetailsLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : isDetailsError || !userDetails ? (
            <div className="text-sm text-red-600">Failed to load user details.</div>
          ) : (
            <div className="space-y-6">
              {/* top header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={userDetails.profileImage || undefined} />
                    <AvatarFallback>{initials(userDetails.fullName) || "?"}</AvatarFallback>
                  </Avatar>

                  <div className="leading-tight">
                    <p className="text-lg font-semibold text-gray-900">{userDetails.fullName}</p>
                    <p className="text-sm text-gray-600">{userDetails.email}</p>
                    <p className="text-xs text-gray-500">{userDetails._id}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {statusBadge(!!userDetails.isActive)}

                  <div className="flex gap-2">
                    <Badge className={userDetails.isEmailVerified ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}>
                      Email {userDetails.isEmailVerified ? "Verified" : "Not Verified"}
                    </Badge>
                    <Badge className={userDetails.isPhoneVerified ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}>
                      Phone {userDetails.isPhoneVerified ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{userDetails.phoneNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm text-gray-900">{userDetails.role || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="text-sm text-gray-900">{formatDateTime(userDetails.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Active</p>
                  <p className="text-sm text-gray-900">{formatDateTime(userDetails.lastActive)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Seen</p>
                  <p className="text-sm text-gray-900">{formatDateTime(userDetails.lastSeen)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wallet Balance</p>
                  <p className="text-sm text-gray-900">${Number(userDetails.wallet?.balance ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Completed Rides</p>
                  <p className="text-sm text-gray-900">{userDetails.totalCompletedRides ?? 0}</p>
                </div>
              </div>

              {/* payment methods */}
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Payment Methods</p>

                {userDetails.paymentMethods?.length ? (
                  <div className="space-y-2">
                    {userDetails.paymentMethods.map((pm) => (
                      <div key={pm._id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                        <div>
                          <p className="text-sm text-gray-900">
                            {pm.type?.toUpperCase()} {pm.cardNumber ? `•••• ${pm.cardNumber}` : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pm.cardHolderName || "-"} · Exp {pm.expiryDate || "-"}
                          </p>
                        </div>
                        {pm.isDefault ? <Badge className="bg-green-100 text-green-700">Default</Badge> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No payment methods.</p>
                )}
              </div>

              {/* recent logins */}
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Recent Logins</p>

                {userDetails.loginHistory?.length ? (
                  <div className="space-y-2">
                    {userDetails.loginHistory
                      .slice(-5)
                      .reverse()
                      .map((lh) => (
                        <div key={lh._id} className="rounded-md border border-gray-100 p-3">
                          <p className="text-sm text-gray-900">{lh.device || "-"}</p>
                          <p className="text-xs text-gray-500">
                            {lh.ipAddress || "-"} · {formatDateTime(lh.loginTime)}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No login history.</p>
                )}
              </div>

              {/* rides */}
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Recent Rides</p>

                {userDetails.rideHistory?.length ? (
                  <div className="space-y-2">
                    {userDetails.rideHistory
                      .slice(-5)
                      .reverse()
                      .map((r) => (
                        <div key={r._id} className="rounded-md border border-gray-100 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{r.status || "-"}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ${Number(r.totalFare ?? 0).toLocaleString()}
                            </p>
                          </div>

                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(r.createdAt)}</p>

                          <p className="text-xs text-gray-600 mt-2">
                            <span className="font-medium">From:</span> {r.pickupLocation?.address || "-"}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">To:</span> {r.dropoffLocation?.address || "-"}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {r.paymentMethod || "-"} · {r.paymentStatus || "-"}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No rides found.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
