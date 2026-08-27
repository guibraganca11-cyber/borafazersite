# Tracking e integrações da V2

## Implementado no código

- Google Tag Manager GTM-T2DK6BD6 em todas as páginas da V2.
- Data Layer sem nome, e-mail, telefone, empresa ou mensagem.
- Persistência durante a sessão de utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, primeira página e referrer inicial.
- Persistência da página de origem, serviço de interesse e CTA de origem para continuidade entre páginas e envio interno ao Apps Script.
- Eventos de interesse: service_view, service_click, case_view, case_cta_click e method_view.
- Eventos de ação: cta_click, whatsapp_click, form_start, lead_form_attempt, diagnostico_click e diagnostico_iframe_load.
- Evento de profundidade: scroll_depth.
- page_view não é emitido pelo código para evitar duplicidade com GA4/GTM.
- O endpoint de Google Apps Script e o WhatsApp atuais foram preservados somente no código.
- A tentativa de envio pelo iframe oculto não permite ler uma confirmação confiável do Apps Script. Por isso, lead_form_submit não é emitido.
- A abertura do WhatsApp não é tratada como confirmação do registro do lead.
- gclid e fbclid ficam preservados internamente e podem acompanhar o lead, mas não são incluídos automaticamente nos eventos do Data Layer.

## Parâmetros de funil

Os eventos utilizam, conforme a interação: page_path, page_title, section_origin, service_interest, service_name, case_id, cta_id, cta_text, whatsapp_location, primeira página, referrer inicial e UTMs.

Os CTAs das páginas Operações Digitais e Press Kits registram o interesse correspondente antes da navegação. Esse contexto permanece disponível ao chegar ao Diagnóstico ou ao formulário.

## Pendente nas contas

- Propriedade e Measurement ID do GA4.
- Tags, variáveis e gatilhos no GTM.
- Conversões do GA4.
- Projeto e ID do Microsoft Clarity.
- Testes no GTM Preview e no GA4 DebugView.
- Política de Privacidade com dados jurídicos confirmados.

## Conversões não implementadas

- lead_form_submit: depende de confirmação confiável do Apps Script.
- diagnostico_complete: depende de acesso ao código-fonte externo, comunicação via window.postMessage, redirecionamento controlado ou evento emitido pela aplicação externa.

A conclusão do Diagnóstico não pode ser inferida pelo site principal apenas observando o iframe.
