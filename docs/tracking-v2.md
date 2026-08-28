# Tracking e integrações da V2

## Implementado no código

- Google Tag Manager `GTM-T2DK6BD6` nas seis páginas V2: Home, Operações Digitais, Press Kits, Como Trabalhamos, Quem Somos e Diagnóstico.
- Data Layer sem nome, e-mail, telefone, empresa, cargo, cidade, mensagem ou respostas de formulário.
- Persistência em sessão de `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, primeira página e referrer inicial.
- Persistência de página de origem, serviço de interesse e CTA de origem entre páginas e no envio interno ao Apps Script.
- Eventos: `cta_click`, `service_view`, `service_click`, `case_view`, `case_cta_click`, `method_view`, `whatsapp_click`, `form_start`, `lead_form_attempt`, `diagnostico_click`, `diagnostico_iframe_load` e `scroll_depth`.
- `page_view` não é emitido pelo código, evitando duplicidade com GA4 via GTM.
- Endpoint atual do Apps Script, número oficial do WhatsApp, iframe externo do Diagnóstico e seus parâmetros foram preservados.
- A abertura do WhatsApp não é tratada como confirmação de lead.
- `gclid` e `fbclid` ficam no contexto interno e podem acompanhar o lead, mas não entram automaticamente nos eventos analíticos.

## IDs estáveis dos CTAs

| CTA visível | `cta_id` atual | ID anterior documentado para migração |
| --- | --- | --- |
| Entender minha operação | `hero_diagnostico` | — |
| Falar com a Bora | `hero_whatsapp` | `whatsapp_home_hero` |
| Conhecer a operação digital | `operacoes_digitais_cta` | `service_digital` |
| Conversar sobre um projeto físico | `press_kits_cta` | `service_press` / `whatsapp_press_press_final` |
| Conhecer a Bora Fazer | `quem_somos_cta` | `about_experience` |
| Ver como trabalhamos | `metodo_cta` | `method_more` |

Os aliases anteriores permanecem no HTML em `data-legacy-cta-id` para uma migração explícita das variáveis e dos gatilhos no GTM.

## Parâmetros de funil

Conforme a interação: `page_path`, `page_title`, `section_origin`, `cta_id`, `cta_text`, `service_name`, `service_interest`, `case_id`, `whatsapp_location`, UTMs, primeira página e referrer inicial.

Operações Digitais preserva `service_interest = operacoes_digitais`; Press Kits preserva `service_interest = press_kits`. O contexto continua disponível ao navegar para Home, formulário, WhatsApp ou Diagnóstico.

## Dados internos enviados ao Apps Script

Nome, empresa, telefone, e-mail e mensagem permanecem restritos ao payload interno do formulário. O envio também mantém origem, página, serviço de interesse, UTMs, `gclid`, `fbclid`, referrer inicial e primeira página quando disponíveis. Esses dados pessoais não são enviados ao Data Layer.

## Conversões bloqueadas no código

- `lead_form_submit`: depende de confirmação confiável do Apps Script.
- `diagnostico_complete`: depende de `postMessage`, redirecionamento controlado ou evento confiável da aplicação externa.

## Pendente em contas externas

- Propriedade e Measurement ID do GA4.
- Tags, variáveis, gatilhos e marcação de conversões no GTM.
- Projeto e ID do Microsoft Clarity.
- Teste futuro no GTM Preview e no GA4 DebugView.
- Política de Privacidade com dados jurídicos confirmados.

Nenhum ID de GA4 ou Clarity foi inventado no código.