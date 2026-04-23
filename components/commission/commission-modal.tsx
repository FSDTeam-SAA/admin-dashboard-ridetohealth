"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { commissionApi, servicesApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CommissionModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any
}

export function CommissionModal({ isOpen, onClose, initialData }: CommissionModalProps) {
  const queryClient = useQueryClient()
  const isEditMode = !!initialData

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    commission: "",
    discountType: "percentage",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "active",
    applicableServices: [] as string[],
  })

  // Normalized to match taxi-modal queryFn — both share the ["services-list"] cache key
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services-list"],
    queryFn: async () => {
      const res = await servicesApi.getAll(1)
      return res.data
    },
    enabled: isOpen,
  })

  // servicesData = { success, data: [...], totalPages }
  const servicesList = servicesData?.data || []

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          commission: initialData.commission?.toString() || "",
          discountType: initialData.discountType || "percentage",
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
          endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
          status: initialData.status || "active",
          applicableServices: Array.isArray(initialData.applicableServices)
            ? initialData.applicableServices.map((s: any) => s._id || s)
            : initialData.applicableServices ? [initialData.applicableServices] : [],
        })
      } else {
        setFormData({
          title: "",
          description: "",
          commission: "",
          discountType: "percentage",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          status: "active",
          applicableServices: [],
        })
      }
    }
  }, [isOpen, initialData])

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEditMode
        ? commissionApi.update(initialData._id, payload)
        : commissionApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      toast.success(`Commission ${isEditMode ? "updated" : "created"} successfully`)
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Something went wrong")
    },
  })

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      applicableServices: prev.applicableServices.includes(serviceId)
        ? prev.applicableServices.filter((id) => id !== serviceId)
        : [...prev.applicableServices, serviceId],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.commission) {
      toast.error("Title and Value are required")
      return
    }

    if (formData.applicableServices.length === 0) {
      toast.error("Select at least one service")
      return
    }

    const payload = {
      ...formData,
      commission: Number(formData.commission),
      isActive: formData.status === "active",
      endDate: formData.endDate || undefined,
    }

    mutation.mutate(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">
            {isEditMode ? "Edit Commission Rule" : "Create Commission Rule"}
          </DialogTitle>
        </DialogHeader>

        {/* Form wraps both the scrollable fields and the footer so type="submit" works correctly */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="title">Rule Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(val) => setFormData({ ...formData, discountType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">Select Applicable Services *</Label>
              <div className="border rounded-lg bg-gray-50 overflow-hidden">
                <ScrollArea className="h-48 px-4 py-2">
                  {isLoadingServices ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : servicesList.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 text-center">No services found</p>
                  ) : (
                    <div className="space-y-2">
                      {servicesList.map((service: any) => (
                        <div
                          key={service._id}
                          className="flex items-center space-x-3 p-2 bg-white rounded border border-gray-100 hover:border-primary/50 transition-colors"
                        >
                          <Checkbox
                            id={service._id}
                            checked={formData.applicableServices.includes(service._id)}
                            onCheckedChange={() => toggleService(service._id)}
                          />
                          <label htmlFor={service._id} className="flex-1 text-sm font-medium cursor-pointer">
                            {service.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-gray-50">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#8B0000] hover:bg-[#700000] min-w-30"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Rule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
