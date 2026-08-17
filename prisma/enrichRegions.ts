/**
 * Additive regional data enrichment for the Operations regional dashboard.
 *
 * This script is intentionally NON-destructive: it only upserts records
 * (guards by forceNumber, sites by siteName, and unique-coded records for
 * incidents/patrols/deployments/orders/complaints/contracts/k9s/armoury),
 * and it inserts roster/leave entries only when an equivalent row is missing.
 * Re-running it is safe and idempotent.
 *
 * Run: npx tsx prisma/enrichRegions.ts
 */
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface SiteSeed {
  clientName: string;
  siteName: string;
  location: string;
  zone: string;
  day: number;
  night: number;
  armed: number;
  k9: boolean;
  sla: "Compliant" | "Understaffed" | "Attention Needed";
  deployment: "Not Deployed" | "Deployed" | "Partially Deployed";
  contactPerson: string;
  contactPhone: string;
}

interface RegionSeed {
  name: string;
  code: string;
  city: string;
  rm: string;
  phone: string;
  email: string;
  vault: string;
  sites: SiteSeed[];
  names: string[];
}

const REGION_SEEDS: RegionSeed[] = [
  {
    name: "Albertine", code: "ALB", city: "Hoima / Buliisa Outpost Station", rm: "Richard Atuhairwe",
    phone: "+256 465 400 100", email: "albertine.station@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Andrew Byaruhanga", "Grace Ayebare", "Peter Asiimwe", "Sarah Kansiime", "James Mugisa", "Faith Tumusiime", "Daniel Kahunde", "Mary Kyomugisha", "Robert Mwesigye", "Janet Busingye", "Isaac Atuhaire", "Esther Ninsiima"],
    sites: [
      { clientName: "Total E&P Uganda", siteName: "Hoima Central Processing Facility", location: "Hoima Industrial Zone", zone: "North District", day: 8, night: 6, armed: 6, k9: true, sla: "Compliant", deployment: "Deployed", contactPerson: "Peter Mwesigye", contactPhone: "+256 700 400 101" },
      { clientName: "Buliisa Port Authority", siteName: "Buliisa Lakeport Depot", location: "Buliisa", zone: "North District", day: 6, night: 4, armed: 4, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Ruth Kembabazi", contactPhone: "+256 700 400 102" },
      { clientName: "CNOOC Uganda", siteName: "Kaiso Tonya Wellsite", location: "Hoima", zone: "North District", day: 4, night: 3, armed: 2, k9: false, sla: "Understaffed", deployment: "Partially Deployed", contactPerson: "James Omara", contactPhone: "+256 700 400 103" },
      { clientName: "Royal Albertine Hotels", siteName: "Royal Albertine Hotel", location: "Hoima City", zone: "Central Business", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Martha Aine", contactPhone: "+256 700 400 104" },
      { clientName: "Hoima Fuel Terminal Ltd", siteName: "Hoima Fuel Storage Terminal", location: "Hoima", zone: "North District", day: 5, night: 4, armed: 3, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Stephen Okello", contactPhone: "+256 700 400 105" },
    ],
  },
  {
    name: "Mbarara", code: "MBR", city: "Mbarara City Outpost Station", rm: "Moses Waswa",
    phone: "+256 485 420 200", email: "mbarara.station@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Samuel Taremwa", "Doreen Ankunda", "Elijah Mbabazi", "Lydia Nampijja", "Frank Katunguka", "Catherine Arinaitwe", "Paul Niwagaba", "Prossy Atuheire", "Moses Kanyesigye", "Ritah Mbabazi", "Collins Tumuhairwe", "Irene Kyomuhangi"],
    sites: [
      { clientName: "Kakoba Medical Services", siteName: "Kakoba General Hospital", location: "Mbarara City", zone: "South Extension", day: 6, night: 4, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Dr. Agnes Mujuni", contactPhone: "+256 700 410 201" },
      { clientName: "Rwizi Arcade Developers", siteName: "Rwizi Shopping Arcade", location: "Mbarara City", zone: "Central Business", day: 3, night: 3, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Hassan Kanyesigye", contactPhone: "+256 700 410 202" },
      { clientName: "Ntare Fuel Services", siteName: "Ntare Road Fuel Depot", location: "Mbarara City", zone: "South Extension", day: 4, night: 3, armed: 2, k9: false, sla: "Attention Needed", deployment: "Partially Deployed", contactPerson: "Denis Tumusiime", contactPhone: "+256 700 410 203" },
      { clientName: "Ankole Resort Ltd", siteName: "Ankole Resort Hotel", location: "Mbarara", zone: "South Extension", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Nina Atwine", contactPhone: "+256 700 410 204" },
    ],
  },
  {
    name: "Mukono", code: "MKN", city: "Mukono Industrial Sub-Station", rm: "Joseph Mukasa",
    phone: "+256 414 550 300", email: "mukono.station@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Joseph Kigozi", "Mildred Namutebi", "Charles Ssebuliba", "Florence Namaganda", "Geoffrey Kitaka", "Rebecca Nantongo", "Edward Wasswa", "Agnes Nabbosa", "Stephen Mukasa", "Mariam Nabirye", "Henry Nsubuga", "Joyce Namuli"],
    sites: [
      { clientName: "Seeta Industrial Developers", siteName: "Seeta Industrial Park", location: "Seeta", zone: "North District", day: 5, night: 4, armed: 3, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Paul Ssemakula", contactPhone: "+256 700 420 301" },
      { clientName: "Namanve Business Park Ltd", siteName: "Namanve Business Park Shed", location: "Namanve", zone: "Industrial Zone", day: 6, night: 5, armed: 4, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Grace Namaganda", contactPhone: "+256 700 420 302" },
      { clientName: "Mukono District Administration", siteName: "Mukono Regional Referral Gatehouse", location: "Mukono Town", zone: "Central Business", day: 4, night: 3, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Dr. Frank Kizito", contactPhone: "+256 700 420 303" },
      { clientName: "Kireka Fuel Stations Ltd", siteName: "Kireka Fuel Station", location: "Kireka", zone: "Central Business", day: 2, night: 2, armed: 1, k9: false, sla: "Understaffed", deployment: "Partially Deployed", contactPerson: "Moses Mukasa", contactPhone: "+256 700 420 304" },
    ],
  },
  {
    name: "Masaka", code: "MSK", city: "Masaka Commercial Sub-Station", rm: "Patrick Mutesasira",
    phone: "+256 481 210 500", email: "masaka.station@enterprise-security.co.ug", vault: "Restricted Vault",
    names: ["Vincent Ssemakula", "Agatha Nampewo", "Lawrence Kiggundu", "Monica Nakalema", "Julius Ssenfuma", "Beatrice Nalwoga", "Tonny Kikomeko", "Hellen Nansubuga", "Andrew Lwanga", "Diana Nabbale", "Steven Kituuka", "Regina Namuli"],
    sites: [
      { clientName: "Masaka Commercial Developers", siteName: "Masaka Commercial Plaza", location: "Masaka City", zone: "Central Business", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Ronald Kizza", contactPhone: "+256 700 430 401" },
      { clientName: "Ntamiranda Lake Resorts", siteName: "Ntamiranda Lakefront Resort", location: "Masaka", zone: "South Extension", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Susan Nalwoga", contactPhone: "+256 700 430 402" },
      { clientName: "Masaka Referral Hospital", siteName: "Masaka Referral Hospital Gate", location: "Masaka", zone: "Central Business", day: 5, night: 4, armed: 2, k9: false, sla: "Attention Needed", deployment: "Partially Deployed", contactPerson: "Dr. Joseph Ssentongo", contactPhone: "+256 700 430 403" },
      { clientName: "Villa Maria Estates", siteName: "Villa Maria Seminary Store", location: "Masaka", zone: "South Extension", day: 2, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Fr. Lawrence Bukenya", contactPhone: "+256 700 430 404" },
    ],
  },
  {
    name: "Savannah", code: "SAV", city: "Kasese Safari Sub-Station", rm: "Grace Ategeka",
    phone: "+256 474 320 600", email: "savannah.station@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["David Tumusiime", "Amelia Kemigisha", "Richard Mugerwa", "Naomi Nyakato", "Benon Kaggwa", "Sandra Ankunda", "Wilson Byamukama", "Cynthia Mbabazi", "Geoffrey Rukundo", "Purity Akankwasa", "Martin Turyahebwa", "Lillian Kembabazi"],
    sites: [
      { clientName: "Queen Elizabeth Lodges", siteName: "Queen Elizabeth Safari Lodge", location: "Kasese", zone: "South Extension", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Mary Nakato", contactPhone: "+256 700 440 501" },
      { clientName: "Murchison Falls Conservancy", siteName: "Murchison Falls Camp", location: "Masindi", zone: "North District", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Paul Ongom", contactPhone: "+256 700 440 502" },
      { clientName: "Lake Mburo Reserves", siteName: "Lake Mburo Gatehouse", location: "Kiruhura", zone: "South Extension", day: 2, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Grace Rukundo", contactPhone: "+256 700 440 503" },
      { clientName: "Kidepo Reserve Authority", siteName: "Kidepo Reserve Ranger Post", location: "Kaabong", zone: "North District", day: 3, night: 2, armed: 1, k9: false, sla: "Understaffed", deployment: "Partially Deployed", contactPerson: "Sarah Lochoro", contactPhone: "+256 700 440 504" },
    ],
  },
  {
    name: "Arua", code: "ARA", city: "Arua City Station", rm: "Milton Ondoma",
    phone: "+256 476 300 700", email: "arua.station@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Jackson Odongo", "Priscilla Adibu", "Martin Aliga", "Doreen Awio", "Samson Okello", "Florence Andama", "Robert Ajetu", "Juliet Alioni", "Fred Ocen", "Sarah Ayikoru", "Moses Ondoga", "Gloria Achan"],
    sites: [
      { clientName: "Arua City Mall Ltd", siteName: "Arua City Mall", location: "Arua City", zone: "Central Business", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Yusuf Adrabo", contactPhone: "+256 700 450 601" },
      { clientName: "Ediofe Cathedral Administration", siteName: "Ediofe Cathedral Complex", location: "Arua", zone: "North District", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Bishop Bernard", contactPhone: "+256 700 450 602" },
      { clientName: "Arua Hill Resorts", siteName: "Arua Hill Resort", location: "Arua City", zone: "South Extension", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Joyce Aleni", contactPhone: "+256 700 450 603" },
      { clientName: "West Nile Fuel Depot", siteName: "Arua Fuel Depot", location: "Arua", zone: "North District", day: 4, night: 3, armed: 2, k9: false, sla: "Attention Needed", deployment: "Partially Deployed", contactPerson: "Peter Adupa", contactPhone: "+256 700 450 604" },
    ],
  },
  {
    name: "Gulu", code: "GUL", city: "Gulu City Outpost Station", rm: "Betty Auma",
    phone: "+256 471 200 800", email: "gulu.station@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Boniface Akena", "Sandra Lamunu", "Charles Okema", "Beatrice Aol", "Peter Lagen", "Gift Aber", "Denis Onek", "Margaret Aloyo", "Ronald Oceng", "Esther Ajok", "Julius Okot", "Loyce Adong"],
    sites: [
      { clientName: "Laroo Mall Holdings", siteName: "Laroo Square Mall", location: "Gulu City", zone: "Central Business", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Alfred Lakony", contactPhone: "+256 700 460 701" },
      { clientName: "Gulu University", siteName: "Gulu University Campus", location: "Gulu City", zone: "North District", day: 5, night: 4, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Prof. Isaac Odongo", contactPhone: "+256 700 460 702" },
      { clientName: "Acholi Inns", siteName: "Acholi Inn", location: "Gulu City", zone: "South Extension", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Rita Auma", contactPhone: "+256 700 460 703" },
      { clientName: "Gulu City Fuel Terminal", siteName: "Gulu City Fuel Depot", location: "Gulu", zone: "North District", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Michael Okello", contactPhone: "+256 700 460 704" },
    ],
  },
  {
    name: "Jinja", code: "JIN", city: "Jinja Industrial Sub-Station", rm: "Samuel Kasedde",
    phone: "+256 434 120 900", email: "jinja.station@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Robert Waiswa", "Shakira Nabukenya", "Daniel Kawesa", "Ruth Mugisha", "Fred Mukasa", "Halima Nabirye", "Ben Mubiru", "Pamela Nandala", "John Muwanguzi", "Zainab Namatovu", "Deo Ssempijja", "Agnes Namukose"],
    sites: [
      { clientName: "Jinja Industrial Park", siteName: "Jinja Industrial Park Gate", location: "Jinja", zone: "Industrial Zone", day: 5, night: 4, armed: 3, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Sulaiman Kayongo", contactPhone: "+256 700 470 801" },
      { clientName: "Rippon Falls Hotels", siteName: "Rippon Falls Hotel", location: "Jinja", zone: "South Extension", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Jane Nabirye", contactPhone: "+256 700 470 802" },
      { clientName: "Source of the Nile Gardens", siteName: "Source of the Nile Gardens", location: "Jinja", zone: "Central Business", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Chris Musoke", contactPhone: "+256 700 470 803" },
      { clientName: "Njeru Steel Corporation", siteName: "Njeru Steelworks", location: "Njeru", zone: "Industrial Zone", day: 6, night: 5, armed: 4, k9: false, sla: "Understaffed", deployment: "Partially Deployed", contactPerson: "Robert Wafula", contactPhone: "+256 700 470 804" },
    ],
  },
  {
    name: "Kampala East", code: "KLE", city: "Nakawa Sub-Station", rm: "Fred Wasswa",
    phone: "+256 414 200 100", email: "kampala.east@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Ivan Okiror", "Norah Atim", "Brian Mutebi", "Sophia Namugga", "Kevin Ouma", "Esther Nakimbugwe", "Derrick Wasswa", "Sharon Namuli", "Allan Sseguya", "Patience Nalwoga", "Mark Okello", "Angella Nakato"],
    sites: [
      { clientName: "Kajjansi Logistics Hub", siteName: "Kajjansi Industrial Park", location: "Kajjansi", zone: "Industrial Zone", day: 5, night: 4, armed: 3, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Peter Ssentamu", contactPhone: "+256 700 480 901" },
      { clientName: "Nakawa Business Park Ltd", siteName: "Nakawa Business Park", location: "Nakawa", zone: "Industrial Zone", day: 6, night: 5, armed: 4, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Grace Nakato", contactPhone: "+256 700 480 902" },
      { clientName: "Bugolobi Cargo Terminal", siteName: "Bugolobi Cargo Depot", location: "Bugolobi", zone: "Industrial Zone", day: 4, night: 3, armed: 2, k9: false, sla: "Attention Needed", deployment: "Partially Deployed", contactPerson: "Ronald Kigozi", contactPhone: "+256 700 480 903" },
      { clientName: "Kyambogo University", siteName: "Kyambogo University Gate", location: "Kyambogo", zone: "North District", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Prof. John Ntambi", contactPhone: "+256 700 480 904" },
    ],
  },
  {
    name: "Kampala West", code: "KLW", city: "Munyonyo Sub-Station", rm: "Irene Nabirye",
    phone: "+256 414 300 200", email: "kampala.west@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Timothy Sserwadda", "Cynthia Nakalema", "Joseph Mutumba", "Rose Nabunya", "Eric Kato", "Vanessa Namagga", "Abdul Mutyaba", "Doreen Namukwaya", "Simon Kaggwa", "Halimah Nansereko", "Chrispin Okello", "Fiona Nakibuuka"],
    sites: [
      { clientName: "Ndejje University", siteName: "Ndejje University Campus", location: "Ndejje", zone: "South Extension", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Prof. Eriabu Lugujjo", contactPhone: "+256 700 490 100" },
      { clientName: "Kabusu Duty Free Ltd", siteName: "Kabusu Duty Free Depot", location: "Kabusu", zone: "South Extension", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Mohammed Ssekandi", contactPhone: "+256 700 490 101" },
      { clientName: "Buddo Arch Properties", siteName: "Buddo Arch Villa", location: "Buddo", zone: "South Extension", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Sarah Nalule", contactPhone: "+256 700 490 102" },
    ],
  },
  {
    name: "Kampala North", code: "KLN", city: "Kira Sub-Station", rm: "George Katongole",
    phone: "+256 414 100 300", email: "kampala.north@enterprise-security.co.ug", vault: "Fully Operational",
    names: ["Patrick Ssemwogerere", "Grace Nakimuli", "Moses Kirabira", "Stella Namuddu", "Anthony Mukiibi", "Irene Nakawuki", "John Sebunya", "Peninah Namwanje", "Isaac Mukasa", "Sandra Nakamya", "Dennis Kanyike", "Martha Nakimbugwe"],
    sites: [
      { clientName: "Bombo Road Markets Ltd", siteName: "Bombo Road Market", location: "Kampala", zone: "Central Business", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Hassan Ssebale", contactPhone: "+256 700 500 101" },
      { clientName: "Kira Town Developers", siteName: "Kira Town Arcade", location: "Kira", zone: "North District", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Alice Namutebi", contactPhone: "+256 700 500 102" },
      { clientName: "Makerere University", siteName: "Makerere University Gate", location: "Kampala", zone: "North District", day: 5, night: 4, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Prof. Barnabas Nawangwe", contactPhone: "+256 700 500 103" },
      { clientName: "Nansana Traders Association", siteName: "Nansana Trading Centre", location: "Nansana", zone: "North District", day: 3, night: 2, armed: 1, k9: false, sla: "Understaffed", deployment: "Partially Deployed", contactPerson: "Joseph Kigundu", contactPhone: "+256 700 500 104" },
    ],
  },
  {
    name: "Kampala Central", code: "KLC", city: "Kampala Headquarters", rm: "Emma Muwonge",
    phone: "+256 700 111 001", email: "kampala.hq@iscms.ug", vault: "Main Hub Vault",
    names: ["Joseph Kasozi", "Ritah Namukasa", "Edward Semakula", "Phiona Nanziri", "George Katende", "Moses Nakibinge", "Pauline Namanya", "Silas Mutyaba", "Carol Nakigudde", "Nathan Ssentongo", "Maggie Nakalembe", "Rashid Kimbugwe"],
    sites: [
      { clientName: "Capital Shoppers Ltd", siteName: "Capital Shoppers Mall", location: "Kampala Road", zone: "Central Business", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Rajiv Patel", contactPhone: "+256 700 510 201" },
      { clientName: "Kampala Road Towers", siteName: "Kampala Road Towers", location: "Kampala", zone: "Central Business", day: 5, night: 4, armed: 3, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Mary Namutebi", contactPhone: "+256 700 510 202" },
      { clientName: "City Square Banking Precinct", siteName: "City Square Banking Precinct", location: "Kampala", zone: "Central Business", day: 4, night: 3, armed: 2, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "John Kasujja", contactPhone: "+256 700 510 203" },
    ],
  },
  {
    name: "Outerstations", code: "OUT", city: "Mityana Outpost Station", rm: "Alex Okello",
    phone: "+256 700 520 000", email: "outerstations@enterprise-security.co.ug", vault: "Restricted Vault",
    names: ["Alex Kamoga", "Sarah Mubiru", "David Bukenya", "Joyce Namusoke", "Robert Kizza", "Martha Nansamba", "Tonny Mugerwa", "Catherine Nakakande", "Patrick Ssewanyana", "Monica Namirembe", "Frank Okello", "Grace Nabitaka"],
    sites: [
      { clientName: "Mityana Highway Services", siteName: "Mityana Highway Service Station", location: "Mityana", zone: "Central Business", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "George Ssewanyana", contactPhone: "+256 700 520 001" },
      { clientName: "Kayunga Border Authority", siteName: "Kayunga Border Post", location: "Kayunga", zone: "North District", day: 3, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Ronald Muwonge", contactPhone: "+256 700 520 002" },
      { clientName: "Luwero Fruit Growers", siteName: "Luwero Fruit Packing Shed", location: "Luwero", zone: "North District", day: 2, night: 2, armed: 1, k9: false, sla: "Compliant", deployment: "Deployed", contactPerson: "Hellen Nakato", contactPhone: "+256 700 520 003" },
      { clientName: "Nakasongola Fuel Terminal", siteName: "Nakasongola Fuel Depot", location: "Nakasongola", zone: "North District", day: 3, night: 2, armed: 1, k9: false, sla: "Attention Needed", deployment: "Partially Deployed", contactPerson: "Peter Lwanga", contactPhone: "+256 700 520 004" },
    ],
  },
];

const INCIDENT_CATEGORIES = ["Security Breach", "Theft Attempt", "Weapon Discharge", "Unauthorized Entry", "Medical Emergency", "K9 Alert"];
const GUARD_STATUSES = ["On Duty", "On Duty", "On Duty", "Off Duty", "On Duty", "On Duty", "On Leave", "Off Duty", "On Duty", "Suspended", "On Duty", "Off Duty"];
const LIFE_CYCLES = ["DEPLOYED", "DEPLOYED", "DEPLOYED", "DEPLOYED", "DEPLOYED", "DEPLOYED", "DEPLOYED", "DEPLOYED", "IN_TRAINING", "PASSED_OUT", "ENROLLED", "HANDED_TO_OPERATIONS"];
const ROSTER_STATUSES = ["Present", "Present", "Present", "Absent", "Present", "On Overtime", "Present", "Scheduled", "Present", "Present", "Absent", "Present"];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function pad(n: number, len = 3): string {
  return String(n).padStart(len, "0");
}

async function main() {
  const regionIds = new Map<string, string>();
  for (const seed of REGION_SEEDS) {
    const r = await prisma.region.upsert({
      where: { name: seed.name },
      update: { code: seed.code },
      create: { name: seed.name, code: seed.code, description: `${seed.name} operational region` },
    });
    regionIds.set(seed.name, r.id);
  }

  let created = { guards: 0, sites: 0, incidents: 0, rosters: 0, patrols: 0, deployments: 0, orders: 0, complaints: 0, contracts: 0, leave: 0, disciplinary: 0, k9: 0, armoury: 0 };

  let block = 100;
  for (const seed of REGION_SEEDS) {
    const regionId = regionIds.get(seed.name)!;
    console.log(`\n→ Enriching ${seed.name} (${seed.code})`);

    // Regional office
    await prisma.regionalOffice.upsert({
      where: { code: `REG-${seed.code}` },
      update: {
        name: `${seed.name} Regional Station`,
        locationCity: seed.city,
        regionalManagerName: seed.rm,
        phone: seed.phone,
        email: seed.email,
        armouryVaultStatus: seed.vault,
        regionId,
      },
      create: {
        code: `REG-${seed.code}`,
        name: `${seed.name} Regional Station`,
        locationCity: seed.city,
        regionalManagerName: seed.rm,
        phone: seed.phone,
        email: seed.email,
        armouryVaultStatus: seed.vault,
        vehiclesAssigned: 2 + (seed.sites.length % 3),
        regionId,
      },
    });

    // Sites
    const siteMap = new Map<string, string>();
    for (const s of seed.sites) {
      const dayShiftArmed = Math.min(s.armed, Math.round((s.armed * s.day) / Math.max(s.day + s.night, 1)));
      const nightShiftArmed = s.armed - dayShiftArmed;
      const siteData = {
        clientName: s.clientName,
        location: s.location,
        zone: s.zone,
        dayShiftGuards: s.day,
        nightShiftGuards: s.night,
        dayShiftArmed,
        nightShiftArmed,
        armedGuardsRequired: s.armed,
        k9Required: s.k9,
        slaStatus: s.sla,
        deploymentStatus: s.deployment,
        contactPerson: s.contactPerson,
        contactPhone: s.contactPhone,
        region: seed.name,
      };
      let site = await prisma.clientSite.findFirst({ where: { siteName: s.siteName } });
      if (site) {
        site = await prisma.clientSite.update({
          where: { id: site.id },
          data: siteData,
        });
      } else {
        site = await prisma.clientSite.create({
          data: {
            ...siteData,
            siteName: s.siteName,
          },
        });
      }
      siteMap.set(s.siteName, site.id);
      created.sites += 1;
    }

    // Guards
    const siteNames = seed.sites.map((s) => s.siteName);
    const guardRows: { id: string; forceNumber: string; fullName: string; siteName: string; siteId: string }[] = [];
    for (let i = 0; i < seed.names.length; i += 1) {
      const forceNumber = `PSG026/-e`;
      const fullName = seed.names[i];
      const siteName = siteNames[i % siteNames.length];
      const siteZone = seed.sites[i % siteNames.length].zone;
      const designation = i < 2 ? "K9 Handler" : i === 2 ? "Site In-Charge" : i === 3 ? "Inspector" : "Guard";
      const isFemale = i % 3 === 1;
      const guard = await prisma.guard.upsert({
        where: { forceNumber },
        update: { region: seed.name, designation, zone: siteZone },
        create: {
        forceNumber,
          fullName,
          designation,
          zone: siteZone,
          phone: `+256 700 ${String(500000 + block + i).padStart(6, "0")}`,
          nationalId: `CM${String(91000000 + block + i)}${String(block).slice(-2)}${i}X`,
          assignedSite: siteName,
          location: seed.city,
          bankAccount: `${block}${i}${String(9000000 + block + i).slice(0, 4)}`,
          bankName: ["Stanbic Bank Uganda", "Centenary Bank", "Equity Bank Uganda", "PostBank Uganda"][i % 4],
          finishedProbation: i >= 2,
          status: GUARD_STATUSES[i % GUARD_STATUSES.length],
          lifecycleStage: LIFE_CYCLES[i % LIFE_CYCLES.length] as "DEPLOYED",
          medicalCleared: true,
          armedQualified: i % 2 === 0,
          k9Qualified: designation === "K9 Handler",
          joinDate: `20${20 + (i % 5)}-0${(i % 9) + 1}-1${i % 10}`,
          warningLettersCount: i === 9 ? 1 : 0,
          certifications: designation === "K9 Handler"
            ? ["Basic Security Training", "K9 Handler Certification"]
            : ["Basic Security Training"],
          idCardStatus: "Issued & Active",
          idCardNumber: `IDC-2026-${seed.code}-${pad(i + 1, 2)}`,
          dateOfBirth: `19${(80 + (i % 15))}-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
          gender: isFemale ? "Female" : "Male",
          educationLevel: "Uganda Advanced Certificate of Education (A-Level)",
          region: seed.name,
        },
      });
      guardRows.push({ id: guard.id, forceNumber, fullName, siteName, siteId: siteMap.get(siteName)! });
      created.guards += 1;
    }

    // K9 dogs for the two handlers
    for (let i = 0; i < 2; i += 1) {
      const handler = guardRows[i];
      const code = `K9-${seed.code}-${i + 1}`;
      await prisma.k9Dog.upsert({
        where: { code },
        update: { assignedHandlerId: handler.id, assignedHandlerName: handler.fullName },
        create: {
          code,
          name: i === 0 ? `Rex ${seed.code}` : `Bella ${seed.code}`,
          breed: i === 0 ? "German Shepherd" : "Belgian Malinois",
          chipNumber: `CHIP-${seed.code}-${i + 1}${pad(block)}`,
          ageYears: 3 + i,
          status: "Active Duty",
          assignedHandlerId: handler.id,
          assignedHandlerName: handler.fullName,
          kennelNumber: `${seed.code}-K${i + 1}`,
          rabiesVaccineDate: daysAgo(120 - i * 10),
          lastVetCheck: daysAgo(20 - i * 5),
          specialization: i === 0 ? "Explosive Detection" : "Narcotics Detection",
        },
      });
      created.k9 += 1;
    }

    // Armoury items assigned to guards
    const armourySpecs: { name: string; category: string; specs: string }[] = [
      { name: "Pistol (Makarov)", category: "Firearm", specs: "9mm / PKM" },
      { name: "Pump-Action Shotgun", category: "Firearm", specs: "12 Gauge" },
      { name: "Radio Set (Motorola)", category: "Communications", specs: "UHF / VHF" },
    ];
    for (let i = 0; i < armourySpecs.length; i += 1) {
      const target = guardRows[(i * 3) % guardRows.length];
      const assetTag = `ARM-${seed.code}-${i + 1}`;
      const existingArm = await prisma.armouryItem.findFirst({ where: { assetTag } });
      if (existingArm) {
        await prisma.armouryItem.update({
          where: { id: existingArm.id },
          data: { assignedToGuardId: target.id, assignedToGuardName: target.fullName, location: "Issued Out" },
        });
      } else {
        await prisma.armouryItem.create({
          data: {
            assetTag,
            serialNumber: `${seed.code}-${i + 1}-${pad(block)}`,
            category: armourySpecs[i].category,
            name: armourySpecs[i].name,
            caliberOrSpecs: armourySpecs[i].specs,
            totalQuantity: 1,
            availableQuantity: 0,
            condition: "Good",
            assignedToGuardId: target.id,
            assignedToGuardName: target.fullName,
            location: "Issued Out",
          },
        });
      }
      created.armoury += 1;
    }

    // Incidents
    const incidentSeed: { title: string; site: string; severity: string; status: string; daysAgoN: number; category: string; desc: string }[] = [
      { title: "Perimeter breach attempt at night", site: siteNames[0], severity: "Critical", status: "Escalated", daysAgoN: 2, category: "Unauthorized Entry", desc: "Suspects scaled perimeter wall; responding guard raised alarm. Case under investigation." },
      { title: "Theft of client property suspected", site: siteNames[1], severity: "High", status: "Under Investigation", daysAgoN: 8, category: "Theft Attempt", desc: "CCTV review underway; stock count variance flagged by client." },
      { title: "Minor medical emergency on duty", site: siteNames[2], severity: "Medium", status: "Resolved", daysAgoN: 25, category: "Medical Emergency", desc: "Guard reported dizzy spell; first aid administered and discharged." },
      { title: "Vehicle attempted to bypass checkpoint", site: siteNames[3 % siteNames.length], severity: "Medium", status: "Resolved", daysAgoN: 60, category: "Unauthorized Entry", desc: "Vehicle stopped at gate; driver lacked entry clearance." },
      { title: "Suspicious package reported", site: siteNames[0], severity: "Low", status: "Resolved", daysAgoN: 120, category: "Security Breach", desc: "Package cleared after inspection; no hazard found." },
    ];
    for (let i = 0; i < incidentSeed.length; i += 1) {
      const inc = incidentSeed[i];
      const code = `INC-${seed.code}-${pad(i + 1)}`;
      await prisma.incident.upsert({
        where: { incidentCode: code },
        update: { status: inc.status, severity: inc.severity },
        create: {
          incidentCode: code,
          title: inc.title,
          siteName: inc.site,
          reportedByGuard: guardRows[(i * 2) % guardRows.length].fullName,
          incidentDate: daysAgo(inc.daysAgoN),
          category: inc.category,
          severity: inc.severity,
          description: inc.desc,
          status: inc.status,
          evidenceAttached: inc.severity === "Critical" || inc.severity === "High",
        },
      });
      created.incidents += 1;
    }

    // Roster entries (recent week)
    for (let i = 0; i < guardRows.length; i += 1) {
      const g = guardRows[i];
      const shiftDate = daysAgo(i % 5);
      const existing = await prisma.dutyRoster.findFirst({ where: { guardId: g.id, shiftDate, siteId: g.siteId } });
      if (existing) continue;
      await prisma.dutyRoster.create({
        data: {
          guardId: g.id,
          guardName: g.fullName,
          siteId: g.siteId,
          siteName: g.siteName,
          region: seed.name,
          shiftDate,
          shiftType: i % 2 === 0 ? "Day Shift (06:00-18:00)" : "Night Shift (18:00-06:00)",
          status: ROSTER_STATUSES[i % ROSTER_STATUSES.length],
          checkInTime: i % 2 === 0 ? "06:00" : "18:00",
        },
      });
      created.rosters += 1;
    }

    // Patrol inspections
    const patrolSupervisors = [seed.rm, `${seed.name} Operations`, `${seed.name} Duty Supervisor`];
    for (let i = 0; i < 5; i += 1) {
      const site = siteNames[i % siteNames.length];
      const satisfactory = i % 3 !== 2;
      const code = `PAT-${seed.code}-${pad(i + 1)}`;
      await prisma.patrolInspectionLog.upsert({
        where: { inspectionCode: code },
        update: { overallRating: satisfactory ? "Satisfactory" : "Needs Corrective Action" },
        create: {
          inspectionCode: code,
          siteName: site,
          supervisorName: patrolSupervisors[i % patrolSupervisors.length],
          guardOnDuty: guardRows[(i * 3) % guardRows.length].fullName,
          inspectionTime: `${daysAgo(i % 6)}T${String(19 - i % 6).padStart(2, "0")}:30`,
          radioCheckStatus: i % 4 === 3 ? "Delayed Response" : "Responsive & Clear",
          uniformTurnout: i % 5 === 4 ? "Minor Flaw" : "Compliant",
          weaponEquipmentCheck: satisfactory ? "Secured & Safe" : "Defect Noted",
          overallRating: satisfactory ? "Satisfactory" : "Needs Corrective Action",
          remarks: satisfactory ? "Post found in order." : "Uniform correction required before next shift.",
        },
      });
      created.patrols += 1;
    }

    // Deployments
    for (let i = 0; i < 3; i += 1) {
      const g = guardRows[(i * 4) % guardRows.length];
      const siteName = siteNames[i % siteNames.length];
      const site = seed.sites.find((s) => s.siteName === siteName)!;
      const code = `DEP-${seed.code}-${pad(i + 1)}`;
      await prisma.siteDeployment.upsert({
        where: { deploymentCode: code },
        update: { status: "Active" },
        create: {
          deploymentCode: code,
          siteId: siteMap.get(siteName)!,
          siteName,
          clientName: site.clientName,
          guardId: g.id,
          guardName: g.fullName,
          shiftType: i % 2 === 0 ? "Day Shift (06:00-18:00)" : "Night Shift (18:00-06:00)",
          deployedBy: seed.rm,
          deployedAt: daysAgo(i * 7 + 3),
          status: "Active",
        },
      });
      created.deployments += 1;
    }

    // Deployment orders (one open in every region to surface in the risk strip)
    for (let i = 0; i < 1; i += 1) {
      const siteName = siteNames[siteNames.length - 1];
      const site = seed.sites[seed.sites.length - 1];
      const code = `ORD-${seed.code}-${pad(i + 1)}`;
      await prisma.deploymentOrder.upsert({
        where: { orderCode: code },
        update: { status: "Open" },
        create: {
          orderCode: code,
          siteId: siteMap.get(siteName)!,
          siteName,
          clientName: site.clientName,
          region: seed.name,
          requiredHeadcount: site.day + site.night,
          shiftType: "Both",
          targetStartDate: daysAgo(-3),
          targetEndDate: daysAgo(-28),
          requestedBy: `${seed.name} Regional Office`,
          status: "Open",
          assignedGuardIds: [],
        },
      });
      created.orders += 1;
    }

    // Complaints
    const complaintSeed: { site: string; category: string; desc: string; status: string }[] = [
      { site: siteNames[1], category: "Service Quality", desc: "Client reported a guard arriving late for the night shift handover.", status: "Investigating" },
      { site: siteNames[3 % siteNames.length], category: "Conduct & Integrity", desc: "Complaint about unfamiliar staff at the gate; referred for verification.", status: "Open" },
      { site: siteNames[2], category: "Service Quality", desc: "Request for extra weekend coverage during the peak season.", status: "Resolved" },
    ];
    for (let i = 0; i < complaintSeed.length; i += 1) {
      const c = complaintSeed[i];
      const site = seed.sites.find((s) => s.siteName === c.site)!;
      const code = `CMP-${seed.code}-${pad(i + 1)}`;
      await prisma.complaint.upsert({
        where: { complaintCode: code },
        update: { status: c.status },
        create: {
          complaintCode: code,
          clientName: site.clientName,
          siteName: c.site,
          category: c.category,
          description: c.desc,
          status: c.status,
          ownedBy: "Marketing",
          reportedDate: daysAgo(i * 5 + 1),
          satisfactionRating: c.status === "Resolved" ? 4 : undefined,
        },
      });
      created.complaints += 1;
    }

    // Client contracts
    const contractSeed: { title: string; party: string; site: string; valueM: number; status: string; endIn: number; payment: string }[] = [
      { title: `${seed.name} Regional Guarding SLA`, party: seed.sites[0].clientName, site: seed.sites[0].siteName, valueM: 120 + (block % 5) * 10, status: "Active", endIn: 180, payment: "Monthly in advance" },
      { title: `${seed.name} Perimeter Security Contract`, party: seed.sites[1].clientName, site: seed.sites[1].siteName, valueM: 60 + (block % 4) * 10, status: "Expiring Soon", endIn: 20, payment: "Monthly, due by 10th" },
    ];
    for (let i = 0; i < contractSeed.length; i += 1) {
      const c = contractSeed[i];
      const code = `CTR-CLI-${seed.code}-${pad(i + 1)}`;
      const startD = new Date();
      startD.setDate(startD.getDate() - 200);
      const endD = new Date();
      endD.setDate(endD.getDate() + c.endIn);
      await prisma.contract.upsert({
        where: { contractCode: code },
        update: { status: c.status },
        create: {
          contractCode: code,
          title: c.title,
          contractType: "Client Contract",
          partyName: c.party,
          category: "Corporate Client Service Agreement",
          startDate: startD.toISOString().split("T")[0],
          endDate: endD.toISOString().split("T")[0],
          valueUgx: c.valueM * 1_000_000,
          status: c.status,
          documentRef: `DOC-SLA-${seed.code}-${i + 1}.pdf`,
          managedBy: "Records Officer",
          region: seed.name,
          autoRenew: i === 0,
          paymentTerms: c.payment,
          billingCycle: "Monthly",
          slaTerms: `${seed.sites[i].day + seed.sites[i].night} guards, monthly supervision checks, 24/7 response`,
          notes: `Managed by ${seed.rm} (${seed.name} Regional Manager).`,
          preparedBy: "Ivan Ssebana",
          approvedBy: "Sarah Akello",
          approvalStep: "Done",
          relatedSiteName: c.site,
          createdBy: "Records Officer",
        },
      });
      created.contracts += 1;
    }

    // Leave requests
    for (let i = 0; i < 2; i += 1) {
      const g = guardRows[(i * 5 + 2) % guardRows.length];
      const leave = i === 0
        ? { leaveType: "Annual Leave", startDate: daysAgo(-5), endDate: daysAgo(-12), durationDays: 7, reason: "Family visit", status: "Pending HR Review" as const }
        : { leaveType: "Compassionate Leave", startDate: daysAgo(-1), endDate: daysAgo(-4), durationDays: 3, reason: "Family emergency", status: "Approved" as const };
      const existing = await prisma.leaveRequest.findFirst({ where: { guardId: g.id, startDate: leave.startDate } });
      if (existing) continue;
      await prisma.leaveRequest.create({
        data: {
          guardId: g.id,
          guardName: g.fullName,
          forceNumber: g.forceNumber,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          durationDays: leave.durationDays,
          reason: leave.reason,
          appliedDate: daysAgo(i === 0 ? 4 : 12),
          status: leave.status,
          approvedBy: i === 0 ? undefined : seed.rm,
        },
      });
      created.leave += 1;
    }

    // Disciplinary action (one per region, mostly low/medium)
    const disc = guardRows[guardRows.length - 1];
    const actionCode = `DISC-${seed.code}-001`;
    await prisma.disciplinaryAction.upsert({
      where: { actionCode },
      update: { status: "Initiated" },
      create: {
        actionCode,
        guardId: disc.id,
        guardName: disc.fullName,
        forceNumber: disc.forceNumber,
        actionType: "Warning Letter",
        reason: "Failure to register attendance on duty roster",
        severity: "Medium",
        status: "Initiated",
        initiatedBy: "Henry Kiyingi",
        offenceCategory: "Category 2",
        offence: "Failure to register attendance",
        zone: seed.name,
        actionTaken: "Hearing scheduled",
      },
    });
    created.disciplinary += 1;

    // Update regional office guard/site counts
    const gCount = await prisma.guard.count({ where: { region: seed.name } });
    const sCount = await prisma.clientSite.count({ where: { region: seed.name } });
    await prisma.regionalOffice.update({
      where: { code: `REG-${seed.code}` },
      data: { activeGuardsCount: gCount, clientSitesCount: sCount },
    });

    block += 100;
  }

  console.log("\n✓ Regional enrichment complete");
  console.table(created);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
