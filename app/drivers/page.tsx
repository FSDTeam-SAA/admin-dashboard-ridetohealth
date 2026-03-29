"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { driversApi, taxiApi } from "@/lib/api";
import { toast } from "sonner";
import { ChevronDown, Eye, Trash2 } from "lucide-react";
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
import { DriverDetailsModal } from "@/components/drivers/driver-details";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DriverStatus = "pending" | "approved" | "rejected" | string;

interface DriverUser {
  _id: string; // user id
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImage: string | null;
}

interface Driver {
  _id: string; // ✅ driver document id (use this for assign)
  userId: DriverUser | null;
  vehicleId: string | null; // ✅ assigned vehicle id
  completedRides: number;
  status: DriverStatus;
}

interface DriversResponse {
  success: boolean;
  page: number;
  totalPages: number;
  totalDrivers: number;
  data: Driver[];
}

type VehicleService = {
  _id: string;
  name: string;
  description?: string;
  serviceImage?: string;
};

type VehicleDriverMini = {
  _id: string; // ✅ driver document id
  userId?: DriverUser;
  status?: string;
  isAvailable?: boolean;
  isOnline?: boolean;
};

type Vehicle = {
  _id: string; // ✅ vehicle id
  serviceId: VehicleService;
  driverId: VehicleDriverMini | null; // ✅ API returns object or null
  taxiName: string;
  model: string;
  plateNumber: string;
  color: string;
  year: number;
  vin: string;
  assignedDrivers: boolean;
};

type VehiclesResponse = {
  success: boolean;
  data: {
    vehicles: Vehicle[];
  };
};

