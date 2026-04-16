import { createFileRoute } from '@tanstack/react-router';
import {
  ClientComparisonTable,
  PortfolioTrends,
  RiskMatrix,
} from '@/components/pages/analytics';

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Portfolio-level insights and client comparisons
        </p>
      </div>

      {/* Score Trends */}
      <PortfolioTrends />

      {/* Risk Matrix + Client Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RiskMatrix />
        <ClientComparisonTable />
      </div>
    </div>
  );
}
