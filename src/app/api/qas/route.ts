import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener QAs con filtro opcional por célula
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const celulaId = searchParams.get('celulaId')

    const where: any = { isActive: true }
    if (celulaId) where.celulaId = celulaId

    const qas = await prisma.qAEngineer.findMany({
      where,
      include: { celula: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: qas })
  } catch (error: any) {
    console.error('Error obteniendo QAs:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener QAs' },
      { status: 500 }
    )
  }
}

// POST - Crear QA
export async function POST(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { name, email, celulaId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const qa = await prisma.qAEngineer.create({
      data: {
        name,
        email: email || null,
        celulaId: celulaId || null,
      },
      include: { celula: true },
    })

    return NextResponse.json({ success: true, data: qa })
  } catch (error: any) {
    console.error('Error creando QA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear QA' },
      { status: 500 }
    )
  }
}
