"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.requestPasswordReset({ emailOrPhone: email }),
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success("OTP sent successfully!")
        router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=password_reset`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send OTP")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-rose-50 p-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the email address associated with your account.
            <br />
            We'll send you an OTP to your email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-900">
              Email
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="h-12 rounded-xl border-gray-300 pl-10 placeholder:text-gray-400"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#B91C1C] text-base font-medium text-white hover:bg-[#991B1B]"
            disabled={isPending}
          >
            {isPending ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      </div>
    </div>
  )
}
