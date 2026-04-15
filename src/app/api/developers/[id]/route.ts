import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT - Actualizar desarrollador
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { name, email, area, celulaId } = await request.json()

    const developer = await prisma.developer.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null,
        area: area || null,
        celulaId: celulaId || null,
      },
      include: { celula: true },
    })

    return NextResponse.json({ success: true, data: developer })
  } catch (error: any) {
    console.error('Error actualizando desarrollador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar desarrollador' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar desarrollador (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    await prisma.developer.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Desarrollador eliminado' })
  } catch (error: any) {
    console.error('Error eliminando desarrollador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar desarrollador' },
      { status: 500 }
    )
  }
}
