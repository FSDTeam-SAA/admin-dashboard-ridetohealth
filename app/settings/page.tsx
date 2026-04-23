"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { profileApi } from "@/lib/api"
import { toast } from "sonner"
import ChangePasswordDialog from "./_components/chenge-password"

interface ProfileData {
  fullName?: string
  email?: string
  phoneNumber?: string
  country?: string
  city?: string
  state?: string
  zipcode?: string
  street_address?: string
  profileImage?: string
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [profile, setProfile] = useState<ProfileData>({})
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({})
  const [preview, setPreview] = useState("")
  const [openChangePassword, setOpenChangePassword] = useState(false)

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await profileApi.getProfile()
      return res.data.data as ProfileData
    },
  })

  useEffect(() => {
    if (profileData) {
      setProfile(profileData)
      setOriginalProfile(profileData)
      setPreview(profileData.profileImage || "")
    }
  }, [profileData])

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ProfileData>) => profileApi.updateProfile(data),
    onSuccess: () => {
      setOriginalProfile(profile)
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      toast.success("Profile updated successfully")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update profile")
    },
  })

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadProfileImage(file),
    onSuccess: (res) => {
      const imageUrl = res.data.data.profileImage
      setProfile((prev) => ({ ...prev, profileImage: imageUrl }))
      setOriginalProfile((prev) => ({ ...prev, profileImage: imageUrl }))
      setPreview(imageUrl)
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      toast.success("Profile image updated")
    },
    onError: () => {
      toast.error("Failed to upload image")
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setProfile((prev) => ({ ...prev, [id]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    uploadImageMutation.mutate(file)
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile)

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-96">
          <p>Loading profile...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Dashboard › Settings</p>
          </div>

          <Button
            variant="outline"
            className="text-sm text-blue-600 hover:underline cursor-pointer border-blue-600 px-8"
            onClick={() => setOpenChangePassword(true)}
          >
            Change Password
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Profile Settings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center gap-6">
              <Avatar className="h-28 w-28 ring-4 ring-gray-100">
                <AvatarImage src={preview} />
                <AvatarFallback className="text-2xl">
                  {profile.fullName?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 cursor-pointer">
                <Label htmlFor="profileImage">Profile Picture</Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadImageMutation.isPending}
                  className="cursor-pointer"
                />
                {uploadImageMutation.isPending && (
                  <p className="text-sm text-blue-600 cursor-pointer">Uploading...</p>
                )}
                <p className="text-sm text-gray-500">JPG, PNG up to 5MB</p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={profile.fullName || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" value={profile.phoneNumber || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street_address">Street Address</Label>
                <Input id="street_address" value={profile.street_address || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={profile.city || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={profile.state || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipcode">Zip Code</Label>
                <Input id="zipcode" value={profile.zipcode || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={profile.country || ""} onChange={handleChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => updateProfileMutation.mutate(profile)}
            disabled={updateProfileMutation.isPending || !hasChanges || uploadImageMutation.isPending}
            className="bg-[#8B0000] hover:bg-[#700000] px-8"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={openChangePassword}
        onOpenChange={setOpenChangePassword}
      />
    </MainLayout>
  )
}
