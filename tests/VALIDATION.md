# Validação de compatibilidade mobile — v4.3.9

Data: 20/10/2026.

## Ambiente automatizado

- Windows, Node.js 24.21.0, Playwright 1.62.1.
- Chromium headless 151.0.7922.34, com emulação de toque e viewport mobile.
- Firefox headless 153.0 para os cenários de salvamento, com UA Android e APIs GM simuladas.
- Fixture local, sem mídia real. Todas as requisições de rede são interceptadas; as APIs GM são simuladas. Nenhuma mensagem é enviada ao Telegram.
- Verificação de sintaxe: `node --check erome-downloader.user.js`.

Execute `node tests/mobile-compat.cjs` com Playwright disponível no `NODE_PATH` e um Chromium de teste instalado. Para os cenários de salvamento no motor Firefox, use `TEST_ENGINE=firefox`. Opcionalmente, defina `TEST_BROWSER_PATH` para o executável e `TEST_SCREENSHOT` para salvar uma captura. Playwright é usado apenas nos testes; o userscript não possui dependências novas.

## Cobertura

34 cenários de integração no Chromium:

- Modo “Browser API” e modo nativo no Firefox Android usam a fila de salvamento pela própria aba. O teste confirma que `GM_download` não é chamado, que os três arquivos são obtidos por `GM_xmlhttpRequest` e que cada salvamento gera um download separado.
- Primeiro arquivo salvo automaticamente a partir do toque em “Baixar Selecionados”; os arquivos seguintes são preparados um por vez e aguardam um toque real em “Salvar arquivo”. O teste verifica que a fila não avança sozinha, que o botão permanece desabilitado e que a URL do arquivo pendente continua válida.
- URLs de blob não são revogadas imediatamente: o teste confirma que nenhuma URL foi revogada durante a fila, para que o Firefox Android possa terminar de ler o arquivo depois da confirmação.
- A fila avança após falhas de rede e respostas HTML inválidas, sem oferecer o conteúdo inválido como mídia e sem travar o botão.
- O fluxo do Firefox Android funciona mesmo quando `GM_download` não existe.
- Em desktop, o modo nativo do Violentmonkey mostra o aviso para ativar a browser download API, exibe o modo assistido e mantém o link manual quando o download falha.
- O modo nativo do Tampermonkey no Firefox Android mostra o modo de salvamento pela aba, sem alerta de download indisponível.
- Barra de preparação atualizada pelos eventos de bytes recebidos e pelos tamanhos consultados: o teste verificou 13% (2 B de 15 B) durante o recebimento e 100% no final. Sem tamanho conhecido, usa progresso indeterminado. A mensagem “Preparando arquivo” não aparece.
- Painel lateral com largura máxima de 520 px ou 85% da área visível: deixa a página clicável e permite sua rolagem, sem bloqueio do corpo, escurecimento da página ou salto ao fechar.
- Layout em 320×640, 360×740, 412×850, 740×360, 360×280 e desktop 1280×800; controles por toque de 48 px e campos com fonte de 16 px.
- O painel acompanha `visualViewport` ao simular teclado (altura e deslocamento) e ao aplicar zoom de 2×.
- Acionador lateral visível mesmo com CSS da página ocultando botões vazios e restringindo seu conteúdo; abertura por clique, Enter e Espaço. Esse cenário simulado reproduziu o desaparecimento na versão 4.3.0 e passou após restaurar o acionador não nativo. Não confirma quais regras estão presentes no aparelho do usuário.
- Abertura alternativa pelo comando “Abrir Download Manager” do gerenciador de userscripts.
- Seleção individual, selecionar/desselecionar todos, preservação dos elementos da lista e da rolagem; posição da página preservada ao fechar.
- Downloads concluídos, permissão negada, timeout e API de download ausente; limite de dois downloads simultâneos com toque; callbacks duplicados ignorados.
- APIs de armazenamento e requisição ausentes nos três idiomas; exceções ao ler e salvar configurações sem interromper a interface.
- Falha no botão inline revela links manuais; toque no link abre outra aba sem navegar a página original.
- Telegram: grupos de dois arquivos em dispositivos com toque e até dez no desktop; liberação das referências aos arquivos após envio.
- Falhas parciais de download/upload no Telegram: continuidade dos grupos, contagem de resultados e detalhes persistentes no painel; referências liberadas também após erro.

9 cenários de salvamento no motor Firefox (UA Android, APIs GM simuladas), cobrindo a fila, o primeiro salvamento automático, os toques reais nos arquivos seguintes, a ausência de `GM_download` e falhas de rede/conteúdo inválido.

## Validação em dispositivo pendente

Os testes automatizados não certificam Firefox Android, Chrome Android ou iOS reais, nem o comportamento de um gerenciador de userscripts específico. Ainda é necessário registrar as versões de Android/iOS, navegador e gerenciador e verificar:

- Teclado real, barras do navegador, rotação, zoom por gesto e recortes da tela.
- Permissões reais de download e destino dos arquivos, inclusive URLs externas.
- No Firefox Android, o primeiro salvamento automático e os toques reais nos arquivos seguintes, mantendo todos os arquivos separados. O script não confirma a gravação no dispositivo nem elimina confirmações nativas do Firefox.
- No Chrome/Edge Android, o modo “Browser API” do gerenciador e o salvamento de todos os arquivos sem confirmação por toque.
- Em iOS, o suporte de `GM.*` do gerenciador, o download de blobs e a abertura de links manuais.
- Autorização das requisições GM, progresso e upload multipart no gerenciador.
- Troca de aplicativo, bloqueio de tela, rede interrompida e retorno do segundo plano. O script não garante execução enquanto o navegador estiver suspenso.
- Consumo de memória com arquivos grandes em um aparelho com pouca RAM.
- Envio real ao Telegram, limites de 50 MB e comportamento de mídia inválida.

O armazenamento continua restrito ao gerenciador de userscripts; sua indisponibilidade não provoca uso de localStorage para credenciais.
