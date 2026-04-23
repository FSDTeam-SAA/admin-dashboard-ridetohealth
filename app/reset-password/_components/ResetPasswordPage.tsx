"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api"

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!email) {
      toast.error("Email is required")
      router.push("/forgot-password")
    }
  }, [email, router])

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { emailOrPhone: string; newPassword: string }) =>
      authApi.resetPassword(data),
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success("Password reset successfully!")
        router.push("/login")
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reset password")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    resetPasswordMutation.mutate({ emailOrPhone: email, newPassword: formData.newPassword })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-rose-50 p-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Update Password</h2>
          <p className="mt-2 text-sm text-gray-600">Create your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* New Password */}
            <div>
              <Label className="text-sm font-medium text-gray-900">New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  required
                  className="h-12 rounded-xl pl-10 pr-10"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-sm font-medium text-gray-900">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="h-12 rounded-xl pl-10 pr-10"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="h-12 w-full rounded-xl bg-[#B91C1C] text-white"
          >
            {resetPasswordMutation.isPending ? "Updating..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  )
}
