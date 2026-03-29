"use client"

import { useMemo, useState } from "react"
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { PromoCodeModal } from "@/components/promo-code/promo-code-modal"
import { promoCodeApi } from "@/lib/api"
import { toast } from "sonner"
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react"

// ✅ shadcn alert dialog
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

type PromoStatus = "active" | "pending" | "expired" | string
type DiscountType = "percentage" | "fixed" | string

interface PromoCode {
  _id: string
  title?: string
  code: string
  discountType?: DiscountType
  discountValue?: number
  status: PromoStatus
  startDate?: string
  expiryDate?: string
  validFrom?: string
  validUntil?: string
}

interface PromoCodesResponse {
  success: boolean
  data: {
    promoCodes: PromoCode[]
    pagination: { current: number; pages: number; total: number }
  }
}

function formatDate(iso?: string) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function getStartDate(p: PromoCode) {
  return p.startDate ?? p.validFrom
}

function getEndDate(p: PromoCode) {
  return p.expiryDate ?? p.validUntil
}

function getDiscountLabel(p: PromoCode) {
  const value = p.discountValue ?? 0
  if (p.discountType === "percentage") return `${value}%`
  if (p.discountType === "fixed") return `$${value}`
  return value ? `${value}` : "-"
}

function statusClass(status: string) {
  if (status === "active") return "bg-green-100 text-green-700 hover:bg-green-100"
  if (status === "expired") return "bg-red-100 text-red-700 hover:bg-red-100"
  return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
}

export default function PromoCodePage() {
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null)

  // ✅ delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<PromoCodesResponse>({
    queryKey: ["promoCodes", page],
    queryFn: async () => {
      const res = await promoCodeApi.getAll(page)
      return res.data as PromoCodesResponse
    },
    placeholderData: keepPreviousData,
  })

  const promoCodes = useMemo<PromoCode[]>(() => data?.data?.promoCodes ?? [], [data])
  const totalPages = data?.data?.pagination?.pages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promoCodeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoCodes"] })
      toast.success("Promo code deleted successfully")
      setDeleteOpen(false)
      setPromoToDelete(null)
    },
    onError: () => {
      toast.error("Failed to delete promo code")
    },
  })

  const handleEdit = (promo: PromoCode) => {
    setSelectedPromo(promo)
    setIsModalOpen(true)
  }

  // ✅ open modal instead of confirm()
  const handleAskDelete = (promo: PromoCode) => {
    setPromoToDelete(promo)
    setDeleteOpen(true)
  }

  const handleAddNew = () => {
    setSelectedPromo(null)
    setIsModalOpen(true)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promo Code</h1>
            <p className="text-gray-600 mt-1">Dashboard › Promo Code</p>
          </div>

          <Button onClick={handleAddNew} className="bg-[#8B0000] hover:bg-[#700000]">
            <Plus className="h-4 w-4 mr-2" />
            Add Code
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Code</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Discount</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Start Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">End Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-gray-200 last:border-0">
                        <td className="p-4">
                          <Skeleton className="h-6 w-28" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-6 w-16" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-6 w-20" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-6 w-20" />
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
                    ))}
                  </>
                ) : promoCodes.length > 0 ? (
                  promoCodes.map((promo) => (
                    <tr key={promo._id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="leading-tight">
                          <p className="text-sm font-medium text-gray-900">{promo.code}</p>
                          {promo.title ? <p className="text-xs text-gray-500">{promo.title}</p> : null}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-sm text-gray-900">{getDiscountLabel(promo)}</p>
                      </td>

                      <td className="p-4">
                        <p className="text-sm text-gray-900">{formatDate(getStartDate(promo))}</p>
                      </td>

                      <td className="p-4">
                        <p className="text-sm text-gray-900">{formatDate(getEndDate(promo))}</p>
                      </td>

                      <td className="p-4">
                        <Badge variant="default" className={statusClass(promo.status)}>
                          {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                        </Badge>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(promo)}
                            className="h-9 w-9 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAskDelete(promo)}
                            className="h-9 w-9 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No promo codes found
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

      {/* Create/Edit Modal */}
      <PromoCodeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPromo(null)
        }}
        promoCode={selectedPromo}
      />

      {/* ✅ Delete Confirm Modal (Yes/No) */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
              {promoToDelete?.code ? (
                <span className="block mt-2 text-sm text-gray-700">
                  Code: <span className="font-medium">{promoToDelete.code}</span>
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => {
                setPromoToDelete(null)
                setDeleteOpen(false)
              }}
            >
              No
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={!promoToDelete?._id || deleteMutation.isPending}
              onClick={() => promoToDelete?._id && deleteMutation.mutate(promoToDelete._id)}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
