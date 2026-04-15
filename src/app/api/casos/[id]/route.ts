import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener un caso de prueba específico
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const testPlan = await prisma.testPlan.findUnique({
      where: { id: params.id },
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
    })

    if (!testPlan) {
      return NextResponse.json(
        { success: false, error: 'Caso de prueba no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: testPlan,
    })
  } catch (error: any) {
    console.error('Error obteniendo plan:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener caso de prueba' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar caso de prueba
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { jiraTask, description, epic, moduleId, relatedJiraTasks, status, celulaId, developerId, qaId } = await request.json()

    const testPlan = await prisma.testPlan.update({
      where: { id: params.id },
      data: {
        ...(jiraTask && { jiraTask }),
        ...(description && { description }),
        ...(epic !== undefined && { epic: epic || null }),
        ...(moduleId !== undefined && { moduleId: moduleId || null }),
        ...(relatedJiraTasks !== undefined && {
          relatedJiraTasks: relatedJiraTasks ? JSON.stringify(relatedJiraTasks) : null,
        }),
        ...(status && { status }),
        ...(celulaId !== undefined && { celulaId: celulaId || null }),
        ...(developerId !== undefined && { developerId: developerId || null }),
        ...(qaId !== undefined && { qaId: qaId || null }),
      },
      include: {
        system: true,
        module: true,
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
    })
  } catch (error: any) {
    console.error('Error actualizando plan:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar caso de prueba' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar caso de prueba
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    await prisma.testPlan.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Caso de prueba eliminado',
    })
  } catch (error: any) {
    console.error('Error eliminando plan:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar caso de prueba' },
      { status: 500 }
    )
  }
}
