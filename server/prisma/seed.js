const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ANIMATION_THEMES = [
  {
    name: 'particle-galaxy',
    displayName: 'Particle Galaxy',
    config: { type: 'particles', particleCount: 150, speed: 0.5, colors: ['#6366f1', '#8b5cf6', '#06b6d4'], connectParticles: true },
    isActive: true,
  },
  {
    name: 'neural-network',
    displayName: 'Neural Network',
    config: { type: 'neural', nodeCount: 80, connectionColor: '#6366f1', pulseSpeed: 2 },
    isActive: false,
  },
  {
    name: 'ocean-wave',
    displayName: 'Ocean Wave',
    config: { type: 'wave', waveCount: 3, amplitude: 60, colors: ['#0ea5e9', '#6366f1'], speed: 0.02 },
    isActive: false,
  },
  {
    name: 'matrix-rain',
    displayName: 'Matrix Rain',
    config: { type: 'matrix', fontSize: 14, color: '#06b6d4', speed: 50, chars: 'アイウエオカキクケコ0123456789ABCDEF' },
    isActive: false,
  },
  {
    name: 'geometric',
    displayName: 'Geometric Shapes',
    config: { type: 'geometric', shapeCount: 20, rotateSpeed: 0.3, colors: ['#6366f1', '#f59e0b', '#10b981'] },
    isActive: false,
  },
  {
    name: 'minimal-pulse',
    displayName: 'Minimal Pulse',
    config: { type: 'pulse', circleCount: 5, pulseSpeed: 3, color: '#6366f1', opacity: 0.15 },
    isActive: false,
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create animation themes
  for (const theme of ANIMATION_THEMES) {
    await prisma.animationTheme.upsert({
      where: { id: theme.name },
      update: {},
      create: { id: theme.name, ...theme }
    });
  }
  console.log('✅ Animation themes seeded');

  // Create default admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dungstady.edu.vn';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'Admin Dung Study',
        email: adminEmail,
        password: await bcrypt.hash('Admin@123456', 12),
        role: 'ADMIN',
        isVerified: true,
      }
    });
    console.log(`✅ Admin created: ${adminEmail} / Admin@123456`);
  }

  console.log('🎉 Seed completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
