# Erome Downloader

Userscript para o Erome com painel lateral moderno para selecionar mídias, baixar arquivos em lote e enviar itens para o Telegram.

## Download

- `Latest release`: `https://github.com/Darksoan/erome-downloader/releases/latest/download/erome-downloader.user.js`

## Resumo

- Adiciona um modal flutuante com abas para download, Telegram e configuração.
- Permite selecionar mídias individualmente ou em massa.
- Inclui botões inline na página para baixar ou enviar cada mídia rapidamente.
- Salva histórico local de Chat IDs para facilitar o uso recorrente.
- Usa `GM_setValue` apenas para guardar token e Chat ID localmente no navegador.

## Requisitos

- Extensão de userscript: Tampermonkey ou Greasemonkey.
- Acesso ao domínio `erome.com`.
- Para envio ao Telegram, um bot ativo e um `Chat ID` válido.

## Instalação

1. Abra o arquivo `erome-downloader.user.js`.
2. Baixe a versão publicada em `Releases` ou use o arquivo `erome-downloader.user.js`.
3. Crie um novo userscript na sua extensão.
4. Cole o conteúdo do arquivo e salve.
5. Acesse uma página do Erome para o painel aparecer.

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
- `Chat ID`: use o ID do usuário, grupo ou canal.
- IDs de grupo podem ser normalizados automaticamente.

## Estrutura

- `erome-downloader.user.js`: userscript principal.
- `README.md`: resumo e instruções de uso.

## Licença

MIT.
