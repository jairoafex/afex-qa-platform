import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener todos los sistemas
export async function GET() {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const systems = await prisma.system.findMany({
      where: { isActive: true },
      include: {
        modules: {
          where: { isActive: true },
          include: {
            components: {
              where: { isActive: true },
            },
          },
        },
        _count: {
          select: {
            testPlans: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: systems,
    })
  } catch (error: any) {
    console.error('Error obteniendo sistemas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener sistemas' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo sistema
export async function POST(request: Request) {
  try {
    const { error, session } = await requireAuth()
    if (error) return error

    // Solo admin puede crear sistemas
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      )
    }

    const { name, description, color, icon } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const system = await prisma.system.create({
      data: {
        name,
        description,
        color: color || '#5cb85c',
        icon,
      },
    })

    return NextResponse.json({
      success: true,
      data: system,
      message: 'Sistema creado exitosamente',
    })
  } catch (error: any) {
    console.error('Error creando sistema:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear sistema' },
      { status: 500 }
    )
  }
}
