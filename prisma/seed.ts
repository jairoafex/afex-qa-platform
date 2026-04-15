import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Limpiando datos existentes...')
    await prisma.comment.deleteMany()
    await prisma.attachment.deleteMany()
    await prisma.testCase.deleteMany()
    await prisma.testPlan.deleteMany()
    await prisma.component.deleteMany()
    await prisma.module.deleteMany()
    await prisma.system.deleteMany()
    await prisma.service.deleteMany()
    await prisma.user.deleteMany()
  }

  // Crear usuarios
  console.log('👤 Creando usuarios...')
  const adminPassword = await bcrypt.hash('admin123', 12)
  const qaPassword = await bcrypt.hash('qa123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@afex.com',
      name: 'Admin Afex',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const qa1 = await prisma.user.create({
    data: {
      email: 'qa@afex.com',
      name: 'QA Tester',
      password: qaPassword,
      role: 'QA',
    },
  })

  console.log('✅ Usuarios creados')

  // Crear sistemas
  console.log('🏢 Creando sistemas...')
  
  const afexPlus = await prisma.system.create({
    data: {
      name: 'Afex+',
      description: 'Plataforma principal de transferencias internacionales',
      color: '#5cb85c',
      icon: '💰',
    },
  })

  const connect = await prisma.system.create({
    data: {
      name: 'Connect',
      description: 'Sistema de integración con partners',
      color: '#3498db',
      icon: '🔗',
    },
  })

  await prisma.system.create({
    data: {
      name: 'Pullman',
      description: 'Sistema de gestión de buses',
      color: '#e74c3c',
      icon: '🚌',
    },
  })

  console.log('✅ Sistemas creados')

  // Crear módulos para Afex+
  console.log('📦 Creando módulos...')
  
  const girosModule = await prisma.module.create({
    data: {
      name: 'Giros',
      description: 'Gestión de giros y transferencias',
      systemId: afexPlus.id,
    },
  })

  const clientesModule = await prisma.module.create({
    data: {
      name: 'Gestión de Clientes',
      description: 'CRUD y validación de clientes',
      systemId: afexPlus.id,
    },
  })

  await prisma.module.create({
    data: {
      name: 'Pagos y Facturación',
      description: 'Procesamiento de pagos',
      systemId: afexPlus.id,
    },
  })

  // Módulos para Connect
  await prisma.module.create({
    data: {
      name: 'Integraciones API',
      description: 'APIs de terceros',
      systemId: connect.id,
    },
  })

  console.log('✅ Módulos creados')

  // Crear componentes
  console.log('🧩 Creando componentes...')
  
  await prisma.component.create({
    data: {
      name: 'Formulario de Cotización',
      description: 'Componente de cotización de giros',
      moduleId: girosModule.id,
    },
  })

  await prisma.component.create({
    data: {
      name: 'Validación de Destinatario',
      description: 'Verifica datos del beneficiario',
      moduleId: girosModule.id,
    },
  })

  await prisma.component.create({
    data: {
      name: 'Búsqueda de Cliente',
      description: 'Buscar cliente por RUT/ID',
      moduleId: clientesModule.id,
    },
  })

  console.log('✅ Componentes creados')

  // Crear servicios
  console.log('🔌 Creando servicios...')
  
  await prisma.service.create({
    data: {
      name: 'API de Cotización',
      description: 'Servicio REST para obtener tasas de cambio',
      endpoint: '/api/v1/cotizacion',
    },
  })

  await prisma.service.create({
    data: {
      name: 'API de Validación KYC',
      description: 'Validación de identidad de clientes',
      endpoint: '/api/v1/kyc/validate',
    },
  })

  console.log('✅ Servicios creados')

  // Crear plan de pruebas
  console.log('📋 Creando planes de prueba...')
  
  const testPlan1 = await prisma.testPlan.create({
    data: {
      jiraTask: 'AFEX-1234',
      description: 'Implementación de nuevo flujo de cotización internacional',
      systemId: afexPlus.id,
      userId: admin.id,
      status: 'IN_PROGRESS',
    },
  })

  const testPlan2 = await prisma.testPlan.create({
    data: {
      jiraTask: 'AFEX-1235',
      description: 'Mejoras en validación de datos de cliente',
      systemId: afexPlus.id,
      userId: qa1.id,
      status: 'DRAFT',
    },
  })

  console.log('✅ Planes de prueba creados')

  // Crear casos de prueba de ejemplo
  console.log('✅ Creando casos de prueba...')
  
  await prisma.testCase.create({
    data: {
      caseId: 'TC-001',
      name: 'Validar cotización de giro exitosa',
      description: 'Verificar que el usuario pueda cotizar un giro internacional seleccionando país de destino y monto',
      preconditions: 'Usuario autenticado en el sistema',
      steps: JSON.stringify([
        { order: 1, action: 'Acceder al módulo de Giros', data: '', expected: 'Se muestra el formulario de cotización' },
        { order: 2, action: 'Seleccionar país de destino', data: 'Estados Unidos', expected: 'Campo país actualizado' },
        { order: 3, action: 'Ingresar monto a enviar', data: '1000 USD', expected: 'Muestra cotización calculada' },
        { order: 4, action: 'Hacer clic en "Cotizar"', data: '', expected: 'Se genera cotización con tasa de cambio' },
      ]),
      expectedResult: 'Sistema muestra cotización con monto en CLP, tasa de cambio y comisión',
      priority: 'HIGH',
      testType: 'FUNCTIONAL',
      status: 'PASSED',
      testPlanId: testPlan1.id,
      systemId: afexPlus.id,
      moduleId: girosModule.id,
      userId: qa1.id,
      gherkinScenario: `Scenario: Cotizar giro internacional exitoso
  Given el usuario está autenticado en Afex+
  And está en la página de Giros
  When selecciona el país de destino "Estados Unidos"
  And ingresa el monto "1000 USD"
  And hace clic en el botón "Cotizar"
  Then el sistema muestra la cotización calculada
  And muestra el monto equivalente en CLP
  And muestra la tasa de cambio aplicada
  And muestra el total de comisiones`,
      executedAt: new Date(),
    },
  })

  await prisma.testCase.create({
    data: {
      caseId: 'TC-002',
      name: 'Validar error en cotización con monto inválido',
      description: 'Verificar que el sistema rechace cotizaciones con montos negativos o cero',
      preconditions: 'Usuario autenticado',
      steps: JSON.stringify([
        { order: 1, action: 'Acceder al módulo de Giros', data: '', expected: 'Formulario visible' },
        { order: 2, action: 'Seleccionar país', data: 'México', expected: 'País seleccionado' },
        { order: 3, action: 'Ingresar monto negativo', data: '-100 USD', expected: 'Muestra error de validación' },
      ]),
      expectedResult: 'Sistema muestra mensaje "El monto debe ser mayor a 0"',
      priority: 'MEDIUM',
      testType: 'FUNCTIONAL',
      status: 'PENDING',
      testPlanId: testPlan1.id,
      systemId: afexPlus.id,
      moduleId: girosModule.id,
      userId: qa1.id,
      gherkinScenario: `Scenario: Rechazar cotización con monto inválido
  Given el usuario está en la página de Giros
  When selecciona un país de destino
  And ingresa un monto "-100 USD"
  And hace clic en "Cotizar"
  Then el sistema muestra un error
  And el mensaje indica "El monto debe ser mayor a 0"`,
    },
  })

  await prisma.testCase.create({
    data: {
      caseId: 'TC-003',
      name: 'Búsqueda de cliente por RUT',
      description: 'Verificar que el sistema encuentre clientes existentes por RUT',
      preconditions: 'Existen clientes en la base de datos',
      steps: JSON.stringify([
        { order: 1, action: 'Acceder a Gestión de Clientes', data: '', expected: 'Vista principal' },
        { order: 2, action: 'Ingresar RUT en buscador', data: '12345678-9', expected: 'RUT ingresado' },
        { order: 3, action: 'Hacer clic en Buscar', data: '', expected: 'Muestra resultados' },
      ]),
      expectedResult: 'Se muestra información del cliente con nombre, email y estado',
      priority: 'HIGH',
      testType: 'FUNCTIONAL',
      status: 'IN_PROGRESS',
      testPlanId: testPlan2.id,
      systemId: afexPlus.id,
      moduleId: clientesModule.id,
      userId: admin.id,
    },
  })

  console.log('✅ Casos de prueba creados')

  // Crear configuraciones
  console.log('⚙️ Creando configuraciones...')
  
  await prisma.configuration.create({
    data: {
      key: 'jira_enabled',
      value: 'false',
      type: 'boolean',
      category: 'integration',
    },
  })

  await prisma.configuration.create({
    data: {
      key: 'slack_enabled',
      value: 'false',
      type: 'boolean',
      category: 'integration',
    },
  })

  await prisma.configuration.create({
    data: {
      key: 'ai_model',
      value: 'gpt-4-turbo-preview',
      type: 'string',
      category: 'ai',
    },
  })

  console.log('✅ Configuraciones creadas')

  console.log('')
  console.log('🎉 ¡Seed completado exitosamente!')
  console.log('')
  console.log('📧 Credenciales de acceso:')
  console.log('   Admin: admin@afex.com / admin123')
  console.log('   QA:    qa@afex.com / qa123')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
