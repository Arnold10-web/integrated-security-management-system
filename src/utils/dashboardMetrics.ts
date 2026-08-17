import { Guard, ClientSite, Incident, Invoice, K9Dog, ArmouryItem } from '../types';

export interface ConsolidationResult {
  revenue: {
    paid: number;
    pending: number;
    overdue: number;
    total: number;
    collectionPercentage: number;
  };
  guards: {
    active: number;
    required: number;
    onDuty: number;
    suspended: number;
    distribution: Record<string, number>;
  };
  alerts: {
    total: number;
    open: number;
    critical: number;
    bySeverity: Record<string, number>;
  };
  executiveAttention: {
    criticalIncidents: number;
    nonCompliantSites: number;
    suspendedGuards: number;
    overdueRevenue: number;
  };
  duplicates: {
    removed: {
      revenue: number;
      guards: number;
      alerts: number;
    };
  };
  individualMetrics: {
    revenueCollection: {
      pct: number;
      amount: number;
      totalAmount: number;
    };
    guardStrength: {
      active: number;
      total: number;
      distribution: Record<string, number>;
    };
    activeSecurityAlerts: {
      total: number;
      open: number;
      critical: number;
    };
  };
}

export interface DashboardData {
  guards: Guard[];
  sites: ClientSite[];
  incidents: Incident[];
  invoices: Invoice[];
  k9s: K9Dog[];
  armoury: ArmouryItem[];
}

export function consolidateDashboardMetrics(data: DashboardData): ConsolidationResult {
  const { guards, sites, incidents, invoices } = data;

  // Revenue calculations
  const paidRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
  const overdueRevenue = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);
  const totalRevenue = invoices.reduce((sum, i) => sum + i.amount, 0);
  const collectionPercentage = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 10000) / 100 : 0;

  // Guard calculations
  const activeGuards = guards.filter(g => g.status === 'On Duty').length;
  const requiredGuards = guards.length;
  const suspendedGuards = guards.filter(g => g.status === 'Suspended').length;
  const guardDistribution = guards.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Alert calculations
  const totalAlerts = incidents.length;
  const openAlerts = incidents.filter(i => i.status !== 'Resolved').length;
  const criticalAlerts = incidents.filter(i => i.severity === 'Critical').length;
  const alertsBySeverity = incidents.reduce((acc, i) => {
    const key = i.severity.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Executive attention metrics (same as consolidated but more granular for alerts strip)
  const criticalIncidents = incidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length;
  const nonCompliantSites = sites.filter(s => s.slaStatus !== 'Compliant').length;
  const suspendedGuardsCount = guards.filter(g => g.status === 'Suspended').length;
  const overdueRevenueAmount = overdueRevenue;

  // Calculate duplicates to remove based on findings
  // F1: Revenue shown 3x -> remove 2 duplicates (keep 1)
  // F2: Guard count shown 3x -> remove 2 duplicates (keep 1)
  // F3: Security alerts shown 2x -> remove 1 duplicate (keep 1)
  const duplicates = {
    removed: {
      revenue: 2,
      guards: 2,
      alerts: 1,
    },
  };

  // Individual metrics for backward compatibility with existing components
  const revenueCollection = {
    pct: collectionPercentage,
    amount: paidRevenue,
    totalAmount: totalRevenue,
  };

  const guardStrength = {
    active: activeGuards,
    total: requiredGuards,
    distribution: guardDistribution,
  };

  const activeSecurityAlerts = {
    total: totalAlerts,
    open: openAlerts,
    critical: criticalAlerts,
  };

  return {
    revenue: {
      paid: paidRevenue,
      pending: pendingRevenue,
      overdue: overdueRevenue,
      total: totalRevenue,
      collectionPercentage,
    },
    guards: {
      active: activeGuards,
      required: requiredGuards,
      onDuty: activeGuards, // Same as active for now
      suspended: suspendedGuards,
      distribution: guardDistribution,
    },
    alerts: {
      total: totalAlerts,
      open: openAlerts,
      critical: criticalAlerts,
      bySeverity: alertsBySeverity,
    },
    executiveAttention: {
      criticalIncidents,
      nonCompliantSites,
      suspendedGuards: suspendedGuardsCount,
      overdueRevenue: overdueRevenueAmount,
    },
    duplicates,
    individualMetrics: {
      revenueCollection,
      guardStrength,
      activeSecurityAlerts,
    },
  };
}