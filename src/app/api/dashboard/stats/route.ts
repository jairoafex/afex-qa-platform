import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Estados que se consideran "aprobados" (activo + legado)
const APPROVED_STATUSES = ['APPROVED', 'PASSED']
// Estados que se consideran "ejecutados" (excluye PENDING e IN_PROGRESS)
const EXECUTED_STATUSES = ['APPROVED', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED', 'OUT_OF_SCOPE']

const TEST_TYPE_LABELS: Record<string, string> = {
  FUNCTIONAL: 'Funcional', INTEGRATION: 'Integración', REGRESSION: 'Regresión',
  SMOKE: 'Smoke', E2E: 'E2E', API: 'API', PERFORMANCE: 'Rendimiento',
  SECURITY: 'Seguridad', USABILITY: 'Usabilidad',
}
const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítica', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja',
}
const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

// Mapea un preset de período a fechas concretas
function resolvePeriod(period: string | null): { gte?: Date; lte?: Date } {
  if (!period || period === 'all') return {}
  const now = new Date()
  const gte = new Date(now)
  switch (period) {
    case 'week':   gte.setDate(now.getDate() - 7);   break
    case 'month':  gte.setDate(now.getDate() - 30);  break
    case 'quarter':gte.setDate(now.getDate() - 90);  break
    default: return {}
  }
  return { gte }
}

