# Permissões solicitadas

Para obter uma explicação geral sobre as permissões da extensão, consulte [este artigo de suporte](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Permissões de instalação

Atualmente, nenhuma permissão é solicitada na instalação ou ao atualizar a extensão.

## Permissões (opcionais) de recursos específicos

Essas permissões são solicitadas ao realizar algumas ações específicas, se forem necessárias para isso.

| Id interno       | Permissão                   | Solicitada em/quando…                                                                         | Explicação                                                                                                                                                                                      |
|:-----------------|:----------------------------|:----------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clipboardWrite` | Dados da digitação para a área de transferência | Quando você ativar uma opção que exige a cópia do emoji de forma assíncrona para a área de transferência. | Necessária para copiar o emoji para a área de transferência, _apenas_ se a inserção na página falhar (se você sempre quiser copiar o emoji, essa permissão _não_ será solicitada/necessária.) _ou_ necessária se você deseja copiar o emoji através da pesquisa na barra de endereço. |

## Permissões escondidas

Além disso, essa extensão solicita as seguintes permissões, que não solicitadas no Firefox quando a extensão é instalada, pois não são uma permissão profunda.

| Id interno  | Permissão                  | Explicação                                                        |
|:------------|:---------------------------|:------------------------------------------------------------------|
| `activeTab` | Acessa a aba/site atual    | Necessária para inserir o emoji no site atual, quando essa possibilidade está ativada. |
| `storage`   | Accessa o armazenamento local | Necessária para salvar opções                                  |
