import type { LandingTranslations } from "./types";

export const es: LandingTranslations = {
  heroEyebrow: "Búsqueda independiente de alojamiento",
  heroTitle: "Una forma más tranquila de comparar estancias",
  heroSubtitle:
    "Busca hoteles, apartamentos y alquileres en un solo lugar — y reserva con socios de confianza.",
  heroImageAlt:
    "Resort en acantilado con piscina infinita frente al océano al atardecer",
  featuresTitle: (siteName) => `Por qué los viajeros usan ${siteName}`,
  featuresSubtitle:
    "Una sola búsqueda muestra tarifas de socios de confianza para que elijas con seguridad.",
  features: [
    {
      title: "Comparación clara de precios",
      desc: "Consulta hoteles, apartamentos y alquileres en paralelo y elige la mejor opción para tus fechas.",
    },
    {
      title: "Cobertura mundial",
      desc: "Escapadas de fin de semana, playa o estancias largas — opciones en ciudades y costas de todo el mundo.",
    },
    {
      title: "Socios consolidados",
      desc: "Políticas flexibles en muchos anuncios, respaldados por socios de viaje que ya conoces.",
    },
  ],
  destinationsTitle: "Destinos populares",
  destinationsSubtitle: "Explora ciudades que los viajeros buscan esta semana.",
  compareRates: "Comparar tarifas",
  checkingRates: "Consultando tarifas…",
  ctaTitle: "¿Listo para planear tu viaje?",
  ctaSubtitle:
    "Usa la búsqueda de arriba para comparar estancias y continuar con tu socio de reserva preferido.",
  destinationNotFound: (city) =>
    `No encontramos ${city}. Prueba buscando manualmente arriba.`,
  reviewSearch: "Revisa tu búsqueda",
  ratesUnavailable: "Tarifas no disponibles ahora",
  ratesUnavailableDesc: "Inténtalo de nuevo usando la barra de búsqueda de arriba.",
  destinationPickTitle: "Selecciona de las sugerencias",
  destinationPickDesc:
    "Escribe un destino y elige una coincidencia del menú desplegable.",
  footer: {
    about: "Acerca de",
    contact: "Contacto",
    privacy: "Privacidad",
    rightsReserved: "Todos los derechos reservados.",
    operatedBy: (siteName, operator) =>
      `${siteName} es operado por ${operator}.`,
    commission: (siteName) =>
      `${siteName} puede recibir una comisión cuando reservas a través de enlaces de socios.`,
  },
  search: {
    where: "Dónde",
    wherePlaceholder: "¿A dónde vas?",
    whereError: "Elige dónde te alojarás",
    loadingSuggestions: "Cargando sugerencias...",
    when: "Cuándo",
    pickDates: "Elegir fechas",
    checkIn: "Entrada",
    checkOut: "Salida",
    selectCheckIn: "Seleccionar entrada",
    selectCheckOut: "Seleccionar salida",
    selectDate: "Seleccionar fecha",
    pickYourDates: "Elige tus fechas",
    chooseArrival: "Elige tu fecha de llegada",
    chooseDeparture: "Ahora elige tu fecha de salida",
    pickCheckInFirst: "Elige la entrada primero, luego la salida",
    nowChooseCheckOut: "Ahora elige tu salida",
    who: "Quién",
    guestSummary: (guests, rooms) =>
      `${guests} huésped${guests !== 1 ? "es" : ""} · ${rooms} habitación${rooms !== 1 ? "es" : ""}`,
    adults: "Adultos",
    adultsSub: "13 años o más",
    children: "Niños",
    childrenSub: "0–12 años",
    rooms: "Habitaciones",
    comparePrices: "Comparar precios",
    comparingRates: "Comparando tarifas...",
    datesRequired: "Fechas obligatorias",
    datesRequiredDesc:
      "Selecciona entrada y salida para comparar alojamientos disponibles.",
    destinationTooShort: "Destino demasiado corto",
    destinationTooShortDesc:
      "Escribe al menos 3 letras — ciudad, hotel o código de aeropuerto (p. ej. MAD).",
    airportNotFound: "Aeropuerto no encontrado",
    airportNotFoundDesc: (code) =>
      `Ningún aeropuerto coincide con "${code}". Verifica el código e inténtalo de nuevo.`,
    couldNotCompare: "No se pudieron comparar tarifas",
    couldNotCompareDesc:
      "Inténtalo de nuevo o selecciona un destino de las sugerencias.",
    suggestionType: {
      state: "Estado",
      airport: "Aeropuerto",
      landmark: "Punto de interés",
      city: "Ciudad",
    },
    validation: {
      checkoutAfterCheckin: "La salida debe ser posterior a la entrada",
      adultsGteRooms:
        "El número de adultos debe ser mayor o igual al de habitaciones",
      adultsRoomsMin: "Adultos y habitaciones deben ser al menos 1",
    },
  },
  countries: {
    France: "Francia",
    "United Kingdom": "Reino Unido",
    Japan: "Japón",
    Italy: "Italia",
    Spain: "España",
    "United Arab Emirates": "Emiratos Árabes Unidos",
    Australia: "Australia",
    Thailand: "Tailandia",
  },
};
