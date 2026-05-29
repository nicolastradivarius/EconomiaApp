export const brand = {
  name: 'Wavechat',
  tagline: 'Salas de musica sincronizada con chat en vivo',
  subtitle:
    'Crea salas con roles visibles, musica sincronizada y chat en vivo sin delay. Entra, escucha y conversa como si estuvieran juntos.',
  micro: 'Beta privada - cupos limitados. iOS y Android en camino.',
};

export const navLinks = [
  { label: 'Producto', href: '#producto' },
  { label: 'Salas', href: '#salas' },
  { label: 'Chat', href: '#chat' },
  { label: 'Planes', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const stats = [
  { label: 'En lista de espera', value: '2.8k' },
  { label: 'Salas activas por dia', value: '38' },
  { label: 'Promedio por sesion', value: '42 min' },
  { label: 'Mensajes por sala', value: '120+' },
];

export const features = [
  {
    title: 'Sincronizacion real',
    description: 'Musica alineada para todos, sin desfase ni cortes.',
    icon: 'wave',
  },
  {
    title: 'Chat en vivo',
    description: 'Roles claros, moderacion y reacciones al instante.',
    icon: 'chat',
  },
  {
    title: 'Playlist colaborativa',
    description: 'La sala propone y el host decide el orden.',
    icon: 'playlist',
  },
  {
    title: 'Mini reproductor persistente',
    description: 'Segui explorando sin cortar la sala.',
    icon: 'player',
  },
];

export const howItWorks = [
  {
    step: '01',
    title: 'Entra a una sala',
    description: 'Busca por genero, host o energia del momento.',
  },
  {
    step: '02',
    title: 'Sincroniza la musica',
    description: 'La reproduccion se alinea en segundos, sin delay.',
  },
  {
    step: '03',
    title: 'Habla y descubre',
    description: 'Chatea, reacciona y guarda salas favoritas.',
  },
];

export const rooms = [
  {
    name: 'Chill Vibes',
    host: 'DJ Luna',
    listeners: 24,
    genre: 'Lo-Fi',
    track: 'Snowman - Lofi Girl',
  },
  {
    name: 'Late Night Drive',
    host: 'WaveRider',
    listeners: 18,
    genre: 'Synthwave',
    track: 'Los Angeles - The Midnight',
  },
  {
    name: 'EDM Arena',
    host: 'BassKing',
    listeners: 56,
    genre: 'Electronic',
    track: 'High on Life - Martin Garrix',
  },
];

export const chatMessages = [
  {
    user: 'DJ Luna',
    text: 'Bienvenidos al set. Suban el volumen.',
    time: '10:01',
    role: 'host',
  },
  {
    user: 'Vos',
    text: 'Esta transicion esta perfecta.',
    time: '10:02',
    role: 'self',
  },
  {
    user: 'Nico',
    text: 'El groove esta increible hoy.',
    time: '10:03',
    role: 'guest',
  },
  {
    user: 'DJ Luna',
    text: 'Se viene un cambio de energia.',
    time: '10:04',
    role: 'host',
  },
];

export const testimonials = [
  {
    name: 'Camila R.',
    role: 'Product Designer',
    quote: 'Se siente como estar en la misma sala.',
  },
  {
    name: 'Nico M.',
    role: 'Music Curator',
    quote: 'La energia del chat hace que todo cobre vida.',
  },
  {
    name: 'Vale P.',
    role: 'iOS Dev',
    quote: 'Interfaz limpia, oscura y muy fluida.',
  },
];

export const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    suffix: 'USD/mes',
    description: 'Entrar a salas, chat y discovery.',
    features: [
      'Entrar a salas publicas',
      'Chat en vivo',
      'Discovery y busqueda',
    ],
    cta: 'Empezar gratis',
  },
  {
    name: 'Plus',
    price: '$3-7',
    suffix: 'USD/mes',
    description: 'Para escuchar sin limites y guardar sesiones.',
    features: [
      'Sin ads',
      'Boosts de sala',
      'Guardar salas y recaps',
      'Calidad alta',
    ],
    cta: 'Sumarte a Plus',
  },
  {
    name: 'Creator/Host',
    price: '$9-19',
    suffix: 'USD/mes',
    description: 'Herramientas para hosts con comunidad.',
    features: [
      'Moderacion avanzada',
      'Salas privadas y co-hosts',
      'Cola prioritaria',
      'Analiticas de sala',
    ],
    cta: 'Ser host',
    tag: 'Recomendado',
    featured: true,
  },
  {
    name: 'Teams/Brands',
    price: '$49-199',
    suffix: 'USD/mes',
    description: 'Experiencias de marca con soporte.',
    features: [
      'Salas patrocinadas',
      'Branding y assets',
      'Reportes e insights',
      'Soporte dedicado',
    ],
    cta: 'Hablar con ventas',
  },
];

export const partnerProgram = {
  title: 'Programa partner para hosts',
  description:
    'Si la sala crece, podes entrar al programa partner. Pagamos un pool mensual segun el aporte y metricas de calidad.',
  perks: [
    'Pool mensual + bonos por crecimiento',
    'Soporte prioritario',
    'Acceso anticipado a features',
  ],
  metrics: [
    'Minutos de escucha',
    'Retencion de sala',
    'Nuevos oyentes',
    'Engagement del chat',
    'Frecuencia de hosts',
  ],
};

export const faqs = [
  {
    question: 'Necesito Spotify para usarlo?',
    answer:
      'No necesitas abrir Spotify. La sala reproduce desde el host con fuentes autorizadas.',
  },
  {
    question: 'Puedo silenciar o bloquear usuarios?',
    answer: 'Si, los hosts tienen herramientas basicas de moderacion y reportes.',
  },
  {
    question: 'Cuanta data consume?',
    answer: 'Depende de la fuente y la calidad, pero optimizamos para sesiones largas.',
  },
  {
    question: 'Las salas pueden ser privadas?',
    answer: 'Si, podes crear salas publicas o privadas con invitacion.',
  },
  {
    question: 'Habra version web?',
    answer: 'Si, esta en el roadmap despues de la beta.',
  },
];

export const cta = {
  title: 'Sumate al primer release',
  description: 'Acceso anticipado para quienes se anoten hoy.',
  button: 'Quiero acceso',
};

export const footerLinks = [
  { label: 'Producto', href: '#producto' },
  { label: 'Comunidad', href: '#chat' },
  { label: 'Planes', href: '#pricing' },
  { label: 'Privacidad', href: '#faq' },
  { label: 'Contacto', href: 'mailto:hello@wavechat.app' },
];
