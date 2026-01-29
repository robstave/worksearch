import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  async function ensureUser(opts: {
    email: string;
    password: string;
    role: 'admin' | 'aiuser' | 'user';
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: opts.email },
      select: { id: true, email: true, role: true },
    });

    if (existing) {
      console.log('User already exists:', existing.email);
      return existing.id;
    }

    const passwordHash = await bcrypt.hash(opts.password, 10);

    const created = await prisma.user.create({
      data: {
        email: opts.email,
        passwordHash,
        role: opts.role,
      },
      select: { id: true, email: true, role: true },
    });

    console.log('Created user:', created.email, `(role: ${created.role})`);
    return created.id;
  }

  await ensureUser({
    email: 'admin@worksearch.local',
    password: 'admin123',
    role: 'admin',
  });

  const demoUserId = await ensureUser({
    email: 'demo@worksearch.local',
    password: 'demo123',
    role: 'user',
  });

  // Seed demo data for demo user
  if (demoUserId) {
    await seedDemoData(demoUserId);
  }

  console.log('Default credentials:');
  console.log('- admin@worksearch.local / admin123');
  console.log('- demo@worksearch.local / demo123');
}

async function seedDemoData(userId: string) {
  // Check if demo user already has data
  const existingCompanies = await prisma.company.count({
    where: { ownerId: userId },
  });

  if (existingCompanies > 0) {
    console.log('Demo user already has data, skipping seed');
    return;
  }

  console.log('Seeding demo data...');

  // Create 10 companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'TechCorp',
        website: 'https://techcorp.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'DataSystems Inc',
        website: 'https://datasystems.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'CloudNine',
        website: 'https://cloudnine.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'AI Innovations',
        website: 'https://aiinnovations.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'StartupHub',
        website: 'https://startuphub.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'Enterprise Solutions',
        website: 'https://enterprisesolutions.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'DevOps Pro',
        website: 'https://devopspro.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'Mobile First',
        website: 'https://mobilefirst.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'SecurityTech',
        website: 'https://securitytech.example.com',
      },
    }),
    prisma.company.create({
      data: {
        ownerId: userId,
        name: 'FinTech Solutions',
        website: 'https://fintechsolutions.example.com',
      },
    }),
  ]);

  console.log(`Created ${companies.length} companies`);

  // Helper function to transition an application through states
  async function transitionApp(
    appId: string,
    states: Array<{ state: any; appliedAt?: Date; note?: string }>,
  ) {
    for (const { state, appliedAt, note } of states) {
      const app = await prisma.application.findUnique({
        where: { id: appId },
        select: { currentState: true },
      });

      await prisma.stateTransition.create({
        data: {
          applicationId: appId,
          fromState: app?.currentState,
          toState: state,
          actorUserId: userId,
          note,
        },
      });

      await prisma.application.update({
        where: { id: appId },
        data: {
          currentState: state,
          ...(appliedAt && state === 'APPLIED' && { appliedAt }),
        },
      });
    }
  }

  // Create 12 applications - all start as INTERESTED
  // TechCorp - 2 applications
  const app1 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[0].id,
      jobTitle: 'Senior Full Stack Developer',
      currentState: 'INTERESTED',
      workLocation: 'REMOTE',
      jobReqUrl: 'https://techcorp.example.com/careers/senior-fullstack',
      jobDescriptionMd: 'Build scalable web applications using React and Node.js.',
      tagsList: ['javascript', 'react', 'nodejs'],
    },
  });
  await transitionApp(app1.id, [{ state: 'APPLIED', appliedAt: new Date('2026-01-15') }]);

  const app2 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[0].id,
      jobTitle: 'DevOps Engineer',
      currentState: 'INTERESTED',
      workLocation: 'HYBRID',
      jobReqUrl: 'https://techcorp.example.com/careers/devops',
      jobDescriptionMd: 'Manage CI/CD pipelines and cloud infrastructure.',
      tagsList: ['devops', 'aws', 'kubernetes'],
    },
  });
  // Stays in INTERESTED

  // DataSystems Inc - 2 applications
  const app3 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[1].id,
      jobTitle: 'Data Engineer',
      currentState: 'INTERESTED',
      workLocation: 'REMOTE',
      jobReqUrl: 'https://datasystems.example.com/careers/data-engineer',
      jobDescriptionMd: 'Build data pipelines and ETL processes.',
      tagsList: ['python', 'sql', 'spark'],
    },
  });
  await transitionApp(app3.id, [
    { state: 'APPLIED', appliedAt: new Date('2026-01-20') },
    { state: 'SCREENING', note: 'Phone screen scheduled' },
  ]);

  const app4 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[1].id,
      jobTitle: 'Machine Learning Engineer',
      currentState: 'INTERESTED',
      workLocation: 'REMOTE',
      jobReqUrl: 'https://datasystems.example.com/careers/ml-engineer',
      jobDescriptionMd: 'Develop and deploy ML models at scale.',
      tagsList: ['python', 'tensorflow', 'ml'],
    },
  });
  await transitionApp(app4.id, [{ state: 'APPLIED', appliedAt: new Date('2026-01-18') }]);

  // CloudNine
  const app5 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[2].id,
      jobTitle: 'Cloud Architect',
      currentState: 'INTERESTED',
      workLocation: 'REMOTE',
      jobReqUrl: 'https://cloudnine.example.com/careers/architect',
      jobDescriptionMd: 'Design and implement cloud-native solutions.',
      tagsList: ['aws', 'architecture', 'microservices'],
    },
  });
  await transitionApp(app5.id, [
    { state: 'APPLIED', appliedAt: new Date('2026-01-10') },
    { state: 'SCREENING', note: 'Passed initial screen' },
    { state: 'INTERVIEW', note: 'Technical interview next week' },
  ]);

  // AI Innovations
  const app6 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[3].id,
      jobTitle: 'AI Research Engineer',
      currentState: 'INTERESTED',
      workLocation: 'ONSITE',
      jobReqUrl: 'https://aiinnovations.example.com/careers/research',
      jobDescriptionMd: 'Research and develop cutting-edge AI algorithms.',
      tagsList: ['ai', 'research', 'python'],
    },
  });
  await transitionApp(app6.id, [
    { state: 'APPLIED', appliedAt: new Date('2026-01-05') },
    { state: 'SCREENING' },
    { state: 'REJECTED', note: 'Not moving forward' },
  ]);

  // StartupHub - 2 applications
  const app7 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[4].id,
      jobTitle: 'Frontend Developer',
      currentState: 'INTERESTED',
      workLocation: 'REMOTE',
      jobReqUrl: 'https://startuphub.example.com/careers/frontend',
      jobDescriptionMd: 'Create beautiful, responsive user interfaces.',
      tagsList: ['react', 'typescript', 'css'],
    },
  });
  await transitionApp(app7.id, [{ state: 'APPLIED', appliedAt: new Date('2026-01-22') }]);

  const app8 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[4].id,
      jobTitle: 'Product Manager',
      currentState: 'INTERESTED',
      workLocation: 'HYBRID',
      jobReqUrl: 'https://startuphub.example.com/careers/pm',
      jobDescriptionMd: 'Lead product strategy and roadmap.',
      tagsList: ['product', 'management', 'strategy'],
    },
  });
  // Stays in INTERESTED

  // Enterprise Solutions
  const app9 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[5].id,
      jobTitle: 'Backend Developer',
      currentState: 'INTERESTED',
      workLocation: 'HYBRID',
      jobReqUrl: 'https://enterprisesolutions.example.com/careers/backend',
      jobDescriptionMd: 'Build robust APIs and microservices.',
      tagsList: ['java', 'spring', 'microservices'],
    },
  });
  await transitionApp(app9.id, [
    { state: 'APPLIED', appliedAt: new Date('2026-01-12') },
    { state: 'SCREENING', note: 'Completed coding challenge' },
  ]);

  // DevOps Pro
  const app10 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[6].id,
      jobTitle: 'Site Reliability Engineer',
      currentState: 'INTERESTED',
      workLocation: 'REMOTE',
      jobReqUrl: 'https://devopspro.example.com/careers/sre',
      jobDescriptionMd: 'Ensure system reliability and performance.',
      tagsList: ['sre', 'monitoring', 'automation'],
    },
  });
  await transitionApp(app10.id, [
    { state: 'APPLIED', appliedAt: new Date('2025-12-20') },
    { state: 'SCREENING' },
    { state: 'GHOSTED', note: 'No response after 3 weeks' },
  ]);

  // Mobile First
  const app11 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[7].id,
      jobTitle: 'iOS Developer',
      currentState: 'INTERESTED',
      workLocation: 'REMOTE',
      jobReqUrl: 'https://mobilefirst.example.com/careers/ios',
      jobDescriptionMd: 'Develop native iOS applications.',
      tagsList: ['swift', 'ios', 'mobile'],
    },
  });
  // Stays in INTERESTED

  // SecurityTech
  const app12 = await prisma.application.create({
    data: {
      ownerId: userId,
      companyId: companies[8].id,
      jobTitle: 'Security Engineer',
      currentState: 'INTERESTED',
      workLocation: 'HYBRID',
      jobReqUrl: 'https://securitytech.example.com/careers/security',
      jobDescriptionMd: 'Implement security best practices and incident response.',
      tagsList: ['security', 'compliance', 'networking'],
    },
  });
  await transitionApp(app12.id, [
    { state: 'APPLIED', appliedAt: new Date('2026-01-08') },
    { state: 'SCREENING', note: 'Technical phone screen completed' },
    { state: 'INTERVIEW', note: 'Onsite interview completed' },
    { state: 'OFFER', note: 'Verbal offer received!' },
  ]);

  console.log('Created 12 applications with proper state transitions');
  console.log('Demo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
