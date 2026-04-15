import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener casos de prueba
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const systemId  = searchParams.get('systemId')
    const status    = searchParams.get('status')
    const search    = searchParams.get('search')    // búsqueda por jiraTask
    const celulaId  = searchParams.get('celulaId')
    const qaId      = searchParams.get('qaId')
    const dateFrom  = searchParams.get('dateFrom')
    const dateTo    = searchParams.get('dateTo')
    const page     = parseInt(searchParams.get('page')     || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {}
    if (systemId) where.systemId = systemId
    if (status)   where.status   = status
    if (celulaId) where.celulaId = celulaId
    if (qaId)     where.qaId     = qaId
    if (search)   where.jiraTask = { contains: search }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59')
    }

    const [testPlans, total] = await Promise.all([
      prisma.testPlan.findMany({
        where,
        include: {
          system: true,
          module: true,
          celula: true,
          developer: true,
          qaEngineer: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              testCases: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.testPlan.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: testPlans,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    console.error('Error obteniendo planes:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener casos de prueba' },
      { status: 500 }
    )
  }
}

// POST - Crear caso de prueba
export async function POST(request: Request) {
  try {
    const { error, session } = await requireAuth()
    if (error) return error

    const { jiraTask, description, epic, moduleId, relatedJiraTasks, celulaId, developerId, qaId, priority, title, jiraAssignee, jiraCelula } = await request.json()

    if (!jiraTask || !description) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que no exista ya un plan con la misma tarea JIRA
    const existing = await prisma.testPlan.findFirst({ where: { jiraTask } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe un caso de prueba para la tarea ${jiraTask}. No se pueden registrar duplicados.` },
        { status: 409 }
      )
    }

    // Verificar que el usuario de la sesión existe en la BD
    const sessionUser = await prisma.user.findUnique({ where: { id: session!.user.id } })
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Tu sesión ha expirado. Por favor cierra sesión y vuelve a ingresar.' },
        { status: 401 }
      )
    }

    // Validar FKs opcionales antes de intentar crear
    const [validCelula, validDeveloper, validQA] = await Promise.all([
      celulaId ? prisma.celula.findUnique({ where: { id: celulaId }, select: { id: true } }) : null,
      developerId ? prisma.developer.findUnique({ where: { id: developerId }, select: { id: true } }) : null,
      qaId ? prisma.qAEngineer.findUnique({ where: { id: qaId }, select: { id: true } }) : null,
    ])

    const testPlan = await prisma.testPlan.create({
      data: {
        jiraTask,
        title: title || undefined,
        description,
        epic: epic || undefined,
        moduleId: moduleId || undefined,
        relatedJiraTasks: relatedJiraTasks ? JSON.stringify(relatedJiraTasks) : null,
        userId: session!.user.id,
        celulaId: validCelula?.id || undefined,
        developerId: validDeveloper?.id || undefined,
        qaId: validQA?.id || undefined,
        priority: priority || 'MEDIUM',
        jiraAssignee: jiraAssignee || undefined,
        jiraCelula: jiraCelula || undefined,
      },
      include: {
        system: true,
        module: true,
        celula: true,
        developer: true,
        qaEngineer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: testPlan,
      message: 'Caso de prueba creado exitosamente',
    })
  } catch (error: any) {
    console.error('Error creando plan:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear caso de prueba',
        ...(process.env.NODE_ENV === 'development' && { detail: error?.message }),
      },
      { status: 500 }
    )
  }
}
