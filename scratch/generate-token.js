const { SignJWT } = require('jose');

const JWT_SECRET = new TextEncoder().encode('jurnalstar_super_secret_key_123');

async function main() {
  const token = await new SignJWT({ 
    userId: 'test_user_id', 
    email: 'test@example.com',
    name: 'Test User' 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
    
  console.log(token);
}

main().catch(console.error);
