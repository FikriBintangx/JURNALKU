import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Users (30 users)
  const hashedPassword = await bcrypt.hash('password123', 12);
  const usersData = Array.from({ length: 30 }).map((_, i) => ({
    name: `User ${i + 1}`,
    email: `user${i + 1}@jurnalstar.id`,
    password: hashedPassword,
  }));

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }
  console.log('✓ 30 Users seeded');

  // 2. Seed Journals (30 journals)
  const journalsData = [
    {
      id: 'paper-001',
      title: 'Implementasi Deep Learning untuk Deteksi Penyakit Tanaman',
      abstract: 'Penelitian ini membahas penggunaan Convolutional Neural Networks (CNN) untuk mendeteksi penyakit pada daun padi dengan akurasi tinggi.',
      author: 'Dr. Ahmad Fauzi',
      year: 2023,
      source: 'Semantic Scholar',
      isOpenAccess: true,
      citations: 45,
      keywords: ['Deep Learning', 'Pertanian', 'CNN'],
    },
    {
      id: 'paper-002',
      title: 'Analisis Keamanan Jaringan IoT pada Smart Home System',
      abstract: 'Mengidentifikasi kerentanan pada protokol komunikasi perangkat IoT di lingkungan rumah pintar dan memberikan solusi enkripsi baru.',
      author: 'Siti Aminah, M.Kom',
      year: 2024,
      source: 'OpenAlex',
      isOpenAccess: false,
      citations: 12,
      keywords: ['IoT', 'Security', 'Encryption'],
    },
    // ... adding more programmatically to reach 30
  ];

  // Fill up to 30
  for (let i = 3; i <= 30; i++) {
    journalsData.push({
      id: `paper-0${i < 10 ? '0' + i : i}`,
      title: `Riset Teknologi Masa Depan Volume ${i}`,
      abstract: `Abstrak untuk penelitian volume ${i} yang membahas inovasi terbaru dalam bidang teknologi informasi dan dampaknya pada masyarakat modern.`,
      author: `Peneliti Ke-${i}`,
      year: 2020 + (i % 6),
      source: i % 2 === 0 ? 'Semantic Scholar' : 'Crossref',
      isOpenAccess: i % 3 === 0,
      citations: Math.floor(Math.random() * 100),
      keywords: ['Technology', 'Future', 'Research'],
    });
  }

  for (const j of journalsData) {
    await prisma.journal.upsert({
      where: { id: j.id },
      update: {},
      create: j,
    });
  }
  console.log('✓ 30 Journals seeded');

  // 3. Seed History (30 entries)
  const historyData = Array.from({ length: 30 }).map((_, i) => ({
    userId: `session-${Math.floor(Math.random() * 5) + 1}`,
    query: ['Artificial Intelligence', 'Blockchain', 'Quantum Computing', 'Data Science', 'Cybersecurity'][i % 5],
  }));

  await prisma.history.createMany({
    data: historyData,
  });
  console.log('✓ 30 History entries seeded');

  // 4. Seed Bookmarks (30 entries)
  const allJournals = await prisma.journal.findMany({ select: { id: true } });
  const bookmarkData = Array.from({ length: 30 }).map((_, i) => ({
    userId: `user-session-${(i % 10) + 1}`,
    journalId: allJournals[i % allJournals.length].id,
  }));

  for (const b of bookmarkData) {
    await prisma.bookmark.upsert({
      where: { 
        userId_journalId: { 
          userId: b.userId, 
          journalId: b.journalId 
        } 
      },
      update: {},
      create: b,
    });
  }
  console.log('✓ 30 Bookmarks seeded');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
