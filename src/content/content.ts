/**
 * Todo o texto da landing page, em um só lugar (decisions §3).
 *
 * - Comentários `// [STATUS]` seguem a legenda do §3 e permitem conferir, na
 *   Fase 4, que nada do site original se perdeu (checklist do §4).
 * - `placeholder(...)` marca o que só a Saurs pode fornecer; não vai para produção.
 * - Os textos `[VALIDAR]` estão listados em `review`, no fim do arquivo.
 */

import { WHATSAPP_DISPLAY, whatsappUrl } from "@/lib/whatsapp";
import type { ImageAsset, Link, Maybe, ReviewItem } from "./types";
import { placeholder } from "./types";

/* ------------------------------------------------------------------ */
/* Site                                                                */
/* ------------------------------------------------------------------ */

export const site = {
  name: "Saurs Developers",
  url: "https://saurs.dev",
  lang: "pt-BR",
  locale: "pt_BR",
  motto: ["THINK", "DEVELOP", "DELIVER", "REPEAT"] as const, // [MANTIDO] em inglês, assinatura da marca
  whatsapp: { display: WHATSAPP_DISPLAY, href: whatsappUrl() },
  email: placeholder("E-mail de contato") as Maybe<string>,
  cnpj: placeholder("CNPJ") as Maybe<string>,
  city: placeholder("Cidade/UF") as Maybe<string>,
  social: placeholder("Redes sociais (Instagram, LinkedIn…)") as Maybe<Link[]>,
  privacyPolicy: placeholder("Política de privacidade") as Maybe<Link>,
} as const;

/** IDs das seções: fonte única para âncoras, header e links internos. */
export const sectionIds = {
  main: "conteudo",
  hero: "inicio",
  proof: "resultados",
  problem: "problema",
  solution: "solucao",
  services: "servicos",
  howItWorks: "como-funciona",
  cases: "cases",
  caseCspr: "case-cspr",
  caseGTraining: "case-g-training",
  manifesto: "futuro",
  faq: "duvidas",
  contact: "contato",
} as const;

export type SectionId = (typeof sectionIds)[keyof typeof sectionIds];

const anchor = (id: SectionId) => `#${id}`;

/* ------------------------------------------------------------------ */
/* Metadados (decisions §3.12) — consumidos na Fase 3e                 */
/* ------------------------------------------------------------------ */

export const meta = {
  title: "Saurs Developers — Software sob medida para sua empresa", // [NOVO]
  description:
    "Sites, sistemas, aplicativos e SaaS sob medida para sua empresa render mais. Veja nossos cases e fale com a Saurs Developers.", // [NOVO]
  ogImage: { src: "/og.png", width: 1200, height: 630, alt: "Saurs Developers" }, // gerada na 3b a partir do fallback do hero
  address: placeholder("Endereço para o JSON-LD") as Maybe<string>,
} as const;

/* ------------------------------------------------------------------ */
/* 3.1 Header                                                          */
/* ------------------------------------------------------------------ */

export const header = {
  logoLabel: "Saurs Developers — voltar ao início", // [NOVO] nome acessível do link do logo
  nav: [
    { label: "Como funciona", href: anchor(sectionIds.howItWorks) },
    { label: "Cases", href: anchor(sectionIds.cases) },
    { label: "Serviços", href: anchor(sectionIds.services) },
    { label: "Dúvidas", href: anchor(sectionIds.faq) },
  ] satisfies Link[], // [NOVO]
  cta: { label: "Fale com a gente", href: whatsappUrl(), external: true } satisfies Link, // [NOVO]
  menuLabel: { open: "Abrir menu", close: "Fechar menu" }, // [NOVO]
} as const;

/* ------------------------------------------------------------------ */
/* 3.2 Hero                                                            */
/* ------------------------------------------------------------------ */

export const hero = {
  eyebrow: "Inovação estratégica para sua empresa", // [MOVIDO] era o H1
  title: "Software sob medida para o seu negócio render mais.", // [NOVO]
  titleAlternatives: [
    "Transformamos a operação da sua empresa em software que dá resultado.",
    "Do caos operacional ao sistema que trabalha por você.",
  ],
  subtitle:
    "Sites, sistemas, aplicativos e SaaS pensados para a sua operação, da ideia à entrega, com suporte depois do lançamento.", // [NOVO] serviços e "suporte" vêm do original
  primaryCta: {
    label: "Falar sobre meu projeto",
    href: whatsappUrl(),
    external: true,
  } satisfies Link, // [NOVO]
  secondaryCta: { label: "Ver cases", href: anchor(sectionIds.cases) } satisfies Link, // [NOVO]
} as const;

/* ------------------------------------------------------------------ */
/* 3.3 Prova social                                                    */
/* ------------------------------------------------------------------ */

