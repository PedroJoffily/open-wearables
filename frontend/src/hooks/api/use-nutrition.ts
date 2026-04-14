import { useMutation, useQuery } from '@tanstack/react-query';
import { healthService } from '@/lib/api/services/health.service';
import type { MealCreate } from '@/lib/api/types';
import { queryKeys } from '@/lib/query/keys';
import { queryClient } from '@/lib/query/client';
import { toast } from 'sonner';

export function useNutritionSummary(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.health.nutritionSummary(userId, { date }),
    queryFn: () => healthService.getNutritionSummary(userId, { date }),
    enabled: !!userId && !!date,
  });
}

export function useNutritionMeals(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.health.nutritionMeals(userId, { date }),
    queryFn: () => healthService.getMeals(userId, { date }),
    enabled: !!userId && !!date,
  });
}

export function useCreateMeal(userId: string) {
  return useMutation({
    mutationFn: (data: MealCreate) => healthService.createMeal(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.health.all, 'nutritionSummary', userId],
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.health.all, 'nutritionMeals', userId],
      });
      toast.success('Meal logged successfully');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to log meal';
      toast.error(message);
    },
  });
}

export function useDeleteMeal(userId: string) {
  return useMutation({
    mutationFn: (mealId: string) => healthService.deleteMeal(userId, mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.health.all, 'nutritionSummary', userId],
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.health.all, 'nutritionMeals', userId],
      });
      toast.success('Meal deleted');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to delete meal';
      toast.error(message);
    },
  });
}
