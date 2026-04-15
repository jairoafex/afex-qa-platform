import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener todas las células
export async function GET() {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const celulas = await prisma.celula.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: celulas })
  } catch (error: any) {
    console.error('Error obteniendo células:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener células' },
      { status: 500 }
    )
  }
}

// POST - Crear célula
export async function POST(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const celula = await prisma.celula.create({ data: { name } })

    return NextResponse.json({ success: true, data: celula })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe una célula con ese nombre' },
        { status: 409 }
      )
    }
    console.error('Error creando célula:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear célula' },
      { status: 500 }
    )
  }
}
