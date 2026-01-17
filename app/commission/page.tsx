"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CommissionModal } from "@/components/commission/commission-modal";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { commissionApi } from "@/lib/api";
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

export default function CommissionPage() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);

  // State for Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // 1. Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ["commissions", page],
    queryFn: () => commissionApi.getAll(page),
  });

  // 2. Mutation for Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => commissionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success("Commission rule deleted successfully");
      setDeleteId(null); // Close dialog
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete commission"
      );
    },
  });

  const responseBody = data?.data?.data;
  const commissions =
    responseBody?.data ||
    responseBody?.commissions ||
    (Array.isArray(responseBody) ? responseBody : []) ||
    [];
  const totalPages =
    responseBody?.pagination?.pages || responseBody?.totalPages || 1;

  const handleEdit = (commission: any) => {
    setSelectedCommission(commission);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCommission(null);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Commission Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage service commission rules
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-[#8B0000] hover:bg-[#700000]"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Rule
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Title
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Commission
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : commissions.length > 0 ? (
                commissions.map((item: any) => (
                  <tr
                    key={item._id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {item.title}
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {item.commission}
                      {item.discountType === "percentage" ? "%" : "$"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(item._id)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No commission rules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* 1. Add/Edit Modal */}
      <CommissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedCommission}
      />

      {/* 2. Delete Confirmation Dialog (Yes/No) */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              commission rule from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function SkeletonRows() {
  return [...Array(5)].map((_, i) => (
    <tr key={i} className="border-b">
      <td colSpan={4} className="p-4">
        <Skeleton className="h-12 w-full" />
      </td>
    </tr>
  ));
}
