# Preparação para publicação — BrandKit Studio

Esta é uma versão candidata a testes. O pacote está preparado para hospedagem estática, mas ainda há verificações manuais pendentes. Nenhum site público foi criado nesta etapa.

## O que publicar

Execute `pnpm build`. A pasta `dist` contém o site compilado. Publique **o conteúdo dessa pasta** na raiz de um domínio ou subdomínio com HTTPS. `index.html` deve ficar na raiz e a pasta `assets` deve ficar ao lado dele. O build atual usa caminhos absolutos para os recursos; hospedar em uma subpasta exige ajustar `base` no Vite e recompilar.

O ZIP em `output/release` contém somente esses arquivos. Extraia-o antes de enviar a uma hospedagem que receba pastas. Não publique o código-fonte, `node_modules`, PDFs de teste ou arquivos de projetos pessoais. O arquivo de hashes SHA-256 serve para conferir o conteúdo do pacote e deve ficar fora da pasta pública.

## Conferência antes de publicar

1. Execute `pnpm test`, `pnpm lint` e `pnpm build`.
2. Execute `pnpm preview` e abra o endereço informado no terminal. Essa prévia usa outro endereço/porta e pode mostrar uma lista de projetos vazia; isso não apaga os projetos do ambiente de desenvolvimento.
3. Crie um projeto descartável, envie uma logo, salve cores e textos e recarregue a página. Confira se os dados permanecem.
4. Em **Brand assets → Adjust size & position**, altere tamanho e posição e clique em **Save placement**. Confira a logo após recarregar e ao exportar o PDF. O ajuste acontece dentro da área da imagem e preserva a proporção. O fundo quadriculado é somente da tela de edição; fundos já presentes no arquivo original permanecem na exportação.
5. Exporte A4 e Letter, abra os arquivos baixados e confira todas as páginas. Teste o fluxo no celular e com teclado. A lista completa está em `docs/release-checklist.md`.

## Dados dos projetos

Os projetos e as imagens ficam no IndexedDB do navegador, vinculados ao endereço do site. A publicação não transfere os projetos de `127.0.0.1` para o novo domínio. Os JSONs de cores e tokens e o PDF não são backups completos que possam ser importados para restaurar um projeto.

Mantenha o ambiente local e seus dados enquanto testa a versão hospedada. Para levar os projetos existentes para outro endereço sem recriá-los, use **Export → Download project backup** no endereço antigo. No novo endereço, abra **All projects → Choose project backup** e selecione o arquivo. A restauração cria uma cópia com novos identificadores e datas, sem substituir os projetos existentes. Depois da publicação, mantenha o domínio estável. Atualizar os arquivos do site no mesmo endereço normalmente preserva o IndexedDB; futuras alterações no formato dos dados exigem migrações compatíveis.

## Atualizar ou voltar uma versão

Guarde uma cópia de cada pacote publicado. Para uma correção, execute as verificações novamente e publique o novo `dist` inteiro. Configure a hospedagem para revalidar `index.html`; os arquivos em `assets` têm nomes com hash e podem usar cache longo. Preserve arquivos de versões anteriores durante a troca para não interromper abas abertas que ainda precisem carregar o módulo de PDF.

Se necessário, restaure o pacote anterior. Isso restaura o aplicativo, não o conteúdo dos projetos. Antes de voltar uma versão que altere o banco de dados, confirme a compatibilidade do formato salvo. A versão atual usa schema de projeto 1 e banco IndexedDB 2.

## Limitações registradas

- Validação automática: testes de componentes e persistência simulada, lint e build. Não substitui testes de navegador.
- Controle automático do navegador indisponível nesta revisão; responsividade, leitores de tela e compatibilidade entre navegadores continuam pendentes.
- PDF rasterizado, sem texto selecionável ou marcação de acessibilidade.
- Sem conta ou sincronização em nuvem. O backup é manual: até 100 imagens, 50 MB de imagens no total e arquivo de até 75 MB.

A escolha de hospedagem e domínio ainda precisa ser definida para a publicação efetiva.

