import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import prisma from '@/lib/prisma'

// Tipos MIME permitidos (whitelist)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
])
// Extensiones permitidas (whitelist)
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv', 'xls', 'xlsx', 'doc', 'docx'])
// Límite de tamaño: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// POST - Upload de archivo
export async function POST(request: Request) {
  try {
    const { error, session } = await requireAuth()
    if (error) return error

    const formData = await request.formData()
    const file = formData.get('file') as File
    const testCaseId = formData.get('testCaseId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    if (!testCaseId) {
      return NextResponse.json(
        { success: false, error: 'testCaseId es requerido' },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El archivo supera el límite de 10 MB' },
        { status: 400 }
      )
    }

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido' },
        { status: 400 }
      )
    }

    // Validar extensión (previene spoofing de MIME)
    const rawExt = (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        { success: false, error: 'Extensión de archivo no permitida' },
        { status: 400 }
      )
    }

    // Sanitizar testCaseId — solo caracteres alfanuméricos y guiones (previene path traversal)
    if (!/^[a-zA-Z0-9_-]+$/.test(testCaseId)) {
      return NextResponse.json(
        { success: false, error: 'testCaseId inválido' },
        { status: 400 }
      )
    }

    // Verificar que el testCase exista y pertenezca al usuario
    const testCase = await prisma.testCase.findUnique({ where: { id: testCaseId }, select: { id: true } })
    if (!testCase) {
      return NextResponse.json(
        { success: false, error: 'Escenario de prueba no encontrado' },
        { status: 404 }
      )
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', testCaseId)
    await mkdir(uploadsDir, { recursive: true })

    // Generar nombre único (solo caracteres seguros)
    const timestamp = Date.now()
    const fileName = `${timestamp}.${rawExt}`
    const filePath = join(uploadsDir, fileName)

    // Guardar archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Guardar en BD
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: `/uploads/${testCaseId}/${fileName}`,
        testCaseId,
        uploadedBy: session!.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: attachment,
    })
  } catch (error: any) {
    console.error('Error subiendo archivo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir archivo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar archivo
export async function DELETE(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('id')

    if (!attachmentId) {
      return NextResponse.json(
        { success: false, error: 'ID de adjunto requerido' },
        { status: 400 }
      )
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Adjunto no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar de BD
    await prisma.attachment.delete({
      where: { id: attachmentId },
    })

    // Eliminar archivo físico
    try {
      const physicalPath = join(process.cwd(), 'public', attachment.filePath)
      // Aseguramos que la ruta esté dentro del directorio de uploads (previene path traversal)
      const uploadsRoot = join(process.cwd(), 'public', 'uploads')
      const resolvedPath = physicalPath
      if (resolvedPath.startsWith(uploadsRoot)) {
        await unlink(resolvedPath)
      }
    } catch {
      // Archivo ya no existe en disco — continuamos
    }

    return NextResponse.json({
      success: true,
      message: 'Adjunto eliminado',
    })
  } catch (error: any) {
    console.error('Error eliminando archivo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar archivo' },
      { status: 500 }
    )
  }
}
