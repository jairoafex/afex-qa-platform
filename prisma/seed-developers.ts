import prisma from '../src/lib/prisma'

async function seedDevelopers() {
  const developers = [
    { name: 'Juan Pérez', email: 'juan.perez@afex.com', area: 'Frontend' },
    { name: 'María González', email: 'maria.gonzalez@afex.com', area: 'Backend' },
    { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@afex.com', area: 'Full Stack' },
    { name: 'Ana Martínez', email: 'ana.martinez@afex.com', area: 'QA' },
    { name: 'Luis Fernández', email: 'luis.fernandez@afex.com', area: 'DevOps' },
  ]

  for (const dev of developers) {
    await prisma.developer.upsert({
      where: { name: dev.name },
      update: {},
      create: dev,
    })
  }

  console.log('✅ Desarrolladores creados')
}

seedDevelopers()
  .then(() => {
    console.log('✅ Seed de desarrolladores completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  })
