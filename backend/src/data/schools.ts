export type SeedCourse = { id: string; name: string; level: "bachelor" | "diploma" };
export type SeedDepartment = { id: string; name: string; courses: SeedCourse[] };
export type SeedSchool = { id: string; name: string; departments: SeedDepartment[] };

export const SCHOOLS_SEED: SeedSchool[] = [
  {
    id: "sph",
    name: "School of Public Health",
    departments: [
      {
        id: "sph-community-health",
        name: "Department of Community Health",
        courses: [
          { id: "bsc-community-health-development", name: "Bachelor of Science in Community Health and Development", level: "bachelor" },
          { id: "dip-community-health-development", name: "Diploma in Community Health and Development", level: "diploma" },
        ],
      },
      {
        id: "sph-health-management-informatics",
        name: "Department of Health Management & Informatics",
        courses: [
          { id: "bsc-health-records-information", name: "Bachelor of Science in Health Records and Information Management", level: "bachelor" },
          { id: "bsc-health-systems-management", name: "Bachelor of Science in Health Systems Management", level: "bachelor" },
          { id: "dip-health-records-information", name: "Diploma in Health Records and Information Technology", level: "diploma" },
        ],
      },
      {
        id: "sph-environmental-health",
        name: "Department of Environmental Health",
        courses: [
          { id: "bsc-environmental-health", name: "Bachelor of Science in Environmental Health", level: "bachelor" },
          { id: "dip-environmental-health-science", name: "Diploma in Environmental Health Science", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "ssdps",
    name: "School of Security, Diplomacy and Peace Studies",
    departments: [
      {
        id: "ssdps-conflict-peace",
        name: "Conflict, Peace and Strategic Studies",
        courses: [
          { id: "ba-peace-conflict-studies", name: "Bachelor of Arts in Peace and Conflict Studies", level: "bachelor" },
          { id: "dip-peace-conflict-management", name: "Diploma in Peace and Conflict Management", level: "diploma" },
        ],
      },
      {
        id: "ssdps-security-correction",
        name: "Security and Correction Science",
        courses: [
          { id: "ba-security-studies", name: "Bachelor of Arts in Security Studies", level: "bachelor" },
          { id: "dip-security-management", name: "Diploma in Security Management", level: "diploma" },
        ],
      },
      {
        id: "ssdps-diplomacy",
        name: "Diplomacy and International Relations",
        courses: [
          { id: "ba-international-relations-diplomacy", name: "Bachelor of Arts in International Relations and Diplomacy", level: "bachelor" },
          { id: "dip-international-relations", name: "Diploma in International Relations", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "scafms",
    name: "School of Creative Arts, Film & Media Studies",
    departments: [
      {
        id: "scafms-communication",
        name: "Communication & Media Studies",
        courses: [
          { id: "ba-communication-media-studies", name: "Bachelor of Arts in Communication and Media Studies", level: "bachelor" },
          { id: "dip-journalism-media", name: "Diploma in Journalism / Media Studies", level: "diploma" },
        ],
      },
      {
        id: "scafms-film-theatre",
        name: "Film and Theatre Arts",
        courses: [
          { id: "ba-film-theatre-arts", name: "Bachelor of Arts in Film Production and Theatre Arts", level: "bachelor" },
          { id: "dip-film-theatre", name: "Diploma in Film Production / Theatre Arts", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "svpa",
    name: "School of Visual and Performing Arts",
    departments: [
      {
        id: "svpa-theatre-film-tech",
        name: "Theatre Arts and Film Technology",
        courses: [
          { id: "ba-theatre-arts", name: "Bachelor of Arts in Theatre Arts", level: "bachelor" },
          { id: "ba-film-technology", name: "Bachelor of Arts in Film Technology", level: "bachelor" },
        ],
      },
      {
        id: "svpa-music-dance",
        name: "Music and Dance",
        courses: [
          { id: "ba-music", name: "Bachelor of Arts in Music", level: "bachelor" },
          { id: "ba-dance-studies", name: "Bachelor of Arts in Dance Studies", level: "bachelor" },
        ],
      },
      {
        id: "svpa-fine-art-design",
        name: "Fine Art and Design",
        courses: [
          { id: "ba-fine-art-design", name: "Bachelor of Arts in Fine Art and Design", level: "bachelor" },
          { id: "dip-fine-art-applied-design", name: "Diploma in Fine Art / Applied Design", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "spas",
    name: "School of Pure and Applied Sciences",
    departments: [
      {
        id: "spas-computing-it",
        name: "Computing & Information Technology",
        courses: [
          { id: "bsc-computer-science", name: "Bachelor of Science in Computer Science", level: "bachelor" },
          { id: "bsc-information-technology", name: "Bachelor of Science in Information Technology", level: "bachelor" },
          { id: "dip-it-cs", name: "Diploma in IT / Computer Science", level: "diploma" },
        ],
      },
      {
        id: "spas-mathematics-actuarial",
        name: "Mathematics & Actuarial Science",
        courses: [
          { id: "bsc-mathematics", name: "BSc Mathematics", level: "bachelor" },
          { id: "bsc-statistics", name: "BSc Statistics", level: "bachelor" },
          { id: "bsc-actuarial-science", name: "BSc Actuarial Science", level: "bachelor" },
          { id: "dip-information-science", name: "Diploma in Information Science", level: "diploma" },
          { id: "dip-records-management-it", name: "Diploma in Records Management & IT", level: "diploma" },
        ],
      },
      {
        id: "spas-physics",
        name: "Physics",
        courses: [{ id: "bsc-physics", name: "Bachelor of Science in Physics", level: "bachelor" }],
      },
      {
        id: "spas-chemistry",
        name: "Chemistry",
        courses: [{ id: "bsc-chemistry", name: "Bachelor of Science in Chemistry", level: "bachelor" }],
      },
      {
        id: "spas-biochem-micro-biotech",
        name: "Biochemistry, Microbiology & Biotechnology",
        courses: [
          { id: "bsc-biochemistry", name: "Bachelor of Science in Biochemistry", level: "bachelor" },
          { id: "bsc-microbiology", name: "Bachelor of Science in Microbiology", level: "bachelor" },
          { id: "bsc-biotechnology", name: "Bachelor of Science in Biotechnology", level: "bachelor" },
        ],
      },
      {
        id: "spas-plant-sciences",
        name: "Plant Sciences",
        courses: [{ id: "bsc-botany", name: "Bachelor of Science in Botany / Plant Sciences", level: "bachelor" }],
      },
      {
        id: "spas-zoological",
        name: "Zoological Sciences",
        courses: [{ id: "bsc-zoology", name: "Bachelor of Science in Zoology", level: "bachelor" }],
      },
    ],
  },
  {
    id: "sol",
    name: "School of Law",
    departments: [
      {
        id: "sol-public-private-law",
        name: "Public Law / Private Law",
        courses: [
          { id: "llb", name: "Bachelor of Laws (LLB)", level: "bachelor" },
          { id: "dip-law", name: "Diploma in Law", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "sht",
    name: "School of Hospitality & Tourism",
    departments: [
      {
        id: "sht-hospitality",
        name: "Hospitality Management",
        courses: [
          { id: "bsc-hospitality-management", name: "Bachelor of Science in Hospitality Management", level: "bachelor" },
          { id: "dip-hospitality-management", name: "Diploma in Hospitality Management", level: "diploma" },
        ],
      },
      {
        id: "sht-tourism",
        name: "Tourism Management",
        courses: [
          { id: "bsc-tourism-management", name: "Bachelor of Science in Tourism Management", level: "bachelor" },
          { id: "dip-tourism-management", name: "Diploma in Tourism Management", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "shss",
    name: "School of Humanities & Social Sciences",
    departments: [
      {
        id: "shss-english-literature",
        name: "English / Literature",
        courses: [
          { id: "ba-english", name: "BA English", level: "bachelor" },
          { id: "ba-literature", name: "BA Literature", level: "bachelor" },
        ],
      },
      {
        id: "shss-foreign-languages",
        name: "Foreign Languages",
        courses: [{ id: "ba-foreign-languages", name: "BA French / German / Chinese", level: "bachelor" }],
      },
      {
        id: "shss-geography",
        name: "Geography",
        courses: [{ id: "ba-geography", name: "BA Geography", level: "bachelor" }],
      },
      {
        id: "shss-history-archaeology",
        name: "History, Archaeology & Political Studies",
        courses: [
          { id: "ba-history", name: "BA History", level: "bachelor" },
          { id: "ba-political-science", name: "BA Political Science", level: "bachelor" },
          { id: "ba-archaeology", name: "BA Archaeology", level: "bachelor" },
        ],
      },
      {
        id: "shss-kiswahili",
        name: "Kiswahili & African Languages",
        courses: [{ id: "ba-kiswahili", name: "BA Kiswahili", level: "bachelor" }],
      },
      {
        id: "shss-philosophy-religious",
        name: "Philosophy & Religious Studies",
        courses: [
          { id: "ba-philosophy", name: "BA Philosophy", level: "bachelor" },
          { id: "ba-religious-studies", name: "BA Religious Studies", level: "bachelor" },
        ],
      },
      {
        id: "shss-psychology",
        name: "Psychology",
        courses: [{ id: "ba-psychology", name: "BA Psychology", level: "bachelor" }],
      },
      {
        id: "shss-sociology",
        name: "Sociology",
        courses: [{ id: "ba-sociology", name: "BA Sociology", level: "bachelor" }],
      },
      {
        id: "shss-gender-development",
        name: "Gender & Development Studies",
        courses: [{ id: "ba-gender-development", name: "BA Gender and Development", level: "bachelor" }],
      },
      {
        id: "shss-public-policy",
        name: "Public Policy and Administration",
        courses: [{ id: "ba-public-policy", name: "BA Public Policy and Administration", level: "bachelor" }],
      },
    ],
  },
  {
    id: "som",
    name: "School of Medicine",
    departments: [
      {
        id: "som-clinical",
        name: "Clinical and Health Sciences",
        courses: [
          { id: "mbchb", name: "Bachelor of Medicine and Bachelor of Surgery (MBChB)", level: "bachelor" },
          { id: "bpharm", name: "Bachelor of Pharmacy", level: "bachelor" },
          { id: "bsc-nursing", name: "Bachelor of Science in Nursing", level: "bachelor" },
          { id: "bsc-medical-lab-science", name: "Bachelor of Medical Laboratory Science", level: "bachelor" },
          { id: "bsc-radiography", name: "Bachelor of Science in Radiography", level: "bachelor" },
          { id: "bsc-anatomy-physiology", name: "Bachelor of Science in Anatomy / Physiology", level: "bachelor" },
        ],
      },
    ],
  },
  {
    id: "ses",
    name: "School of Environmental Studies",
    departments: [
      {
        id: "ses-environmental",
        name: "Environmental Studies",
        courses: [
          { id: "b-environmental-science", name: "Bachelor of Environmental Science", level: "bachelor" },
          { id: "b-environmental-planning", name: "Bachelor of Environmental Planning and Management", level: "bachelor" },
          { id: "b-environmental-community-development", name: "Bachelor of Environmental Studies and Community Development", level: "bachelor" },
          { id: "dip-environmental-studies", name: "Diploma in Environmental Studies", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "sea",
    name: "School of Engineering & Architecture",
    departments: [
      {
        id: "sea-civil",
        name: "Civil Engineering",
        courses: [
          { id: "b-civil-engineering", name: "BSc Civil Engineering", level: "bachelor" },
          { id: "dip-civil-engineering", name: "Diploma in Civil Engineering", level: "diploma" },
        ],
      },
      {
        id: "sea-mechanical",
        name: "Mechanical Engineering",
        courses: [
          { id: "b-mechanical-engineering", name: "BSc Mechanical Engineering", level: "bachelor" },
          { id: "dip-mechanical-engineering", name: "Diploma in Mechanical Engineering", level: "diploma" },
        ],
      },
      {
        id: "sea-electrical",
        name: "Electrical & Electronic Engineering",
        courses: [
          { id: "b-electrical-electronic-engineering", name: "BSc Electrical & Electronic Engineering", level: "bachelor" },
          { id: "dip-electrical-engineering", name: "Diploma in Electrical Engineering", level: "diploma" },
        ],
      },
      {
        id: "sea-energy",
        name: "Energy, Gas & Petroleum Engineering",
        courses: [
          { id: "b-energy-engineering", name: "BSc Energy Engineering", level: "bachelor" },
          { id: "b-petroleum-engineering", name: "BSc Gas & Petroleum Engineering", level: "bachelor" },
        ],
      },
      {
        id: "sea-construction",
        name: "Construction & Real Estate Management",
        courses: [
          { id: "b-construction-management", name: "BSc Construction Management", level: "bachelor" },
          { id: "b-real-estate-management", name: "BSc Real Estate Management", level: "bachelor" },
          { id: "dip-construction", name: "Diploma in Construction Management", level: "diploma" },
        ],
      },
      {
        id: "sea-agricultural-biosystems",
        name: "Agricultural & Biosystems Engineering",
        courses: [
          { id: "b-agricultural-biosystems-engineering", name: "BSc Agricultural & Biosystems Engineering", level: "bachelor" },
          { id: "dip-agricultural-engineering", name: "Diploma in Agricultural Engineering", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "sed",
    name: "School of Education",
    departments: [
      {
        id: "sed-education",
        name: "Education",
        courses: [
          { id: "bed-arts", name: "Bachelor of Education (Arts)", level: "bachelor" },
          { id: "bed-science", name: "Bachelor of Education (Science)", level: "bachelor" },
          { id: "bed-ecd", name: "Bachelor of Education (Early Childhood Development)", level: "bachelor" },
          { id: "bed-special-needs", name: "Bachelor of Education (Special Needs Education)", level: "bachelor" },
          { id: "b-library-information-science", name: "Bachelor of Library and Information Science", level: "bachelor" },
          { id: "dip-education", name: "Diploma in Education", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "sb",
    name: "School of Business",
    departments: [
      {
        id: "sb-business",
        name: "Business",
        courses: [
          { id: "bba", name: "Bachelor of Business Administration", level: "bachelor" },
          { id: "bcom", name: "Bachelor of Commerce", level: "bachelor" },
          { id: "b-management-science", name: "Bachelor of Management Science", level: "bachelor" },
          { id: "dip-business-management", name: "Diploma in Business Management / Administration", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "se",
    name: "School of Economics",
    departments: [
      {
        id: "se-economics",
        name: "Economics",
        courses: [
          { id: "b-economics", name: "Bachelor of Economics", level: "bachelor" },
          { id: "b-econometrics-statistics", name: "Bachelor of Econometrics and Statistics", level: "bachelor" },
          { id: "b-economic-theory", name: "Bachelor of Economic Theory", level: "bachelor" },
        ],
      },
    ],
  },
  {
    id: "saed",
    name: "School of Agriculture and Enterprise Development",
    departments: [
      {
        id: "saed-agriculture",
        name: "Agriculture",
        courses: [
          { id: "b-agricultural-economics-agribusiness", name: "Bachelor of Agricultural Economics / Agribusiness", level: "bachelor" },
          { id: "b-agricultural-sciences-technology", name: "Bachelor of Agricultural Sciences and Technology", level: "bachelor" },
          { id: "b-agricultural-resource-management", name: "Bachelor of Agricultural Resource Management", level: "bachelor" },
          { id: "dip-agriculture-agribusiness", name: "Diploma in Agriculture / Agribusiness", level: "diploma" },
        ],
      },
    ],
  },
  {
    id: "sahs",
    name: "School of Applied Human Sciences",
    departments: [
      {
        id: "sahs-nutrition",
        name: "Nutrition / Foods",
        courses: [{ id: "bsc-food-nutrition-dietetics", name: "Bachelor of Science in Food, Nutrition & Dietetics", level: "bachelor" }],
      },
      {
        id: "sahs-fashion-design",
        name: "Fashion & Design",
        courses: [{ id: "b-fashion-design-marketing", name: "Bachelor of Fashion Design and Marketing", level: "bachelor" }],
      },
      {
        id: "sahs-physical-education",
        name: "Physical Education & Recreation",
        courses: [
          { id: "b-physical-health-education", name: "Bachelor of Physical and Health Education", level: "bachelor" },
          { id: "b-recreation-management-exercise", name: "Bachelor of Recreation Management & Exercise Science", level: "bachelor" },
        ],
      },
    ],
  },
];

export type SeedHostel = { id: string; name: string; zone: "eastern" | "western" | "nyayo"; gender: "male" | "female" };

export const HOSTELS_SEED: SeedHostel[] = [
  { id: "h-mfumbiro", name: "Mfumbiro Hostel", zone: "eastern", gender: "male" },
  { id: "h-nyandarua", name: "Nyandarua Hostel", zone: "eastern", gender: "male" },
  { id: "h-old-menengai-4", name: "Old Menengai 4 Hostel", zone: "eastern", gender: "male" },
  { id: "h-old-menengai-5", name: "Old Menengai 5 Hostel", zone: "eastern", gender: "male" },
  { id: "h-old-menengai-6", name: "Old Menengai 6 Hostel", zone: "eastern", gender: "male" },
  { id: "h-old-menengai-1", name: "Old Menengai 1 Hostel", zone: "eastern", gender: "female" },
  { id: "h-old-menengai-2", name: "Old Menengai 2 Hostel", zone: "eastern", gender: "female" },
  { id: "h-old-menengai-3", name: "Old Menengai 3 Hostel", zone: "eastern", gender: "female" },
  { id: "h-new-menengai", name: "New Menengai Hostel", zone: "eastern", gender: "female" },
  { id: "h-new-aberdares", name: "New Aberdares Hostel", zone: "eastern", gender: "female" },
  { id: "h-old-aberdares", name: "Old Aberdares Hostel", zone: "eastern", gender: "female" },
  { id: "h-new-ruwenzori", name: "New Ruwenzori Hostel", zone: "western", gender: "male" },
  { id: "h-longonot", name: "Longonot Hostel", zone: "western", gender: "male" },
  { id: "h-kilimambogo", name: "Kilimambogo Hostel", zone: "western", gender: "male" },
  { id: "h-usambara-2", name: "Usambara Block 2", zone: "western", gender: "male" },
  { id: "h-usambara-3", name: "Usambara Block 3", zone: "western", gender: "male" },
  { id: "h-usambara-4", name: "Usambara Block 4", zone: "western", gender: "male" },
  { id: "h-usambara-5", name: "Usambara Block 5", zone: "western", gender: "male" },
  { id: "h-ngong", name: "Ngong Hostel", zone: "western", gender: "female" },
  { id: "h-lukenya", name: "Lukenya Hostel", zone: "western", gender: "female" },
  { id: "h-usambara-1", name: "Usambara Block 1", zone: "western", gender: "female" },
  { id: "h-old-ruwenzori", name: "Old Ruwenzori Hostel", zone: "western", gender: "female" },
  { id: "h-nyayo-one", name: "Nyayo One", zone: "nyayo", gender: "female" },
  { id: "h-nyayo-two", name: "Nyayo Two", zone: "nyayo", gender: "female" },
  { id: "h-nyayo-five", name: "Nyayo Five", zone: "nyayo", gender: "female" },
  { id: "h-nyayo-six", name: "Nyayo Six", zone: "nyayo", gender: "female" },
  { id: "h-nyayo-three", name: "Nyayo Three", zone: "nyayo", gender: "male" },
  { id: "h-nyayo-four", name: "Nyayo Four", zone: "nyayo", gender: "male" },
  { id: "h-nyayo-flats", name: "Nyayo Flats", zone: "nyayo", gender: "male" },
];

export const SRC_ROLES = [
  "Chairperson (President)",
  "Deputy Chairperson (Vice President)",
  "Secretary General",
  "Deputy Secretary General",
  "Academic Affairs Secretary",
  "Finance Secretary",
  "Sports & Entertainment Secretary",
  "Welfare Secretary",
  "Gender Special Needs Representative",
];

export const SEAT_TEMPLATES = [
  { code: "school-rep", label: "School Representative", scope: "school", description: "One representative per school" },
  { code: "department-rep", label: "Department Representative", scope: "department", description: "One representative per department" },
  { code: "hostel-rep", label: "Hostel Representative", scope: "hostel", description: "One representative per hostel" },
  { code: "src-chairperson", label: "SRC Chairperson", scope: "src", description: "Elected by winners of other seats" },
];