export const proof = {
  highlight: {
    value: "Até R$ 80 mil por ano", // [NOVO formato] único número real (depoimento Florestcon)
    label: "em custos cortados",
    source: "Florestcon, com o CSPR Dashboard",
    href: anchor(sectionIds.caseCspr),
  },
  line: "Projetos entregues para engenharia elétrica e para nutrição e treinamento.", // [VALIDAR]
  clients: ["Florestcon", "Geovanni Sampaio"], // [NOVO] em texto
  clientLogos: placeholder("Logos dos clientes, se houver arquivo e autorização") as Maybe<
    ImageAsset[]
  >,
} as const;

/* ------------------------------------------------------------------ */
/* 3.4 Problema                                                        */
/* ------------------------------------------------------------------ */

export const problem = {
  eyebrow: "O problema", // [NOVO]
  title: "Quando a operação cresce, planilha, papel e WhatsApp deixam de dar conta.", // [NOVO]
  pains: [
    {
      title: "Informação espalhada",
      text: "Dados em planilhas, conversas e cadernos diferentes, e ninguém com a visão completa.",
      link: {
        label: "Veja como centralizamos no G Training",
        href: anchor(sectionIds.caseGTraining),
      },
    },
    {
      title: "Equipe em campo sem sinal",
      text: "Quem trabalha longe do escritório perde tempo para registrar e sincronizar o que fez.",
      link: {
        label: "Veja o CSPR Dashboard funcionando offline",
        href: anchor(sectionIds.caseCspr),
      },
    },
    {
      title: "Processos manuais caros",
      text: "Retrabalho e tarefas repetitivas consomem horas e dinheiro todo mês.",
      link: { label: "Veja o resultado na Florestcon", href: anchor(sectionIds.caseCspr) },
    },
  ], // [NOVO]
} as const;

/* ------------------------------------------------------------------ */
/* 3.5 Solução, benefícios e serviços                                  */
/* ------------------------------------------------------------------ */

export const solution = {
  badge: "Nossa Missão", // [MANTIDO]
  title: "Queremos equipar seu negócio com design inteligente e tecnologia de ponta", // [MANTIDO]
  lead: "Excelência em performance digital: elevamos sua marca para o próximo nível no mundo digital.", // [MOVIDO] era o sub do hero, caixa normal
  text: "Você é quem está no comando do seu negócio. Garantimos eficiência, qualidade, segurança e todo o suporte necessário para você voar cada vez mais alto.", // [MANTIDO]
  benefits: [
    {
      title: "Eficiência",
      text: "Automatize o que hoje é manual e ganhe tempo para o que importa.",
    },
    { title: "Qualidade", text: "Interfaces pensadas para quem usa o sistema todos os dias." },
    { title: "Segurança", text: "Dados protegidos e sincronizados na nuvem." },
    { title: "Suporte", text: "Acompanhamos o seu projeto depois da entrega." },
  ], // [NOVO][VALIDAR] as quatro palavras da missão original
  servicesTitle: "O que fazemos", // [NOVO] título acessível da lista de serviços
  services: [
    { title: "Sites", text: "Sites corporativos e institucionais" }, // [MANTIDO]
    { title: "SaaS", text: "Software como serviço" }, // [CORRIGIDO] era "Software as a service"
    { title: "Landing Pages", text: "Páginas de conversão, páginas únicas" }, // [MANTIDO]
    { title: "Dashboards", text: "Plataformas e sistemas internos" }, // [CORRIGIDO] era "sistemas de internos"
    { title: "Aplicativos", text: "Aplicativos para Android e iOS" }, // [MANTIDO]
    { title: "E-commerce", text: "Lojas virtuais" }, // [CORRIGIDO] caixa
  ],
} as const;

/* ------------------------------------------------------------------ */
/* 3.6 Como funciona — sincronizado com a cena 3D (Fases 3b/3c)        */
/* ------------------------------------------------------------------ */

/** Etapas do lema. `range` é o trecho do progresso de scroll da cena (decisions §2.1). */
export const howItWorks = {
  title: "Como trabalhamos", // [NOVO]
  steps: [
    {
      key: "think",
      motto: "Think",
      label: "Pensar",
      text: "Entendemos sua operação e definimos o que o software precisa resolver.",
      range: [0.6, 0.7],
    },
    {
      key: "develop",
      motto: "Develop",
      label: "Desenvolver",
      text: "Design e desenvolvimento com entregas que você acompanha.",
      range: [0.7, 0.8],
    },
    {
      key: "deliver",
      motto: "Deliver",
      label: "Entregar",
      text: "Colocamos o sistema no ar e acompanhamos o uso real.",
      range: [0.8, 0.9],
    },
    {
      key: "repeat",
      motto: "Repeat",
      label: "Evoluir",
      text: "Medimos, ajustamos e evoluímos o produto com você.",
      range: [0.9, 1],
    },
  ], // [NOVO][VALIDAR] baseado no lema original
  stepDuration: placeholder("Prazo típico de cada etapa, se a Saurs quiser divulgar") as Maybe<
    string[]
  >,
} as const satisfies {
  title: string;
  steps: readonly {
    key: string;
    motto: string;
    label: string;
    text: string;
    range: readonly [number, number];
  }[];
  stepDuration: Maybe<string[]>;
};