// GET - Obtener estadísticas del dashboard
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const testPlanId = searchParams.get('testPlanId') // Caso de prueba (tarea JIRA)
    const celulaId   = searchParams.get('celulaId')
    const qaId       = searchParams.get('qaId')
    const period     = searchParams.get('period')     // week | month | quarter | all | custom
    const dateFrom   = searchParams.get('dateFrom')   // para period=custom
    const dateTo     = searchParams.get('dateTo')

    // ── Rango de fechas ──
    // Si period=custom usamos dateFrom/dateTo directamente, si no usamos el preset
    let dateRange: { gte?: Date; lte?: Date } = period === 'custom' ? {} : resolvePeriod(period)
    if (period === 'custom' && dateFrom) dateRange.gte = new Date(dateFrom)
    if (period === 'custom' && dateTo)   dateRange.lte = new Date(dateTo + 'T23:59:59')

    // ── Filtros sobre testCase ──
    const where: any = {}

    // Filtro directo por plan de prueba (tarea JIRA)
    if (testPlanId) where.testPlanId = testPlanId

    // Filtros sobre el plan padre: célula y QA
    const planFilter: any = {}
    if (celulaId) planFilter.celulaId = celulaId
    if (qaId)     planFilter.qaId     = qaId
    if (Object.keys(planFilter).length > 0) where.testPlan = planFilter

    // Rango de fechas sobre createdAt del caso
    if (dateRange.gte || dateRange.lte) {
      where.createdAt = {}
      if (dateRange.gte) where.createdAt.gte = dateRange.gte
      if (dateRange.lte) where.createdAt.lte = dateRange.lte
    }

    // Filtro base sin fechas — actividad reciente siempre toma 30 días
    const baseWhere: any = {}
    if (testPlanId) baseWhere.testPlanId = testPlanId
    if (Object.keys(planFilter).length > 0) baseWhere.testPlan = planFilter

    // Filtro para planes de prueba
    const planWhere: any = { ...planFilter }
    if (testPlanId) planWhere.id = testPlanId

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Todas las queries en paralelo para máxima performance
    const [
      totalTestCases,
      statusCounts,
      bySystemGroups,
      bySystemStatusGroups,
      byTestType,
      byPriority,
      byPlatform,
      recentCases,
      criticalFailedCases,
      highPriorityPending,
      casesWithoutSteps,
      casesWithEvidence,
      executedCasesForAvg,
      totalPlans,
      planStatusCounts,
      plansWithCelula,
    ] = await Promise.all([
      prisma.testCase.count({ where }),
      prisma.testCase.groupBy({ by: ['status'], where, _count: true }),
      prisma.testCase.groupBy({ by: ['systemId'], where, _count: true }),
      prisma.testCase.groupBy({
        by: ['systemId', 'status'],
        where: { ...where, systemId: { not: null } },
        _count: true,
      }),      prisma.testCase.groupBy({ by: ['testType'], where, _count: true }),
      prisma.testCase.groupBy({ by: ['priority'], where, _count: true }),
      prisma.testCase.groupBy({
        by: ['platform'],
        where: { ...where, platform: { not: null } },
        _count: true,
      }),
      // Actividad usa baseWhere para no hacer conflicto con filtro de createdAt
      prisma.testCase.findMany({
        where: { ...baseWhere, executedAt: { gte: thirtyDaysAgo } },
        select: { executedAt: true, status: true },
      }),
      // Indicadores de riesgo
      prisma.testCase.count({ where: { ...where, status: 'FAILED', priority: 'CRITICAL' } }),
      prisma.testCase.count({
        where: { ...where, status: { in: ['PENDING', 'IN_PROGRESS'] }, priority: { in: ['CRITICAL', 'HIGH'] } },
      }),
      prisma.testCase.count({
        where: { ...where, OR: [{ steps: null }, { steps: '' }] },
      }),
      prisma.testCase.count({
        where: { ...where, attachments: { some: {} } },
      }),
      // Muestra de casos ejecutados para calcular velocidad promedio (max 500)
      prisma.testCase.findMany({
        where: { ...where, executedAt: { not: null } },
        select: { createdAt: true, executedAt: true },
        take: 500,
        orderBy: { executedAt: 'desc' },
      }),
      // Planes de prueba
      prisma.testPlan.count({ where: planWhere }),
      prisma.testPlan.groupBy({ by: ['status'], where: planWhere, _count: true }),
      // Datos por célula — se agrupa en memoria
      prisma.testPlan.findMany({
        where: { ...planWhere, celulaId: { not: null } },
        select: {
          celulaId: true,
          celula: { select: { id: true, name: true } },
          testCases: { where, select: { status: true } },
        },
      }),
    ])

    // ── Agregación por estado ──
    const stats: any = {
      totalTestCases,
      approvedCases: 0,
      failedCases: 0,
      inProgressCases: 0,
      pendingCases: 0,
      blockedCases: 0,
      outOfScopeCases: 0,
      skippedCases: 0,
      // Indicadores de riesgo
      criticalFailedCases,
      highPriorityPending,
      casesWithoutSteps,
      casesWithEvidence,
      casesWithoutEvidence: totalTestCases - casesWithEvidence,
      // Planes
      totalPlans,
      activePlans: 0,
      completedPlans: 0,
      pendingPlans: 0,
      cancelledPlans: 0,
    }

    statusCounts.forEach((item: any) => {
      switch (item.status) {
        case 'APPROVED':
        case 'PASSED':
          stats.approvedCases += item._count; break
        case 'FAILED':      stats.failedCases = item._count; break
        case 'IN_PROGRESS': stats.inProgressCases = item._count; break
        case 'PENDING':     stats.pendingCases = item._count; break
        case 'BLOCKED':     stats.blockedCases = item._count; break
        case 'OUT_OF_SCOPE':stats.outOfScopeCases = item._count; break
        case 'SKIPPED':     stats.skippedCases = item._count; break
      }
    })

    // Casos ejecutados = todos menos PENDING e IN_PROGRESS
    const executedCases =
      stats.approvedCases + stats.failedCases + stats.blockedCases +
      stats.skippedCases + stats.outOfScopeCases
    stats.executedCases = executedCases
    stats.passRate  = executedCases > 0 ? Math.round((stats.approvedCases / executedCases) * 100) : 0
    stats.defectRate = executedCases > 0 ? Math.round((stats.failedCases  / executedCases) * 100) : 0

    // Velocidad promedio (días de creación a ejecución)
    let totalDaysSum = 0
    let countWithDates = 0
    executedCasesForAvg.forEach((tc: any) => {
      if (!tc.executedAt) return
      const days = (new Date(tc.executedAt).getTime() - new Date(tc.createdAt).getTime()) / 86400000
      if (days >= 0) { totalDaysSum += days; countWithDates++ }
    })
    stats.avgExecutionDays = countWithDates > 0
      ? Math.round((totalDaysSum / countWithDates) * 10) / 10
      : 0

    // Planes por estado
    planStatusCounts.forEach((item: any) => {
      switch (item.status) {
        case 'IN_PROGRESS': stats.activePlans    = item._count; break
        case 'COMPLETED':   stats.completedPlans = item._count; break
        case 'CREATED':     stats.pendingPlans   = item._count; break
        case 'CANCELLED':   stats.cancelledPlans = item._count; break
      }
    })

    // ── Por Sistema ──
    const systemIds = bySystemGroups.map((s: any) => s.systemId).filter(Boolean)
    const systemsList = systemIds.length
      ? await prisma.system.findMany({
          where: { id: { in: systemIds } },
          select: { id: true, name: true },
        })
      : []
    const systemNameMap = Object.fromEntries(systemsList.map((s: any) => [s.id, s.name]))

    const sysStatusMap: Record<string, { approved: number; failed: number; blocked: number }> = {}
    bySystemStatusGroups.forEach((item: any) => {
      if (!item.systemId) return
      if (!sysStatusMap[item.systemId]) sysStatusMap[item.systemId] = { approved: 0, failed: 0, blocked: 0 }
      if (APPROVED_STATUSES.includes(item.status)) sysStatusMap[item.systemId].approved += item._count
      if (item.status === 'FAILED')  sysStatusMap[item.systemId].failed = item._count
      if (item.status === 'BLOCKED') sysStatusMap[item.systemId].blocked = item._count
    })

    stats.bySystem = bySystemGroups
      .filter((item: any) => item.systemId)
      .map((item: any) => {
        const approved = sysStatusMap[item.systemId]?.approved ?? 0
        const failed   = sysStatusMap[item.systemId]?.failed   ?? 0
        const blocked  = sysStatusMap[item.systemId]?.blocked  ?? 0
        const executed = approved + failed + blocked
        return {
          systemId: item.systemId,
          systemName: systemNameMap[item.systemId] || 'Desconocido',
          count: item._count,
          approved, failed, blocked,
          passRate: executed > 0 ? Math.round((approved / executed) * 100) : 0,
        }
      })
      .sort((a: any, b: any) => b.count - a.count)

    // ── Por tipo de prueba (etiquetas en español) ──
    stats.byTestType = byTestType.map((item: any) => ({
      type: TEST_TYPE_LABELS[item.testType] || item.testType,
      count: item._count,
    }))

    // ── Por prioridad (ordenadas crítica→baja) ──
    stats.byPriority = PRIORITY_ORDER
      .map(p => {
        const found = byPriority.find((item: any) => item.priority === p)
        return { priority: PRIORITY_LABELS[p] || p, value: p, count: found?._count ?? 0 }
      })
      .filter(p => p.count > 0)

    // ── Por plataforma ──
    stats.byPlatform = byPlatform.map((item: any) => ({
      platform: item.platform,
      count: item._count,
    }))

    // ── Actividad últimos 30 días ──
    const activityMap: Record<string, any> = {}
    recentCases.forEach((tc: any) => {
      if (!tc.executedAt) return
      const date = new Date(tc.executedAt).toISOString().split('T')[0]
      if (!activityMap[date]) activityMap[date] = { date, executed: 0, approved: 0, failed: 0 }
      activityMap[date].executed++
      if (APPROVED_STATUSES.includes(tc.status)) activityMap[date].approved++
      if (tc.status === 'FAILED') activityMap[date].failed++
    })
    stats.recentActivity = Object.values(activityMap).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    )

    // ── Por Célula ──
    const celulaMap: Record<string, any> = {}
    plansWithCelula.forEach((plan: any) => {
      if (!plan.celulaId || !plan.celula) return
      if (!celulaMap[plan.celulaId]) {
        celulaMap[plan.celulaId] = { id: plan.celulaId, name: plan.celula.name, total: 0, approved: 0, failed: 0 }
      }
      plan.testCases.forEach((tc: any) => {
        celulaMap[plan.celulaId].total++
        if (APPROVED_STATUSES.includes(tc.status)) celulaMap[plan.celulaId].approved++
        if (tc.status === 'FAILED') celulaMap[plan.celulaId].failed++
      })
    })
    stats.byCelula = Object.values(celulaMap)
      .map((c: any) => {
        const executed = c.approved + c.failed
        return { ...c, passRate: executed > 0 ? Math.round((c.approved / executed) * 100) : 0 }
      })
      .sort((a: any, b: any) => b.total - a.total)

    return NextResponse.json({ success: true, data: stats })
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
