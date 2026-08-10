const { PrismaClient } = require('./src/generated/prisma/client.ts');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

(async () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true, name: true, department: true }
    });
    
    console.log('=== ACTUAL SEED USERS ===');
    console.log('Total users:', users.length);
    
    // Group by role
    const byRole = {};
    users.forEach(u => {
      if (!byRole[u.role]) byRole[u.role] = [];
      byRole[u.role].push(u);
    });
    
    console.log('\nUsers by role:');
    Object.entries(byRole).sort((a, b) => a[0].localeCompare(b[0])).forEach(([role, roleUsers]) => {
      console.log(role + ': ' + roleUsers.length + ' users');
    });
    
    console.log('\n=== TEST_LOGINS.MD DOCUMENTED ROLES vs ACTUAL ===');
    const testLoginsRoles = [
      'General Manager', 'Director', 'HR Manager', 'HR Assistant', 'Records Officer',
      'Business Development Manager', 'Sales and Marketing Supervisor', 'Operations Manager',
      'Regional Manager', 'Fleet Manager', 'Training Officer', 'Investigations Officer',
      'Guard Officer', 'Armorer', 'K9 Supervisor', 'K9 Handler', 'Finance Manager',
      'Accountant', 'Assistant Accountant', 'Internal Auditor', 'Cashier', 'Administrative Officer',
      'IT Officer'
    ];
    
    console.log('\nComparison:');
    let missingCount = 0;
    testLoginsRoles.forEach(role => {
      const count = (byRole[role] || []).length;
      if (count === 0) {
        console.log('❌ ' + role + ' - NOT FOUND IN DATABASE');
        missingCount++;
      } else {
        console.log('✅ ' + role + ' - ' + count + ' user(s) found');
      }
    });
    
    console.log('\nSummary: ' + missingCount + ' roles from TEST_LOGINS.md not found in database');
    
  } finally {
    await prisma.$disconnect();
  }
});
