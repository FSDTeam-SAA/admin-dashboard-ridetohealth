"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"

export default function VerifyOTPForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const type = searchParams.get("type") || "password_reset"

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      toast.error("Email is required")
      router.push("/forgot-password")
    }
  }, [email, router])

  const verifyOTPMutation = useMutation({
    mutationFn: (otpCode: string) => authApi.verifyOTP({ email, otp: otpCode, type }),
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success("OTP verified successfully!")
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Invalid OTP")
    },
  })

  const resendOTPMutation = useMutation({
    mutationFn: () => authApi.requestPasswordReset({ emailOrPhone: email }),
    onSuccess: () => {
      toast.success("OTP resent successfully!")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to resend OTP")
    },
  })

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("")
    if (otpCode.length !== 6) {
      toast.error("Please enter complete OTP")
      return
    }
    verifyOTPMutation.mutate(otpCode)
  }

  const isLoading = verifyOTPMutation.isPending

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-rose-50 p-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
          <p className="mt-2 text-sm text-gray-600">
            We'll send a verification code to your email.
            <br />
            Check your inbox and enter the code here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="h-14 w-14 rounded-xl border border-gray-300 bg-rose-100/50 text-center text-xl font-semibold text-gray-900 focus:border-[#B91C1C] focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/20"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Didn't receive OTP?</span>
            <button
              type="button"
              onClick={() => resendOTPMutation.mutate()}
              disabled={resendOTPMutation.isPending}
              className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              {resendOTPMutation.isPending ? "Sending..." : "RESEND OTP"}
            </button>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#B91C1C] text-white hover:bg-[#991B1B]"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </div>
    </div>
  )
}
