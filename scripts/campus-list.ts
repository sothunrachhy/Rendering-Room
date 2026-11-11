// Universities and institutes in Phnom Penh that students search near.
//
// Locations come from OpenStreetMap (each campus's mapped building or grounds, Nov 2026).
// For a university with several campuses, this is its main one. RUPP, ITC and NUM are
// the original pilot campuses: keep them first (the seed's sample rooms use them by
// position) and keep their slugs, which are in saved search links.
//
// Used by `npm run db:seed` and `npm run db:campuses` (which brings an existing
// database in line: adds new entries, deletes the REMOVED ones, touches nothing else).
export type CampusSeed = {
  slug: string;
  shortName: string;
  name: string;
  nameKm: string;
  lat: number;
  lng: number;
};

export const CAMPUSES: CampusSeed[] = [
  {
    slug: "rupp",
    shortName: "RUPP",
    name: "Royal University of Phnom Penh",
    nameKm: "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ",
    lat: 11.5689,
    lng: 104.8906,
  },
  {
    slug: "itc",
    shortName: "ITC",
    name: "Institute of Technology of Cambodia",
    nameKm: "វិទ្យាស្ថានបច្ចេកវិទ្យាកម្ពុជា",
    lat: 11.5706,
    lng: 104.8987,
  },
  {
    slug: "num",
    shortName: "NUM",
    name: "National University of Management",
    nameKm: "សាកលវិទ្យាល័យជាតិគ្រប់គ្រង",
    lat: 11.5753,
    lng: 104.92,
  },
  {
    slug: "rule",
    shortName: "RULE",
    name: "Royal University of Law and Economics",
    nameKm: "សាកលវិទ្យាល័យភូមិន្ទនីតិសាស្ត្រ និងវិទ្យាសាស្ត្រសេដ្ឋកិច្ច",
    lat: 11.5358,
    lng: 104.9248,
  },
  {
    slug: "ifl",
    shortName: "IFL",
    name: "Institute of Foreign Languages (RUPP)",
    nameKm: "វិទ្យាស្ថានភាសាបរទេស",
    lat: 11.5693,
    lng: 104.8932,
  },
  {
    slug: "rua",
    shortName: "RUA",
    name: "Royal University of Agriculture",
    nameKm: "សាកលវិទ្យាល័យភូមិន្ទកសិកម្ម",
    lat: 11.5117,
    lng: 104.9011,
  },
  {
    slug: "rufa",
    shortName: "RUFA",
    name: "Royal University of Fine Arts",
    nameKm: "សាកលវិទ្យាល័យភូមិន្ទវិចិត្រសិល្បៈ",
    lat: 11.5651,
    lng: 104.9282,
  },
  {
    slug: "uhs",
    shortName: "UHS",
    name: "University of Health Sciences",
    nameKm: "សាកលវិទ្យាល័យវិទ្យាសាស្ត្រសុខាភិបាល",
    lat: 11.5739,
    lng: 104.9173,
  },
  {
    slug: "npic",
    shortName: "NPIC",
    name: "National Polytechnic Institute of Cambodia",
    nameKm: "វិទ្យាស្ថានជាតិពហុបច្ចេកទេសកម្ពុជា",
    lat: 11.5982,
    lng: 104.8007,
  },
  {
    slug: "cadt",
    shortName: "CADT",
    name: "Cambodia Academy of Digital Technology",
    nameKm: "បណ្ឌិត្យសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា",
    lat: 11.6537,
    lng: 104.9117,
  },
  {
    slug: "psbu",
    shortName: "PSBU",
    name: "Preah Sihanouk Raja Buddhist University",
    nameKm: "ពុទ្ធិកសាកលវិទ្យាល័យព្រះសីហនុរាជ",
    lat: 11.5626,
    lng: 104.9341,
  },
  {
    slug: "aupp",
    shortName: "AUPP",
    name: "American University of Phnom Penh",
    nameKm: "សាកលវិទ្យាល័យអាមេរិកាំងភ្នំពេញ",
    lat: 11.6152,
    lng: 104.9015,
  },
  {
    slug: "puc",
    shortName: "PUC",
    name: "Paññāsāstra University of Cambodia",
    nameKm: "សាកលវិទ្យាល័យបញ្ញាសាស្ត្រកម្ពុជា",
    lat: 11.5731,
    lng: 104.8905,
  },
  {
    slug: "norton",
    shortName: "NU",
    name: "Norton University",
    nameKm: "សាកលវិទ្យាល័យន័រតុន",
    lat: 11.5874,
    lng: 104.9305,
  },
  {
    slug: "beltei",
    shortName: "BIU",
    name: "BELTEI International University",
    nameKm: "សាកលវិទ្យាល័យប៊ែលធីអន្តរជាតិ",
    lat: 11.5477,
    lng: 104.9169,
  },
  {
    slug: "cmu",
    shortName: "CMU",
    name: "Cambodian Mekong University",
    nameKm: "សាកលវិទ្យាល័យមេគង្គកម្ពុជា",
    lat: 11.5576,
    lng: 104.8867,
  },
  {
    slug: "up",
    shortName: "UP",
    name: "University of Puthisastra",
    nameKm: "សាកលវិទ្យាល័យពុទ្ធិសាស្ត្រ",
    lat: 11.5625,
    lng: 104.9208,
  },
  {
    slug: "ppiu",
    shortName: "PPIU",
    name: "Phnom Penh International University",
    nameKm: "សាកលវិទ្យាល័យភ្នំពេញអន្តរជាតិ",
    lat: 11.5636,
    lng: 104.9113,
  },
  {
    slug: "uc",
    shortName: "UC",
    name: "The University of Cambodia",
    nameKm: "សាកលវិទ្យាល័យកម្ពុជា",
    lat: 11.5587,
    lng: 104.8714,
  },
  {
    slug: "iu",
    shortName: "IU",
    name: "International University",
    nameKm: "សាកលវិទ្យាល័យអន្តរជាតិ",
    lat: 11.5745,
    lng: 104.8775,
  },
  {
    slug: "cus",
    shortName: "CUS",
    name: "Cambodian University for Specialties",
    nameKm: "សាកលវិទ្យាល័យឯកទេសនៃកម្ពុជា",
    lat: 11.5913,
    lng: 104.8996,
  },
  {
    slug: "paragon",
    shortName: "PIU",
    name: "Paragon International University",
    nameKm: "សាកលវិទ្យាល័យអន្តរជាតិប៉ារ៉ាហ្គន",
    lat: 11.5823,
    lng: 104.8982,
  },
  {
    slug: "western",
    shortName: "WU",
    name: "Western University",
    nameKm: "សាកលវិទ្យាល័យវេស្ទើន",
    lat: 11.5503,
    lng: 104.9121,
  },
  {
    slug: "setec",
    shortName: "SETEC",
    name: "SETEC Institute",
    nameKm: "វិទ្យាស្ថានស៊ីតិច",
    lat: 11.5682,
    lng: 104.8946,
  },
];

/** Campuses taken off the site. `db:campuses` deletes them (rooms don't reference campuses). */
export const REMOVED_CAMPUSES = [
  "ndu", // National Defense University: a military academy, not for general students
];
