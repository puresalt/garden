const COLOR_WHITE = 'WHITE';
const COLOR_BLACK = 'BLACK';

const PLAYERS = {
  '': {name: 'Unknown', rating: 'N/A'},
  '*GM_CARLSENMAGN': {name: 'GM Carlsen', rating: 2842},
  '*GM_DONCHENKOAL': {name: 'GM Donchenko', rating: 2648},
  '*GM_DUDAJAN-KRZ': {name: 'GM Duda', rating: 2801},
  '*GM_MASTROVASIL': {name: 'GM Mastrovasilis', rating: 2534},
  '*GM_VACHIER-LAG': {name: 'GM Vachier-Lagrave', rating: 2763},
  '*GM_KLEKOWSKIMA': {name: 'GM Klekowski', rating: 2528},
  '*GM_GIRIANISH': {name: 'GM Giri', rating: 2767},
  '*GM_MURZINVOLOD': {name: 'GM Murzin', rating: 2523},
  '*GM_KARJAKINSER': {name: 'GM Karjakin', rating: 2757},
  '*GM_MORONILUCAJ': {name: 'GM Moroni', rating: 2519},
  '*GM_WOJTASZEKRA': {name: 'GM Wojtaszek', rating: 2691},
  '*GM_PETROSYANMA': {name: 'GM Petrosyan', rating: 2605},
  '*GM_SALEMA.R.SA': {name: 'GM Salem A.R.', rating: 2729},
  '*GM_MAGHSOODLOO': {name: 'GM Maghsoodloo', rating: 2701},
  '*GM_MAMEDYAROVS': {name: 'GM Mamedyarov', rating: 2727},
  '*GM_SANALVAHAP': {name: 'GM Sanal', rating: 2509},
  '*GM_ARTEMIEVVLA': {name: 'GM Artemiev', rating: 2714},
  '*GM_LIMADARCY': {name: 'GM Lima', rating: 2505},
  '*GM_SHIROVALEXE': {name: 'GM Shirov', rating: 2659},
  '*GM_GAJEWSKIGRZ': {name: 'GM Gajewski', rating: 2496},
  '*GM_FEDOSEEVVLA': {name: 'GM Fedoseev', rating: 2692},
  '*GM_HARSHABHARA': {name: 'GM Harsha', rating: 2484},
  '*GM_KOROBOVANTO': {name: 'GM Korobov', rating: 2690},
  '*GM_ZILKASTEPAN': {name: 'GM Zilka', rating: 2474},
  '*GM_SARICIVAN': {name: 'GM Saric', rating: 2644},
  '*GM_JANIKIGOR': {name: 'GM Janik', rating: 2462},
  '*GM_JOBAVABAADU': {name: 'GM Jobava', rating: 2582},
  '*GM_FAIZRAKHMAN': {name: 'IM Faizrakhmanov', rating: 2461},
  '*GM_PARAVYANDAV': {name: 'GM Paravyan', rating: 2671},
  '*GM_POSTNYEVGEN': {name: 'GM Postny', rating: 2454},
  '*GM_DEMCHENKOAN': {name: 'GM Demchenko', rating: 2666},
  '*GM_GUMULARZSZY': {name: 'GM Gumularz', rating: 2452},
  '*GM_FIROUZJAALI': {name: 'GM Firouzja', rating: 2770},
  '*GM_HEBERLABART': {name: 'GM Heberla', rating: 2437},
  '*GM_SAHIDISAMIR': {name: 'GM Sahidi', rating: 2436},
  '*GM_ANTIPOVMIKH': {name: 'GM Antipov', rating: 2644},
  '*GM_AZIZHUSAIN': {name: 'GM Aziz', rating: 2430},
  '*GM_ITURRIZAGAB': {name: 'GM Iturrizaga', rating: 2634},
  '*GM_NEVEDNICHYV': {name: 'GM Nevednichy', rating: 2425},
  '*GM_RIAZANTSEVA': {name: 'GM Riazantsev', rating: 2632},
  '*GM_CUENCAJIMEN': {name: 'GM Cuenca', rating: 2421},
  '*GM_PREDKEALEXA': {name: 'GM Predke', rating: 2630},
  '*GM_SARACINDERI': {name: 'IM Saraci', rating: 2414},
  '*GM_ANTONGUIJAR': {name: 'GM Anton', rating: 2658},
  '*GM_PENGLIMIN': {name: 'GM Peng', rating: 2411},
  '*GM_CHEPARINOVI': {name: 'GM Cheparinov', rating: 2659},
  '*GM_BLOHBERGERF': {name: 'IM Blohberger', rating: 2409},
  '*GM_PETROSIANTI': {name: 'GM Petrosian Tigran L.', rating: 2621},
  '*GM_THYBOJESPER': {name: 'GM Thybo', rating: 2401},
  '*GM_HEIMANNANDR': {name: 'GM Heimann', rating: 2616},
  '*GM_BELLAHCENEB': {name: 'GM Bellahcene', rating: 2397},
  '*GM_PONKRATOVPA': {name: 'GM Ponkratov', rating: 2614},
  '*GM_VASTRUKHINO': {name: 'IM Vastrukhin', rating: 2382},
  '*GM_EFIMENKOZAH': {name: 'GM Efimenko', rating: 2609},
  '*GM_VANFOREESTL': {name: 'GM Van', rating: 2543},
  '*GM_ERDOSVIKTOR': {name: 'GM Erdos', rating: 2601},
  '*GM_WIECZOREKOS': {name: 'GM Wieczorek', rating: 2367},
  '*GM_ABDUSATTORO': {name: 'GM Abdusattorov', rating: 2646},
  '*GM_IVICVELIMIR': {name: 'GM Ivic', rating: 2606},
  '*GM_QUPARADZEGI': {name: 'GM Quparadze', rating: 2583},
  '*GM_NASUTAGRZEG': {name: 'GM Nasuta', rating: 2345},
  '*GM_HALKIASSTEL': {name: 'GM Halkias', rating: 2576},
  '*GM_SARGSYANSHA': {name: 'GM Sargsyan', rating: 2344},
  '*GM_TER-SAHAKYA': {name: 'GM Ter-Sahakyan', rating: 2607},
  '*GM_NIEMANNHANS': {name: 'GM Niemann', rating: 2638},
  '*GM_VAKHIDOVJAK': {name: 'GM Vakhidov', rating: 2566},
  '*GM_KUZMICZKRYS': {name: 'GM Kuzmicz', rating: 2314},
  '*GM_VANFOREESTJ': {name: 'GM Van', rating: 2691},
  '*GM_KOSAKOWSKIJ': {name: 'GM Kosakowski', rating: 2304},
  '*GM_SOCKOBARTOS': {name: 'GM Socko', rating: 2562},
  '*GM_KANAREKMARC': {name: 'GM Kanarek', rating: 2296},
  '*GM_THEODOROUNI': {name: 'GM Theodorou', rating: 2559},
  '*GM_LUBCZYNSKIR': {name: 'GM Lubczynski', rating: 2289},
  '*GM_KOZAKADAM': {name: 'GM Kozak', rating: 2552},
  '*GM_PETROVSKYIV': {name: 'GM Petrovskyi', rating: 2282},
  '*GM_PARLIGRASMI': {name: 'GM Parligras', rating: 2550},
  '*GM_SAMUNENKOVI': {name: 'FM Samunenkov', rating: 2259},
  '*GM_PIORUNKACPE': {name: 'GM Piorun', rating: 2547},
  '*GM_TOCZEKGRZEG': {name: 'GM Toczek', rating: 2220},
  '*GM_DEMIDOVMIKH': {name: 'GM Demidov', rating: 2544},
  '*GM_SULEYMANLIA': {name: 'GM Suleymanli', rating: 2541},
  '*GM_BARTELMATEU': {name: 'GM Bartel', rating: 2597},
  '*GM_BABAZADAKHA': {name: 'FM Babazada', rating: 2170},
  '*GM_FRIDMANDANI': {name: 'GM Fridman', rating: 2542},
  '*GM_GUKESHD': {name: 'GM Gukesh', rating: 2640},
  '*GM_TARIARYAN': {name: 'GM Tari', rating: 2646},
  '*GM_ADITYAMITTA': {name: 'GM Aditya', rating: 1488},
  '*GM_GAGUNASHVIL': {name: 'GM Gagunashvili', rating: 2538},
  '*GM_NAKAMURAHIK': {name: 'GM Nakamura', rating: 2836},
  '*GM_GABUZYANHOV': {name: 'GM Gabuzyan', rating: 2535},
  '*GM_NEPOMNIACHT': {name: 'GM Nepomniachtchi', rating: 2798},
  '*GM_DURARBAYLIV': {name: 'GM Durarbayli', rating: 2629},
  '*GM_CARUANAFABI': {name: 'GM Caruana', rating: 2800},
  '*GM_PICHOTALAN': {name: 'GM Pichot', rating: 2628},
  '*GM_GRISCHUKALE': {name: 'GM Grischuk', rating: 2763},
  '*GM_CHRISTIANSE': {name: 'GM Christiansen', rating: 2522},
  '*GM_RAPPORTRICH': {name: 'GM Rapport', rating: 2750},
  '*GM_MICHALIKPET': {name: 'GM Michalik', rating: 2515},
  '*GM_DUBOVDANIIL': {name: 'GM Dubov', rating: 2735},
  '*GM_YUFFADANIIL': {name: 'GM Yuffa', rating: 2514},
  '*GM_ARONIANLEVO': {name: 'GM Aronian', rating: 2728},
  '*GM_CZARNOTAPAW': {name: 'GM Czarnota', rating: 2511},
  '*GM_OPARINGRIGO': {name: 'GM Oparin', rating: 2725},
  '*GM_SHEVCHENKOK': {name: 'GM Shevchenko', rating: 2632},
  '*GM_HARIKRISHNA': {name: 'GM Harikrishna', rating: 2719},
  '*GM_NIHALSARIN': {name: 'GM Nihal', rating: 2652},
  '*GM_SARGISSIANG': {name: 'GM Sargissian', rating: 2664},
  '*GM_NGUYENTHAID': {name: 'GM Nguyen', rating: 2577},
  '*GM_MAMEDOVRAUF': {name: 'GM Mamedov', rating: 2673},
  '*GM_NARAYANAN.S': {name: 'GM Narayanan', rating: 2482},
  '*GM_ONYSHCHUKVO': {name: 'GM Onyshchuk', rating: 2622},
  '*GM_PURANIKABHI': {name: 'GM Puranik', rating: 2472},
  '*GM_SARANAALEXE': {name: 'GM Sarana', rating: 2680},
  '*GM_SYCHEVKLEME': {name: 'GM Sychev', rating: 2461},
  '*GM_SVANERASMUS': {name: 'GM Svane', rating: 2677},
  '*GM_KANTORGERGE': {name: 'GM Kantor', rating: 2454},
  '*GM_MOVSESIANSE': {name: 'GM Movsesian', rating: 2627},
  '*GM_SADHWANIRAU': {name: 'GM Sadhwani', rating: 2609},
  '*GM_SMIRINILIA': {name: 'GM Smirin', rating: 2663},
  '*GM_COSTACHIMIH': {name: 'IM Costachi', rating: 2443},
  '*GM_MATLAKOVMAX': {name: 'GM Matlakov', rating: 2652},
  '*GM_CARLSSONPON': {name: 'GM Carlsson', rating: 2436},
  '*GM_KOVALEVVLAD': {name: 'GM Kovalev', rating: 2634},
  '*GM_KRASENKOWMI': {name: 'GM Krasenkow', rating: 2430},
  '*GM_ALEKSEENKOK': {name: 'GM Alekseenko', rating: 2637},
  '*GM_TANGANDREW': {name: 'GM Tang', rating: 2427},
  '*GM_SJUGIROVSAN': {name: 'GM Sjugirov', rating: 2634},
  '*GM_DZIUBAMARCI': {name: 'GM Dziuba', rating: 2424},
  '*GM_VOLOKITINAN': {name: 'GM Volokitin', rating: 2652},
  '*GM_SADZIKOWSKI': {name: 'GM Sadzikowski', rating: 2414},
  '*GM_VIDITSANTOS': {name: 'GM Vidit', rating: 2629},
  '*GM_ALQUDAIMIBA': {name: 'IM Al Qudaimi', rating: 2412},
  '*GM_HOWELLDAVID': {name: 'GM Howell', rating: 2658},
  '*GM_DRAGNEVVALE': {name: 'GM Dragnev', rating: 2409},
  '*GM_DREEVALEKSE': {name: 'GM Dreev', rating: 2621},
  '*GM_HOLMKRISTIA': {name: 'IM Holm', rating: 2409},
  '*GM_SANTOSLATAS': {name: 'GM Santos', rating: 2618},
  '*GM_JAKUBOWSKIK': {name: 'GM Jakubowski', rating: 2399},
  '*GM_AMINBASSEM': {name: 'GM Amin', rating: 2614},
  '*GM_HOVHANNISYA': {name: 'GM Hovhannisyan', rating: 2622},
  '*GM_MARTIROSYAN': {name: 'GM Martirosyan Haik M.', rating: 2624},
  '*GM_CHIGAEVMAKS': {name: 'GM Chigaev', rating: 2605},
  '*GM_KOLOSOWSKIM': {name: 'GM Kolosowski', rating: 2371},
  '*GM_ADLYAHMED': {name: 'GM Adly', rating: 2602},
  '*GM_MIKHALEVSKI': {name: 'GM Mikhalevski', rating: 2366},
  '*GM_TIMOFEEVART': {name: 'GM Timofeev', rating: 2591},
  '*GM_SINDAROVJAV': {name: 'GM Sindarov', rating: 2587},
  '*GM_GAREYEVTIMU': {name: 'GM Gareyev', rating: 2578},
  '*GM_TECLAFPAWEL': {name: 'GM Teclaf', rating: 2345},
  '*GM_BLUEBAUMMAT': {name: 'GM Bluebaum', rating: 2640},
  '*GM_BAUMJONASZ': {name: 'GM Baum', rating: 2343},
  '*GM_ALONSOROSEL': {name: 'GM Alonso', rating: 2571},
  '*GM_SZPARMILOSZ': {name: 'GM Szpar', rating: 2315},
  '*GM_NAJEREVGENI': {name: 'GM Najer', rating: 2565},
  '*GM_ASADLIVUGAR': {name: 'GM Asadli', rating: 2309},
  '*GM_JUMABAYEVRI': {name: 'GM Jumabayev', rating: 2658},
  '*GM_TOLOGONTEGI': {name: 'IM Tologontegin', rating: 2300},
  '*GM_CORRALESJIM': {name: 'GM Corrales', rating: 2561},
  '*GM_BLANCOACEVE': {name: 'GM Blanco', rating: 2289},
  '*GM_GHAEMMAGHAM': {name: 'GM Ghaem', rating: 2553},
  '*GM_MURADLIMAHA': {name: 'IM Muradli', rating: 2285},
  '*GM_DVIRNYYDANY': {name: 'GM Dvirnyy', rating: 2550},
  '*GM_SANKALPGUPT': {name: 'GM Sankalp', rating: 2266},
  '*GM_SHOKERSAMY': {name: 'GM Shoker', rating: 2550},
  '*GM_DUDINGLEB': {name: 'GM Dudin', rating: 2247},
  '*GM_VOKHIDOVSHA': {name: 'GM Vokhidov', rating: 2521},
  '*GM_KLIMKOWSKIJ': {name: 'GM KLIMKOWSKI', rating: 2211},
  '*GM_INDJICALEKS': {name: 'GM Indjic', rating: 2612},
  '*GM_LOPUSIEWICZ': {name: 'GM Lopusiewicz', rating: 2197},
  '*GM_KOBALIAMIKH': {name: 'GM Kobalia', rating: 2543},
  '*GM_MITRABHAGUH': {name: 'IM Mitrabha', rating: 2107},
  '*GM_KADRICDENIS': {name: 'GM Kadric', rating: 2542},
  '*GM_YUNUSOVMUKH': {name: 'N Yunusov', rating: 1832},
  '*GM_GELFANDBORI': {name: 'GM Gelfand', rating: 2680},
  '*GM_ERIGAISIARJ': {name: 'GM Erigaisi', rating: 2634},
  '*GM_ZVJAGINSEVV': {name: 'GM Zvjaginsev', rating: 2539}
};
Object.freeze(PLAYERS);

const regex = /(?=[A-Z])/;
const playerLookup = (player) => {
  if (PLAYERS[player]) {
    return PLAYERS[player];
  }

  if (typeof player !== 'string') {
    return PLAYERS[''];
  }

  const parts = player.replace('*', '').split('(')[0].split('_');
  const returnal = [];
  if (parts.length > 1) {
    returnal.push(parts.shift());
  }
  const name = parts.shift();
  returnal.push(name.split(regex)[0].replace('-', ''));

  return {name: returnal.join(' '), rating: null};
};

module.exports = {
  COLOR_WHITE,
  COLOR_BLACK,
  PLAYERS,
  playerLookup
};
