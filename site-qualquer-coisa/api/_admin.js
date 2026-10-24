const admin = require('firebase-admin');

function getAdmin() {
    if (!admin.apps.length) {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw Object.assign(new Error('O backend do Firebase não foi configurado.'), { status: 503 });
        }
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    return admin;
}

const creators = new Set((process.env.AUTHORIZED_CREATOR_EMAILS || 'qualquercoisaoficial69@gmail.com,brennofirminodejesus@gmail.com,izam20027@gmail.com,gtofrazatto@gmail.com').split(',').map(email => email.trim().toLowerCase()));

async function requireUser(request, requireCreator = false) {
    const firebaseAdmin = getAdmin();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw Object.assign(new Error('Login obrigatório.'), { status: 401 });
    const user = await firebaseAdmin.auth().verifyIdToken(token);
    if (!user.email || !user.email_verified) {
        throw Object.assign(new Error('Use uma conta Google com e-mail verificado.'), { status: 401 });
    }
    if (requireCreator && !creators.has(user.email.toLowerCase())) {
        throw Object.assign(new Error('Sem permissão para esta ação.'), { status: 403 });
    }
    return user;
}

module.exports = { getAdmin, getDb: () => getAdmin().firestore(), requireUser };
