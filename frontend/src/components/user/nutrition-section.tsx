import { useState } from 'react';
import {
  UtensilsCrossed,
  Flame,
  Zap,
  Target,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  useNutritionSummary,
  useCreateMeal,
  useDeleteMeal,
} from '@/hooks/api/use-nutrition';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MealCreate } from '@/lib/api/types';

interface NutritionSectionProps {
  userId: string;
}

// ============================================================================
// Metric Card
// ============================================================================

interface MetricCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  value: string;
  label: string;
  sublabel?: string;
}

function MetricCard({
  icon: Icon,
  iconColor,
  iconBgColor,
  value,
  label,
  sublabel,
}: MetricCardProps) {
  return (
    <div className="p-4 border border-border rounded-lg bg-secondary/30">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-foreground-muted mt-1">
        {label}
        {sublabel && (
          <span className="ml-1 text-foreground-muted">({sublabel})</span>
        )}
      </p>
    </div>
  );
}

// ============================================================================
// Calorie Progress Ring
// ============================================================================

function CalorieRing({
  target,
  remaining,
}: {
  target: number;
  remaining: number;
}) {
  const used = target - remaining;
  const pct = Math.min(Math.max((used / target) * 100, 0), 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const isOver = remaining < 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            className={isOver ? 'text-destructive' : 'text-status-online'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {Math.round(target)}
          </span>
          <span className="text-xs text-foreground-muted">kcal goal</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Macro Bar
// ============================================================================

function MacroBar({
  label,
  grams,
  color,
}: {
  label: string;
  grams: number;
  color: string;
}) {
  // rough daily reference: protein 150g, carbs 250g, fat 65g
  const maxMap: Record<string, number> = {
    Protein: 150,
    Carbs: 250,
    Fat: 65,
  };
  const max = maxMap[label] || 100;
  const pct = Math.min((grams / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground-secondary">{label}</span>
        <span className="text-foreground font-medium">{Math.round(grams)}g</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Meal Type Badge
// ============================================================================

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-500/20 text-amber-400',
  lunch: 'bg-blue-500/20 text-blue-400',
  dinner: 'bg-purple-500/20 text-purple-400',
  snack: 'bg-emerald-500/20 text-status-online',
};

function MealTypeBadge({ type }: { type: string }) {
  const cls = MEAL_TYPE_COLORS[type] || 'bg-secondary-hover text-foreground';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {type}
    </span>
  );
}

// ============================================================================
// Add Meal Dialog
// ============================================================================

function AddMealDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MealCreate) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState('lunch');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    onSubmit({
      name,
      calories_kcal: Number(calories),
      protein_g: protein ? Number(protein) : null,
      carbs_g: carbs ? Number(carbs) : null,
      fat_g: fat ? Number(fat) : null,
      meal_type: mealType,
      eaten_at: now,
    });
    // reset
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealType('lunch');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Meal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-name">Name</Label>
            <Input
              id="meal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken salad"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-type">Meal type</Label>
            <select
              id="meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full h-9 rounded-md border border-border-hover bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-border-hover"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-calories">Calories (kcal)</Label>
            <Input
              id="meal-calories"
              type="number"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="meal-protein">Protein (g)</Label>
              <Input
                id="meal-protein"
                type="number"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-carbs">Carbs (g)</Label>
              <Input
                id="meal-carbs"
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-fat">Fat (g)</Label>
              <Input
                id="meal-fat"
                type="number"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving...' : 'Log Meal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function NutritionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-36 h-36 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 border border-border rounded-lg bg-secondary/30"
          >
            <div className="h-5 w-5 bg-muted rounded animate-pulse mb-3" />
            <div className="h-7 w-20 bg-muted rounded animate-pulse mb-1" />
            <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NutritionSection({ userId }: NutritionSectionProps) {
  const today = new Date().toISOString().split('T')[0];
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: summary, isLoading } = useNutritionSummary(userId, today);
  const { mutate: createMeal, isPending: isCreating } = useCreateMeal(userId);
  const { mutate: deleteMeal } = useDeleteMeal(userId);

  const handleCreateMeal = (data: MealCreate) => {
    createMeal(data, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const consumed = summary?.intake.total_kcal ?? 0;
  const target = summary?.budget.daily_target_kcal ?? 2000;
  const remaining = summary?.budget.remaining_kcal ?? target;
  const burned = summary?.expenditure.total_kcal;
  const meals = summary?.intake.meals ?? [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Nutrition</h3>
        <UtensilsCrossed className="h-4 w-4 text-foreground-muted" />
      </div>

      <div className="p-6">
        {isLoading ? (
          <NutritionSkeleton />
        ) : (
          <div className="space-y-6">
            {/* Calorie Ring + Metric Cards */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <CalorieRing target={target} remaining={remaining} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                <MetricCard
                  icon={Flame}
                  iconColor="text-orange-400"
                  iconBgColor="bg-orange-500/10"
                  value={`${Math.round(consumed)}`}
                  label="Consumed (kcal)"
                />
                <MetricCard
                  icon={Zap}
                  iconColor="text-yellow-400"
                  iconBgColor="bg-yellow-500/10"
                  value={burned != null ? `${Math.round(burned)}` : '—'}
                  label="Burned (kcal)"
                />
                <MetricCard
                  icon={Target}
                  iconColor={
                    remaining >= 0 ? 'text-status-online' : 'text-destructive'
                  }
                  iconBgColor={
                    remaining >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }
                  value={`${Math.round(remaining)}`}
                  label="Remaining (kcal)"
                />
              </div>
            </div>

            {/* Macro Bars */}
            <div>
              <h4 className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-4">
                Macros
              </h4>
              <div className="space-y-3">
                <MacroBar
                  label="Protein"
                  grams={summary?.intake.protein_g ?? 0}
                  color="bg-blue-500"
                />
                <MacroBar
                  label="Carbs"
                  grams={summary?.intake.carbs_g ?? 0}
                  color="bg-amber-500"
                />
                <MacroBar
                  label="Fat"
                  grams={summary?.intake.fat_g ?? 0}
                  color="bg-rose-500"
                />
              </div>
            </div>

            {/* Meals List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Today's Meals
                </h4>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Meal
                </Button>
              </div>

              {meals.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted text-sm">
                  No meals logged today. Click "Add Meal" to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/30 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MealTypeBadge type={meal.meal_type} />
                        <span className="text-sm text-foreground truncate">
                          {meal.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-medium text-foreground">
                            {Math.round(meal.calories_kcal)} kcal
                          </span>
                          {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                            <p className="text-[10px] text-foreground-muted">
                              P:{Math.round(meal.protein_g ?? 0)} C:
                              {Math.round(meal.carbs_g ?? 0)} F:
                              {Math.round(meal.fat_g ?? 0)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteMeal(meal.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-foreground-muted hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AddMealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateMeal}
        isPending={isCreating}
      />
    </div>
  );
}
