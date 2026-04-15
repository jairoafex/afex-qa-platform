import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener escenarios de prueba con filtros
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const testPlanId = searchParams.get('testPlanId')
    const systemId = searchParams.get('systemId')
    const moduleId = searchParams.get('moduleId')
    const status = searchParams.get('status')
    const testType = searchParams.get('testType')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {}
    if (testPlanId) where.testPlanId = testPlanId
    if (systemId) where.systemId = systemId
    if (moduleId) where.moduleId = moduleId
    if (status) where.status = status
    if (testType) where.testType = testType
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { caseId: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [testCases, total] = await Promise.all([
      prisma.testCase.findMany({
        where,
        include: {
          testPlan: {
            include: {
              system: true,
              qaEngineer: {
                select: { id: true, name: true },
              },
            },
          },
          module: true,
          component: true,
          service: true,
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
          _count: {
            select: {
              attachments: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.testCase.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: testCases,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    console.error('Error obteniendo casos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener escenarios de prueba' },
      { status: 500 }
    )
  }
}

// POST - Crear escenario de prueba
export async function POST(request: Request) {
  try {
    const { error, session } = await requireAuth()
    if (error) return error

    const data = await request.json()

    // Validar campos requeridos
    if (!data.name || !data.testPlanId) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos faltantes' },
        { status: 400 }
      )
    }

    // Generar ID consecutivo de forma atómica para evitar duplicados en requests concurrentes
    const testCase = await prisma.$transaction(async (tx) => {
      const count = await tx.testCase.count({ where: { testPlanId: data.testPlanId } })
      const caseId = `TC-${String(count + 1).padStart(3, '0')}`

      return tx.testCase.create({
        data: {
          caseId,
          name: data.name,
          description: data.description || null,
          preconditions: data.preconditions || null,
          steps: data.steps || null,
          observations: data.observations || null,
          priority: data.priority || 'MEDIUM',
          testType: 'FUNCTIONAL',
          status: 'PENDING', // siempre PENDING al crear — no se permite otro estado inicial
          tags: data.tags ? JSON.stringify(data.tags) : null,
          testPlanId: data.testPlanId,
          userId: session!.user.id,
          dependsOnCaseId: data.dependsOnCaseId || undefined,
        },
        include: {
          testPlan: {
            select: { id: true, jiraTask: true, epic: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })
    })

    // Actualizar contador en test plan y auto-transicionar de CREATED a IN_PROGRESS
    await prisma.testPlan.update({
      where: { id: data.testPlanId },
      data: {
        totalCases: { increment: 1 },
      },
    })
    await prisma.testPlan.updateMany({
      where: { id: data.testPlanId, status: 'CREATED' },
      data: { status: 'IN_PROGRESS' },
    })

    // Registrar log de creación
    await prisma.changeLog.create({
      data: {
        message: 'Caso de prueba creado',
        testCaseId: testCase.id,
        userId: session!.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: testCase,
      message: 'Caso de prueba creado exitosamente',
    })
  } catch (error: any) {
    console.error('Error creando caso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear escenario de prueba' },
      { status: 500 }
    )
  }
}