export type StepKey = (typeof howItWorks.steps)[number]["key"];

/* ------------------------------------------------------------------ */
/* 3.7 Cases + depoimentos                                             */
/* ------------------------------------------------------------------ */

export interface Testimonial {
  quote: string;
  author: string;
  company?: string;
  role: Maybe<string>;
  photo: Maybe<ImageAsset>;
}

export interface CaseStudy {
  id: SectionId;
  name: string;
  segment: string;
  description: string;
  results: string[];
  testimonial: Testimonial;
  website: Link;
  image: Maybe<ImageAsset>;
}

export const cases = {
  badge: "Cases de sucesso", // [CORRIGIDO] era "Cases de sucesso com"
  title: "Nossos clientes", // [MANTIDO]
  items: [
    {
      id: sectionIds.caseCspr,
      name: "CSPR Dashboard", // [MANTIDO]
      segment: "Engenharia elétrica", // [NOVO] derivado da descrição
      description:
        "Sistema de gerenciamento de obras de engenharia elétrica com sincronização em tempo real por aplicativo com funcionamento offline em locais remotos, integrado com a nuvem.", // [CORRIGIDO] "sincroização"
      results: [
        "Até R$ 80 mil por ano em custos",
        "Obras finalizadas em menos tempo",
        "Mais qualidade nos serviços",
      ], // [NOVO formato] tirados do depoimento
      testimonial: {
        quote:
          "A automatização do serviço com o aplicativo e a plataforma revolucionou nossos processos internos, cortando até 80 mil reais anuais de custos, reduzindo o tempo de finalização de obras e aumentando a qualidade dos serviços.", // [MANTIDO]
        author: "Paulo Otávio",
        company: "Florestcon",
        role: placeholder("Cargo do Paulo Otávio, se autorizado"),
        photo: placeholder("Foto do Paulo Otávio, se autorizada"),
      },
      website: { label: "Visitar website", href: "https://florestcon.com", external: true }, // [MANTIDO]
      // Original: https://saurs.dev/images/cspr.png (1867×922). Baixar e converter
      // para AVIF/WebP em /public/images/cases/ (rede do ambiente bloqueou o download).
      image: placeholder("Print do CSPR Dashboard (baixar do site atual e converter)"),
    },
    {
      id: sectionIds.caseGTraining,
      name: "G Training", // [MANTIDO]
      segment: "Nutrição e treinamento", // [NOVO] derivado da descrição
      description:
        "Plataforma de gestão centralizada + app de planejamentos dietéticos e treinamentos personalizados para nutricionistas e personal trainers da escolha do paciente.", // [MANTIDO]
      results: ["Acompanhamento dos clientes no mesmo dia"], // [NOVO formato] tirado do depoimento
      testimonial: {
        quote:
          "A centralização dos serviços em uma plataforma só e a facilidade do uso da plataforma me permitiu, por exemplo, fazer os acompanhamentos dos meus clientes no mesmo dia.", // [MANTIDO]
        author: "Geovanni Sampaio",
        role: placeholder("Cargo/descrição do Geovanni Sampaio, se autorizado"),
        photo: placeholder("Foto do Geovanni Sampaio, se autorizada"),
      },
      website: { label: "Visitar website", href: "https://geovanni-sampaio.com", external: true }, // [MANTIDO]
      // O print atual expõe nome completo e medidas corporais de uma pessoa real.
      image: placeholder("Novo print do G Training com dados fictícios (BLOQUEANTE)"),
    },
  ] satisfies CaseStudy[],
} as const;

/* ------------------------------------------------------------------ */
/* 3.8 Manifesto                                                       */
/* ------------------------------------------------------------------ */

export const manifesto = {
  before: "Pensamos no", // [MANTIDO]
  word: "FUTURO", // [MANTIDO]
  after: "Para você focar no presente", // [MANTIDO]
} as const;

/* ------------------------------------------------------------------ */
/* 3.9 FAQ — o schema FAQPage só é publicado com respostas reais       */
/* ------------------------------------------------------------------ */

export interface FaqItem {
  question: string;
  answer: Maybe<string>;
}

