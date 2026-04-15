import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Crear módulo
export async function POST(request: Request) {
  try {
    const { error, session } = await requireAuth()
    if (error) return error

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      )
    }

    const { name, description, systemId } = await request.json()

    if (!name || !systemId) {
      return NextResponse.json(
        { success: false, error: 'Nombre y sistema son requeridos' },
        { status: 400 }
      )
    }

    const newModule = await prisma.module.create({
      data: {
        name,
        description,
        systemId,
      },
    })

    return NextResponse.json({
      success: true,
      data: newModule,
      message: 'Módulo creado exitosamente',
    })
  } catch (error: any) {
    console.error('Error creando módulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear módulo' },
      { status: 500 }
    )
  }
}
