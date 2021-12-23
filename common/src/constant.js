const COLOR_WHITE = 'WHITE';
const COLOR_BLACK = 'BLACK';

const PLAYERS = {
  '': {
    name: 'Unknown',
    rating: 'N/A'
  },
  '*GM_CARLSEN': 'GM Carlsen, Magnus',
  '*GM_NAKAMURA': 'GM Nakamura, Hikaru',
  '*GM_DUDA': 'GM Duda, Jan-Krzysztof',
  '*GM_NEPOMNIACHT': 'GM Nepomniachtchi, Ian',
  '*GM_VACHIER-LAG': 'GM Vachier-Lagrave, Maxime',
  '*GM_CARUANA': 'GM Caruana, Fabiano',
  '*GM_GIRI': 'GM Giri, Anish',
  '*GM_GRISCHUK': 'GM Grischuk, Alexander',
  '*GM_KARJAKIN': 'GM Karjakin, Sergey',
  '*GM_SVIDLER': 'GM Svidler, Peter',
  '*GM_RAPPORT': 'GM Rapport, Richard',
  '*GM_WOJTASZEK': 'GM Wojtaszek, Radoslaw',
  '*GM_DUBOV': 'GM Dubov, Daniil',
  '*GM_ARONIAN': 'GM Aronian, Levon',
  '*GM_MAMEDYAROV': 'GM Mamedyarov, Shakhriyar',
  '*GM_OPARIN': 'GM Oparin, Grigoriy',
  '*GM_ARTEMIEV': 'GM Artemiev, Vladislav',
  '*GM_MOTYLEV': 'GM Motylev, Alexander',
  '*GM_SHIROV': 'GM Shirov, Alexei',
  '*GM_SARGISSIAN': 'GM Sargissian, Gabriel',
  '*GM_FEDOSEEV': 'GM Fedoseev, Vladimir',
  '*GM_MAMEDOV': 'GM Mamedov, Rauf',
  '*GM_KOROBOV': 'GM Korobov, Anton',
  '*GM_ONYSHCHUK': 'GM Onyshchuk, Volodymyr',
  '*GM_SARIC': 'GM Saric, Ivan',
  '*GM_SARANA': 'GM Sarana, Alexey',
  '*GM_JOBAVA': 'GM Jobava, Baadur',
  '*GM_SVANE': 'GM Svane, Rasmus',
  '*GM_PARAVYAN': 'GM Paravyan, David',
  '*GM_MOVSESIAN': 'GM Movsesian, Sergei',
  '*GM_DEMCHENKO': 'GM Demchenko, Anton',
  '*GM_SMIRIN': 'GM Smirin, Ilia',
  '*GM_FIROUZJA': 'GM Firouzja, Alireza',
  '*GM_MATLAKOV': 'GM Matlakov, Maxim',
  '*GM_GELFAND': 'GM Gelfand, Boris',
  '*GM_KOVALEV': 'GM Kovalev, Vladislav',
  '*GM_ANTIPOV': 'GM Antipov, Mikhail Al.',
  '*GM_ALEKSEENKO': 'GM Alekseenko, Kirill',
  '*GM_ITURRIZAGA_': 'GM Iturrizaga Bonelli, Eduardo',
  '*GM_SJUGIROV': 'GM Sjugirov, Sanan',
  '*GM_RIAZANTSEV': 'GM Riazantsev, Alexander',
  '*GM_VOLOKITIN': 'GM Volokitin, Andrei',
  '*GM_PREDKE': 'GM Predke, Alexandr',
  '*GM_VIDIT': 'GM Vidit, Santosh Gujrathi',
  '*GM_ANTON_GUIJA': 'GM Anton Guijarro, David',
  '*GM_HOWELL': 'GM Howell, David W L',
  '*GM_CHEPARINOV': 'GM Cheparinov, Ivan',
  '*GM_DREEV': 'GM Dreev, Aleksey',
  '*GM_PETROSIAN': 'GM Petrosian, Tigran L.',
  '*GM_SANTOS_LATA': 'GM Santos Latasa, Jaime',
  '*GM_HEIMANN': 'GM Heimann, Andreas',
  '*GM_PONKRATOV': 'GM Ponkratov, Pavel',
  '*GM_HOVHANNISYA': 'GM Hovhannisyan, Robert',
  '*GM_EFIMENKO': 'GM Efimenko, Zahar',
  '*GM_CHIGAEV': 'GM Chigaev, Maksim',
  '*GM_ADLY': 'GM Adly, Ahmed',
  '*GM_ABDUSATTORO': 'GM Abdusattorov, Nodirbek',
  '*GM_TIMOFEEV': 'GM Timofeev, Artyom',
  '*GM_QUPARADZE': 'GM Quparadze, Giga',
  '*GM_GAREYEV': 'GM Gareyev, Timur',
  '*GM_HALKIAS': 'GM Halkias, Stelios',
  '*GM_BLUEBAUM': 'GM Bluebaum, Matthias',
  '*GM_TER-SAHAKYA': 'GM Ter-Sahakyan, Samvel',
  '*GM_VAKHIDOV': 'GM Vakhidov, Jakhongir',
  '*GM_NAJER': 'GM Najer, Evgeniy',
  '*GM_VAN_FOREEST': 'GM Van Foreest, Jorden',
  '*GM_JUMABAYEV': 'GM Jumabayev, Rinat',
  '*GM_SOCKO': 'GM Socko, Bartosz',
  '*GM_CORRALES_JI': 'GM Corrales Jimenez, Fidel',
  '*GM_THEODOROU': 'GM Theodorou, Nikolas',
  '*GM_GHAEM_MAGHA': 'GM Ghaem Maghami, Ehsan',
  '*GM_KOZAK': 'GM Kozak, Adam',
  '*GM_DVIRNYY': 'GM Dvirnyy, Danyyil',
  '*GM_PARLIGRAS': 'GM Parligras, Mircea-Emilian',
  '*GM_SHOKER': 'GM Shoker, Samy',
  '*GM_PIORUN': 'GM Piorun, Kacper',
  '*GM_VOKHIDOV': 'GM Vokhidov, Shamsiddin',
  '*GM_DEMIDOV': 'GM Demidov, Mikhail',
  '*GM_INDJIC': 'GM Indjic, Aleksandar',
  '*GM_BARTEL': 'GM Bartel, Mateusz',
  '*GM_KOBALIA': 'GM Kobalia, Mikhail',
  '*GM_FRIDMAN': 'GM Fridman, Daniel',
  '*GM_KADRIC': 'GM Kadric, Denis',
  '*GM_TARI': 'GM Tari, Aryan',
  '*GM_ZVJAGINSEV': 'GM Zvjaginsev, Vadim',
  '*GM_GAGUNASHVIL': 'GM Gagunashvili, Merab',
  '*GM_DONCHENKO': 'GM Donchenko, Alexander',
  '*GM_GABUZYAN': 'GM Gabuzyan, Hovhannes',
  '*GM_MASTROVASIL': 'GM Mastrovasilis, Dimitrios',
  '*IM_MURZIN': 'IM Murzin, Volodar',
  '*GM_OLEKSIYENKO': 'GM Oleksiyenko, Mykhaylo',
  '*GM_PICHOT': 'GM Pichot, Alan',
  '*GM_CHRISTIANSE': 'GM Christiansen, Johan-Sebastian',
  '*GM_MORONI': 'GM Moroni, Luca Jr',
  '*GM_MICHALIK': 'GM Michalik, Peter',
  '*GM_PETROSYAN': 'GM Petrosyan, Manuel',
  '*GM_YUFFA': 'GM Yuffa, Daniil',
  '*GM_MAGHSOODLOO': 'GM Maghsoodloo, Parham',
  '*GM_OLAFSSON': 'GM Olafsson, Helgi',
  '*GM_SANAL': 'GM Sanal, Vahap',
  '*GM_SHEVCHENKO': 'GM Shevchenko, Kirill',
  '*GM_LIMA': 'GM Lima, Darcy',
  '*GM_NIHAL_SARIN': 'GM Nihal Sarin',
  '*GM_GAJEWSKI': 'GM Gajewski, Grzegorz',
  '*GM_NGUYEN': 'GM Nguyen, Thai Dai Van',
  '*GM_HARSHA_BHAR': 'GM Harsha Bharathakoti',
  '*GM_NARAYANAN.S': 'GM Narayanan.S.L',
  '*GM_ZILKA': 'GM Zilka, Stepan',
  '*GM_PURANIK': 'GM Puranik, Abhimanyu',
  '*IM_FAIZRAKHMAN': 'IM Faizrakhmanov, Ramil',
  '*GM_SYCHEV': 'GM Sychev, Klementy',
  '*GM_POSTNY': 'GM Postny, Evgeny',
  '*GM_SADHWANI': 'GM Sadhwani, Raunak',
  '*IM_COSTACHI': 'IM Costachi, Mihnea',
  '*GM_HEBERLA': 'GM Heberla, Bartlomiej',
  '*GM_CARLSSON': 'GM Carlsson, Pontus',
  '*IM_SAHIDI': 'IM Sahidi, Samir',
  '*IM_AZIZ': 'IM Aziz, Husain',
  '*GM_KRASENKOW': 'GM Krasenkow, Michal',
  '*GM_TANG': 'GM Tang, Andrew',
  '*GM_NEVEDNICHY': 'GM Nevednichy, Vladislav',
  '*GM_DZIUBA': 'GM Dziuba, Marcin',
  '*GM_CUENCA_JIME': 'GM Cuenca Jimenez, Jose Fernando',
  '*IM_SARACI': 'IM Saraci, Nderim',
  '*IM_AL_QUDAIMI': 'IM Al Qudaimi, Basheer',
  '*IM_PENG': 'IM Peng, Li Min',
  '*IM_BLOHBERGER': 'IM Blohberger, Felix',
  '*GM_DRAGNEV': 'GM Dragnev, Valentin',
  '*IM_HOLM': 'IM Holm, Kristian Stuvik',
  '*GM_THYBO': 'GM Thybo, Jesper Sondergaard',
  '*GM_ERIGAISI_AR': 'GM Erigaisi Arjun',
  '*IM_VASTRUKHIN': 'IM Vastrukhin, Oleg',
  '*GM_MARTIROSYAN': 'GM Martirosyan, Haik M.',
  '*GM_MIKHALEVSKI': 'GM Mikhalevski, Victor',
  '*IM_ROSNER': 'IM Rosner, Jonas',
  '*GM_IVIC': 'GM Ivic, Velimir',
  '*IM_TISSIR': 'IM Tissir, Mohamed',
  '*GM_SINDAROV': 'GM Sindarov, Javokhir',
  '*GM_SARGSYAN': 'GM Sargsyan, Shant',
  '*GM_NIEMANN': 'GM Niemann, Hans Moke',
  '*GM_ASADLI': 'GM Asadli, Vugar',
  '*IM_TOLOGONTEGI': 'IM Tologontegin, Semetey',
  '*IM_MACEDO': 'IM Macedo, Maximo Iack',
  '*IM_MURADLI': 'IM Muradli, Mahammad',
  '*CM_PETROVSKYI': 'CM Petrovskyi, Vadym',
  '*FM_SAMUNENKOV': 'FM Samunenkov, Ihor',
  '*GM_SULEYMANLI': 'GM Suleymanli, Aydin',
  '*FM_BABAZADA': 'FM Babazada, Khazar',
  '*IM_MITRABHA': 'IM Mitrabha, Guha',
  '*FM_DAMJANOVIC': 'FM Damjanovic, Vuk',
  '*GM_GUKESH_D': 'GM Gukesh D',
  '*N_YUNUSOV': 'N Yunusov, Mukhammad',
  '*IM_ADITYA_MITT': 'IM Aditya Mittal'
};
Object.freeze(PLAYERS);

module.exports = {
  COLOR_WHITE,
  COLOR_BLACK,
  PLAYERS
};
