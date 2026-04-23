// hooks/useNotifications.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";

export function useNotifications() {
  const queryClient = useQueryClient();
  
  const { data, ...rest } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll().then(res => res.data),
    staleTime: 30000, // 30 seconds
  });
  
  const unreadCount = data?.data?.notifications?.filter((n: any) => !n.isRead).length || 0;

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return {
    notifications: data?.data?.notifications || [],
    unreadCount,
    invalidateNotifications,
    ...rest
  };
}