export const faq = {
  title: "Dúvidas frequentes", // [NOVO]
  items: [
    {
      question: "Que tipo de projeto vocês fazem?",
      answer:
        "Sites, landing pages, SaaS, dashboards e sistemas internos, aplicativos para Android e iOS, e e-commerce.", // fato do site
    },
    {
      question: "Já tenho um sistema. Vocês conseguem melhorar?",
      answer: placeholder("Resposta: melhoria de sistemas existentes"),
    },
    {
      question: "Quanto custa um projeto?",
      answer: placeholder(
        'Faixa de investimento, ou "depende do escopo; o orçamento é sem compromisso"',
      ),
    },
    { question: "Quanto tempo leva?", answer: placeholder("Prazo típico") },
    {
      question: "Vocês dão suporte depois da entrega?",
      answer: "Sim.", // [VALIDAR] canal, prazo de resposta, se tem custo
    },
    {
      question: "O código e os dados ficam com a minha empresa?",
      answer: placeholder("Propriedade do código e dos dados"),
    },
    {
      question: "Atendem empresas de qualquer cidade?",
      answer: placeholder("Área de atendimento"),
    },
  ] satisfies FaqItem[],
} as const;

/* ------------------------------------------------------------------ */
/* 3.10 CTA final + mini-formulário que abre o WhatsApp                */
/* ------------------------------------------------------------------ */

export const contact = {
  badge: "Disponível para novos projetos", // [CORRIGIDO] era "nosos"; confirmar "novos" × "nossos"
  title: "Vamos construir o futuro juntos", // [MANTIDO]
  text: "Estamos prontos para transformar sua visão em realidade. Entre em contato e descubra como podemos impulsionar seu negócio com tecnologia de ponta.", // [MANTIDO]
  form: {
    name: {
      label: "Nome",
      required: true,
      errorEmpty: "Conte para a gente como podemos te chamar.",
    },
    projectType: { label: "Tipo de projeto", placeholder: "Selecione" },
    message: {
      label: "Conte um pouco sobre o projeto",
      hint: "Opcional, até 500 caracteres.",
    },
    submit: "Continuar no WhatsApp",
    submitting: "Abrindo o WhatsApp…",
    popupBlocked: "O navegador bloqueou a nova aba. Toque no link abaixo para abrir o WhatsApp.",
    popupBlockedLink: "Abrir o WhatsApp",
    privacyNote: "Nada é salvo aqui: a mensagem só é montada e aberta no seu WhatsApp.",
  }, // [NOVO]
  directLink: {
    prefix: "Prefere ir direto?",
    label: "Entre em contato", // [MANTIDO] texto do CTA original
    href: whatsappUrl(),
    external: true,
  },
  email: site.email,
} as const;

/* ------------------------------------------------------------------ */
/* 3.11 Rodapé                                                         */
/* ------------------------------------------------------------------ */

export const footer = {
  copyright: (year: number) => `© ${year} Saurs Developers`, // [NOVO]
  whatsappLabel: "WhatsApp",
} as const;

/* ------------------------------------------------------------------ */
/* Fila de revisão com a Saurs (decisions §8)                          */
/* ------------------------------------------------------------------ */

export const review: ReviewItem[] = [
  {
    path: "cases.items.1.image",
    status: "placeholder",
    note: "Novo print do G Training com dados fictícios.",
    blocking: true,
  },
  { path: "contact.badge", status: "corrigido", note: 'Confirmar "novos" × "nossos".' },
  { path: "proof.line", status: "validar", note: "Linha de prova social." },
  { path: "solution.benefits", status: "validar", note: "Quatro benefícios." },
  { path: "howItWorks.steps", status: "validar", note: "Texto das quatro etapas." },
  {
    path: "faq.items.4.answer",
    status: "validar",
    note: "Suporte: canal, prazo de resposta, se tem custo.",
  },
  { path: "faq.items", status: "placeholder", note: "Respostas do FAQ." },
  {
    path: "site",
    status: "placeholder",
    note: "E-mail, CNPJ, cidade, redes sociais, política de privacidade.",
  },
  {
    path: "cases.items.0.testimonial",
    status: "placeholder",
    note: "Cargo e foto dos autores dos depoimentos, se autorizados.",
  },
  { path: "proof.clientLogos", status: "placeholder", note: "Logos dos clientes, se autorizados." },
  {
    path: "cases.items.0.image",
    status: "placeholder",
    note: "Baixar o print do CSPR do site atual e converter para AVIF/WebP.",
  },
];

/** Objeto raiz, útil para o teste de caminhos da fila de revisão. */
export const content = {
  site,
  meta,
  header,
  hero,
  proof,
  problem,
  solution,
  howItWorks,
  cases,
  manifesto,
  faq,
  contact,
  footer,
} as const;
