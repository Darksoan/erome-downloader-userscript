# Erome Downloader

Userscript para o Erome com painel lateral moderno para selecionar mídias, baixar arquivos em lote e enviar itens para o Telegram.

## Demonstração

![Preview do Erome Downloader](preview.jpeg)

## Download

- `Latest release`: `https://github.com/Darksoan/erome-downloader/releases/latest/download/erome-downloader.user.js`

## Resumo

- Adiciona um modal flutuante com abas para download, Telegram e configuração.
- Permite selecionar mídias individualmente ou em massa.
- Inclui botões inline na página para baixar ou enviar cada mídia rapidamente.
- Salva histórico local de Chat IDs para facilitar o uso recorrente.
- Usa `GM_setValue` apenas para guardar token e Chat ID localmente no navegador.

## Requisitos

- Extensão/gerenciador de userscript: Tampermonkey, Violentmonkey, Greasemonkey ou outro compatível.
- Acesso ao domínio `erome.com`.
- Para envio ao Telegram, um bot ativo e um `Chat ID` válido.

## Instalação

### Opção 1: instalar pela extensão

1. Instale uma extensão de userscript no navegador, como Tampermonkey, Violentmonkey ou Greasemonkey.
2. Abra o arquivo `erome-downloader.user.js`.
3. Clique no link da release ou copie o conteúdo do script para um novo userscript na extensão.
4. Salve e ative o script.
5. Acesse uma página do Erome para o painel aparecer.

### Extensões compatíveis

- Tampermonkey: opção mais comum no Chrome, Edge e Firefox.
- Violentmonkey: leve e compatível com a maioria dos usuários.
- Greasemonkey: alternativa tradicional no Firefox.
- Outros gerenciadores de userscript compatíveis com `// ==UserScript==` também devem funcionar.

## Uso

1. Abra uma página com mídia no Erome.
2. Clique na aba lateral para abrir o painel.
3. Na aba `Download`, selecione os itens desejados.
4. Clique em `Baixar Selecionados` para fazer download em lote.
5. Na aba `Telegram`, informe o `Chat ID` e salve.
6. Na aba `Config`, informe o token do bot e salve localmente.
7. Use `Enviar Selecionados` para mandar os arquivos para o Telegram.
8. Use `Testar Conexão` para validar token e Chat ID.

## Funcionalidades

- Download em lote com barra de progresso.
- Envio de mídia para Telegram em grupos de arquivos.
- Botões inline por mídia: download e envio ao Telegram.
- Histórico de Chat IDs recentes.
- Interface lateral com tema escuro.

## Configuração do Telegram

- `Token do Bot`: crie um bot no BotFather e copie o token.
- `Chat ID`: informe o destino que receberá as mídias.
- Usuário privado: use o ID numérico direto, por exemplo `123456789`.
- Grupo ou supergrupo: use o formato completo com `-100`, por exemplo `-1001234567890`.
- Canal público ou grupo com username: use o formato `@nome_do_canal` ou `@nome_do_grupo`.
- Se você informar um ID negativo sem `-100`, o script tenta normalizar automaticamente adicionando o prefixo.
- O bot precisa estar no grupo/canal e ter permissão para enviar mídias.

## Estrutura

- `erome-downloader.user.js`: userscript principal.
- `README.md`: resumo e instruções de uso.

## Licença

MIT.
