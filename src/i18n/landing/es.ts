import type { LandingTranslations } from "./types";

export const es: LandingTranslations = {
  heroEyebrow: "La confianza de viajeros en todo el mundo",
  heroTitle: "Una búsqueda. Todos los hoteles. Tu estancia perfecta.",
  heroSubtitle:
    "Explora hoteles, apartamentos y alquileres por estrellas, valoraciones y tipo — y reserva con socios de confianza.",
  heroImageAlt:
    "Resort en acantilado con piscina infinita frente al océano al atardecer",
  featuresTitle: (siteName) => `Por qué los viajeros eligen ${siteName}`,
  featuresSubtitle:
    "Una búsqueda conecta con opciones de socios de confianza, organizadas por estrellas, valoraciones y fechas.",
  features: [
    {
      title: "Explora antes de reservar",
      desc: "Filtra por categoría, tipo de alojamiento y puntuación de huéspedes para encontrar el hotel que realmente se adapta a tu viaje.",
    },
    {
      title: "Hoteles en todo el mundo",
      desc: "Escapadas urbanas, retiros costeros o estancias largas — mostramos opciones en miles de destinos.",
    },
    {
      title: "Reserva con socios de confianza",
      desc: "Continúa en sitios de reserva consolidados cuando estés listo — sin registro obligatorio ni recargo en las tarifas.",
    },
  ],
  destinationsTitle: "Destinos populares",
  destinationsSubtitle: "Explora hoteles en las ciudades más visitadas del mundo.",
  compareRates: "Comparar tarifas",
  checkingRates: "Consultando tarifas…",
  ctaTitle: "¿Listo para encontrar tu alojamiento?",
  ctaSubtitle:
    "Usa la búsqueda de arriba para explorar hoteles y continuar con tu socio de reserva preferido.",
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