function getInitials(name?: string) {
  if (!name) return "?";
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
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <tr key={i} className="border-b border-gray-200 last:border-0">
          <td className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </td>
          <td className="p-4">
            <Skeleton className="h-6 w-28" />
          </td>
          <td className="p-4">
            <Skeleton className="h-6 w-16" />
          </td>
          <td className="p-4">
            <Skeleton className="h-6 w-20" />
          </td>
          <td className="p-4">
            <Skeleton className="h-10 w-40" />
          </td>
          <td className="p-4">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // store selected vehicle per driverDocId (driver._id)
  const [selectedVehicleByDriver, setSelectedVehicleByDriver] = useState<
    Record<string, Vehicle | null>
  >({});

  // DRIVERS
  const { data, isLoading, isFetching, isSuccess, isError, error } = useQuery({
    queryKey: ["drivers", page],
    queryFn: async () => {
      const res = await driversApi.getAll(page);
      const body =
        (res as any)?.data?.success !== undefined ? (res as any).data : (res as any);
      return body as DriversResponse;
    },
    placeholderData: (prev) => prev,
  });

  const approvedDrivers = useMemo(() => {
    return (data?.data ?? []).filter((d) => d.status === "approved");
  }, [data]);

  // VEHICLES (Taxi API)
  const {
    data: vehiclesRes,
    isLoading: isVehiclesLoading,
    isFetching: isVehiclesFetching,
  } = useQuery({
    queryKey: ["vehicles", 1],
    queryFn: async () => {
      const res = await taxiApi.getAll(1);
      const body =
        (res as any)?.data?.success !== undefined ? (res as any).data : (res as any);
      return body as VehiclesResponse;
    },
    staleTime: 60_000,
  });

  const vehicles: Vehicle[] = Array.isArray(vehiclesRes?.data?.vehicles)
    ? vehiclesRes!.data.vehicles
    : [];

  // Map vehicles by id (so we can show currently assigned vehicle from driver.vehicleId)
  const vehicleById = useMemo(() => {
    const map: Record<string, Vehicle> = {};
    vehicles.forEach((v) => {
      map[v._id] = v;
    });
    return map;
  }, [vehicles]);

  // ASSIGN VEHICLE
  const assignVehicleMutation = useMutation({
    mutationFn: (payload: { vehicleId: string; driverId: string }) =>
      taxiApi.assignDriver(payload.vehicleId, payload.driverId),
    onSuccess: () => {
      toast.success("Vehicle assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to assign vehicle");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver deleted successfully");
    },
    onError: () => toast.error("Failed to delete driver"),
  });

  const handleDelete = (id: string) => setDriverToDelete(id);

  const confirmDelete = () => {
    if (!driverToDelete) return;
    deleteMutation.mutate(driverToDelete, {
      onSuccess: () => setDriverToDelete(null),
    });
  };

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDetailsOpen(true);
  };

  // ✅ use driver._id as driverId (driver document id)
  const handleAssign = (driver: Driver) => {
    const driverId = driver._id;
    const selectedVehicle =
      selectedVehicleByDriver[driver._id] ??
      (driver.vehicleId ? vehicleById[driver.vehicleId] : null);

    if (!driverId) return toast.error("Driver id not found");
    if (!selectedVehicle?._id) return toast.error("Please select a vehicle first");

    assignVehicleMutation.mutate({
      driverId,
      vehicleId: selectedVehicle._id,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers Profile</h1>
          <p className="text-gray-600 mt-1">Dashboard › Drivers Profile</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Drivers Name
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Phone Number
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Total Rides
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Vehicle
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading || isFetching ? (
                  <SkeletonRows />
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-red-500">
                      Failed to load drivers{" "}
                      {error instanceof Error ? `— ${error.message}` : ""}
                    </td>
                  </tr>
                ) : isSuccess && approvedDrivers.length > 0 ? (
                  approvedDrivers.map((driver) => {
                    const fullName = driver.userId?.fullName ?? "Unknown";
                    const phone = driver.userId?.phoneNumber ?? "-";

                    const currentAssignedVehicle = driver.vehicleId
                      ? vehicleById[driver.vehicleId] ?? null
                      : null;

                    // ✅ UI selection priority:
                    // 1) what user selected in UI
                    // 2) what backend says is assigned (driver.vehicleId)
                    const selectedVehicle =
                      selectedVehicleByDriver[driver._id] ??
                      currentAssignedVehicle ??
                      null;

                    // ✅ per-row loading (compare against driver._id)
                    const isAssigningThisRow =
                      assignVehicleMutation.isPending &&
                      assignVehicleMutation.variables?.driverId === driver._id;

                    return (
                      <tr
                        key={driver._id}
                        className="border-b border-gray-200 last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={driver.userId?.profileImage || undefined}
                              />
                              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-gray-900">{fullName}</p>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="text-sm text-gray-900">{phone}</p>
                        </td>

                        <td className="p-4">
                          <p className="text-sm text-gray-900">
                            {driver.completedRides ?? 0}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="text-sm text-gray-900 bg-green-100 px-2 py-1 rounded-md w-max">
                            {driver.status}
                          </p>
                        </td>

                        {/* Vehicle dropdown + Assign */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
                                >
                                  {selectedVehicle
                                    ? `${selectedVehicle.taxiName} (${selectedVehicle.plateNumber})`
                                    : "Select vehicle"}
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="start" className="w-[360px]">
                                {isVehiclesLoading || isVehiclesFetching ? (
                                  <div className="p-3 text-sm text-gray-500">
                                    Loading vehicles...
                                  </div>
                                ) : vehicles.length === 0 ? (
                                  <div className="p-3 text-sm text-gray-500">
                                    No vehicles found
                                  </div>
                                ) : (
                                  vehicles.map((v) => (
                                    <DropdownMenuItem
                                      key={v._id}
                                      className="flex items-center gap-3"
                                      onClick={() => {
                                        setSelectedVehicleByDriver((prev) => ({
                                          ...prev,
                                          [driver._id]: v,
                                        }));
                                        toast.success(`Selected: ${v.taxiName}`);
                                      }}
                                    >
                                      {v.serviceId?.serviceImage ? (
                                        <img
                                          src={v.serviceId.serviceImage}
                                          alt={v.serviceId?.name ?? "Vehicle"}
                                          className="h-9 w-9 rounded object-cover"
                                        />
                                      ) : (
                                        <div className="h-9 w-9 rounded bg-gray-100" />
                                      )}

                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                          {v.taxiName} — {v.plateNumber}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {v.serviceId?.name} • {v.model} • {v.color}
                                        </span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              size="sm"
                              onClick={() => handleAssign(driver)}
                              disabled={!selectedVehicle || isAssigningThisRow}
                            >
                              {isAssigningThisRow ? "Assigning..." : "Assign"}
                            </Button>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(driver)}
                              className="h-9 w-9 hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(driver._id)}
                              className="h-9 w-9 hover:bg-red-50"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : isSuccess ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No approved drivers found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <DriverDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedDriver(null);
            }}
            driver={selectedDriver}
          />

          <AlertDialog open={!!driverToDelete} onOpenChange={() => setDriverToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete this driver&#39;s profile. This
                  cannot be undone and may affect ride history records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>
                  No, Keep Driver
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Profile"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {data?.totalPages && data.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <PaginationControls
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
