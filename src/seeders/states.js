//Default State information
const stateData = [
  {
    "name": "Southern Nations, Nationalities, and Peoples' Region",
    "country_id": 70
  },
  {
    "name": "Somali Region",
    "country_id": 70
  },
  {
    "name": "Amhara Region",
    "country_id": 70
  },
  {
    "name": "Tigray Region",
    "country_id": 70
  },
  {
    "name": "Oromia Region",
    "country_id": 70
  },
  {
    "name": "Afar Region",
    "country_id": 70
  },
  {
    "name": "Harari Region",
    "country_id": 70
  },
  {
    "name": "Dire Dawa",
    "country_id": 70
  },
  {
    "name": "Benishangul-Gumuz Region",
    "country_id": 70
  },
  {
    "name": "Gambela Region",
    "country_id": 70
  },
  {
    "name": "Addis Ababa",
    "country_id": 70
  },
  {
    "name": "Petnjica Municipality",
    "country_id": 147
  },
  {
    "name": "Bar Municipality",
    "country_id": 147
  },
  {
    "name": "Danilovgrad Municipality",
    "country_id": 147
  },
  {
    "name": "Rožaje Municipality",
    "country_id": 147
  },
  {
    "name": "Plužine Municipality",
    "country_id": 147
  },
  {
    "name": "Nikšić Municipality",
    "country_id": 147
  },
  {
    "name": "Šavnik Municipality",
    "country_id": 147
  },
  {
    "name": "Plav Municipality",
    "country_id": 147
  },
  {
    "name": "Pljevlja Municipality",
    "country_id": 147
  },
  {
    "name": "Berane Municipality",
    "country_id": 147
  },
  {
    "name": "Mojkovac Municipality",
    "country_id": 147
  },
  {
    "name": "Andrijevica Municipality",
    "country_id": 147
  },
  {
    "name": "Gusinje Municipality",
    "country_id": 147
  },
  {
    "name": "Bijelo Polje Municipality",
    "country_id": 147
  },
  {
    "name": "Kotor Municipality",
    "country_id": 147
  },
  {
    "name": "Podgorica Municipality",
    "country_id": 147
  },
  {
    "name": "Old Royal Capital Cetinje",
    "country_id": 147
  },
  {
    "name": "Tivat Municipality",
    "country_id": 147
  },
  {
    "name": "Budva Municipality",
    "country_id": 147
  },
  {
    "name": "Kolašin Municipality",
    "country_id": 147
  },
  {
    "name": "Žabljak Municipality",
    "country_id": 147
  },
  {
    "name": "Ulcinj Municipality",
    "country_id": 147
  },
  {
    "name": "Kunene Region",
    "country_id": 152
  },
  {
    "name": "Kavango West Region",
    "country_id": 152
  },
  {
    "name": "Kavango East Region",
    "country_id": 152
  },
  {
    "name": "Oshana Region",
    "country_id": 152
  },
  {
    "name": "Hardap Region",
    "country_id": 152
  },
  {
    "name": "Omusati Region",
    "country_id": 152
  },
  {
    "name": "Ohangwena Region",
    "country_id": 152
  },
  {
    "name": "Omaheke Region",
    "country_id": 152
  },
  {
    "name": "Oshikoto Region",
    "country_id": 152
  },
  {
    "name": "Erongo Region",
    "country_id": 152
  },
  {
    "name": "Khomas Region",
    "country_id": 152
  },
  {
    "name": "Karas Region",
    "country_id": 152
  },
  {
    "name": "Otjozondjupa Region",
    "country_id": 152
  },
  {
    "name": "Zambezi Region",
    "country_id": 152
  },
  {
    "name": "Ashanti",
    "country_id": 83
  },
  {
    "name": "Western",
    "country_id": 83
  },
  {
    "name": "Eastern",
    "country_id": 83
  },
  {
    "name": "Northern",
    "country_id": 83
  },
  {
    "name": "Central",
    "country_id": 83
  },
  {
    "name": "Ahafo",
    "country_id": 83
  },
  {
    "name": "Greater Accra",
    "country_id": 83
  },
  {
    "name": "Upper East",
    "country_id": 83
  },
  {
    "name": "Volta",
    "country_id": 83
  },
  {
    "name": "Upper West",
    "country_id": 83
  },
  {
    "name": "San Marino",
    "country_id": 192
  },
  {
    "name": "Acquaviva",
    "country_id": 192
  },
  {
    "name": "Chiesanuova",
    "country_id": 192
  },
  {
    "name": "Borgo Maggiore",
    "country_id": 192
  },
  {
    "name": "Faetano",
    "country_id": 192
  },
  {
    "name": "Montegiardino",
    "country_id": 192
  },
  {
    "name": "Domagnano",
    "country_id": 192
  },
  {
    "name": "Serravalle",
    "country_id": 192
  },
  {
    "name": "Fiorentino",
    "country_id": 192
  },
  {
    "name": "Tillabéri Region",
    "country_id": 160
  },
  {
    "name": "Dosso Region",
    "country_id": 160
  },
  {
    "name": "Zinder Region",
    "country_id": 160
  },
  {
    "name": "Maradi Region",
    "country_id": 160
  },
  {
    "name": "Agadez Region",
    "country_id": 160
  },
  {
    "name": "Diffa Region",
    "country_id": 160
  },
  {
    "name": "Tahoua Region",
    "country_id": 160
  },
  {
    "name": "Mqabba",
    "country_id": 135
  },
  {
    "name": "San Ġwann",
    "country_id": 135
  },
  {
    "name": "Żurrieq",
    "country_id": 135
  },
  {
    "name": "Luqa",
    "country_id": 135
  },
  {
    "name": "Marsaxlokk",
    "country_id": 135
  },
  {
    "name": "Qala",
    "country_id": 135
  },
  {
    "name": "Żebbuġ Malta",
    "country_id": 135
  },
  {
    "name": "Xgħajra",
    "country_id": 135
  },
  {
    "name": "Kirkop",
    "country_id": 135
  },
  {
    "name": "Rabat",
    "country_id": 135
  },
  {
    "name": "Floriana",
    "country_id": 135
  },
  {
    "name": "Żebbuġ Gozo",
    "country_id": 135
  },
  {
    "name": "Swieqi",
    "country_id": 135
  },
  {
    "name": "Saint Lawrence",
    "country_id": 135
  },
  {
    "name": "Birżebbuġa",
    "country_id": 135
  },
  {
    "name": "Mdina",
    "country_id": 135
  },
  {
    "name": "Santa Venera",
    "country_id": 135
  },
  {
    "name": "Kerċem",
    "country_id": 135
  },
  {
    "name": "Għarb",
    "country_id": 135
  },
  {
    "name": "Iklin",
    "country_id": 135
  },
  {
    "name": "Santa Luċija",
    "country_id": 135
  },
  {
    "name": "Valletta",
    "country_id": 135
  },
  {
    "name": "Msida",
    "country_id": 135
  },
  {
    "name": "Birkirkara",
    "country_id": 135
  },
  {
    "name": "Siġġiewi",
    "country_id": 135
  },
  {
    "name": "Kalkara",
    "country_id": 135
  },
  {
    "name": "St. Julian's",
    "country_id": 135
  },
  {
    "name": "Victoria",
    "country_id": 135
  },
  {
    "name": "Mellieħa",
    "country_id": 135
  },
  {
    "name": "Tarxien",
    "country_id": 135
  },
  {
    "name": "Sliema",
    "country_id": 135
  },
  {
    "name": "Ħamrun",
    "country_id": 135
  },
  {
    "name": "Għasri",
    "country_id": 135
  },
  {
    "name": "Birgu",
    "country_id": 135
  },
  {
    "name": "Balzan",
    "country_id": 135
  },
  {
    "name": "Mġarr",
    "country_id": 135
  },
  {
    "name": "Attard",
    "country_id": 135
  },
  {
    "name": "Qrendi",
    "country_id": 135
  },
  {
    "name": "Naxxar",
    "country_id": 135
  },
  {
    "name": "Gżira",
    "country_id": 135
  },
  {
    "name": "Xagħra",
    "country_id": 135
  },
  {
    "name": "Paola",
    "country_id": 135
  },
  {
    "name": "Sannat",
    "country_id": 135
  },
  {
    "name": "Dingli",
    "country_id": 135
  },
  {
    "name": "Gudja",
    "country_id": 135
  },
  {
    "name": "Qormi",
    "country_id": 135
  },
  {
    "name": "Għargħur",
    "country_id": 135
  },
  {
    "name": "Xewkija",
    "country_id": 135
  },
  {
    "name": "Ta' Xbiex",
    "country_id": 135
  },
  {
    "name": "Żabbar",
    "country_id": 135
  },
  {
    "name": "Għaxaq",
    "country_id": 135
  },
  {
    "name": "Pembroke",
    "country_id": 135
  },
  {
    "name": "Lija",
    "country_id": 135
  },
  {
    "name": "Pietà",
    "country_id": 135
  },
  {
    "name": "Marsa",
    "country_id": 135
  },
  {
    "name": "Fgura",
    "country_id": 135
  },
  {
    "name": "Għajnsielem",
    "country_id": 135
  },
  {
    "name": "Mtarra",
    "country_id": 135
  },
  {
    "name": "Munxar",
    "country_id": 135
  },
  {
    "name": "Nadur",
    "country_id": 135
  },
  {
    "name": "Fontana",
    "country_id": 135
  },
  {
    "name": "Żejtun",
    "country_id": 135
  },
  {
    "name": "Senglea",
    "country_id": 135
  },
  {
    "name": "Marsaskala",
    "country_id": 135
  },
  {
    "name": "Cospicua",
    "country_id": 135
  },
  {
    "name": "St. Paul's Bay",
    "country_id": 135
  },
  {
    "name": "Mosta",
    "country_id": 135
  },
  {
    "name": "Mangystau Region",
    "country_id": 112
  },
  {
    "name": "Kyzylorda Region",
    "country_id": 112
  },
  {
    "name": "Almaty Region",
    "country_id": 112
  },
  {
    "name": "North Kazakhstan Region",
    "country_id": 112
  },
  {
    "name": "Akmola Region",
    "country_id": 112
  },
  {
    "name": "Pavlodar Region",
    "country_id": 112
  },
  {
    "name": "Jambyl Region",
    "country_id": 112
  },
  {
    "name": "West Kazakhstan Province",
    "country_id": 112
  },
  {
    "name": "Turkestan Region",
    "country_id": 112
  },
  {
    "name": "Karaganda Region",
    "country_id": 112
  },
  {
    "name": "Aktobe Region",
    "country_id": 112
  },
  {
    "name": "Almaty",
    "country_id": 112
  },
  {
    "name": "Atyrau Region",
    "country_id": 112
  },
  {
    "name": "East Kazakhstan Region",
    "country_id": 112
  },
  {
    "name": "Baikonur",
    "country_id": 112
  },
  {
    "name": "Nur-Sultan",
    "country_id": 112
  },
  {
    "name": "Kostanay Region",
    "country_id": 112
  },
  {
    "name": "Kakamega",
    "country_id": 113
  },
  {
    "name": "Kisii",
    "country_id": 113
  },
  {
    "name": "Busia",
    "country_id": 113
  },
  {
    "name": "Embu",
    "country_id": 113
  },
  {
    "name": "Laikipia",
    "country_id": 113
  },
  {
    "name": "Nandi",
    "country_id": 113
  },
  {
    "name": "Lamu",
    "country_id": 113
  },
  {
    "name": "Kirinyaga",
    "country_id": 113
  },
  {
    "name": "Bungoma",
    "country_id": 113
  },
  {
    "name": "Uasin Gishu",
    "country_id": 113
  },
  {
    "name": "Isiolo",
    "country_id": 113
  },
  {
    "name": "Kisumu",
    "country_id": 113
  },
  {
    "name": "Kwale",
    "country_id": 113
  },
  {
    "name": "Kilifi",
    "country_id": 113
  },
  {
    "name": "Narok",
    "country_id": 113
  },
  {
    "name": "Taita–Taveta",
    "country_id": 113
  },
  {
    "name": "Murang'a",
    "country_id": 113
  },
  {
    "name": "Nyeri",
    "country_id": 113
  },
  {
    "name": "Baringo",
    "country_id": 113
  },
  {
    "name": "Wajir",
    "country_id": 113
  },
  {
    "name": "Trans Nzoia",
    "country_id": 113
  },
  {
    "name": "Machakos",
    "country_id": 113
  },
  {
    "name": "Tharaka-Nithi",
    "country_id": 113
  },
  {
    "name": "Siaya",
    "country_id": 113
  },
  {
    "name": "Mandera",
    "country_id": 113
  },
  {
    "name": "Makueni",
    "country_id": 113
  },
  {
    "name": "Migori",
    "country_id": 113
  },
  {
    "name": "Nairobi City",
    "country_id": 113
  },
  {
    "name": "Nyandarua",
    "country_id": 113
  },
  {
    "name": "Kericho",
    "country_id": 113
  },
  {
    "name": "Marsabit",
    "country_id": 113
  },
  {
    "name": "Homa Bay",
    "country_id": 113
  },
  {
    "name": "Garissa",
    "country_id": 113
  },
  {
    "name": "Kajiado",
    "country_id": 113
  },
  {
    "name": "Meru",
    "country_id": 113
  },
  {
    "name": "Kiambu",
    "country_id": 113
  },
  {
    "name": "Mombasa",
    "country_id": 113
  },
  {
    "name": "Elgeyo-Marakwet",
    "country_id": 113
  },
  {
    "name": "Vihiga",
    "country_id": 113
  },
  {
    "name": "Nakuru",
    "country_id": 113
  },
  {
    "name": "Tana River",
    "country_id": 113
  },
  {
    "name": "Turkana",
    "country_id": 113
  },
  {
    "name": "Samburu",
    "country_id": 113
  },
  {
    "name": "West Pokot",
    "country_id": 113
  },
  {
    "name": "Nyamira",
    "country_id": 113
  },
  {
    "name": "Bomet",
    "country_id": 113
  },
  {
    "name": "Kitui",
    "country_id": 113
  },
  {
    "name": "Bié Province",
    "country_id": 7
  },
  {
    "name": "Huambo Province",
    "country_id": 7
  },
  {
    "name": "Zaire Province",
    "country_id": 7
  },
  {
    "name": "Cunene Province",
    "country_id": 7
  },
  {
    "name": "Cuanza Sul",
    "country_id": 7
  },
  {
    "name": "Cuanza Norte Province",
    "country_id": 7
  },
  {
    "name": "Benguela Province",
    "country_id": 7
  },
  {
    "name": "Moxico Province",
    "country_id": 7
  },
  {
    "name": "Lunda Sul Province",
    "country_id": 7
  },
  {
    "name": "Bengo Province",
    "country_id": 7
  },
  {
    "name": "Luanda Province",
    "country_id": 7
  },
  {
    "name": "Lunda Norte Province",
    "country_id": 7
  },
  {
    "name": "Uíge Province",
    "country_id": 7
  },
  {
    "name": "Huíla Province",
    "country_id": 7
  },
  {
    "name": "Cuando Cubango Province",
    "country_id": 7
  },
  {
    "name": "Malanje Province",
    "country_id": 7
  },
  {
    "name": "Cabinda Province",
    "country_id": 7
  },
  {
    "name": "Gasa District",
    "country_id": 26
  },
  {
    "name": "Tsirang District",
    "country_id": 26
  },
  {
    "name": "Wangdue Phodrang District",
    "country_id": 26
  },
  {
    "name": "Haa District",
    "country_id": 26
  },
  {
    "name": "Zhemgang District",
    "country_id": 26
  },
  {
    "name": "Lhuntse District",
    "country_id": 26
  },
  {
    "name": "Punakha District",
    "country_id": 26
  },
  {
    "name": "Trashigang District",
    "country_id": 26
  },
  {
    "name": "Paro District",
    "country_id": 26
  },
  {
    "name": "Dagana District",
    "country_id": 26
  },
  {
    "name": "Chukha District",
    "country_id": 26
  },
  {
    "name": "Bumthang District",
    "country_id": 26
  },
  {
    "name": "Thimphu District",
    "country_id": 26
  },
  {
    "name": "Mongar District",
    "country_id": 26
  },
  {
    "name": "Samdrup Jongkhar District",
    "country_id": 26
  },
  {
    "name": "Pemagatshel District",
    "country_id": 26
  },
  {
    "name": "Trongsa District",
    "country_id": 26
  },
  {
    "name": "Samtse District",
    "country_id": 26
  },
  {
    "name": "Sarpang District",
    "country_id": 26
  },
  {
    "name": "Tombouctou Region",
    "country_id": 134
  },
  {
    "name": "Ségou Region",
    "country_id": 134
  },
  {
    "name": "Koulikoro Region",
    "country_id": 134
  },
  {
    "name": "Ménaka Region",
    "country_id": 134
  },
  {
    "name": "Kayes Region",
    "country_id": 134
  },
  {
    "name": "Bamako",
    "country_id": 134
  },
  {
    "name": "Sikasso Region",
    "country_id": 134
  },
  {
    "name": "Mopti Region",
    "country_id": 134
  },
  {
    "name": "Taoudénit Region",
    "country_id": 134
  },
  {
    "name": "Kidal Region",
    "country_id": 134
  },
  {
    "name": "Gao Region",
    "country_id": 134
  },
  {
    "name": "Southern Province",
    "country_id": 183
  },
  {
    "name": "Western Province",
    "country_id": 183
  },
  {
    "name": "Eastern Province",
    "country_id": 183
  },
  {
    "name": "Kigali district",
    "country_id": 183
  },
  {
    "name": "Northern Province",
    "country_id": 183
  },
  {
    "name": "Belize District",
    "country_id": 23
  },
  {
    "name": "Stann Creek District",
    "country_id": 23
  },
  {
    "name": "Corozal District",
    "country_id": 23
  },
  {
    "name": "Toledo District",
    "country_id": 23
  },
  {
    "name": "Orange Walk District",
    "country_id": 23
  },
  {
    "name": "Cayo District",
    "country_id": 23
  },
  {
    "name": "Príncipe Province",
    "country_id": 193
  },
  {
    "name": "São Tomé Province",
    "country_id": 193
  },
  {
    "name": "Havana Province",
    "country_id": 56
  },
  {
    "name": "Santiago de Cuba Province",
    "country_id": 56
  },
  {
    "name": "Sancti Spíritus Province",
    "country_id": 56
  },
  {
    "name": "Granma Province",
    "country_id": 56
  },
  {
    "name": "Mayabeque Province",
    "country_id": 56
  },
  {
    "name": "Pinar del Río Province",
    "country_id": 56
  },
  {
    "name": "Isla de la Juventud",
    "country_id": 56
  },
  {
    "name": "Holguín Province",
    "country_id": 56
  },
  {
    "name": "Villa Clara Province",
    "country_id": 56
  },
  {
    "name": "Las Tunas Province",
    "country_id": 56
  },
  {
    "name": "Ciego de Ávila Province",
    "country_id": 56
  },
  {
    "name": "Artemisa Province",
    "country_id": 56
  },
  {
    "name": "Matanzas Province",
    "country_id": 56
  },
  {
    "name": "Guantánamo Province",
    "country_id": 56
  },
  {
    "name": "Camagüey Province",
    "country_id": 56
  },
  {
    "name": "Cienfuegos Province",
    "country_id": 56
  },
  {
    "name": "Jigawa",
    "country_id": 161
  },
  {
    "name": "Enugu",
    "country_id": 161
  },
  {
    "name": "Kebbi",
    "country_id": 161
  },
  {
    "name": "Benue",
    "country_id": 161
  },
  {
    "name": "Sokoto",
    "country_id": 161
  },
  {
    "name": "Abuja Federal Capital Territory",
    "country_id": 161
  },
  {
    "name": "Kaduna",
    "country_id": 161
  },
  {
    "name": "Kwara",
    "country_id": 161
  },
  {
    "name": "Oyo",
    "country_id": 161
  },
  {
    "name": "Yobe",
    "country_id": 161
  },
  {
    "name": "Kogi",
    "country_id": 161
  },
  {
    "name": "Zamfara",
    "country_id": 161
  },
  {
    "name": "Kano",
    "country_id": 161
  },
  {
    "name": "Nasarawa",
    "country_id": 161
  },
  {
    "name": "Plateau",
    "country_id": 161
  },
  {
    "name": "Abia",
    "country_id": 161
  },
  {
    "name": "Akwa Ibom",
    "country_id": 161
  },
  {
    "name": "Bayelsa",
    "country_id": 161
  },
  {
    "name": "Lagos",
    "country_id": 161
  },
  {
    "name": "Borno",
    "country_id": 161
  },
  {
    "name": "Imo",
    "country_id": 161
  },
  {
    "name": "Ekiti",
    "country_id": 161
  },
  {
    "name": "Gombe",
    "country_id": 161
  },
  {
    "name": "Ebonyi",
    "country_id": 161
  },
  {
    "name": "Bauchi",
    "country_id": 161
  },
  {
    "name": "Katsina",
    "country_id": 161
  },
  {
    "name": "Cross River",
    "country_id": 161
  },
  {
    "name": "Anambra",
    "country_id": 161
  },
  {
    "name": "Delta",
    "country_id": 161
  },
  {
    "name": "Niger",
    "country_id": 161
  },
  {
    "name": "Edo",
    "country_id": 161
  },
  {
    "name": "Taraba",
    "country_id": 161
  },
  {
    "name": "Adamawa",
    "country_id": 161
  },
  {
    "name": "Ondo",
    "country_id": 161
  },
  {
    "name": "Osun",
    "country_id": 161
  },
  {
    "name": "Ogun",
    "country_id": 161
  },

  {
    "name": "Rukungiri District",
    "country_id": 229
  },
  {
    "name": "Kyankwanzi District",
    "country_id": 229
  },
  {
    "name": "Kabarole District",
    "country_id": 229
  },
  {
    "name": "Mpigi District",
    "country_id": 229
  },
  {
    "name": "Apac District",
    "country_id": 229
  },
  {
    "name": "Abim District",
    "country_id": 229
  },
  {
    "name": "Yumbe District",
    "country_id": 229
  },
  {
    "name": "Rukiga District",
    "country_id": 229
  },
  {
    "name": "Northern Region",
    "country_id": 229
  },
  {
    "name": "Serere District",
    "country_id": 229
  },
  {
    "name": "Kamuli District",
    "country_id": 229
  },
  {
    "name": "Amuru District",
    "country_id": 229
  },
  {
    "name": "Kaberamaido District",
    "country_id": 229
  },
  {
    "name": "Namutumba District",
    "country_id": 229
  },
  {
    "name": "Kibuku District",
    "country_id": 229
  },
  {
    "name": "Ibanda District",
    "country_id": 229
  },
  {
    "name": "Iganga District",
    "country_id": 229
  },
  {
    "name": "Dokolo District",
    "country_id": 229
  },
  {
    "name": "Lira District",
    "country_id": 229
  },
  {
    "name": "Bukedea District",
    "country_id": 229
  },
  {
    "name": "Alebtong District",
    "country_id": 229
  },
  {
    "name": "Koboko District",
    "country_id": 229
  },
  {
    "name": "Kiryandongo District",
    "country_id": 229
  },
  {
    "name": "Kiboga District",
    "country_id": 229
  },
  {
    "name": "Kitgum District",
    "country_id": 229
  },
  {
    "name": "Bududa District",
    "country_id": 229
  },
  {
    "name": "Mbale District",
    "country_id": 229
  },
  {
    "name": "Namayingo District",
    "country_id": 229
  },
  {
    "name": "Amuria District",
    "country_id": 229
  },
  {
    "name": "Amudat District",
    "country_id": 229
  },
  {
    "name": "Masindi District",
    "country_id": 229
  },
  {
    "name": "Kiruhura District",
    "country_id": 229
  },
  {
    "name": "Masaka District",
    "country_id": 229
  },
  {
    "name": "Pakwach District",
    "country_id": 229
  },
  {
    "name": "Rubanda District",
    "country_id": 229
  },
  {
    "name": "Tororo District",
    "country_id": 229
  },
  {
    "name": "Kamwenge District",
    "country_id": 229
  },
  {
    "name": "Adjumani District",
    "country_id": 229
  },
  {
    "name": "Wakiso District",
    "country_id": 229
  },
  {
    "name": "Moyo District",
    "country_id": 229
  },
  {
    "name": "Mityana District",
    "country_id": 229
  },
  {
    "name": "Butaleja District",
    "country_id": 229
  },
  {
    "name": "Gomba District",
    "country_id": 229
  },
  {
    "name": "Jinja District",
    "country_id": 229
  },
  {
    "name": "Kayunga District",
    "country_id": 229
  },
  {
    "name": "Kween District",
    "country_id": 229
  },
  {
    "name": "Western Region",
    "country_id": 229
  },
  {
    "name": "Mubende District",
    "country_id": 229
  },
  {
    "name": "Eastern Region",
    "country_id": 229
  },
  {
    "name": "Kanungu District",
    "country_id": 229
  },
  {
    "name": "Omoro District",
    "country_id": 229
  },
  {
    "name": "Bukomansimbi District",
    "country_id": 229
  },
  {
    "name": "Lyantonde District",
    "country_id": 229
  },
  {
    "name": "Buikwe District",
    "country_id": 229
  },
  {
    "name": "Nwoya District",
    "country_id": 229
  },
  {
    "name": "Zombo District",
    "country_id": 229
  },
  {
    "name": "Buyende District",
    "country_id": 229
  },
  {
    "name": "Bunyangabu District",
    "country_id": 229
  },
  {
    "name": "Kampala District",
    "country_id": 229
  },
  {
    "name": "Isingiro District",
    "country_id": 229
  },
  {
    "name": "Butambala District",
    "country_id": 229
  },
  {
    "name": "Bukwo District",
    "country_id": 229
  },
  {
    "name": "Bushenyi District",
    "country_id": 229
  },
  {
    "name": "Bugiri District",
    "country_id": 229
  },
  {
    "name": "Butebo District",
    "country_id": 229
  },
  {
    "name": "Buliisa District",
    "country_id": 229
  },
  {
    "name": "Otuke District",
    "country_id": 229
  },
  {
    "name": "Buhweju District",
    "country_id": 229
  },
  {
    "name": "Agago District",
    "country_id": 229
  },
  {
    "name": "Nakapiripirit District",
    "country_id": 229
  },
  {
    "name": "Kalungu District",
    "country_id": 229
  },
  {
    "name": "Moroto District",
    "country_id": 229
  },
  {
    "name": "Central Region",
    "country_id": 229
  },
  {
    "name": "Oyam District",
    "country_id": 229
  },
  {
    "name": "Kaliro District",
    "country_id": 229
  },
  {
    "name": "Kakumiro District",
    "country_id": 229
  },
  {
    "name": "Namisindwa District",
    "country_id": 229
  },
  {
    "name": "Kole District",
    "country_id": 229
  },
  {
    "name": "Kyenjojo District",
    "country_id": 229
  },
  {
    "name": "Kagadi District",
    "country_id": 229
  },
  {
    "name": "Ntungamo District",
    "country_id": 229
  },
  {
    "name": "Kalangala District",
    "country_id": 229
  },
  {
    "name": "Nakasongola District",
    "country_id": 229
  },
  {
    "name": "Sheema District",
    "country_id": 229
  },
  {
    "name": "Pader District",
    "country_id": 229
  },
  {
    "name": "Kisoro District",
    "country_id": 229
  },
  {
    "name": "Mukono District",
    "country_id": 229
  },
  {
    "name": "Lamwo District",
    "country_id": 229
  },
  {
    "name": "Pallisa District",
    "country_id": 229
  },
  {
    "name": "Gulu District",
    "country_id": 229
  },
  {
    "name": "Buvuma District",
    "country_id": 229
  },
  {
    "name": "Mbarara District",
    "country_id": 229
  },
  {
    "name": "Amolatar District",
    "country_id": 229
  },
  {
    "name": "Lwengo District",
    "country_id": 229
  },
  {
    "name": "Mayuge District",
    "country_id": 229
  },
  {
    "name": "Bundibugyo District",
    "country_id": 229
  },
  {
    "name": "Katakwi District",
    "country_id": 229
  },
  {
    "name": "Maracha District",
    "country_id": 229
  },
  {
    "name": "Ntoroko District",
    "country_id": 229
  },
  {
    "name": "Nakaseke District",
    "country_id": 229
  },
  {
    "name": "Ngora District",
    "country_id": 229
  },
  {
    "name": "Kumi District",
    "country_id": 229
  },
  {
    "name": "Kabale District",
    "country_id": 229
  },
  {
    "name": "Sembabule District",
    "country_id": 229
  },
  {
    "name": "Bulambuli District",
    "country_id": 229
  },
  {
    "name": "Sironko District",
    "country_id": 229
  },
  {
    "name": "Napak District",
    "country_id": 229
  },
  {
    "name": "Busia District",
    "country_id": 229
  },
  {
    "name": "Kapchorwa District",
    "country_id": 229
  },
  {
    "name": "Luwero District",
    "country_id": 229
  },
  {
    "name": "Kaabong District",
    "country_id": 229
  },
  {
    "name": "Mitooma District",
    "country_id": 229
  },
  {
    "name": "Kibaale District",
    "country_id": 229
  },
  {
    "name": "Kyegegwa District",
    "country_id": 229
  },
  {
    "name": "Manafwa District",
    "country_id": 229
  },
  {
    "name": "Rakai District",
    "country_id": 229
  },
  {
    "name": "Kasese District",
    "country_id": 229
  },
  {
    "name": "Budaka District",
    "country_id": 229
  },
  {
    "name": "Rubirizi District",
    "country_id": 229
  },
  {
    "name": "Kotido District",
    "country_id": 229
  },
  {
    "name": "Soroti District",
    "country_id": 229
  },
  {
    "name": "Luuka District",
    "country_id": 229
  },
  {
    "name": "Nebbi District",
    "country_id": 229
  },
  {
    "name": "Arua District",
    "country_id": 229
  },
  {
    "name": "Kyotera District",
    "country_id": 229
  },

  {
    "name": "Schellenberg",
    "country_id": 125
  },
  {
    "name": "Schaan",
    "country_id": 125
  },
  {
    "name": "Eschen",
    "country_id": 125
  },
  {
    "name": "Vaduz",
    "country_id": 125
  },
  {
    "name": "Ruggell",
    "country_id": 125
  },
  {
    "name": "Planken",
    "country_id": 125
  },
  {
    "name": "Mauren",
    "country_id": 125
  },
  {
    "name": "Triesenberg",
    "country_id": 125
  },
  {
    "name": "Gamprin",
    "country_id": 125
  },
  {
    "name": "Balzers",
    "country_id": 125
  },
  {
    "name": "Triesen",
    "country_id": 125
  },
  {
    "name": "Brčko District",
    "country_id": 28
  },
  {
    "name": "Tuzla Canton",
    "country_id": 28
  },
  {
    "name": "Central Bosnia Canton",
    "country_id": 28
  },
  {
    "name": "Herzegovina-Neretva Canton",
    "country_id": 28
  },
  {
    "name": "Posavina Canton",
    "country_id": 28
  },
  {
    "name": "Una-Sana Canton",
    "country_id": 28
  },
  {
    "name": "Sarajevo Canton",
    "country_id": 28
  },
  {
    "name": "Federation of Bosnia and Herzegovina",
    "country_id": 28
  },
  {
    "name": "Zenica-Doboj Canton",
    "country_id": 28
  },
  {
    "name": "West Herzegovina Canton",
    "country_id": 28
  },
  {
    "name": "Republika Srpska",
    "country_id": 28
  },
  {
    "name": "Canton 10",
    "country_id": 28
  },
  {
    "name": "Bosnian Podrinje Canton",
    "country_id": 28
  },
  {
    "name": "Dakar",
    "country_id": 195
  },
  {
    "name": "Kolda",
    "country_id": 195
  },
  {
    "name": "Kaffrine",
    "country_id": 195
  },
  {
    "name": "Matam",
    "country_id": 195
  },
  {
    "name": "Saint-Louis",
    "country_id": 195
  },
  {
    "name": "Ziguinchor",
    "country_id": 195
  },
  {
    "name": "Fatick",
    "country_id": 195
  },
  {
    "name": "Diourbel Region",
    "country_id": 195
  },
  {
    "name": "Kédougou",
    "country_id": 195
  },
  {
    "name": "Sédhiou",
    "country_id": 195
  },
  {
    "name": "Kaolack",
    "country_id": 195
  },
  {
    "name": "Thiès Region",
    "country_id": 195
  },
  {
    "name": "Louga",
    "country_id": 195
  },
  {
    "name": "Tambacounda Region",
    "country_id": 195
  },
  {
    "name": "Encamp",
    "country_id": 6
  },
  {
    "name": "Andorra la Vella",
    "country_id": 6
  },
  {
    "name": "Canillo",
    "country_id": 6
  },
  {
    "name": "Sant Julià de Lòria",
    "country_id": 6
  },
  {
    "name": "Ordino",
    "country_id": 6
  },
  {
    "name": "Escaldes-Engordany",
    "country_id": 6
  },
  {
    "name": "La Massana",
    "country_id": 6
  },
  {
    "name": "Mont Buxton",
    "country_id": 197
  },
  {
    "name": "La Digue",
    "country_id": 197
  },
  {
    "name": "Saint Louis",
    "country_id": 197
  },
  {
    "name": "Baie Lazare",
    "country_id": 197
  },
  {
    "name": "Mont Fleuri",
    "country_id": 197
  },
  {
    "name": "Les Mamelles",
    "country_id": 197
  },
  {
    "name": "Grand'Anse Mahé",
    "country_id": 197
  },
  {
    "name": "Roche Caiman",
    "country_id": 197
  },
  {
    "name": "Anse Royale",
    "country_id": 197
  },
  {
    "name": "Glacis",
    "country_id": 197
  },
  {
    "name": "Grand'Anse Praslin",
    "country_id": 197
  },
  {
    "name": "Bel Ombre",
    "country_id": 197
  },
  {
    "name": "Anse-aux-Pins",
    "country_id": 197
  },
  {
    "name": "Port Glaud",
    "country_id": 197
  },
  {
    "name": "Au Cap",
    "country_id": 197
  },
  {
    "name": "Takamaka",
    "country_id": 197
  },
  {
    "name": "Pointe La Rue",
    "country_id": 197
  },
  {
    "name": "Plaisance",
    "country_id": 197
  },
  {
    "name": "Beau Vallon",
    "country_id": 197
  },
  {
    "name": "Anse Boileau",
    "country_id": 197
  },
  {
    "name": "Baie Sainte Anne",
    "country_id": 197
  },
  {
    "name": "Bel Air",
    "country_id": 197
  },
  {
    "name": "La Rivière Anglaise",
    "country_id": 197
  },
  {
    "name": "Cascade",
    "country_id": 197
  },

  {
    "name": "Shaki",
    "country_id": 16
  },
  {
    "name": "Tartar District",
    "country_id": 16
  },
  {
    "name": "Shirvan",
    "country_id": 16
  },
  {
    "name": "Qazakh District",
    "country_id": 16
  },
  {
    "name": "Sadarak District",
    "country_id": 16
  },
  {
    "name": "Yevlakh District",
    "country_id": 16
  },
  {
    "name": "Khojali District",
    "country_id": 16
  },
  {
    "name": "Kalbajar District",
    "country_id": 16
  },
  {
    "name": "Qakh District",
    "country_id": 16
  },
  {
    "name": "Fizuli District",
    "country_id": 16
  },
  {
    "name": "Astara District",
    "country_id": 16
  },
  {
    "name": "Shamakhi District",
    "country_id": 16
  },
  {
    "name": "Neftchala District",
    "country_id": 16
  },
  {
    "name": "Goychay",
    "country_id": 16
  },
  {
    "name": "Bilasuvar District",
    "country_id": 16
  },
  {
    "name": "Tovuz District",
    "country_id": 16
  },
  {
    "name": "Ordubad District",
    "country_id": 16
  },
  {
    "name": "Sharur District",
    "country_id": 16
  },
  {
    "name": "Samukh District",
    "country_id": 16
  },
  {
    "name": "Khizi District",
    "country_id": 16
  },
  {
    "name": "Yevlakh",
    "country_id": 16
  },
  {
    "name": "Ujar District",
    "country_id": 16
  },
  {
    "name": "Absheron District",
    "country_id": 16
  },
  {
    "name": "Lachin District",
    "country_id": 16
  },
  {
    "name": "Qabala District",
    "country_id": 16
  },
  {
    "name": "Agstafa District",
    "country_id": 16
  },
  {
    "name": "Imishli District",
    "country_id": 16
  },
  {
    "name": "Salyan District",
    "country_id": 16
  },
  {
    "name": "Lerik District",
    "country_id": 16
  },
  {
    "name": "Agsu District",
    "country_id": 16
  },
  {
    "name": "Qubadli District",
    "country_id": 16
  },
  {
    "name": "Kurdamir District",
    "country_id": 16
  },
  {
    "name": "Yardymli District",
    "country_id": 16
  },
  {
    "name": "Goranboy District",
    "country_id": 16
  },
  {
    "name": "Baku",
    "country_id": 16
  },
  {
    "name": "Agdash District",
    "country_id": 16
  },
  {
    "name": "Beylagan District",
    "country_id": 16
  },
  {
    "name": "Masally District",
    "country_id": 16
  },
  {
    "name": "Oghuz District",
    "country_id": 16
  },
  {
    "name": "Saatly District",
    "country_id": 16
  },
  {
    "name": "Lankaran District",
    "country_id": 16
  },
  {
    "name": "Agdam District",
    "country_id": 16
  },
  {
    "name": "Balakan District",
    "country_id": 16
  },
  {
    "name": "Dashkasan District",
    "country_id": 16
  },
  {
    "name": "Nakhchivan Autonomous Republic",
    "country_id": 16
  },
  {
    "name": "Quba District",
    "country_id": 16
  },
  {
    "name": "Ismailli District",
    "country_id": 16
  },
  {
    "name": "Sabirabad District",
    "country_id": 16
  },
  {
    "name": "Zaqatala District",
    "country_id": 16
  },
  {
    "name": "Kangarli District",
    "country_id": 16
  },
  {
    "name": "Martuni",
    "country_id": 16
  },
  {
    "name": "Barda District",
    "country_id": 16
  },
  {
    "name": "Jabrayil District",
    "country_id": 16
  },
  {
    "name": "Hajigabul District",
    "country_id": 16
  },
  {
    "name": "Julfa District",
    "country_id": 16
  },
  {
    "name": "Gobustan District",
    "country_id": 16
  },
  {
    "name": "Goygol District",
    "country_id": 16
  },
  {
    "name": "Babek District",
    "country_id": 16
  },
  {
    "name": "Zardab District",
    "country_id": 16
  },
  {
    "name": "Aghjabadi District",
    "country_id": 16
  },
  {
    "name": "Jalilabad District",
    "country_id": 16
  },
  {
    "name": "Shahbuz District",
    "country_id": 16
  },
  {
    "name": "Mingachevir",
    "country_id": 16
  },
  {
    "name": "Zangilan District",
    "country_id": 16
  },
  {
    "name": "Sumqayit",
    "country_id": 16
  },
  {
    "name": "Shamkir District",
    "country_id": 16
  },
  {
    "name": "Siazan District",
    "country_id": 16
  },
  {
    "name": "Ganja",
    "country_id": 16
  },
  {
    "name": "Shaki District",
    "country_id": 16
  },
  {
    "name": "Lankaran",
    "country_id": 16
  },
  {
    "name": "Qusar District",
    "country_id": 16
  },
  {
    "name": "Gədəbəy",
    "country_id": 16
  },
  {
    "name": "Khachmaz District",
    "country_id": 16
  },
  {
    "name": "Shabran District",
    "country_id": 16
  },
  {
    "name": "Shusha District",
    "country_id": 16
  },
  {
    "name": "Skrapar District",
    "country_id": 3
  },
  {
    "name": "Kavajë District",
    "country_id": 3
  },
  {
    "name": "Lezhë District",
    "country_id": 3
  },
  {
    "name": "Librazhd District",
    "country_id": 3
  },
  {
    "name": "Korçë District",
    "country_id": 3
  },
  {
    "name": "Elbasan County",
    "country_id": 3
  },
  {
    "name": "Lushnjë District",
    "country_id": 3
  },
  {
    "name": "Has District",
    "country_id": 3
  },
  {
    "name": "Kukës County",
    "country_id": 3
  },
  {
    "name": "Malësi e Madhe District",
    "country_id": 3
  },
  {
    "name": "Berat County",
    "country_id": 3
  },
  {
    "name": "Gjirokastër County",
    "country_id": 3
  },
  {
    "name": "Dibër District",
    "country_id": 3
  },
  {
    "name": "Pogradec District",
    "country_id": 3
  },
  {
    "name": "Bulqizë District",
    "country_id": 3
  },
  {
    "name": "Devoll District",
    "country_id": 3
  },
  {
    "name": "Lezhë County",
    "country_id": 3
  },
  {
    "name": "Dibër County",
    "country_id": 3
  },
  {
    "name": "Shkodër County",
    "country_id": 3
  },
  {
    "name": "Kuçovë District",
    "country_id": 3
  },
  {
    "name": "Vlorë District",
    "country_id": 3
  },
  {
    "name": "Krujë District",
    "country_id": 3
  },
  {
    "name": "Tirana County",
    "country_id": 3
  },
  {
    "name": "Tepelenë District",
    "country_id": 3
  },
  {
    "name": "Gramsh District",
    "country_id": 3
  },
  {
    "name": "Delvinë District",
    "country_id": 3
  },
  {
    "name": "Peqin District",
    "country_id": 3
  },
  {
    "name": "Pukë District",
    "country_id": 3
  },
  {
    "name": "Gjirokastër District",
    "country_id": 3
  },
  {
    "name": "Kurbin District",
    "country_id": 3
  },
  {
    "name": "Kukës District",
    "country_id": 3
  },
  {
    "name": "Sarandë District",
    "country_id": 3
  },
  {
    "name": "Përmet District",
    "country_id": 3
  },
  {
    "name": "Shkodër District",
    "country_id": 3
  },
  {
    "name": "Fier District",
    "country_id": 3
  },
  {
    "name": "Kolonjë District",
    "country_id": 3
  },
  {
    "name": "Berat District",
    "country_id": 3
  },
  {
    "name": "Korçë County",
    "country_id": 3
  },
  {
    "name": "Fier County",
    "country_id": 3
  },
  {
    "name": "Durrës County",
    "country_id": 3
  },
  {
    "name": "Tirana District",
    "country_id": 3
  },
  {
    "name": "Vlorë County",
    "country_id": 3
  },
  {
    "name": "Mat District",
    "country_id": 3
  },
  {
    "name": "Tropojë District",
    "country_id": 3
  },
  {
    "name": "Mallakastër District",
    "country_id": 3
  },
  {
    "name": "Mirditë District",
    "country_id": 3
  },
  {
    "name": "Durrës District",
    "country_id": 3
  },
  {
    "name": "Sveti Nikole Municipality",
    "country_id": 129
  },
  {
    "name": "Kratovo Municipality",
    "country_id": 129
  },
  {
    "name": "Zajas Municipality",
    "country_id": 129
  },
  {
    "name": "Staro Nagoričane Municipality",
    "country_id": 129
  },
  {
    "name": "Češinovo-Obleševo Municipality",
    "country_id": 129
  },
  {
    "name": "Debarca Municipality",
    "country_id": 129
  },
  {
    "name": "Probištip Municipality",
    "country_id": 129
  },
  {
    "name": "Krivogaštani Municipality",
    "country_id": 129
  },
  {
    "name": "Gevgelija Municipality",
    "country_id": 129
  },
  {
    "name": "Bogdanci Municipality",
    "country_id": 129
  },
  {
    "name": "Vraneštica Municipality",
    "country_id": 129
  },
  {
    "name": "Veles Municipality",
    "country_id": 129
  },
  {
    "name": "Bosilovo Municipality",
    "country_id": 129
  },
  {
    "name": "Mogila Municipality",
    "country_id": 129
  },
  {
    "name": "Tearce Municipality",
    "country_id": 129
  },
  {
    "name": "Demir Kapija Municipality",
    "country_id": 129
  },
  {
    "name": "Aračinovo Municipality",
    "country_id": 129
  },
  {
    "name": "Drugovo Municipality",
    "country_id": 129
  },
  {
    "name": "Vasilevo Municipality",
    "country_id": 129
  },
  {
    "name": "Lipkovo Municipality",
    "country_id": 129
  },
  {
    "name": "Brvenica Municipality",
    "country_id": 129
  },
  {
    "name": "Štip Municipality",
    "country_id": 129
  },
  {
    "name": "Vevčani Municipality",
    "country_id": 129
  },
  {
    "name": "Tetovo Municipality",
    "country_id": 129
  },
  {
    "name": "Negotino Municipality",
    "country_id": 129
  },
  {
    "name": "Konče Municipality",
    "country_id": 129
  },
  {
    "name": "Prilep Municipality",
    "country_id": 129
  },
  {
    "name": "Saraj Municipality",
    "country_id": 129
  },
  {
    "name": "Želino Municipality",
    "country_id": 129
  },
  {
    "name": "Mavrovo and Rostuša Municipality",
    "country_id": 129
  },
  {
    "name": "Plasnica Municipality",
    "country_id": 129
  },
  {
    "name": "Valandovo Municipality",
    "country_id": 129
  },
  {
    "name": "Vinica Municipality",
    "country_id": 129
  },
  {
    "name": "Zrnovci Municipality",
    "country_id": 129
  },
  {
    "name": "Karbinci",
    "country_id": 129
  },
  {
    "name": "Dolneni Municipality",
    "country_id": 129
  },
  {
    "name": "Čaška Municipality",
    "country_id": 129
  },
  {
    "name": "Kriva Palanka Municipality",
    "country_id": 129
  },
  {
    "name": "Jegunovce Municipality",
    "country_id": 129
  },
  {
    "name": "Bitola Municipality",
    "country_id": 129
  },
  {
    "name": "Šuto Orizari Municipality",
    "country_id": 129
  },
  {
    "name": "Karpoš Municipality",
    "country_id": 129
  },
  {
    "name": "Oslomej Municipality",
    "country_id": 129
  },
  {
    "name": "Kumanovo Municipality",
    "country_id": 129
  },
  {
    "name": "Greater Skopje",
    "country_id": 129
  },
  {
    "name": "Pehčevo Municipality",
    "country_id": 129
  },
  {
    "name": "Kisela Voda Municipality",
    "country_id": 129
  },
  {
    "name": "Demir Hisar Municipality",
    "country_id": 129
  },
  {
    "name": "Kičevo Municipality",
    "country_id": 129
  },
  {
    "name": "Vrapčište Municipality",
    "country_id": 129
  },
  {
    "name": "Ilinden Municipality",
    "country_id": 129
  },
  {
    "name": "Rosoman Municipality",
    "country_id": 129
  },
  {
    "name": "Makedonski Brod Municipality",
    "country_id": 129
  },
  {
    "name": "Gostivar Municipality",
    "country_id": 129
  },
  {
    "name": "Butel Municipality",
    "country_id": 129
  },
  {
    "name": "Delčevo Municipality",
    "country_id": 129
  },
  {
    "name": "Novaci Municipality",
    "country_id": 129
  },
  {
    "name": "Dojran Municipality",
    "country_id": 129
  },
  {
    "name": "Petrovec Municipality",
    "country_id": 129
  },
  {
    "name": "Ohrid Municipality",
    "country_id": 129
  },
  {
    "name": "Struga Municipality",
    "country_id": 129
  },
  {
    "name": "Makedonska Kamenica Municipality",
    "country_id": 129
  },
  {
    "name": "Centar Municipality",
    "country_id": 129
  },
  {
    "name": "Aerodrom Municipality",
    "country_id": 129
  },
  {
    "name": "Čair Municipality",
    "country_id": 129
  },
  {
    "name": "Lozovo Municipality",
    "country_id": 129
  },
  {
    "name": "Zelenikovo Municipality",
    "country_id": 129
  },
  {
    "name": "Gazi Baba Municipality",
    "country_id": 129
  },
  {
    "name": "Gradsko Municipality",
    "country_id": 129
  },
  {
    "name": "Radoviš Municipality",
    "country_id": 129
  },
  {
    "name": "Strumica Municipality",
    "country_id": 129
  },
  {
    "name": "Studeničani Municipality",
    "country_id": 129
  },
  {
    "name": "Resen Municipality",
    "country_id": 129
  },
  {
    "name": "Kavadarci Municipality",
    "country_id": 129
  },
  {
    "name": "Kruševo Municipality",
    "country_id": 129
  },
  {
    "name": "Čučer-Sandevo Municipality",
    "country_id": 129
  },
  {
    "name": "Berovo Municipality",
    "country_id": 129
  },
  {
    "name": "Rankovce Municipality",
    "country_id": 129
  },
  {
    "name": "Novo Selo Municipality",
    "country_id": 129
  },
  {
    "name": "Sopište Municipality",
    "country_id": 129
  },
  {
    "name": "Centar Župa Municipality",
    "country_id": 129
  },
  {
    "name": "Bogovinje Municipality",
    "country_id": 129
  },
  {
    "name": "Gjorče Petrov Municipality",
    "country_id": 129
  },
  {
    "name": "Kočani Municipality",
    "country_id": 129
  },
  {
    "name": "Požega-Slavonia",
    "country_id": 55
  },
  {
    "name": "Split-Dalmatia",
    "country_id": 55
  },
  {
    "name": "Međimurje",
    "country_id": 55
  },
  {
    "name": "Zadar",
    "country_id": 55
  },
  {
    "name": "Dubrovnik-Neretva",
    "country_id": 55
  },
  {
    "name": "Krapina-Zagorje",
    "country_id": 55
  },
  {
    "name": "Šibenik-Knin",
    "country_id": 55
  },
  {
    "name": "Lika-Senj",
    "country_id": 55
  },
  {
    "name": "Virovitica-Podravina",
    "country_id": 55
  },
  {
    "name": "Sisak-Moslavina",
    "country_id": 55
  },
  {
    "name": "Bjelovar-Bilogora",
    "country_id": 55
  },
  {
    "name": "Primorje-Gorski Kotar",
    "country_id": 55
  },
  {
    "name": "Zagreb",
    "country_id": 55
  },
  {
    "name": "Brod-Posavina",
    "country_id": 55
  },
  {
    "name": "Zagreb",
    "country_id": 55
  },
  {
    "name": "Varaždin",
    "country_id": 55
  },
  {
    "name": "Osijek-Baranja",
    "country_id": 55
  },
  {
    "name": "Vukovar-Syrmia",
    "country_id": 55
  },
  {
    "name": "Koprivnica-Križevci",
    "country_id": 55
  },
  {
    "name": "Istria",
    "country_id": 55
  },
  {
    "name": "Kyrenia District (Keryneia)",
    "country_id": 57
  },
  {
    "name": "Nicosia District (Lefkoşa)",
    "country_id": 57
  },
  {
    "name": "Paphos District (Pafos)",
    "country_id": 57
  },
  {
    "name": "Larnaca District (Larnaka)",
    "country_id": 57
  },
  {
    "name": "Limassol District (Leymasun)",
    "country_id": 57
  },
  {
    "name": "Famagusta District (Mağusa)",
    "country_id": 57
  },
  {
    "name": "Rangpur Division",
    "country_id": 19
  },
  {
    "name": "Cox's Bazar District",
    "country_id": 19
  },
  {
    "name": "Bandarban District",
    "country_id": 19
  },
  {
    "name": "Rajshahi Division",
    "country_id": 19
  },
  {
    "name": "Pabna District",
    "country_id": 19
  },
  {
    "name": "Sherpur District",
    "country_id": 19
  },
  {
    "name": "Bhola District",
    "country_id": 19
  },
  {
    "name": "Jessore District",
    "country_id": 19
  },
  {
    "name": "Mymensingh Division",
    "country_id": 19
  },
  {
    "name": "Rangpur District",
    "country_id": 19
  },
  {
    "name": "Dhaka Division",
    "country_id": 19
  },
  {
    "name": "Chapai Nawabganj District",
    "country_id": 19
  },
  {
    "name": "Faridpur District",
    "country_id": 19
  },
  {
    "name": "Comilla District",
    "country_id": 19
  },
  {
    "name": "Netrokona District",
    "country_id": 19
  },
  {
    "name": "Sylhet Division",
    "country_id": 19
  },
  {
    "name": "Mymensingh District",
    "country_id": 19
  },
  {
    "name": "Sylhet District",
    "country_id": 19
  },
  {
    "name": "Chandpur District",
    "country_id": 19
  },
  {
    "name": "Narail District",
    "country_id": 19
  },
  {
    "name": "Narayanganj District",
    "country_id": 19
  },
  {
    "name": "Dhaka District",
    "country_id": 19
  },
  {
    "name": "Nilphamari District",
    "country_id": 19
  },
  {
    "name": "Rajbari District",
    "country_id": 19
  },
  {
    "name": "Kushtia District",
    "country_id": 19
  },
  {
    "name": "Khulna Division",
    "country_id": 19
  },
  {
    "name": "Meherpur District",
    "country_id": 19
  },
  {
    "name": "Patuakhali District",
    "country_id": 19
  },
  {
    "name": "Jhalokati District",
    "country_id": 19
  },
  {
    "name": "Kishoreganj District",
    "country_id": 19
  },
  {
    "name": "Lalmonirhat District",
    "country_id": 19
  },
  {
    "name": "Sirajganj District",
    "country_id": 19
  },
  {
    "name": "Tangail District",
    "country_id": 19
  },
  {
    "name": "Dinajpur District",
    "country_id": 19
  },
  {
    "name": "Barguna District",
    "country_id": 19
  },
  {
    "name": "Chittagong District",
    "country_id": 19
  },
  {
    "name": "Khagrachari District",
    "country_id": 19
  },
  {
    "name": "Natore District",
    "country_id": 19
  },
  {
    "name": "Chuadanga District",
    "country_id": 19
  },
  {
    "name": "Jhenaidah District",
    "country_id": 19
  },
  {
    "name": "Munshiganj District",
    "country_id": 19
  },
  {
    "name": "Pirojpur District",
    "country_id": 19
  },
  {
    "name": "Gopalganj District",
    "country_id": 19
  },
  {
    "name": "Kurigram District",
    "country_id": 19
  },
  {
    "name": "Moulvibazar District",
    "country_id": 19
  },
  {
    "name": "Gaibandha District",
    "country_id": 19
  },
  {
    "name": "Bagerhat District",
    "country_id": 19
  },
  {
    "name": "Bogra District",
    "country_id": 19
  },
  {
    "name": "Gazipur District",
    "country_id": 19
  },
  {
    "name": "Satkhira District",
    "country_id": 19
  },
  {
    "name": "Panchagarh District",
    "country_id": 19
  },
  {
    "name": "Shariatpur District",
    "country_id": 19
  },
  {
    "name": "Bahadia",
    "country_id": 19
  },
  {
    "name": "Chittagong Division",
    "country_id": 19
  },
  {
    "name": "Thakurgaon District",
    "country_id": 19
  },
  {
    "name": "Habiganj District",
    "country_id": 19
  },
  {
    "name": "Joypurhat District",
    "country_id": 19
  },
  {
    "name": "Barisal Division",
    "country_id": 19
  },
  {
    "name": "Jamalpur District",
    "country_id": 19
  },
  {
    "name": "Rangamati Hill District",
    "country_id": 19
  },
  {
    "name": "Brahmanbaria District",
    "country_id": 19
  },
  {
    "name": "Khulna District",
    "country_id": 19
  },
  {
    "name": "Sunamganj District",
    "country_id": 19
  },
  {
    "name": "Rajshahi District",
    "country_id": 19
  },
  {
    "name": "Naogaon District",
    "country_id": 19
  },
  {
    "name": "Noakhali District",
    "country_id": 19
  },
  {
    "name": "Feni District",
    "country_id": 19
  },
  {
    "name": "Madaripur District",
    "country_id": 19
  },
  {
    "name": "Barisal District",
    "country_id": 19
  },
  {
    "name": "Lakshmipur District",
    "country_id": 19
  },
  {
    "name": "Okayama Prefecture",
    "country_id": 109
  },
  {
    "name": "Chiba Prefecture",
    "country_id": 109
  },
  {
    "name": "Ōita Prefecture",
    "country_id": 109
  },
  {
    "name": "Tokyo",
    "country_id": 109
  },
  {
    "name": "Nara Prefecture",
    "country_id": 109
  },
  {
    "name": "Shizuoka Prefecture",
    "country_id": 109
  },
  {
    "name": "Shimane Prefecture",
    "country_id": 109
  },
  {
    "name": "Aichi Prefecture",
    "country_id": 109
  },
  {
    "name": "Hiroshima Prefecture",
    "country_id": 109
  },
  {
    "name": "Akita Prefecture",
    "country_id": 109
  },
  {
    "name": "Ishikawa Prefecture",
    "country_id": 109
  },
  {
    "name": "Hyōgo Prefecture",
    "country_id": 109
  },
  {
    "name": "Hokkaidō Prefecture",
    "country_id": 109
  },
  {
    "name": "Mie Prefecture",
    "country_id": 109
  },
  {
    "name": "Kyōto Prefecture",
    "country_id": 109
  },
  {
    "name": "Yamaguchi Prefecture",
    "country_id": 109
  },
  {
    "name": "Tokushima Prefecture",
    "country_id": 109
  },
  {
    "name": "Yamagata Prefecture",
    "country_id": 109
  },
  {
    "name": "Toyama Prefecture",
    "country_id": 109
  },
  {
    "name": "Aomori Prefecture",
    "country_id": 109
  },
  {
    "name": "Kagoshima Prefecture",
    "country_id": 109
  },
  {
    "name": "Niigata Prefecture",
    "country_id": 109
  },
  {
    "name": "Kanagawa Prefecture",
    "country_id": 109
  },
  {
    "name": "Nagano Prefecture",
    "country_id": 109
  },
  {
    "name": "Wakayama Prefecture",
    "country_id": 109
  },
  {
    "name": "Shiga Prefecture",
    "country_id": 109
  },
  {
    "name": "Kumamoto Prefecture",
    "country_id": 109
  },
  {
    "name": "Fukushima Prefecture",
    "country_id": 109
  },
  {
    "name": "Fukui Prefecture",
    "country_id": 109
  },
  {
    "name": "Nagasaki Prefecture",
    "country_id": 109
  },
  {
    "name": "Tottori Prefecture",
    "country_id": 109
  },
  {
    "name": "Ibaraki Prefecture",
    "country_id": 109
  },
  {
    "name": "Yamanashi Prefecture",
    "country_id": 109
  },
  {
    "name": "Okinawa Prefecture",
    "country_id": 109
  },
  {
    "name": "Tochigi Prefecture",
    "country_id": 109
  },
  {
    "name": "Miyazaki Prefecture",
    "country_id": 109
  },
  {
    "name": "Iwate Prefecture",
    "country_id": 109
  },
  {
    "name": "Miyagi Prefecture",
    "country_id": 109
  },
  {
    "name": "Gifu Prefecture",
    "country_id": 109
  },
  {
    "name": "Ōsaka Prefecture",
    "country_id": 109
  },
  {
    "name": "Saitama Prefecture",
    "country_id": 109
  },
  {
    "name": "Fukuoka Prefecture",
    "country_id": 109
  },
  {
    "name": "Gunma Prefecture",
    "country_id": 109
  },
  {
    "name": "Saga Prefecture",
    "country_id": 109
  },
  {
    "name": "Kagawa Prefecture",
    "country_id": 109
  },
  {
    "name": "Ehime Prefecture",
    "country_id": 109
  },
  {
    "name": "Ontario",
    "country_id": 39
  },
  {
    "name": "Manitoba",
    "country_id": 39
  },
  {
    "name": "New Brunswick",
    "country_id": 39
  },
  {
    "name": "Yukon",
    "country_id": 39
  },
  {
    "name": "Saskatchewan",
    "country_id": 39
  },
  {
    "name": "Prince Edward Island",
    "country_id": 39
  },
  {
    "name": "Alberta",
    "country_id": 39
  },
  {
    "name": "Quebec",
    "country_id": 39
  },
  {
    "name": "Nova Scotia",
    "country_id": 39
  },
  {
    "name": "British Columbia",
    "country_id": 39
  },
  {
    "name": "Nunavut",
    "country_id": 39
  },
  {
    "name": "Newfoundland and Labrador",
    "country_id": 39
  },
  {
    "name": "Northwest Territories",
    "country_id": 39
  },
  {
    "name": "White Nile",
    "country_id": 209
  },
  {
    "name": "Red Sea",
    "country_id": 209
  },
  {
    "name": "Khartoum",
    "country_id": 209
  },
  {
    "name": "Sennar",
    "country_id": 209
  },
  {
    "name": "South Kordofan",
    "country_id": 209
  },
  {
    "name": "Kassala",
    "country_id": 209
  },
  {
    "name": "Al Jazirah",
    "country_id": 209
  },
  {
    "name": "Al Qadarif",
    "country_id": 209
  },
  {
    "name": "Blue Nile",
    "country_id": 209
  },
  {
    "name": "West Darfur",
    "country_id": 209
  },
  {
    "name": "West Kordofan",
    "country_id": 209
  },
  {
    "name": "North Darfur",
    "country_id": 209
  },
  {
    "name": "River Nile",
    "country_id": 209
  },
  {
    "name": "East Darfur",
    "country_id": 209
  },
  {
    "name": "North Kordofan",
    "country_id": 209
  },
  {
    "name": "South Darfur",
    "country_id": 209
  },
  {
    "name": "Northern",
    "country_id": 209
  },
  {
    "name": "Central Darfur",
    "country_id": 209
  },
  {
    "name": "Khelvachauri Municipality",
    "country_id": 81
  },
  {
    "name": "Senaki Municipality",
    "country_id": 81
  },
  {
    "name": "Tbilisi",
    "country_id": 81
  },
  {
    "name": "Adjara",
    "country_id": 81
  },
  {
    "name": "Autonomous Republic of Abkhazia",
    "country_id": 81
  },
  {
    "name": "Mtskheta-Mtianeti",
    "country_id": 81
  },
  {
    "name": "Shida Kartli",
    "country_id": 81
  },
  {
    "name": "Kvemo Kartli",
    "country_id": 81
  },
  {
    "name": "Imereti",
    "country_id": 81
  },
  {
    "name": "Samtskhe-Javakheti",
    "country_id": 81
  },
  {
    "name": "Guria",
    "country_id": 81
  },
  {
    "name": "Samegrelo-Zemo Svaneti",
    "country_id": 81
  },
  {
    "name": "Racha-Lechkhumi and Kvemo Svaneti",
    "country_id": 81
  },
  {
    "name": "Kakheti",
    "country_id": 81
  },
  {
    "name": "Northern Province",
    "country_id": 198
  },
  {
    "name": "Southern Province",
    "country_id": 198
  },
  {
    "name": "Western Area",
    "country_id": 198
  },
  {
    "name": "Eastern Province",
    "country_id": 198
  },
  {
    "name": "Hiran",
    "country_id": 203
  },
  {
    "name": "Mudug",
    "country_id": 203
  },
  {
    "name": "Bakool",
    "country_id": 203
  },
  {
    "name": "Galguduud",
    "country_id": 203
  },
  {
    "name": "Sanaag Region",
    "country_id": 203
  },
  {
    "name": "Nugal",
    "country_id": 203
  },
  {
    "name": "Lower Shebelle",
    "country_id": 203
  },
  {
    "name": "Middle Juba",
    "country_id": 203
  },
  {
    "name": "Middle Shebelle",
    "country_id": 203
  },
  {
    "name": "Lower Juba",
    "country_id": 203
  },
  {
    "name": "Awdal Region",
    "country_id": 203
  },
  {
    "name": "Bay",
    "country_id": 203
  },
  {
    "name": "Banaadir",
    "country_id": 203
  },
  {
    "name": "Gedo",
    "country_id": 203
  },
  {
    "name": "Togdheer Region",
    "country_id": 203
  },
  {
    "name": "Bari",
    "country_id": 203
  },
  {
    "name": "Northern Cape",
    "country_id": 204
  },
  {
    "name": "Free State",
    "country_id": 204
  },
  {
    "name": "Limpopo",
    "country_id": 204
  },
  {
    "name": "North West",
    "country_id": 204
  },
  {
    "name": "KwaZulu-Natal",
    "country_id": 204
  },
  {
    "name": "Gauteng",
    "country_id": 204
  },
  {
    "name": "Mpumalanga",
    "country_id": 204
  },
  {
    "name": "Eastern Cape",
    "country_id": 204
  },
  {
    "name": "Western Cape",
    "country_id": 204
  },
  {
    "name": "Chontales",
    "country_id": 159
  },
  {
    "name": "Managua",
    "country_id": 159
  },
  {
    "name": "Rivas",
    "country_id": 159
  },
  {
    "name": "Granada",
    "country_id": 159
  },
  {
    "name": "León",
    "country_id": 159
  },
  {
    "name": "Estelí",
    "country_id": 159
  },
  {
    "name": "Boaco",
    "country_id": 159
  },
  {
    "name": "Matagalpa",
    "country_id": 159
  },
  {
    "name": "Madriz",
    "country_id": 159
  },
  {
    "name": "Río San Juan",
    "country_id": 159
  },
  {
    "name": "Carazo",
    "country_id": 159
  },
  {
    "name": "North Caribbean Coast",
    "country_id": 159
  },
  {
    "name": "South Caribbean Coast",
    "country_id": 159
  },
  {
    "name": "Masaya",
    "country_id": 159
  },
  {
    "name": "Chinandega",
    "country_id": 159
  },
  {
    "name": "Jinotega",
    "country_id": 159
  },
  {
    "name": "Karak",
    "country_id": 111
  },
  {
    "name": "Tafilah",
    "country_id": 111
  },
  {
    "name": "Madaba",
    "country_id": 111
  },
  {
    "name": "Aqaba",
    "country_id": 111
  },
  {
    "name": "Irbid",
    "country_id": 111
  },
  {
    "name": "Balqa",
    "country_id": 111
  },
  {
    "name": "Mafraq",
    "country_id": 111
  },
  {
    "name": "Ajloun",
    "country_id": 111
  },
  {
    "name": "Ma'an",
    "country_id": 111
  },
  {
    "name": "Amman",
    "country_id": 111
  },
  {
    "name": "Jerash",
    "country_id": 111
  },
  {
    "name": "Zarqa",
    "country_id": 111
  },
  {
    "name": "Manzini District",
    "country_id": 212
  },
  {
    "name": "Hhohho District",
    "country_id": 212
  },
  {
    "name": "Lubombo District",
    "country_id": 212
  },
  {
    "name": "Shiselweni District",
    "country_id": 212
  },
  {
    "name": "Al Jahra",
    "country_id": 117
  },
  {
    "name": "Hawalli",
    "country_id": 117
  },
  {
    "name": "Mubarak Al-Kabeer",
    "country_id": 117
  },
  {
    "name": "Al Farwaniyah",
    "country_id": 117
  },
  {
    "name": "Capital",
    "country_id": 117
  },
  {
    "name": "Al Ahmadi",
    "country_id": 117
  },
  {
    "name": "Luang Prabang Province",
    "country_id": 119
  },
  {
    "name": "Vientiane Prefecture",
    "country_id": 119
  },
  {
    "name": "Vientiane Province",
    "country_id": 119
  },
  {
    "name": "Salavan Province",
    "country_id": 119
  },
  {
    "name": "Attapeu Province",
    "country_id": 119
  },
  {
    "name": "Xaisomboun Province",
    "country_id": 119
  },
  {
    "name": "Sekong Province",
    "country_id": 119
  },
  {
    "name": "Bolikhamsai Province",
    "country_id": 119
  },
  {
    "name": "Khammouane Province",
    "country_id": 119
  },
  {
    "name": "Phongsaly Province",
    "country_id": 119
  },
  {
    "name": "Oudomxay Province",
    "country_id": 119
  },
  {
    "name": "Houaphanh Province",
    "country_id": 119
  },
  {
    "name": "Savannakhet Province",
    "country_id": 119
  },
  {
    "name": "Bokeo Province",
    "country_id": 119
  },
  {
    "name": "Luang Namtha Province",
    "country_id": 119
  },
  {
    "name": "Sainyabuli Province",
    "country_id": 119
  },
  {
    "name": "Xaisomboun",
    "country_id": 119
  },
  {
    "name": "Xiangkhouang Province",
    "country_id": 119
  },
  {
    "name": "Champasak Province",
    "country_id": 119
  },
  {
    "name": "Talas Region",
    "country_id": 118
  },
  {
    "name": "Batken Region",
    "country_id": 118
  },
  {
    "name": "Naryn Region",
    "country_id": 118
  },
  {
    "name": "Jalal-Abad Region",
    "country_id": 118
  },
  {
    "name": "Bishkek",
    "country_id": 118
  },
  {
    "name": "Issyk-Kul Region",
    "country_id": 118
  },
  {
    "name": "Osh",
    "country_id": 118
  },
  {
    "name": "Chuy Region",
    "country_id": 118
  },
  {
    "name": "Osh Region",
    "country_id": 118
  },
  {
    "name": "Trøndelag",
    "country_id": 165
  },
  {
    "name": "Oslo",
    "country_id": 165
  },
  {
    "name": "Innlandet",
    "country_id": 165
  },
  {
    "name": "Viken",
    "country_id": 165
  },
  {
    "name": "Svalbard",
    "country_id": 165
  },
  {
    "name": "Agder",
    "country_id": 165
  },
  {
    "name": "Troms og Finnmark",
    "country_id": 165
  },
  {
    "name": "Vestland",
    "country_id": 165
  },
  {
    "name": "Møre og Romsdal",
    "country_id": 165
  },
  {
    "name": "Rogaland",
    "country_id": 165
  },
  {
    "name": "Vestfold og Telemark",
    "country_id": 165
  },
  {
    "name": "Nordland",
    "country_id": 165
  },
  {
    "name": "Jan Mayen",
    "country_id": 165
  },
  {
    "name": "Hódmezővásárhely",
    "country_id": 99
  },
  {
    "name": "Érd",
    "country_id": 99
  },
  {
    "name": "Szeged",
    "country_id": 99
  },
  {
    "name": "Nagykanizsa",
    "country_id": 99
  },
  {
    "name": "Csongrád County",
    "country_id": 99
  },
  {
    "name": "Debrecen",
    "country_id": 99
  },
  {
    "name": "Székesfehérvár",
    "country_id": 99
  },
  {
    "name": "Nyíregyháza",
    "country_id": 99
  },
  {
    "name": "Somogy County",
    "country_id": 99
  },
  {
    "name": "Békéscsaba",
    "country_id": 99
  },
  {
    "name": "Eger",
    "country_id": 99
  },
  {
    "name": "Tolna County",
    "country_id": 99
  },
  {
    "name": "Vas County",
    "country_id": 99
  },
  {
    "name": "Heves County",
    "country_id": 99
  },
  {
    "name": "Győr",
    "country_id": 99
  },
  {
    "name": "Győr-Moson-Sopron County",
    "country_id": 99
  },
  {
    "name": "Jász-Nagykun-Szolnok County",
    "country_id": 99
  },
  {
    "name": "Fejér County",
    "country_id": 99
  },
  {
    "name": "Szabolcs-Szatmár-Bereg County",
    "country_id": 99
  },
  {
    "name": "Zala County",
    "country_id": 99
  },
  {
    "name": "Szolnok",
    "country_id": 99
  },
  {
    "name": "Bács-Kiskun",
    "country_id": 99
  },
  {
    "name": "Dunaújváros",
    "country_id": 99
  },
  {
    "name": "Zalaegerszeg",
    "country_id": 99
  },
  {
    "name": "Nógrád County",
    "country_id": 99
  },
  {
    "name": "Szombathely",
    "country_id": 99
  },
  {
    "name": "Pécs",
    "country_id": 99
  },
  {
    "name": "Veszprém County",
    "country_id": 99
  },
  {
    "name": "Baranya",
    "country_id": 99
  },
  {
    "name": "Kecskemét",
    "country_id": 99
  },
  {
    "name": "Sopron",
    "country_id": 99
  },
  {
    "name": "Borsod-Abaúj-Zemplén",
    "country_id": 99
  },
  {
    "name": "Pest County",
    "country_id": 99
  },
  {
    "name": "Békés",
    "country_id": 99
  },
  {
    "name": "Szekszárd",
    "country_id": 99
  },
  {
    "name": "Veszprém",
    "country_id": 99
  },
  {
    "name": "Hajdú-Bihar County",
    "country_id": 99
  },
  {
    "name": "Budapest",
    "country_id": 99
  },
  {
    "name": "Miskolc",
    "country_id": 99
  },
  {
    "name": "Tatabánya",
    "country_id": 99
  },
  {
    "name": "Kaposvár",
    "country_id": 99
  },
  {
    "name": "Salgótarján",
    "country_id": 99
  },
  {
    "name": "Tipperary",
    "country_id": 105
  },
  {
    "name": "Sligo",
    "country_id": 105
  },
  {
    "name": "Donegal",
    "country_id": 105
  },
  {
    "name": "Dublin",
    "country_id": 105
  },
  {
    "name": "Leinster",
    "country_id": 105
  },
  {
    "name": "Cork",
    "country_id": 105
  },
  {
    "name": "Monaghan",
    "country_id": 105
  },
  {
    "name": "Longford",
    "country_id": 105
  },
  {
    "name": "Kerry",
    "country_id": 105
  },
  {
    "name": "Offaly",
    "country_id": 105
  },
  {
    "name": "Galway",
    "country_id": 105
  },
  {
    "name": "Munster",
    "country_id": 105
  },
  {
    "name": "Roscommon",
    "country_id": 105
  },
  {
    "name": "Kildare",
    "country_id": 105
  },
  {
    "name": "Louth",
    "country_id": 105
  },
  {
    "name": "Mayo",
    "country_id": 105
  },
  {
    "name": "Wicklow",
    "country_id": 105
  },
  {
    "name": "Ulster",
    "country_id": 105
  },
  {
    "name": "Connacht",
    "country_id": 105
  },
  {
    "name": "Cavan",
    "country_id": 105
  },
  {
    "name": "Waterford",
    "country_id": 105
  },
  {
    "name": "Kilkenny",
    "country_id": 105
  },
  {
    "name": "Clare",
    "country_id": 105
  },
  {
    "name": "Meath",
    "country_id": 105
  },
  {
    "name": "Wexford",
    "country_id": 105
  },
  {
    "name": "Limerick",
    "country_id": 105
  },
  {
    "name": "Carlow",
    "country_id": 105
  },
  {
    "name": "Laois",
    "country_id": 105
  },
  {
    "name": "Westmeath",
    "country_id": 105
  },
  {
    "name": "Djelfa",
    "country_id": 4
  },
  {
    "name": "El Oued",
    "country_id": 4
  },
  {
    "name": "El Tarf",
    "country_id": 4
  },
  {
    "name": "Oran",
    "country_id": 4
  },
  {
    "name": "Naama",
    "country_id": 4
  },
  {
    "name": "Annaba",
    "country_id": 4
  },
  {
    "name": "Bouïra",
    "country_id": 4
  },
  {
    "name": "Chlef",
    "country_id": 4
  },
  {
    "name": "Tiaret",
    "country_id": 4
  },
  {
    "name": "Tlemcen",
    "country_id": 4
  },
  {
    "name": "Béchar",
    "country_id": 4
  },
  {
    "name": "Médéa",
    "country_id": 4
  },
  {
    "name": "Skikda",
    "country_id": 4
  },
  {
    "name": "Blida",
    "country_id": 4
  },
  {
    "name": "Illizi",
    "country_id": 4
  },
  {
    "name": "Jijel",
    "country_id": 4
  },
  {
    "name": "Biskra",
    "country_id": 4
  },
  {
    "name": "Tipasa",
    "country_id": 4
  },
  {
    "name": "Bordj Bou Arréridj",
    "country_id": 4
  },
  {
    "name": "Tébessa",
    "country_id": 4
  },
  {
    "name": "Adrar",
    "country_id": 4
  },
  {
    "name": "Aïn Defla",
    "country_id": 4
  },
  {
    "name": "Tindouf",
    "country_id": 4
  },
  {
    "name": "Constantine",
    "country_id": 4
  },
  {
    "name": "Aïn Témouchent",
    "country_id": 4
  },
  {
    "name": "Saïda",
    "country_id": 4
  },
  {
    "name": "Mascara",
    "country_id": 4
  },
  {
    "name": "Boumerdès",
    "country_id": 4
  },
  {
    "name": "Khenchela",
    "country_id": 4
  },
  {
    "name": "Ghardaïa",
    "country_id": 4
  },
  {
    "name": "Béjaïa",
    "country_id": 4
  },
  {
    "name": "El Bayadh",
    "country_id": 4
  },
  {
    "name": "Relizane",
    "country_id": 4
  },
  {
    "name": "Tizi Ouzou",
    "country_id": 4
  },
  {
    "name": "Mila",
    "country_id": 4
  },
  {
    "name": "Tissemsilt",
    "country_id": 4
  },
  {
    "name": "M'Sila",
    "country_id": 4
  },
  {
    "name": "Tamanghasset",
    "country_id": 4
  },
  {
    "name": "Oum El Bouaghi",
    "country_id": 4
  },
  {
    "name": "Guelma",
    "country_id": 4
  },
  {
    "name": "Laghouat",
    "country_id": 4
  },
  {
    "name": "Ouargla",
    "country_id": 4
  },
  {
    "name": "Mostaganem",
    "country_id": 4
  },
  {
    "name": "Sétif",
    "country_id": 4
  },
  {
    "name": "Batna",
    "country_id": 4
  },
  {
    "name": "Souk Ahras",
    "country_id": 4
  },
  {
    "name": "Algiers",
    "country_id": 4
  },
  {
    "name": "Burgos",
    "country_id": 207
  },
  {
    "name": "Salamanca",
    "country_id": 207
  },
  {
    "name": "Palencia",
    "country_id": 207
  },
  {
    "name": "Madrid",
    "country_id": 207
  },
  {
    "name": "Asturias",
    "country_id": 207
  },
  {
    "name": "Zamora",
    "country_id": 207
  },
  {
    "name": "Pontevedra",
    "country_id": 207
  },
  {
    "name": "Cantabria",
    "country_id": 207
  },
  {
    "name": "La Rioja",
    "country_id": 207
  },
  {
    "name": "Islas Baleares",
    "country_id": 207
  },
  {
    "name": "Valencia",
    "country_id": 207
  },
  {
    "name": "Murcia",
    "country_id": 207
  },
  {
    "name": "Huesca",
    "country_id": 207
  },
  {
    "name": "Valladolid",
    "country_id": 207
  },
  {
    "name": "Las Palmas",
    "country_id": 207
  },
  {
    "name": "Ávila",
    "country_id": 207
  },
  {
    "name": "Caceres",
    "country_id": 207
  },
  {
    "name": "Gipuzkoa",
    "country_id": 207
  },
  {
    "name": "Segovia",
    "country_id": 207
  },
  {
    "name": "Sevilla",
    "country_id": 207
  },
  {
    "name": "Léon",
    "country_id": 207
  },
  {
    "name": "Tarragona",
    "country_id": 207
  },
  {
    "name": "Navarra",
    "country_id": 207
  },
  {
    "name": "Toledo",
    "country_id": 207
  },
  {
    "name": "Soria",
    "country_id": 207
  },
  {
    "name": "Guanacaste Province",
    "country_id": 53
  },
  {
    "name": "Puntarenas Province",
    "country_id": 53
  },
  {
    "name": "Provincia de Cartago",
    "country_id": 53
  },
  {
    "name": "Heredia Province",
    "country_id": 53
  },
  {
    "name": "Limón Province",
    "country_id": 53
  },
  {
    "name": "San José Province",
    "country_id": 53
  },
  {
    "name": "Alajuela Province",
    "country_id": 53
  },
  {
    "name": "Brunei-Muara District",
    "country_id": 33
  },
  {
    "name": "Belait District",
    "country_id": 33
  },
  {
    "name": "Temburong District",
    "country_id": 33
  },
  {
    "name": "Tutong District",
    "country_id": 33
  },
  {
    "name": "Saint Philip",
    "country_id": 20
  },
  {
    "name": "Saint Lucy",
    "country_id": 20
  },
  {
    "name": "Saint Peter",
    "country_id": 20
  },
  {
    "name": "Saint Joseph",
    "country_id": 20
  },
  {
    "name": "Saint James",
    "country_id": 20
  },
  {
    "name": "Saint Thomas",
    "country_id": 20
  },
  {
    "name": "Saint George",
    "country_id": 20
  },
  {
    "name": "Saint John",
    "country_id": 20
  },
  {
    "name": "Christ Church",
    "country_id": 20
  },
  {
    "name": "Saint Andrew",
    "country_id": 20
  },
  {
    "name": "Saint Michael",
    "country_id": 20
  },
  {
    "name": "Ta'izz",
    "country_id": 245
  },
  {
    "name": "Amanat Al Asimah",
    "country_id": 245
  },
  {
    "name": "Ibb",
    "country_id": 245
  },
  {
    "name": "Ma'rib",
    "country_id": 245
  },
  {
    "name": "Al Mahwit",
    "country_id": 245
  },
  {
    "name": "Sana'a",
    "country_id": 245
  },
  {
    "name": "Abyan",
    "country_id": 245
  },
  {
    "name": "Hadhramaut",
    "country_id": 245
  },
  {
    "name": "Socotra",
    "country_id": 245
  },
  {
    "name": "Al Bayda'",
    "country_id": 245
  },
  {
    "name": "Al Hudaydah",
    "country_id": 245
  },
  {
    "name": "'Adan",
    "country_id": 245
  },
  {
    "name": "Al Jawf",
    "country_id": 245
  },
  {
    "name": "Hajjah",
    "country_id": 245
  },
  {
    "name": "Lahij",
    "country_id": 245
  },
  {
    "name": "Dhamar",
    "country_id": 245
  },
  {
    "name": "Shabwah",
    "country_id": 245
  },
  {
    "name": "Raymah",
    "country_id": 245
  },
  {
    "name": "Saada",
    "country_id": 245
  },
  {
    "name": "'Amran",
    "country_id": 245
  },
  {
    "name": "Al Mahrah",
    "country_id": 245
  },
  {
    "name": "Sangha-Mbaéré",
    "country_id": 42
  },
  {
    "name": "Nana-Grébizi Economic Prefecture",
    "country_id": 42
  },
  {
    "name": "Ouham Prefecture",
    "country_id": 42
  },
  {
    "name": "Ombella-M'Poko Prefecture",
    "country_id": 42
  },
  {
    "name": "Lobaye Prefecture",
    "country_id": 42
  },
  {
    "name": "Mambéré-Kadéï",
    "country_id": 42
  },
  {
    "name": "Haut-Mbomou Prefecture",
    "country_id": 42
  },
  {
    "name": "Bamingui-Bangoran Prefecture",
    "country_id": 42
  },
  {
    "name": "Nana-Mambéré Prefecture",
    "country_id": 42
  },
  {
    "name": "Vakaga Prefecture",
    "country_id": 42
  },
  {
    "name": "Bangui",
    "country_id": 42
  },
  {
    "name": "Kémo Prefecture",
    "country_id": 42
  },
  {
    "name": "Basse-Kotto Prefecture",
    "country_id": 42
  },
  {
    "name": "Ouaka Prefecture",
    "country_id": 42
  },
  {
    "name": "Mbomou Prefecture",
    "country_id": 42
  },
  {
    "name": "Ouham-Pendé Prefecture",
    "country_id": 42
  },
  {
    "name": "Haute-Kotto Prefecture",
    "country_id": 42
  },
  {
    "name": "Romblon",
    "country_id": 174
  },
  {
    "name": "Bukidnon",
    "country_id": 174
  },
  {
    "name": "Rizal",
    "country_id": 174
  },
  {
    "name": "Bohol",
    "country_id": 174
  },
  {
    "name": "Quirino",
    "country_id": 174
  },
  {
    "name": "Biliran",
    "country_id": 174
  },
  {
    "name": "Quezon",
    "country_id": 174
  },
  {
    "name": "Siquijor",
    "country_id": 174
  },
  {
    "name": "Sarangani",
    "country_id": 174
  },
  {
    "name": "Bulacan",
    "country_id": 174
  },
  {
    "name": "Cagayan",
    "country_id": 174
  },
  {
    "name": "South Cotabato",
    "country_id": 174
  },
  {
    "name": "Sorsogon",
    "country_id": 174
  },
  {
    "name": "Sultan Kudarat",
    "country_id": 174
  },
  {
    "name": "Camarines Norte",
    "country_id": 174
  },
  {
    "name": "Southern Leyte",
    "country_id": 174
  },
  {
    "name": "Camiguin",
    "country_id": 174
  },
  {
    "name": "Surigao del Norte",
    "country_id": 174
  },
  {
    "name": "Camarines Sur",
    "country_id": 174
  },
  {
    "name": "Sulu",
    "country_id": 174
  },
  {
    "name": "Davao Oriental",
    "country_id": 174
  },
  {
    "name": "Eastern Samar",
    "country_id": 174
  },
  {
    "name": "Dinagat Islands",
    "country_id": 174
  },
  {
    "name": "Capiz",
    "country_id": 174
  },
  {
    "name": "Tawi-Tawi",
    "country_id": 174
  },
  {
    "name": "Calabarzon",
    "country_id": 174
  },
  {
    "name": "Tarlac",
    "country_id": 174
  },
  {
    "name": "Surigao del Sur",
    "country_id": 174
  },
  {
    "name": "Zambales",
    "country_id": 174
  },
  {
    "name": "Ilocos Norte",
    "country_id": 174
  },
  {
    "name": "Mimaropa",
    "country_id": 174
  },
  {
    "name": "Ifugao",
    "country_id": 174
  },
  {
    "name": "Catanduanes",
    "country_id": 174
  },
  {
    "name": "Zamboanga del Norte",
    "country_id": 174
  },
  {
    "name": "Guimaras",
    "country_id": 174
  },
  {
    "name": "Bicol",
    "country_id": 174
  },
  {
    "name": "Western Visayas",
    "country_id": 174
  },
  {
    "name": "Cebu",
    "country_id": 174
  },
  {
    "name": "Cavite",
    "country_id": 174
  },
  {
    "name": "Central Visayas",
    "country_id": 174
  },
  {
    "name": "Davao Occidental",
    "country_id": 174
  },
  {
    "name": "Soccsksargen",
    "country_id": 174
  },
  {
    "name": "Compostela Valley",
    "country_id": 174
  },
  {
    "name": "Kalinga",
    "country_id": 174
  },
  {
    "name": "Isabela",
    "country_id": 174
  },
  {
    "name": "Caraga",
    "country_id": 174
  },
  {
    "name": "Iloilo",
    "country_id": 174
  },
  {
    "name": "Autonomous Region in Muslim Mindanao",
    "country_id": 174
  },
  {
    "name": "La Union",
    "country_id": 174
  },
  {
    "name": "Davao del Sur",
    "country_id": 174
  },
  {
    "name": "Davao del Norte",
    "country_id": 174
  },
  {
    "name": "Cotabato",
    "country_id": 174
  },
  {
    "name": "Ilocos Sur",
    "country_id": 174
  },
  {
    "name": "Eastern Visayas",
    "country_id": 174
  },
  {
    "name": "Agusan del Norte",
    "country_id": 174
  },
  {
    "name": "Abra",
    "country_id": 174
  },
  {
    "name": "Zamboanga Peninsula",
    "country_id": 174
  },
  {
    "name": "Agusan del Sur",
    "country_id": 174
  },
  {
    "name": "Lanao del Norte",
    "country_id": 174
  },
  {
    "name": "Laguna",
    "country_id": 174
  },
  {
    "name": "Marinduque",
    "country_id": 174
  },
  {
    "name": "Maguindanao",
    "country_id": 174
  },
  {
    "name": "Aklan",
    "country_id": 174
  },
  {
    "name": "Leyte",
    "country_id": 174
  },
  {
    "name": "Lanao del Sur",
    "country_id": 174
  },
  {
    "name": "Apayao",
    "country_id": 174
  },
  {
    "name": "Cordillera Administrative",
    "country_id": 174
  },
  {
    "name": "Antique",
    "country_id": 174
  },
  {
    "name": "Albay",
    "country_id": 174
  },
  {
    "name": "Masbate",
    "country_id": 174
  },
  {
    "name": "Northern Mindanao",
    "country_id": 174
  },
  {
    "name": "Davao",
    "country_id": 174
  },
  {
    "name": "Aurora",
    "country_id": 174
  },
  {
    "name": "Cagayan Valley",
    "country_id": 174
  },
  {
    "name": "Misamis Occidental",
    "country_id": 174
  },
  {
    "name": "Bataan",
    "country_id": 174
  },
  {
    "name": "Central Luzon",
    "country_id": 174
  },
  {
    "name": "Basilan",
    "country_id": 174
  },
  {
    "name": "Metro Manila",
    "country_id": 174
  },
  {
    "name": "Misamis Oriental",
    "country_id": 174
  },
  {
    "name": "Northern Samar",
    "country_id": 174
  },
  {
    "name": "Negros Oriental",
    "country_id": 174
  },
  {
    "name": "Negros Occidental",
    "country_id": 174
  },
  {
    "name": "Batanes",
    "country_id": 174
  },
  {
    "name": "Mountain Province",
    "country_id": 174
  },
  {
    "name": "Oriental Mindoro",
    "country_id": 174
  },
  {
    "name": "Ilocos",
    "country_id": 174
  },
  {
    "name": "Occidental Mindoro",
    "country_id": 174
  },
  {
    "name": "Zamboanga del Sur",
    "country_id": 174
  },
  {
    "name": "Nueva Vizcaya",
    "country_id": 174
  },
  {
    "name": "Batangas",
    "country_id": 174
  },
  {
    "name": "Nueva Ecija",
    "country_id": 174
  },
  {
    "name": "Palawan",
    "country_id": 174
  },
  {
    "name": "Zamboanga Sibugay",
    "country_id": 174
  },
  {
    "name": "Benguet",
    "country_id": 174
  },
  {
    "name": "Pangasinan",
    "country_id": 174
  },
  {
    "name": "Pampanga",
    "country_id": 174
  },
  {
    "name": "Northern District",
    "country_id": 106
  },
  {
    "name": "Central District",
    "country_id": 106
  },
  {
    "name": "Southern District",
    "country_id": 106
  },
  {
    "name": "Haifa District",
    "country_id": 106
  },
  {
    "name": "Jerusalem District",
    "country_id": 106
  },
  {
    "name": "Tel Aviv District",
    "country_id": 106
  },
  {
    "name": "Limburg",
    "country_id": 22
  },
  {
    "name": "Flanders",
    "country_id": 22
  },
  {
    "name": "Flemish Brabant",
    "country_id": 22
  },
  {
    "name": "Hainaut",
    "country_id": 22
  },
  {
    "name": "Brussels-Capital Region",
    "country_id": 22
  },
  {
    "name": "East Flanders",
    "country_id": 22
  },
  {
    "name": "Namur",
    "country_id": 22
  },
  {
    "name": "Luxembourg",
    "country_id": 22
  },
  {
    "name": "Wallonia",
    "country_id": 22
  },
  {
    "name": "Antwerp",
    "country_id": 22
  },
  {
    "name": "Walloon Brabant",
    "country_id": 22
  },
  {
    "name": "West Flanders",
    "country_id": 22
  },
  {
    "name": "Liège",
    "country_id": 22
  },
  {
    "name": "Darién Province",
    "country_id": 170
  },
  {
    "name": "Colón Province",
    "country_id": 170
  },
  {
    "name": "Coclé Province",
    "country_id": 170
  },
  {
    "name": "Guna Yala",
    "country_id": 170
  },
  {
    "name": "Herrera Province",
    "country_id": 170
  },
  {
    "name": "Los Santos Province",
    "country_id": 170
  },
  {
    "name": "Ngöbe-Buglé Comarca",
    "country_id": 170
  },
  {
    "name": "Veraguas Province",
    "country_id": 170
  },
  {
    "name": "Bocas del Toro Province",
    "country_id": 170
  },
  {
    "name": "Panamá Oeste Province",
    "country_id": 170
  },
  {
    "name": "Panamá Province",
    "country_id": 170
  },
  {
    "name": "Emberá-Wounaan Comarca",
    "country_id": 170
  },
  {
    "name": "Chiriquí Province",
    "country_id": 170
  },
  {
    "name": "Howland Island",
    "country_id": 233
  },
  {
    "name": "Delaware",
    "country_id": 233
  },
  {
    "name": "Alaska",
    "country_id": 233
  },
  {
    "name": "Maryland",
    "country_id": 233
  },
  {
    "name": "Baker Island",
    "country_id": 233
  },
  {
    "name": "Kingman Reef",
    "country_id": 233
  },
  {
    "name": "New Hampshire",
    "country_id": 233
  },
  {
    "name": "Wake Island",
    "country_id": 233
  },
  {
    "name": "Kansas",
    "country_id": 233
  },
  {
    "name": "Texas",
    "country_id": 233
  },
  {
    "name": "Nebraska",
    "country_id": 233
  },
  {
    "name": "Vermont",
    "country_id": 233
  },
  {
    "name": "Jarvis Island",
    "country_id": 233
  },
  {
    "name": "Hawaii",
    "country_id": 233
  },
  {
    "name": "Guam",
    "country_id": 233
  },
  {
    "name": "United States Virgin Islands",
    "country_id": 233
  },
  {
    "name": "Utah",
    "country_id": 233
  },
  {
    "name": "Oregon",
    "country_id": 233
  },
  {
    "name": "California",
    "country_id": 233
  },
  {
    "name": "New Jersey",
    "country_id": 233
  },
  {
    "name": "North Dakota",
    "country_id": 233
  },
  {
    "name": "Kentucky",
    "country_id": 233
  },
  {
    "name": "Minnesota",
    "country_id": 233
  },
  {
    "name": "Oklahoma",
    "country_id": 233
  },
  {
    "name": "Pennsylvania",
    "country_id": 233
  },
  {
    "name": "New Mexico",
    "country_id": 233
  },
  {
    "name": "American Samoa",
    "country_id": 233
  },
  {
    "name": "Illinois",
    "country_id": 233
  },
  {
    "name": "Michigan",
    "country_id": 233
  },
  {
    "name": "Virginia",
    "country_id": 233
  },
  {
    "name": "Johnston Atoll",
    "country_id": 233
  },
  {
    "name": "West Virginia",
    "country_id": 233
  },
  {
    "name": "Mississippi",
    "country_id": 233
  },
  {
    "name": "Northern Mariana Islands",
    "country_id": 233
  },
  {
    "name": "United States Minor Outlying Islands",
    "country_id": 233
  },
  {
    "name": "Massachusetts",
    "country_id": 233
  },
  {
    "name": "Arizona",
    "country_id": 233
  },
  {
    "name": "Connecticut",
    "country_id": 233
  },
  {
    "name": "Florida",
    "country_id": 233
  },
  {
    "name": "District of Columbia",
    "country_id": 233
  },
  {
    "name": "Midway Atoll",
    "country_id": 233
  },
  {
    "name": "Navassa Island",
    "country_id": 233
  },
  {
    "name": "Indiana",
    "country_id": 233
  },
  {
    "name": "Wisconsin",
    "country_id": 233
  },
  {
    "name": "Wyoming",
    "country_id": 233
  },
  {
    "name": "South Carolina",
    "country_id": 233
  },
  {
    "name": "Arkansas",
    "country_id": 233
  },
  {
    "name": "South Dakota",
    "country_id": 233
  },
  {
    "name": "Montana",
    "country_id": 233
  },
  {
    "name": "North Carolina",
    "country_id": 233
  },
  {
    "name": "Palmyra Atoll",
    "country_id": 233
  },
  {
    "name": "Puerto Rico",
    "country_id": 233
  },
  {
    "name": "Colorado",
    "country_id": 233
  },
  {
    "name": "Missouri",
    "country_id": 233
  },
  {
    "name": "New York",
    "country_id": 233
  },
  {
    "name": "Maine",
    "country_id": 233
  },
  {
    "name": "Tennessee",
    "country_id": 233
  },
  {
    "name": "Georgia",
    "country_id": 233
  },
  {
    "name": "Alabama",
    "country_id": 233
  },
  {
    "name": "Louisiana",
    "country_id": 233
  },
  {
    "name": "Nevada",
    "country_id": 233
  },
  {
    "name": "Iowa",
    "country_id": 233
  },
  {
    "name": "Idaho",
    "country_id": 233
  },
  {
    "name": "Rhode Island",
    "country_id": 233
  },
  {
    "name": "Washington",
    "country_id": 233
  },
  {
    "name": "Shinyanga",
    "country_id": 218
  },
  {
    "name": "Simiyu",
    "country_id": 218
  },
  {
    "name": "Kagera",
    "country_id": 218
  },
  {
    "name": "Dodoma",
    "country_id": 218
  },
  {
    "name": "Kilimanjaro",
    "country_id": 218
  },
  {
    "name": "Mara",
    "country_id": 218
  },
  {
    "name": "Tabora",
    "country_id": 218
  },
  {
    "name": "Morogoro",
    "country_id": 218
  },
  {
    "name": "Zanzibar South",
    "country_id": 218
  },
  {
    "name": "Pemba South",
    "country_id": 218
  },
  {
    "name": "Zanzibar North",
    "country_id": 218
  },
  {
    "name": "Singida",
    "country_id": 218
  },
  {
    "name": "Zanzibar West",
    "country_id": 218
  },
  {
    "name": "Mtwara",
    "country_id": 218
  },
  {
    "name": "Rukwa",
    "country_id": 218
  },
  {
    "name": "Kigoma",
    "country_id": 218
  },
  {
    "name": "Mwanza",
    "country_id": 218
  },
  {
    "name": "Njombe",
    "country_id": 218
  },
  {
    "name": "Geita",
    "country_id": 218
  },
  {
    "name": "Katavi",
    "country_id": 218
  },
  {
    "name": "Lindi",
    "country_id": 218
  },
  {
    "name": "Manyara",
    "country_id": 218
  },
  {
    "name": "Pwani",
    "country_id": 218
  },
  {
    "name": "Ruvuma",
    "country_id": 218
  },
  {
    "name": "Tanga",
    "country_id": 218
  },
  {
    "name": "Pemba North",
    "country_id": 218
  },
  {
    "name": "Iringa",
    "country_id": 218
  },
  {
    "name": "Dar es Salaam",
    "country_id": 218
  },
  {
    "name": "Arusha",
    "country_id": 218
  },
  {
    "name": "Tavastia Proper",
    "country_id": 74
  },
  {
    "name": "Central Ostrobothnia",
    "country_id": 74
  },
  {
    "name": "Southern Savonia",
    "country_id": 74
  },
  {
    "name": "Kainuu",
    "country_id": 74
  },
  {
    "name": "South Karelia",
    "country_id": 74
  },
  {
    "name": "Southern Ostrobothnia",
    "country_id": 74
  },
  {
    "name": "Lapland",
    "country_id": 74
  },
  {
    "name": "Satakunta",
    "country_id": 74
  },
  {
    "name": "Päijänne Tavastia",
    "country_id": 74
  },
  {
    "name": "Northern Savonia",
    "country_id": 74
  },
  {
    "name": "North Karelia",
    "country_id": 74
  },
  {
    "name": "Northern Ostrobothnia",
    "country_id": 74
  },
  {
    "name": "Pirkanmaa",
    "country_id": 74
  },
  {
    "name": "Finland Proper",
    "country_id": 74
  },
  {
    "name": "Ostrobothnia",
    "country_id": 74
  },
  {
    "name": "Åland Islands",
    "country_id": 74
  },
  {
    "name": "Uusimaa",
    "country_id": 74
  },
  {
    "name": "Central Finland",
    "country_id": 74
  },
  {
    "name": "Kymenlaakso",
    "country_id": 74
  },
  {
    "name": "Canton of Diekirch",
    "country_id": 127
  },
  {
    "name": "Luxembourg District",
    "country_id": 127
  },
  {
    "name": "Canton of Echternach",
    "country_id": 127
  },
  {
    "name": "Canton of Redange",
    "country_id": 127
  },
  {
    "name": "Canton of Esch-sur-Alzette",
    "country_id": 127
  },
  {
    "name": "Canton of Capellen",
    "country_id": 127
  },
  {
    "name": "Canton of Remich",
    "country_id": 127
  },
  {
    "name": "Grevenmacher District",
    "country_id": 127
  },
  {
    "name": "Canton of Clervaux",
    "country_id": 127
  },
  {
    "name": "Canton of Mersch",
    "country_id": 127
  },
  {
    "name": "Canton of Vianden",
    "country_id": 127
  },
  {
    "name": "Diekirch District",
    "country_id": 127
  },
  {
    "name": "Canton of Grevenmacher",
    "country_id": 127
  },
  {
    "name": "Canton of Wiltz",
    "country_id": 127
  },
  {
    "name": "Canton of Luxembourg",
    "country_id": 127
  },
  {
    "name": "Region Zealand",
    "country_id": 59
  },
  {
    "name": "Region of Southern Denmark",
    "country_id": 59
  },
  {
    "name": "Capital Region of Denmark",
    "country_id": 59
  },
  {
    "name": "Central Denmark Region",
    "country_id": 59
  },
  {
    "name": "North Denmark Region",
    "country_id": 59
  },
  {
    "name": "Gävleborg County",
    "country_id": 213
  },
  {
    "name": "Dalarna County",
    "country_id": 213
  },
  {
    "name": "Värmland County",
    "country_id": 213
  },
  {
    "name": "Östergötland County",
    "country_id": 213
  },
  {
    "name": "Blekinge",
    "country_id": 213
  },
  {
    "name": "Norrbotten County",
    "country_id": 213
  },
  {
    "name": "Örebro County",
    "country_id": 213
  },
  {
    "name": "Södermanland County",
    "country_id": 213
  },
  {
    "name": "Skåne County",
    "country_id": 213
  },
  {
    "name": "Kronoberg County",
    "country_id": 213
  },
  {
    "name": "Västerbotten County",
    "country_id": 213
  },
  {
    "name": "Kalmar County",
    "country_id": 213
  },
  {
    "name": "Uppsala County",
    "country_id": 213
  },
  {
    "name": "Gotland County",
    "country_id": 213
  },
  {
    "name": "Västra Götaland County",
    "country_id": 213
  },
  {
    "name": "Halland County",
    "country_id": 213
  },
  {
    "name": "Västmanland County",
    "country_id": 213
  },
  {
    "name": "Jönköping County",
    "country_id": 213
  },
  {
    "name": "Stockholm County",
    "country_id": 213
  },
  {
    "name": "Västernorrland County",
    "country_id": 213
  },
  {
    "name": "Plungė District Municipality",
    "country_id": 126
  },
  {
    "name": "Šiauliai District Municipality",
    "country_id": 126
  },
  {
    "name": "Jurbarkas District Municipality",
    "country_id": 126
  },
  {
    "name": "Kaunas County",
    "country_id": 126
  },
  {
    "name": "Mažeikiai District Municipality",
    "country_id": 126
  },
  {
    "name": "Panevėžys County",
    "country_id": 126
  },
  {
    "name": "Elektrėnai municipality",
    "country_id": 126
  },
  {
    "name": "Švenčionys District Municipality",
    "country_id": 126
  },
  {
    "name": "Akmenė District Municipality",
    "country_id": 126
  },
  {
    "name": "Ignalina District Municipality",
    "country_id": 126
  },
  {
    "name": "Neringa Municipality",
    "country_id": 126
  },
  {
    "name": "Visaginas Municipality",
    "country_id": 126
  },
  {
    "name": "Kaunas District Municipality",
    "country_id": 126
  },
  {
    "name": "Biržai District Municipality",
    "country_id": 126
  },
  {
    "name": "Jonava District Municipality",
    "country_id": 126
  },
  {
    "name": "Radviliškis District Municipality",
    "country_id": 126
  },
  {
    "name": "Telšiai County",
    "country_id": 126
  },
  {
    "name": "Marijampolė County",
    "country_id": 126
  },
  {
    "name": "Kretinga District Municipality",
    "country_id": 126
  },
  {
    "name": "Tauragė District Municipality",
    "country_id": 126
  },
  {
    "name": "Tauragė County",
    "country_id": 126
  },
  {
    "name": "Alytus County",
    "country_id": 126
  },
  {
    "name": "Kazlų Rūda municipality",
    "country_id": 126
  },
  {
    "name": "Šakiai District Municipality",
    "country_id": 126
  },
  {
    "name": "Šalčininkai District Municipality",
    "country_id": 126
  },
  {
    "name": "Prienai District Municipality",
    "country_id": 126
  },
  {
    "name": "Druskininkai municipality",
    "country_id": 126
  },
  {
    "name": "Kaunas City Municipality",
    "country_id": 126
  },
  {
    "name": "Joniškis District Municipality",
    "country_id": 126
  },
  {
    "name": "Molėtai District Municipality",
    "country_id": 126
  },
  {
    "name": "Kaišiadorys District Municipality",
    "country_id": 126
  },
  {
    "name": "Kėdainiai District Municipality",
    "country_id": 126
  },
  {
    "name": "Kupiškis District Municipality",
    "country_id": 126
  },
  {
    "name": "Šiauliai County",
    "country_id": 126
  },
  {
    "name": "Raseiniai District Municipality",
    "country_id": 126
  },
  {
    "name": "Palanga City Municipality",
    "country_id": 126
  },
  {
    "name": "Panevėžys City Municipality",
    "country_id": 126
  },
  {
    "name": "Rietavas municipality",
    "country_id": 126
  },
  {
    "name": "Kalvarija municipality",
    "country_id": 126
  },
  {
    "name": "Vilnius District Municipality",
    "country_id": 126
  },
  {
    "name": "Trakai District Municipality",
    "country_id": 126
  },
  {
    "name": "Širvintos District Municipality",
    "country_id": 126
  },
  {
    "name": "Pakruojis District Municipality",
    "country_id": 126
  },
  {
    "name": "Ukmergė District Municipality",
    "country_id": 126
  },
  {
    "name": "Klaipeda City Municipality",
    "country_id": 126
  },
  {
    "name": "Utena District Municipality",
    "country_id": 126
  },
  {
    "name": "Alytus District Municipality",
    "country_id": 126
  },
  {
    "name": "Klaipėda County",
    "country_id": 126
  },
  {
    "name": "Vilnius County",
    "country_id": 126
  },
  {
    "name": "Varėna District Municipality",
    "country_id": 126
  },
  {
    "name": "Birštonas Municipality",
    "country_id": 126
  },
  {
    "name": "Klaipėda District Municipality",
    "country_id": 126
  },
  {
    "name": "Alytus City Municipality",
    "country_id": 126
  },
  {
    "name": "Vilnius City Municipality",
    "country_id": 126
  },
  {
    "name": "Šilutė District Municipality",
    "country_id": 126
  },
  {
    "name": "Telšiai District Municipality",
    "country_id": 126
  },
  {
    "name": "Šiauliai City Municipality",
    "country_id": 126
  },
  {
    "name": "Marijampolė Municipality",
    "country_id": 126
  },
  {
    "name": "Lazdijai District Municipality",
    "country_id": 126
  },
  {
    "name": "Pagėgiai municipality",
    "country_id": 126
  },
  {
    "name": "Šilalė District Municipality",
    "country_id": 126
  },
  {
    "name": "Panevėžys District Municipality",
    "country_id": 126
  },
  {
    "name": "Rokiškis District Municipality",
    "country_id": 126
  },
  {
    "name": "Pasvalys District Municipality",
    "country_id": 126
  },
  {
    "name": "Skuodas District Municipality",
    "country_id": 126
  },
  {
    "name": "Kelmė District Municipality",
    "country_id": 126
  },
  {
    "name": "Zarasai District Municipality",
    "country_id": 126
  },
  {
    "name": "Vilkaviškis District Municipality",
    "country_id": 126
  },
  {
    "name": "Utena County",
    "country_id": 126
  },
  {
    "name": "Opole Voivodeship",
    "country_id": 176
  },
  {
    "name": "Silesian Voivodeship",
    "country_id": 176
  },
  {
    "name": "Pomeranian Voivodeship",
    "country_id": 176
  },
  {
    "name": "Kuyavian-Pomeranian Voivodeship",
    "country_id": 176
  },
  {
    "name": "Podkarpackie Voivodeship",
    "country_id": 176
  },
  {
    "name": "Warmian-Masurian Voivodeship",
    "country_id": 176
  },
  {
    "name": "Lower Silesian Voivodeship",
    "country_id": 176
  },
  {
    "name": "Świętokrzyskie Voivodeship",
    "country_id": 176
  },
  {
    "name": "Lubusz Voivodeship",
    "country_id": 176
  },
  {
    "name": "Podlaskie Voivodeship",
    "country_id": 176
  },
  {
    "name": "West Pomeranian Voivodeship",
    "country_id": 176
  },
  {
    "name": "Greater Poland Voivodeship",
    "country_id": 176
  },
  {
    "name": "Lesser Poland Voivodeship",
    "country_id": 176
  },
  {
    "name": "Łódź Voivodeship",
    "country_id": 176
  },
  {
    "name": "Masovian Voivodeship",
    "country_id": 176
  },
  {
    "name": "Lublin Voivodeship",
    "country_id": 176
  },
  {
    "name": "Aargau",
    "country_id": 214
  },
  {
    "name": "Fribourg",
    "country_id": 214
  },
  {
    "name": "Basel-Land",
    "country_id": 214
  },
  {
    "name": "Uri",
    "country_id": 214
  },
  {
    "name": "Ticino",
    "country_id": 214
  },
  {
    "name": "St. Gallen",
    "country_id": 214
  },
  {
    "name": "Bern",
    "country_id": 214
  },
  {
    "name": "Zug",
    "country_id": 214
  },
  {
    "name": "Geneva",
    "country_id": 214
  },
  {
    "name": "Valais",
    "country_id": 214
  },
  {
    "name": "Appenzell Innerrhoden",
    "country_id": 214
  },
  {
    "name": "Obwalden",
    "country_id": 214
  },
  {
    "name": "Vaud",
    "country_id": 214
  },
  {
    "name": "Nidwalden",
    "country_id": 214
  },
  {
    "name": "Schwyz",
    "country_id": 214
  },
  {
    "name": "Schaffhausen",
    "country_id": 214
  },
  {
    "name": "Appenzell Ausserrhoden",
    "country_id": 214
  },
  {
    "name": "Zürich",
    "country_id": 214
  },
  {
    "name": "Thurgau",
    "country_id": 214
  },
  {
    "name": "Jura",
    "country_id": 214
  },
  {
    "name": "Neuchâtel",
    "country_id": 214
  },
  {
    "name": "Graubünden",
    "country_id": 214
  },
  {
    "name": "Glarus",
    "country_id": 214
  },
  {
    "name": "Solothurn",
    "country_id": 214
  },
  {
    "name": "Lucerne",
    "country_id": 214
  },
  {
    "name": "Tuscany",
    "country_id": 107
  },
  {
    "name": "Padua",
    "country_id": 107
  },
  {
    "name": "Parma",
    "country_id": 107
  },
  {
    "name": "Siracusa",
    "country_id": 107
  },
  {
    "name": "Palermo",
    "country_id": 107
  },
  {
    "name": "Campania",
    "country_id": 107
  },
  {
    "name": "Marche",
    "country_id": 107
  },
  {
    "name": "Ancona",
    "country_id": 107
  },
  {
    "name": "Latina",
    "country_id": 107
  },
  {
    "name": "Lecce",
    "country_id": 107
  },
  {
    "name": "Pavia",
    "country_id": 107
  },
  {
    "name": "Lecco",
    "country_id": 107
  },
  {
    "name": "Lazio",
    "country_id": 107
  },
  {
    "name": "Abruzzo",
    "country_id": 107
  },
  {
    "name": "Ascoli Piceno",
    "country_id": 107
  },
  {
    "name": "Umbria",
    "country_id": 107
  },
  {
    "name": "Pisa",
    "country_id": 107
  },
  {
    "name": "Barletta-Andria-Trani",
    "country_id": 107
  },
  {
    "name": "Pistoia",
    "country_id": 107
  },
  {
    "name": "Apulia",
    "country_id": 107
  },
  {
    "name": "Belluno",
    "country_id": 107
  },
  {
    "name": "Pordenone",
    "country_id": 107
  },
  {
    "name": "Perugia",
    "country_id": 107
  },
  {
    "name": "Avellino",
    "country_id": 107
  },
  {
    "name": "Pesaro and Urbino",
    "country_id": 107
  },
  {
    "name": "Pescara",
    "country_id": 107
  },
  {
    "name": "Molise",
    "country_id": 107
  },
  {
    "name": "Piacenza",
    "country_id": 107
  },
  {
    "name": "Potenza",
    "country_id": 107
  },
  {
    "name": "Prato",
    "country_id": 107
  },
  {
    "name": "Benevento",
    "country_id": 107
  },
  {
    "name": "Piedmont",
    "country_id": 107
  },
  {
    "name": "Calabria",
    "country_id": 107
  },
  {
    "name": "Bergamo",
    "country_id": 107
  },
  {
    "name": "Lombardy",
    "country_id": 107
  },
  {
    "name": "Basilicata",
    "country_id": 107
  },
  {
    "name": "Ravenna",
    "country_id": 107
  },
  {
    "name": "Reggio Emilia",
    "country_id": 107
  },
  {
    "name": "Sicily",
    "country_id": 107
  },
  {
    "name": "Rieti",
    "country_id": 107
  },
  {
    "name": "Rimini",
    "country_id": 107
  },
  {
    "name": "Brindisi",
    "country_id": 107
  },
  {
    "name": "Sardinia",
    "country_id": 107
  },
  {
    "name": "Aosta Valley",
    "country_id": 107
  },
  {
    "name": "Brescia",
    "country_id": 107
  },
  {
    "name": "Caltanissetta",
    "country_id": 107
  },
  {
    "name": "Rovigo",
    "country_id": 107
  },
  {
    "name": "Salerno",
    "country_id": 107
  },
  {
    "name": "Campobasso",
    "country_id": 107
  },
  {
    "name": "Sassari",
    "country_id": 107
  },
  {
    "name": "Enna",
    "country_id": 107
  },
  {
    "name": "Trentino-South Tyrol",
    "country_id": 107
  },
  {
    "name": "Verbano-Cusio-Ossola",
    "country_id": 107
  },
  {
    "name": "Agrigento",
    "country_id": 107
  },
  {
    "name": "Catanzaro",
    "country_id": 107
  },
  {
    "name": "Ragusa",
    "country_id": 107
  },
  {
    "name": "South Sardinia",
    "country_id": 107
  },
  {
    "name": "Caserta",
    "country_id": 107
  },
  {
    "name": "Savona",
    "country_id": 107
  },
  {
    "name": "Trapani",
    "country_id": 107
  },
  {
    "name": "Siena",
    "country_id": 107
  },
  {
    "name": "Viterbo",
    "country_id": 107
  },
  {
    "name": "Verona",
    "country_id": 107
  },
  {
    "name": "Vibo Valentia",
    "country_id": 107
  },
  {
    "name": "Vicenza",
    "country_id": 107
  },
  {
    "name": "Chieti",
    "country_id": 107
  },
  {
    "name": "Como",
    "country_id": 107
  },
  {
    "name": "Sondrio",
    "country_id": 107
  },
  {
    "name": "Cosenza",
    "country_id": 107
  },
  {
    "name": "Taranto",
    "country_id": 107
  },
  {
    "name": "Fermo",
    "country_id": 107
  },
  {
    "name": "Livorno",
    "country_id": 107
  },
  {
    "name": "Ferrara",
    "country_id": 107
  },
  {
    "name": "Lodi",
    "country_id": 107
  },
  {
    "name": "Lucca",
    "country_id": 107
  },
  {
    "name": "Macerata",
    "country_id": 107
  },
  {
    "name": "Cremona",
    "country_id": 107
  },
  {
    "name": "Teramo",
    "country_id": 107
  },
  {
    "name": "Veneto",
    "country_id": 107
  },
  {
    "name": "Crotone",
    "country_id": 107
  },
  {
    "name": "Terni",
    "country_id": 107
  },
  {
    "name": "Friuli–Venezia Giulia",
    "country_id": 107
  },
  {
    "name": "Modena",
    "country_id": 107
  },
  {
    "name": "Mantua",
    "country_id": 107
  },
  {
    "name": "Massa and Carrara",
    "country_id": 107
  },
  {
    "name": "Matera",
    "country_id": 107
  },
  {
    "name": "Medio Campidano",
    "country_id": 107
  },
  {
    "name": "Treviso",
    "country_id": 107
  },
  {
    "name": "Trieste",
    "country_id": 107
  },
  {
    "name": "Udine",
    "country_id": 107
  },
  {
    "name": "Varese",
    "country_id": 107
  },
  {
    "name": "Liguria",
    "country_id": 107
  },
  {
    "name": "Monza and Brianza",
    "country_id": 107
  },
  {
    "name": "Foggia",
    "country_id": 107
  },
  {
    "name": "Emilia-Romagna",
    "country_id": 107
  },
  {
    "name": "Novara",
    "country_id": 107
  },
  {
    "name": "Cuneo",
    "country_id": 107
  },
  {
    "name": "Frosinone",
    "country_id": 107
  },
  {
    "name": "Gorizia",
    "country_id": 107
  },
  {
    "name": "Biella",
    "country_id": 107
  },
  {
    "name": "Forlì-Cesena",
    "country_id": 107
  },
  {
    "name": "Asti",
    "country_id": 107
  },
  {
    "name": "L'Aquila",
    "country_id": 107
  },
  {
    "name": "Alessandria",
    "country_id": 107
  },
  {
    "name": "Vercelli",
    "country_id": 107
  },
  {
    "name": "Oristano",
    "country_id": 107
  },
  {
    "name": "Grosseto",
    "country_id": 107
  },
  {
    "name": "Imperia",
    "country_id": 107
  },
  {
    "name": "Isernia",
    "country_id": 107
  },
  {
    "name": "Nuoro",
    "country_id": 107
  },
  {
    "name": "La Spezia",
    "country_id": 107
  },
  {
    "name": "Sumatera Utara",
    "country_id": 102
  },
  {
    "name": "Bengkulu",
    "country_id": 102
  },
  {
    "name": "Kalimantan Tengah",
    "country_id": 102
  },
  {
    "name": "Sulawesi Selatan",
    "country_id": 102
  },
  {
    "name": "Sulawesi Tenggara",
    "country_id": 102
  },
  {
    "name": "Papua",
    "country_id": 102
  },
  {
    "name": "Papua Barat",
    "country_id": 102
  },
  {
    "name": "Maluku",
    "country_id": 102
  },
  {
    "name": "Maluku Utara",
    "country_id": 102
  },
  {
    "name": "Jawa Tengah",
    "country_id": 102
  },
  {
    "name": "Kalimantan Timur",
    "country_id": 102
  },
  {
    "name": "DKI Jakarta",
    "country_id": 102
  },
  {
    "name": "Kalimantan Barat",
    "country_id": 102
  },
  {
    "name": "Kepulauan Riau",
    "country_id": 102
  },
  {
    "name": "Sulawesi Utara",
    "country_id": 102
  },
  {
    "name": "Riau",
    "country_id": 102
  },
  {
    "name": "Banten",
    "country_id": 102
  },
  {
    "name": "Lampung",
    "country_id": 102
  },
  {
    "name": "Gorontalo",
    "country_id": 102
  },
  {
    "name": "Sulawesi Tengah",
    "country_id": 102
  },
  {
    "name": "Nusa Tenggara Barat",
    "country_id": 102
  },
  {
    "name": "Jambi",
    "country_id": 102
  },
  {
    "name": "Sumatera Selatan",
    "country_id": 102
  },
  {
    "name": "Sulawesi Barat",
    "country_id": 102
  },
  {
    "name": "Nusa Tenggara Timur",
    "country_id": 102
  },
  {
    "name": "Kalimantan Selatan",
    "country_id": 102
  },
  {
    "name": "Kepulauan Bangka Belitung",
    "country_id": 102
  },
  {
    "name": "Aceh",
    "country_id": 102
  },
  {
    "name": "Kalimantan Utara",
    "country_id": 102
  },
  {
    "name": "Jawa Barat",
    "country_id": 102
  },
  {
    "name": "Bali",
    "country_id": 102
  },
  {
    "name": "Jawa Timur",
    "country_id": 102
  },
  {
    "name": "Sumatera Barat",
    "country_id": 102
  },
  {
    "name": "DI Yogyakarta",
    "country_id": 102
  },
  {
    "name": "Phoenix Islands",
    "country_id": 114
  },
  {
    "name": "Gilbert Islands",
    "country_id": 114
  },
  {
    "name": "Line Islands",
    "country_id": 114
  },
  {
    "name": "Primorsky Krai",
    "country_id": 182
  },
  {
    "name": "Novgorod Oblast",
    "country_id": 182
  },
  {
    "name": "Jewish Autonomous Oblast",
    "country_id": 182
  },
  {
    "name": "Nenets Autonomous Okrug",
    "country_id": 182
  },
  {
    "name": "Rostov Oblast",
    "country_id": 182
  },
  {
    "name": "Khanty-Mansi Autonomous Okrug",
    "country_id": 182
  },
  {
    "name": "Magadan Oblast",
    "country_id": 182
  },
  {
    "name": "Krasnoyarsk Krai",
    "country_id": 182
  },
  {
    "name": "Republic of Karelia",
    "country_id": 182
  },
  {
    "name": "Republic of Buryatia",
    "country_id": 182
  },
  {
    "name": "Murmansk Oblast",
    "country_id": 182
  },
  {
    "name": "Kaluga Oblast",
    "country_id": 182
  },
  {
    "name": "Chelyabinsk Oblast",
    "country_id": 182
  },
  {
    "name": "Omsk Oblast",
    "country_id": 182
  },
  {
    "name": "Yamalo-Nenets Autonomous Okrug",
    "country_id": 182
  },
  {
    "name": "Sakha Republic",
    "country_id": 182
  },
  {
    "name": "Arkhangelsk",
    "country_id": 182
  },
  {
    "name": "Republic of Dagestan",
    "country_id": 182
  },
  {
    "name": "Yaroslavl Oblast",
    "country_id": 182
  },
  {
    "name": "Republic of Adygea",
    "country_id": 182
  },
  {
    "name": "Republic of North Ossetia-Alania",
    "country_id": 182
  },
  {
    "name": "Republic of Bashkortostan",
    "country_id": 182
  },
  {
    "name": "Kursk Oblast",
    "country_id": 182
  },
  {
    "name": "Ulyanovsk Oblast",
    "country_id": 182
  },
  {
    "name": "Nizhny Novgorod Oblast",
    "country_id": 182
  },
  {
    "name": "Amur Oblast",
    "country_id": 182
  },
  {
    "name": "Chukotka Autonomous Okrug",
    "country_id": 182
  },
  {
    "name": "Tver Oblast",
    "country_id": 182
  },
  {
    "name": "Republic of Tatarstan",
    "country_id": 182
  },
  {
    "name": "Samara Oblast",
    "country_id": 182
  },
  {
    "name": "Pskov Oblast",
    "country_id": 182
  },
  {
    "name": "Ivanovo Oblast",
    "country_id": 182
  },
  {
    "name": "Kamchatka Krai",
    "country_id": 182
  },
  {
    "name": "Astrakhan Oblast",
    "country_id": 182
  },
  {
    "name": "Bryansk Oblast",
    "country_id": 182
  },
  {
    "name": "Stavropol Krai",
    "country_id": 182
  },
  {
    "name": "Karachay-Cherkess Republic",
    "country_id": 182
  },
  {
    "name": "Mari El Republic",
    "country_id": 182
  },
  {
    "name": "Perm Krai",
    "country_id": 182
  },
  {
    "name": "Tomsk Oblast",
    "country_id": 182
  },
  {
    "name": "Khabarovsk Krai",
    "country_id": 182
  },
  {
    "name": "Vologda Oblast",
    "country_id": 182
  },
  {
    "name": "Sakhalin",
    "country_id": 182
  },
  {
    "name": "Altai Republic",
    "country_id": 182
  },
  {
    "name": "Republic of Khakassia",
    "country_id": 182
  },
  {
    "name": "Tambov Oblast",
    "country_id": 182
  },
  {
    "name": "Saint Petersburg",
    "country_id": 182
  },
  {
    "name": "Irkutsk",
    "country_id": 182
  },
  {
    "name": "Vladimir Oblast",
    "country_id": 182
  },
  {
    "name": "Moscow Oblast",
    "country_id": 182
  },
  {
    "name": "Republic of Kalmykia",
    "country_id": 182
  },
  {
    "name": "Republic of Ingushetia",
    "country_id": 182
  },
  {
    "name": "Smolensk Oblast",
    "country_id": 182
  },
  {
    "name": "Orenburg Oblast",
    "country_id": 182
  },
  {
    "name": "Saratov Oblast",
    "country_id": 182
  },
  {
    "name": "Novosibirsk",
    "country_id": 182
  },
  {
    "name": "Lipetsk Oblast",
    "country_id": 182
  },
  {
    "name": "Kirov Oblast",
    "country_id": 182
  },
  {
    "name": "Krasnodar Krai",
    "country_id": 182
  },
  {
    "name": "Kabardino-Balkar Republic",
    "country_id": 182
  },
  {
    "name": "Chechen Republic",
    "country_id": 182
  },
  {
    "name": "Sverdlovsk",
    "country_id": 182
  },
  {
    "name": "Tula Oblast",
    "country_id": 182
  },
  {
    "name": "Leningrad Oblast",
    "country_id": 182
  },
  {
    "name": "Kemerovo Oblast",
    "country_id": 182
  },
  {
    "name": "Republic of Mordovia",
    "country_id": 182
  },
  {
    "name": "Komi Republic",
    "country_id": 182
  },
  {
    "name": "Tuva Republic",
    "country_id": 182
  },
  {
    "name": "Moscow",
    "country_id": 182
  },
  {
    "name": "Kaliningrad",
    "country_id": 182
  },
  {
    "name": "Belgorod Oblast",
    "country_id": 182
  },
  {
    "name": "Zabaykalsky Krai",
    "country_id": 182
  },
  {
    "name": "Ryazan Oblast",
    "country_id": 182
  },
  {
    "name": "Voronezh Oblast",
    "country_id": 182
  },
  {
    "name": "Tyumen Oblast",
    "country_id": 182
  },
  {
    "name": "Oryol Oblast",
    "country_id": 182
  },
  {
    "name": "Penza Oblast",
    "country_id": 182
  },
  {
    "name": "Kostroma Oblast",
    "country_id": 182
  },
  {
    "name": "Altai Krai",
    "country_id": 182
  },
  {
    "name": "Sevastopol",
    "country_id": 182
  },
  {
    "name": "Udmurt Republic",
    "country_id": 182
  },
  {
    "name": "Chuvash Republic",
    "country_id": 182
  },
  {
    "name": "Kurgan Oblast",
    "country_id": 182
  },
  {
    "name": "Lomaiviti",
    "country_id": 73
  },
  {
    "name": "Ba",
    "country_id": 73
  },
  {
    "name": "Tailevu",
    "country_id": 73
  },
  {
    "name": "Nadroga-Navosa",
    "country_id": 73
  },
  {
    "name": "Rewa",
    "country_id": 73
  },
  {
    "name": "Northern Division",
    "country_id": 73
  },
  {
    "name": "Macuata",
    "country_id": 73
  },
  {
    "name": "Western Division",
    "country_id": 73
  },
  {
    "name": "Cakaudrove",
    "country_id": 73
  },
  {
    "name": "Serua",
    "country_id": 73
  },
  {
    "name": "Ra",
    "country_id": 73
  },
  {
    "name": "Naitasiri",
    "country_id": 73
  },
  {
    "name": "Namosi",
    "country_id": 73
  },
  {
    "name": "Central Division",
    "country_id": 73
  },
  {
    "name": "Bua",
    "country_id": 73
  },
  {
    "name": "Rotuma",
    "country_id": 73
  },
  {
    "name": "Eastern Division",
    "country_id": 73
  },
  {
    "name": "Lau",
    "country_id": 73
  },
  {
    "name": "Kadavu",
    "country_id": 73
  },
  {
    "name": "Labuan",
    "country_id": 132
  },
  {
    "name": "Sabah",
    "country_id": 132
  },
  {
    "name": "Sarawak",
    "country_id": 132
  },
  {
    "name": "Perlis",
    "country_id": 132
  },
  {
    "name": "Penang",
    "country_id": 132
  },
  {
    "name": "Pahang",
    "country_id": 132
  },
  {
    "name": "Malacca",
    "country_id": 132
  },
  {
    "name": "Terengganu",
    "country_id": 132
  },
  {
    "name": "Perak",
    "country_id": 132
  },
  {
    "name": "Selangor",
    "country_id": 132
  },
  {
    "name": "Putrajaya",
    "country_id": 132
  },
  {
    "name": "Kelantan",
    "country_id": 132
  },
  {
    "name": "Kedah",
    "country_id": 132
  },
  {
    "name": "Negeri Sembilan",
    "country_id": 132
  },
  {
    "name": "Kuala Lumpur",
    "country_id": 132
  },
  {
    "name": "Johor",
    "country_id": 132
  },
  {
    "name": "Mashonaland East Province",
    "country_id": 247
  },
  {
    "name": "Matabeleland South Province",
    "country_id": 247
  },
  {
    "name": "Mashonaland West Province",
    "country_id": 247
  },
  {
    "name": "Matabeleland North Province",
    "country_id": 247
  },
  {
    "name": "Mashonaland Central Province",
    "country_id": 247
  },
  {
    "name": "Bulawayo Province",
    "country_id": 247
  },
  {
    "name": "Midlands Province",
    "country_id": 247
  },
  {
    "name": "Harare Province",
    "country_id": 247
  },
  {
    "name": "Manicaland",
    "country_id": 247
  },
  {
    "name": "Masvingo Province",
    "country_id": 247
  },
  {
    "name": "Bulgan Province",
    "country_id": 146
  },
  {
    "name": "Darkhan-Uul Province",
    "country_id": 146
  },
  {
    "name": "Dornod Province",
    "country_id": 146
  },
  {
    "name": "Khovd Province",
    "country_id": 146
  },
  {
    "name": "Övörkhangai Province",
    "country_id": 146
  },
  {
    "name": "Orkhon Province",
    "country_id": 146
  },
  {
    "name": "Ömnögovi Province",
    "country_id": 146
  },
  {
    "name": "Töv Province",
    "country_id": 146
  },
  {
    "name": "Bayan-Ölgii Province",
    "country_id": 146
  },
  {
    "name": "Dundgovi Province",
    "country_id": 146
  },
  {
    "name": "Uvs Province",
    "country_id": 146
  },
  {
    "name": "Govi-Altai Province",
    "country_id": 146
  },
  {
    "name": "Arkhangai Province",
    "country_id": 146
  },
  {
    "name": "Khentii Province",
    "country_id": 146
  },
  {
    "name": "Khövsgöl Province",
    "country_id": 146
  },
  {
    "name": "Bayankhongor Province",
    "country_id": 146
  },
  {
    "name": "Sükhbaatar Province",
    "country_id": 146
  },
  {
    "name": "Govisümber Province",
    "country_id": 146
  },
  {
    "name": "Zavkhan Province",
    "country_id": 146
  },
  {
    "name": "Selenge Province",
    "country_id": 146
  },
  {
    "name": "Dornogovi Province",
    "country_id": 146
  },
  {
    "name": "Northern Province",
    "country_id": 246
  },
  {
    "name": "Western Province",
    "country_id": 246
  },
  {
    "name": "Copperbelt Province",
    "country_id": 246
  },
  {
    "name": "Northwestern Province",
    "country_id": 246
  },
  {
    "name": "Central Province",
    "country_id": 246
  },
  {
    "name": "Luapula Province",
    "country_id": 246
  },
  {
    "name": "Lusaka Province",
    "country_id": 246
  },
  {
    "name": "Muchinga Province",
    "country_id": 246
  },
  {
    "name": "Southern Province",
    "country_id": 246
  },
  {
    "name": "Eastern Province",
    "country_id": 246
  },
  {
    "name": "Capital",
    "country_id": 18
  },
  {
    "name": "Southern",
    "country_id": 18
  },
  {
    "name": "Northern",
    "country_id": 18
  },
  {
    "name": "Muharraq",
    "country_id": 18
  },
  {
    "name": "Central",
    "country_id": 18
  },
  {
    "name": "Rio de Janeiro",
    "country_id": 31
  },
  {
    "name": "Minas Gerais",
    "country_id": 31
  },
  {
    "name": "Amapá",
    "country_id": 31
  },
  {
    "name": "Goiás",
    "country_id": 31
  },
  {
    "name": "Rio Grande do Sul",
    "country_id": 31
  },
  {
    "name": "Bahia",
    "country_id": 31
  },
  {
    "name": "Sergipe",
    "country_id": 31
  },
  {
    "name": "Amazonas",
    "country_id": 31
  },
  {
    "name": "Paraíba",
    "country_id": 31
  },
  {
    "name": "Pernambuco",
    "country_id": 31
  },
  {
    "name": "Alagoas",
    "country_id": 31
  },
  {
    "name": "Piauí",
    "country_id": 31
  },
  {
    "name": "Pará",
    "country_id": 31
  },
  {
    "name": "Mato Grosso do Sul",
    "country_id": 31
  },
  {
    "name": "Mato Grosso",
    "country_id": 31
  },
  {
    "name": "Acre",
    "country_id": 31
  },
  {
    "name": "Rondônia",
    "country_id": 31
  },
  {
    "name": "Santa Catarina",
    "country_id": 31
  },
  {
    "name": "Maranhão",
    "country_id": 31
  },
  {
    "name": "Ceará",
    "country_id": 31
  },
  {
    "name": "Distrito Federal",
    "country_id": 31
  },
  {
    "name": "Espírito Santo",
    "country_id": 31
  },
  {
    "name": "Rio Grande do Norte",
    "country_id": 31
  },
  {
    "name": "Tocantins",
    "country_id": 31
  },
  {
    "name": "São Paulo",
    "country_id": 31
  },
  {
    "name": "Paraná",
    "country_id": 31
  },
  {
    "name": "Aragatsotn Region",
    "country_id": 12
  },
  {
    "name": "Ararat Province",
    "country_id": 12
  },
  {
    "name": "Vayots Dzor Region",
    "country_id": 12
  },
  {
    "name": "Armavir Region",
    "country_id": 12
  },
  {
    "name": "Syunik Province",
    "country_id": 12
  },
  {
    "name": "Gegharkunik Province",
    "country_id": 12
  },
  {
    "name": "Lori Region",
    "country_id": 12
  },
  {
    "name": "Yerevan",
    "country_id": 12
  },
  {
    "name": "Shirak Region",
    "country_id": 12
  },
  {
    "name": "Tavush Region",
    "country_id": 12
  },
  {
    "name": "Kotayk Region",
    "country_id": 12
  },
  {
    "name": "Cojedes",
    "country_id": 239
  },
  {
    "name": "Falcón",
    "country_id": 239
  },
  {
    "name": "Portuguesa",
    "country_id": 239
  },
  {
    "name": "Miranda",
    "country_id": 239
  },
  {
    "name": "Lara",
    "country_id": 239
  },
  {
    "name": "Bolívar",
    "country_id": 239
  },
  {
    "name": "Carabobo",
    "country_id": 239
  },
  {
    "name": "Yaracuy",
    "country_id": 239
  },
  {
    "name": "Zulia",
    "country_id": 239
  },
  {
    "name": "Trujillo",
    "country_id": 239
  },
  {
    "name": "Amazonas",
    "country_id": 239
  },
  {
    "name": "Guárico",
    "country_id": 239
  },
  {
    "name": "Federal Dependencies of Venezuela",
    "country_id": 239
  },
  {
    "name": "Aragua",
    "country_id": 239
  },
  {
    "name": "Táchira",
    "country_id": 239
  },
  {
    "name": "Barinas",
    "country_id": 239
  },
  {
    "name": "Anzoátegui",
    "country_id": 239
  },
  {
    "name": "Delta Amacuro",
    "country_id": 239
  },
  {
    "name": "Nueva Esparta",
    "country_id": 239
  },
  {
    "name": "Mérida",
    "country_id": 239
  },
  {
    "name": "Monagas",
    "country_id": 239
  },
  {
    "name": "La Guaira",
    "country_id": 239
  },
  {
    "name": "Sucre",
    "country_id": 239
  },
  {
    "name": "Carinthia",
    "country_id": 15
  },
  {
    "name": "Upper Austria",
    "country_id": 15
  },
  {
    "name": "Styria",
    "country_id": 15
  },
  {
    "name": "Vienna",
    "country_id": 15
  },
  {
    "name": "Salzburg",
    "country_id": 15
  },
  {
    "name": "Burgenland",
    "country_id": 15
  },
  {
    "name": "Vorarlberg",
    "country_id": 15
  },
  {
    "name": "Tyrol",
    "country_id": 15
  },
  {
    "name": "Lower Austria",
    "country_id": 15
  },
  {
    "name": "Mid-Western Region",
    "country_id": 154
  },
  {
    "name": "Western Region",
    "country_id": 154
  },
  {
    "name": "Far-Western Development Region",
    "country_id": 154
  },
  {
    "name": "Eastern Development Region",
    "country_id": 154
  },
  {
    "name": "Mechi Zone",
    "country_id": 154
  },
  {
    "name": "Bheri Zone",
    "country_id": 154
  },
  {
    "name": "Kosi Zone",
    "country_id": 154
  },
  {
    "name": "Central Region",
    "country_id": 154
  },
  {
    "name": "Lumbini Zone",
    "country_id": 154
  },
  {
    "name": "Narayani Zone",
    "country_id": 154
  },
  {
    "name": "Janakpur Zone",
    "country_id": 154
  },
  {
    "name": "Rapti Zone",
    "country_id": 154
  },
  {
    "name": "Seti Zone",
    "country_id": 154
  },
  {
    "name": "Karnali Zone",
    "country_id": 154
  },
  {
    "name": "Dhaulagiri Zone",
    "country_id": 154
  },
  {
    "name": "Gandaki Zone",
    "country_id": 154
  },
  {
    "name": "Bagmati Zone",
    "country_id": 154
  },
  {
    "name": "Mahakali Zone",
    "country_id": 154
  },
  {
    "name": "Sagarmatha Zone",
    "country_id": 154
  },
  {
    "name": "Unity",
    "country_id": 206
  },
  {
    "name": "Upper Nile",
    "country_id": 206
  },
  {
    "name": "Warrap",
    "country_id": 206
  },
  {
    "name": "Northern Bahr el Ghazal",
    "country_id": 206
  },
  {
    "name": "Western Equatoria",
    "country_id": 206
  },
  {
    "name": "Lakes",
    "country_id": 206
  },
  {
    "name": "Western Bahr el Ghazal",
    "country_id": 206
  },
  {
    "name": "Central Equatoria",
    "country_id": 206
  },
  {
    "name": "Eastern Equatoria",
    "country_id": 206
  },
  {
    "name": "Jonglei State",
    "country_id": 206
  },
  {
    "name": "Karditsa Regional Unit",
    "country_id": 85
  },
  {
    "name": "West Greece Region",
    "country_id": 85
  },
  {
    "name": "Thessaloniki Regional Unit",
    "country_id": 85
  },
  {
    "name": "Arcadia Prefecture",
    "country_id": 85
  },
  {
    "name": "Imathia Regional Unit",
    "country_id": 85
  },
  {
    "name": "Kastoria Regional Unit",
    "country_id": 85
  },
  {
    "name": "Euboea",
    "country_id": 85
  },
  {
    "name": "Grevena Prefecture",
    "country_id": 85
  },
  {
    "name": "Preveza Prefecture",
    "country_id": 85
  },
  {
    "name": "Lefkada Regional Unit",
    "country_id": 85
  },
  {
    "name": "Argolis Regional Unit",
    "country_id": 85
  },
  {
    "name": "Laconia",
    "country_id": 85
  },
  {
    "name": "Pella Regional Unit",
    "country_id": 85
  },
  {
    "name": "West Macedonia Region",
    "country_id": 85
  },
  {
    "name": "Crete Region",
    "country_id": 85
  },
  {
    "name": "Epirus Region",
    "country_id": 85
  },
  {
    "name": "Kilkis Regional Unit",
    "country_id": 85
  },
  {
    "name": "Kozani Prefecture",
    "country_id": 85
  },
  {
    "name": "Ioannina Regional Unit",
    "country_id": 85
  },
  {
    "name": "Phthiotis Prefecture",
    "country_id": 85
  },
  {
    "name": "Chania Regional Unit",
    "country_id": 85
  },
  {
    "name": "Achaea Regional Unit",
    "country_id": 85
  },
  {
    "name": "East Macedonia and Thrace",
    "country_id": 85
  },
  {
    "name": "South Aegean",
    "country_id": 85
  },
  {
    "name": "Peloponnese Region",
    "country_id": 85
  },
  {
    "name": "East Attica Regional Unit",
    "country_id": 85
  },
  {
    "name": "Serres Prefecture",
    "country_id": 85
  },
  {
    "name": "Attica Region",
    "country_id": 85
  },
  {
    "name": "Aetolia-Acarnania Regional Unit",
    "country_id": 85
  },
  {
    "name": "Corfu Prefecture",
    "country_id": 85
  },
  {
    "name": "Central Macedonia",
    "country_id": 85
  },
  {
    "name": "Boeotia Regional Unit",
    "country_id": 85
  },
  {
    "name": "Kefalonia Prefecture",
    "country_id": 85
  },
  {
    "name": "Central Greece Region",
    "country_id": 85
  },
  {
    "name": "Corinthia Regional Unit",
    "country_id": 85
  },
  {
    "name": "Drama Regional Unit",
    "country_id": 85
  },
  {
    "name": "Ionian Islands Region",
    "country_id": 85
  },
  {
    "name": "Larissa Prefecture",
    "country_id": 85
  },
  {
    "name": "Kayin State",
    "country_id": 151
  },
  {
    "name": "Mandalay Region",
    "country_id": 151
  },
  {
    "name": "Yangon Region",
    "country_id": 151
  },
  {
    "name": "Magway Region",
    "country_id": 151
  },
  {
    "name": "Chin State",
    "country_id": 151
  },
  {
    "name": "Rakhine State",
    "country_id": 151
  },
  {
    "name": "Shan State",
    "country_id": 151
  },
  {
    "name": "Tanintharyi Region",
    "country_id": 151
  },
  {
    "name": "Bago",
    "country_id": 151
  },
  {
    "name": "Ayeyarwady Region",
    "country_id": 151
  },
  {
    "name": "Kachin State",
    "country_id": 151
  },
  {
    "name": "Kayah State",
    "country_id": 151
  },
  {
    "name": "Sagaing Region",
    "country_id": 151
  },
  {
    "name": "Naypyidaw Union Territory",
    "country_id": 151
  },
  {
    "name": "Mon State",
    "country_id": 151
  },
  {
    "name": "Bartın",
    "country_id": 225
  },
  {
    "name": "Kütahya",
    "country_id": 225
  },
  {
    "name": "Sakarya",
    "country_id": 225
  },
  {
    "name": "Edirne",
    "country_id": 225
  },
  {
    "name": "Van",
    "country_id": 225
  },
  {
    "name": "Bingöl",
    "country_id": 225
  },
  {
    "name": "Kilis",
    "country_id": 225
  },
  {
    "name": "Adıyaman",
    "country_id": 225
  },
  {
    "name": "Mersin",
    "country_id": 225
  },
  {
    "name": "Denizli",
    "country_id": 225
  },
  {
    "name": "Malatya",
    "country_id": 225
  },
  {
    "name": "Elazığ",
    "country_id": 225
  },
  {
    "name": "Erzincan",
    "country_id": 225
  },
  {
    "name": "Amasya",
    "country_id": 225
  },
  {
    "name": "Muş",
    "country_id": 225
  },
  {
    "name": "Bursa",
    "country_id": 225
  },
  {
    "name": "Eskişehir",
    "country_id": 225
  },
  {
    "name": "Erzurum",
    "country_id": 225
  },
  {
    "name": "Iğdır",
    "country_id": 225
  },
  {
    "name": "Tekirdağ",
    "country_id": 225
  },
  {
    "name": "Çankırı",
    "country_id": 225
  },
  {
    "name": "Antalya",
    "country_id": 225
  },
  {
    "name": "İstanbul",
    "country_id": 225
  },
  {
    "name": "Konya",
    "country_id": 225
  },
  {
    "name": "Bolu",
    "country_id": 225
  },
  {
    "name": "Çorum",
    "country_id": 225
  },
  {
    "name": "Ordu",
    "country_id": 225
  },
  {
    "name": "Balıkesir",
    "country_id": 225
  },
  {
    "name": "Kırklareli",
    "country_id": 225
  },
  {
    "name": "Bayburt",
    "country_id": 225
  },
  {
    "name": "Kırıkkale",
    "country_id": 225
  },
  {
    "name": "Afyonkarahisar",
    "country_id": 225
  },
  {
    "name": "Kırşehir",
    "country_id": 225
  },
  {
    "name": "Sivas",
    "country_id": 225
  },
  {
    "name": "Muğla",
    "country_id": 225
  },
  {
    "name": "Şanlıurfa",
    "country_id": 225
  },
  {
    "name": "Karaman",
    "country_id": 225
  },
  {
    "name": "Ardahan",
    "country_id": 225
  },
  {
    "name": "Giresun",
    "country_id": 225
  },
  {
    "name": "Aydın",
    "country_id": 225
  },
  {
    "name": "Yozgat",
    "country_id": 225
  },
  {
    "name": "Niğde",
    "country_id": 225
  },
  {
    "name": "Hakkâri",
    "country_id": 225
  },
  {
    "name": "Artvin",
    "country_id": 225
  },
  {
    "name": "Tunceli",
    "country_id": 225
  },
  {
    "name": "Ağrı",
    "country_id": 225
  },
  {
    "name": "Batman",
    "country_id": 225
  },
  {
    "name": "Kocaeli",
    "country_id": 225
  },
  {
    "name": "Nevşehir",
    "country_id": 225
  },
  {
    "name": "Kastamonu",
    "country_id": 225
  },
  {
    "name": "Manisa",
    "country_id": 225
  },
  {
    "name": "Tokat",
    "country_id": 225
  },
  {
    "name": "Kayseri",
    "country_id": 225
  },
  {
    "name": "Uşak",
    "country_id": 225
  },
  {
    "name": "Düzce",
    "country_id": 225
  },
  {
    "name": "Gaziantep",
    "country_id": 225
  },
  {
    "name": "Gümüşhane",
    "country_id": 225
  },
  {
    "name": "İzmir",
    "country_id": 225
  },
  {
    "name": "Trabzon",
    "country_id": 225
  },
  {
    "name": "Siirt",
    "country_id": 225
  },
  {
    "name": "Kars",
    "country_id": 225
  },
  {
    "name": "Burdur",
    "country_id": 225
  },
  {
    "name": "Aksaray",
    "country_id": 225
  },
  {
    "name": "Hatay",
    "country_id": 225
  },
  {
    "name": "Adana",
    "country_id": 225
  },
  {
    "name": "Zonguldak",
    "country_id": 225
  },
  {
    "name": "Osmaniye",
    "country_id": 225
  },
  {
    "name": "Bitlis",
    "country_id": 225
  },
  {
    "name": "Çanakkale",
    "country_id": 225
  },
  {
    "name": "Ankara",
    "country_id": 225
  },
  {
    "name": "Yalova",
    "country_id": 225
  },
  {
    "name": "Rize",
    "country_id": 225
  },
  {
    "name": "Samsun",
    "country_id": 225
  },
  {
    "name": "Bilecik",
    "country_id": 225
  },
  {
    "name": "Isparta",
    "country_id": 225
  },
  {
    "name": "Karabük",
    "country_id": 225
  },
  {
    "name": "Mardin",
    "country_id": 225
  },
  {
    "name": "Şırnak",
    "country_id": 225
  },
  {
    "name": "Diyarbakır",
    "country_id": 225
  },
  {
    "name": "Kahramanmaraş",
    "country_id": 225
  },
  {
    "name": "Lisbon",
    "country_id": 177
  },
  {
    "name": "Bragança",
    "country_id": 177
  },
  {
    "name": "Beja",
    "country_id": 177
  },
  {
    "name": "Madeira",
    "country_id": 177
  },
  {
    "name": "Portalegre",
    "country_id": 177
  },
  {
    "name": "Açores",
    "country_id": 177
  },
  {
    "name": "Vila Real",
    "country_id": 177
  },
  {
    "name": "Aveiro",
    "country_id": 177
  },
  {
    "name": "Évora",
    "country_id": 177
  },
  {
    "name": "Viseu",
    "country_id": 177
  },
  {
    "name": "Santarém",
    "country_id": 177
  },
  {
    "name": "Faro",
    "country_id": 177
  },
  {
    "name": "Leiria",
    "country_id": 177
  },
  {
    "name": "Castelo Branco",
    "country_id": 177
  },
  {
    "name": "Setúbal",
    "country_id": 177
  },
  {
    "name": "Porto",
    "country_id": 177
  },
  {
    "name": "Braga",
    "country_id": 177
  },
  {
    "name": "Viana do Castelo",
    "country_id": 177
  },
  {
    "name": "Coimbra",
    "country_id": 177
  },
  {
    "name": "Zhejiang",
    "country_id": 45
  },
  {
    "name": "Fujian",
    "country_id": 45
  },
  {
    "name": "Shanghai",
    "country_id": 45
  },
  {
    "name": "Jiangsu",
    "country_id": 45
  },
  {
    "name": "Anhui",
    "country_id": 45
  },
  {
    "name": "Shandong",
    "country_id": 45
  },
  {
    "name": "Jilin",
    "country_id": 45
  },
  {
    "name": "Shanxi",
    "country_id": 45
  },
  {
    "name": "Taiwan",
    "country_id": 45
  },
  {
    "name": "Jiangxi",
    "country_id": 45
  },
  {
    "name": "Beijing",
    "country_id": 45
  },
  {
    "name": "Hunan",
    "country_id": 45
  },
  {
    "name": "Henan",
    "country_id": 45
  },
  {
    "name": "Yunnan",
    "country_id": 45
  },
  {
    "name": "Guizhou",
    "country_id": 45
  },
  {
    "name": "Ningxia Huizu",
    "country_id": 45
  },
  {
    "name": "Xinjiang",
    "country_id": 45
  },
  {
    "name": "Xizang",
    "country_id": 45
  },
  {
    "name": "Heilongjiang",
    "country_id": 45
  },
  {
    "name": "Macau SAR",
    "country_id": 45
  },
  {
    "name": "Hong Kong SAR",
    "country_id": 45
  },
  {
    "name": "Liaoning",
    "country_id": 45
  },
  {
    "name": "Inner Mongolia",
    "country_id": 45
  },
  {
    "name": "Qinghai",
    "country_id": 45
  },
  {
    "name": "Chongqing",
    "country_id": 45
  },
  {
    "name": "Shaanxi",
    "country_id": 45
  },
  {
    "name": "Hainan",
    "country_id": 45
  },
  {
    "name": "Hubei",
    "country_id": 45
  },
  {
    "name": "Gansu",
    "country_id": 45
  },
  {
    "name": "Tianjin",
    "country_id": 45
  },
  {
    "name": "Sichuan",
    "country_id": 45
  },
  {
    "name": "Guangxi Zhuang",
    "country_id": 45
  },
  {
    "name": "Guangdong",
    "country_id": 45
  },
  {
    "name": "Hebei",
    "country_id": 45
  },
  {
    "name": "South",
    "country_id": 121
  },
  {
    "name": "Mount Lebanon",
    "country_id": 121
  },
  {
    "name": "Baalbek-Hermel",
    "country_id": 121
  },
  {
    "name": "North",
    "country_id": 121
  },
  {
    "name": "Akkar",
    "country_id": 121
  },
  {
    "name": "Beirut",
    "country_id": 121
  },
  {
    "name": "Beqaa",
    "country_id": 121
  },
  {
    "name": "Nabatieh",
    "country_id": 121
  },
  {
    "name": "Isle of Wight",
    "country_id": 232
  },
  {
    "name": "St Helens",
    "country_id": 232
  },
  {
    "name": "London Borough of Brent",
    "country_id": 232
  },
  {
    "name": "Walsall",
    "country_id": 232
  },
  {
    "name": "Trafford",
    "country_id": 232
  },
  {
    "name": "City of Southampton",
    "country_id": 232
  },
  {
    "name": "Sheffield",
    "country_id": 232
  },
  {
    "name": "West Sussex",
    "country_id": 232
  },
  {
    "name": "City of Peterborough",
    "country_id": 232
  },
  {
    "name": "Caerphilly County Borough",
    "country_id": 232
  },
  {
    "name": "Vale of Glamorgan",
    "country_id": 232
  },
  {
    "name": "Shetland Islands",
    "country_id": 232
  },
  {
    "name": "Rhondda Cynon Taf",
    "country_id": 232
  },
  {
    "name": "Poole",
    "country_id": 232
  },
  {
    "name": "Central Bedfordshire",
    "country_id": 232
  },
  {
    "name": "Down District Council",
    "country_id": 232
  },
  {
    "name": "City of Portsmouth",
    "country_id": 232
  },
  {
    "name": "London Borough of Haringey",
    "country_id": 232
  },
  {
    "name": "London Borough of Bexley",
    "country_id": 232
  },
  {
    "name": "Rotherham",
    "country_id": 232
  },
  {
    "name": "Hartlepool",
    "country_id": 232
  },
  {
    "name": "Telford and Wrekin",
    "country_id": 232
  },
  {
    "name": "Belfast district",
    "country_id": 232
  },
  {
    "name": "Cornwall",
    "country_id": 232
  },
  {
    "name": "London Borough of Sutton",
    "country_id": 232
  },
  {
    "name": "Omagh District Council",
    "country_id": 232
  },
  {
    "name": "Banbridge",
    "country_id": 232
  },
  {
    "name": "Causeway Coast and Glens",
    "country_id": 232
  },
  {
    "name": "Newtownabbey Borough Council",
    "country_id": 232
  },
  {
    "name": "City of Leicester",
    "country_id": 232
  },
  {
    "name": "London Borough of Islington",
    "country_id": 232
  },
  {
    "name": "Metropolitan Borough of Wigan",
    "country_id": 232
  },
  {
    "name": "Oxfordshire",
    "country_id": 232
  },
  {
    "name": "Magherafelt District Council",
    "country_id": 232
  },
  {
    "name": "Southend-on-Sea",
    "country_id": 232
  },
  {
    "name": "Armagh, Banbridge and Craigavon",
    "country_id": 232
  },
  {
    "name": "Perth and Kinross",
    "country_id": 232
  },
  {
    "name": "London Borough of Waltham Forest",
    "country_id": 232
  },
  {
    "name": "Rochdale",
    "country_id": 232
  },
  {
    "name": "Merthyr Tydfil County Borough",
    "country_id": 232
  },
  {
    "name": "Blackburn with Darwen",
    "country_id": 232
  },
  {
    "name": "Knowsley",
    "country_id": 232
  },
  {
    "name": "Armagh City and District Council",
    "country_id": 232
  },
  {
    "name": "Middlesbrough",
    "country_id": 232
  },
  {
    "name": "East Renfrewshire",
    "country_id": 232
  },
  {
    "name": "Cumbria",
    "country_id": 232
  },
  {
    "name": "Scotland",
    "country_id": 232
  },
  {
    "name": "England",
    "country_id": 232
  },
  {
    "name": "Northern Ireland",
    "country_id": 232
  },
  {
    "name": "Wales",
    "country_id": 232
  },
  {
    "name": "Bath and North East Somerset",
    "country_id": 232
  },
  {
    "name": "Liverpool",
    "country_id": 232
  },
  {
    "name": "Sandwell",
    "country_id": 232
  },
  {
    "name": "Bournemouth",
    "country_id": 232
  },
  {
    "name": "Isles of Scilly",
    "country_id": 232
  },
  {
    "name": "Falkirk",
    "country_id": 232
  },
  {
    "name": "Dorset",
    "country_id": 232
  },
  {
    "name": "Scottish Borders",
    "country_id": 232
  },
  {
    "name": "London Borough of Havering",
    "country_id": 232
  },
  {
    "name": "Moyle District Council",
    "country_id": 232
  },
  {
    "name": "London Borough of Camden",
    "country_id": 232
  },
  {
    "name": "Newry and Mourne District Council",
    "country_id": 232
  },
  {
    "name": "Neath Port Talbot County Borough",
    "country_id": 232
  },
  {
    "name": "Conwy County Borough",
    "country_id": 232
  },
  {
    "name": "Outer Hebrides",
    "country_id": 232
  },
  {
    "name": "West Lothian",
    "country_id": 232
  },
  {
    "name": "Lincolnshire",
    "country_id": 232
  },
  {
    "name": "London Borough of Barking and Dagenham",
    "country_id": 232
  },
  {
    "name": "City of Westminster",
    "country_id": 232
  },
  {
    "name": "London Borough of Lewisham",
    "country_id": 232
  },
  {
    "name": "City of Nottingham",
    "country_id": 232
  },
  {
    "name": "Moray",
    "country_id": 232
  },
  {
    "name": "Ballymoney",
    "country_id": 232
  },
  {
    "name": "South Lanarkshire",
    "country_id": 232
  },
  {
    "name": "Ballymena Borough",
    "country_id": 232
  },
  {
    "name": "Doncaster",
    "country_id": 232
  },
  {
    "name": "Northumberland",
    "country_id": 232
  },
  {
    "name": "Fermanagh and Omagh",
    "country_id": 232
  },
  {
    "name": "Tameside",
    "country_id": 232
  },
  {
    "name": "Royal Borough of Kensington and Chelsea",
    "country_id": 232
  },
  {
    "name": "Hertfordshire",
    "country_id": 232
  },
  {
    "name": "East Riding of Yorkshire",
    "country_id": 232
  },
  {
    "name": "Kirklees",
    "country_id": 232
  },
  {
    "name": "City of Sunderland",
    "country_id": 232
  },
  {
    "name": "Gloucestershire",
    "country_id": 232
  },
  {
    "name": "East Ayrshire",
    "country_id": 232
  },
  {
    "name": "United Kingdom",
    "country_id": 232
  },
  {
    "name": "London Borough of Hillingdon",
    "country_id": 232
  },
  {
    "name": "South Ayrshire",
    "country_id": 232
  },
  {
    "name": "Ascension Island",
    "country_id": 232
  },
  {
    "name": "Gwynedd",
    "country_id": 232
  },
  {
    "name": "London Borough of Hounslow",
    "country_id": 232
  },
  {
    "name": "Medway",
    "country_id": 232
  },
  {
    "name": "Limavady Borough Council",
    "country_id": 232
  },
  {
    "name": "Highland",
    "country_id": 232
  },
  {
    "name": "North East Lincolnshire",
    "country_id": 232
  },
  {
    "name": "London Borough of Harrow",
    "country_id": 232
  },
  {
    "name": "Somerset",
    "country_id": 232
  },
  {
    "name": "Angus",
    "country_id": 232
  },
  {
    "name": "Inverclyde",
    "country_id": 232
  },
  {
    "name": "Darlington",
    "country_id": 232
  },
  {
    "name": "London Borough of Tower Hamlets",
    "country_id": 232
  },
  {
    "name": "Wiltshire",
    "country_id": 232
  },
  {
    "name": "Argyll and Bute",
    "country_id": 232
  },
  {
    "name": "Strabane District Council",
    "country_id": 232
  },
  {
    "name": "Stockport",
    "country_id": 232
  },
  {
    "name": "Brighton and Hove",
    "country_id": 232
  },
  {
    "name": "London Borough of Lambeth",
    "country_id": 232
  },
  {
    "name": "London Borough of Redbridge",
    "country_id": 232
  },
  {
    "name": "Manchester",
    "country_id": 232
  },
  {
    "name": "Mid Ulster",
    "country_id": 232
  },
  {
    "name": "South Gloucestershire",
    "country_id": 232
  },
  {
    "name": "Aberdeenshire",
    "country_id": 232
  },
  {
    "name": "Monmouthshire",
    "country_id": 232
  },
  {
    "name": "Derbyshire",
    "country_id": 232
  },
  {
    "name": "Glasgow",
    "country_id": 232
  },
  {
    "name": "Buckinghamshire",
    "country_id": 232
  },
  {
    "name": "County Durham",
    "country_id": 232
  },
  {
    "name": "Shropshire",
    "country_id": 232
  },
  {
    "name": "Wirral",
    "country_id": 232
  },
  {
    "name": "South Tyneside",
    "country_id": 232
  },
  {
    "name": "Essex",
    "country_id": 232
  },
  {
    "name": "London Borough of Hackney",
    "country_id": 232
  },
  {
    "name": "Antrim and Newtownabbey",
    "country_id": 232
  },
  {
    "name": "City of Bristol",
    "country_id": 232
  },
  {
    "name": "East Sussex",
    "country_id": 232
  },
  {
    "name": "Dumfries and Galloway",
    "country_id": 232
  },
  {
    "name": "Milton Keynes",
    "country_id": 232
  },
  {
    "name": "Derry City Council",
    "country_id": 232
  },
  {
    "name": "London Borough of Newham",
    "country_id": 232
  },
  {
    "name": "Wokingham",
    "country_id": 232
  },
  {
    "name": "Warrington",
    "country_id": 232
  },
  {
    "name": "Stockton-on-Tees",
    "country_id": 232
  },
  {
    "name": "Swindon",
    "country_id": 232
  },
  {
    "name": "Cambridgeshire",
    "country_id": 232
  },
  {
    "name": "City of London",
    "country_id": 232
  },
  {
    "name": "Birmingham",
    "country_id": 232
  },
  {
    "name": "City of York",
    "country_id": 232
  },
  {
    "name": "Slough",
    "country_id": 232
  },
  {
    "name": "Edinburgh",
    "country_id": 232
  },
  {
    "name": "Mid and East Antrim",
    "country_id": 232
  },
  {
    "name": "North Somerset",
    "country_id": 232
  },
  {
    "name": "Gateshead",
    "country_id": 232
  },
  {
    "name": "London Borough of Southwark",
    "country_id": 232
  },
  {
    "name": "City and County of Swansea",
    "country_id": 232
  },
  {
    "name": "London Borough of Wandsworth",
    "country_id": 232
  },
  {
    "name": "Hampshire",
    "country_id": 232
  },
  {
    "name": "Wrexham County Borough",
    "country_id": 232
  },
  {
    "name": "Flintshire",
    "country_id": 232
  },
  {
    "name": "Coventry",
    "country_id": 232
  },
  {
    "name": "Carrickfergus Borough Council",
    "country_id": 232
  },
  {
    "name": "West Dunbartonshire",
    "country_id": 232
  },
  {
    "name": "Powys",
    "country_id": 232
  },
  {
    "name": "Cheshire West and Chester",
    "country_id": 232
  },
  {
    "name": "Renfrewshire",
    "country_id": 232
  },
  {
    "name": "Cheshire East",
    "country_id": 232
  },
  {
    "name": "Cookstown District Council",
    "country_id": 232
  },
  {
    "name": "Derry City and Strabane",
    "country_id": 232
  },
  {
    "name": "Staffordshire",
    "country_id": 232
  },
  {
    "name": "London Borough of Hammersmith and Fulham",
    "country_id": 232
  },
  {
    "name": "Craigavon Borough Council",
    "country_id": 232
  },
  {
    "name": "Clackmannanshire",
    "country_id": 232
  },
  {
    "name": "Blackpool",
    "country_id": 232
  },
  {
    "name": "Bridgend County Borough",
    "country_id": 232
  },
  {
    "name": "North Lincolnshire",
    "country_id": 232
  },
  {
    "name": "East Dunbartonshire",
    "country_id": 232
  },
  {
    "name": "Reading",
    "country_id": 232
  },
  {
    "name": "Nottinghamshire",
    "country_id": 232
  },
  {
    "name": "Dudley",
    "country_id": 232
  },
  {
    "name": "Newcastle upon Tyne",
    "country_id": 232
  },
  {
    "name": "Bury",
    "country_id": 232
  },
  {
    "name": "Lisburn and Castlereagh",
    "country_id": 232
  },
  {
    "name": "Coleraine Borough Council",
    "country_id": 232
  },
  {
    "name": "East Lothian",
    "country_id": 232
  },
  {
    "name": "Aberdeen",
    "country_id": 232
  },
  {
    "name": "Kent",
    "country_id": 232
  },
  {
    "name": "Wakefield",
    "country_id": 232
  },
  {
    "name": "Halton",
    "country_id": 232
  },
  {
    "name": "Suffolk",
    "country_id": 232
  },
  {
    "name": "Thurrock",
    "country_id": 232
  },
  {
    "name": "Solihull",
    "country_id": 232
  },
  {
    "name": "Bracknell Forest",
    "country_id": 232
  },
  {
    "name": "West Berkshire",
    "country_id": 232
  },
  {
    "name": "Rutland",
    "country_id": 232
  },
  {
    "name": "Norfolk",
    "country_id": 232
  },
  {
    "name": "Orkney Islands",
    "country_id": 232
  },
  {
    "name": "City of Kingston upon Hull",
    "country_id": 232
  },
  {
    "name": "London Borough of Enfield",
    "country_id": 232
  },
  {
    "name": "Oldham",
    "country_id": 232
  },
  {
    "name": "Torbay",
    "country_id": 232
  },
  {
    "name": "Fife",
    "country_id": 232
  },
  {
    "name": "Northamptonshire",
    "country_id": 232
  },
  {
    "name": "Royal Borough of Kingston upon Thames",
    "country_id": 232
  },
  {
    "name": "Windsor and Maidenhead",
    "country_id": 232
  },
  {
    "name": "London Borough of Merton",
    "country_id": 232
  },
  {
    "name": "Carmarthenshire",
    "country_id": 232
  },
  {
    "name": "City of Derby",
    "country_id": 232
  },
  {
    "name": "Pembrokeshire",
    "country_id": 232
  },
  {
    "name": "North Lanarkshire",
    "country_id": 232
  },
  {
    "name": "Stirling",
    "country_id": 232
  },
  {
    "name": "City of Wolverhampton",
    "country_id": 232
  },
  {
    "name": "London Borough of Bromley",
    "country_id": 232
  },
  {
    "name": "Devon",
    "country_id": 232
  },
  {
    "name": "Royal Borough of Greenwich",
    "country_id": 232
  },
  {
    "name": "Salford",
    "country_id": 232
  },
  {
    "name": "Lisburn City Council",
    "country_id": 232
  },
  {
    "name": "Lancashire",
    "country_id": 232
  },
  {
    "name": "Torfaen",
    "country_id": 232
  },
  {
    "name": "Denbighshire",
    "country_id": 232
  },
  {
    "name": "Ards",
    "country_id": 232
  },
  {
    "name": "Barnsley",
    "country_id": 232
  },
  {
    "name": "Herefordshire",
    "country_id": 232
  },
  {
    "name": "London Borough of Richmond upon Thames",
    "country_id": 232
  },
  {
    "name": "Saint Helena",
    "country_id": 232
  },
  {
    "name": "Leeds",
    "country_id": 232
  },
  {
    "name": "Bolton",
    "country_id": 232
  },
  {
    "name": "Warwickshire",
    "country_id": 232
  },
  {
    "name": "City of Stoke-on-Trent",
    "country_id": 232
  },
  {
    "name": "Bedford",
    "country_id": 232
  },
  {
    "name": "Dungannon and South Tyrone Borough Council",
    "country_id": 232
  },
  {
    "name": "Ceredigion",
    "country_id": 232
  },
  {
    "name": "Worcestershire",
    "country_id": 232
  },
  {
    "name": "Dundee",
    "country_id": 232
  },
  {
    "name": "London Borough of Croydon",
    "country_id": 232
  },
  {
    "name": "North Down Borough Council",
    "country_id": 232
  },
  {
    "name": "City of Plymouth",
    "country_id": 232
  },
  {
    "name": "Larne Borough Council",
    "country_id": 232
  },
  {
    "name": "Leicestershire",
    "country_id": 232
  },
  {
    "name": "Calderdale",
    "country_id": 232
  },
  {
    "name": "Sefton",
    "country_id": 232
  },
  {
    "name": "Midlothian",
    "country_id": 232
  },
  {
    "name": "London Borough of Barnet",
    "country_id": 232
  },
  {
    "name": "North Tyneside",
    "country_id": 232
  },
  {
    "name": "North Yorkshire",
    "country_id": 232
  },
  {
    "name": "Ards and North Down",
    "country_id": 232
  },
  {
    "name": "Newport",
    "country_id": 232
  },
  {
    "name": "Castlereagh",
    "country_id": 232
  },
  {
    "name": "Surrey",
    "country_id": 232
  },
  {
    "name": "Redcar and Cleveland",
    "country_id": 232
  },
  {
    "name": "City and County of Cardiff",
    "country_id": 232
  },
  {
    "name": "Bradford",
    "country_id": 232
  },
  {
    "name": "Blaenau Gwent County Borough",
    "country_id": 232
  },
  {
    "name": "Fermanagh District Council",
    "country_id": 232
  },
  {
    "name": "London Borough of Ealing",
    "country_id": 232
  },
  {
    "name": "Antrim",
    "country_id": 232
  },
  {
    "name": "Newry, Mourne and Down",
    "country_id": 232
  },
  {
    "name": "North Ayrshire",
    "country_id": 232
  },
  {
    "name": "Tashkent",
    "country_id": 236
  },
  {
    "name": "Namangan Region",
    "country_id": 236
  },
  {
    "name": "Fergana Region",
    "country_id": 236
  },
  {
    "name": "Xorazm Region",
    "country_id": 236
  },
  {
    "name": "Andijan Region",
    "country_id": 236
  },
  {
    "name": "Bukhara Region",
    "country_id": 236
  },
  {
    "name": "Navoiy Region",
    "country_id": 236
  },
  {
    "name": "Qashqadaryo Region",
    "country_id": 236
  },
  {
    "name": "Samarqand Region",
    "country_id": 236
  },
  {
    "name": "Jizzakh Region",
    "country_id": 236
  },
  {
    "name": "Surxondaryo Region",
    "country_id": 236
  },
  {
    "name": "Sirdaryo Region",
    "country_id": 236
  },
  {
    "name": "Karakalpakstan",
    "country_id": 236
  },
  {
    "name": "Tashkent Region",
    "country_id": 236
  },
  {
    "name": "Ariana",
    "country_id": 224
  },
  {
    "name": "Bizerte",
    "country_id": 224
  },
  {
    "name": "Jendouba",
    "country_id": 224
  },
  {
    "name": "Monastir",
    "country_id": 224
  },
  {
    "name": "Tunis",
    "country_id": 224
  },
  {
    "name": "Manouba",
    "country_id": 224
  },
  {
    "name": "Gafsa",
    "country_id": 224
  },
  {
    "name": "Sfax",
    "country_id": 224
  },
  {
    "name": "Gabès",
    "country_id": 224
  },
  {
    "name": "Tataouine",
    "country_id": 224
  },
  {
    "name": "Medenine",
    "country_id": 224
  },
  {
    "name": "Kef",
    "country_id": 224
  },
  {
    "name": "Kebili",
    "country_id": 224
  },
  {
    "name": "Siliana",
    "country_id": 224
  },
  {
    "name": "Kairouan",
    "country_id": 224
  },
  {
    "name": "Zaghouan",
    "country_id": 224
  },
  {
    "name": "Ben Arous",
    "country_id": 224
  },
  {
    "name": "Sidi Bouzid",
    "country_id": 224
  },
  {
    "name": "Mahdia",
    "country_id": 224
  },
  {
    "name": "Tozeur",
    "country_id": 224
  },
  {
    "name": "Kasserine",
    "country_id": 224
  },
  {
    "name": "Sousse",
    "country_id": 224
  },
  {
    "name": "Kassrine",
    "country_id": 224
  },
  {
    "name": "Ratak Chain",
    "country_id": 137
  },
  {
    "name": "Ralik Chain",
    "country_id": 137
  },
  {
    "name": "Centrale Region",
    "country_id": 220
  },
  {
    "name": "Maritime",
    "country_id": 220
  },
  {
    "name": "Plateaux Region",
    "country_id": 220
  },
  {
    "name": "Savanes Region",
    "country_id": 220
  },
  {
    "name": "Kara Region",
    "country_id": 220
  },
  {
    "name": "Chuuk State",
    "country_id": 143
  },
  {
    "name": "Pohnpei State",
    "country_id": 143
  },
  {
    "name": "Yap State",
    "country_id": 143
  },
  {
    "name": "Kosrae State",
    "country_id": 143
  },
  {
    "name": "Vaavu Atoll",
    "country_id": 133
  },
  {
    "name": "Shaviyani Atoll",
    "country_id": 133
  },
  {
    "name": "Haa Alif Atoll",
    "country_id": 133
  },
  {
    "name": "Alif Alif Atoll",
    "country_id": 133
  },
  {
    "name": "North Province",
    "country_id": 133
  },
  {
    "name": "North Central Province",
    "country_id": 133
  },
  {
    "name": "Dhaalu Atoll",
    "country_id": 133
  },
  {
    "name": "Thaa Atoll",
    "country_id": 133
  },
  {
    "name": "Noonu Atoll",
    "country_id": 133
  },
  {
    "name": "Upper South Province",
    "country_id": 133
  },
  {
    "name": "Addu Atoll",
    "country_id": 133
  },
  {
    "name": "Gnaviyani Atoll",
    "country_id": 133
  },
  {
    "name": "Kaafu Atoll",
    "country_id": 133
  },
  {
    "name": "Haa Dhaalu Atoll",
    "country_id": 133
  },
  {
    "name": "Gaafu Alif Atoll",
    "country_id": 133
  },
  {
    "name": "Faafu Atoll",
    "country_id": 133
  },
  {
    "name": "Alif Dhaal Atoll",
    "country_id": 133
  },
  {
    "name": "Laamu Atoll",
    "country_id": 133
  },
  {
    "name": "Raa Atoll",
    "country_id": 133
  },
  {
    "name": "Gaafu Dhaalu Atoll",
    "country_id": 133
  },
  {
    "name": "Central Province",
    "country_id": 133
  },
  {
    "name": "South Province",
    "country_id": 133
  },
  {
    "name": "South Central Province",
    "country_id": 133
  },
  {
    "name": "Lhaviyani Atoll",
    "country_id": 133
  },
  {
    "name": "Meemu Atoll",
    "country_id": 133
  },
  {
    "name": "Malé",
    "country_id": 133
  },
  {
    "name": "Utrecht",
    "country_id": 156
  },
  {
    "name": "Gelderland",
    "country_id": 156
  },
  {
    "name": "North Holland",
    "country_id": 156
  },
  {
    "name": "Drenthe",
    "country_id": 156
  },
  {
    "name": "South Holland",
    "country_id": 156
  },
  {
    "name": "Limburg",
    "country_id": 156
  },
  {
    "name": "Sint Eustatius",
    "country_id": 156
  },
  {
    "name": "Groningen",
    "country_id": 156
  },
  {
    "name": "Overijssel",
    "country_id": 156
  },
  {
    "name": "Flevoland",
    "country_id": 156
  },
  {
    "name": "Zeeland",
    "country_id": 156
  },
  {
    "name": "Saba",
    "country_id": 156
  },
  {
    "name": "Friesland",
    "country_id": 156
  },
  {
    "name": "North Brabant",
    "country_id": 156
  },
  {
    "name": "Bonaire",
    "country_id": 156
  },
  {
    "name": "Savanes Region",
    "country_id": 54
  },
  {
    "name": "Agnéby",
    "country_id": 54
  },
  {
    "name": "Lagunes District",
    "country_id": 54
  },
  {
    "name": "Sud-Bandama",
    "country_id": 54
  },
  {
    "name": "Montagnes District",
    "country_id": 54
  },
  {
    "name": "Moyen-Comoé",
    "country_id": 54
  },
  {
    "name": "Marahoué Region",
    "country_id": 54
  },
  {
    "name": "Lacs District",
    "country_id": 54
  },
  {
    "name": "Fromager",
    "country_id": 54
  },
  {
    "name": "Abidjan",
    "country_id": 54
  },
  {
    "name": "Bas-Sassandra Region",
    "country_id": 54
  },
  {
    "name": "Bafing Region",
    "country_id": 54
  },
  {
    "name": "Vallée du Bandama District",
    "country_id": 54
  },
  {
    "name": "Haut-Sassandra",
    "country_id": 54
  },
  {
    "name": "Lagunes region",
    "country_id": 54
  },
  {
    "name": "Lacs Region",
    "country_id": 54
  },
  {
    "name": "Zanzan Region",
    "country_id": 54
  },
  {
    "name": "Denguélé Region",
    "country_id": 54
  },
  {
    "name": "Bas-Sassandra District",
    "country_id": 54
  },
  {
    "name": "Denguélé District",
    "country_id": 54
  },
  {
    "name": "Dix-Huit Montagnes",
    "country_id": 54
  },
  {
    "name": "Moyen-Cavally",
    "country_id": 54
  },
  {
    "name": "Vallée du Bandama Region",
    "country_id": 54
  },
  {
    "name": "Sassandra-Marahoué District",
    "country_id": 54
  },
  {
    "name": "Worodougou",
    "country_id": 54
  },
  {
    "name": "Woroba District",
    "country_id": 54
  },
  {
    "name": "Gôh-Djiboua District",
    "country_id": 54
  },
  {
    "name": "Sud-Comoé",
    "country_id": 54
  },
  {
    "name": "Yamoussoukro",
    "country_id": 54
  },
  {
    "name": "Comoé District",
    "country_id": 54
  },
  {
    "name": "N'zi-Comoé",
    "country_id": 54
  },
  {
    "name": "Far North",
    "country_id": 38
  },
  {
    "name": "Northwest",
    "country_id": 38
  },
  {
    "name": "Southwest",
    "country_id": 38
  },
  {
    "name": "South",
    "country_id": 38
  },
  {
    "name": "Centre",
    "country_id": 38
  },
  {
    "name": "East",
    "country_id": 38
  },
  {
    "name": "Littoral",
    "country_id": 38
  },
  {
    "name": "Adamawa",
    "country_id": 38
  },
  {
    "name": "West",
    "country_id": 38
  },
  {
    "name": "North",
    "country_id": 38
  },
  {
    "name": "Banjul",
    "country_id": 80
  },
  {
    "name": "West Coast Division",
    "country_id": 80
  },
  {
    "name": "Upper River Division",
    "country_id": 80
  },
  {
    "name": "Central River Division",
    "country_id": 80
  },
  {
    "name": "Lower River Division",
    "country_id": 80
  },
  {
    "name": "North Bank Division",
    "country_id": 80
  },
  {
    "name": "Beyla Prefecture",
    "country_id": 92
  },
  {
    "name": "Mandiana Prefecture",
    "country_id": 92
  },
  {
    "name": "Yomou Prefecture",
    "country_id": 92
  },
  {
    "name": "Fria Prefecture",
    "country_id": 92
  },
  {
    "name": "Boké Region",
    "country_id": 92
  },
  {
    "name": "Labé Region",
    "country_id": 92
  },
  {
    "name": "Nzérékoré Prefecture",
    "country_id": 92
  },
  {
    "name": "Dabola Prefecture",
    "country_id": 92
  },
  {
    "name": "Labé Prefecture",
    "country_id": 92
  },
  {
    "name": "Dubréka Prefecture",
    "country_id": 92
  },
  {
    "name": "Faranah Prefecture",
    "country_id": 92
  },
  {
    "name": "Forécariah Prefecture",
    "country_id": 92
  },
  {
    "name": "Nzérékoré Region",
    "country_id": 92
  },
  {
    "name": "Gaoual Prefecture",
    "country_id": 92
  },
  {
    "name": "Conakry",
    "country_id": 92
  },
  {
    "name": "Télimélé Prefecture",
    "country_id": 92
  },
  {
    "name": "Dinguiraye Prefecture",
    "country_id": 92
  },
  {
    "name": "Mamou Prefecture",
    "country_id": 92
  },
  {
    "name": "Lélouma Prefecture",
    "country_id": 92
  },
  {
    "name": "Kissidougou Prefecture",
    "country_id": 92
  },
  {
    "name": "Koubia Prefecture",
    "country_id": 92
  },
  {
    "name": "Kindia Prefecture",
    "country_id": 92
  },
  {
    "name": "Pita Prefecture",
    "country_id": 92
  },
  {
    "name": "Kouroussa Prefecture",
    "country_id": 92
  },
  {
    "name": "Tougué Prefecture",
    "country_id": 92
  },
  {
    "name": "Kankan Region",
    "country_id": 92
  },
  {
    "name": "Mamou Region",
    "country_id": 92
  },
  {
    "name": "Boffa Prefecture",
    "country_id": 92
  },
  {
    "name": "Mali Prefecture",
    "country_id": 92
  },
  {
    "name": "Kindia Region",
    "country_id": 92
  },
  {
    "name": "Macenta Prefecture",
    "country_id": 92
  },
  {
    "name": "Koundara Prefecture",
    "country_id": 92
  },
  {
    "name": "Kankan Prefecture",
    "country_id": 92
  },
  {
    "name": "Coyah Prefecture",
    "country_id": 92
  },
  {
    "name": "Dalaba Prefecture",
    "country_id": 92
  },
  {
    "name": "Siguiri Prefecture",
    "country_id": 92
  },
  {
    "name": "Lola Prefecture",
    "country_id": 92
  },
  {
    "name": "Boké Prefecture",
    "country_id": 92
  },
  {
    "name": "Kérouané Prefecture",
    "country_id": 92
  },
  {
    "name": "Guéckédou Prefecture",
    "country_id": 92
  },
  {
    "name": "Tombali Region",
    "country_id": 93
  },
  {
    "name": "Cacheu Region",
    "country_id": 93
  },
  {
    "name": "Biombo Region",
    "country_id": 93
  },
  {
    "name": "Quinara Region",
    "country_id": 93
  },
  {
    "name": "Sul Province",
    "country_id": 93
  },
  {
    "name": "Norte Province",
    "country_id": 93
  },
  {
    "name": "Oio Region",
    "country_id": 93
  },
  {
    "name": "Gabú Region",
    "country_id": 93
  },
  {
    "name": "Bafatá",
    "country_id": 93
  },
  {
    "name": "Leste Province",
    "country_id": 93
  },
  {
    "name": "Bolama Region",
    "country_id": 93
  },
  {
    "name": "Woleu-Ntem Province",
    "country_id": 79
  },
  {
    "name": "Ogooué-Ivindo Province",
    "country_id": 79
  },
  {
    "name": "Nyanga Province",
    "country_id": 79
  },
  {
    "name": "Haut-Ogooué Province",
    "country_id": 79
  },
  {
    "name": "Estuaire Province",
    "country_id": 79
  },
  {
    "name": "Ogooué-Maritime Province",
    "country_id": 79
  },
  {
    "name": "Ogooué-Lolo Province",
    "country_id": 79
  },
  {
    "name": "Moyen-Ogooué Province",
    "country_id": 79
  },
  {
    "name": "Ngounié Province",
    "country_id": 79
  },
  {
    "name": "Tshuapa",
    "country_id": 51
  },
  {
    "name": "Tanganyika",
    "country_id": 51
  },
  {
    "name": "Haut-Uélé",
    "country_id": 51
  },
  {
    "name": "Kasaï Oriental",
    "country_id": 51
  },
  {
    "name": "Sud-Kivu",
    "country_id": 51
  },
  {
    "name": "Nord-Ubangi",
    "country_id": 51
  },
  {
    "name": "Kwango",
    "country_id": 51
  },
  {
    "name": "Kinshasa",
    "country_id": 51
  },
  {
    "name": "Kasaï Central",
    "country_id": 51
  },
  {
    "name": "Sankuru",
    "country_id": 51
  },
  {
    "name": "Équateur",
    "country_id": 51
  },
  {
    "name": "Maniema",
    "country_id": 51
  },
  {
    "name": "Kongo Central",
    "country_id": 51
  },
  {
    "name": "Lomami",
    "country_id": 51
  },
  {
    "name": "Sud-Ubangi",
    "country_id": 51
  },
  {
    "name": "Nord-Kivu",
    "country_id": 51
  },
  {
    "name": "Haut-Katanga",
    "country_id": 51
  },
  {
    "name": "Ituri",
    "country_id": 51
  },
  {
    "name": "Mongala",
    "country_id": 51
  },
  {
    "name": "Bas-Uélé",
    "country_id": 51
  },
  {
    "name": "Mai-Ndombe",
    "country_id": 51
  },
  {
    "name": "Tshopo",
    "country_id": 51
  },
  {
    "name": "Kasaï",
    "country_id": 51
  },
  {
    "name": "Haut-Lomami",
    "country_id": 51
  },
  {
    "name": "Kwilu",
    "country_id": 51
  },
  {
    "name": "Cuyuni-Mazaruni",
    "country_id": 94
  },
  {
    "name": "Potaro-Siparuni",
    "country_id": 94
  },
  {
    "name": "Mahaica-Berbice",
    "country_id": 94
  },
  {
    "name": "Upper Demerara-Berbice",
    "country_id": 94
  },
  {
    "name": "Barima-Waini",
    "country_id": 94
  },
  {
    "name": "Pomeroon-Supenaam",
    "country_id": 94
  },
  {
    "name": "East Berbice-Corentyne",
    "country_id": 94
  },
  {
    "name": "Demerara-Mahaica",
    "country_id": 94
  },
  {
    "name": "Essequibo Islands-West Demerara",
    "country_id": 94
  },
  {
    "name": "Upper Takutu-Upper Essequibo",
    "country_id": 94
  },
  {
    "name": "Presidente Hayes Department",
    "country_id": 172
  },
  {
    "name": "Canindeyú",
    "country_id": 172
  },
  {
    "name": "Guairá Department",
    "country_id": 172
  },
  {
    "name": "Caaguazú",
    "country_id": 172
  },
  {
    "name": "Paraguarí Department",
    "country_id": 172
  },
  {
    "name": "Caazapá",
    "country_id": 172
  },
  {
    "name": "San Pedro Department",
    "country_id": 172
  },
  {
    "name": "Central Department",
    "country_id": 172
  },
  {
    "name": "Itapúa",
    "country_id": 172
  },
  {
    "name": "Concepción Department",
    "country_id": 172
  },
  {
    "name": "Boquerón Department",
    "country_id": 172
  },
  {
    "name": "Ñeembucú Department",
    "country_id": 172
  },
  {
    "name": "Amambay Department",
    "country_id": 172
  },
  {
    "name": "Cordillera Department",
    "country_id": 172
  },
  {
    "name": "Alto Paraná Department",
    "country_id": 172
  },
  {
    "name": "Alto Paraguay Department",
    "country_id": 172
  },
  {
    "name": "Misiones Department",
    "country_id": 172
  },
  {
    "name": "Jaffna District",
    "country_id": 208
  },
  {
    "name": "Kandy District",
    "country_id": 208
  },
  {
    "name": "Kalutara District",
    "country_id": 208
  },
  {
    "name": "Badulla District",
    "country_id": 208
  },
  {
    "name": "Hambantota District",
    "country_id": 208
  },
  {
    "name": "Galle District",
    "country_id": 208
  },
  {
    "name": "Kilinochchi District",
    "country_id": 208
  },
  {
    "name": "Nuwara Eliya District",
    "country_id": 208
  },
  {
    "name": "Trincomalee District",
    "country_id": 208
  },
  {
    "name": "Puttalam District",
    "country_id": 208
  },
  {
    "name": "Kegalle District",
    "country_id": 208
  },
  {
    "name": "Central Province",
    "country_id": 208
  },
  {
    "name": "Ampara District",
    "country_id": 208
  },
  {
    "name": "North Central Province",
    "country_id": 208
  },
  {
    "name": "Southern Province",
    "country_id": 208
  },
  {
    "name": "Western Province",
    "country_id": 208
  },
  {
    "name": "Sabaragamuwa Province",
    "country_id": 208
  },
  {
    "name": "Gampaha District",
    "country_id": 208
  },
  {
    "name": "Mannar District",
    "country_id": 208
  },
  {
    "name": "Matara District",
    "country_id": 208
  },
  {
    "name": "Ratnapura district",
    "country_id": 208
  },
  {
    "name": "Eastern Province",
    "country_id": 208
  },
  {
    "name": "Vavuniya District",
    "country_id": 208
  },
  {
    "name": "Matale District",
    "country_id": 208
  },
  {
    "name": "Uva Province",
    "country_id": 208
  },
  {
    "name": "Polonnaruwa District",
    "country_id": 208
  },
  {
    "name": "Northern Province",
    "country_id": 208
  },
  {
    "name": "Mullaitivu District",
    "country_id": 208
  },
  {
    "name": "Colombo District",
    "country_id": 208
  },
  {
    "name": "Anuradhapura District",
    "country_id": 208
  },
  {
    "name": "North Western Province",
    "country_id": 208
  },
  {
    "name": "Batticaloa District",
    "country_id": 208
  },
  {
    "name": "Monaragala District",
    "country_id": 208
  },
  {
    "name": "Mohéli",
    "country_id": 49
  },
  {
    "name": "Anjouan",
    "country_id": 49
  },
  {
    "name": "Grande Comore",
    "country_id": 49
  },
  {
    "name": "Atacama",
    "country_id": 44
  },
  {
    "name": "Región Metropolitana de Santiago",
    "country_id": 44
  },
  {
    "name": "Coquimbo",
    "country_id": 44
  },
  {
    "name": "La Araucanía",
    "country_id": 44
  },
  {
    "name": "Biobío",
    "country_id": 44
  },
  {
    "name": "Aisén del General Carlos Ibañez del Campo",
    "country_id": 44
  },
  {
    "name": "Arica y Parinacota",
    "country_id": 44
  },
  {
    "name": "Valparaíso",
    "country_id": 44
  },
  {
    "name": "Ñuble",
    "country_id": 44
  },
  {
    "name": "Antofagasta",
    "country_id": 44
  },
  {
    "name": "Maule",
    "country_id": 44
  },
  {
    "name": "Los Ríos",
    "country_id": 44
  },
  {
    "name": "Los Lagos",
    "country_id": 44
  },
  {
    "name": "Magallanes y de la Antártica Chilena",
    "country_id": 44
  },
  {
    "name": "Tarapacá",
    "country_id": 44
  },
  {
    "name": "Libertador General Bernardo O'Higgins",
    "country_id": 44
  },
  {
    "name": "Commewijne District",
    "country_id": 210
  },
  {
    "name": "Nickerie District",
    "country_id": 210
  },
  {
    "name": "Para District",
    "country_id": 210
  },
  {
    "name": "Coronie District",
    "country_id": 210
  },
  {
    "name": "Paramaribo District",
    "country_id": 210
  },
  {
    "name": "Wanica District",
    "country_id": 210
  },
  {
    "name": "Marowijne District",
    "country_id": 210
  },
  {
    "name": "Brokopondo District",
    "country_id": 210
  },
  {
    "name": "Sipaliwini District",
    "country_id": 210
  },
  {
    "name": "Saramacca District",
    "country_id": 210
  },
  {
    "name": "Riyadh",
    "country_id": 194
  },
  {
    "name": "Makkah",
    "country_id": 194
  },
  {
    "name": "Al Madinah",
    "country_id": 194
  },
  {
    "name": "Tabuk",
    "country_id": 194
  },
  {
    "name": "'Asir",
    "country_id": 194
  },
  {
    "name": "Northern Borders",
    "country_id": 194
  },
  {
    "name": "Ha'il",
    "country_id": 194
  },
  {
    "name": "Eastern Province",
    "country_id": 194
  },
  {
    "name": "Al Jawf",
    "country_id": 194
  },
  {
    "name": "Jizan",
    "country_id": 194
  },
  {
    "name": "Al Bahah",
    "country_id": 194
  },
  {
    "name": "Najran",
    "country_id": 194
  },
  {
    "name": "Al-Qassim",
    "country_id": 194
  },
  {
    "name": "Plateaux Department",
    "country_id": 50
  },
  {
    "name": "Pointe-Noire",
    "country_id": 50
  },
  {
    "name": "Cuvette Department",
    "country_id": 50
  },
  {
    "name": "Likouala Department",
    "country_id": 50
  },
  {
    "name": "Bouenza Department",
    "country_id": 50
  },
  {
    "name": "Kouilou Department",
    "country_id": 50
  },
  {
    "name": "Lékoumou Department",
    "country_id": 50
  },
  {
    "name": "Cuvette-Ouest Department",
    "country_id": 50
  },
  {
    "name": "Brazzaville",
    "country_id": 50
  },
  {
    "name": "Sangha Department",
    "country_id": 50
  },
  {
    "name": "Niari Department",
    "country_id": 50
  },
  {
    "name": "Pool Department",
    "country_id": 50
  },
  {
    "name": "Quindío",
    "country_id": 48
  },
  {
    "name": "Cundinamarca",
    "country_id": 48
  },
  {
    "name": "Chocó",
    "country_id": 48
  },
  {
    "name": "Norte de Santander",
    "country_id": 48
  },
  {
    "name": "Meta",
    "country_id": 48
  },
  {
    "name": "Risaralda",
    "country_id": 48
  },
  {
    "name": "Atlántico",
    "country_id": 48
  },
  {
    "name": "Arauca",
    "country_id": 48
  },
  {
    "name": "Guainía",
    "country_id": 48
  },
  {
    "name": "Tolima",
    "country_id": 48
  },
  {
    "name": "Cauca",
    "country_id": 48
  },
  {
    "name": "Vaupés",
    "country_id": 48
  },
  {
    "name": "Magdalena",
    "country_id": 48
  },
  {
    "name": "Caldas",
    "country_id": 48
  },
  {
    "name": "Guaviare",
    "country_id": 48
  },
  {
    "name": "La Guajira",
    "country_id": 48
  },
  {
    "name": "Antioquia",
    "country_id": 48
  },
  {
    "name": "Caquetá",
    "country_id": 48
  },
  {
    "name": "Casanare",
    "country_id": 48
  },
  {
    "name": "Bolívar",
    "country_id": 48
  },
  {
    "name": "Vichada",
    "country_id": 48
  },
  {
    "name": "Amazonas",
    "country_id": 48
  },
  {
    "name": "Putumayo",
    "country_id": 48
  },
  {
    "name": "Nariño",
    "country_id": 48
  },
  {
    "name": "Córdoba",
    "country_id": 48
  },
  {
    "name": "Cesar",
    "country_id": 48
  },
  {
    "name": "Archipiélago de San Andrés, Providencia y Santa Catalina",
    "country_id": 48
  },
  {
    "name": "Santander",
    "country_id": 48
  },
  {
    "name": "Sucre",
    "country_id": 48
  },
  {
    "name": "Boyacá",
    "country_id": 48
  },
  {
    "name": "Valle del Cauca",
    "country_id": 48
  },
  {
    "name": "Galápagos",
    "country_id": 64
  },
  {
    "name": "Sucumbíos",
    "country_id": 64
  },
  {
    "name": "Pastaza",
    "country_id": 64
  },
  {
    "name": "Tungurahua",
    "country_id": 64
  },
  {
    "name": "Zamora Chinchipe",
    "country_id": 64
  },
  {
    "name": "Los Ríos",
    "country_id": 64
  },
  {
    "name": "Imbabura",
    "country_id": 64
  },
  {
    "name": "Santa Elena",
    "country_id": 64
  },
  {
    "name": "Manabí",
    "country_id": 64
  },
  {
    "name": "Guayas",
    "country_id": 64
  },
  {
    "name": "Carchi",
    "country_id": 64
  },
  {
    "name": "Napo",
    "country_id": 64
  },
  {
    "name": "Cañar",
    "country_id": 64
  },
  {
    "name": "Morona-Santiago",
    "country_id": 64
  },
  {
    "name": "Santo Domingo de los Tsáchilas",
    "country_id": 64
  },
  {
    "name": "Bolívar",
    "country_id": 64
  },
  {
    "name": "Cotopaxi",
    "country_id": 64
  },
  {
    "name": "Esmeraldas",
    "country_id": 64
  },
  {
    "name": "Azuay",
    "country_id": 64
  },
  {
    "name": "El Oro",
    "country_id": 64
  },
  {
    "name": "Chimborazo",
    "country_id": 64
  },
  {
    "name": "Orellana",
    "country_id": 64
  },
  {
    "name": "Pichincha",
    "country_id": 64
  },
  {
    "name": "Obock Region",
    "country_id": 60
  },
  {
    "name": "Djibouti",
    "country_id": 60
  },
  {
    "name": "Dikhil Region",
    "country_id": 60
  },
  {
    "name": "Tadjourah Region",
    "country_id": 60
  },
  {
    "name": "Arta Region",
    "country_id": 60
  },
  {
    "name": "Ali Sabieh Region",
    "country_id": 60
  },
  {
    "name": "Hama",
    "country_id": 215
  },
  {
    "name": "Rif Dimashq",
    "country_id": 215
  },
  {
    "name": "As-Suwayda",
    "country_id": 215
  },
  {
    "name": "Deir ez-Zor",
    "country_id": 215
  },
  {
    "name": "Latakia",
    "country_id": 215
  },
  {
    "name": "Damascus",
    "country_id": 215
  },
  {
    "name": "Idlib",
    "country_id": 215
  },
  {
    "name": "Al-Hasakah",
    "country_id": 215
  },
  {
    "name": "Homs",
    "country_id": 215
  },
  {
    "name": "Quneitra",
    "country_id": 215
  },
  {
    "name": "Al-Raqqah",
    "country_id": 215
  },
  {
    "name": "Daraa",
    "country_id": 215
  },
  {
    "name": "Aleppo",
    "country_id": 215
  },
  {
    "name": "Tartus",
    "country_id": 215
  },
  {
    "name": "Fianarantsoa Province",
    "country_id": 130
  },
  {
    "name": "Toliara Province",
    "country_id": 130
  },
  {
    "name": "Antsiranana Province",
    "country_id": 130
  },
  {
    "name": "Antananarivo Province",
    "country_id": 130
  },
  {
    "name": "Toamasina Province",
    "country_id": 130
  },
  {
    "name": "Mahajanga Province",
    "country_id": 130
  },
  {
    "name": "Mogilev Region",
    "country_id": 21
  },
  {
    "name": "Gomel Region",
    "country_id": 21
  },
  {
    "name": "Grodno Region",
    "country_id": 21
  },
  {
    "name": "Minsk Region",
    "country_id": 21
  },
  {
    "name": "Minsk",
    "country_id": 21
  },
  {
    "name": "Brest Region",
    "country_id": 21
  },
  {
    "name": "Vitebsk Region",
    "country_id": 21
  },
  {
    "name": "Murqub",
    "country_id": 124
  },
  {
    "name": "Nuqat al Khams",
    "country_id": 124
  },
  {
    "name": "Zawiya District",
    "country_id": 124
  },
  {
    "name": "Al Wahat District",
    "country_id": 124
  },
  {
    "name": "Sabha District",
    "country_id": 124
  },
  {
    "name": "Derna District",
    "country_id": 124
  },
  {
    "name": "Murzuq District",
    "country_id": 124
  },
  {
    "name": "Marj District",
    "country_id": 124
  },
  {
    "name": "Ghat District",
    "country_id": 124
  },
  {
    "name": "Jufra",
    "country_id": 124
  },
  {
    "name": "Tripoli District",
    "country_id": 124
  },
  {
    "name": "Kufra District",
    "country_id": 124
  },
  {
    "name": "Wadi al Hayaa District",
    "country_id": 124
  },
  {
    "name": "Jabal al Gharbi District",
    "country_id": 124
  },
  {
    "name": "Wadi al Shatii District",
    "country_id": 124
  },
  {
    "name": "Nalut District",
    "country_id": 124
  },
  {
    "name": "Sirte District",
    "country_id": 124
  },
  {
    "name": "Misrata District",
    "country_id": 124
  },
  {
    "name": "Jafara",
    "country_id": 124
  },
  {
    "name": "Jabal al Akhdar",
    "country_id": 124
  },
  {
    "name": "Benghazi",
    "country_id": 124
  },
  {
    "name": "Ribeira Brava Municipality",
    "country_id": 40
  },
  {
    "name": "Tarrafal",
    "country_id": 40
  },
  {
    "name": "Ribeira Grande de Santiago",
    "country_id": 40
  },
  {
    "name": "Santa Catarina",
    "country_id": 40
  },
  {
    "name": "São Domingos",
    "country_id": 40
  },
  {
    "name": "Mosteiros",
    "country_id": 40
  },
  {
    "name": "Praia",
    "country_id": 40
  },
  {
    "name": "Porto Novo",
    "country_id": 40
  },
  {
    "name": "São Miguel",
    "country_id": 40
  },
  {
    "name": "Maio Municipality",
    "country_id": 40
  },
  {
    "name": "Sotavento Islands",
    "country_id": 40
  },
  {
    "name": "São Lourenço dos Órgãos",
    "country_id": 40
  },
  {
    "name": "Barlavento Islands",
    "country_id": 40
  },
  {
    "name": "Santa Catarina do Fogo",
    "country_id": 40
  },
  {
    "name": "Brava",
    "country_id": 40
  },
  {
    "name": "Paul",
    "country_id": 40
  },
  {
    "name": "Sal",
    "country_id": 40
  },
  {
    "name": "Boa Vista",
    "country_id": 40
  },
  {
    "name": "São Filipe",
    "country_id": 40
  },
  {
    "name": "São Vicente",
    "country_id": 40
  },
  {
    "name": "Ribeira Grande",
    "country_id": 40
  },
  {
    "name": "Tarrafal de São Nicolau",
    "country_id": 40
  },
  {
    "name": "Santa Cruz",
    "country_id": 40
  },
  {
    "name": "Schleswig-Holstein",
    "country_id": 82
  },
  {
    "name": "Baden-Württemberg",
    "country_id": 82
  },
  {
    "name": "Mecklenburg-Vorpommern",
    "country_id": 82
  },
  {
    "name": "Lower Saxony",
    "country_id": 82
  },
  {
    "name": "Bavaria",
    "country_id": 82
  },
  {
    "name": "Berlin",
    "country_id": 82
  },
  {
    "name": "Saxony-Anhalt",
    "country_id": 82
  },
  {
    "name": "Brandenburg",
    "country_id": 82
  },
  {
    "name": "Bremen",
    "country_id": 82
  },
  {
    "name": "Thuringia",
    "country_id": 82
  },
  {
    "name": "Hamburg",
    "country_id": 82
  },
  {
    "name": "North Rhine-Westphalia",
    "country_id": 82
  },
  {
    "name": "Hesse",
    "country_id": 82
  },
  {
    "name": "Rhineland-Palatinate",
    "country_id": 82
  },
  {
    "name": "Saarland",
    "country_id": 82
  },
  {
    "name": "Saxony",
    "country_id": 82
  },
  {
    "name": "Mafeteng District",
    "country_id": 122
  },
  {
    "name": "Mohale's Hoek District",
    "country_id": 122
  },
  {
    "name": "Mokhotlong District",
    "country_id": 122
  },
  {
    "name": "Qacha's Nek District",
    "country_id": 122
  },
  {
    "name": "Leribe District",
    "country_id": 122
  },
  {
    "name": "Quthing District",
    "country_id": 122
  },
  {
    "name": "Maseru District",
    "country_id": 122
  },
  {
    "name": "Butha-Buthe District",
    "country_id": 122
  },
  {
    "name": "Berea District",
    "country_id": 122
  },
  {
    "name": "Thaba-Tseka District",
    "country_id": 122
  },
  {
    "name": "Montserrado County",
    "country_id": 123
  },
  {
    "name": "River Cess County",
    "country_id": 123
  },
  {
    "name": "Bong County",
    "country_id": 123
  },
  {
    "name": "Sinoe County",
    "country_id": 123
  },
  {
    "name": "Grand Cape Mount County",
    "country_id": 123
  },
  {
    "name": "Lofa County",
    "country_id": 123
  },
  {
    "name": "River Gee County",
    "country_id": 123
  },
  {
    "name": "Grand Gedeh County",
    "country_id": 123
  },
  {
    "name": "Grand Bassa County",
    "country_id": 123
  },
  {
    "name": "Bomi County",
    "country_id": 123
  },
  {
    "name": "Maryland County",
    "country_id": 123
  },
  {
    "name": "Margibi County",
    "country_id": 123
  },
  {
    "name": "Gbarpolu County",
    "country_id": 123
  },
  {
    "name": "Grand Kru County",
    "country_id": 123
  },
  {
    "name": "Nimba",
    "country_id": 123
  },
  {
    "name": "Ad Dhahirah",
    "country_id": 166
  },
  {
    "name": "Al Batinah North",
    "country_id": 166
  },
  {
    "name": "Al Batinah South",
    "country_id": 166
  },
  {
    "name": "Al Batinah Region",
    "country_id": 166
  },
  {
    "name": "Ash Sharqiyah Region",
    "country_id": 166
  },
  {
    "name": "Musandam",
    "country_id": 166
  },
  {
    "name": "Ash Sharqiyah North",
    "country_id": 166
  },
  {
    "name": "Ash Sharqiyah South",
    "country_id": 166
  },
  {
    "name": "Muscat",
    "country_id": 166
  },
  {
    "name": "Al Wusta",
    "country_id": 166
  },
  {
    "name": "Dhofar",
    "country_id": 166
  },
  {
    "name": "Ad Dakhiliyah",
    "country_id": 166
  },
  {
    "name": "Al Buraimi",
    "country_id": 166
  },
  {
    "name": "Ngamiland",
    "country_id": 29
  },
  {
    "name": "Ghanzi District",
    "country_id": 29
  },
  {
    "name": "Kgatleng District",
    "country_id": 29
  },
  {
    "name": "Southern District",
    "country_id": 29
  },
  {
    "name": "South-East District",
    "country_id": 29
  },
  {
    "name": "North-West District",
    "country_id": 29
  },
  {
    "name": "Kgalagadi District",
    "country_id": 29
  },
  {
    "name": "Central District",
    "country_id": 29
  },
  {
    "name": "North-East District",
    "country_id": 29
  },
  {
    "name": "Kweneng District",
    "country_id": 29
  },
  {
    "name": "Collines Department",
    "country_id": 24
  },
  {
    "name": "Kouffo Department",
    "country_id": 24
  },
  {
    "name": "Donga Department",
    "country_id": 24
  },
  {
    "name": "Zou Department",
    "country_id": 24
  },
  {
    "name": "Plateau Department",
    "country_id": 24
  },
  {
    "name": "Mono Department",
    "country_id": 24
  },
  {
    "name": "Atakora Department",
    "country_id": 24
  },
  {
    "name": "Alibori Department",
    "country_id": 24
  },
  {
    "name": "Borgou Department",
    "country_id": 24
  },
  {
    "name": "Atlantique Department",
    "country_id": 24
  },
  {
    "name": "Ouémé Department",
    "country_id": 24
  },
  {
    "name": "Littoral Department",
    "country_id": 24
  },
  {
    "name": "Machinga District",
    "country_id": 131
  },
  {
    "name": "Zomba District",
    "country_id": 131
  },
  {
    "name": "Mwanza District",
    "country_id": 131
  },
  {
    "name": "Nsanje District",
    "country_id": 131
  },
  {
    "name": "Salima District",
    "country_id": 131
  },
  {
    "name": "Chitipa district",
    "country_id": 131
  },
  {
    "name": "Ntcheu District",
    "country_id": 131
  },
  {
    "name": "Rumphi District",
    "country_id": 131
  },
  {
    "name": "Dowa District",
    "country_id": 131
  },
  {
    "name": "Karonga District",
    "country_id": 131
  },
  {
    "name": "Central Region",
    "country_id": 131
  },
  {
    "name": "Likoma District",
    "country_id": 131
  },
  {
    "name": "Kasungu District",
    "country_id": 131
  },
  {
    "name": "Nkhata Bay District",
    "country_id": 131
  },
  {
    "name": "Balaka District",
    "country_id": 131
  },
  {
    "name": "Dedza District",
    "country_id": 131
  },
  {
    "name": "Thyolo District",
    "country_id": 131
  },
  {
    "name": "Mchinji District",
    "country_id": 131
  },
  {
    "name": "Nkhotakota District",
    "country_id": 131
  },
  {
    "name": "Lilongwe District",
    "country_id": 131
  },
  {
    "name": "Blantyre District",
    "country_id": 131
  },
  {
    "name": "Mulanje District",
    "country_id": 131
  },
  {
    "name": "Mzimba District",
    "country_id": 131
  },
  {
    "name": "Northern Region",
    "country_id": 131
  },
  {
    "name": "Southern Region",
    "country_id": 131
  },
  {
    "name": "Chikwawa District",
    "country_id": 131
  },
  {
    "name": "Phalombe District",
    "country_id": 131
  },
  {
    "name": "Chiradzulu District",
    "country_id": 131
  },
  {
    "name": "Mangochi District",
    "country_id": 131
  },
  {
    "name": "Ntchisi District",
    "country_id": 131
  },
  {
    "name": "Kénédougou Province",
    "country_id": 35
  },
  {
    "name": "Namentenga Province",
    "country_id": 35
  },
  {
    "name": "Sahel Region",
    "country_id": 35
  },
  {
    "name": "Centre-Ouest Region",
    "country_id": 35
  },
  {
    "name": "Nahouri Province",
    "country_id": 35
  },
  {
    "name": "Passoré Province",
    "country_id": 35
  },
  {
    "name": "Zoundwéogo Province",
    "country_id": 35
  },
  {
    "name": "Sissili Province",
    "country_id": 35
  },
  {
    "name": "Banwa Province",
    "country_id": 35
  },
  {
    "name": "Bougouriba Province",
    "country_id": 35
  },
  {
    "name": "Gnagna Province",
    "country_id": 35
  },
  {
    "name": "Mouhoun",
    "country_id": 35
  },
  {
    "name": "Yagha Province",
    "country_id": 35
  },
  {
    "name": "Plateau-Central Region",
    "country_id": 35
  },
  {
    "name": "Sanmatenga Province",
    "country_id": 35
  },
  {
    "name": "Centre-Nord Region",
    "country_id": 35
  },
  {
    "name": "Tapoa Province",
    "country_id": 35
  },
  {
    "name": "Houet Province",
    "country_id": 35
  },
  {
    "name": "Zondoma Province",
    "country_id": 35
  },
  {
    "name": "Boulgou",
    "country_id": 35
  },
  {
    "name": "Komondjari Province",
    "country_id": 35
  },
  {
    "name": "Koulpélogo Province",
    "country_id": 35
  },
  {
    "name": "Tuy Province",
    "country_id": 35
  },
  {
    "name": "Ioba Province",
    "country_id": 35
  },
  {
    "name": "Centre",
    "country_id": 35
  },
  {
    "name": "Sourou Province",
    "country_id": 35
  },
  {
    "name": "Boucle du Mouhoun Region",
    "country_id": 35
  },
  {
    "name": "Séno Province",
    "country_id": 35
  },
  {
    "name": "Sud-Ouest Region",
    "country_id": 35
  },
  {
    "name": "Oubritenga Province",
    "country_id": 35
  },
  {
    "name": "Nayala Province",
    "country_id": 35
  },
  {
    "name": "Gourma Province",
    "country_id": 35
  },
  {
    "name": "Oudalan Province",
    "country_id": 35
  },
  {
    "name": "Ziro Province",
    "country_id": 35
  },
  {
    "name": "Kossi Province",
    "country_id": 35
  },
  {
    "name": "Kourwéogo Province",
    "country_id": 35
  },
  {
    "name": "Ganzourgou Province",
    "country_id": 35
  },
  {
    "name": "Centre-Sud Region",
    "country_id": 35
  },
  {
    "name": "Yatenga Province",
    "country_id": 35
  },
  {
    "name": "Loroum Province",
    "country_id": 35
  },
  {
    "name": "Bazèga Province",
    "country_id": 35
  },
  {
    "name": "Cascades Region",
    "country_id": 35
  },
  {
    "name": "Sanguié Province",
    "country_id": 35
  },
  {
    "name": "Bam Province",
    "country_id": 35
  },
  {
    "name": "Noumbiel Province",
    "country_id": 35
  },
  {
    "name": "Kompienga Province",
    "country_id": 35
  },
  {
    "name": "Est Region",
    "country_id": 35
  },
  {
    "name": "Léraba Province",
    "country_id": 35
  },
  {
    "name": "Balé Province",
    "country_id": 35
  },
  {
    "name": "Kouritenga Province",
    "country_id": 35
  },
  {
    "name": "Centre-Est Region",
    "country_id": 35
  },
  {
    "name": "Poni Province",
    "country_id": 35
  },
  {
    "name": "Nord Region, Burkina Faso",
    "country_id": 35
  },
  {
    "name": "Hauts-Bassins Region",
    "country_id": 35
  },
  {
    "name": "Soum Province",
    "country_id": 35
  },
  {
    "name": "Comoé Province",
    "country_id": 35
  },
  {
    "name": "Kadiogo Province",
    "country_id": 35
  },
  {
    "name": "Islamabad Capital Territory",
    "country_id": 167
  },
  {
    "name": "Gilgit-Baltistan",
    "country_id": 167
  },
  {
    "name": "Khyber Pakhtunkhwa",
    "country_id": 167
  },
  {
    "name": "Azad Kashmir",
    "country_id": 167
  },
  {
    "name": "Federally Administered Tribal Areas",
    "country_id": 167
  },
  {
    "name": "Balochistan",
    "country_id": 167
  },
  {
    "name": "Sindh",
    "country_id": 167
  },
  {
    "name": "Punjab",
    "country_id": 167
  },
  {
    "name": "Al Rayyan Municipality",
    "country_id": 179
  },
  {
    "name": "Al-Shahaniya",
    "country_id": 179
  },
  {
    "name": "Al Wakrah",
    "country_id": 179
  },
  {
    "name": "Madinat ash Shamal",
    "country_id": 179
  },
  {
    "name": "Doha",
    "country_id": 179
  },
  {
    "name": "Al Daayen",
    "country_id": 179
  },
  {
    "name": "Al Khor",
    "country_id": 179
  },
  {
    "name": "Umm Salal Municipality",
    "country_id": 179
  },
  {
    "name": "Rumonge Province",
    "country_id": 36
  },
  {
    "name": "Muyinga Province",
    "country_id": 36
  },
  {
    "name": "Mwaro Province",
    "country_id": 36
  },
  {
    "name": "Makamba Province",
    "country_id": 36
  },
  {
    "name": "Rutana Province",
    "country_id": 36
  },
  {
    "name": "Cibitoke Province",
    "country_id": 36
  },
  {
    "name": "Ruyigi Province",
    "country_id": 36
  },
  {
    "name": "Kayanza Province",
    "country_id": 36
  },
  {
    "name": "Muramvya Province",
    "country_id": 36
  },
  {
    "name": "Karuzi Province",
    "country_id": 36
  },
  {
    "name": "Kirundo Province",
    "country_id": 36
  },
  {
    "name": "Bubanza Province",
    "country_id": 36
  },
  {
    "name": "Gitega Province",
    "country_id": 36
  },
  {
    "name": "Bujumbura Mairie Province",
    "country_id": 36
  },
  {
    "name": "Ngozi Province",
    "country_id": 36
  },
  {
    "name": "Bujumbura Rural Province",
    "country_id": 36
  },
  {
    "name": "Cankuzo Province",
    "country_id": 36
  },
  {
    "name": "Bururi Province",
    "country_id": 36
  },
  {
    "name": "Flores Department",
    "country_id": 235
  },
  {
    "name": "San José Department",
    "country_id": 235
  },
  {
    "name": "Artigas Department",
    "country_id": 235
  },
  {
    "name": "Maldonado Department",
    "country_id": 235
  },
  {
    "name": "Rivera Department",
    "country_id": 235
  },
  {
    "name": "Colonia Department",
    "country_id": 235
  },
  {
    "name": "Durazno Department",
    "country_id": 235
  },
  {
    "name": "Río Negro Department",
    "country_id": 235
  },
  {
    "name": "Cerro Largo Department",
    "country_id": 235
  },
  {
    "name": "Paysandú Department",
    "country_id": 235
  },
  {
    "name": "Canelones Department",
    "country_id": 235
  },
  {
    "name": "Treinta y Tres Department",
    "country_id": 235
  },
  {
    "name": "Lavalleja Department",
    "country_id": 235
  },
  {
    "name": "Rocha Department",
    "country_id": 235
  },
  {
    "name": "Florida Department",
    "country_id": 235
  },
  {
    "name": "Montevideo Department",
    "country_id": 235
  },
  {
    "name": "Soriano Department",
    "country_id": 235
  },
  {
    "name": "Salto Department",
    "country_id": 235
  },
  {
    "name": "Tacuarembó Department",
    "country_id": 235
  },
  {
    "name": "Kafr el-Sheikh",
    "country_id": 65
  },
  {
    "name": "Cairo",
    "country_id": 65
  },
  {
    "name": "Damietta",
    "country_id": 65
  },
  {
    "name": "Aswan",
    "country_id": 65
  },
  {
    "name": "Sohag",
    "country_id": 65
  },
  {
    "name": "North Sinai",
    "country_id": 65
  },
  {
    "name": "Monufia",
    "country_id": 65
  },
  {
    "name": "Port Said",
    "country_id": 65
  },
  {
    "name": "Beni Suef",
    "country_id": 65
  },
  {
    "name": "Matrouh",
    "country_id": 65
  },
  {
    "name": "Qalyubia",
    "country_id": 65
  },
  {
    "name": "Suez",
    "country_id": 65
  },
  {
    "name": "Gharbia",
    "country_id": 65
  },
  {
    "name": "Alexandria",
    "country_id": 65
  },
  {
    "name": "Asyut",
    "country_id": 65
  },
  {
    "name": "South Sinai",
    "country_id": 65
  },
  {
    "name": "Faiyum",
    "country_id": 65
  },
  {
    "name": "Giza",
    "country_id": 65
  },
  {
    "name": "Red Sea",
    "country_id": 65
  },
  {
    "name": "Beheira",
    "country_id": 65
  },
  {
    "name": "Luxor",
    "country_id": 65
  },
  {
    "name": "Minya",
    "country_id": 65
  },
  {
    "name": "Ismailia",
    "country_id": 65
  },
  {
    "name": "Dakahlia",
    "country_id": 65
  },
  {
    "name": "New Valley",
    "country_id": 65
  },
  {
    "name": "Qena",
    "country_id": 65
  },
  {
    "name": "Agalega Islands",
    "country_id": 140
  },
  {
    "name": "Rodrigues Island",
    "country_id": 140
  },
  {
    "name": "Pamplemousses",
    "country_id": 140
  },
  {
    "name": "Saint Brandon Islands",
    "country_id": 140
  },
  {
    "name": "Moka",
    "country_id": 140
  },
  {
    "name": "Flacq",
    "country_id": 140
  },
  {
    "name": "Savanne",
    "country_id": 140
  },
  {
    "name": "Black River",
    "country_id": 140
  },
  {
    "name": "Port Louis",
    "country_id": 140
  },
  {
    "name": "Rivière du Rempart",
    "country_id": 140
  },
  {
    "name": "Plaines Wilhems",
    "country_id": 140
  },
  {
    "name": "Grand Port",
    "country_id": 140
  },
  {
    "name": "Guelmim",
    "country_id": 149
  },
  {
    "name": "Aousserd (EH)",
    "country_id": 149
  },
  {
    "name": "Al Hoceïma",
    "country_id": 149
  },
  {
    "name": "Larache",
    "country_id": 149
  },
  {
    "name": "Ouarzazate",
    "country_id": 149
  },
  {
    "name": "Boulemane",
    "country_id": 149
  },
  {
    "name": "L'Oriental",
    "country_id": 149
  },
  {
    "name": "Béni Mellal",
    "country_id": 149
  },
  {
    "name": "Chichaoua",
    "country_id": 149
  },
  {
    "name": "Boujdour (EH)",
    "country_id": 149
  },
  {
    "name": "Khémisset",
    "country_id": 149
  },
  {
    "name": "Tiznit",
    "country_id": 149
  },
  {
    "name": "Béni Mellal-Khénifra",
    "country_id": 149
  },
  {
    "name": "Sidi Kacem",
    "country_id": 149
  },
  {
    "name": "El Jadida",
    "country_id": 149
  },
  {
    "name": "Nador",
    "country_id": 149
  },
  {
    "name": "Settat",
    "country_id": 149
  },
  {
    "name": "Zagora",
    "country_id": 149
  },
  {
    "name": "Médiouna",
    "country_id": 149
  },
  {
    "name": "Berkane",
    "country_id": 149
  },
  {
    "name": "Tan-Tan (EH-partial)",
    "country_id": 149
  },
  {
    "name": "Nouaceur",
    "country_id": 149
  },
  {
    "name": "Marrakesh-Safi",
    "country_id": 149
  },
  {
    "name": "Sefrou",
    "country_id": 149
  },
  {
    "name": "Drâa-Tafilalet",
    "country_id": 149
  },
  {
    "name": "El Hajeb",
    "country_id": 149
  },
  {
    "name": "Es-Semara (EH-partial)",
    "country_id": 149
  },
  {
    "name": "Laâyoune (EH)",
    "country_id": 149
  },
  {
    "name": "Inezgane-Ait Melloul",
    "country_id": 149
  },
  {
    "name": "Souss-Massa",
    "country_id": 149
  },
  {
    "name": "Taza",
    "country_id": 149
  },
  {
    "name": "Assa-Zag (EH-partial)",
    "country_id": 149
  },
  {
    "name": "Laâyoune-Sakia El Hamra (EH-partial)",
    "country_id": 149
  },
  {
    "name": "Errachidia",
    "country_id": 149
  },
  {
    "name": "Fahs-Anjra",
    "country_id": 149
  },
  {
    "name": "Figuig",
    "country_id": 149
  },
  {
    "name": "Chtouka-Ait Baha",
    "country_id": 149
  },
  {
    "name": "Casablanca-Settat",
    "country_id": 149
  },
  {
    "name": "Benslimane",
    "country_id": 149
  },
  {
    "name": "Guelmim-Oued Noun (EH-partial)",
    "country_id": 149
  },
  {
    "name": "Dakhla-Oued Ed-Dahab (EH)",
    "country_id": 149
  },
  {
    "name": "Jerada",
    "country_id": 149
  },
  {
    "name": "Kénitra",
    "country_id": 149
  },
  {
    "name": "El Kelâa des Sraghna",
    "country_id": 149
  },
  {
    "name": "Chefchaouen",
    "country_id": 149
  },
  {
    "name": "Safi",
    "country_id": 149
  },
  {
    "name": "Tata",
    "country_id": 149
  },
  {
    "name": "Fès-Meknès",
    "country_id": 149
  },
  {
    "name": "Taroudannt",
    "country_id": 149
  },
  {
    "name": "Moulay Yacoub",
    "country_id": 149
  },
  {
    "name": "Essaouira",
    "country_id": 149
  },
  {
    "name": "Khénifra",
    "country_id": 149
  },
  {
    "name": "Tétouan",
    "country_id": 149
  },
  {
    "name": "Oued Ed-Dahab (EH)",
    "country_id": 149
  },
  {
    "name": "Al Haouz",
    "country_id": 149
  },
  {
    "name": "Azilal",
    "country_id": 149
  },
  {
    "name": "Taourirt",
    "country_id": 149
  },
  {
    "name": "Taounate",
    "country_id": 149
  },
  {
    "name": "Tanger-Tétouan-Al Hoceïma",
    "country_id": 149
  },
  {
    "name": "Ifrane",
    "country_id": 149
  },
  {
    "name": "Khouribga",
    "country_id": 149
  },
  {
    "name": "Cabo Delgado Province",
    "country_id": 150
  },
  {
    "name": "Zambezia Province",
    "country_id": 150
  },
  {
    "name": "Gaza Province",
    "country_id": 150
  },
  {
    "name": "Inhambane Province",
    "country_id": 150
  },
  {
    "name": "Sofala Province",
    "country_id": 150
  },
  {
    "name": "Maputo Province",
    "country_id": 150
  },
  {
    "name": "Niassa Province",
    "country_id": 150
  },
  {
    "name": "Tete Province",
    "country_id": 150
  },
  {
    "name": "Maputo",
    "country_id": 150
  },
  {
    "name": "Nampula Province",
    "country_id": 150
  },
  {
    "name": "Manica Province",
    "country_id": 150
  },
  {
    "name": "Hodh Ech Chargui",
    "country_id": 139
  },
  {
    "name": "Brakna",
    "country_id": 139
  },
  {
    "name": "Tiris Zemmour",
    "country_id": 139
  },
  {
    "name": "Gorgol",
    "country_id": 139
  },
  {
    "name": "Inchiri",
    "country_id": 139
  },
  {
    "name": "Nouakchott-Nord",
    "country_id": 139
  },
  {
    "name": "Adrar",
    "country_id": 139
  },
  {
    "name": "Tagant",
    "country_id": 139
  },
  {
    "name": "Dakhlet Nouadhibou",
    "country_id": 139
  },
  {
    "name": "Nouakchott-Sud",
    "country_id": 139
  },
  {
    "name": "Trarza",
    "country_id": 139
  },
  {
    "name": "Assaba",
    "country_id": 139
  },
  {
    "name": "Guidimaka",
    "country_id": 139
  },
  {
    "name": "Hodh El Gharbi",
    "country_id": 139
  },
  {
    "name": "Nouakchott-Ouest",
    "country_id": 139
  },
  {
    "name": "Western Tobago",
    "country_id": 223
  },
  {
    "name": "Couva-Tabaquite-Talparo Regional Corporation",
    "country_id": 223
  },
  {
    "name": "Eastern Tobago",
    "country_id": 223
  },
  {
    "name": "Rio Claro-Mayaro Regional Corporation",
    "country_id": 223
  },
  {
    "name": "San Juan-Laventille Regional Corporation",
    "country_id": 223
  },
  {
    "name": "Tunapuna-Piarco Regional Corporation",
    "country_id": 223
  },
  {
    "name": "San Fernando",
    "country_id": 223
  },
  {
    "name": "Point Fortin",
    "country_id": 223
  },
  {
    "name": "Sangre Grande Regional Corporation",
    "country_id": 223
  },
  {
    "name": "Arima",
    "country_id": 223
  },
  {
    "name": "Port of Spain",
    "country_id": 223
  },
  {
    "name": "Siparia Regional Corporation",
    "country_id": 223
  },
  {
    "name": "Penal-Debe Regional Corporation",
    "country_id": 223
  },
  {
    "name": "Chaguanas",
    "country_id": 223
  },
  {
    "name": "Diego Martin Regional Corporation",
    "country_id": 223
  },
  {
    "name": "Princes Town Regional Corporation",
    "country_id": 223
  },
  {
    "name": "Mary Region",
    "country_id": 226
  },
  {
    "name": "Lebap Region",
    "country_id": 226
  },
  {
    "name": "Ashgabat",
    "country_id": 226
  },
  {
    "name": "Balkan Region",
    "country_id": 226
  },
  {
    "name": "Daşoguz Region",
    "country_id": 226
  },
  {
    "name": "Ahal Region",
    "country_id": 226
  },
  {
    "name": "Beni Department",
    "country_id": 27
  },
  {
    "name": "Oruro Department",
    "country_id": 27
  },
  {
    "name": "Santa Cruz Department",
    "country_id": 27
  },
  {
    "name": "Tarija Department",
    "country_id": 27
  },
  {
    "name": "Pando Department",
    "country_id": 27
  },
  {
    "name": "La Paz Department",
    "country_id": 27
  },
  {
    "name": "Cochabamba Department",
    "country_id": 27
  },
  {
    "name": "Chuquisaca Department",
    "country_id": 27
  },
  {
    "name": "Potosí Department",
    "country_id": 27
  },
  {
    "name": "Saint George Parish",
    "country_id": 188
  },
  {
    "name": "Saint Patrick Parish",
    "country_id": 188
  },
  {
    "name": "Saint Andrew Parish",
    "country_id": 188
  },
  {
    "name": "Saint David Parish",
    "country_id": 188
  },
  {
    "name": "Grenadines Parish",
    "country_id": 188
  },
  {
    "name": "Charlotte Parish",
    "country_id": 188
  },
  {
    "name": "Sharjah Emirate",
    "country_id": 231
  },
  {
    "name": "Dubai",
    "country_id": 231
  },
  {
    "name": "Umm al-Quwain",
    "country_id": 231
  },
  {
    "name": "Fujairah",
    "country_id": 231
  },
  {
    "name": "Ras al-Khaimah",
    "country_id": 231
  },
  {
    "name": "Ajman Emirate",
    "country_id": 231
  },
  {
    "name": "Abu Dhabi Emirate",
    "country_id": 231
  },
  {
    "name": "districts of Republican Subordination",
    "country_id": 217
  },
  {
    "name": "Khatlon Province",
    "country_id": 217
  },
  {
    "name": "Gorno-Badakhshan Autonomous Province",
    "country_id": 217
  },
  {
    "name": "Sughd Province",
    "country_id": 217
  },
  {
    "name": "Yilan",
    "country_id": 216
  },
  {
    "name": "Penghu",
    "country_id": 216
  },
  {
    "name": "Changhua",
    "country_id": 216
  },
  {
    "name": "Pingtung",
    "country_id": 216
  },
  {
    "name": "Taichung",
    "country_id": 216
  },
  {
    "name": "Nantou",
    "country_id": 216
  },
  {
    "name": "Chiayi",
    "country_id": 216
  },
  {
    "name": "Taitung",
    "country_id": 216
  },
  {
    "name": "Hualien",
    "country_id": 216
  },
  {
    "name": "Kaohsiung",
    "country_id": 216
  },
  {
    "name": "Miaoli",
    "country_id": 216
  },
  {
    "name": "Kinmen",
    "country_id": 216
  },
  {
    "name": "Yunlin",
    "country_id": 216
  },
  {
    "name": "Hsinchu",
    "country_id": 216
  },
  {
    "name": "Chiayi",
    "country_id": 216
  },
  {
    "name": "Taoyuan",
    "country_id": 216
  },
  {
    "name": "Lienchiang",
    "country_id": 216
  },
  {
    "name": "Tainan",
    "country_id": 216
  },
  {
    "name": "Taipei",
    "country_id": 216
  },
  {
    "name": "Hsinchu",
    "country_id": 216
  },
  {
    "name": "Northern Red Sea Region",
    "country_id": 68
  },
  {
    "name": "Anseba Region",
    "country_id": 68
  },
  {
    "name": "Maekel Region",
    "country_id": 68
  },
  {
    "name": "Debub Region",
    "country_id": 68
  },
  {
    "name": "Gash-Barka Region",
    "country_id": 68
  },
  {
    "name": "Southern Red Sea Region",
    "country_id": 68
  },
  {
    "name": "Southern Peninsula Region",
    "country_id": 100
  },
  {
    "name": "Capital Region",
    "country_id": 100
  },
  {
    "name": "Westfjords",
    "country_id": 100
  },
  {
    "name": "Eastern Region",
    "country_id": 100
  },
  {
    "name": "Southern Region",
    "country_id": 100
  },
  {
    "name": "Northwestern Region",
    "country_id": 100
  },
  {
    "name": "Western Region",
    "country_id": 100
  },
  {
    "name": "Northeastern Region",
    "country_id": 100
  },
  {
    "name": "Río Muni",
    "country_id": 67
  },
  {
    "name": "Kié-Ntem Province",
    "country_id": 67
  },
  {
    "name": "Wele-Nzas Province",
    "country_id": 67
  },
  {
    "name": "Litoral Province",
    "country_id": 67
  },
  {
    "name": "Insular Region",
    "country_id": 67
  },
  {
    "name": "Bioko Sur Province",
    "country_id": 67
  },
  {
    "name": "Annobón Province",
    "country_id": 67
  },
  {
    "name": "Centro Sur Province",
    "country_id": 67
  },
  {
    "name": "Bioko Norte Province",
    "country_id": 67
  },
  {
    "name": "Chihuahua",
    "country_id": 142
  },
  {
    "name": "Oaxaca",
    "country_id": 142
  },
  {
    "name": "Sinaloa",
    "country_id": 142
  },
  {
    "name": "Estado de México",
    "country_id": 142
  },
  {
    "name": "Chiapas",
    "country_id": 142
  },
  {
    "name": "Nuevo León",
    "country_id": 142
  },
  {
    "name": "Durango",
    "country_id": 142
  },
  {
    "name": "Tabasco",
    "country_id": 142
  },
  {
    "name": "Querétaro",
    "country_id": 142
  },
  {
    "name": "Aguascalientes",
    "country_id": 142
  },
  {
    "name": "Baja California",
    "country_id": 142
  },
  {
    "name": "Tlaxcala",
    "country_id": 142
  },
  {
    "name": "Guerrero",
    "country_id": 142
  },
  {
    "name": "Baja California Sur",
    "country_id": 142
  },
  {
    "name": "San Luis Potosí",
    "country_id": 142
  },
  {
    "name": "Zacatecas",
    "country_id": 142
  },
  {
    "name": "Tamaulipas",
    "country_id": 142
  },
  {
    "name": "Veracruz de Ignacio de la Llave",
    "country_id": 142
  },
  {
    "name": "Morelos",
    "country_id": 142
  },
  {
    "name": "Yucatán",
    "country_id": 142
  },
  {
    "name": "Quintana Roo",
    "country_id": 142
  },
  {
    "name": "Sonora",
    "country_id": 142
  },
  {
    "name": "Guanajuato",
    "country_id": 142
  },
  {
    "name": "Hidalgo",
    "country_id": 142
  },
  {
    "name": "Coahuila de Zaragoza",
    "country_id": 142
  },
  {
    "name": "Colima",
    "country_id": 142
  },
  {
    "name": "Ciudad de México",
    "country_id": 142
  },
  {
    "name": "Michoacán de Ocampo",
    "country_id": 142
  },
  {
    "name": "Campeche",
    "country_id": 142
  },
  {
    "name": "Puebla",
    "country_id": 142
  },
  {
    "name": "Nayarit",
    "country_id": 142
  },
  {
    "name": "Krabi",
    "country_id": 219
  },
  {
    "name": "Ranong",
    "country_id": 219
  },
  {
    "name": "Nong Bua Lam Phu",
    "country_id": 219
  },
  {
    "name": "Samut Prakan",
    "country_id": 219
  },
  {
    "name": "Surat Thani",
    "country_id": 219
  },
  {
    "name": "Lamphun",
    "country_id": 219
  },
  {
    "name": "Nong Khai",
    "country_id": 219
  },
  {
    "name": "Khon Kaen",
    "country_id": 219
  },
  {
    "name": "Chanthaburi",
    "country_id": 219
  },
  {
    "name": "Saraburi",
    "country_id": 219
  },
  {
    "name": "Phatthalung",
    "country_id": 219
  },
  {
    "name": "Uttaradit",
    "country_id": 219
  },
  {
    "name": "Sing Buri",
    "country_id": 219
  },
  {
    "name": "Chiang Mai",
    "country_id": 219
  },
  {
    "name": "Nakhon Sawan",
    "country_id": 219
  },
  {
    "name": "Yala",
    "country_id": 219
  },
  {
    "name": "Phra Nakhon Si Ayutthaya",
    "country_id": 219
  },
  {
    "name": "Nonthaburi",
    "country_id": 219
  },
  {
    "name": "Trat",
    "country_id": 219
  },
  {
    "name": "Nakhon Ratchasima",
    "country_id": 219
  },
  {
    "name": "Chiang Rai",
    "country_id": 219
  },
  {
    "name": "Ratchaburi",
    "country_id": 219
  },
  {
    "name": "Pathum Thani",
    "country_id": 219
  },
  {
    "name": "Sakon Nakhon",
    "country_id": 219
  },
  {
    "name": "Samut Songkhram",
    "country_id": 219
  },
  {
    "name": "Nakhon Pathom",
    "country_id": 219
  },
  {
    "name": "Samut Sakhon",
    "country_id": 219
  },
  {
    "name": "Mae Hong Son",
    "country_id": 219
  },
  {
    "name": "Phitsanulok",
    "country_id": 219
  },
  {
    "name": "Pattaya",
    "country_id": 219
  },
  {
    "name": "Prachuap Khiri Khan",
    "country_id": 219
  },
  {
    "name": "Loei",
    "country_id": 219
  },
  {
    "name": "Roi Et",
    "country_id": 219
  },
  {
    "name": "Kanchanaburi",
    "country_id": 219
  },
  {
    "name": "Ubon Ratchathani",
    "country_id": 219
  },
  {
    "name": "Chon Buri",
    "country_id": 219
  },
  {
    "name": "Phichit",
    "country_id": 219
  },
  {
    "name": "Phetchabun",
    "country_id": 219
  },
  {
    "name": "Kamphaeng Phet",
    "country_id": 219
  },
  {
    "name": "Maha Sarakham",
    "country_id": 219
  },
  {
    "name": "Rayong",
    "country_id": 219
  },
  {
    "name": "Ang Thong",
    "country_id": 219
  },
  {
    "name": "Nakhon Si Thammarat",
    "country_id": 219
  },
  {
    "name": "Yasothon",
    "country_id": 219
  },
  {
    "name": "Chai Nat",
    "country_id": 219
  },
  {
    "name": "Amnat Charoen",
    "country_id": 219
  },
  {
    "name": "Suphan Buri",
    "country_id": 219
  },
  {
    "name": "Tak",
    "country_id": 219
  },
  {
    "name": "Chumphon",
    "country_id": 219
  },
  {
    "name": "Udon Thani",
    "country_id": 219
  },
  {
    "name": "Phrae",
    "country_id": 219
  },
  {
    "name": "Sa Kaeo",
    "country_id": 219
  },
  {
    "name": "Nan",
    "country_id": 219
  },
  {
    "name": "Surin",
    "country_id": 219
  },
  {
    "name": "Phetchaburi",
    "country_id": 219
  },
  {
    "name": "Bueng Kan",
    "country_id": 219
  },
  {
    "name": "Buri Ram",
    "country_id": 219
  },
  {
    "name": "Nakhon Nayok",
    "country_id": 219
  },
  {
    "name": "Phuket",
    "country_id": 219
  },
  {
    "name": "Satun",
    "country_id": 219
  },
  {
    "name": "Phayao",
    "country_id": 219
  },
  {
    "name": "Songkhla",
    "country_id": 219
  },
  {
    "name": "Pattani",
    "country_id": 219
  },
  {
    "name": "Trang",
    "country_id": 219
  },
  {
    "name": "Prachin Buri",
    "country_id": 219
  },
  {
    "name": "Lop Buri",
    "country_id": 219
  },
  {
    "name": "Lampang",
    "country_id": 219
  },
  {
    "name": "Sukhothai",
    "country_id": 219
  },
  {
    "name": "Mukdahan",
    "country_id": 219
  },
  {
    "name": "Si Sa Ket",
    "country_id": 219
  },
  {
    "name": "Nakhon Phanom",
    "country_id": 219
  },
  {
    "name": "Phangnga",
    "country_id": 219
  },
  {
    "name": "Kalasin",
    "country_id": 219
  },
  {
    "name": "Uthai Thani",
    "country_id": 219
  },
  {
    "name": "Chachoengsao",
    "country_id": 219
  },
  {
    "name": "Narathiwat",
    "country_id": 219
  },
  {
    "name": "Bangkok",
    "country_id": 219
  },
  {
    "name": "Hiiu County",
    "country_id": 69
  },
  {
    "name": "Viljandi County",
    "country_id": 69
  },
  {
    "name": "Tartu County",
    "country_id": 69
  },
  {
    "name": "Valga County",
    "country_id": 69
  },
  {
    "name": "Rapla County",
    "country_id": 69
  },
  {
    "name": "Võru County",
    "country_id": 69
  },
  {
    "name": "Saare County",
    "country_id": 69
  },
  {
    "name": "Pärnu County",
    "country_id": 69
  },
  {
    "name": "Põlva County",
    "country_id": 69
  },
  {
    "name": "Lääne-Viru County",
    "country_id": 69
  },
  {
    "name": "Jõgeva County",
    "country_id": 69
  },
  {
    "name": "Järva County",
    "country_id": 69
  },
  {
    "name": "Harju County",
    "country_id": 69
  },
  {
    "name": "Lääne County",
    "country_id": 69
  },
  {
    "name": "Ida-Viru County",
    "country_id": 69
  },
  {
    "name": "Moyen-Chari",
    "country_id": 43
  },
  {
    "name": "Mayo-Kebbi Ouest",
    "country_id": 43
  },
  {
    "name": "Sila",
    "country_id": 43
  },
  {
    "name": "Hadjer-Lamis",
    "country_id": 43
  },
  {
    "name": "Borkou",
    "country_id": 43
  },
  {
    "name": "Ennedi-Est",
    "country_id": 43
  },
  {
    "name": "Guéra",
    "country_id": 43
  },
  {
    "name": "Lac",
    "country_id": 43
  },
  {
    "name": "Tandjilé",
    "country_id": 43
  },
  {
    "name": "Mayo-Kebbi Est",
    "country_id": 43
  },
  {
    "name": "Wadi Fira",
    "country_id": 43
  },
  {
    "name": "Ouaddaï",
    "country_id": 43
  },
  {
    "name": "Bahr el Gazel",
    "country_id": 43
  },
  {
    "name": "Ennedi-Ouest",
    "country_id": 43
  },
  {
    "name": "Logone Occidental",
    "country_id": 43
  },
  {
    "name": "N'Djamena",
    "country_id": 43
  },
  {
    "name": "Tibesti",
    "country_id": 43
  },
  {
    "name": "Kanem",
    "country_id": 43
  },
  {
    "name": "Mandoul",
    "country_id": 43
  },
  {
    "name": "Batha",
    "country_id": 43
  },
  {
    "name": "Logone Oriental",
    "country_id": 43
  },
  {
    "name": "Salamat",
    "country_id": 43
  },
  {
    "name": "Berry Islands",
    "country_id": 17
  },
  {
    "name": "Nichollstown and Berry Islands",
    "country_id": 17
  },
  {
    "name": "Green Turtle Cay",
    "country_id": 17
  },
  {
    "name": "Central Eleuthera",
    "country_id": 17
  },
  {
    "name": "Governor's Harbour",
    "country_id": 17
  },
  {
    "name": "High Rock",
    "country_id": 17
  },
  {
    "name": "West Grand Bahama",
    "country_id": 17
  },
  {
    "name": "Rum Cay District",
    "country_id": 17
  },
  {
    "name": "Acklins",
    "country_id": 17
  },
  {
    "name": "North Eleuthera",
    "country_id": 17
  },
  {
    "name": "Central Abaco",
    "country_id": 17
  },
  {
    "name": "Marsh Harbour",
    "country_id": 17
  },
  {
    "name": "Black Point",
    "country_id": 17
  },
  {
    "name": "Sandy Point",
    "country_id": 17
  },
  {
    "name": "South Eleuthera",
    "country_id": 17
  },
  {
    "name": "South Abaco",
    "country_id": 17
  },
  {
    "name": "Inagua",
    "country_id": 17
  },
  {
    "name": "Long Island",
    "country_id": 17
  },
  {
    "name": "Cat Island",
    "country_id": 17
  },
  {
    "name": "Exuma",
    "country_id": 17
  },
  {
    "name": "Harbour Island",
    "country_id": 17
  },
  {
    "name": "East Grand Bahama",
    "country_id": 17
  },
  {
    "name": "Ragged Island",
    "country_id": 17
  },
  {
    "name": "North Abaco",
    "country_id": 17
  },
  {
    "name": "North Andros",
    "country_id": 17
  },
  {
    "name": "Kemps Bay",
    "country_id": 17
  },
  {
    "name": "Fresh Creek",
    "country_id": 17
  },
  {
    "name": "San Salvador and Rum Cay",
    "country_id": 17
  },
  {
    "name": "Crooked Island",
    "country_id": 17
  },
  {
    "name": "South Andros",
    "country_id": 17
  },
  {
    "name": "Rock Sound",
    "country_id": 17
  },
  {
    "name": "Hope Town",
    "country_id": 17
  },
  {
    "name": "Mangrove Cay",
    "country_id": 17
  },
  {
    "name": "Freeport",
    "country_id": 17
  },
  {
    "name": "San Salvador Island",
    "country_id": 17
  },
  {
    "name": "Acklins and Crooked Islands",
    "country_id": 17
  },
  {
    "name": "Bimini",
    "country_id": 17
  },
  {
    "name": "Spanish Wells",
    "country_id": 17
  },
  {
    "name": "Central Andros",
    "country_id": 17
  },
  {
    "name": "Grand Cay",
    "country_id": 17
  },
  {
    "name": "Mayaguana District",
    "country_id": 17
  },
  {
    "name": "San Juan",
    "country_id": 11
  },
  {
    "name": "Santiago del Estero",
    "country_id": 11
  },
  {
    "name": "San Luis",
    "country_id": 11
  },
  {
    "name": "Tucumán",
    "country_id": 11
  },
  {
    "name": "Corrientes",
    "country_id": 11
  },
  {
    "name": "Río Negro",
    "country_id": 11
  },
  {
    "name": "Chaco",
    "country_id": 11
  },
  {
    "name": "Santa Fe",
    "country_id": 11
  },
  {
    "name": "Córdoba",
    "country_id": 11
  },
  {
    "name": "Salta",
    "country_id": 11
  },
  {
    "name": "Misiones",
    "country_id": 11
  },
  {
    "name": "Jujuy",
    "country_id": 11
  },
  {
    "name": "Mendoza",
    "country_id": 11
  },
  {
    "name": "Catamarca",
    "country_id": 11
  },
  {
    "name": "Neuquén",
    "country_id": 11
  },
  {
    "name": "Santa Cruz",
    "country_id": 11
  },
  {
    "name": "Tierra del Fuego",
    "country_id": 11
  },
  {
    "name": "Chubut",
    "country_id": 11
  },
  {
    "name": "Formosa",
    "country_id": 11
  },
  {
    "name": "La Rioja",
    "country_id": 11
  },
  {
    "name": "Entre Ríos",
    "country_id": 11
  },
  {
    "name": "La Pampa",
    "country_id": 11
  },
  {
    "name": "Buenos Aires",
    "country_id": 11
  },
  {
    "name": "Quiché Department",
    "country_id": 90
  },
  {
    "name": "Jalapa Department",
    "country_id": 90
  },
  {
    "name": "Izabal Department",
    "country_id": 90
  },
  {
    "name": "Suchitepéquez Department",
    "country_id": 90
  },
  {
    "name": "Sololá Department",
    "country_id": 90
  },
  {
    "name": "El Progreso Department",
    "country_id": 90
  },
  {
    "name": "Totonicapán Department",
    "country_id": 90
  },
  {
    "name": "Retalhuleu Department",
    "country_id": 90
  },
  {
    "name": "Santa Rosa Department",
    "country_id": 90
  },
  {
    "name": "Chiquimula Department",
    "country_id": 90
  },
  {
    "name": "San Marcos Department",
    "country_id": 90
  },
  {
    "name": "Quetzaltenango Department",
    "country_id": 90
  },
  {
    "name": "Petén Department",
    "country_id": 90
  },
  {
    "name": "Huehuetenango Department",
    "country_id": 90
  },
  {
    "name": "Alta Verapaz Department",
    "country_id": 90
  },
  {
    "name": "Guatemala Department",
    "country_id": 90
  },
  {
    "name": "Jutiapa Department",
    "country_id": 90
  },
  {
    "name": "Baja Verapaz Department",
    "country_id": 90
  },
  {
    "name": "Chimaltenango Department",
    "country_id": 90
  },
  {
    "name": "Sacatepéquez Department",
    "country_id": 90
  },
  {
    "name": "Escuintla Department",
    "country_id": 90
  },
  {
    "name": "Madre de Dios",
    "country_id": 173
  },
  {
    "name": "Huancavelica",
    "country_id": 173
  },
  {
    "name": "Áncash",
    "country_id": 173
  },
  {
    "name": "Arequipa",
    "country_id": 173
  },
  {
    "name": "Puno",
    "country_id": 173
  },
  {
    "name": "La Libertad",
    "country_id": 173
  },
  {
    "name": "Ucayali",
    "country_id": 173
  },
  {
    "name": "Amazonas",
    "country_id": 173
  },
  {
    "name": "Pasco",
    "country_id": 173
  },
  {
    "name": "Huanuco",
    "country_id": 173
  },
  {
    "name": "Cajamarca",
    "country_id": 173
  },
  {
    "name": "Tumbes",
    "country_id": 173
  },
  {
    "name": "Cusco",
    "country_id": 173
  },
  {
    "name": "Ayacucho",
    "country_id": 173
  },
  {
    "name": "Junín",
    "country_id": 173
  },
  {
    "name": "San Martín",
    "country_id": 173
  },
  {
    "name": "Lima",
    "country_id": 173
  },
  {
    "name": "Tacna",
    "country_id": 173
  },
  {
    "name": "Piura",
    "country_id": 173
  },
  {
    "name": "Moquegua",
    "country_id": 173
  },
  {
    "name": "Apurímac",
    "country_id": 173
  },
  {
    "name": "Ica",
    "country_id": 173
  },
  {
    "name": "Callao",
    "country_id": 173
  },
  {
    "name": "Lambayeque",
    "country_id": 173
  },
  {
    "name": "Redonda",
    "country_id": 10
  },
  {
    "name": "Saint Peter Parish",
    "country_id": 10
  },
  {
    "name": "Saint Paul Parish",
    "country_id": 10
  },
  {
    "name": "Saint John Parish",
    "country_id": 10
  },
  {
    "name": "Saint Mary Parish",
    "country_id": 10
  },
  {
    "name": "Barbuda",
    "country_id": 10
  },
  {
    "name": "Saint George Parish",
    "country_id": 10
  },
  {
    "name": "Saint Philip Parish",
    "country_id": 10
  },
  {
    "name": "South Bačka District",
    "country_id": 196
  },
  {
    "name": "Pirot District",
    "country_id": 196
  },
  {
    "name": "South Banat District",
    "country_id": 196
  },
  {
    "name": "North Bačka District",
    "country_id": 196
  },
  {
    "name": "Jablanica District",
    "country_id": 196
  },
  {
    "name": "Central Banat District",
    "country_id": 196
  },
  {
    "name": "Bor District",
    "country_id": 196
  },
  {
    "name": "Toplica District",
    "country_id": 196
  },
  {
    "name": "Mačva District",
    "country_id": 196
  },
  {
    "name": "Rasina District",
    "country_id": 196
  },
  {
    "name": "Pčinja District",
    "country_id": 196
  },
  {
    "name": "Nišava District",
    "country_id": 196
  },
  {
    "name": "Prizren District",
    "country_id": 248
  },
  {
    "name": "Kolubara District",
    "country_id": 196
  },
  {
    "name": "Raška District",
    "country_id": 196
  },
  {
    "name": "West Bačka District",
    "country_id": 196
  },
  {
    "name": "Moravica District",
    "country_id": 196
  },
  {
    "name": "Belgrade",
    "country_id": 196
  },
  {
    "name": "Zlatibor District",
    "country_id": 196
  },
  {
    "name": "Zaječar District",
    "country_id": 196
  },
  {
    "name": "Braničevo District",
    "country_id": 196
  },
  {
    "name": "Vojvodina",
    "country_id": 196
  },
  {
    "name": "Šumadija District",
    "country_id": 196
  },
  {
    "name": "North Banat District",
    "country_id": 196
  },
  {
    "name": "Pomoravlje District",
    "country_id": 196
  },
  {
    "name": "Peć District",
    "country_id": 248
  },
  {
    "name": "Srem District",
    "country_id": 196
  },
  {
    "name": "Podunavlje District",
    "country_id": 196
  },
  {
    "name": "Westmoreland Parish",
    "country_id": 108
  },
  {
    "name": "Saint Elizabeth Parish",
    "country_id": 108
  },
  {
    "name": "Saint Ann Parish",
    "country_id": 108
  },
  {
    "name": "Saint James Parish",
    "country_id": 108
  },
  {
    "name": "Saint Catherine Parish",
    "country_id": 108
  },
  {
    "name": "Saint Mary Parish",
    "country_id": 108
  },
  {
    "name": "Kingston Parish",
    "country_id": 108
  },
  {
    "name": "Hanover Parish",
    "country_id": 108
  },
  {
    "name": "Saint Thomas Parish",
    "country_id": 108
  },
  {
    "name": "Saint Andrew",
    "country_id": 108
  },
  {
    "name": "Portland Parish",
    "country_id": 108
  },
  {
    "name": "Clarendon Parish",
    "country_id": 108
  },
  {
    "name": "Manchester Parish",
    "country_id": 108
  },
  {
    "name": "Trelawny Parish",
    "country_id": 108
  },
  {
    "name": "Dennery Quarter",
    "country_id": 186
  },
  {
    "name": "Anse la Raye Quarter",
    "country_id": 186
  },
  {
    "name": "Castries Quarter",
    "country_id": 186
  },
  {
    "name": "Laborie Quarter",
    "country_id": 186
  },
  {
    "name": "Choiseul Quarter",
    "country_id": 186
  },
  {
    "name": "Canaries",
    "country_id": 186
  },
  {
    "name": "Micoud Quarter",
    "country_id": 186
  },
  {
    "name": "Vieux Fort Quarter",
    "country_id": 186
  },
  {
    "name": "Soufrière Quarter",
    "country_id": 186
  },
  {
    "name": "Praslin Quarter",
    "country_id": 186
  },
  {
    "name": "Gros Islet Quarter",
    "country_id": 186
  },
  {
    "name": "Dauphin Quarter",
    "country_id": 186
  },
  {
    "name": "Hưng Yên",
    "country_id": 240
  },
  {
    "name": "Đồng Tháp",
    "country_id": 240
  },
  {
    "name": "Bà Rịa-Vũng Tàu",
    "country_id": 240
  },
  {
    "name": "Thanh Hóa",
    "country_id": 240
  },
  {
    "name": "Kon Tum",
    "country_id": 240
  },
  {
    "name": "Điện Biên",
    "country_id": 240
  },
  {
    "name": "Vĩnh Phúc",
    "country_id": 240
  },
  {
    "name": "Thái Bình",
    "country_id": 240
  },
  {
    "name": "Quảng Nam",
    "country_id": 240
  },
  {
    "name": "Hậu Giang",
    "country_id": 240
  },
  {
    "name": "Cà Mau",
    "country_id": 240
  },
  {
    "name": "Hà Giang",
    "country_id": 240
  },
  {
    "name": "Nghệ An",
    "country_id": 240
  },
  {
    "name": "Tiền Giang",
    "country_id": 240
  },
  {
    "name": "Cao Bằng",
    "country_id": 240
  },
  {
    "name": "Hải Phòng",
    "country_id": 240
  },
  {
    "name": "Yên Bái",
    "country_id": 240
  },
  {
    "name": "Bình Dương",
    "country_id": 240
  },
  {
    "name": "Ninh Bình",
    "country_id": 240
  },
  {
    "name": "Bình Thuận",
    "country_id": 240
  },
  {
    "name": "Ninh Thuận",
    "country_id": 240
  },
  {
    "name": "Nam Định",
    "country_id": 240
  },
  {
    "name": "Vĩnh Long",
    "country_id": 240
  },
  {
    "name": "Bắc Ninh",
    "country_id": 240
  },
  {
    "name": "Lạng Sơn",
    "country_id": 240
  },
  {
    "name": "Khánh Hòa",
    "country_id": 240
  },
  {
    "name": "An Giang",
    "country_id": 240
  },
  {
    "name": "Tuyên Quang",
    "country_id": 240
  },
  {
    "name": "Bến Tre",
    "country_id": 240
  },
  {
    "name": "Bình Phước",
    "country_id": 240
  },
  {
    "name": "Thừa Thiên-Huế",
    "country_id": 240
  },
  {
    "name": "Hòa Bình",
    "country_id": 240
  },
  {
    "name": "Kiên Giang",
    "country_id": 240
  },
  {
    "name": "Phú Thọ",
    "country_id": 240
  },
  {
    "name": "Hà Nam",
    "country_id": 240
  },
  {
    "name": "Quảng Trị",
    "country_id": 240
  },
  {
    "name": "Bạc Liêu",
    "country_id": 240
  },
  {
    "name": "Trà Vinh",
    "country_id": 240
  },
  {
    "name": "Đà Nẵng",
    "country_id": 240
  },
  {
    "name": "Thái Nguyên",
    "country_id": 240
  },
  {
    "name": "Long An",
    "country_id": 240
  },
  {
    "name": "Quảng Bình",
    "country_id": 240
  },
  {
    "name": "Hà Nội",
    "country_id": 240
  },
  {
    "name": "Hồ Chí Minh",
    "country_id": 240
  },
  {
    "name": "Sơn La",
    "country_id": 240
  },
  {
    "name": "Gia Lai",
    "country_id": 240
  },
  {
    "name": "Quảng Ninh",
    "country_id": 240
  },
  {
    "name": "Bắc Giang",
    "country_id": 240
  },
  {
    "name": "Hà Tĩnh",
    "country_id": 240
  },
  {
    "name": "Lào Cai",
    "country_id": 240
  },
  {
    "name": "Lâm Đồng",
    "country_id": 240
  },
  {
    "name": "Sóc Trăng",
    "country_id": 240
  },
  {
    "name": "Đồng Nai",
    "country_id": 240
  },
  {
    "name": "Bắc Kạn",
    "country_id": 240
  },
  {
    "name": "Đắk Nông",
    "country_id": 240
  },
  {
    "name": "Phú Yên",
    "country_id": 240
  },
  {
    "name": "Lai Châu",
    "country_id": 240
  },
  {
    "name": "Tây Ninh",
    "country_id": 240
  },
  {
    "name": "Hải Dương",
    "country_id": 240
  },
  {
    "name": "Quảng Ngãi",
    "country_id": 240
  },
  {
    "name": "Đắk Lắk",
    "country_id": 240
  },
  {
    "name": "Bình Định",
    "country_id": 240
  },
  {
    "name": "Saint Peter Basseterre Parish",
    "country_id": 185
  },
  {
    "name": "Nevis",
    "country_id": 185
  },
  {
    "name": "Christ Church Nichola Town Parish",
    "country_id": 185
  },
  {
    "name": "Saint Paul Capisterre Parish",
    "country_id": 185
  },
  {
    "name": "Saint James Windward Parish",
    "country_id": 185
  },
  {
    "name": "Saint Anne Sandy Point Parish",
    "country_id": 185
  },
  {
    "name": "Saint George Gingerland Parish",
    "country_id": 185
  },
  {
    "name": "Saint Paul Charlestown Parish",
    "country_id": 185
  },
  {
    "name": "Saint Thomas Lowland Parish",
    "country_id": 185
  },
  {
    "name": "Saint John Figtree Parish",
    "country_id": 185
  },
  {
    "name": "Saint Kitts",
    "country_id": 185
  },
  {
    "name": "Saint Thomas Middle Island Parish",
    "country_id": 185
  },
  {
    "name": "Trinity Palmetto Point Parish",
    "country_id": 185
  },
  {
    "name": "Saint Mary Cayon Parish",
    "country_id": 185
  },
  {
    "name": "Saint John Capisterre Parish",
    "country_id": 185
  },
  {
    "name": "Daegu",
    "country_id": 116
  },
  {
    "name": "Gyeonggi Province",
    "country_id": 116
  },
  {
    "name": "Incheon",
    "country_id": 116
  },
  {
    "name": "Seoul",
    "country_id": 116
  },
  {
    "name": "Daejeon",
    "country_id": 116
  },
  {
    "name": "North Jeolla Province",
    "country_id": 116
  },
  {
    "name": "Ulsan",
    "country_id": 116
  },
  {
    "name": "Jeju",
    "country_id": 116
  },
  {
    "name": "North Chungcheong Province",
    "country_id": 116
  },
  {
    "name": "North Gyeongsang Province",
    "country_id": 116
  },
  {
    "name": "South Jeolla Province",
    "country_id": 116
  },
  {
    "name": "South Gyeongsang Province",
    "country_id": 116
  },
  {
    "name": "Gwangju",
    "country_id": 116
  },
  {
    "name": "South Chungcheong Province",
    "country_id": 116
  },
  {
    "name": "Busan",
    "country_id": 116
  },
  {
    "name": "Sejong City",
    "country_id": 116
  },
  {
    "name": "Gangwon Province",
    "country_id": 116
  },
  {
    "name": "Saint Patrick Parish",
    "country_id": 87
  },
  {
    "name": "Saint George Parish",
    "country_id": 87
  },
  {
    "name": "Saint Andrew Parish",
    "country_id": 87
  },
  {
    "name": "Saint Mark Parish",
    "country_id": 87
  },
  {
    "name": "Carriacou and Petite Martinique",
    "country_id": 87
  },
  {
    "name": "Saint John Parish",
    "country_id": 87
  },
  {
    "name": "Saint David Parish",
    "country_id": 87
  },
  {
    "name": "Ghazni",
    "country_id": 1
  },
  {
    "name": "Badghis",
    "country_id": 1
  },
  {
    "name": "Bamyan",
    "country_id": 1
  },
  {
    "name": "Helmand",
    "country_id": 1
  },
  {
    "name": "Zabul",
    "country_id": 1
  },
  {
    "name": "Baghlan",
    "country_id": 1
  },
  {
    "name": "Kunar",
    "country_id": 1
  },
  {
    "name": "Paktika",
    "country_id": 1
  },
  {
    "name": "Khost",
    "country_id": 1
  },
  {
    "name": "Kapisa",
    "country_id": 1
  },
  {
    "name": "Nuristan",
    "country_id": 1
  },
  {
    "name": "Panjshir",
    "country_id": 1
  },
  {
    "name": "Nangarhar",
    "country_id": 1
  },
  {
    "name": "Samangan",
    "country_id": 1
  },
  {
    "name": "Balkh",
    "country_id": 1
  },
  {
    "name": "Sar-e Pol",
    "country_id": 1
  },
  {
    "name": "Jowzjan",
    "country_id": 1
  },
  {
    "name": "Herat",
    "country_id": 1
  },
  {
    "name": "Ghōr",
    "country_id": 1
  },
  {
    "name": "Faryab",
    "country_id": 1
  },
  {
    "name": "Kandahar",
    "country_id": 1
  },
  {
    "name": "Laghman",
    "country_id": 1
  },
  {
    "name": "Daykundi",
    "country_id": 1
  },
  {
    "name": "Takhar",
    "country_id": 1
  },
  {
    "name": "Paktia",
    "country_id": 1
  },
  {
    "name": "Parwan",
    "country_id": 1
  },
  {
    "name": "Nimruz",
    "country_id": 1
  },
  {
    "name": "Logar",
    "country_id": 1
  },
  {
    "name": "Urozgan",
    "country_id": 1
  },
  {
    "name": "Farah",
    "country_id": 1
  },
  {
    "name": "Kunduz Province",
    "country_id": 1
  },
  {
    "name": "Badakhshan",
    "country_id": 1
  },
  {
    "name": "Kabul",
    "country_id": 1
  },
  {
    "name": "Victoria",
    "country_id": 14
  },
  {
    "name": "South Australia",
    "country_id": 14
  },
  {
    "name": "Queensland",
    "country_id": 14
  },
  {
    "name": "Western Australia",
    "country_id": 14
  },
  {
    "name": "Australian Capital Territory",
    "country_id": 14
  },
  {
    "name": "Tasmania",
    "country_id": 14
  },
  {
    "name": "New South Wales",
    "country_id": 14
  },
  {
    "name": "Northern Territory",
    "country_id": 14
  },
  {
    "name": "Vavaʻu",
    "country_id": 222
  },
  {
    "name": "Tongatapu",
    "country_id": 222
  },
  {
    "name": "Haʻapai",
    "country_id": 222
  },
  {
    "name": "Niuas",
    "country_id": 222
  },
  {
    "name": "ʻEua",
    "country_id": 222
  },
  {
    "name": "Markazi",
    "country_id": 103
  },
  {
    "name": "Khuzestan",
    "country_id": 103
  },
  {
    "name": "Ilam",
    "country_id": 103
  },
  {
    "name": "Kermanshah",
    "country_id": 103
  },
  {
    "name": "Gilan",
    "country_id": 103
  },
  {
    "name": "Chaharmahal and Bakhtiari",
    "country_id": 103
  },
  {
    "name": "Qom",
    "country_id": 103
  },
  {
    "name": "Isfahan",
    "country_id": 103
  },
  {
    "name": "West Azarbaijan",
    "country_id": 103
  },
  {
    "name": "Zanjan",
    "country_id": 103
  },
  {
    "name": "Kohgiluyeh and Boyer-Ahmad",
    "country_id": 103
  },
  {
    "name": "Razavi Khorasan",
    "country_id": 103
  },
  {
    "name": "Lorestan",
    "country_id": 103
  },
  {
    "name": "Alborz",
    "country_id": 103
  },
  {
    "name": "South Khorasan",
    "country_id": 103
  },
  {
    "name": "Sistan and Baluchestan",
    "country_id": 103
  },
  {
    "name": "Bushehr",
    "country_id": 103
  },
  {
    "name": "Golestan",
    "country_id": 103
  },
  {
    "name": "Ardabil",
    "country_id": 103
  },
  {
    "name": "Kurdistan",
    "country_id": 103
  },
  {
    "name": "Yazd",
    "country_id": 103
  },
  {
    "name": "Hormozgan",
    "country_id": 103
  },
  {
    "name": "Mazandaran",
    "country_id": 103
  },
  {
    "name": "Fars",
    "country_id": 103
  },
  {
    "name": "Semnan",
    "country_id": 103
  },
  {
    "name": "Qazvin",
    "country_id": 103
  },
  {
    "name": "North Khorasan",
    "country_id": 103
  },
  {
    "name": "Kerman",
    "country_id": 103
  },
  {
    "name": "East Azerbaijan",
    "country_id": 103
  },
  {
    "name": "Tehran",
    "country_id": 103
  },
  {
    "name": "Niutao Island Council",
    "country_id": 228
  },
  {
    "name": "Nanumanga",
    "country_id": 228
  },
  {
    "name": "Nui",
    "country_id": 228
  },
  {
    "name": "Nanumea",
    "country_id": 228
  },
  {
    "name": "Vaitupu",
    "country_id": 228
  },
  {
    "name": "Funafuti",
    "country_id": 228
  },
  {
    "name": "Nukufetau",
    "country_id": 228
  },
  {
    "name": "Nukulaelae",
    "country_id": 228
  },
  {
    "name": "Dhi Qar",
    "country_id": 104
  },
  {
    "name": "Babylon",
    "country_id": 104
  },
  {
    "name": "Al-Qādisiyyah",
    "country_id": 104
  },
  {
    "name": "Karbala",
    "country_id": 104
  },
  {
    "name": "Al Muthanna",
    "country_id": 104
  },
  {
    "name": "Baghdad",
    "country_id": 104
  },
  {
    "name": "Basra",
    "country_id": 104
  },
  {
    "name": "Saladin",
    "country_id": 104
  },
  {
    "name": "Najaf",
    "country_id": 104
  },
  {
    "name": "Nineveh",
    "country_id": 104
  },
  {
    "name": "Al Anbar",
    "country_id": 104
  },
  {
    "name": "Diyala",
    "country_id": 104
  },
  {
    "name": "Maysan",
    "country_id": 104
  },
  {
    "name": "Dohuk",
    "country_id": 104
  },
  {
    "name": "Erbil",
    "country_id": 104
  },
  {
    "name": "Sulaymaniyah",
    "country_id": 104
  },
  {
    "name": "Wasit",
    "country_id": 104
  },
  {
    "name": "Kirkuk",
    "country_id": 104
  },
  {
    "name": "Svay Rieng",
    "country_id": 37
  },
  {
    "name": "Preah Vihear",
    "country_id": 37
  },
  {
    "name": "Prey Veng",
    "country_id": 37
  },
  {
    "name": "Takeo",
    "country_id": 37
  },
  {
    "name": "Battambang",
    "country_id": 37
  },
  {
    "name": "Pursat",
    "country_id": 37
  },
  {
    "name": "Kep",
    "country_id": 37
  },
  {
    "name": "Kampong Chhnang",
    "country_id": 37
  },
  {
    "name": "Pailin",
    "country_id": 37
  },
  {
    "name": "Kampot",
    "country_id": 37
  },
  {
    "name": "Koh Kong",
    "country_id": 37
  },
  {
    "name": "Kandal",
    "country_id": 37
  },
  {
    "name": "Banteay Meanchey",
    "country_id": 37
  },
  {
    "name": "Mondulkiri",
    "country_id": 37
  },
  {
    "name": "Kratie",
    "country_id": 37
  },
  {
    "name": "Oddar Meanchey",
    "country_id": 37
  },
  {
    "name": "Kampong Speu",
    "country_id": 37
  },
  {
    "name": "Sihanoukville",
    "country_id": 37
  },
  {
    "name": "Ratanakiri",
    "country_id": 37
  },
  {
    "name": "Kampong Cham",
    "country_id": 37
  },
  {
    "name": "Siem Reap",
    "country_id": 37
  },
  {
    "name": "Stung Treng",
    "country_id": 37
  },
  {
    "name": "Phnom Penh",
    "country_id": 37
  },
  {
    "name": "North Hamgyong Province",
    "country_id": 115
  },
  {
    "name": "Ryanggang Province",
    "country_id": 115
  },
  {
    "name": "South Pyongan Province",
    "country_id": 115
  },
  {
    "name": "Chagang Province",
    "country_id": 115
  },
  {
    "name": "Kangwon Province",
    "country_id": 115
  },
  {
    "name": "South Hamgyong Province",
    "country_id": 115
  },
  {
    "name": "Rason",
    "country_id": 115
  },
  {
    "name": "North Pyongan Province",
    "country_id": 115
  },
  {
    "name": "South Hwanghae Province",
    "country_id": 115
  },
  {
    "name": "North Hwanghae Province",
    "country_id": 115
  },
  {
    "name": "Pyongyang",
    "country_id": 115
  },
  {
    "name": "Meghalaya",
    "country_id": 101
  },
  {
    "name": "Haryana",
    "country_id": 101
  },
  {
    "name": "Maharashtra",
    "country_id": 101
  },
  {
    "name": "Goa",
    "country_id": 101
  },
  {
    "name": "Manipur",
    "country_id": 101
  },
  {
    "name": "Puducherry",
    "country_id": 101
  },
  {
    "name": "Telangana",
    "country_id": 101
  },
  {
    "name": "Odisha",
    "country_id": 101
  },
  {
    "name": "Rajasthan",
    "country_id": 101
  },
  {
    "name": "Punjab",
    "country_id": 101
  },
  {
    "name": "Uttarakhand",
    "country_id": 101
  },
  {
    "name": "Andhra Pradesh",
    "country_id": 101
  },
  {
    "name": "Nagaland",
    "country_id": 101
  },
  {
    "name": "Lakshadweep",
    "country_id": 101
  },
  {
    "name": "Himachal Pradesh",
    "country_id": 101
  },
  {
    "name": "Delhi",
    "country_id": 101
  },
  {
    "name": "Uttar Pradesh",
    "country_id": 101
  },
  {
    "name": "Andaman and Nicobar Islands",
    "country_id": 101
  },
  {
    "name": "Arunachal Pradesh",
    "country_id": 101
  },
  {
    "name": "Jharkhand",
    "country_id": 101
  },
  {
    "name": "Karnataka",
    "country_id": 101
  },
  {
    "name": "Assam",
    "country_id": 101
  },
  {
    "name": "Kerala",
    "country_id": 101
  },
  {
    "name": "Jammu and Kashmir",
    "country_id": 101
  },
  {
    "name": "Gujarat",
    "country_id": 101
  },
  {
    "name": "Chandigarh",
    "country_id": 101
  },
  {
    "name": "Dadra and Nagar Haveli and Daman and Diu",
    "country_id": 101
  },
  {
    "name": "Sikkim",
    "country_id": 101
  },
  {
    "name": "Tamil Nadu",
    "country_id": 101
  },
  {
    "name": "Mizoram",
    "country_id": 101
  },
  {
    "name": "Bihar",
    "country_id": 101
  },
  {
    "name": "Tripura",
    "country_id": 101
  },
  {
    "name": "Madhya Pradesh",
    "country_id": 101
  },
  {
    "name": "Chhattisgarh",
    "country_id": 101
  },
  {
    "name": "Choluteca Department",
    "country_id": 97
  },
  {
    "name": "Comayagua Department",
    "country_id": 97
  },
  {
    "name": "El Paraíso Department",
    "country_id": 97
  },
  {
    "name": "Intibucá Department",
    "country_id": 97
  },
  {
    "name": "Bay Islands Department",
    "country_id": 97
  },
  {
    "name": "Cortés Department",
    "country_id": 97
  },
  {
    "name": "Atlántida Department",
    "country_id": 97
  },
  {
    "name": "Gracias a Dios Department",
    "country_id": 97
  },
  {
    "name": "Copán Department",
    "country_id": 97
  },
  {
    "name": "Olancho Department",
    "country_id": 97
  },
  {
    "name": "Colón Department",
    "country_id": 97
  },
  {
    "name": "Francisco Morazán Department",
    "country_id": 97
  },
  {
    "name": "Santa Bárbara Department",
    "country_id": 97
  },
  {
    "name": "Lempira Department",
    "country_id": 97
  },
  {
    "name": "Valle Department",
    "country_id": 97
  },
  {
    "name": "Ocotepeque Department",
    "country_id": 97
  },
  {
    "name": "Yoro Department",
    "country_id": 97
  },
  {
    "name": "La Paz Department",
    "country_id": 97
  },
  {
    "name": "Northland Region",
    "country_id": 158
  },
  {
    "name": "Manawatu-Wanganui Region",
    "country_id": 158
  },
  {
    "name": "Waikato Region",
    "country_id": 158
  },
  {
    "name": "Otago Region",
    "country_id": 158
  },
  {
    "name": "Marlborough Region",
    "country_id": 158
  },
  {
    "name": "West Coast Region",
    "country_id": 158
  },
  {
    "name": "Wellington Region",
    "country_id": 158
  },
  {
    "name": "Canterbury Region",
    "country_id": 158
  },
  {
    "name": "Chatham Islands",
    "country_id": 158
  },
  {
    "name": "Gisborne District",
    "country_id": 158
  },
  {
    "name": "Taranaki Region",
    "country_id": 158
  },
  {
    "name": "Nelson Region",
    "country_id": 158
  },
  {
    "name": "Southland Region",
    "country_id": 158
  },
  {
    "name": "Auckland Region",
    "country_id": 158
  },
  {
    "name": "Tasman District",
    "country_id": 158
  },
  {
    "name": "Bay of Plenty Region",
    "country_id": 158
  },
  {
    "name": "Hawke's Bay Region",
    "country_id": 158
  },
  {
    "name": "Saint John Parish",
    "country_id": 61
  },
  {
    "name": "Saint Mark Parish",
    "country_id": 61
  },
  {
    "name": "Saint David Parish",
    "country_id": 61
  },
  {
    "name": "Saint George Parish",
    "country_id": 61
  },
  {
    "name": "Saint Patrick Parish",
    "country_id": 61
  },
  {
    "name": "Saint Peter Parish",
    "country_id": 61
  },
  {
    "name": "Saint Andrew Parish",
    "country_id": 61
  },
  {
    "name": "Saint Luke Parish",
    "country_id": 61
  },
  {
    "name": "Saint Paul Parish",
    "country_id": 61
  },
  {
    "name": "Saint Joseph Parish",
    "country_id": 61
  },
  {
    "name": "El Seibo Province",
    "country_id": 62
  },
  {
    "name": "La Romana Province",
    "country_id": 62
  },
  {
    "name": "Sánchez Ramírez Province",
    "country_id": 62
  },
  {
    "name": "Hermanas Mirabal Province",
    "country_id": 62
  },
  {
    "name": "Barahona Province",
    "country_id": 62
  },
  {
    "name": "San Cristóbal Province",
    "country_id": 62
  },
  {
    "name": "Puerto Plata Province",
    "country_id": 62
  },
  {
    "name": "Santo Domingo Province",
    "country_id": 62
  },
  {
    "name": "María Trinidad Sánchez Province",
    "country_id": 62
  },
  {
    "name": "Distrito Nacional",
    "country_id": 62
  },
  {
    "name": "Peravia Province",
    "country_id": 62
  },
  {
    "name": "Independencia",
    "country_id": 62
  },
  {
    "name": "San Juan Province",
    "country_id": 62
  },
  {
    "name": "Monseñor Nouel Province",
    "country_id": 62
  },
  {
    "name": "Santiago Rodríguez Province",
    "country_id": 62
  },
  {
    "name": "Pedernales Province",
    "country_id": 62
  },
  {
    "name": "Espaillat Province",
    "country_id": 62
  },
  {
    "name": "Samaná Province",
    "country_id": 62
  },
  {
    "name": "Valverde Province",
    "country_id": 62
  },
  {
    "name": "Baoruco Province",
    "country_id": 62
  },
  {
    "name": "Hato Mayor Province",
    "country_id": 62
  },
  {
    "name": "Dajabón Province",
    "country_id": 62
  },
  {
    "name": "Santiago Province",
    "country_id": 62
  },
  {
    "name": "La Altagracia Province",
    "country_id": 62
  },
  {
    "name": "San Pedro de Macorís",
    "country_id": 62
  },
  {
    "name": "Monte Plata Province",
    "country_id": 62
  },
  {
    "name": "San José de Ocoa Province",
    "country_id": 62
  },
  {
    "name": "Duarte Province",
    "country_id": 62
  },
  {
    "name": "Azua Province",
    "country_id": 62
  },
  {
    "name": "Monte Cristi Province",
    "country_id": 62
  },
  {
    "name": "La Vega Province",
    "country_id": 62
  },
  {
    "name": "Nord",
    "country_id": 95
  },
  {
    "name": "Nippes",
    "country_id": 95
  },
  {
    "name": "Grand'Anse",
    "country_id": 95
  },
  {
    "name": "Ouest",
    "country_id": 95
  },
  {
    "name": "Nord-Est",
    "country_id": 95
  },
  {
    "name": "Sud",
    "country_id": 95
  },
  {
    "name": "Artibonite",
    "country_id": 95
  },
  {
    "name": "Sud-Est",
    "country_id": 95
  },
  {
    "name": "Centre",
    "country_id": 95
  },
  {
    "name": "Nord-Ouest",
    "country_id": 95
  },
  {
    "name": "San Vicente Department",
    "country_id": 66
  },
  {
    "name": "Santa Ana Department",
    "country_id": 66
  },
  {
    "name": "Usulután Department",
    "country_id": 66
  },
  {
    "name": "Morazán Department",
    "country_id": 66
  },
  {
    "name": "Chalatenango Department",
    "country_id": 66
  },
  {
    "name": "Cabañas Department",
    "country_id": 66
  },
  {
    "name": "San Salvador Department",
    "country_id": 66
  },
  {
    "name": "La Libertad Department",
    "country_id": 66
  },
  {
    "name": "San Miguel Department",
    "country_id": 66
  },
  {
    "name": "La Paz Department",
    "country_id": 66
  },
  {
    "name": "Cuscatlán Department",
    "country_id": 66
  },
  {
    "name": "La Unión Department",
    "country_id": 66
  },
  {
    "name": "Ahuachapán Department",
    "country_id": 66
  },
  {
    "name": "Sonsonate Department",
    "country_id": 66
  },
  {
    "name": "Braslovče Municipality",
    "country_id": 201
  },
  {
    "name": "Lenart Municipality",
    "country_id": 201
  },
  {
    "name": "Oplotnica",
    "country_id": 201
  },
  {
    "name": "Velike Lašče Municipality",
    "country_id": 201
  },
  {
    "name": "Hajdina Municipality",
    "country_id": 201
  },
  {
    "name": "Podčetrtek Municipality",
    "country_id": 201
  },
  {
    "name": "Cankova Municipality",
    "country_id": 201
  },
  {
    "name": "Vitanje Municipality",
    "country_id": 201
  },
  {
    "name": "Sežana Municipality",
    "country_id": 201
  },
  {
    "name": "Kidričevo Municipality",
    "country_id": 201
  },
  {
    "name": "Črenšovci Municipality",
    "country_id": 201
  },
  {
    "name": "Idrija Municipality",
    "country_id": 201
  },
  {
    "name": "Trnovska Vas Municipality",
    "country_id": 201
  },
  {
    "name": "Vodice Municipality",
    "country_id": 201
  },
  {
    "name": "Ravne na Koroškem Municipality",
    "country_id": 201
  },
  {
    "name": "Lovrenc na Pohorju Municipality",
    "country_id": 201
  },
  {
    "name": "Majšperk Municipality",
    "country_id": 201
  },
  {
    "name": "Loški Potok Municipality",
    "country_id": 201
  },
  {
    "name": "Domžale Municipality",
    "country_id": 201
  },
  {
    "name": "Rečica ob Savinji Municipality",
    "country_id": 201
  },
  {
    "name": "Podlehnik Municipality",
    "country_id": 201
  },
  {
    "name": "Cerknica Municipality",
    "country_id": 201
  },
  {
    "name": "Vransko Municipality",
    "country_id": 201
  },
  {
    "name": "Sveta Ana Municipality",
    "country_id": 201
  },
  {
    "name": "Brezovica Municipality",
    "country_id": 201
  },
  {
    "name": "Benedikt Municipality",
    "country_id": 201
  },
  {
    "name": "Divača Municipality",
    "country_id": 201
  },
  {
    "name": "Moravče Municipality",
    "country_id": 201
  },
  {
    "name": "Slovenj Gradec City Municipality",
    "country_id": 201
  },
  {
    "name": "Škocjan Municipality",
    "country_id": 201
  },
  {
    "name": "Šentjur Municipality",
    "country_id": 201
  },
  {
    "name": "Pesnica Municipality",
    "country_id": 201
  },
  {
    "name": "Dol pri Ljubljani Municipality",
    "country_id": 201
  },
  {
    "name": "Loška Dolina Municipality",
    "country_id": 201
  },
  {
    "name": "Hoče–Slivnica Municipality",
    "country_id": 201
  },
  {
    "name": "Cerkvenjak Municipality",
    "country_id": 201
  },
  {
    "name": "Naklo Municipality",
    "country_id": 201
  },
  {
    "name": "Cerkno Municipality",
    "country_id": 201
  },
  {
    "name": "Bistrica ob Sotli Municipality",
    "country_id": 201
  },
  {
    "name": "Kamnik Municipality",
    "country_id": 201
  },
  {
    "name": "Bovec Municipality",
    "country_id": 201
  },
  {
    "name": "Zavrč Municipality",
    "country_id": 201
  },
  {
    "name": "Ajdovščina Municipality",
    "country_id": 201
  },
  {
    "name": "Pivka Municipality",
    "country_id": 201
  },
  {
    "name": "Štore Municipality",
    "country_id": 201
  },
  {
    "name": "Kozje Municipality",
    "country_id": 201
  },
  {
    "name": "Municipality of Škofljica",
    "country_id": 201
  },
  {
    "name": "Prebold Municipality",
    "country_id": 201
  },
  {
    "name": "Dobrovnik Municipality",
    "country_id": 201
  },
  {
    "name": "Mozirje Municipality",
    "country_id": 201
  },
  {
    "name": "City Municipality of Celje",
    "country_id": 201
  },
  {
    "name": "Žiri Municipality",
    "country_id": 201
  },
  {
    "name": "Horjul Municipality",
    "country_id": 201
  },
  {
    "name": "Tabor Municipality",
    "country_id": 201
  },
  {
    "name": "Radeče Municipality",
    "country_id": 201
  },
  {
    "name": "Vipava Municipality",
    "country_id": 201
  },
  {
    "name": "Kungota",
    "country_id": 201
  },
  {
    "name": "Slovenske Konjice Municipality",
    "country_id": 201
  },
  {
    "name": "Osilnica Municipality",
    "country_id": 201
  },
  {
    "name": "Borovnica Municipality",
    "country_id": 201
  },
  {
    "name": "Piran Municipality",
    "country_id": 201
  },
  {
    "name": "Bled Municipality",
    "country_id": 201
  },
  {
    "name": "Jezersko Municipality",
    "country_id": 201
  },
  {
    "name": "Rače–Fram Municipality",
    "country_id": 201
  },
  {
    "name": "Nova Gorica City Municipality",
    "country_id": 201
  },
  {
    "name": "Razkrižje Municipality",
    "country_id": 201
  },
  {
    "name": "Ribnica na Pohorju Municipality",
    "country_id": 201
  },
  {
    "name": "Muta Municipality",
    "country_id": 201
  },
  {
    "name": "Rogatec Municipality",
    "country_id": 201
  },
  {
    "name": "Gorišnica Municipality",
    "country_id": 201
  },
  {
    "name": "Kuzma Municipality",
    "country_id": 201
  },
  {
    "name": "Mislinja Municipality",
    "country_id": 201
  },
  {
    "name": "Duplek Municipality",
    "country_id": 201
  },
  {
    "name": "Trebnje Municipality",
    "country_id": 201
  },
  {
    "name": "Brežice Municipality",
    "country_id": 201
  },
  {
    "name": "Dobrepolje Municipality",
    "country_id": 201
  },
  {
    "name": "Grad Municipality",
    "country_id": 201
  },
  {
    "name": "Moravske Toplice Municipality",
    "country_id": 201
  },
  {
    "name": "Luče Municipality",
    "country_id": 201
  },
  {
    "name": "Miren–Kostanjevica Municipality",
    "country_id": 201
  },
  {
    "name": "Ormož Municipality",
    "country_id": 201
  },
  {
    "name": "Šalovci Municipality",
    "country_id": 201
  },
  {
    "name": "Miklavž na Dravskem Polju Municipality",
    "country_id": 201
  },
  {
    "name": "Makole Municipality",
    "country_id": 201
  },
  {
    "name": "Lendava Municipality",
    "country_id": 201
  },
  {
    "name": "Vuzenica Municipality",
    "country_id": 201
  },
  {
    "name": "Kanal ob Soči Municipality",
    "country_id": 201
  },
  {
    "name": "Ptuj City Municipality",
    "country_id": 201
  },
  {
    "name": "Sveti Andraž v Slovenskih Goricah Municipality",
    "country_id": 201
  },
  {
    "name": "Selnica ob Dravi Municipality",
    "country_id": 201
  },
  {
    "name": "Radovljica Municipality",
    "country_id": 201
  },
  {
    "name": "Črna na Koroškem Municipality",
    "country_id": 201
  },
  {
    "name": "Rogaška Slatina Municipality",
    "country_id": 201
  },
  {
    "name": "Podvelka Municipality",
    "country_id": 201
  },
  {
    "name": "Ribnica Municipality",
    "country_id": 201
  },
  {
    "name": "City Municipality of Novo Mesto",
    "country_id": 201
  },
  {
    "name": "Mirna Peč Municipality",
    "country_id": 201
  },
  {
    "name": "Križevci Municipality",
    "country_id": 201
  },
  {
    "name": "Poljčane Municipality",
    "country_id": 201
  },
  {
    "name": "Brda Municipality",
    "country_id": 201
  },
  {
    "name": "Šentjernej Municipality",
    "country_id": 201
  },
  {
    "name": "Maribor City Municipality",
    "country_id": 201
  },
  {
    "name": "Kobarid Municipality",
    "country_id": 201
  },
  {
    "name": "Markovci Municipality",
    "country_id": 201
  },
  {
    "name": "Vojnik Municipality",
    "country_id": 201
  },
  {
    "name": "Trbovlje Municipality",
    "country_id": 201
  },
  {
    "name": "Tolmin Municipality",
    "country_id": 201
  },
  {
    "name": "Šoštanj Municipality",
    "country_id": 201
  },
  {
    "name": "Žetale Municipality",
    "country_id": 201
  },
  {
    "name": "Tržič Municipality",
    "country_id": 201
  },
  {
    "name": "Turnišče Municipality",
    "country_id": 201
  },
  {
    "name": "Dobrna Municipality",
    "country_id": 201
  },
  {
    "name": "Renče–Vogrsko Municipality",
    "country_id": 201
  },
  {
    "name": "Kostanjevica na Krki Municipality",
    "country_id": 201
  },
  {
    "name": "Sveti Jurij ob Ščavnici Municipality",
    "country_id": 201
  },
  {
    "name": "Železniki Municipality",
    "country_id": 201
  },
  {
    "name": "Veržej Municipality",
    "country_id": 201
  },
  {
    "name": "Žalec Municipality",
    "country_id": 201
  },
  {
    "name": "Starše Municipality",
    "country_id": 201
  },
  {
    "name": "Sveta Trojica v Slovenskih Goricah Municipality",
    "country_id": 201
  },
  {
    "name": "Solčava Municipality",
    "country_id": 201
  },
  {
    "name": "Vrhnika Municipality",
    "country_id": 201
  },
  {
    "name": "Središče ob Dravi",
    "country_id": 201
  },
  {
    "name": "Rogašovci Municipality",
    "country_id": 201
  },
  {
    "name": "Mežica Municipality",
    "country_id": 201
  },
  {
    "name": "Juršinci Municipality",
    "country_id": 201
  },
  {
    "name": "Velika Polana Municipality",
    "country_id": 201
  },
  {
    "name": "Sevnica Municipality",
    "country_id": 201
  },
  {
    "name": "Zagorje ob Savi Municipality",
    "country_id": 201
  },
  {
    "name": "Ljubljana City Municipality",
    "country_id": 201
  },
  {
    "name": "Gornji Petrovci Municipality",
    "country_id": 201
  },
  {
    "name": "Polzela Municipality",
    "country_id": 201
  },
  {
    "name": "Sveti Tomaž Municipality",
    "country_id": 201
  },
  {
    "name": "Prevalje Municipality",
    "country_id": 201
  },
  {
    "name": "Radlje ob Dravi Municipality",
    "country_id": 201
  },
  {
    "name": "Žirovnica Municipality",
    "country_id": 201
  },
  {
    "name": "Sodražica Municipality",
    "country_id": 201
  },
  {
    "name": "Bloke Municipality",
    "country_id": 201
  },
  {
    "name": "Šmartno pri Litiji Municipality",
    "country_id": 201
  },
  {
    "name": "Ruše Municipality",
    "country_id": 201
  },
  {
    "name": "Dolenjske Toplice Municipality",
    "country_id": 201
  },
  {
    "name": "Bohinj Municipality",
    "country_id": 201
  },
  {
    "name": "Komenda Municipality",
    "country_id": 201
  },
  {
    "name": "Gorje Municipality",
    "country_id": 201
  },
  {
    "name": "Šmarje pri Jelšah Municipality",
    "country_id": 201
  },
  {
    "name": "Ig Municipality",
    "country_id": 201
  },
  {
    "name": "Kranj City Municipality",
    "country_id": 201
  },
  {
    "name": "Puconci Municipality",
    "country_id": 201
  },
  {
    "name": "Šmarješke Toplice Municipality",
    "country_id": 201
  },
  {
    "name": "Dornava Municipality",
    "country_id": 201
  },
  {
    "name": "Črnomelj Municipality",
    "country_id": 201
  },
  {
    "name": "Radenci Municipality",
    "country_id": 201
  },
  {
    "name": "Gorenja Vas–Poljane Municipality",
    "country_id": 201
  },
  {
    "name": "Ljubno Municipality",
    "country_id": 201
  },
  {
    "name": "Dobje Municipality",
    "country_id": 201
  },
  {
    "name": "Šmartno ob Paki Municipality",
    "country_id": 201
  },
  {
    "name": "Mokronog–Trebelno Municipality",
    "country_id": 201
  },
  {
    "name": "Mirna Municipality",
    "country_id": 201
  },
  {
    "name": "Šenčur Municipality",
    "country_id": 201
  },
  {
    "name": "Videm Municipality",
    "country_id": 201
  },
  {
    "name": "Beltinci Municipality",
    "country_id": 201
  },
  {
    "name": "Lukovica Municipality",
    "country_id": 201
  },
  {
    "name": "Preddvor Municipality",
    "country_id": 201
  },
  {
    "name": "Destrnik Municipality",
    "country_id": 201
  },
  {
    "name": "Ivančna Gorica Municipality",
    "country_id": 201
  },
  {
    "name": "Log–Dragomer Municipality",
    "country_id": 201
  },
  {
    "name": "Žužemberk Municipality",
    "country_id": 201
  },
  {
    "name": "Dobrova–Polhov Gradec Municipality",
    "country_id": 201
  },
  {
    "name": "Municipality of Cirkulane",
    "country_id": 201
  },
  {
    "name": "Cerklje na Gorenjskem Municipality",
    "country_id": 201
  },
  {
    "name": "Šentrupert Municipality",
    "country_id": 201
  },
  {
    "name": "Tišina Municipality",
    "country_id": 201
  },
  {
    "name": "Murska Sobota City Municipality",
    "country_id": 201
  },
  {
    "name": "Municipality of Krško",
    "country_id": 201
  },
  {
    "name": "Komen Municipality",
    "country_id": 201
  },
  {
    "name": "Škofja Loka Municipality",
    "country_id": 201
  },
  {
    "name": "Šempeter–Vrtojba Municipality",
    "country_id": 201
  },
  {
    "name": "Municipality of Apače",
    "country_id": 201
  },
  {
    "name": "Koper City Municipality",
    "country_id": 201
  },
  {
    "name": "Odranci Municipality",
    "country_id": 201
  },
  {
    "name": "Hrpelje–Kozina Municipality",
    "country_id": 201
  },
  {
    "name": "Izola Municipality",
    "country_id": 201
  },
  {
    "name": "Metlika Municipality",
    "country_id": 201
  },
  {
    "name": "Šentilj Municipality",
    "country_id": 201
  },
  {
    "name": "Kobilje Municipality",
    "country_id": 201
  },
  {
    "name": "Ankaran Municipality",
    "country_id": 201
  },
  {
    "name": "Hodoš Municipality",
    "country_id": 201
  },
  {
    "name": "Sveti Jurij v Slovenskih Goricah Municipality",
    "country_id": 201
  },
  {
    "name": "Nazarje Municipality",
    "country_id": 201
  },
  {
    "name": "Postojna Municipality",
    "country_id": 201
  },
  {
    "name": "Kostel Municipality",
    "country_id": 201
  },
  {
    "name": "Slovenska Bistrica Municipality",
    "country_id": 201
  },
  {
    "name": "Straža Municipality",
    "country_id": 201
  },
  {
    "name": "Trzin Municipality",
    "country_id": 201
  },
  {
    "name": "Kočevje Municipality",
    "country_id": 201
  },
  {
    "name": "Grosuplje Municipality",
    "country_id": 201
  },
  {
    "name": "Jesenice Municipality",
    "country_id": 201
  },
  {
    "name": "Laško Municipality",
    "country_id": 201
  },
  {
    "name": "Gornji Grad Municipality",
    "country_id": 201
  },
  {
    "name": "Kranjska Gora Municipality",
    "country_id": 201
  },
  {
    "name": "Hrastnik Municipality",
    "country_id": 201
  },
  {
    "name": "Zreče Municipality",
    "country_id": 201
  },
  {
    "name": "Gornja Radgona Municipality",
    "country_id": 201
  },
  {
    "name": "Municipality of Ilirska Bistrica",
    "country_id": 201
  },
  {
    "name": "Dravograd Municipality",
    "country_id": 201
  },
  {
    "name": "Semič Municipality",
    "country_id": 201
  },
  {
    "name": "Litija Municipality",
    "country_id": 201
  },
  {
    "name": "Mengeš Municipality",
    "country_id": 201
  },
  {
    "name": "Medvode Municipality",
    "country_id": 201
  },
  {
    "name": "Logatec Municipality",
    "country_id": 201
  },
  {
    "name": "Ljutomer Municipality",
    "country_id": 201
  },
  {
    "name": "Banská Bystrica Region",
    "country_id": 200
  },
  {
    "name": "Košice Region",
    "country_id": 200
  },
  {
    "name": "Prešov Region",
    "country_id": 200
  },
  {
    "name": "Trnava Region",
    "country_id": 200
  },
  {
    "name": "Bratislava Region",
    "country_id": 200
  },
  {
    "name": "Nitra Region",
    "country_id": 200
  },
  {
    "name": "Trenčín Region",
    "country_id": 200
  },
  {
    "name": "Žilina Region",
    "country_id": 200
  },
  {
    "name": "Cimișlia District",
    "country_id": 144
  },
  {
    "name": "Orhei District",
    "country_id": 144
  },
  {
    "name": "Bender Municipality",
    "country_id": 144
  },
  {
    "name": "Nisporeni District",
    "country_id": 144
  },
  {
    "name": "Sîngerei District",
    "country_id": 144
  },
  {
    "name": "Căușeni District",
    "country_id": 144
  },
  {
    "name": "Călărași District",
    "country_id": 144
  },
  {
    "name": "Glodeni District",
    "country_id": 144
  },
  {
    "name": "Anenii Noi District",
    "country_id": 144
  },
  {
    "name": "Ialoveni District",
    "country_id": 144
  },
  {
    "name": "Florești District",
    "country_id": 144
  },
  {
    "name": "Telenești District",
    "country_id": 144
  },
  {
    "name": "Taraclia District",
    "country_id": 144
  },
  {
    "name": "Chișinău Municipality",
    "country_id": 144
  },
  {
    "name": "Soroca District",
    "country_id": 144
  },
  {
    "name": "Briceni District",
    "country_id": 144
  },
  {
    "name": "Rîșcani District",
    "country_id": 144
  },
  {
    "name": "Strășeni District",
    "country_id": 144
  },
  {
    "name": "Ștefan Vodă District",
    "country_id": 144
  },
  {
    "name": "Basarabeasca District",
    "country_id": 144
  },
  {
    "name": "Cantemir District",
    "country_id": 144
  },
  {
    "name": "Fălești District",
    "country_id": 144
  },
  {
    "name": "Hîncești District",
    "country_id": 144
  },
  {
    "name": "Dubăsari District",
    "country_id": 144
  },
  {
    "name": "Dondușeni District",
    "country_id": 144
  },
  {
    "name": "Gagauzia",
    "country_id": 144
  },
  {
    "name": "Ungheni District",
    "country_id": 144
  },
  {
    "name": "Edineț District",
    "country_id": 144
  },
  {
    "name": "Șoldănești District",
    "country_id": 144
  },
  {
    "name": "Ocnița District",
    "country_id": 144
  },
  {
    "name": "Criuleni District",
    "country_id": 144
  },
  {
    "name": "Cahul District",
    "country_id": 144
  },
  {
    "name": "Drochia District",
    "country_id": 144
  },
  {
    "name": "Bălți Municipality",
    "country_id": 144
  },
  {
    "name": "Rezina District",
    "country_id": 144
  },
  {
    "name": "Transnistria autonomous territorial unit",
    "country_id": 144
  },
  {
    "name": "Salacgrīva Municipality",
    "country_id": 120
  },
  {
    "name": "Vecumnieki Municipality",
    "country_id": 120
  },
  {
    "name": "Naukšēni Municipality",
    "country_id": 120
  },
  {
    "name": "Ilūkste Municipality",
    "country_id": 120
  },
  {
    "name": "Gulbene Municipality",
    "country_id": 120
  },
  {
    "name": "Līvāni Municipality",
    "country_id": 120
  },
  {
    "name": "Salaspils Municipality",
    "country_id": 120
  },
  {
    "name": "Ventspils Municipality",
    "country_id": 120
  },
  {
    "name": "Rundāle Municipality",
    "country_id": 120
  },
  {
    "name": "Pļaviņas Municipality",
    "country_id": 120
  },
  {
    "name": "Vārkava Municipality",
    "country_id": 120
  },
  {
    "name": "Jaunpiebalga Municipality",
    "country_id": 120
  },
  {
    "name": "Sēja Municipality",
    "country_id": 120
  },
  {
    "name": "Tukums Municipality",
    "country_id": 120
  },
  {
    "name": "Cibla Municipality",
    "country_id": 120
  },
  {
    "name": "Burtnieki Municipality",
    "country_id": 120
  },
  {
    "name": "Ķegums Municipality",
    "country_id": 120
  },
  {
    "name": "Krustpils Municipality",
    "country_id": 120
  },
  {
    "name": "Cesvaine Municipality",
    "country_id": 120
  },
  {
    "name": "Skrīveri Municipality",
    "country_id": 120
  },
  {
    "name": "Ogre Municipality",
    "country_id": 120
  },
  {
    "name": "Olaine Municipality",
    "country_id": 120
  },
  {
    "name": "Limbaži Municipality",
    "country_id": 120
  },
  {
    "name": "Lubāna Municipality",
    "country_id": 120
  },
  {
    "name": "Kandava Municipality",
    "country_id": 120
  },
  {
    "name": "Ventspils",
    "country_id": 120
  },
  {
    "name": "Krimulda Municipality",
    "country_id": 120
  },
  {
    "name": "Rugāji Municipality",
    "country_id": 120
  },
  {
    "name": "Jelgava Municipality",
    "country_id": 120
  },
  {
    "name": "Valka Municipality",
    "country_id": 120
  },
  {
    "name": "Rūjiena Municipality",
    "country_id": 120
  },
  {
    "name": "Babīte Municipality",
    "country_id": 120
  },
  {
    "name": "Dundaga Municipality",
    "country_id": 120
  },
  {
    "name": "Priekule Municipality",
    "country_id": 120
  },
  {
    "name": "Zilupe Municipality",
    "country_id": 120
  },
  {
    "name": "Varakļāni Municipality",
    "country_id": 120
  },
  {
    "name": "Nereta Municipality",
    "country_id": 120
  },
  {
    "name": "Madona Municipality",
    "country_id": 120
  },
  {
    "name": "Sala Municipality",
    "country_id": 120
  },
  {
    "name": "Ķekava Municipality",
    "country_id": 120
  },
  {
    "name": "Nīca Municipality",
    "country_id": 120
  },
  {
    "name": "Dobele Municipality",
    "country_id": 120
  },
  {
    "name": "Jēkabpils Municipality",
    "country_id": 120
  },
  {
    "name": "Saldus Municipality",
    "country_id": 120
  },
  {
    "name": "Roja Municipality",
    "country_id": 120
  },
  {
    "name": "Iecava Municipality",
    "country_id": 120
  },
  {
    "name": "Ozolnieki Municipality",
    "country_id": 120
  },
  {
    "name": "Saulkrasti Municipality",
    "country_id": 120
  },
  {
    "name": "Ērgļi Municipality",
    "country_id": 120
  },
  {
    "name": "Aglona Municipality",
    "country_id": 120
  },
  {
    "name": "Jūrmala",
    "country_id": 120
  },
  {
    "name": "Skrunda Municipality",
    "country_id": 120
  },
  {
    "name": "Engure Municipality",
    "country_id": 120
  },
  {
    "name": "Inčukalns Municipality",
    "country_id": 120
  },
  {
    "name": "Mārupe Municipality",
    "country_id": 120
  },
  {
    "name": "Mērsrags Municipality",
    "country_id": 120
  },
  {
    "name": "Koknese Municipality",
    "country_id": 120
  },
  {
    "name": "Kārsava Municipality",
    "country_id": 120
  },
  {
    "name": "Carnikava Municipality",
    "country_id": 120
  },
  {
    "name": "Rēzekne Municipality",
    "country_id": 120
  },
  {
    "name": "Viesīte Municipality",
    "country_id": 120
  },
  {
    "name": "Ape Municipality",
    "country_id": 120
  },
  {
    "name": "Durbe Municipality",
    "country_id": 120
  },
  {
    "name": "Talsi Municipality",
    "country_id": 120
  },
  {
    "name": "Liepāja",
    "country_id": 120
  },
  {
    "name": "Mālpils Municipality",
    "country_id": 120
  },
  {
    "name": "Smiltene Municipality",
    "country_id": 120
  },
  {
    "name": "Daugavpils",
    "country_id": 120
  },
  {
    "name": "Jēkabpils",
    "country_id": 120
  },
  {
    "name": "Bauska Municipality",
    "country_id": 120
  },
  {
    "name": "Vecpiebalga Municipality",
    "country_id": 120
  },
  {
    "name": "Pāvilosta Municipality",
    "country_id": 120
  },
  {
    "name": "Brocēni Municipality",
    "country_id": 120
  },
  {
    "name": "Cēsis Municipality",
    "country_id": 120
  },
  {
    "name": "Grobiņa Municipality",
    "country_id": 120
  },
  {
    "name": "Beverīna Municipality",
    "country_id": 120
  },
  {
    "name": "Aizkraukle Municipality",
    "country_id": 120
  },
  {
    "name": "Valmiera",
    "country_id": 120
  },
  {
    "name": "Krāslava Municipality",
    "country_id": 120
  },
  {
    "name": "Jaunjelgava Municipality",
    "country_id": 120
  },
  {
    "name": "Sigulda Municipality",
    "country_id": 120
  },
  {
    "name": "Viļaka Municipality",
    "country_id": 120
  },
  {
    "name": "Stopiņi Municipality",
    "country_id": 120
  },
  {
    "name": "Rauna Municipality",
    "country_id": 120
  },
  {
    "name": "Tērvete Municipality",
    "country_id": 120
  },
  {
    "name": "Auce Municipality",
    "country_id": 120
  },
  {
    "name": "Baldone Municipality",
    "country_id": 120
  },
  {
    "name": "Preiļi Municipality",
    "country_id": 120
  },
  {
    "name": "Aloja Municipality",
    "country_id": 120
  },
  {
    "name": "Alsunga Municipality",
    "country_id": 120
  },
  {
    "name": "Viļāni Municipality",
    "country_id": 120
  },
  {
    "name": "Alūksne Municipality",
    "country_id": 120
  },
  {
    "name": "Līgatne Municipality",
    "country_id": 120
  },
  {
    "name": "Jaunpils Municipality",
    "country_id": 120
  },
  {
    "name": "Kuldīga Municipality",
    "country_id": 120
  },
  {
    "name": "Riga",
    "country_id": 120
  },
  {
    "name": "Daugavpils Municipality",
    "country_id": 120
  },
  {
    "name": "Ropaži Municipality",
    "country_id": 120
  },
  {
    "name": "Strenči Municipality",
    "country_id": 120
  },
  {
    "name": "Kocēni Municipality",
    "country_id": 120
  },
  {
    "name": "Aizpute Municipality",
    "country_id": 120
  },
  {
    "name": "Amata Municipality",
    "country_id": 120
  },
  {
    "name": "Baltinava Municipality",
    "country_id": 120
  },
  {
    "name": "Aknīste Municipality",
    "country_id": 120
  },
  {
    "name": "Jelgava",
    "country_id": 120
  },
  {
    "name": "Ludza Municipality",
    "country_id": 120
  },
  {
    "name": "Riebiņi Municipality",
    "country_id": 120
  },
  {
    "name": "Rucava Municipality",
    "country_id": 120
  },
  {
    "name": "Dagda Municipality",
    "country_id": 120
  },
  {
    "name": "Balvi Municipality",
    "country_id": 120
  },
  {
    "name": "Priekuļi Municipality",
    "country_id": 120
  },
  {
    "name": "Pārgauja Municipality",
    "country_id": 120
  },
  {
    "name": "Vaiņode Municipality",
    "country_id": 120
  },
  {
    "name": "Rēzekne",
    "country_id": 120
  },
  {
    "name": "Garkalne Municipality",
    "country_id": 120
  },
  {
    "name": "Ikšķile Municipality",
    "country_id": 120
  },
  {
    "name": "Lielvārde Municipality",
    "country_id": 120
  },
  {
    "name": "Mazsalaca Municipality",
    "country_id": 120
  },
  {
    "name": "Viqueque Municipality",
    "country_id": 63
  },
  {
    "name": "Liquiçá Municipality",
    "country_id": 63
  },
  {
    "name": "Ermera District",
    "country_id": 63
  },
  {
    "name": "Manatuto District",
    "country_id": 63
  },
  {
    "name": "Ainaro Municipality",
    "country_id": 63
  },
  {
    "name": "Manufahi Municipality",
    "country_id": 63
  },
  {
    "name": "Aileu municipality",
    "country_id": 63
  },
  {
    "name": "Baucau Municipality",
    "country_id": 63
  },
  {
    "name": "Cova Lima Municipality",
    "country_id": 63
  },
  {
    "name": "Lautém Municipality",
    "country_id": 63
  },
  {
    "name": "Dili municipality",
    "country_id": 63
  },
  {
    "name": "Bobonaro Municipality",
    "country_id": 63
  },
  {
    "name": "Peleliu",
    "country_id": 168
  },
  {
    "name": "Ngardmau",
    "country_id": 168
  },
  {
    "name": "Airai",
    "country_id": 168
  },
  {
    "name": "Hatohobei",
    "country_id": 168
  },
  {
    "name": "Melekeok",
    "country_id": 168
  },
  {
    "name": "Ngatpang",
    "country_id": 168
  },
  {
    "name": "Koror",
    "country_id": 168
  },
  {
    "name": "Ngarchelong",
    "country_id": 168
  },
  {
    "name": "Ngiwal",
    "country_id": 168
  },
  {
    "name": "Sonsorol",
    "country_id": 168
  },
  {
    "name": "Ngchesar",
    "country_id": 168
  },
  {
    "name": "Ngaraard",
    "country_id": 168
  },
  {
    "name": "Angaur",
    "country_id": 168
  },
  {
    "name": "Kayangel",
    "country_id": 168
  },
  {
    "name": "Aimeliik",
    "country_id": 168
  },
  {
    "name": "Ngeremlengui",
    "country_id": 168
  },
  {
    "name": "Břeclav",
    "country_id": 58
  },
  {
    "name": "Český Krumlov",
    "country_id": 58
  },
  {
    "name": "Plzeň-město",
    "country_id": 58
  },
  {
    "name": "Brno-venkov",
    "country_id": 58
  },
  {
    "name": "Příbram",
    "country_id": 58
  },
  {
    "name": "Pardubice",
    "country_id": 58
  },
  {
    "name": "Nový Jičín",
    "country_id": 58
  },
  {
    "name": "Náchod",
    "country_id": 58
  },
  {
    "name": "Prostějov",
    "country_id": 58
  },
  {
    "name": "Zlínský kraj",
    "country_id": 58
  },
  {
    "name": "Chomutov",
    "country_id": 58
  },
  {
    "name": "Středočeský kraj",
    "country_id": 58
  },
  {
    "name": "České Budějovice",
    "country_id": 58
  },
  {
    "name": "Rakovník",
    "country_id": 58
  },
  {
    "name": "Frýdek-Místek",
    "country_id": 58
  },
  {
    "name": "Písek",
    "country_id": 58
  },
  {
    "name": "Hodonín",
    "country_id": 58
  },
  {
    "name": "Zlín",
    "country_id": 58
  },
  {
    "name": "Plzeň-sever",
    "country_id": 58
  },
  {
    "name": "Tábor",
    "country_id": 58
  },
  {
    "name": "Brno-město",
    "country_id": 58
  },
  {
    "name": "Svitavy",
    "country_id": 58
  },
  {
    "name": "Vsetín",
    "country_id": 58
  },
  {
    "name": "Cheb",
    "country_id": 58
  },
  {
    "name": "Olomouc",
    "country_id": 58
  },
  {
    "name": "Kraj Vysočina",
    "country_id": 58
  },
  {
    "name": "Ústecký kraj",
    "country_id": 58
  },
  {
    "name": "Prachatice",
    "country_id": 58
  },
  {
    "name": "Trutnov",
    "country_id": 58
  },
  {
    "name": "Hradec Králové",
    "country_id": 58
  },
  {
    "name": "Karlovarský kraj",
    "country_id": 58
  },
  {
    "name": "Nymburk",
    "country_id": 58
  },
  {
    "name": "Rokycany",
    "country_id": 58
  },
  {
    "name": "Ostrava-město",
    "country_id": 58
  },
  {
    "name": "Karviná",
    "country_id": 58
  },
  {
    "name": "Pardubický kraj",
    "country_id": 58
  },
  {
    "name": "Olomoucký kraj",
    "country_id": 58
  },
  {
    "name": "Liberec",
    "country_id": 58
  },
  {
    "name": "Klatovy",
    "country_id": 58
  },
  {
    "name": "Uherské Hradiště",
    "country_id": 58
  },
  {
    "name": "Kroměříž",
    "country_id": 58
  },
  {
    "name": "Sokolov",
    "country_id": 58
  },
  {
    "name": "Semily",
    "country_id": 58
  },
  {
    "name": "Třebíč",
    "country_id": 58
  },
  {
    "name": "Praha, Hlavní město",
    "country_id": 58
  },
  {
    "name": "Ústí nad Labem",
    "country_id": 58
  },
  {
    "name": "Moravskoslezský kraj",
    "country_id": 58
  },
  {
    "name": "Liberecký kraj",
    "country_id": 58
  },
  {
    "name": "Jihomoravský kraj",
    "country_id": 58
  },
  {
    "name": "Karlovy Vary",
    "country_id": 58
  },
  {
    "name": "Litoměřice",
    "country_id": 58
  },
  {
    "name": "Praha-východ",
    "country_id": 58
  },
  {
    "name": "Plzeňský kraj",
    "country_id": 58
  },
  {
    "name": "Plzeň-jih",
    "country_id": 58
  },
  {
    "name": "Děčín",
    "country_id": 58
  },
  {
    "name": "Havlíčkův Brod",
    "country_id": 58
  },
  {
    "name": "Jablonec nad Nisou",
    "country_id": 58
  },
  {
    "name": "Jihlava",
    "country_id": 58
  },
  {
    "name": "Královéhradecký kraj",
    "country_id": 58
  },
  {
    "name": "Blansko",
    "country_id": 58
  },
  {
    "name": "Louny",
    "country_id": 58
  },
  {
    "name": "Kolín",
    "country_id": 58
  },
  {
    "name": "Praha-západ",
    "country_id": 58
  },
  {
    "name": "Beroun",
    "country_id": 58
  },
  {
    "name": "Teplice",
    "country_id": 58
  },
  {
    "name": "Vyškov",
    "country_id": 58
  },
  {
    "name": "Opava",
    "country_id": 58
  },
  {
    "name": "Jindřichův Hradec",
    "country_id": 58
  },
  {
    "name": "Jeseník",
    "country_id": 58
  },
  {
    "name": "Přerov",
    "country_id": 58
  },
  {
    "name": "Benešov",
    "country_id": 58
  },
  {
    "name": "Strakonice",
    "country_id": 58
  },
  {
    "name": "Most",
    "country_id": 58
  },
  {
    "name": "Znojmo",
    "country_id": 58
  },
  {
    "name": "Kladno",
    "country_id": 58
  },
  {
    "name": "Česká Lípa",
    "country_id": 58
  },
  {
    "name": "Chrudim",
    "country_id": 58
  },
  {
    "name": "Rychnov nad Kněžnou",
    "country_id": 58
  },
  {
    "name": "Mělník",
    "country_id": 58
  },
  {
    "name": "Jihočeský kraj",
    "country_id": 58
  },
  {
    "name": "Jičín",
    "country_id": 58
  },
  {
    "name": "Domažlice",
    "country_id": 58
  },
  {
    "name": "Šumperk",
    "country_id": 58
  },
  {
    "name": "Mladá Boleslav",
    "country_id": 58
  },
  {
    "name": "Bruntál",
    "country_id": 58
  },
  {
    "name": "Pelhřimov",
    "country_id": 58
  },
  {
    "name": "Tachov",
    "country_id": 58
  },
  {
    "name": "Ústí nad Orlicí",
    "country_id": 58
  },
  {
    "name": "Žďár nad Sázavou",
    "country_id": 58
  },
  {
    "name": "North East Community Development Council",
    "country_id": 199
  },
  {
    "name": "South East Community Development Council",
    "country_id": 199
  },
  {
    "name": "Central Singapore Community Development Council",
    "country_id": 199
  },
  {
    "name": "South West Community Development Council",
    "country_id": 199
  },
  {
    "name": "North West Community Development Council",
    "country_id": 199
  },
  {
    "name": "Ewa District",
    "country_id": 153
  },
  {
    "name": "Uaboe District",
    "country_id": 153
  },
  {
    "name": "Aiwo District",
    "country_id": 153
  },
  {
    "name": "Meneng District",
    "country_id": 153
  },
  {
    "name": "Anabar District",
    "country_id": 153
  },
  {
    "name": "Nibok District",
    "country_id": 153
  },
  {
    "name": "Baiti District",
    "country_id": 153
  },
  {
    "name": "Ijuw District",
    "country_id": 153
  },
  {
    "name": "Buada District",
    "country_id": 153
  },
  {
    "name": "Anibare District",
    "country_id": 153
  },
  {
    "name": "Yaren District",
    "country_id": 153
  },
  {
    "name": "Boe District",
    "country_id": 153
  },
  {
    "name": "Denigomodu District",
    "country_id": 153
  },
  {
    "name": "Anetan District",
    "country_id": 153
  },
  {
    "name": "Zhytomyrska oblast",
    "country_id": 230
  },
  {
    "name": "Vinnytska oblast",
    "country_id": 230
  },
  {
    "name": "Zakarpatska Oblast",
    "country_id": 230
  },
  {
    "name": "Kyivska oblast",
    "country_id": 230
  },
  {
    "name": "Lvivska oblast",
    "country_id": 230
  },
  {
    "name": "Luhanska oblast",
    "country_id": 230
  },
  {
    "name": "Ternopilska oblast",
    "country_id": 230
  },
  {
    "name": "Dnipropetrovska oblast",
    "country_id": 230
  },
  {
    "name": "Kyiv",
    "country_id": 230
  },
  {
    "name": "Kirovohradska oblast",
    "country_id": 230
  },
  {
    "name": "Chernivetska oblast",
    "country_id": 230
  },
  {
    "name": "Mykolaivska oblast",
    "country_id": 230
  },
  {
    "name": "Cherkaska oblast",
    "country_id": 230
  },
  {
    "name": "Khmelnytska oblast",
    "country_id": 230
  },
  {
    "name": "Ivano-Frankivska oblast",
    "country_id": 230
  },
  {
    "name": "Rivnenska oblast",
    "country_id": 230
  },
  {
    "name": "Khersonska oblast",
    "country_id": 230
  },
  {
    "name": "Sumska oblast",
    "country_id": 230
  },
  {
    "name": "Kharkivska oblast",
    "country_id": 230
  },
  {
    "name": "Zaporizka oblast",
    "country_id": 230
  },
  {
    "name": "Odeska oblast",
    "country_id": 230
  },
  {
    "name": "Autonomous Republic of Crimea",
    "country_id": 230
  },
  {
    "name": "Volynska oblast",
    "country_id": 230
  },
  {
    "name": "Donetska oblast",
    "country_id": 230
  },
  {
    "name": "Chernihivska oblast",
    "country_id": 230
  },
  {
    "name": "Gabrovo Province",
    "country_id": 34
  },
  {
    "name": "Smolyan Province",
    "country_id": 34
  },
  {
    "name": "Pernik Province",
    "country_id": 34
  },
  {
    "name": "Montana Province",
    "country_id": 34
  },
  {
    "name": "Vidin Province",
    "country_id": 34
  },
  {
    "name": "Razgrad Province",
    "country_id": 34
  },
  {
    "name": "Blagoevgrad Province",
    "country_id": 34
  },
  {
    "name": "Sliven Province",
    "country_id": 34
  },
  {
    "name": "Plovdiv Province",
    "country_id": 34
  },
  {
    "name": "Kardzhali Province",
    "country_id": 34
  },
  {
    "name": "Kyustendil Province",
    "country_id": 34
  },
  {
    "name": "Haskovo Province",
    "country_id": 34
  },
  {
    "name": "Sofia City Province",
    "country_id": 34
  },
  {
    "name": "Pleven Province",
    "country_id": 34
  },
  {
    "name": "Stara Zagora Province",
    "country_id": 34
  },
  {
    "name": "Silistra Province",
    "country_id": 34
  },
  {
    "name": "Veliko Tarnovo Province",
    "country_id": 34
  },
  {
    "name": "Lovech Province",
    "country_id": 34
  },
  {
    "name": "Vratsa Province",
    "country_id": 34
  },
  {
    "name": "Pazardzhik Province",
    "country_id": 34
  },
  {
    "name": "Ruse Province",
    "country_id": 34
  },
  {
    "name": "Targovishte Province",
    "country_id": 34
  },
  {
    "name": "Burgas Province",
    "country_id": 34
  },
  {
    "name": "Yambol Province",
    "country_id": 34
  },
  {
    "name": "Varna Province",
    "country_id": 34
  },
  {
    "name": "Dobrich Province",
    "country_id": 34
  },
  {
    "name": "Sofia Province",
    "country_id": 34
  },
  {
    "name": "Suceava County",
    "country_id": 181
  },
  {
    "name": "Hunedoara County",
    "country_id": 181
  },
  {
    "name": "Arges",
    "country_id": 181
  },
  {
    "name": "Bihor County",
    "country_id": 181
  },
  {
    "name": "Alba",
    "country_id": 181
  },
  {
    "name": "Ilfov County",
    "country_id": 181
  },
  {
    "name": "Giurgiu County",
    "country_id": 181
  },
  {
    "name": "Tulcea County",
    "country_id": 181
  },
  {
    "name": "Teleorman County",
    "country_id": 181
  },
  {
    "name": "Prahova County",
    "country_id": 181
  },
  {
    "name": "Bucharest",
    "country_id": 181
  },
  {
    "name": "Neamț County",
    "country_id": 181
  },
  {
    "name": "Călărași County",
    "country_id": 181
  },
  {
    "name": "Bistrița-Năsăud County",
    "country_id": 181
  },
  {
    "name": "Cluj County",
    "country_id": 181
  },
  {
    "name": "Iași County",
    "country_id": 181
  },
  {
    "name": "Braila",
    "country_id": 181
  },
  {
    "name": "Constanța County",
    "country_id": 181
  },
  {
    "name": "Olt County",
    "country_id": 181
  },
  {
    "name": "Arad County",
    "country_id": 181
  },
  {
    "name": "Botoșani County",
    "country_id": 181
  },
  {
    "name": "Sălaj County",
    "country_id": 181
  },
  {
    "name": "Dolj County",
    "country_id": 181
  },
  {
    "name": "Ialomița County",
    "country_id": 181
  },
  {
    "name": "Bacău County",
    "country_id": 181
  },
  {
    "name": "Dâmbovița County",
    "country_id": 181
  },
  {
    "name": "Satu Mare County",
    "country_id": 181
  },
  {
    "name": "Galați County",
    "country_id": 181
  },
  {
    "name": "Timiș County",
    "country_id": 181
  },
  {
    "name": "Harghita County",
    "country_id": 181
  },
  {
    "name": "Gorj County",
    "country_id": 181
  },
  {
    "name": "Mehedinți County",
    "country_id": 181
  },
  {
    "name": "Vaslui County",
    "country_id": 181
  },
  {
    "name": "Caraș-Severin County",
    "country_id": 181
  },
  {
    "name": "Covasna County",
    "country_id": 181
  },
  {
    "name": "Sibiu County",
    "country_id": 181
  },
  {
    "name": "Buzău County",
    "country_id": 181
  },
  {
    "name": "Vâlcea County",
    "country_id": 181
  },
  {
    "name": "Vrancea County",
    "country_id": 181
  },
  {
    "name": "Brașov County",
    "country_id": 181
  },
  {
    "name": "Maramureș County",
    "country_id": 181
  },
  {
    "name": "Aiga-i-le-Tai",
    "country_id": 191
  },
  {
    "name": "Satupa'itea",
    "country_id": 191
  },
  {
    "name": "A'ana",
    "country_id": 191
  },
  {
    "name": "Fa'asaleleaga",
    "country_id": 191
  },
  {
    "name": "Atua",
    "country_id": 191
  },
  {
    "name": "Vaisigano",
    "country_id": 191
  },
  {
    "name": "Palauli",
    "country_id": 191
  },
  {
    "name": "Va'a-o-Fonoti",
    "country_id": 191
  },
  {
    "name": "Gaga'emauga",
    "country_id": 191
  },
  {
    "name": "Tuamasaga",
    "country_id": 191
  },
  {
    "name": "Gaga'ifomauga",
    "country_id": 191
  },
  {
    "name": "Torba",
    "country_id": 237
  },
  {
    "name": "Penama",
    "country_id": 237
  },
  {
    "name": "Shefa",
    "country_id": 237
  },
  {
    "name": "Malampa",
    "country_id": 237
  },
  {
    "name": "Sanma",
    "country_id": 237
  },
  {
    "name": "Tafea",
    "country_id": 237
  },
  {
    "name": "Honiara",
    "country_id": 202
  },
  {
    "name": "Temotu Province",
    "country_id": 202
  },
  {
    "name": "Isabel Province",
    "country_id": 202
  },
  {
    "name": "Choiseul Province",
    "country_id": 202
  },
  {
    "name": "Makira-Ulawa Province",
    "country_id": 202
  },
  {
    "name": "Malaita Province",
    "country_id": 202
  },
  {
    "name": "Central Province",
    "country_id": 202
  },
  {
    "name": "Guadalcanal Province",
    "country_id": 202
  },
  {
    "name": "Western Province",
    "country_id": 202
  },
  {
    "name": "Rennell and Bellona Province",
    "country_id": 202
  },
  {
    "name": "Saint-Barthélemy",
    "country_id": 75
  },
  {
    "name": "Nouvelle-Aquitaine",
    "country_id": 75
  },
  {
    "name": "Île-de-France",
    "country_id": 75
  },
  {
    "name": "Mayotte",
    "country_id": 75
  },
  {
    "name": "Auvergne-Rhône-Alpes",
    "country_id": 75
  },
  {
    "name": "Occitanie",
    "country_id": 75
  },
  {
    "name": "Pays-de-la-Loire",
    "country_id": 75
  },
  {
    "name": "Normandie",
    "country_id": 75
  },
  {
    "name": "Corse",
    "country_id": 75
  },
  {
    "name": "Bretagne",
    "country_id": 75
  },
  {
    "name": "Saint-Martin",
    "country_id": 75
  },
  {
    "name": "Wallis and Futuna",
    "country_id": 75
  },
  {
    "name": "Alsace",
    "country_id": 75
  },
  {
    "name": "Provence-Alpes-Côte-d’Azur",
    "country_id": 75
  },
  {
    "name": "Paris",
    "country_id": 75
  },
  {
    "name": "Centre-Val de Loire",
    "country_id": 75
  },
  {
    "name": "Grand-Est",
    "country_id": 75
  },
  {
    "name": "Saint Pierre and Miquelon",
    "country_id": 75
  },
  {
    "name": "French Guiana",
    "country_id": 75
  },
  {
    "name": "La Réunion",
    "country_id": 75
  },
  {
    "name": "French Polynesia",
    "country_id": 75
  },
  {
    "name": "Bourgogne-Franche-Comté",
    "country_id": 75
  },
  {
    "name": "Martinique",
    "country_id": 75
  },
  {
    "name": "Hauts-de-France",
    "country_id": 75
  },
  {
    "name": "Guadeloupe",
    "country_id": 75
  },
  {
    "name": "West New Britain Province",
    "country_id": 171
  },
  {
    "name": "Bougainville",
    "country_id": 171
  },
  {
    "name": "Jiwaka Province",
    "country_id": 171
  },
  {
    "name": "Hela",
    "country_id": 171
  },
  {
    "name": "East New Britain",
    "country_id": 171
  },
  {
    "name": "Morobe Province",
    "country_id": 171
  },
  {
    "name": "Sandaun Province",
    "country_id": 171
  },
  {
    "name": "Port Moresby",
    "country_id": 171
  },
  {
    "name": "Oro Province",
    "country_id": 171
  },
  {
    "name": "Gulf",
    "country_id": 171
  },
  {
    "name": "Western Highlands Province",
    "country_id": 171
  },
  {
    "name": "New Ireland Province",
    "country_id": 171
  },
  {
    "name": "Manus Province",
    "country_id": 171
  },
  {
    "name": "Madang Province",
    "country_id": 171
  },
  {
    "name": "Southern Highlands Province",
    "country_id": 171
  },
  {
    "name": "Eastern Highlands Province",
    "country_id": 171
  },
  {
    "name": "Chimbu Province",
    "country_id": 171
  },
  {
    "name": "Central Province",
    "country_id": 171
  },
  {
    "name": "Enga Province",
    "country_id": 171
  },
  {
    "name": "Milne Bay Province",
    "country_id": 171
  },
  {
    "name": "Western Province",
    "country_id": 171
  },
  {
    "name": "Ohio",
    "country_id": 233
  },
  {
    "name": "Ladakh",
    "country_id": 101
  },
  {
    "name": "West Bengal",
    "country_id": 101
  },
  {
    "name": "Sinop",
    "country_id": 225
  },
  {
    "name": "Distrito Capital",
    "country_id": 239
  },
  {
    "name": "Apure",
    "country_id": 239
  },
  {
    "name": "Jalisco",
    "country_id": 142
  },
  {
    "name": "Roraima",
    "country_id": 31
  },
  {
    "name": "Guarda",
    "country_id": 177
  },
  {
    "name": "Devonshire Parish",
    "country_id": 25
  },
  {
    "name": "Hamilton Parish",
    "country_id": 25
  },
  {
    "name": "Paget Parish",
    "country_id": 25
  },
  {
    "name": "Pembroke Parish",
    "country_id": 25
  },
  {
    "name": "Saint George's Parish",
    "country_id": 25
  },
  {
    "name": "Sandys Parish",
    "country_id": 25
  },
  {
    "name": "Smith's Parish,",
    "country_id": 25
  },
  {
    "name": "Southampton Parish",
    "country_id": 25
  },
  {
    "name": "Warwick Parish",
    "country_id": 25
  },
  {
    "name": "Huila",
    "country_id": 48
  },
  {
    "name": "Uroševac District (Ferizaj)",
    "country_id": 248
  },
  {
    "name": "Đakovica District (Gjakove)",
    "country_id": 248
  },
  {
    "name": "Gjilan District",
    "country_id": 248
  },
  {
    "name": "Kosovska Mitrovica District",
    "country_id": 248
  },
  {
    "name": "Pristina (Priştine)",
    "country_id": 248
  },
  {
    "name": "Ciudad Autónoma de Buenos Aires",
    "country_id": 11
  },
  {
    "name": "New Providence",
    "country_id": 17
  },
  {
    "name": "Shumen",
    "country_id": 34
  },
  {
    "name": "Yuen Long District",
    "country_id": 98
  },
  {
    "name": "Tsuen Wan District",
    "country_id": 98
  },
  {
    "name": "Tai Po District",
    "country_id": 98
  },
  {
    "name": "Sai Kung District",
    "country_id": 98
  },
  {
    "name": "Islands District",
    "country_id": 98
  },
  {
    "name": "Central and Western District",
    "country_id": 98
  },
  {
    "name": "Wan Chai",
    "country_id": 98
  },
  {
    "name": "Eastern",
    "country_id": 98
  },
  {
    "name": "Southern",
    "country_id": 98
  },
  {
    "name": "Yau Tsim Mong",
    "country_id": 98
  },
  {
    "name": "Sham Shui Po",
    "country_id": 98
  },
  {
    "name": "Kowloon City",
    "country_id": 98
  },
  {
    "name": "Wong Tai Sin",
    "country_id": 98
  },
  {
    "name": "Kwun Tong",
    "country_id": 98
  },
  {
    "name": "Kwai Tsing",
    "country_id": 98
  },
  {
    "name": "Tuen Mun",
    "country_id": 98
  },
  {
    "name": "North",
    "country_id": 98
  },
  {
    "name": "Sha Tin",
    "country_id": 98
  },
  {
    "name": "Sidi Bel Abbès",
    "country_id": 4
  },
  {
    "name": "El M'ghair",
    "country_id": 4
  },
  {
    "name": "El Menia",
    "country_id": 4
  },
  {
    "name": "Ouled Djellal",
    "country_id": 4
  },
  {
    "name": "Bordj Baji Mokhtar",
    "country_id": 4
  },
  {
    "name": "Béni Abbès",
    "country_id": 4
  },
  {
    "name": "Timimoun",
    "country_id": 4
  },
  {
    "name": "Touggourt",
    "country_id": 4
  },
  {
    "name": "Djanet",
    "country_id": 4
  },
  {
    "name": "In Salah",
    "country_id": 4
  },
  {
    "name": "In Guezzam",
    "country_id": 4
  },
  {
    "name": "Mureș County",
    "country_id": 181
  },
  {
    "name": "Volgograd Oblast",
    "country_id": 182
  },
  {
    "name": "La Colle",
    "country_id": 145
  },
  {
    "name": "La Condamine",
    "country_id": 145
  },
  {
    "name": "Moneghetti",
    "country_id": 145
  },
  {
    "name": "Hamadan",
    "country_id": 103
  },
  {
    "name": "Bogotá D.C.",
    "country_id": 48
  },
  {
    "name": "Loreto",
    "country_id": 173
  },
  {
    "name": "Kutná Hora",
    "country_id": 58
  },
  {
    "name": "Kōchi Prefecture",
    "country_id": 109
  },
  {
    "name": "Cần Thơ",
    "country_id": 240
  },
  {
    "name": "Rivers",
    "country_id": 161
  },
  {
    "name": "Rabat-Salé-Kénitra",
    "country_id": 149
  },
  {
    "name": "Agadir-Ida-Ou-Tanane",
    "country_id": 149
  },
  {
    "name": "Berrechid",
    "country_id": 149
  },
  {
    "name": "Casablanca",
    "country_id": 149
  },
  {
    "name": "Driouch",
    "country_id": 149
  },
  {
    "name": "Fès",
    "country_id": 149
  },
  {
    "name": "Fquih Ben Salah",
    "country_id": 149
  },
  {
    "name": "Guercif",
    "country_id": 149
  },
  {
    "name": "Marrakech",
    "country_id": 149
  },
  {
    "name": "M’diq-Fnideq",
    "country_id": 149
  },
  {
    "name": "Meknès",
    "country_id": 149
  },
  {
    "name": "Midelt",
    "country_id": 149
  },
  {
    "name": "Mohammadia",
    "country_id": 149
  },
  {
    "name": "Oujda-Angad",
    "country_id": 149
  },
  {
    "name": "Ouezzane",
    "country_id": 149
  },
  {
    "name": "Rabat",
    "country_id": 149
  },
  {
    "name": "Rehamna",
    "country_id": 149
  },
  {
    "name": "Salé",
    "country_id": 149
  },
  {
    "name": "Sidi Bennour",
    "country_id": 149
  },
  {
    "name": "Sidi Ifni",
    "country_id": 149
  },
  {
    "name": "Skhirate-Témara",
    "country_id": 149
  },
  {
    "name": "Tarfaya (EH-partial)",
    "country_id": 149
  },
  {
    "name": "Tinghir",
    "country_id": 149
  },
  {
    "name": "Tanger-Assilah",
    "country_id": 149
  },
  {
    "name": "Youssoufia",
    "country_id": 149
  },
  {
    "name": "Sidi Slimane",
    "country_id": 149
  },
  {
    "name": "Lualaba",
    "country_id": 51
  },
  {
    "name": "Chaiyaphum",
    "country_id": 219
  },
  {
    "name": "Mbeya",
    "country_id": 218
  },
  {
    "name": "Songwe",
    "country_id": 218
  },
  {
    "name": "Basel-Stadt",
    "country_id": 214
  },
  {
    "name": "Bono East",
    "country_id": 83
  },
  {
    "name": "Bono",
    "country_id": 83
  },
  {
    "name": "North East",
    "country_id": 83
  },
  {
    "name": "Oti",
    "country_id": 83
  },
  {
    "name": "Savannah",
    "country_id": 83
  },
  {
    "name": "Western North",
    "country_id": 83
  },
  {
    "name": "Nueva Segovia",
    "country_id": 159
  },
  {
    "name": "Keelung",
    "country_id": 216
  },
  {
    "name": "New Taipei",
    "country_id": 216
  },
  {
    "name": "Ain",
    "country_id": 75
  },
  {
    "name": "Aisne",
    "country_id": 75
  },
  {
    "name": "Allier",
    "country_id": 75
  },
  {
    "name": "Alpes-de-Haute-Provence",
    "country_id": 75
  },
  {
    "name": "Hautes-Alpes",
    "country_id": 75
  },
  {
    "name": "Alpes-Maritimes",
    "country_id": 75
  },
  {
    "name": "Ardèche",
    "country_id": 75
  },
  {
    "name": "Ardennes",
    "country_id": 75
  },
  {
    "name": "Ariège",
    "country_id": 75
  },
  {
    "name": "Aube",
    "country_id": 75
  },
  {
    "name": "Aude",
    "country_id": 75
  },
  {
    "name": "Aveyron",
    "country_id": 75
  },
  {
    "name": "Bouches-du-Rhône",
    "country_id": 75
  },
  {
    "name": "Calvados",
    "country_id": 75
  },
  {
    "name": "Cantal",
    "country_id": 75
  },
  {
    "name": "Charente",
    "country_id": 75
  },
  {
    "name": "Charente-Maritime",
    "country_id": 75
  },
  {
    "name": "Cher",
    "country_id": 75
  },
  {
    "name": "Corrèze",
    "country_id": 75
  },
  {
    "name": "Côte-d'Or",
    "country_id": 75
  },
  {
    "name": "Côtes-d'Armor",
    "country_id": 75
  },
  {
    "name": "Creuse",
    "country_id": 75
  },
  {
    "name": "Dordogne",
    "country_id": 75
  },
  {
    "name": "Doubs",
    "country_id": 75
  },
  {
    "name": "Drôme",
    "country_id": 75
  },
  {
    "name": "Eure",
    "country_id": 75
  },
  {
    "name": "Eure-et-Loir",
    "country_id": 75
  },
  {
    "name": "Finistère",
    "country_id": 75
  },
  {
    "name": "Corse-du-Sud",
    "country_id": 75
  },
  {
    "name": "Haute-Corse",
    "country_id": 75
  },
  {
    "name": "Gard",
    "country_id": 75
  },
  {
    "name": "Haute-Garonne",
    "country_id": 75
  },
  {
    "name": "Gers",
    "country_id": 75
  },
  {
    "name": "Gironde",
    "country_id": 75
  },
  {
    "name": "Hérault",
    "country_id": 75
  },
  {
    "name": "Ille-et-Vilaine",
    "country_id": 75
  },
  {
    "name": "Indre",
    "country_id": 75
  },
  {
    "name": "Indre-et-Loire",
    "country_id": 75
  },
  {
    "name": "Isère",
    "country_id": 75
  },
  {
    "name": "Jura",
    "country_id": 75
  },
  {
    "name": "Landes",
    "country_id": 75
  },
  {
    "name": "Loir-et-Cher",
    "country_id": 75
  },
  {
    "name": "Loire",
    "country_id": 75
  },
  {
    "name": "Haute-Loire",
    "country_id": 75
  },
  {
    "name": "Loire-Atlantique",
    "country_id": 75
  },
  {
    "name": "Loiret",
    "country_id": 75
  },
  {
    "name": "Lot",
    "country_id": 75
  },
  {
    "name": "Lot-et-Garonne",
    "country_id": 75
  },
  {
    "name": "Lozère",
    "country_id": 75
  },
  {
    "name": "Maine-et-Loire",
    "country_id": 75
  },
  {
    "name": "Manche",
    "country_id": 75
  },
  {
    "name": "Marne",
    "country_id": 75
  },
  {
    "name": "Haute-Marne",
    "country_id": 75
  },
  {
    "name": "Mayenne",
    "country_id": 75
  },
  {
    "name": "Meurthe-et-Moselle",
    "country_id": 75
  },
  {
    "name": "Meuse",
    "country_id": 75
  },
  {
    "name": "Morbihan",
    "country_id": 75
  },
  {
    "name": "Moselle",
    "country_id": 75
  },
  {
    "name": "Nièvre",
    "country_id": 75
  },
  {
    "name": "Nord",
    "country_id": 75
  },
  {
    "name": "Oise",
    "country_id": 75
  },
  {
    "name": "Orne",
    "country_id": 75
  },
  {
    "name": "Pas-de-Calais",
    "country_id": 75
  },
  {
    "name": "Puy-de-Dôme",
    "country_id": 75
  },
  {
    "name": "Pyrénées-Atlantiques",
    "country_id": 75
  },
  {
    "name": "Hautes-Pyrénées",
    "country_id": 75
  },
  {
    "name": "Pyrénées-Orientales",
    "country_id": 75
  },
  {
    "name": "Bas-Rhin",
    "country_id": 75
  },
  {
    "name": "Haut-Rhin",
    "country_id": 75
  },
  {
    "name": "Rhône",
    "country_id": 75
  },
  {
    "name": "Métropole de Lyon",
    "country_id": 75
  },
  {
    "name": "Haute-Saône",
    "country_id": 75
  },
  {
    "name": "Saône-et-Loire",
    "country_id": 75
  },
  {
    "name": "Sarthe",
    "country_id": 75
  },
  {
    "name": "Savoie",
    "country_id": 75
  },
  {
    "name": "Haute-Savoie",
    "country_id": 75
  },
  {
    "name": "Seine-Maritime",
    "country_id": 75
  },
  {
    "name": "Seine-et-Marne",
    "country_id": 75
  },
  {
    "name": "Yvelines",
    "country_id": 75
  },
  {
    "name": "Deux-Sèvres",
    "country_id": 75
  },
  {
    "name": "Somme",
    "country_id": 75
  },
  {
    "name": "Tarn",
    "country_id": 75
  },
  {
    "name": "Tarn-et-Garonne",
    "country_id": 75
  },
  {
    "name": "Var",
    "country_id": 75
  },
  {
    "name": "Vaucluse",
    "country_id": 75
  },
  {
    "name": "Vendée",
    "country_id": 75
  },
  {
    "name": "Vienne",
    "country_id": 75
  },
  {
    "name": "Haute-Vienne",
    "country_id": 75
  },
  {
    "name": "Vosges",
    "country_id": 75
  },
  {
    "name": "Yonne",
    "country_id": 75
  },
  {
    "name": "Territoire de Belfort",
    "country_id": 75
  },
  {
    "name": "Essonne",
    "country_id": 75
  },
  {
    "name": "Hauts-de-Seine",
    "country_id": 75
  },
  {
    "name": "Seine-Saint-Denis",
    "country_id": 75
  },
  {
    "name": "Val-de-Marne",
    "country_id": 75
  },
  {
    "name": "Val-d'Oise",
    "country_id": 75
  },
  {
    "name": "Clipperton",
    "country_id": 75
  },
  {
    "name": "French Southern and Antarctic Lands",
    "country_id": 75
  },
  {
    "name": "Sharqia",
    "country_id": 65
  },
  {
    "name": "Loja",
    "country_id": 64
  },
  {
    "name": "Karlovac",
    "country_id": 55
  },
  {
    "name": "Kampong Thom",
    "country_id": 37
  },
  {
    "name": "Poltavska oblast",
    "country_id": 230
  },
  {
    "name": "Saint Thomas",
    "country_id": 242
  },
  {
    "name": "Saint John",
    "country_id": 242
  },
  {
    "name": "Saint Croix",
    "country_id": 242
  },
  {
    "name": "San Juan",
    "country_id": 178
  },
  {
    "name": "Bayamon",
    "country_id": 178
  },
  {
    "name": "Carolina",
    "country_id": 178
  },
  {
    "name": "Ponce",
    "country_id": 178
  },
  {
    "name": "Caguas",
    "country_id": 178
  },
  {
    "name": "Guaynabo",
    "country_id": 178
  },
  {
    "name": "Arecibo",
    "country_id": 178
  },
  {
    "name": "Toa Baja",
    "country_id": 178
  },
  {
    "name": "Mayagüez",
    "country_id": 178
  },
  {
    "name": "Trujillo Alto",
    "country_id": 178
  },
  {
    "name": "Komárom-Esztergom",
    "country_id": 99
  },
  {
    "name": "Bonaire",
    "country_id": 155
  },
  {
    "name": "Saba",
    "country_id": 155
  },
  {
    "name": "Sint Eustatius",
    "country_id": 155
  },
  {
    "name": "A Coruña",
    "country_id": 207
  },
  {
    "name": "Lugo",
    "country_id": 207
  },
  {
    "name": "Ourense",
    "country_id": 207
  },
  {
    "name": "Badajoz",
    "country_id": 207
  },
  {
    "name": "Araba",
    "country_id": 207
  },
  {
    "name": "Bizkaia",
    "country_id": 207
  },
  {
    "name": "Almeria",
    "country_id": 207
  },
  {
    "name": "Cádiz",
    "country_id": 207
  },
  {
    "name": "Córdoba",
    "country_id": 207
  },
  {
    "name": "Granada",
    "country_id": 207
  },
  {
    "name": "Huelva",
    "country_id": 207
  },
  {
    "name": "Jaén",
    "country_id": 207
  },
  {
    "name": "Málaga",
    "country_id": 207
  },
  {
    "name": "Barcelona",
    "country_id": 207
  },
  {
    "name": "Girona",
    "country_id": 207
  },
  {
    "name": "Lleida",
    "country_id": 207
  },
  {
    "name": "Ciudad Real",
    "country_id": 207
  },
  {
    "name": "Cuenca",
    "country_id": 207
  },
  {
    "name": "Guadalajara",
    "country_id": 207
  },
  {
    "name": "Alicante",
    "country_id": 207
  },
  {
    "name": "Albacete",
    "country_id": 207
  },
  {
    "name": "Castellón",
    "country_id": 207
  },
  {
    "name": "Teruel",
    "country_id": 207
  },
  {
    "name": "Santa Cruz de Tenerife",
    "country_id": 207
  },
  {
    "name": "Zaragoza",
    "country_id": 207
  },
  {
    "name": "Chari-Baguirmi",
    "country_id": 43
  },
  {
    "name": "Western Samar",
    "country_id": 174
  },
  {
    "name": "Nabeul",
    "country_id": 224
  },
  {
    "name": "Jämtland County",
    "country_id": 213
  },
  {
    "name": "Bethlehem",
    "country_id": 169
  },
  {
    "name": "Deir El Balah",
    "country_id": 169
  },
  {
    "name": "Gaza",
    "country_id": 169
  },
  {
    "name": "Hebron",
    "country_id": 169
  },
  {
    "name": "Jenin",
    "country_id": 169
  },
  {
    "name": "Jericho and Al Aghwar",
    "country_id": 169
  },
  {
    "name": "Jerusalem",
    "country_id": 169
  },
  {
    "name": "Khan Yunis",
    "country_id": 169
  },
  {
    "name": "Nablus",
    "country_id": 169
  },
  {
    "name": "North Gaza",
    "country_id": 169
  },
  {
    "name": "Qalqilya",
    "country_id": 169
  },
  {
    "name": "Rafah",
    "country_id": 169
  },
  {
    "name": "Ramallah",
    "country_id": 169
  },
  {
    "name": "Salfit",
    "country_id": 169
  },
  {
    "name": "Tubas",
    "country_id": 169
  },
  {
    "name": "Tulkarm",
    "country_id": 169
  }
];

const stateDataSeed = async (tenant) => {
  await tenant('states').insert(stateData);
};

module.exports = stateDataSeed;