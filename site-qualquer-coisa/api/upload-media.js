const { requireUser } = require('./_admin');

const REPOSITORY = 'qualquercoisaoficial69-creator/meu-site';
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const EXTENSIONS_BY_CONTENT_TYPE = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
};

function sendJson(response, status, payload) {
    response.status(status).json(payload);
}

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Método não permitido.' });
    }

    if (!process.env.GITHUB_TOKEN || !process.env.FIREBASE_SERVICE_ACCOUNT) {
        return sendJson(response, 503, { error: 'O envio de mídia ainda não foi configurado na Vercel.' });
    }

    const { fileName, contentType, content, postTitle } = request.body || {};
    if (!fileName || !content || !ALLOWED_CONTENT_TYPES.has(contentType)) {
        return sendJson(response, 400, { error: 'Envie uma imagem JPG, PNG, GIF ou WebP válida.' });
    }

    const fileBuffer = Buffer.from(content, 'base64');
    if (!fileBuffer.length || fileBuffer.length > MAX_FILE_SIZE_BYTES) {
        return sendJson(response, 400, { error: 'A imagem deve ter no máximo 3 MB.' });
    }

    let firebaseUser;
    try {
        firebaseUser = await requireUser(request, true);
    } catch (error) {
        return sendJson(response, error.status || 401, { error: error.message || 'Não foi possível validar seu login.' });
    }

    const extension = EXTENSIONS_BY_CONTENT_TYPE[contentType];
    const safeTitle = (postTitle || 'post').toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 20);
    const filename = `post_${Date.now()}_${safeTitle}.${extension}`;
    const filePath = `imagens/posts/${filename}`;

    try {
        const githubResponse = await fetch(`https://api.github.com/repos/${REPOSITORY}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                message: `cms: upload da mídia '${filename}' via Creator Studio [skip ci]`,
                content,
                branch: 'main'
            })
        });
        const githubData = await githubResponse.json();
        if (!githubResponse.ok) {
            return sendJson(response, 502, { error: githubData.message || 'O GitHub recusou o envio da imagem.' });
        }

        return sendJson(response, 201, {
            filename,
            path: filePath,
            rawUrl: `https://raw.githubusercontent.com/${REPOSITORY}/main/${filePath}`,
            commitSha: githubData.commit?.sha || '',
            commitHtmlUrl: githubData.commit?.html_url || ''
        });
    } catch {
        return sendJson(response, 502, { error: 'Não foi possível conectar ao GitHub.' });
    }
};
