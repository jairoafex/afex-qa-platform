import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export type NotificationType =
  | 'created'
  | 'approved'
  | 'failed'
  | 'blocked'
  | 'in_progress'
  | 'plan_completed'
  | 'status_change'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  testCaseId: string
  testCaseCaseId: string
  testCaseName: string
  testPlanId: string
  testPlanJiraTask: string
  userName: string
  createdAt: string
}

function classify(message: string): { type: NotificationType; title: string } {
  if (message.includes('Plan de prueba completado'))
    return { type: 'plan_completed', title: 'Plan completado' }
  if (message === 'Caso de prueba creado' || message === 'Escenario de prueba creado')
    return { type: 'created', title: 'Nuevo escenario creado' }
  if (message.includes('Aprobado') || message.includes('Exitoso'))
    return { type: 'approved', title: 'Escenario aprobado' }
  if (message.includes('Fallido'))
    return { type: 'failed', title: 'Escenario fallido' }
  if (message.includes('Bloqueado'))
    return { type: 'blocked', title: 'Escenario bloqueado' }
  if (message.includes('En progreso'))
    return { type: 'in_progress', title: 'Escenario en progreso' }
  return { type: 'status_change', title: 'Escenario actualizado' }
}

// GET /api/notifications?since=<ISO>&limit=<n>
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 100)

    const logs = await prisma.changeLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        testCase: {
          select: {
            id: true,
            caseId: true,
            name: true,
            status: true,
            testPlanId: true,
            testPlan: {
              select: { id: true, jiraTask: true },
            },
          },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    })

    const notifications: Notification[] = logs.map((log) => {
      const { type, title } = classify(log.message)
      return {
        id: log.id,
        type,
        title,
        description: log.message,
        testCaseId: log.testCase.id,
        testCaseCaseId: log.testCase.caseId,
        testCaseName: log.testCase.name,
        testPlanId: log.testCase.testPlan?.id ?? '',
        testPlanJiraTask: log.testCase.testPlan?.jiraTask ?? '',
        userName: log.user.name,
        createdAt: log.createdAt.toISOString(),
      }
    })

    const unreadCount = since
      ? notifications.filter((n) => new Date(n.createdAt) > new Date(since)).length
      : notifications.length

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    })
  } catch (error: any) {
    console.error('Error obteniendo notificaciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}
