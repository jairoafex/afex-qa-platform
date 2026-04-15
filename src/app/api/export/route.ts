import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

// POST - Exportar escenarios de prueba
export async function POST(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { format, filters, includeAttachments, includeComments } =
      await request.json()

    // Construir filtros
    const where: any = {}
    if (filters?.systemId) where.systemId = filters.systemId
    if (filters?.moduleId) where.moduleId = filters.moduleId
    if (filters?.status) where.status = filters.status
    if (filters?.testType) where.testType = filters.testType
    if (filters?.priority) where.priority = filters.priority

    // Obtener casos (máximo 5000 registros para proteger memoria del servidor)
    const testCases = await prisma.testCase.findMany({
      where,
      take: 5000,
      include: {
        testPlan: {
          include: {
            system: true,
          },
        },
        module: true,
        component: true,
        service: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        ...(includeAttachments && {
          attachments: true,
        }),
        ...(includeComments && {
          comments: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        }),
      },
      orderBy: { caseId: 'asc' },
    })

    switch (format) {
      case 'xlsx':
        return exportToExcel(testCases)
      case 'csv':
        return exportToCSV(testCases)
      case 'json':
        return exportToJSON(testCases)
      case 'feature':
        return exportToFeature(testCases)
      default:
        return NextResponse.json(
          { success: false, error: 'Formato no soportado' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error exportando:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar escenarios de prueba' },
      { status: 500 }
    )
  }
}

// Exportar a Excel
function exportToExcel(testCases: any[]) {
  const data = testCases.map((tc) => ({
    ID: tc.caseId,
    Nombre: tc.name,
    Descripción: tc.description,
    Precondiciones: tc.preconditions,
    Pasos: JSON.parse(tc.steps)
      .map((s: any) => `${s.order}. ${s.action}`)
      .join('\n'),
    'Resultado Esperado': tc.expectedResult,
    Prioridad: tc.priority,
    'Tipo de Prueba': tc.testType,
    Estado: tc.status,
    Sistema: tc.testPlan?.system?.name,
    Módulo: tc.module?.name,
    Componente: tc.component?.name || '',
    'Desarrollador Responsable': tc.responsibleDeveloper || '',
    'Tarea JIRA': tc.testPlan?.jiraTask || '',
    'Creado por': tc.user?.name,
    'Fecha de Creación': tc.createdAt,
    'Fecha de Ejecución': tc.executedAt || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Escenarios de Prueba')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="casos-prueba-${Date.now()}.xlsx"`,
    },
  })
}

// Exportar a CSV
function exportToCSV(testCases: any[]) {
  const data = testCases.map((tc) => ({
    ID: tc.caseId,
    Nombre: tc.name,
    Descripción: tc.description,
    Prioridad: tc.priority,
    'Tipo de Prueba': tc.testType,
    Estado: tc.status,
    Sistema: tc.testPlan?.system?.name,
    Módulo: tc.module?.name,
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(worksheet)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="casos-prueba-${Date.now()}.csv"`,
    },
  })
}

// Exportar a JSON
function exportToJSON(testCases: any[]) {
  return NextResponse.json({
    success: true,
    data: testCases,
    exportedAt: new Date().toISOString(),
    total: testCases.length,
  })
}

// Exportar a Feature (Gherkin)
function exportToFeature(testCases: any[]) {
  let content = '# Escenarios de Prueba - Afex+\n\n'

  // Agrupar por módulo
  const byModule: any = {}
  testCases.forEach((tc) => {
    const moduleName = tc.module?.name || 'Sin Módulo'
    if (!byModule[moduleName]) {
      byModule[moduleName] = []
    }
    byModule[moduleName].push(tc)
  })

  // Generar features
  Object.keys(byModule).forEach((moduleName) => {
    content += `Feature: ${moduleName}\n\n`

    byModule[moduleName].forEach((tc: any) => {
      if (tc.gherkinScenario) {
        content += `  ${tc.gherkinScenario}\n\n`
      } else {
        // Generar Gherkin básico
        content += `  Scenario: ${tc.name}\n`
        if (tc.preconditions) {
          content += `    Given ${tc.preconditions}\n`
        }
        const steps = JSON.parse(tc.steps)
        steps.forEach((step: any) => {
          content += `    When ${step.action}\n`
        })
        content += `    Then ${tc.expectedResult}\n\n`
      }
    })

    content += '\n'
  })

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="casos-prueba-${Date.now()}.feature"`,
    },
  })
}
