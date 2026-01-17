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
import { Loader2, Search } from "lucide-react"

interface CommissionModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any // Pass the commission object here when editing
}

export function CommissionModal({ isOpen, onClose, initialData }: CommissionModalProps) {
  const queryClient = useQueryClient()
  const isEditMode = !!initialData

  // 1. Form State
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

  // 2. Fetch Available Services from API
  const { data: servicesResponse, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services-list"],
    queryFn: () => servicesApi.getAll(1),
    enabled: isOpen, // Only fetch when modal is active
  })

  const servicesList = servicesResponse?.data?.data || []

  // 3. Populate Form on Open (Handle Add vs Edit)
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
          applicableServices: initialData.applicableServices || [],
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

  // 4. Mutation for Create/Update
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

  // 5. Handlers
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
      toast.error("Title and Commission value are required")
      return
    }

    if (formData.applicableServices.length === 0) {
      toast.error("Select at least one service")
      return
    }

    const payload = {
      ...formData,
      commission: Number(formData.commission),
      // Ensure dates aren't empty strings if optional in backend
      endDate: formData.endDate || undefined, 
    }

    mutation.mutate(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditMode ? "Edit Commission Rule" : "Create Commission Rule"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Title & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Rule Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Standard Platform Fee"
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide context for this commission rate..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
            />
          </div>

          {/* Commission Value & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountType">Commission Type</Label>
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
              <Label htmlFor="commission">Value *</Label>
              <Input
                id="commission"
                type="number"
                placeholder={formData.discountType === "percentage" ? "10" : "5.00"}
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Applicable Services Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Select Applicable Services *</Label>
              <span className="text-xs text-gray-500">
                {formData.applicableServices.length} Selected
              </span>
            </div>

            <div className="border rounded-lg bg-gray-50 p-2">
              {isLoadingServices ? (
                <div className="h-32 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <p className="text-xs text-gray-400">Loading services...</p>
                </div>
              ) : (
                <ScrollArea className="h-40 w-full pr-3">
                  <div className="grid grid-cols-1 gap-2">
                    {servicesList.map((service: any) => (
                      <div
                        key={service._id}
                        className="flex items-center space-x-3 p-2 bg-white rounded border border-gray-200 hover:border-[#8B0000] transition-colors"
                      >
                        <Checkbox
                          id={`service-${service._id}`}
                          checked={formData.applicableServices.includes(service._id)}
                          onCheckedChange={() => toggleService(service._id)}
                        />
                        <label
                          htmlFor={`service-${service._id}`}
                          className="flex-1 text-sm font-medium cursor-pointer flex justify-between"
                        >
                          <span>{service.name}</span>
                          <span className="text-xs text-gray-400">ID: ...{service._id.slice(-5)}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#8B0000] hover:bg-[#700000] min-w-[120px]"
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