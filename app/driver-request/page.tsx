"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { driversApi, type DriverItem, type DriversListResponse } from "@/lib/api";
import { Trash2, MoreVertical, Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-gray-200 last:border-0">
          <td className="p-4" colSpan={5}>
            <Skeleton className="h-10 w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function DriverRequestPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  // confirmation modal
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);

  const {
    data: driversRes,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
  } = useQuery({
    queryKey: ["driver-requests", page],
    queryFn: async () => {
      const res = await driversApi.getAll(page);
      return res as DriversListResponse;
    },
    // keep old page rows while loading the next page
    placeholderData: (prev) => prev,
  });

  // IMPORTANT:
  // Your API seems to return shape: { data: DriverItem[], totalPages, ... }
  // So list should be driversRes?.data
  const pendingDrivers = useMemo(() => {
    const list: DriverItem[] = Array.isArray(driversRes?.data)
      ? driversRes.data
      : [];
    return list.filter((d) => d.status === "pending");
  }, [driversRes]);

  const totalPages = driversRes?.totalPages ?? 1;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (driverId: string) => driversApi.approve(driverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver approved");
    },
    onError: () => toast.error("Failed to approve driver"),
  });

  const rejectMutation = useMutation({
    mutationFn: (driverId: string) => driversApi.reject(driverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver rejected");
    },
    onError: () => toast.error("Failed to reject driver"),
  });

  const deleteMutation = useMutation({
    mutationFn: (driverId: string) => driversApi.delete(driverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      setDriverToDelete(null);
      toast.success("Driver request deleted");
    },
    onError: () => toast.error("Failed to delete request"),
  });

  const handleConfirmDelete = () => {
    if (driverToDelete) deleteMutation.mutate(driverToDelete);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Request</h1>
          <p className="text-gray-600 mt-1">Dashboard › Driver Request</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Driver Name
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Phone Number
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* ✅ show skeleton on initial load OR while fetching another page */}
                {isLoading || isFetching ? (
                  <SkeletonRows />
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-red-500">
                      Failed to load driver requests{" "}
                      {error instanceof Error ? `— ${error.message}` : ""}
                    </td>
                  </tr>
                ) : isSuccess && pendingDrivers.length > 0 ? (
                  pendingDrivers.map((driver: DriverItem) => (
                    <tr
                      key={driver._id}
                      className="border-b border-gray-200 last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {initials(driver.userId?.fullName || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {driver.userId?.fullName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">{driver._id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-sm">
                        {driver.userId?.phoneNumber || "-"}
                      </td>

                      <td className="p-4 text-sm">{driver.userId?.email || "-"}</td>

                      <td className="p-4">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          pending
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => approveMutation.mutate(driver._id)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => rejectMutation.mutate(driver._id)}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="mr-2 h-4 w-4 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 hover:bg-red-50"
                            onClick={() => setDriverToDelete(driver._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : isSuccess ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No pending driver requests found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Optional pagination UI (plug in your own component) */}
          {/* Example:
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
          */}
        </div>

        {/* Delete Confirmation Modal */}
        <AlertDialog
          open={!!driverToDelete}
          onOpenChange={() => setDriverToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the driver request from the database.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                No, Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
