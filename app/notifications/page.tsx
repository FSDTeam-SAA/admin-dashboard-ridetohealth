"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CustomPagination } from "./_components/custom-pagination";

// -----------------------------
// Types
// -----------------------------
type User = {
  _id: string;
  fullName: string;
  profileImage: string | null;
};

type Notification = {
  _id: string;
  senderId: User | null;
  receiverId: User | null;
  title?: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type ApiResponse = {
  data: {
    notifications: Notification[];
    pagination?: {
      total: number;
      page: number;
      pages: number;
    };
    totalPages?: number; // Support both structures
  };
};

// -----------------------------
// Component
// -----------------------------
function Page() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // 1. Fetch notifications with pagination
  const { data, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: ["notifications", page],
    queryFn: () => notificationApi.getAll(page).then((res) => res.data),
    staleTime: 1 * 60 * 1000, 
  });

  const notifications = data?.data?.notifications || [];
  const totalPages = data?.data?.pagination?.pages || data?.data?.totalPages || 1;
  
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // 2. Mutation: Mark Single as Read (Optimistic)
  const markSingleAsRead = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", page] });
      const previous = queryClient.getQueryData<ApiResponse>(["notifications", page]);

      if (previous?.data?.notifications) {
        queryClient.setQueryData(["notifications", page], {
          ...previous,
          data: {
            ...previous.data,
            notifications: previous.data.notifications.map((n) =>
              n._id === id ? { ...n, isRead: true } : n
            ),
          },
        });
      }
      return { previous };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", page], context.previous);
      }
      toast.error("Failed to update notification");
    },
  });

  // 3. Mutation: Mark All as Read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.05 } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  if (isError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-red-500 font-medium">Error loading notifications</p>
          <p className="text-sm text-gray-500">{(error as any)?.message || "Try again later"}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-[#8B0000] text-white text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Stay updated with your latest activities</p>
          </div>

          {unreadCount > 0 && (
            <button
              className="flex items-center gap-2 text-sm font-medium text-[#8B0000] hover:text-[#700000] transition-colors"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              {markAllAsReadMutation.isPending ? "Processing..." : "Mark all as read"}
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">When you get notifications, they'll show up here.</p>
            </div>
          ) : (
            <>
              <motion.div 
                className="divide-y divide-gray-100" 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {notifications.map((notification) => {
                  const sender = notification.senderId;
                  const avatarUrl = sender?.profileImage;

                  return (
                    <motion.div
                      key={notification._id}
                      variants={itemVariants}
                      className={cn(
                        "flex items-start gap-4 p-5 transition-colors relative",
                        !notification.isRead ? "bg-blue-50/40 hover:bg-blue-50" : "bg-white hover:bg-gray-50"
                      )}
                      onClick={() => {
                        if (!notification.isRead) markSingleAsRead.mutate(notification._id);
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={sender?.fullName || "System"}
                            width={44}
                            height={44}
                            className="rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                        {!notification.isRead && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0 pt-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {sender?.fullName || "System Notification"}
                          </p>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed break-words">
                          {notification.title && (
                            <span className="font-bold text-gray-800 mr-1">{notification.title}:</span>
                          )}
                          {notification.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Pagination Section */}
              {totalPages > 1 && (
                <div className="p-4 border-t bg-gray-50/30">
                  <CustomPagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={(p) => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Page;