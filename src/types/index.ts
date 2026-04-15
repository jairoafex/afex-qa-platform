// Tipos compartidos y utilidades
export * from '@prisma/client'

// ===== ENUMS (para validación en TypeScript) =====

export type UserRole = 'ADMIN' | 'QA' | 'VIEWER' | 'DEVELOPER'

export type PlanStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type TestType = 
  | 'FUNCTIONAL'
  | 'INTEGRATION'
  | 'REGRESSION'
  | 'SMOKE'
  | 'E2E'
  | 'API'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'USABILITY'

export type CaseStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'PASSED'      // legado — equivalente a APPROVED
  | 'FAILED'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'OUT_OF_SCOPE'

// ===== TIPOS DE RESPUESTA API =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ===== TIPOS DE DASHBOARD =====

export interface DashboardStats {
  totalTestCases: number
  approvedCases: number
  failedCases: number
  inProgressCases: number
  pendingCases: number
  blockedCases: number
  outOfScopeCases: number
  skippedCases: number
  executedCases: number
  passRate: number
  defectRate: number
  avgExecutionDays: number
  // Indicadores de riesgo
  criticalFailedCases: number
  highPriorityPending: number
  casesWithoutSteps: number
  casesWithEvidence: number
  casesWithoutEvidence: number
  // Planes de prueba
  totalPlans: number
  activePlans: number
  completedPlans: number
  pendingPlans: number
  cancelledPlans: number
  // Por sistema
  bySystem: {
    systemId: string
    systemName: string
    count: number
    approved: number
    failed: number
    blocked: number
    passRate: number
  }[]
  // Por tipo de prueba
  byTestType: {
    type: string
    count: number
  }[]
  // Por prioridad
  byPriority: {
    priority: string
    value: string
    count: number
  }[]
  // Por plataforma
  byPlatform: {
    platform: string
    count: number
  }[]
  // Actividad reciente (30 días)
  recentActivity: {
    date: string
    executed: number
    approved: number
    failed: number
  }[]
  // Por célula
  byCelula: {
    id: string
    name: string
    total: number
    approved: number
    failed: number
    passRate: number
  }[]
}

export interface FilterOptions {
  systemId?: string
  moduleId?: string
  status?: string
  testType?: string
  priority?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

// ===== TIPOS DE GENERACIÓN DE CASOS =====

export interface GenerateTestCaseRequest {
  userStory: string
  systemId: string
  moduleId: string
  componentId?: string
  testType: string[]
  includeBoundary: boolean
  includeNegative: boolean
  includeIntegration: boolean
  documents?: File[]
}

export interface GeneratedTestCase {
  name: string
  description: string
  preconditions: string
  steps: TestStep[]
  expectedResult: string
  gherkinScenario: string
  testType: string
  priority: string
}

export interface TestStep {
  order: number
  action: string
  data?: string
  expected?: string
}

// ===== TIPOS DE EXPORTACIÓN =====

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'json' | 'feature'
  filters?: FilterOptions
  includeAttachments?: boolean
  includeComments?: boolean
}

// ===== TIPOS DE CHAT ASSISTANT =====

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatRequest {
  message: string
  context?: {
    systemId?: string
    moduleId?: string
    testCaseId?: string
  }
}

// ===== TIPOS DE FORMULARIOS =====

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface TestPlanForm {
  jiraTask: string
  description: string
  systemId: string
}

export interface TestCaseForm {
  name: string
  description: string
  preconditions?: string
  steps: TestStep[]
  expectedResult: string
  priority: string
  testType: string
  testPlanId: string
  moduleId: string
  componentId?: string
  serviceId?: string
  responsibleDeveloper?: string
  dependsOnJiraTask?: string
  estimatedTime?: number
}

// ===== TIPOS DE SISTEMA =====

export interface SystemWithModules {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  modules: {
    id: string
    name: string
    description?: string
    components?: {
      id: string
      name: string
      description?: string
    }[]
  }[]
}

// ===== TIPOS DE MÉTRICAS =====

export interface CoverageMetrics {
  systemId: string
  systemName: string
  totalModules: number
  modulesWithTests: number
  coveragePercentage: number
  totalTestCases: number
  automatedTestCases: number
  automationPercentage: number
  
  modulesCoverage: {
    moduleId: string
    moduleName: string
    totalTestCases: number
    automated: number
    passRate: number
  }[]
}

// ===== TIPOS DE INTEGRACIÓN =====

export interface JiraIntegration {
  enabled: boolean
  baseUrl?: string
  apiToken?: string
  projectKey?: string
}

export interface SlackIntegration {
  enabled: boolean
  webhookUrl?: string
  channel?: string
}
