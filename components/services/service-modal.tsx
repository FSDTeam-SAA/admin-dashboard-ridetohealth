"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Loader2 } from "lucide-react"

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service?: any
}

export function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
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

  // Load existing service data
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
      if (service) {
        return servicesApi.update(service._id, data)
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({ serviceImage: "" })

    if (!service && !formData.serviceImage) {
      setFormErrors({ serviceImage: "Image is required" })
      return
    }

    const data = new FormData()
    data.append("name", formData.name)
    data.append("description", formData.description)
    data.append("perKmRate", formData.perKmRate)
    data.append("perMileRate", formData.perMileRate)

    // Only send image if user selected a new one
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter service description"
              required
            />
          </div>

          {/* Rates Section */}
          <div className="">
            {/* Per KM Rate */}
            {/* <div className="space-y-2">
              <Label htmlFor="perKmRate">Per KM Rate ($)</Label>
              <Input
                id="perKmRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.perKmRate}
                onChange={(e) =>
                  setFormData({ ...formData, perKmRate: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div> */}

            {/* Per Mile Rate */}
            <div className="space-y-2">
              <Label htmlFor="perMileRate">Per Mile Rate ($)</Label>
              <Input
                id="perMileRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.perMileRate}
                onChange={(e) =>
                  setFormData({ ...formData, perMileRate: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Service Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              aria-invalid={Boolean(formErrors.serviceImage)}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setFormErrors({ serviceImage: "" })
                  setFormData({
                    ...formData,
                    serviceImage: file,
                    previewImage: URL.createObjectURL(file),
                  })
                }
              }}
            />
            {formErrors.serviceImage ? (
              <p className="text-sm text-red-600">{formErrors.serviceImage}</p>
            ) : null}
          </div>

          {/* Image Preview */}
          {formData.previewImage && (
            <div className="space-y-2">
              <Label>Image Preview</Label>
              <img
                src={formData.previewImage}
                alt="Service Preview"
                className="h-32 w-full rounded-md object-cover border"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#8B0000] hover:bg-[#700000]"
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {service ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
