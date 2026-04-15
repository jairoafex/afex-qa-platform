import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener lista de desarrolladores
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const celulaId = searchParams.get('celulaId')

    const where: any = {}
    if (isActive === 'true') where.isActive = true
    if (celulaId) where.celulaId = celulaId

    const developers = await prisma.developer.findMany({
      where,
      include: { celula: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: developers,
    })
  } catch (error: any) {
    console.error('Error obteniendo desarrolladores:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener desarrolladores' },
      { status: 500 }
    )
  }
}

// POST - Crear desarrollador
export async function POST(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { name, email, area, celulaId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const developer = await prisma.developer.create({
      data: {
        name,
        email: email || null,
        area: area || null,
        celulaId: celulaId || null,
      },
      include: { celula: true },
    })

    return NextResponse.json({
      success: true,
      data: developer,
    })
  } catch (error: any) {
    console.error('Error creando desarrollador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear desarrollador' },
      { status: 500 }
    )
  }
}
