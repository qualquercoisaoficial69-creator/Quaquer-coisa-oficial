const { requireUser } = require('./_admin');

module.exports = async (request, response) => {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: 'Método não permitido.' });
    }
    try {
        const user = await requireUser(request);
        const email = (user.email || '').toLowerCase();
        const creators = new Set((process.env.AUTHORIZED_CREATOR_EMAILS || 'qualquercoisaoficial69@gmail.com,brennofirminodejesus@gmail.com,izam20027@gmail.com,gtofrazatto@gmail.com').split(',').map(value => value.trim().toLowerCase()));
        return response.status(200).json({
            uid: user.uid,
            name: user.name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            photoURL: user.picture || 'imagens/Logo_colorida.png',
            emailVerified: user.email_verified === true,
            role: creators.has(email) ? 'creator' : 'member'
        });
    } catch (error) {
        return response.status(error.status || 401).json({ error: error.message || 'Não foi possível validar o usuário.' });
    }
};
