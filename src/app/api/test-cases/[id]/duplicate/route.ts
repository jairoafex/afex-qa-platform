import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Extrae la parte numérica de un caseId con formato "TC-NNN".
 * Devuelve 0 si el formato no coincide.
 */
function parseCaseIdNumber(caseId: string): number {
  const match = caseId.match(/^TC-(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

// POST /api/test-cases/[id]/duplicate
// Duplica un escenario de prueba dentro del mismo plan:
//  - Asigna el siguiente caseId disponible (máximo + 1) dentro del plan
//  - Estado forzado a PENDING
//  - NO copia archivos adjuntos
//  - NO copia executedAt, finalResult ni actualResult
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error, session } = await requireAuth()
    if (error) return error

    const newTestCase = await prisma.$transaction(async (tx) => {
      // 1. Obtener el caso original con toda su información
      const original = await tx.testCase.findUnique({
        where: { id: params.id },
      })

      if (!original) {
        throw new Error('CASE_NOT_FOUND')
      }

      // 2. Obtener todos los caseIds existentes en el mismo plan para calcular el siguiente ID
      const existingCaseIds = await tx.testCase.findMany({
        where: { testPlanId: original.testPlanId },
        select: { caseId: true },
      })

      const maxNumber = existingCaseIds.reduce((max, tc) => {
        const num = parseCaseIdNumber(tc.caseId)
        return num > max ? num : max
      }, 0)

      const nextNumber = maxNumber + 1
      const newCaseId = `TC-${String(nextNumber).padStart(3, '0')}`

      // 3. Crear el nuevo caso copiando todos los campos relevantes
      const duplicated = await tx.testCase.create({
        data: {
          caseId: newCaseId,
          name: `${original.name} (copia)`,
          description: original.description,
          preconditions: original.preconditions,
          steps: original.steps,
          expectedResult: original.expectedResult,
          observations: original.observations,
          gherkinScenario: original.gherkinScenario,
          // Campos intencionalmente omitidos / reseteados:
          actualResult: null,        // no copiar resultado real
          finalResult: null,         // no copiar resultado final
          executedAt: null,          // sin fecha de ejecución
          status: 'PENDING',         // siempre comienza en "Por hacer"
          // Clasificación
          priority: original.priority,
          testType: original.testType,
          platform: original.platform,
          // Asociaciones
          testPlanId: original.testPlanId,
          systemId: original.systemId,
          moduleId: original.moduleId,
          componentId: original.componentId,
          serviceId: original.serviceId,
          dependsOnCaseId: original.dependsOnCaseId,
          // Autor: quien realiza la duplicación
          userId: session!.user.id,
          // attachments: NO se copian (intencional)
        },
        include: {
          testPlan: {
            select: { id: true, jiraTask: true, epic: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      // 4. Actualizar el contador de casos del plan
      await tx.testPlan.update({
        where: { id: original.testPlanId },
        data: { totalCases: { increment: 1 } },
      })

      // 5. Registrar en el log de cambios
      await tx.changeLog.create({
        data: {
          message: `Caso duplicado desde ${original.caseId} — adjuntos no copiados`,
          testCaseId: duplicated.id,
          userId: session!.user.id,
        },
      })

      return duplicated
    })

    return NextResponse.json({
      success: true,
      data: newTestCase,
      message: `Escenario duplicado como ${newTestCase.caseId}`,
    })
  } catch (error: any) {
    if (error.message === 'CASE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Caso de prueba no encontrado' },
        { status: 404 }
      )
    }
    console.error('Error duplicando caso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al duplicar el escenario de prueba' },
      { status: 500 }
    )
  }
}
