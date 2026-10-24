# Configuração do backend na Vercel

No projeto da Vercel, em **Settings > Environment Variables**, cadastre as variáveis abaixo para os ambientes **Production** e **Preview**:

- `FIREBASE_SERVICE_ACCOUNT`: conteúdo JSON completo da conta de serviço do Firebase Admin SDK. Crie/baixe em **Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada**. Cole o JSON inteiro como valor da variável, sem colocar o arquivo no repositório.
- `GITHUB_TOKEN`: token do GitHub com permissão para gravar arquivos no repositório `qualquercoisaoficial69-creator/meu-site`.
- `AUTHORIZED_CREATOR_EMAILS` (opcional): lista de e-mails permitidos no CMS, separada por vírgulas. Se não definida, usa a lista padrão que já consta no site.

Cadastre as variáveis em **Settings > Environment Variables** para Production e Preview. Nunca compartilhe esses valores nem os coloque em arquivos do site. O Firebase Web API Key não é um segredo e continua configurado no código do site para autenticação Google.

Confirme que **Authentication > Sign-in method > Google** está ativado no Firebase e que o domínio da Vercel está em **Authentication > Settings > Authorized domains**. As funções do backend usam a conta de serviço para ler e gravar os posts no Firestore; por isso, as regras do Firestore não autorizam o navegador a gravar diretamente. Depois de salvar as variáveis, faça um novo deploy. O token do GitHub e a chave privada do Firebase ficam apenas nas funções da Vercel.
