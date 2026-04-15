import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// DELETE - Eliminar célula
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    await prisma.celula.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Célula eliminada' })
  } catch (error: any) {
    console.error('Error eliminando célula:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar célula' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar célula
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { name } = await request.json()

    const celula = await prisma.celula.update({
      where: { id: params.id },
      data: { name },
    })

    return NextResponse.json({ success: true, data: celula })
  } catch (error: any) {
    console.error('Error actualizando célula:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar célula' },
      { status: 500 }
    )
  }
}
