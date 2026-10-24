const { getAdmin, getDb, requireUser } = require('./_admin');

module.exports = async (request, response) => {
    try {
        const admin = getAdmin();
        const db = getDb();
        if (request.method === 'GET') {
            const snapshot = await db.collection('posts').orderBy('date', 'desc').get();
            return response.status(200).json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
        if (!['POST', 'DELETE', 'PATCH'].includes(request.method)) {
            response.setHeader('Allow', 'GET, POST, DELETE, PATCH');
            return response.status(405).json({ error: 'Método não permitido.' });
        }
        const user = await requireUser(request, request.method !== 'PATCH');
        const { post, postId } = request.body || {};
        if (request.method === 'POST' && post?.id) {
            const postId = String(post.id);
            if (!/^[\w-]{1,120}$/.test(postId) || typeof post.title !== 'string' || !post.title.trim() || typeof post.mediaUrl !== 'string') {
                return response.status(400).json({ error: 'Preencha os dados obrigatórios da publicação.' });
            }
            const postToSave = {
                title: post.title.trim().slice(0, 160),
                category: String(post.category || 'Devlog').slice(0, 40),
                author: String(post.author || user.name || user.email).slice(0, 100),
                authorAvatar: String(post.authorAvatar || '').slice(0, 1000),
                mediaUrl: post.mediaUrl.slice(0, 2000),
                caption: String(post.caption || '').slice(0, 5000),
                showInCarousel: post.showInCarousel === true,
                date: String(post.date || new Date().toISOString()),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            if (typeof post.lastEdited === 'string') postToSave.lastEdited = post.lastEdited;
            if (post.githubCommit) postToSave.githubCommit = String(post.githubCommit).slice(0, 100);
            if (post.githubCommitUrl) postToSave.githubCommitUrl = String(post.githubCommitUrl).slice(0, 2000);
            await db.collection('posts').doc(postId).set(postToSave, { merge: true });
            return response.status(200).json({ ok: true });
        }
        if (request.method === 'DELETE' && typeof postId === 'string' && /^[\w-]{1,120}$/.test(postId)) {
            await db.collection('posts').doc(postId).delete();
            return response.status(200).json({ ok: true });
        }
        if (request.method === 'PATCH' && typeof postId === 'string' && /^[\w-]{1,120}$/.test(postId)) {
            const postReference = db.collection('posts').doc(postId);
            let liked;
            await db.runTransaction(async transaction => {
                const snapshot = await transaction.get(postReference);
                if (!snapshot.exists) throw Object.assign(new Error('Publicação não encontrada.'), { status: 404 });
                const likedBy = snapshot.get('likedBy') || [];
                const alreadyLiked = likedBy.includes(user.uid);
                liked = !alreadyLiked;
                transaction.update(postReference, {
                    likes: Math.max(0, (snapshot.get('likes') || 0) + (liked ? 1 : -1)),
                    likedBy: liked ? admin.firestore.FieldValue.arrayUnion(user.uid) : admin.firestore.FieldValue.arrayRemove(user.uid)
                });
            });
            return response.status(200).json({ ok: true, liked });
        }
        return response.status(400).json({ error: 'Dados inválidos.' });
    } catch (error) {
        return response.status(error.status || 500).json({ error: error.message || 'Erro interno.' });
    }
};
