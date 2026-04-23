"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { servicesApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, UploadCloud, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service?: any
}

export function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    perKmRate: "",
    perMileRate: "",
    serviceImage: null as File | null,
    previewImage: "",
  })
  const [formErrors, setFormErrors] = useState({
    serviceImage: "",
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        perKmRate: service.perKmRate || "",
        perMileRate: service.perMileRate || "",
        serviceImage: null,
        previewImage: service.serviceImage || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        perKmRate: "",
        perMileRate: "",
        serviceImage: null,
        previewImage: "",
      })
    }
    setFormErrors({ serviceImage: "" })
  }, [service, isOpen])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (service) return servicesApi.update(service._id, data)
      return servicesApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["services-list"] })
      toast.success(service ? "Service updated successfully" : "Service created successfully")
      onClose()
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (service ? "Failed to update service" : "Failed to create service")

      if (message.toLowerCase().includes("image")) {
        setFormErrors({ serviceImage: message })
        return
      }
      toast.error(message)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormErrors({ serviceImage: "" })
    setFormData({
      ...formData,
      serviceImage: file,
      previewImage: URL.createObjectURL(file),
    })
  }

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFormData({ ...formData, serviceImage: null, previewImage: "" })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({ serviceImage: "" })

    if (!service && !formData.serviceImage) {
      setFormErrors({ serviceImage: "Service image is required" })
      return
    }

    const data = new FormData()
    data.append("name", formData.name)
    data.append("description", formData.description)
    data.append("perKmRate", formData.perKmRate)
    data.append("perMileRate", formData.perMileRate)
    if (formData.serviceImage) {
      data.append("serviceImage", formData.serviceImage)
    }

    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Add Service"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter service name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter service description"
              required
            />
          </div>

          {/* Per Mile Rate */}
          <div className="space-y-2">
            <Label htmlFor="perMileRate">Per Mile Rate ($)</Label>
            <Input
              id="perMileRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.perMileRate}
              onChange={(e) => setFormData({ ...formData, perMileRate: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Service Image</Label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Upload zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              className={cn(
                "relative w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                formErrors.serviceImage
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              {formData.previewImage ? (
                /* Preview state */
                <div className="relative">
                  <img
                    src={formData.previewImage}
                    alt="Service preview"
                    className="h-40 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 rounded-full bg-white p-1 shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1">
                    <p className="text-xs text-white truncate max-w-[200px]">
                      {formData.serviceImage?.name ?? "Current image"}
                    </p>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <UploadCloud className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      JPG, PNG, WebP — up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {formErrors.serviceImage && (
              <p className="text-sm text-red-600">{formErrors.serviceImage}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#8B0000] hover:bg-[#700000]"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {service ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
