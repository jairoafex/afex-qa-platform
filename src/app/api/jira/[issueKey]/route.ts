import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getJiraIssue } from '@/lib/jira'

// GET /api/jira/[issueKey]
export async function GET(
  _req: Request,
  { params }: { params: { issueKey: string } }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { issueKey } = params

    if (!issueKey || !/^[A-Z]+-\d+$/.test(issueKey.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: 'Clave de issue inválida. Formato esperado: AFEX-1234' },
        { status: 400 }
      )
    }

    const issue = await getJiraIssue(issueKey.toUpperCase())

    return NextResponse.json({
      success: true,
      data: {
        key: issue.key,
        summary: issue.summary,
        description: issue.description,
        status: issue.status,
        assignee: issue.assignee,
        epic: issue.epic,
        epicName: issue.epicName,
        priority: issue.priority,
        projectName: issue.projectName,
        projectKey: issue.projectKey,
      },
    })
  } catch (err: any) {
    const message: string = err?.message ?? 'Error al consultar Jira'
    const status = message.includes('no encontrado') ? 404
      : message.includes('inválidas') ? 401
      : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
