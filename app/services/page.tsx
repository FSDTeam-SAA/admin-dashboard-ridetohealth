"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { ServiceModal } from "@/components/services/service-modal"
import { servicesApi } from "@/lib/api"
import { toast } from "sonner"
import { Pencil, Trash2, Plus } from "lucide-react"

const FALLBACK_IMAGE = "/placeholder.svg"

interface Service {
  _id: string
  name: string
  description: string
  serviceImage: string
  baseFare: number
  perKmRate: number
  perMinuteRate: number
  perMileRate: number
  createdAt: string
}

export default function ServicesPage() {
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["services", page],
    queryFn: async () => {
      const response = await servicesApi.getAll(page)
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["services-list"] })
      toast.success("Service deleted successfully")
      setDeleteConfirmId(null)
    },
    onError: () => {
      toast.error("Failed to delete service")
    },
  })

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const handleAddNew = () => {
    setSelectedService(null)
    setIsModalOpen(true)
  }

  const services: Service[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-1">Dashboard › Services</p>
          </div>
          <Button onClick={handleAddNew} className="bg-[#8B0000] hover:bg-[#700000]">
            <Plus className="h-4 w-4 mr-2" />
            Services
          </Button>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Services Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Added</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">perMileRate</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} className="border-b border-gray-200 last:border-0">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-16 rounded" />
                            <Skeleton className="h-6 w-48" />
                          </div>
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
                    ))}
                  </>
                ) : services.length > 0 ? (
                  services.map((service) => (
                    <tr key={service._id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={service.serviceImage || FALLBACK_IMAGE}
                            alt={service.name}
                            className="h-12 w-16 object-cover rounded bg-gray-100"
                            onError={(e) => {
                              if (e.currentTarget.src !== window.location.origin + FALLBACK_IMAGE) {
                                e.currentTarget.src = FALLBACK_IMAGE
                              }
                            }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600">
                          {new Date(service.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600">{service.perMileRate}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(service)}
                            className="h-9 w-9 hover:bg-gray-100"
                            disabled={deleteConfirmId === service._id}
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </Button>

                          {deleteConfirmId === service._id ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={cancelDelete}
                                disabled={deleteMutation.isPending}
                              >
                                No
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => confirmDelete(service._id)}
                                disabled={deleteMutation.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {deleteMutation.isPending && deleteMutation.variables === service._id
                                  ? "Deleting..."
                                  : "Yes"}
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(service._id)}
                              className="h-9 w-9 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No services found
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

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedService(null)
        }}
        service={selectedService}
      />
    </MainLayout>
  )
}
