// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// stickers.js - Catalogo INDEPENDIENTE de stickers
// No depende ni modifica ningun otro archivo. Si falla, la app sigue.
// emojiStickerPanel.js verifica window.STICKER_LIST antes de usar.
// Los stickers son emojis grandes con efecto de sticker (borde blanco)
// Formato: {e: emoji, n: nombre, c: categoria}
// ============================================================================
if (!window.STICKER_LIST) window.STICKER_LIST = [];

// STICKERS DE EMOCIONES (Facebook/WhatsApp style)
window.STICKER_LIST.push(
 {e:"😀",n:"Feliz",c:"emociones"},{e:"😂",n:"Risa",c:"emociones"},
 {e:"🤣",n:"Muerto de risa",c:"emociones"},{e:"😍",n:"Enamorado",c:"emociones"},
 {e:"🥰",n:"Amor",c:"emociones"},{e:"😘",n:"Beso",c:"emociones"},
 {e:"😭",n:"Llorando",c:"emociones"},{e:"😱",n:"Susto",c:"emociones"},
 {e:"😡",n:"Enojo",c:"emociones"},{e:"🤔",n:"Pensando",c:"emociones"},
 {e:"🤯",n:"Mente explotada",c:"emociones"},{e:"🥳",n:"Fiesta",c:"emociones"},
 {e:"😴",n:"Durmiendo",c:"emociones"},{e:"🤤",n:"Babeando",c:"emociones"},
 {e:"🤩",n:"Emocionado",c:"emociones"},{e:"😎",n:"Genial",c:"emociones"},
 {e:"🤗",n:"Abrazo",c:"emociones"},{e:"🤫",n:"Shh",c:"emociones"},
 {e:"🥺",n:"Suplicando",c:"emociones"},{e:"😏",n:"Sonrisa picara",c:"emociones"},
 {e:"🙄",n:"Aburrido",c:"emociones"},{e:"😬",n:"Nervioso",c:"emociones"},
 {e:"🥴",n:"Mareado",c:"emociones"},{e:"🤠",n:"Vaquero",c:"emociones"},
 {e:"🤡",n:"Payaso",c:"emociones"},{e:"👻",n:"Fantasma",c:"emociones"},
 {e:"💀",n:"Calavera",c:"emociones"},{e:"🤖",n:"Robot",c:"emociones"},
 {e:"👽",n:"Alien",c:"emociones"},{e:"🥱",n:"Bostezo",c:"emociones"}
);
// STICKERS DE CORAZONES Y AMOR
window.STICKER_LIST.push(
 {e:"❤️",n:"Corazon rojo",c:"amor"},{e:"🧡",n:"Corazon naranja",c:"amor"},
 {e:"💛",n:"Corazon amarillo",c:"amor"},{e:"💚",n:"Corazon verde",c:"amor"},
 {e:"💙",n:"Corazon azul",c:"amor"},{e:"💜",n:"Corazon morado",c:"amor"},
 {e:"🖤",n:"Corazon negro",c:"amor"},{e:"🤍",n:"Corazon blanco",c:"amor"},
 {e:"🤎",n:"Corazon marron",c:"amor"},{e:"💔",n:"Corazon roto",c:"amor"},
 {e:"❤️‍🔥",n:"Corazon fuego",c:"amor"},{e:"❤️‍🩹",n:"Corazon curado",c:"amor"},
 {e:"💖",n:"Brillante",c:"amor"},{e:"💗",n:"Creciente",c:"amor"},
 {e:"💓",n:"Latido",c:"amor"},{e:"💞",n:"Girando",c:"amor"},
 {e:"💕",n:"Dos corazones",c:"amor"},{e:"💘",n:"Flecha",c:"amor"},
 {e:"💝",n:"Regalo",c:"amor"},{e:"💟",n:"Decoracion",c:"amor"},
 {e:"🫶",n:"Manos corazon",c:"amor"},{e:"😘",n:"Beso2",c:"amor"},
 {e:"💑",n:"Pareja",c:"amor"},{e:"💏",n:"Beso pareja",c:"amor"},
 {e:"💌",n:"Carta amor",c:"amor"},{e:"💍",n:"Anillo",c:"amor"},
 {e:"💐",n:"Ramo",c:"amor"},{e:"🌹",n:"Rosa",c:"amor"},
 {e:"🥀",n:"Flor marchita",c:"amor"},{e:"🍒",n:"Cerezas",c:"amor"}
);
// STICKERS DE MANOS (TikTok style)
window.STICKER_LIST.push(
 {e:"👍",n:"Like",c:"manos"},{e:"👎",n:"Dislike",c:"manos"},
 {e:"👏",n:"Aplauso",c:"manos"},{e:"🙌",n:"Celebra",c:"manos"},
 {e:"🤝",n:"Apreton",c:"manos"},{e:"🙏",n:"Gracias",c:"manos"},
 {e:"👋",n:"Hola",c:"manos"},{e:"🤙",n:"Llamame",c:"manos"},
 {e:"✌️",n:"Paz",c:"manos"},{e:"🤞",n:"Suerte",c:"manos"},
 {e:"🤟",n:"Te amo",c:"manos"},{e:"🤘",n:"Rock",c:"manos"},
 {e:"👌",n:"Perfecto",c:"manos"},{e:"🤌",n:"Italiano",c:"manos"},
 {e:"🤏",n:"Un poco",c:"manos"},{e:"✋",n:"Alto",c:"manos"},
 {e:"👋",n:"Adios",c:"manos"},{e:"🫶",n:"Corazon manos",c:"manos"},
 {e:"💪",n:"Fuerza",c:"manos"},{e:"👊",n:"Puno",c:"manos"},
 {e:"🤛",n:"Izquierdo",c:"manos"},{e:"🤜",n:"Derecho",c:"manos"},
 {e:"✊",n:"Resistencia",c:"manos"},{e:"🫰",n:"Corazon dedo",c:"manos"}
);
// STICKERS DE FIESTAS (Instagram style)
window.STICKER_LIST.push(
 {e:"🎉",n:"Fiesta",c:"fiestas"},{e:"🎊",n:"Confeti",c:"fiestas"},
 {e:"🎈",n:"Globo",c:"fiestas"},{e:"🎂",n:"Tarta",c:"fiestas"},
 {e:"🎁",n:"Regalo",c:"fiestas"},{e:"🎀",n:"Lazo",c:"fiestas"},
 {e:"🎄",n:"Navidad",c:"fiestas"},{e:"🎅",n:"Santa",c:"fiestas"},
 {e:"🤶",n:"Sra Claus",c:"fiestas"},{e:"🎃",n:"Halloween",c:"fiestas"},
 {e:"🦃",n:"Accion de gracias",c:"fiestas"},{e:"🐰",n:"Conejo pascua",c:"fiestas"},
 {e:"🥂",n:"Brindis",c:"fiestas"},{e:"🍾",n:"Champán",c:"fiestas"},
 {e:"🍻",n:"Cervezas",c:"fiestas"},{e:"🍸",n:"Coctel",c:"fiestas"},
 {e:"🎵",n:"Musica",c:"fiestas"},{e:"🎶",n:"Notas",c:"fiestas"},
 {e:"🎤",n:"Karaoke",c:"fiestas"},{e:"🎧",n:"DJ",c:"fiestas"},
 {e:"🪩",n:"Bola discoteca",c:"fiestas"},{e:"🥳",n:"Party face",c:"fiestas"},
 {e:"🎆",n:"Fuegos artificiales",c:"fiestas"},{e:"🎇",n:"Chispas",c:"fiestas"},
 {e:"✨",n:"Destellos",c:"fiestas"},{e:"🌟",n:"Estrella",c:"fiestas"},
 {e:"⭐",n:"Estrella2",c:"fiestas"},{e:"💫",n:"Estrella fugaz",c:"fiestas"}
);
// STICKERS DE ANIMALES GRANDES
window.STICKER_LIST.push(
 {e:"🐶",n:"Cachorro",c:"animales"},{e:"🐱",n:"Gatito",c:"animales"},
 {e:"🐰",n:"Conejito",c:"animales"},{e:"🐻",n:"Osito",c:"animales"},
 {e:"🐼",n:"Panda",c:"animales"},{e:"🐨",n:"Koala",c:"animales"},
 {e:"🦁",n:"Leon",c:"animales"},{e:"🐯",n:"Tigre",c:"animales"},
 {e:"🐸",n:"Rana",c:"animales"},{e:"🐵",n:"Mono",c:"animales"},
 {e:"🦄",n:"Unicornio",c:"animales"},{e:"🦋",n:"Mariposa",c:"animales"},
 {e:"🐝",n:"Abeja",c:"animales"},{e:"🦉",n:"Buho",c:"animales"},
 {e:"🦊",n:"Zorro",c:"animales"},{e:"🐺",n:"Lobo",c:"animales"},
 {e:"🦒",n:"Jirafa",c:"animales"},{e:"🐘",n:"Elefante",c:"animales"},
 {e:"🐬",n:"Delfin",c:"animales"},{e:"🐳",n:"Ballena",c:"animales"},
 {e:"🦈",n:"Tiburon",c:"animales"},{e:"🐙",n:"Pulpo",c:"animales"},
 {e:"🦥",n:"Perezoso",c:"animales"},{e:"🦦",n:"Nutria",c:"animales"},
 {e:"🦔",n:"Erizo",c:"animales"},{e:"🐢",n:"Tortuga",c:"animales"}
);
// STICKERS DE COMIDA (Instagram/TikTok style)
window.STICKER_LIST.push(
 {e:"🍕",n:"Pizza",c:"comida"},{e:"🍔",n:"Burger",c:"comida"},
 {e:"🍟",n:"Patatas",c:"comida"},{e:"🌮",n:"Taco",c:"comida"},
 {e:"🍣",n:"Sushi",c:"comida"},{e:"🍩",n:"Dona",c:"comida"},
 {e:"🍦",n:"Helado",c:"comida"},{e:"🍰",n:"Pastel",c:"comida"},
 {e:"☕",n:"Cafe",c:"comida"},{e:"🍺",n:"Cerveza",c:"comida"},
 {e:"🍷",n:"Vino",c:"comida"},{e:"🥑",n:"Aguacate",c:"comida"},
 {e:"🍓",n:"Fresa",c:"comida"},{e:"🍉",n:"Sandia",c:"comida"},
 {e:"🍌",n:"Platano",c:"comida"},{e:"🍎",n:"Manzana",c:"comida"},
 {e:"🧁",n:"Cupcake",c:"comida"},{e:"🍫",n:"Chocolate",c:"comida"},
 {e:"🍿",n:"Palomitas",c:"comida"},{e:"🍪",n:"Galleta",c:"comida"},
 {e:"🥤",n:"Bebida",c:"comida"},{e:"🧋",n:"Bubble tea",c:"comida"},
 {e:"🌶️",n:"Picante",c:"comida"},{e:"🧄",n:"Ajo",c:"comida"},
 {e:"🥐",n:"Croissant",c:"comida"},{e:"🧇",n:"Gofre",c:"comida"}
);
// STICKERS DE SIMBOLOS Y DECORACION
window.STICKER_LIST.push(
 {e:"💯",n:"100",c:"simbolos"},{e:"🔥",n:"Fuego",c:"simbolos"},
 {e:"✨",n:"Destellos",c:"simbolos"},{e:"⭐",n:"Estrella",c:"simbolos"},
 {e:"🌈",n:"Arcoiris",c:"simbolos"},{e:"⚡",n:"Rayo",c:"simbolos"},
 {e:"💧",n:"Gota",c:"simbolos"},{e:"🌊",n:"Ola",c:"simbolos"},
 {e:"🌸",n:"Flor",c:"simbolos"},{e:"🌺",n:"Hibisco",c:"simbolos"},
 {e:"🌻",n:"Girasol",c:"simbolos"},{e:"🌷",n:"Tulipan",c:"simbolos"},
 {e:"🌹",n:"Rosa2",c:"simbolos"},{e:"🌼",n:"Margarita",c:"simbolos"},
 {e:"🍀",n:"Trebol",c:"simbolos"},{e:"🌿",n:"Hierba",c:"simbolos"},
 {e:"🍁",n:"Hoja otono",c:"simbolos"},{e:"🍂",n:"Hojas",c:"simbolos"},
 {e:"🌱",n:"Brote",c:"simbolos"},{e:"🌴",n:"Palmera",c:"simbolos"},
 {e:"🌵",n:"Cactus",c:"simbolos"},{e:"🌞",n:"Sol",c:"simbolos"},
 {e:"🌙",n:"Luna",c:"simbolos"},{e:"☁️",n:"Nube",c:"simbolos"},
 {e:"❄️",n:"Nieve",c:"simbolos"},{e:"☀️",n:"Sol2",c:"simbolos"},
 {e:"🎯",n:"Diana",c:"simbolos"},{e:"💎",n:"Diamante",c:"simbolos"},
 {e:"👑",n:"Corona",c:"simbolos"},{e:"🔔",n:"Campana",c:"simbolos"}
);
console.log('stickers.js cargado:', window.STICKER_LIST.length, 'stickers');
