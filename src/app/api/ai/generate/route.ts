import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// POST - Generar escenarios de prueba automáticamente
export async function POST(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    if (!openai) {
      return NextResponse.json(
        { success: false, error: 'OpenAI no está configurado' },
        { status: 500 }
      )
    }

    const {
      userStory,
      testTypes,
      includeBoundary,
      includeNegative,
      includeIntegration,
    } = await request.json()

    if (!userStory) {
      return NextResponse.json(
        { success: false, error: 'Historia de usuario es requerida' },
        { status: 400 }
      )
    }

    // Construir prompt para OpenAI
    const prompt = `
Eres un experto QA Engineer. Genera escenarios de prueba detallados en formato Gherkin para la siguiente historia de usuario.

Historia de Usuario:
${userStory}

Tipos de prueba a incluir: ${testTypes.join(', ')}
Incluir casos borde: ${includeBoundary ? 'Sí' : 'No'}
Incluir casos negativos: ${includeNegative ? 'Sí' : 'No'}
Incluir pruebas de integración: ${includeIntegration ? 'Sí' : 'No'}

Genera escenarios de prueba completos con:
1. Nombre descriptivo del caso
2. Descripción breve
3. Precondiciones (si aplica)
4. Pasos detallados en formato de acción/dato/esperado
5. Resultado esperado
6. Escenario Gherkin completo (Given/When/Then)
7. Tipo de prueba (FUNCTIONAL, INTEGRATION, etc.)
8. Prioridad (CRITICAL, HIGH, MEDIUM, LOW)

Responde ÚNICAMENTE con un JSON array válido con esta estructura:
[
  {
    "name": "Título del caso",
    "description": "Descripción breve",
    "preconditions": "Precondiciones si aplican",
    "steps": [
      {"order": 1, "action": "Acción", "data": "Datos", "expected": "Esperado"}
    ],
    "expectedResult": "Resultado esperado global",
    "gherkinScenario": "Scenario: ...\\nGiven ...\\nWhen ...\\nThen ...",
    "testType": "FUNCTIONAL",
    "priority": "HIGH"
  }
]

Genera entre 5 y 15 casos según la complejidad.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'Eres un QA Engineer experto que genera escenarios de prueba detallados en formato JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    // Extraer JSON del response (puede venir con markdown)
    let jsonText = responseText
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const generatedCases = JSON.parse(jsonText)

    return NextResponse.json({
      success: true,
      data: generatedCases,
      message: `${generatedCases.length} escenarios de prueba generados`,
    })
  } catch (error: any) {
    console.error('Error generando casos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar escenarios de prueba',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

