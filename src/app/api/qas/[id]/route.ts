import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT - Actualizar QA
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { name, email, celulaId } = await request.json()

    const qa = await prisma.qAEngineer.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null,
        celulaId: celulaId || null,
      },
      include: { celula: true },
    })

    return NextResponse.json({ success: true, data: qa })
  } catch (error: any) {
    console.error('Error actualizando QA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar QA' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar QA (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    await prisma.qAEngineer.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'QA eliminado' })
  } catch (error: any) {
    console.error('Error eliminando QA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar QA' },
      { status: 500 }
    )
  }
}
