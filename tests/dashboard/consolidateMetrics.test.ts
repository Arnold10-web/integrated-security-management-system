import { describe, it, expect, beforeEach } from 'vitest';
import { ConsolidationResult, consolidateDashboardMetrics } from '../../src/utils/dashboardMetrics';

interface MockDashboardData {
  guards: Array<{ id: string; status: string; designation?: string; region?: string; }>;
  sites: Array<{ id: string; slaStatus?: string; region?: string; dayShiftArmed?: number; nightShiftArmed?: number; }>;
  incidents: Array<{ id: string; severity: string; status: string; }>;
  invoices: Array<{ id: string; status: string; amount: number; }>;
  k9s: Array<{ id: string; status: string; }>;
  armoury: Array<{ id: string; location: string; }>;
}

describe('Dashboard Metric Consolidation', () => {
  beforeEach(() => {
    // Setup test data with duplicate metrics to consolidate
    // This simulates the current state where metrics are shown in multiple places
  });

  it('should consolidate duplicate revenue metrics into single metric with paid/pending/overdue breakdown', () => {
    const mockData: MockDashboardData = {
      guards: [],
      sites: [],
      incidents: [],
      invoices: [
        { id: '1', status: 'Paid', amount: 50000 },
        { id: '2', status: 'Pending', amount: 30000 },
        { id: '3', status: 'Overdue', amount: 20000 },
        { id: '4', status: 'Paid', amount: 25000 },
      ],
      k9s: [],
      armoury: [],
    };

    const result = consolidateDashboardMetrics(mockData);

    // Verify revenue is consolidated with single metric structure
    expect(result.revenue).toBeDefined();
    expect(result.revenue.paid).toBe(75000); // 50000 + 25000
    expect(result.revenue.pending).toBe(30000);
    expect(result.revenue.overdue).toBe(20000);
    expect(result.revenue.total).toBe(125000);
    expect(result.revenue.collectionPercentage).toBe(60); // (75000/125000) * 100

    // Verify no duplicate revenue metrics exist
    expect(result.duplicates.removed.revenue).toBe(2); // Remove 2 duplicates (from DashboardKpiCards and EnterpriseAnalyticsPanel)
  });

  it('should consolidate duplicate guard metrics into single metric with active/required/onDuty breakdown', () => {
    const mockData: MockDashboardData = {
      guards: [
        { id: '1', status: 'On Duty', designation: 'Guard' },
        { id: '2', status: 'On Duty', designation: 'Guard' },
        { id: '3', status: 'On Duty', designation: 'Guard' },
        { id: '4', status: 'Off Duty', designation: 'Guard' },
        { id: '5', status: 'Suspended', designation: 'Guard' },
        { id: '6', status: 'On Leave', designation: 'Guard' },
      ],
      sites: [],
      incidents: [],
      invoices: [],
      k9s: [],
      armoury: [],
    };

    const result = consolidateDashboardMetrics(mockData);

    // Verify guard metrics are consolidated
    expect(result.guards).toBeDefined();
    expect(result.guards.active).toBe(3); // On Duty
    expect(result.guards.required).toBe(6); // Total
    expect(result.guards.onDuty).toBe(3); // Same as active for now
    expect(result.guards.distribution).toBeDefined();
    expect(result.guards.distribution['On Duty']).toBe(3);
    expect(result.guards.distribution['Suspended']).toBe(1);

    // Verify no duplicate guard metrics exist
    expect(result.duplicates.removed.guards).toBe(2); // Remove 2 duplicates (from DashboardKpiCards and EnterpriseAnalyticsPanel)
  });

  it('should consolidate duplicate alert metrics into single metric merging security and incidents', () => {
    const mockData: MockDashboardData = {
      guards: [],
      sites: [],
      incidents: [
        { id: '1', severity: 'Critical', status: 'Open' },
        { id: '2', severity: 'High', status: 'Open' },
        { id: '3', severity: 'Medium', status: 'Resolved' },
        { id: '4', severity: 'Critical', status: 'Open' },
      ],
      invoices: [],
      k9s: [],
      armoury: [],
    };

    const result = consolidateDashboardMetrics(mockData);

    // Verify alert metrics are consolidated
    expect(result.alerts).toBeDefined();
    expect(result.alerts.total).toBe(4); // All incidents
    expect(result.alerts.open).toBe(3); // Critical + High (assuming Open = not Resolved)
    expect(result.alerts.critical).toBe(2); // Critical severity
    expect(result.alerts.bySeverity).toBeDefined();
    expect(result.alerts.bySeverity.critical).toBe(2);
    expect(result.alerts.bySeverity.high).toBe(1);

    // Verify no duplicate alert metrics exist
    expect(result.duplicates.removed.alerts).toBe(1); // Remove 1 duplicate (from DashboardKpiCards)
  });

  it('should maintain executive attention metrics separate from consolidated metrics', () => {
    const mockData: MockDashboardData = {
      guards: [
        { id: '1', status: 'Suspended' },
        { id: '2', status: 'On Duty' },
      ],
      sites: [
        { id: '1', slaStatus: 'Non-Compliant' },
        { id: '2', slaStatus: 'Compliant' },
      ],
      incidents: [
        { id: '1', severity: 'Critical', status: 'Open' },
      ],
      invoices: [
        { id: '1', status: 'Overdue', amount: 50000 },
      ],
      k9s: [],
      armoury: [],
    };

    const result = consolidateDashboardMetrics(mockData);

    // Verify executive attention metrics are preserved for ExecutiveAlertsStrip
    expect(result.executiveAttention).toBeDefined();
    expect(result.executiveAttention.criticalIncidents).toBe(1);
    expect(result.executiveAttention.nonCompliantSites).toBe(1);
    expect(result.executiveAttention.suspendedGuards).toBe(1);
    expect(result.executiveAttention.overdueRevenue).toBe(50000);

    // Verify executive attention is separate from consolidated metrics
    expect(result.revenue.overdue).toBe(50000);
    expect(result.guards.suspended).toBe(1);
    expect(result.alerts.critical).toBe(1);
  });

  it('should provide backward compatibility by returning individual metrics for existing components', () => {
    const mockData: MockDashboardData = {
      guards: [
        { id: '1', status: 'On Duty', designation: 'Guard' },
        { id: '2', status: 'On Duty', designation: 'Guard' },
      ],
      sites: [],
      incidents: [
        { id: '1', severity: 'Critical', status: 'Open' },
      ],
      invoices: [
        { id: '1', status: 'Paid', amount: 10000 },
        { id: '2', status: 'Overdue', amount: 5000 },
      ],
      k9s: [],
      armoury: [],
    };

    const result = consolidateDashboardMetrics(mockData);

    // Verify individual metrics are still available for existing components
    expect(result.individualMetrics).toBeDefined();
    expect(result.individualMetrics.revenueCollection).toBeDefined(); // For DashboardKpiCards
    expect(result.individualMetrics.revenueCollection.pct).toBe(66.67); // (10000/15000) * 100
    expect(result.individualMetrics.revenueCollection.amount).toBe(10000);

    expect(result.individualMetrics.guardStrength).toBeDefined(); // For EnterpriseAnalyticsPanel
    expect(result.individualMetrics.guardStrength.active).toBe(2);
    expect(result.individualMetrics.guardStrength.total).toBe(2);

    expect(result.individualMetrics.activeSecurityAlerts).toBeDefined(); // For DashboardKpiCards
    expect(result.individualMetrics.activeSecurityAlerts.total).toBe(1);
    expect(result.individualMetrics.activeSecurityAlerts.open).toBe(1);
  });
});