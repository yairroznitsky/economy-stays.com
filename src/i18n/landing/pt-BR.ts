import type { LandingTranslations } from "./types";

export const ptBR: LandingTranslations = {
  heroEyebrow: "A confiança de viajantes em todo o mundo",
  heroTitle: "Uma busca. Todos os hotéis. Sua estadia perfeita.",
  heroSubtitle:
    "Explore hotéis, apartamentos e aluguéis por estrelas, avaliações e tipo — e reserve com parceiros de confiança.",
  heroImageAlt:
    "Resort no penhasco com piscina infinita com vista para o oceano ao pôr do sol",
  featuresTitle: (siteName) => `Por que viajantes escolhem ${siteName}`,
  featuresSubtitle:
    "Uma busca conecta você a opções de parceiros confiáveis, organizadas por estrelas, avaliações e suas datas.",
  features: [
    {
      title: "Explore antes de reservar",
      desc: "Filtre por categoria, tipo de acomodação e pontuação de hóspedes para encontrar o hotel que realmente combina com sua viagem.",
    },
    {
      title: "Hotéis em todo o mundo",
      desc: "Fins de semana, praias ou estadias longas — mostramos opções em milhares de destinos.",
    },
    {
      title: "Reserve com parceiros de confiança",
      desc: "Continue em sites de reserva consolidados quando estiver pronto — sem cadastro obrigatório nem acréscimo nas tarifas.",
    },
  ],
  destinationsTitle: "Destinos populares",
  destinationsSubtitle: "Explore hotéis nas cidades mais visitadas do mundo.",
  compareRates: "Comparar tarifas",
  checkingRates: "Consultando tarifas…",
  ctaTitle: "Pronto para encontrar sua estadia?",
  ctaSubtitle:
    "Use a busca acima para explorar hotéis e continuar com seu parceiro de reserva preferido.",
  destinationNotFound: (city) =>
    `Não encontramos ${city}. Tente buscar manualmente acima.`,
  reviewSearch: "Revise sua busca",
  ratesUnavailable: "Tarifas indisponíveis no momento",
  ratesUnavailableDesc: "Tente novamente usando a barra de busca acima.",
  destinationPickTitle: "Selecione das sugestões",
  destinationPickDesc:
    "Digite um destino e escolha uma correspondência no menu suspenso.",
  footer: {
    about: "Sobre",
    contact: "Contato",
    privacy: "Privacidade",
    rightsReserved: "Todos os direitos reservados.",
    operatedBy: (siteName, operator) =>
      `${siteName} é operado por ${operator}.`,
    commission: (siteName) =>
      `${siteName} pode receber uma comissão quando você reserva por links de parceiros.`,
  },
  search: {
    where: "Onde",
    wherePlaceholder: "Para onde você vai?",
    whereError: "Escolha onde você vai se hospedar",
    loadingSuggestions: "Carregando sugestões...",
    when: "Quando",
    pickDates: "Escolher datas",
    checkIn: "Check-in",
    checkOut: "Check-out",
    selectCheckIn: "Selecionar check-in",
    selectCheckOut: "Selecionar check-out",
    selectDate: "Selecionar data",
    pickYourDates: "Escolha suas datas",
    chooseArrival: "Escolha sua data de chegada",
    chooseDeparture: "Agora escolha sua data de partida",
    pickCheckInFirst: "Escolha o check-in primeiro, depois o check-out",
    nowChooseCheckOut: "Agora escolha seu check-out",
    who: "Quem",
    guestSummary: (guests, rooms) =>
      `${guests} hóspede${guests !== 1 ? "s" : ""} · ${rooms} quarto${rooms !== 1 ? "s" : ""}`,
    adults: "Adultos",
    adultsSub: "13 anos ou mais",
    children: "Crianças",
    childrenSub: "0–12 anos",
    rooms: "Quartos",
    comparePrices: "Comparar preços",
    comparingRates: "Comparando tarifas...",
    datesRequired: "Datas obrigatórias",
    datesRequiredDesc:
      "Selecione check-in e check-out para comparar hospedagens disponíveis.",
    destinationTooShort: "Destino muito curto",
    destinationTooShortDesc:
      "Digite pelo menos 3 letras — cidade, hotel ou código de aeroporto (ex.: GRU).",
    airportNotFound: "Aeroporto não encontrado",
    airportNotFoundDesc: (code) =>
      `Nenhum aeroporto corresponde a "${code}". Verifique o código e tente novamente.`,
    couldNotCompare: "Não foi possível comparar tarifas",
    couldNotCompareDesc:
      "Tente novamente ou selecione um destino das sugestões.",
    suggestionType: {
      state: "Estado",
      airport: "Aeroporto",
      landmark: "Ponto turístico",
      city: "Cidade",
    },
    validation: {
      checkoutAfterCheckin: "O check-out deve ser após o check-in",
      adultsGteRooms:
        "O número de adultos deve ser maior ou igual ao de quartos",
      adultsRoomsMin: "Adultos e quartos devem ser pelo menos 1",
    },
  },
  countries: {
    France: "França",
    "United Kingdom": "Reino Unido",
    Japan: "Japão",
    Italy: "Itália",
    Spain: "Espanha",
    "United Arab Emirates": "Emirados Árabes Unidos",
    Australia: "Austrália",
    Thailand: "Tailândia",
  },
};
