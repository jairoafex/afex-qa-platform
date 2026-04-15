import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener un escenario de prueba específico
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
      include: {
        testPlan: {
          select: { id: true, jiraTask: true, epic: true },
        },
        dependsOnCase: {
          select: { id: true, caseId: true, name: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        changeLogs: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!testCase) {
      return NextResponse.json(
        { success: false, error: 'Caso de prueba no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: testCase,
    })
  } catch (error: any) {
    console.error('Error obteniendo caso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener escenario de prueba' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar escenario de prueba
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error, session } = await requireAuth()
    if (error) return error

    const body = await request.json()
    const {
      name,
      description,
      preconditions,
      steps,
      expectedResult,
      actualResult,
      observations,
      finalResult,
      priority,
      testType,
      status,
      platform,
      moduleId,
      componentId,
      serviceId,
      dependsOnCaseId,
      tags,
    } = body

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
    })

    if (!testCase) {
      return NextResponse.json(
        { success: false, error: 'Caso de prueba no encontrado' },
        { status: 404 }
      )
    }

    const updatedTestCase = await prisma.testCase.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(preconditions !== undefined && { preconditions }),
        ...(steps !== undefined && { steps }),
        ...(expectedResult !== undefined && { expectedResult }),
        ...(actualResult !== undefined && { actualResult }),
        ...(observations !== undefined && { observations }),
        ...(finalResult !== undefined && { finalResult }),
        ...(priority && { priority }),
        ...(testType && { testType }),
        ...(status && { status }),
        ...(platform && { platform }),
        ...(moduleId !== undefined && { moduleId: moduleId || null }),
        ...(componentId !== undefined && { componentId: componentId || null }),
        ...(serviceId !== undefined && { serviceId: serviceId || null }),
        ...(dependsOnCaseId !== undefined && { dependsOnCaseId: dependsOnCaseId || null }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? JSON.stringify(tags) : tags }),
        ...((status === 'FAILED' || status === 'BLOCKED' || status === 'OUT_OF_SCOPE' || status === 'PASSED')
          ? { executedAt: new Date() }
          : {}),
      },
      include: {
        testPlan: {
          select: { id: true, jiraTask: true, epic: true },
        },
        dependsOnCase: {
          select: {
            id: true,
            caseId: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Actualizar contadores: un caso está "completado" cuando no está en estado inicial
    if (status) {
      const FINAL_STATES = ['FAILED', 'BLOCKED', 'OUT_OF_SCOPE', 'PASSED', 'SKIPPED']
      const [completedCases, totalCases] = await Promise.all([
        prisma.testCase.count({
          where: {
            testPlanId: testCase.testPlanId,
            status: { in: FINAL_STATES },
          },
        }),
        prisma.testCase.count({ where: { testPlanId: testCase.testPlanId } }),
      ])

      await prisma.testPlan.update({
        where: { id: testCase.testPlanId },
        data: {
          completedCases,
          ...(completedCases === totalCases && totalCases > 0 && { status: 'COMPLETED' }),
        },
      })

      // Notificación cuando el plan queda 100% completado
      if (completedCases === totalCases && totalCases > 0) {
        await prisma.changeLog.create({
          data: {
            message: 'Plan de prueba completado',
            testCaseId: params.id,
            userId: session!.user.id,
          },
        })
      }
    }

    // Generar logs de cambios — todos los cambios de un guardado en UNA sola línea
    const STATUS_LABELS: Record<string, string> = {
      PENDING: 'Por hacer', IN_PROGRESS: 'En progreso', FAILED: 'Fallido',
      BLOCKED: 'Bloqueado', OUT_OF_SCOPE: 'Fuera de alcance', APPROVED: 'Aprobado',
      PASSED: 'Exitoso', SKIPPED: 'Omitido',
    }
    const PRIORITY_LABELS: Record<string, string> = {
      LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica',
    }
    const FIELD_LABELS: Record<string, string> = {
      name: 'Nombre', description: 'Descripción', steps: 'Pasos',
      observations: 'Observaciones', finalResult: 'Resultado final',
      priority: 'Prioridad', status: 'Estado', dependsOnCaseId: 'Dependencia',
    }
    // Campos largos: mostrar nuevo valor truncado en lugar de "modificado"
    const LONG_FIELDS = new Set(['description', 'steps', 'observations', 'finalResult', 'gherkinScenario'])

    const changeParts: string[] = []
    const trackFields = ['name', 'description', 'steps', 'observations', 'finalResult', 'priority', 'status', 'dependsOnCaseId'] as const

    for (const field of trackFields) {
      const oldVal = (testCase as any)[field]
      const newVal = body[field]
      if (newVal === undefined) continue
      // Normalizar: string vacío = null para comparar
      const normalizedOld = oldVal === '' ? null : oldVal
      const normalizedNew = newVal === '' ? null : newVal
      if (normalizedOld === normalizedNew) continue
      const label = FIELD_LABELS[field]
      if (LONG_FIELDS.has(field)) {
        // Solo loguear si el nuevo valor tiene contenido real
        if (!normalizedNew) continue
        const preview = String(normalizedNew).trim().slice(0, 60)
        const suffix = String(normalizedNew).length > 60 ? '...' : ''
        changeParts.push(`${label}: "${preview}${suffix}"`)
      } else if (field === 'status') {
        changeParts.push(`Estado: "${STATUS_LABELS[normalizedOld] ?? normalizedOld}" → "${STATUS_LABELS[normalizedNew] ?? normalizedNew}"`)
      } else if (field === 'priority') {
        changeParts.push(`Prioridad: "${PRIORITY_LABELS[normalizedOld] ?? normalizedOld}" → "${PRIORITY_LABELS[normalizedNew] ?? normalizedNew}"`)
      } else {
        const oldStr = normalizedOld ?? '(vacío)'
        const newStr = normalizedNew ?? '(vacío)'
        changeParts.push(`${label}: "${String(oldStr).slice(0, 40)}" → "${String(newStr).slice(0, 40)}"`)
      }
    }

    if (changeParts.length > 0) {
      await prisma.changeLog.create({
        data: {
          message: changeParts.join(' · '),
          testCaseId: params.id,
          userId: session!.user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedTestCase,
    })
  } catch (error: any) {
    console.error('Error actualizando caso:', error)
    return NextResponse.json(
      { success: false, error: process.env.NODE_ENV === 'development' ? error.message : 'Error al actualizar escenario de prueba' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar escenario de prueba
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
    })

    if (!testCase) {
      return NextResponse.json(
        { success: false, error: 'Caso de prueba no encontrado' },
        { status: 404 }
      )
    }

    await prisma.testCase.delete({
      where: { id: params.id },
    })

    // Actualizar contadores del plan con count queries (los conteos post-delete son los correctos)
    const [totalCases, completedCases] = await Promise.all([
      prisma.testCase.count({ where: { testPlanId: testCase.testPlanId } }),
      prisma.testCase.count({
        where: {
          testPlanId: testCase.testPlanId,
          status: { in: ['FAILED', 'BLOCKED', 'OUT_OF_SCOPE', 'PASSED', 'SKIPPED'] },
        },
      }),
    ])

    await prisma.testPlan.update({
      where: { id: testCase.testPlanId },
      data: { totalCases, completedCases },
    })

    return NextResponse.json({
      success: true,
      message: 'Escenario de prueba eliminado',
    })
  } catch (error: any) {
    console.error('Error eliminando caso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar escenario de prueba' },
      { status: 500 }
    )
  }
}
