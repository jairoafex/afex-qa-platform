import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import prisma from '@/lib/prisma'

/**
 * Middleware para proteger rutas API.
 * Soporta dos métodos de autenticación:
 *   1. Cookie de sesión NextAuth (uso normal desde el browser)
 *   2. Bearer token via header Authorization (Postman / scripts externos)
 *      → Requiere configurar API_KEY en .env.local
 */
export async function requireAuth() {
  // --- Bearer token (para Postman / herramientas externas) ---
  if (process.env.API_KEY) {
    const authHeader = headers().get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      try {
        const valid = crypto.timingSafeEqual(
          Buffer.from(token.padEnd(process.env.API_KEY.length)),
          Buffer.from(process.env.API_KEY)
        ) && token.length === process.env.API_KEY.length

        if (valid) {
          const user = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            select: { id: true, email: true, name: true, role: true },
          })
          if (user) return { error: null, session: { user } as any }
        }
      } catch {
        // token inválido — cae al check de NextAuth
      }
    }
  }

  // --- Sesión NextAuth (cookie del browser) ---
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Verifica si el usuario tiene rol de admin
 */
export async function requireAdmin() {
  const { error, session } = await requireAuth()

  if (error) return { error, session: null }

  if (session?.user?.role !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Obtiene el usuario actual desde la sesión
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}
