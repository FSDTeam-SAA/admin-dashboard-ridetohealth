"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TaxiModal } from "@/components/taxi/taxi-modal";
import { taxiApi } from "@/lib/api";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
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
import Image from "next/image";

const FALLBACK_TAXI_IMAGE = "/taxi-car.jpg";

interface Taxi {
  _id: string;
  taxiName: string;
  model: string;
  plateNumber: string;
  color: string;
  year: number;
  vin: string;
  serviceId: {
    _id: string;
    name: string;
    description?: string;
    serviceImage?: string;
  };
  driverId: {
    _id: string;
    userId: {
      fullName: string;
    };
  } | null;
  createdAt: string;
}

export default function TaxiPage() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaxi, setSelectedTaxi] = useState<Taxi | null>(null);
  const queryClient = useQueryClient();
  const [taxiToDelete, setTaxiToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["taxis", page],
    queryFn: async () => {
      const response = await taxiApi.getAll(page);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taxiApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxis"] });
      toast.success("Taxi deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete taxi");
    },
  });

  const handleEdit = (taxi: Taxi) => {
    setSelectedTaxi(taxi);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setTaxiToDelete(id);
  };

  const confirmDelete = () => {
    if (taxiToDelete) {
      deleteMutation.mutate(taxiToDelete);
      setTaxiToDelete(null);
    }
  };

  const handleAddNew = () => {
    setSelectedTaxi(null);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Taxi</h1>
            <p className="text-gray-600 mt-1">Dashboard › Taxi</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-[#8B0000] hover:bg-[#700000]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Taxi
          </Button>
        </div>

        {/* Taxi Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Taxi Number
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Driver ID
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i} className="border-b border-gray-200 last:border-0">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-20 rounded" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </td>
                        <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-9 w-9" />
                            <Skeleton className="h-9 w-9" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : data?.data?.vehicles?.length > 0 ? (
                  data.data.vehicles.map((taxi: Taxi) => (
                    <tr
                      key={taxi._id}
                      className="border-b border-gray-200 last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                            <Image
                              src={taxi.serviceId?.serviceImage || FALLBACK_TAXI_IMAGE}
                              width={500}
                              height={500}
                              alt={`${taxi.taxiName} service`}
                              className="h-full w-full "
                              onError={(e) => {
                                if (e.currentTarget.src.endsWith(FALLBACK_TAXI_IMAGE)) {
                                  return;
                                }

                                e.currentTarget.src = FALLBACK_TAXI_IMAGE;
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{taxi.taxiName}</p>
                            <p className="text-xs text-gray-500">{taxi.serviceId?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-900">{taxi.plateNumber}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-900">
                          {taxi.driverId?.userId?.fullName || "Unassigned"}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600">
                          {new Date(taxi.createdAt).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(taxi)}
                            className="h-9 w-9 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(taxi._id)}
                            className="h-9 w-9 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No taxis found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data?.data?.pagination?.pages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <PaginationControls
                currentPage={page}
                totalPages={data.data.pagination.pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taxiToDelete} onOpenChange={() => setTaxiToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the taxi and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Modal */}
      <TaxiModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTaxi(null);
        }}
        taxi={selectedTaxi}
      />
    </MainLayout>
  );
}
