"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ridesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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

/* ================= TYPES ================= */

type RideStatus =
  | "requested"
  | "accepted"
  | "arrived"
  | "started"
  | "completed"
  | "cancelled"
  | string;

type PaymentStatus = "pending" | "paid" | "failed" | string;

interface TripHistoryResponse {
  success: boolean;
  data: {
    rides: RideItem[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  };
}

interface RideItem {
  _id: string;
  customerId?: {
    _id: string;
    fullName?: string;
  } | null;
  driverId?: string | null;
  totalFare?: number;
  status?: RideStatus;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
}

/* ================= HELPERS ================= */

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const shortId = (id: string) => id.slice(-8);

/* ================= COMPONENT ================= */

export default function RideHistoryPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  /* ---------- FETCH RIDES ---------- */
  const { data, isLoading } = useQuery<TripHistoryResponse>({
    queryKey: ["rides", page],
    queryFn: async () => {
      const res = await ridesApi.getAll(page);
      return res.data as TripHistoryResponse;
    },
    placeholderData: keepPreviousData,
  });

  const rides = data?.data?.rides ?? [];
  const totalPages = data?.data?.pagination?.pages ?? 1;

  /* ---------- DELETE MUTATION ---------- */
  const deleteRideMutation = useMutation({
    mutationFn: (id: string) => ridesApi.delete(id),
    onSuccess: () => {
      toast.success("Ride deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      setOpen(false);
      setSelectedRideId(null);
    },
    onError: () => {
      toast.error("Failed to delete ride");
    },
  });

  const openDeleteModal = (id: string) => {
    setSelectedRideId(id);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!selectedRideId) return;
    deleteRideMutation.mutate(selectedRideId);
  };

  /* ================= RENDER ================= */

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ride History</h1>
          <p className="text-gray-600 mt-1">Dashboard › Ride History</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  {[
                    "Ride ID",
                    "Date",
                    "Customer",
                    "Driver",
                    "Amount",
                    "Ride Status",
                    "Payment Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left p-4 text-sm font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(7)].map((__, j) => (
                        <td key={j} className="p-4">
                          <Skeleton className="h-6 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rides.length ? (
                  rides.map((ride) => {
                    const rideStatus = ride.status ?? "-";
                    const paymentStatus = ride.paymentStatus ?? "-";

                    const rideBadge =
                      rideStatus === "completed"
                        ? "bg-green-100 text-green-700"
                        : rideStatus === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-800";

                    const paymentBadge =
                      paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : paymentStatus === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700";

                    return (
                      <tr
                        key={ride._id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">{shortId(ride._id)}</td>
                        <td className="p-4">{formatDate(ride.createdAt)}</td>
                        <td className="p-4">
                          {ride.customerId?.fullName ?? "Unknown"}
                        </td>
                        <td className="p-4">{ride.driverId ?? "-"}</td>
                        <td className="p-4">
                          ${ride.totalFare?.toLocaleString() ?? 0}
                        </td>
                        <td className="p-4">
                          <Badge className={rideBadge}>
                            {rideStatus}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={paymentBadge}>
                            {paymentStatus}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDeleteModal(ride._id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No rides found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete ride?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteRideMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteRideMutation.isPending
                  ? "Deleting..."
                  : "Yes, delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
