const BASE = process.env.JIRA_BASE_URL
const auth = Buffer.from(
  `${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`
).toString('base64')

export interface JiraIssue {
  key: string
  summary: string
  description: string | null
  status: string
  assignee: string | null
  epic: string | null
  epicName: string | null
  priority: string | null
  projectName: string
  projectKey: string
}

export async function getJiraIssue(issueKey: string): Promise<JiraIssue> {
  if (!BASE || !process.env.JIRA_USER_EMAIL || !process.env.JIRA_API_TOKEN) {
    throw new Error('Faltan variables de entorno de Jira (JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN)')
  }

  const res = await fetch(`${BASE}/rest/api/3/issue/${issueKey}`, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (res.status === 404) throw new Error(`Issue ${issueKey} no encontrado en Jira`)
  if (res.status === 401) throw new Error('Credenciales de Jira inválidas')
  if (!res.ok) throw new Error(`Error de Jira: ${res.status}`)

  const data = await res.json()

  // La épica puede estar en parent (Jira Next-gen) o en customfield_10014 (Jira Classic)
  const epic: string | null =
    data.fields?.parent?.key ?? data.fields?.customfield_10014 ?? null

  // Obtener el nombre de la épica con una segunda llamada
  let epicName: string | null = null
  if (epic) {
    try {
      const epicRes = await fetch(`${BASE}/rest/api/3/issue/${epic}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        cache: 'no-store',
      })
      if (epicRes.ok) {
        const epicData = await epicRes.json()
        epicName = epicData.fields?.summary ?? null
      }
    } catch {
      // Si falla, no bloqueamos — epicName queda null
    }
  }

  // La descripción en Jira v3 es un documento ADF, extraemos el texto plano
  let description: string | null = null
  const adf = data.fields?.description
  if (adf?.content) {
    description = extractAdfText(adf)
  }

  return {
    key: data.key,
    summary: data.fields?.summary ?? '',
    description,
    status: data.fields?.status?.name ?? '',
    assignee: data.fields?.assignee?.displayName ?? null,
    epic,
    epicName,
    priority: data.fields?.priority?.name ?? null,
    projectName: data.fields?.project?.name ?? '',
    projectKey: data.fields?.project?.key ?? '',
  }
}

/** Extrae texto plano del formato ADF (Atlassian Document Format) */
function extractAdfText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.content)) {
    return node.content.map(extractAdfText).join(' ').trim()
  }
  return ''
}
