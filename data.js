/* =========================================================================
   EMB REGION VII — EIA COVERAGE SCREENING ENGINE
   Rebuilt from the official source documents:
   - EMB Memorandum Circular 005, s. 2014 (the "Blue Book"), full text
   - Annex A: Project Thresholds for Coverage Screening and Categorization
   - Annex B: Decision chart for project modification
   - Annex C: Pro-forma Project Description (CNC)
   All thresholds below are transcribed directly from the official PDF,
   not the earlier CSV export, to avoid symbol-corruption issues.
   ========================================================================= */

// ---- helpers --------------------------------------------------------------
// Standard 3-cut numeric rule shape used by ~80% of Annex A rows:
//   val >= a      -> Category A (EIS, EMB Central Office)
//   val >= beis   -> Category B (EIS, EMB Regional Office)
//   val >  dmax   -> Category B (IEE Checklist, EMB Regional Office)
//   else          -> Category D (not covered, optional CNC)
// Use Infinity to mean "None" (tier not reachable), 0 to mean "regardless of amount".
function N(a, beis, dmax) { return { a, beis, dmax }; }
const INF = Infinity;

const FORM_LINKS = {
  cncReq: { label: "CNC Online Requirements (2025)", url: "https://r7.emb.gov.ph/wp-content/uploads/2025/04/CNC-ONLINE-REQUIREMENTS-V2025.pdf" },
  cncGuide: { label: "CNC Online User Guide", url: "https://r7.emb.gov.ph/wp-content/uploads/2020/07/2-CNC-Online-2020-Updated-User-Guide.pdf" },
  eccGeneric: { label: "ECC Application Requirements", url: "https://r7.emb.gov.ph/wp-content/uploads/2026/01/ECC_Application_Requirements.pdf" },
  eccGuide: { label: "ECC Application Guide", url: "https://r7.emb.gov.ph/wp-content/uploads/2026/01/ECC_Application_Guide.pdf" },
  catCScreen: { label: "CNC pre-1982 / Category C: Requirements and Screening Form", url: "https://r7.emb.gov.ph/wp-content/uploads/2019/07/8-CNC-pre-1982-or-Category-C-Screening.pdf" },
  catCForm: { label: "CNC pre-1982 / Category C: Application Form", url: "https://r7.emb.gov.ph/wp-content/uploads/2019/07/9-CNC-pre-1982-or-Category-C-Application-Form.pdf" },
  minorAmend: { label: "EMB MC 2021-05 ECC Minor Amendment Updated Requirements", url: "https://r7.emb.gov.ph/downloadables-v3-0/#tab-145012" },
  majorAmend: { label: "ECC Major Amendment Requirements", url: "https://r7.emb.gov.ph/wp-content/uploads/2018/09/ECCMajorAmendReq.pdf" },
  relief: { label: "ECC Relief Requirements / Screening Form", url: "https://r7.emb.gov.ph/downloadables-v3-0/#tab-145012" },
  preScoping: { label: "Pre Public Scoping Requirements / Screening Form", url: "https://r7.emb.gov.ph/downloadables-v3-0/#tab-145012" },
  eisFlow: { label: "EIS Process Flow", url: "https://r7.emb.gov.ph/downloadables-v3-0/#tab-145012" },
  lucForm: { label: "Land Use Conversion (LUC) Requirements / Screening Form + Form No. 6", url: "https://r7.emb.gov.ph/downloadables-v3-0/#tab-145012" },
  ieeChecklist: { label: "Generic IEE Checklist", url: "https://r7.emb.gov.ph/wp-content/uploads/2019/07/20-GENERIC-IEE-checklist-form.docx" },
  annex1c: { label: "Items I to III of Annex 1-C of EMB MC 2010-14", url: "https://r7.emb.gov.ph/wp-content/uploads/2019/07/21-Annex-1-C-EPRMP-Format.pdf" },
  pemaps: { label: "PEMAPS Questionnaire", url: "https://r7.emb.gov.ph/downloadables-v3-0/#tab-145012" },
  abandonment: { label: "Abandonment, Rehabilitation and/or Decommissioning Plan", url: "https://r7.emb.gov.ph/downloadables-v3-0/#tab-145012" },
  accountability: { label: "Accountability Statement of Project Proponent", url: "https://r7.emb.gov.ph/wp-content/uploads/2023/09/IEE-SWORN-STATEMENT-v2023.docx" }
};

// Which forms apply per outcome type (used to build the "what to submit" panel)
const FORMS_BY_OUTCOME = {
  "A-EIS":  [FORM_LINKS.eccGeneric, FORM_LINKS.eccGuide, FORM_LINKS.preScoping, FORM_LINKS.eisFlow, FORM_LINKS.pemaps, FORM_LINKS.accountability, FORM_LINKS.abandonment],
  "B-EIS":  [FORM_LINKS.eccGeneric, FORM_LINKS.eccGuide, FORM_LINKS.preScoping, FORM_LINKS.eisFlow, FORM_LINKS.pemaps, FORM_LINKS.accountability, FORM_LINKS.abandonment],
  "B-IEE":  [FORM_LINKS.eccGeneric, FORM_LINKS.eccGuide, FORM_LINKS.ieeChecklist, FORM_LINKS.annex1c, FORM_LINKS.accountability],
  "C":      [FORM_LINKS.catCScreen, FORM_LINKS.catCForm],
  "D":      [FORM_LINKS.cncReq, FORM_LINKS.cncGuide, FORM_LINKS.catCScreen, FORM_LINKS.catCForm],
  "AMEND_MINOR": [FORM_LINKS.minorAmend],
  "AMEND_MAJOR": [FORM_LINKS.majorAmend, FORM_LINKS.relief]
};

/* ---- SECTION 1: HEAVY AND OTHER PROCESSING/MANUFACTURING INDUSTRIES ---- */
const DATA = [
{code:"1.1–1.2", amended:'MC 2021-12 (July 2021) regrouped these as Metal Industries. Non-ferrous metal industries and iron and steel mills are now Category A (EIS) regardless of capacity. The old 30,000 / 10,000 MT tiers no longer apply.', name:"Non-Ferrous Metal Industries / Iron and Steel Mills", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"Regardless of production capacity (MC 2021-12)", kind:"fixed", result:{cat:"A-EIS",label:"Category A (ECP)"},
 aliases:"non-ferrous metal smelting steel mill ironworks foundry rolling mill rebar sintering ironmaking steelmaking continuous casting ferroalloy metal industries"},
{code:"1.3.1", name:"Petrochemical or Petroleum-based Manufacturing", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(30000,10000,200),
 aliases:"petrochemical petroleum plant lng cng hydrocarbon"},
{code:"1.3.2", name:"Refineries", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"barrels", basis:"Annual production rate", kind:"numeric", t:N(30000,10000,200),
 aliases:"oil refinery petroleum refining"},
{code:"1.3.3", name:"Recycling of Oil and Other Petroleum-based Chemicals", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Daily production rate", kind:"numeric", t:N(10,5,1),
 aliases:"used oil recycling waste oil"},
{code:"1.3.4", name:"LPG/LNG/CNG/Similar Product Storage and Refilling", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Total storage capacity", kind:"numeric", t:N(INF,10,0), altUnits:[{label:"MT",factor:1},{label:"kg",factor:0.001}],
 aliases:"lpg refilling station gas depot cng storage"},
{code:"1.3.5", name:"Storage of Petroleum, Petrochemical or Related Products (incl. blending)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"kL", basis:"Total storage capacity", kind:"numeric", t:N(INF,20000,20), altUnits:[{label:"kL",factor:1},{label:"L",factor:0.001}],
 aliases:"fuel depot oil terminal petroleum storage"},
{code:"1.3.6", name:"Refilling Station / Gasoline Station Projects", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"kL", basis:"Total storage capacity", kind:"numeric", t:N(INF,20000,20), altUnits:[{label:"kL",factor:1},{label:"L",factor:0.001}],
 aliases:"gas station gasoline station fuel station refilling station auto repair shop car repair shop motor shop mechanic shop vulcanizing shop engine shop shop with gasoline storage"},
{code:"1.4", amended:'MC 2021-12 (July 2021): smelting plants are Category A (EIS) regardless of capacity. The old 15,000 MT threshold no longer applies.', name:"Smelting Plants", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"Regardless of production capacity (MC 2021-12)", kind:"fixed", result:{cat:"A-EIS",label:"Category A (ECP)"},
 aliases:"metal smelting foundry"},
{code:"1.5.1", name:"Manufacturing/Processing/Use of PCL or CCO Substances (RA 6969)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT/yr", basis:"Annual production rate", kind:"numeric", t:N(INF,1,0),
 aliases:"priority chemical list chemical control order ra 6969 hazardous chemicals manufacturing"},
{code:"1.5.2", name:"Manufacture of Agri-chemicals, Industrial Chemicals & Other Substances (not PCL/CCO)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,30000,200),
 aliases:"agri-chemical industrial chemical fertilizer plant pesticide manufacturing"},
{code:"1.5.3", name:"Manufacture of Explosives, Propellants, and Industrial Gases", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,5,0),
 aliases:"explosives propellants industrial gas manufacturing ammunition fireworks"},
{code:"1.5.4", name:"Pharmaceutical Industries; Soap/Detergent, Health & Beauty, Consumer Products", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,50000,200),
 aliases:"pharmaceutical drug manufacturing soap detergent cosmetics"},
{code:"1.5.5", name:"Surface Coating Industries (paints, varnishes, lacquers, printing inks)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,30000,200),
 aliases:"paint factory varnish lacquer printing ink manufacturing"},
{code:"1.6.1", name:"Animal Products Processing (fish/meat processing, canning, slaughterhouse, crabmeat)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,2500,200),
 aliases:"slaughterhouse meat processing fish canning crabmeat marine products"},
{code:"1.6.2", name:"Coconut Processing Plants", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,25000,200),
 aliases:"coconut oil copra processing"},
{code:"1.6.3", name:"Distillation and Fermentation Plants (e.g. bioethanol)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,50000,200),
 aliases:"bioethanol distillery fermentation plant"},
{code:"1.6.4", name:"Food Preservation (drying, freezing) aside from canning", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"For canning, refer to other categories", kind:"fixed", result:{cat:"D",label:"Category D"},
 aliases:"food drying freezing preservation"},
{code:"1.6.5", name:"Ice Plant / Processing", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"Regardless of capacity", kind:"fixed", result:{cat:"B-IEE",label:"Category B (IEE Checklist)"},
 aliases:"ice plant"},
{code:"1.6.6", name:"Agricultural Processing (rice, corn, vegetables, fruits, other agri products)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,50000,5000),
 aliases:"rice corn vegetable fruit agricultural processing"},
{code:"1.6.7", name:"Rice / Corn Mill", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"ton/hr", basis:"Hourly production rate", kind:"numeric", t:N(INF,INF,1),
 aliases:"rice mill corn mill palay milling", note:"Mill with polishing = Category B (IEE) regardless of rate."},
{code:"1.6.8", name:"Other Types of Food Processing Industries", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,50000,200),
 aliases:"food processing plant"},
{code:"1.6.9", name:"Processing of Dairy Products", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"Monthly production rate", kind:"unit_choice",
 choices:[
  {label:"Liquid (milk, etc.)", unit:"L", t:N(INF,10000,100), altUnits:[{label:"L",factor:1},{label:"kL",factor:1000}]},
  {label:"Solid (cheese, powder, etc.)", unit:"MT", t:N(INF,100,1), altUnits:[{label:"MT",factor:1},{label:"kg",factor:0.001}]}
 ],
 aliases:"dairy milk processing cheese yogurt powdered milk"},
{code:"1.6.10", name:"Sugar Mills", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual (rated) production rate", kind:"numeric", t:N(INF,50000,200),
 aliases:"sugar mill sugarcane milling"},
{code:"1.7.1", name:"Leather and Related Industries", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,2500,200),
 aliases:"leather tannery"},
{code:"1.7.2", name:"Textile, Wood, Rubber and Fiber Glass Industries", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,50000,1000),
 aliases:"textile mill rubber fiberglass industry"},
{code:"1.7.3", name:"Wood and Metal Furniture Assembly", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"Regardless of capacity or area", kind:"bool", question:"Does the process involve bleaching, sanding, or similar treatment?",
 yes:{cat:"B-IEE",label:"Category B (IEE Checklist)"}, no:{cat:"D",label:"Category D"},
 aliases:"furniture assembly woodworking"},
{code:"1.7.4", name:"Glass-based Products Manufacturing", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,INF,30000),
 aliases:"glass manufacturing glassware"},
{code:"1.7.5", name:"Metal-based Products Manufacturing (incl. semiconductors, electronics)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"Annual use of PCL/CCO substances (EIS); annual production rate (IEE/D)", kind:"chem_capacity", amended:'Checked against MC 2021-12 (Section V.d): the figures are unchanged. 1.0 MT PCL/CCO use or more = EIS; more than 15,000 MT/year OR PCL/CCO below 1.0 MT = IEE; up to 15,000 MT and no PCL/CCO = not covered (CNC).',
 highChem:{cat:"B-EIS",label:"Category B (EIS)"}, lowChem:{cat:"B-IEE",label:"Category B (IEE Checklist)"}, noChemThreshold:15000, noChemAbove:{cat:"B-IEE",label:"Category B (IEE Checklist)"}, noChemBelow:{cat:"D",label:"Category D"},
 aliases:"metal fabrication electroplating semiconductor electronics assembly metal finishing"},
{code:"1.7.6", name:"Garment Manufacturing / Industries", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"", basis:"Regardless of capacity or area", kind:"bool", question:"Does the process involve dyeing?",
 yes:{cat:"B-IEE",label:"Category B (IEE Checklist)"}, no:{cat:"D",label:"Category D"},
 aliases:"garment factory sewing textile dyeing"},
{code:"1.7.7", name:"Pulp and Paper Industries", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(50000,10000,200),
 aliases:"pulp mill paper mill"},
{code:"1.7.8", name:"Paper and Plastic-based Products", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,INF,15000),
 aliases:"plastic products paper products manufacturing"},
{code:"1.7.9", name:"Car and Trucks Assembly", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"ha", basis:"Total/gross floor area", kind:"numeric", t:N(INF,2.5,0), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"vehicle assembly car plant truck assembly"},
{code:"1.7.10", name:"Shipbuilding / Boatbuilding / Marine Vessel Manufacturing (incl. ship breaking)", section:"1. Heavy & Other Processing/Manufacturing Industries", unit:"DWT", basis:"Boat/ship capacity", kind:"numeric", t:N(INF,500,5),
 aliases:"shipyard boatbuilding ship breaking salvaging"},

/* ---- SECTION 2: RESOURCE EXTRACTIVE INDUSTRIES ---- */
{code:"2.1.1", name:"Coal Mining", section:"2. Resource Extractive Industries", unit:"MT", basis:"Annual extraction rate", kind:"numeric", t:N(70000,20000,0),
 aliases:"coal mine mining"},
{code:"2.1.2", name:"Extraction of Metallic Ores/Minerals (on shore)", section:"2. Resource Extractive Industries", unit:"", basis:"Annual extraction rate AND project area — both count", kind:"dual",
 dims:[
  {label:"Annual extraction rate", unit:"MT", t:N(100000,20000,0)},
  {label:"Project area", unit:"ha", t:N(25,Infinity,Infinity)}
 ],
 aliases:"metallic ore mining mineral extraction onshore mining"},
{code:"2.1.3-sg", amended:'MC 2020-27 (June 2020): sand and gravel is Category B only. EIS if the area is more than 20 ha, IEE (online) if 20 ha or less. The EIA report must include a geologic study of the mineral reserves and replenishment rate (MGB-approved).', name:"Extraction of Sand and Gravel", section:"2. Resource Extractive Industries", unit:"ha", basis:"Project area (MC 2020-27)", kind:"numeric", t:N(INF,20.0001,0), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 note:"Conditions under MC 2020-27 for all sand and gravel and quarry operations: one entry and one exit with CCTV connected to the EMB Regional Office server; monthly drone shots of the activity area; sand and gravel keeps a uniform extraction depth; quarries do not go below road level. Read with DAO 2015-02 and MC 2016-006.",
 aliases:"sand gravel dredging river extraction aggregates quarry sand and gravel"},
{code:"2.1.3-q", amended:'MC 2020-27 (June 2020): quarry of limestone, shale, silica, placer and other non-metal minerals. Category A if 75,000 tons or more OR area 20 ha or more. Category B (EIS) if 50,000 to under 75,000 tons AND area under 20 ha. Category B (IEE online) if under 50,000 tons AND area under 5 ha. The circular does not say what applies to under 50,000 tons with 5 to 20 ha; the tool treats that as EIS to be safe, so confirm with the Section.', name:"Quarry of Limestone / Shale / Silica / Placer and other Non-metal Minerals", section:"2. Resource Extractive Industries", unit:"", basis:"Extraction volume AND project area — both count (MC 2020-27)", kind:"dual",
 dims:[
  {label:"Extraction volume", unit:"tons", t:N(75000,50000,0)},
  {label:"Project area", unit:"ha", t:N(20,5,0)}
 ],
 note:"Conditions under MC 2020-27 for all sand and gravel and quarry operations: one entry and one exit with CCTV connected to the EMB Regional Office server; monthly drone shots of the activity area; sand and gravel keeps a uniform extraction depth; quarries do not go below road level. Read with DAO 2015-02 and MC 2016-006.",
 aliases:"quarry limestone shale silica clay placer non-metal minerals aggregates"},
{code:"2.1.4-oil", name:"Extraction of Oil (Land-based, Commercial)", section:"2. Resource Extractive Industries", unit:"barrels/day", basis:"Daily extraction rate", kind:"numeric", t:N(4000,500,0),
 aliases:"oil extraction onshore drilling well"},
{code:"2.1.4-gas", name:"Extraction of Gas (Land-based, Commercial)", section:"2. Resource Extractive Industries", unit:"m³/day", basis:"Daily extraction rate", kind:"numeric", t:N(250000,50000,0),
 aliases:"gas extraction onshore drilling well natural gas"},
{code:"2.1.5", name:"Extraction of Metallic/Non-metallic Minerals incl. Oil, Gas, Deuterium (off-shore)", section:"2. Resource Extractive Industries", unit:"", basis:"Regardless of commercial capacity or area", kind:"fixed", result:{cat:"A-EIS",label:"Category A (ECP)"},
 aliases:"offshore mining offshore drilling deuterium extraction"},
{code:"2.1.6a", name:"Metallic Mineral or Ore Processing", section:"2. Resource Extractive Industries", unit:"MT", basis:"Annual processing rate (based on inputs)", kind:"numeric", t:N(70000,10000,200),
 aliases:"ore processing mineral processing metallic"},
{code:"2.1.6b", name:"Precious/Noble Metal Refining (incl. jewelry-making)", section:"2. Resource Extractive Industries", unit:"", basis:"Annual use of PCL/CCO substances", kind:"select",
 options:[
   {label:"Uses PCL/CCO substances, ≥1.0 MT/year", cat:"B-EIS", out:{cat:"B-EIS",label:"Category B (EIS)"}},
   {label:"Uses PCL/CCO substances, <1.0 MT/year", cat:"B-IEE", out:{cat:"B-IEE",label:"Category B (IEE Checklist)"}},
   {label:"Does not use chemicals", cat:"D", out:{cat:"D",label:"Category D"}}
 ],
 aliases:"gold refining jewelry making precious metal refining"},
{code:"2.1.6c", name:"Non-metallic Mineral Processing (cement, clinker, limestone, ceramics, glass, calcium)", section:"2. Resource Extractive Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(50000,10000,200),
 aliases:"cement plant clinker ceramics glass processing calcium"},
{code:"2.1.6d", name:"Natural Stone (e.g. marble) Processing Plant", section:"2. Resource Extractive Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,INF,10000),
 aliases:"marble processing natural stone"},
{code:"2.1.6e", name:"Batching and Crushing Plant; Sand and Gravel Washing", section:"2. Resource Extractive Industries", unit:"", basis:"Regardless of size or capacity", kind:"bool", question:"Will the facility be mobile, or operated for less than 1 year?",
 yes:{cat:"D",label:"Category D"}, no:{cat:"B-IEE",label:"Category B (IEE Checklist)"},
 aliases:"batching plant crushing plant sand washing gravel washing"},
{code:"2.2.1", name:"Forestry Projects (CBFRU, IFMA, TLA, PLTU, DENR co-managed)", section:"2. Resource Extractive Industries", unit:"m³", basis:"Annual volume of trees to be cut", kind:"numeric", t:N(10000,5000,100),
 aliases:"logging timber forest utilization cbfru ifma tla forestry"},
{code:"2.2.2", name:"Wood Processing Projects", section:"2. Resource Extractive Industries", unit:"m³", basis:"Equivalent products per year", kind:"numeric", t:N(10000,4000,100),
 aliases:"wood processing lumber sawmill"},
{code:"2.2.3-public", name:"Introduction of Exotic Fauna (in Public Forest Land)", section:"2. Resource Extractive Industries", unit:"", basis:"Regardless of number or area", kind:"fixed", result:{cat:"A-EIS",label:"Category A (ECP)"},
 aliases:"exotic fauna public forest wildlife introduction"},
{code:"2.2.3-private", name:"Introduction of Exotic Fauna (in Private Forest Land) / Exotic Flora (Public or Private)", section:"2. Resource Extractive Industries", unit:"", basis:"Regardless of number or area", kind:"select",
 options:[
   {label:"Exotic fauna, private land", out:{cat:"B-EIS",label:"Category B (EIS)"}},
   {label:"Exotic flora, public or private land", out:{cat:"B-IEE",label:"Category B (IEE Checklist)"}}
 ],
 aliases:"exotic flora private forest introduction"},
{code:"2.2.4", name:"Grazing Projects", section:"2. Resource Extractive Industries", unit:"AU (animal unit)", basis:"Animal unit / grazing capacity", kind:"numeric", t:N(500,100,10),
 aliases:"grazing livestock ranch cattle grazing"},
{code:"2.2.5", name:"Wildlife Farming (protection, conservation, commercial; BMB-defined)", section:"2. Resource Extractive Industries", unit:"", basis:"Based on project area", kind:"bool", question:"Is this a butterfly farm?",
 yes:{cat:"D",label:"Category D"}, no:{cat:"B-IEE",label:"Category B (IEE Checklist)"},
 aliases:"wildlife farm butterfly farm conservation facility"},
{code:"2.2.6", name:"Breeding/Propagation of Threatened, Exotic, or Indigenous Species", section:"2. Resource Extractive Industries", unit:"heads/species", basis:"Parental stock", kind:"numeric", t:N(INF,50,50),
 aliases:"wildlife breeding endangered species propagation"},
{code:"2.2.7a", name:"Livestock / Piggery Project (pigs, goats)", section:"2. Resource Extractive Industries", unit:"heads", basis:"Stocking population", kind:"numeric", t:N(INF,5000,100),
 aliases:"piggery hog raising pig farm goat farm swine baboy kanding hog pen livestock pigpen"},
{code:"2.2.7b", name:"Ostrich Farming", section:"2. Resource Extractive Industries", unit:"", basis:"Stocking population AND project area — both count", kind:"dual",
 dims:[
  {label:"Stocking population", unit:"heads", t:N(INF,1000,100)},
  {label:"Project area", unit:"ha", t:N(INF,1,1)}
 ],
 aliases:"ostrich farm"},
{code:"2.2.7c", name:"Livestock / Poultry Project (birds)", section:"2. Resource Extractive Industries", unit:"heads", basis:"Stocking population", kind:"numeric", t:N(INF,100000,10000),
 aliases:"poultry farm chicken farm broiler layer bird farm manok duck itik quail"},
{code:"2.2.7d", name:"Other Livestock Project", section:"2. Resource Extractive Industries", unit:"AU", basis:"Animal unit", kind:"numeric", t:N(INF,50,10),
 aliases:"livestock farm other animals"},
{code:"2.2.8a", name:"Agricultural Plantation (orchards, rubber plantation)", section:"2. Resource Extractive Industries", unit:"ha", basis:"Project area", kind:"numeric", t:N(INF,500,50), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"plantation orchard rubber farm agriculture"},
{code:"2.2.8b", name:"Animal Feed Mill", section:"2. Resource Extractive Industries", unit:"MT", basis:"Annual production rate", kind:"numeric", t:N(INF,2500,200),
 aliases:"feed mill animal feed"},
{code:"2.3.1", name:"Fishery/Aquaculture Projects (fresh/brackish water, incl. pearl farm); Dikes/Fishpond Development", section:"2. Resource Extractive Industries", unit:"ha", basis:"Project area", kind:"numeric", t:N(25,5,1), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"fishpond aquaculture fish farm pearl farm dike seaweed farming isda fish cage bangus tilapia hatchery fishpond catwalk fishpond walkway"},

/* ---- SECTION 3: INFRASTRUCTURE PROJECTS ---- */
{code:"3.1.1", name:"Dams (irrigation, flood control, water source, hydropower, run-of-river)", section:"3. Infrastructure Projects", unit:"", basis:"Reservoir area AND water storage volume — both count", kind:"dual",
 dims:[
  {label:"Reservoir area", unit:"ha", t:N(25,5,0)},
  {label:"Water storage volume", unit:"million m³", t:N(20,5,0)}
 ],
 aliases:"dam reservoir impoundment"},
{code:"3.1.2", name:"Irrigation Projects (distribution system only)", section:"3. Infrastructure Projects", unit:"ha", basis:"Service area", kind:"numeric", t:N(INF,1000,300), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"irrigation canal distribution system"},
{code:"3.1.3", amended:'MC 2024-003 (July 2024) replaced the type-only rule in Annex A with these levels: surface water with impoundment = Category A (see Dams 3.1.1); source plus treatment (incl. reverse osmosis) above 5 MLD = EIS; 1 to 5 MLD or Level III = IEE (online); Level I, Level II and water refilling stations = CNC.', name:"Water Supply Projects (without dam)", section:"3. Infrastructure Projects", unit:"", basis:"Type of water supply system and treated volume (MC 2024-003)", kind:"select",
 options:[
  {label:"Surface water source with an impoundment (dam or reservoir) — refer to Dams 3.1.1", out:{cat:"A-EIS",label:"Category A (ECP)"}},
  {label:"Own water source (groundwater, surface water, etc.) with treatment facilities incl. reverse osmosis — more than 5 million liters per day (MLD)", out:{cat:"B-EIS",label:"Category B (EIS)"}},
  {label:"Own water source with treatment facilities incl. reverse osmosis — 1 MLD up to 5 MLD", out:{cat:"B-IEE",label:"Category B (IEE Checklist)"}},
  {label:"Level III (waterworks system with household taps) — including those with disinfection only, e.g. chlorine dosing", out:{cat:"B-IEE",label:"Category B (IEE Checklist)"}},
  {label:"Level I (point source: deep well, spring, infiltration gallery), Level II (communal faucet) or a water refilling station, even with reverse osmosis", out:{cat:"D",label:"Category D"}}
 ],
 note:"Per MC 2024-003, Level III with disinfection only needs an IEE through the online system, and all water refilling stations are outside the EIS System but may secure a CNC. The circular does not state what applies to a treatment facility below 1 MLD that is not Level III; ask the Section.",
 aliases:"water supply waterworks water treatment plant deep well water refilling station desalination reverse osmosis level 3 level 2 level 1 water district"},
{code:"3.2.1", name:"Gas-fired Thermal Power Plants", section:"3. Infrastructure Projects", unit:"MW", basis:"Total power generating capacity", kind:"numeric", t:N(50,10,1),
 aliases:"gas power plant thermal power"},
{code:"3.2.2", name:"Geothermal Facilities", section:"3. Infrastructure Projects", unit:"MW", basis:"Total power generating capacity", kind:"numeric", t:N(50,10,1),
 aliases:"geothermal plant power"},
{code:"3.2.3", name:"Hydropower Facilities", section:"3. Infrastructure Projects", unit:"MW", basis:"Total power generating capacity", kind:"numeric_or", t:N(50,10,1), orLabel:"Will the project involve tunneling?", orMinResult:{cat:"B-EIS",label:"Category B (EIS)"},
 aliases:"hydropower mini-hydro run-of-river power plant"},
{code:"3.2.4", name:"Other Thermal Power Plants (coal, diesel, bunker, etc.)", section:"3. Infrastructure Projects", unit:"MW", basis:"Total power generating capacity", kind:"numeric", t:N(30,10,1),
 aliases:"coal power plant diesel power bunker power thermal"},
{code:"3.2.5", name:"Power Barges", section:"3. Infrastructure Projects", unit:"MW", basis:"Total power generating capacity", kind:"numeric", t:N(50,10,1),
 aliases:"power barge floating power plant"},
{code:"3.2.6", name:"Fuel Cell", section:"3. Infrastructure Projects", unit:"MW", basis:"Total power generating capacity", kind:"numeric", t:N(100,INF,5),
 aliases:"fuel cell power"},
{code:"3.2.7", name:"Renewable Energy (ocean, solar, wind, tidal — excl. waste-to-energy/biogas)", section:"3. Infrastructure Projects", unit:"MW", basis:"Total power generating capacity", kind:"numeric", t:N(INF,100,5), altUnits:[{label:"MW",factor:1}],
 note:"Ground-mounted/onshore only. If this is floating solar on a lake/reservoir, or an offshore wind project, search those specifically — they now have their own dedicated DENR Administrative Orders (see below) rather than falling under this generic renewable-energy line.",
 aliases:"solar farm wind farm tidal ocean renewable energy onshore solar"},
{code:"3.2.7-fpv", name:"Floating Photovoltaic (FPV) / Floating Solar Projects", section:"3. Infrastructure Projects — Newer DAO, outside the original 2014 Annex A", unit:"", basis:"Capacity AND footprint — either can trigger the higher tier", kind:"dual",
 dims:[
  {label:"Installed capacity", unit:"MW", t:N(INF,100,0)},
  {label:"Project footprint", unit:"ha", t:N(INF,100,0)}
 ],
 note:"Per DAO 2025-20 (as amended by DAO 2025-30): FPV projects are ALWAYS Category B — even at the EIS tier, jurisdiction stays with the EMB Regional Office, unlike most other Category-B-to-A escalation patterns in Annex A. Exception: FPV projects specifically within Laguna Lake are instead governed by DAO 2023-08, as amended by DAO 2024-05, not DAO 2025-20. DAO 2025-20 also carries its own detailed sub-component threshold table (Annex A of that DAO) for things like transmission lines and onshore facilities tied to the FPV project — this tool only reflects the headline capacity/footprint rule; confirm sub-component specifics against the DAO text directly.",
 legalSource:"DENR Administrative Order No. 2025-20, as amended by DAO No. 2025-30 (\"Guidelines in Securing ECC under the PEISS for Floating Photovoltaic Projects on Inland Freshwater Bodies\") — not part of the original 2014 Annex A",
 aliases:"floating solar floating photovoltaic fpv solar on lake solar on reservoir lake solar"},
{code:"3.2.7-osw", name:"Offshore Wind (OSW) Energy Projects", section:"3. Infrastructure Projects — Newer DAO, outside the original 2014 Annex A", unit:"", basis:"Requires an ECC under its own interim guidelines", kind:"fixed",
 result:{cat:"B-EIS", label:"Covered — category/tier not fully published in accessible sources"},
 note:"DAO 2024-02 (interim OSW guidelines) has been superseded by DAO 2026-09 (Enhanced ECC guidelines for Offshore Wind), read with DAO 2025-25, which requires a Coastal and Disaster Risk Assessment (CDRA) in the EIS. These confirm OSW projects require an ECC, but a specific capacity threshold splitting EIS vs. IEE could not be confirmed from public sources as of this tool's last update. Treat the result shown here as a placeholder — verify the actual document/category requirement against the DAO 2026-09 text or with EMB directly before advising a client.",
 legalSource:"DENR Administrative Order No. 2026-09 (supersedes DAO 2024-02); read with DAO 2025-25 — not part of the original 2014 Annex A; specific thresholds unverified",
 aliases:"offshore wind osw wind power at sea wind turbine offshore"},
{code:"3.2.8", name:"Waste-to-Energy — Power Projects", section:"3. Infrastructure Projects", unit:"MW", basis:"Total generating capacity", kind:"numeric", t:N(INF,50,1),
 aliases:"waste to energy power plant"},
{code:"3.2.9a", name:"Waste-to-Energy — Biogas Projects", section:"3. Infrastructure Projects", unit:"MT", basis:"Total rated capacity", kind:"numeric", t:N(INF,5,1),
 aliases:"biogas plant waste to energy"},
{code:"3.2.9b", name:"Power Transmission Lines", section:"3. Infrastructure Projects", unit:"kV", basis:"Voltage rating", kind:"numeric", t:N(INF,INF,138),
 aliases:"transmission line power line"},
{code:"3.2.10", name:"Substation / Switchyard", section:"3. Infrastructure Projects", unit:"kV", basis:"Voltage rating", kind:"numeric", t:N(INF,INF,220),
 aliases:"substation switchyard"},
{code:"3.3", name:"Reclamation and Other Land Restoration Projects", section:"3. Infrastructure Projects", unit:"ha", basis:"Area reclaimed/restored", kind:"numeric", t:N(25,5,0), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"reclamation land restoration foreshore filling"},
{code:"3.4.1", name:"Roads, New Construction", section:"3. Infrastructure Projects", unit:"", basis:"Road classification and whether it crosses critical/sloping terrain", kind:"unit_choice",
 choices:[
  {label:"National road — no critical slope", unit:"km", t:N(20,20,2)},
  {label:"National road — through critical slope/terrain", unit:"km", t:N(10,10,2)},
  {label:"Provincial/city/municipal road — no critical slope", unit:"km", t:N(INF,20,2)},
  {label:"Provincial/city/municipal road — through critical slope/terrain", unit:"km", t:N(INF,10,2)}
 ],
 note:"A National road that hits the length threshold reaches Category A (ECP); a Provincial/other road at the same length only reaches Category B (EIS) — Annex A treats these as separate rows. Crossing a critical slope/terrain area halves the length threshold under both classifications.",
 aliases:"new road construction highway national road provincial road city road municipal road barangay road"},
{code:"3.4.2", name:"Roads — Widening, Rehabilitation and/or Improvement", section:"3. Infrastructure Projects", unit:"", basis:"Total road length (with >50% increase in capacity, length, or width), whether it crosses critical/sloping terrain", kind:"unit_choice",
 choices:[
  {label:"No critical slope/terrain", unit:"km", t:N(INF,20,2)},
  {label:"Through critical slope/terrain", unit:"km", t:N(INF,10,2)}
 ],
 note:"This threshold applies only when the widening/rehabilitation also increases capacity, length, or width by more than 50% — the tool does not yet gate on that condition separately, so confirm it applies before relying on the result. Crossing a critical slope/terrain area halves the length threshold.",
 aliases:"road widening rehabilitation improvement road upgrade"},
{code:"3.4.3", name:"Bridges and Viaducts, New Construction", section:"3. Infrastructure Projects", unit:"km", basis:"Total length", kind:"numeric", t:N(10,5,0.05),
 aliases:"bridge viaduct elevated road"},
{code:"3.4.4", name:"Bridges and Viaducts, Rehabilitation and/or Improvement", section:"3. Infrastructure Projects", unit:"km", basis:"Total length", kind:"numeric", t:N(INF,10,2),
 aliases:"bridge rehabilitation improvement"},
{code:"3.4.5", name:"Roads — Flyover / Cloverleaf / Interchanges", section:"3. Infrastructure Projects", unit:"", basis:"Regardless of length and width", kind:"fixed", result:{cat:"B-IEE",label:"Category B (IEE Checklist)"},
 aliases:"flyover cloverleaf interchange"},
{code:"3.4.6", name:"Pedestrian Passages", section:"3. Infrastructure Projects", unit:"", basis:"Underpass vs overpass", kind:"bool", question:"Is this an underpass?",
 yes:{cat:"B-IEE",label:"Category B (IEE Checklist)"}, no:{cat:"D",label:"Category D (overpass)"},
 aliases:"pedestrian overpass underpass walkway"},
{code:"3.4.7", name:"Tunnels and Sub-grade Roads and Railways", section:"3. Infrastructure Projects", unit:"km", basis:"Total length", kind:"numeric", t:N(1,0,0),
 aliases:"tunnel subway subgrade railway"},
{code:"3.4.8", name:"On-grade Railway System, New", section:"3. Infrastructure Projects", unit:"", basis:"Regardless of length and width", kind:"fixed", result:{cat:"A-EIS",label:"Category A (ECP)"},
 aliases:"railway train system on-grade"},
{code:"3.5.1", name:"Airports", section:"3. Infrastructure Projects", unit:"", basis:"Airport type", kind:"select",
 options:[
   {label:"International Airport", out:{cat:"B-EIS",label:"Category B (EIS)"}},
   {label:"Domestic Airport", out:{cat:"B-IEE",label:"Category B (IEE Checklist)"}},
   {label:"Private Airstrip", out:{cat:"D",label:"Category D"}}
 ],
 aliases:"airport airstrip runway"},
{code:"3.5.2", name:"Land Transport Terminal (buses, jeepneys, other modes)", section:"3. Infrastructure Projects", unit:"ha", basis:"Project area", kind:"numeric_or", t:N(INF,INF,1), orLabel:"Will the terminal have service facilities (maintenance, fueling, etc.)?", orMinResult:{cat:"B-IEE",label:"Category B (IEE Checklist)"},
 aliases:"bus terminal jeepney terminal transport terminal"},
{code:"3.5.3", name:"Sea Port, Causeways, and Harbors (incl. RO-RO facilities)", section:"3. Infrastructure Projects", unit:"ha", basis:"Project area, with or without reclamation", kind:"unit_choice",
 choices:[
  {label:"With reclamation", unit:"ha", t:N(INF,15,0), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}]},
  {label:"Without reclamation", unit:"ha", t:N(INF,25,1), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}]}
 ],
 note:"Any port/harbor project that involves reclamation needs at least an IEE Checklist regardless of size (Category D is not reachable), since reclamation itself is separately covered under Annex A Section 3.3.",
 aliases:"seaport harbor causeway ro-ro port port reclamation"},
{code:"3.6.1", name:"Commercial Projects (malls, markets, restaurants, showrooms)", section:"3. Infrastructure Projects", unit:"ha", basis:"Total/gross floor area", kind:"numeric", t:N(INF,5,1), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"mall supermarket public market restaurant showroom commercial building"},
{code:"3.6.2", name:"Office and Residential Buildings (motels, condominiums, schools) incl. non-hazardous storage", section:"3. Infrastructure Projects", unit:"ha", basis:"Total/gross floor area", kind:"numeric", t:N(INF,5,1), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"condominium office building school motel residential building"},
{code:"3.6.3", name:"Institutional Structures with Laboratory Facilities", section:"3. Infrastructure Projects", unit:"", basis:"Facility type", kind:"select",
 options:[
   {label:"Primary, Secondary, or Tertiary Hospital / Medical Facility", out:{cat:"B-IEE",label:"Category B (IEE Checklist)"}},
   {label:"Clinic, Health Center, X-ray, Diagnostic or Assay Laboratory", out:{cat:"D",label:"Category D"}}
 ],
 aliases:"hospital clinic laboratory medical facility x-ray"},
{code:"3.6.4", name:"Storage Facilities for Toxic or Hazardous Materials, Substances or Products", section:"3. Infrastructure Projects", unit:"MT", basis:"Storage capacity", kind:"numeric", t:N(INF,1000,0), altUnits:[{label:"MT",factor:1},{label:"kg",factor:0.001}],
 aliases:"hazardous storage toxic materials warehouse depot"},
{code:"3.6.5", name:"Industrial Parks (horizontal development) with Critical Slopes", section:"3. Infrastructure Projects", unit:"ha", basis:"Project area", kind:"numeric", t:N(INF,5,0), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"industrial park ecozone critical slope"},
{code:"3.6.6", name:"Industrial Parks (horizontal development) in Flat Areas", section:"3. Infrastructure Projects", unit:"ha", basis:"Project area", kind:"numeric", t:N(INF,25,0), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"industrial park ecozone flat area"},
{code:"3.6.7", name:"Subdivisions and Housing Projects in Areas with Critical Slopes", section:"3. Infrastructure Projects", unit:"ha", basis:"Project area", kind:"numeric", t:N(INF,5,1), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"subdivision housing critical slope"},
{code:"3.6.8", name:"Subdivisions and Housing Projects in Flat Areas", section:"3. Infrastructure Projects", unit:"ha", basis:"Project area", kind:"numeric", t:N(INF,25,1), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"subdivision housing flat area"},
{code:"3.6.9", name:"Family Dwellings / Apartment Type", section:"3. Infrastructure Projects", unit:"", basis:"Regardless of area", kind:"fixed", result:{cat:"D",label:"Category D"},
 aliases:"family home apartment bunkhouse dwelling balay bahay house residence single-family boarding house"},
{code:"3.6.10", name:"Columbarium and Similar Projects (incl. funeral parlor, crematorium)", section:"3. Infrastructure Projects", unit:"ha", basis:"Total/gross floor area", kind:"numeric", t:N(INF,INF,1), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"columbarium crematorium funeral parlor"},
{code:"3.6.11", name:"Cemetery, Memorial Park and Similar Projects", section:"3. Infrastructure Projects", unit:"ha", basis:"Project area", kind:"numeric", t:N(INF,INF,5), altUnits:[{label:"ha",factor:1},{label:"sqm",factor:0.0001}],
 aliases:"cemetery memorial park"},
{code:"3.7.1", name:"Fuel Pipelines", section:"3. Infrastructure Projects", unit:"km", basis:"Total length", kind:"numeric", t:N(INF,20,0), altUnits:[{label:"km",factor:1},{label:"m",factor:0.001}],
 aliases:"fuel pipeline"},
{code:"3.7.2", name:"Other Pipelines / Cables", section:"3. Infrastructure Projects", unit:"km", basis:"Total length", kind:"numeric", t:N(INF,50,0), altUnits:[{label:"km",factor:1},{label:"m",factor:0.001}],
 aliases:"pipeline cable"},
{code:"3.7.3", name:"Submarine Pipelines / Cables", section:"3. Infrastructure Projects", unit:"km", basis:"Total length", kind:"numeric", t:N(INF,5,0), altUnits:[{label:"km",factor:1},{label:"m",factor:0.001}],
 aliases:"submarine cable undersea pipeline"},
{code:"3.8.1", name:"Sanitary Landfill for Industrial and Other Wastes", section:"3. Infrastructure Projects", unit:"", basis:"Number of users", kind:"bool", question:"Will it serve multiple users (e.g. a commercial TSD facility)?",
 yes:{cat:"B-EIS",label:"Category B (EIS)"}, no:{cat:"B-IEE",label:"Category B (IEE Checklist)"},
 aliases:"sanitary landfill industrial waste tsd facility"},
{code:"3.8.2", name:"Sanitary Landfill for Domestic Wastes Only", section:"3. Infrastructure Projects", unit:"", basis:"Waste handling per day (DAO 2006-10 categories)", kind:"select",
 options:[
   {label:"Category 2, 3 or 4 disposal facility", out:{cat:"B-EIS",label:"Category B (EIS)"}},
   {label:"Category 1, ≥15 MT/day", out:{cat:"B-EIS",label:"Category B (EIS)"}},
   {label:"Category 1, <15 MT/day", out:{cat:"B-IEE",label:"Category B (IEE Checklist)"}}
 ],
 aliases:"sanitary landfill domestic waste dumpsite"},
{code:"3.8.3", name:"Compost / Fertilizer Making", section:"3. Infrastructure Projects", unit:"MT", basis:"Annual (rated) production rate", kind:"numeric", t:N(INF,INF,3750),
 aliases:"composting fertilizer making"},
{code:"3.8.4", name:"Materials Receiving and Recovery Facilities (paper, plastic, other materials)", section:"3. Infrastructure Projects", unit:"", basis:"Annual (rated) production rate", kind:"bool", question:"Does it have a composting facility producing more than 3,750 MT/year?",
 yes:{cat:"B-IEE",label:"Category B (IEE Checklist)"}, no:{cat:"D",label:"Category D"},
 aliases:"materials recovery facility mrf recycling center"},
{code:"3.8.5", name:"Domestic Wastewater Treatment Facility (incl. septage)", section:"3. Infrastructure Projects", unit:"m³", basis:"System capacity", kind:"numeric", t:N(INF,5000,30),
 aliases:"wastewater treatment plant septage treatment sewage treatment"},
{code:"3.8.6", name:"Material Recovery Using Pyrolysis or Similar Technology", section:"3. Infrastructure Projects", unit:"MT", basis:"Annual treatment/processing capacity", kind:"numeric", t:N(INF,10,0),
 aliases:"pyrolysis tire pyrolysis material recovery"},
{code:"3.8.7", name:"Hazardous Waste Treatment, Recycling, and/or Disposal Facilities", section:"3. Infrastructure Projects", unit:"MT", basis:"Annual treatment/processing capacity", kind:"numeric_or", t:N(INF,10,0), orLabel:"Will the facility handle radioactive materials?", orMinResult:{cat:"B-EIS",label:"Category B (EIS)"},
 aliases:"hazardous waste treatment disposal recycling facility"},
{code:"3.8.8", name:"Industrial and Hospital Waste Materials Treatment Facilities (non-hazardous)", section:"3. Infrastructure Projects", unit:"m³", basis:"Daily treatment/processing capacity", kind:"numeric", t:N(INF,50,0),
 aliases:"hospital waste industrial waste treatment facility"},
{code:"3.8.9", name:"Recycling Facilities for Paper, Plastic, and Other Non-hazardous Materials", section:"3. Infrastructure Projects", unit:"MT", basis:"Annual treatment/processing capacity", kind:"chem_capacity_recycle",
 aliases:"paper recycling plastic recycling non-hazardous materials"},

/* ---- SECTION 4: GOLF COURSE AND OTHER TOURISM PROJECTS ---- */
{code:"4.1", name:"Golf Course Projects / Complex", section:"4. Golf Course & Other Tourism Projects", unit:"", basis:"Number of holes", kind:"bool", question:"Is this a driving range only (no full course)?",
 yes:{cat:"D",label:"Category D"}, no:{cat:"A-EIS",label:"Category A (ECP), regardless of number of holes"},
 aliases:"golf course driving range"},
{code:"4.2", amended:'MC 2022-06 (June 2022) amended Item 4.2. Resorts: EIS if 200 rooms or more OR floor area 5 ha or more; IEE (online) if 10 to 199 rooms OR floor area 0.1 ha to under 5 ha; CNC if lodging or homestay under 10 bedrooms (max 50 persons) AND floor area under 0.1 ha. Other tourism/leisure projects: EIS 5 ha or more, IEE 0.1 to under 5 ha, CNC under 0.1 ha. No Category A.', name:"Resort and Other Tourism / Leisure Projects", section:"4. Golf Course & Other Tourism Projects", unit:"", basis:"Number of rooms (resorts) AND total/gross floor area — both count (MC 2022-06)", kind:"dual",
 dims:[
  {label:"Number of rooms (resorts only; enter 0 for other tourism/leisure projects)", unit:"rooms", t:N(INF,200,9.5)},
  {label:"Total/gross floor area (project footprint); 1 ha = 10,000 sqm", unit:"ha", t:N(INF,5,0.1)}
 ],
 note:"For hotels in urban areas, also check the Buildings entries (3.6.1 / 3.6.2) per Annex A. For a CNC the lodging or homestay must have a maximum capacity of 50 persons.",
 aliases:"resort hotel leisure tourism lodging homestay boardwalk catwalk viewing deck observation deck nature trail eco-trail eco-park ecopark mangrove tourism mangrove park treetop walk hanging bridge glamping camping site zipline island hopping station tourist spot beach resort"},

/* ---- SECTION 5: OTHER PROJECTS (always Category D, per Section 5 of Annex A) ---- */
{code:"5.a", name:"Cut-flower Industry / Projects", section:"5. Other Projects", unit:"", basis:"Regardless of capacity or area", kind:"fixed", result:{cat:"D",label:"Category D"},
 aliases:"cut flower industry flower farm"},
{code:"5.b", name:"Telecommunication Projects (towers, antennae, base stations)", section:"5. Other Projects", unit:"", basis:"Regardless of type", kind:"fixed", result:{cat:"D",label:"Category D"}, note:"Structural integrity is under LGU jurisdiction; radiation concerns under DOH. If it's inside a building, also check Section 3.6 (Buildings).",
 aliases:"cell tower telecom tower antenna base transceiver station"},
{code:"5.c", name:"Facilities for Barangay Micro-Business Enterprises (BMBE) Projects", section:"5. Other Projects", unit:"", basis:"Regardless of capacity", kind:"fixed", result:{cat:"D",label:"Category D"}, note:"As defined under RA 9178, capitalization under ₱3.0 million, involving only assembly/molding/sculpturing/cutting/sewing/knitting/weaving/briquetting/carpentry.",
 aliases:"bmbe micro business enterprise small scale"},
{code:"5.d", name:"Energy / Non-commercial Mineral & Fossil Exploration (seismic, gravity, geophysical survey, core drilling)", section:"5. Other Projects", unit:"", basis:"Regardless of area", kind:"fixed", result:{cat:"D",label:"Category D"}, note:"Must not involve significant earth-moving activities or significant ecological disturbance.",
 aliases:"seismic survey geophysical survey exploration core drilling reconnaissance"},
{code:"5.e", name:"Retesting of Old/Existing Wells (data gathering / validation)", section:"5. Other Projects", unit:"", basis:"Regardless of area", kind:"fixed", result:{cat:"D",label:"Category D"}, note:"Subject to acquisition of relevant DENR regional environmental/forestry permits.",
 aliases:"well retesting energy resource validation"},
{code:"5.f", name:"Cottage Industries (handicraft, stuffed toys, souvenir items, etc.)", section:"5. Other Projects", unit:"", basis:"Regardless of capacity", kind:"fixed", result:{cat:"D",label:"Category D"},
 aliases:"cottage industry handicraft souvenir stuffed toys handmade products"},
{code:"5.g", name:"Demonstration and Pilot Projects", section:"5. Other Projects", unit:"", basis:"Regardless of capacity", kind:"fixed", result:{cat:"D",label:"Category D"},
 aliases:"demonstration project pilot project"},
{code:"5.h", name:"Service Industries (banks, IT services, consultancy, freight, trucking, etc.)", section:"5. Other Projects", unit:"", basis:"Regardless of capacity", kind:"fixed", result:{cat:"D",label:"Category D"},
 aliases:"service industry bank consultancy it services freight trucking lending"}
];

// The 12 official ECA criteria (Table 1, verbatim from the Blue Book)
const ECA_CRITERIA = [
 "National parks, watershed reserves, wildlife preserves and sanctuaries (NIPAS areas, LGU-declared reserves)",
 "Areas set aside as aesthetic potential tourist spots (LGU/DOT/TIEZA-declared; Class 1 & 2 caves)",
 "Habitat of any endangered or threatened species of indigenous Philippine wildlife; key biodiversity areas",
 "Areas of unique historic, archeological, geological, or scientific interest",
 "Areas traditionally occupied by cultural communities or tribes (CADT/CALT/CADC/CALC)",
 "Areas frequently visited by or hard-hit by natural calamities — geologic hazard, flood-prone, typhoon-prone, or volcanic/earthquake-prone areas",
 "Areas with critical slope (50% or more, per NAMRIA topographic maps)",
 "Areas classified as prime agricultural lands",
 "Recharge areas of aquifers",
 "Water bodies (rivers, lakes, bays — classified or not)",
 "Mangrove areas",
 "Coral reefs"
];

/* =========================================================================
   "AI-like" DISAMBIGUATION LAYER
   Real intake calls rarely use Annex A's exact wording. People describe a
   STRUCTURE ("boardwalk", "tower", "shed") without saying what it's FOR —
   and what it's for is what actually decides the category. This layer
   catches those generic/structural terms and asks the one clarifying
   question a human examiner would ask, instead of guessing.
   ========================================================================= */

/* =========================================================================
   "AI-like" DISAMBIGUATION LAYER
   Real intake calls rarely use Annex A's exact wording — people describe a
   STRUCTURE or a generic word ("boardwalk," "pond," "farm," "station,"
   "mill," "tank," "yard"...) without saying what it's actually FOR, and
   purpose is what decides the category. This layer catches generic terms
   across every section (not just one example) and asks the one clarifying
   question a human examiner would ask, instead of guessing — but only
   when the search doesn't already have a confident, specific match.
   ========================================================================= */

// Reusable synthetic outcomes for clarify answers that don't map to one
// specific numbered Annex A item.
const CUSTOM_ENHANCE = {
  code:'Category C', name:'Environmental Enhancement / Conservation Project',
  section:"Category C — outside Annex A's numbered list", unit:'',
  basis:'this is intended to directly enhance the environment or address an existing environmental problem, per Section 3 of the guidelines',
  kind:'fixed', result:{cat:'C', label:'Category C (pending EMB confirmation)'},
  note:'Submit a Project Description (Annex C, Parts I & II) to the EMB Regional Office. If it turns out not to qualify as enhancement, EMB will classify it under Category A or B instead.',
  legalSource:'EMB Memorandum Circular 005, s. 2014 — Section 3 (Category C) and Annex C (Pro-forma Project Description)',
  aliases:''
};
function customNotScreened(name, note){
  return {
    code:'—', name, section:"Not separately screened — part of a larger structure/operation", unit:'',
    basis:'this is generally evaluated as part of the larger structure or operation it belongs to, not as its own line item',
    kind:'fixed', result:{cat:'D', label:'Category D'}, note,
    legalSource:'EMB Memorandum Circular 005, s. 2014 — Annex A (see the related building/structure/operation category)',
    aliases:''
  };
}

const AMBIGUOUS_TERMS = [
  { match:["boardwalk","catwalk","viewing deck","observation deck","nature trail","eco-trail","hanging bridge","treetop walk"],
    prompt:"A boardwalk or trail isn't its own line item in Annex A — what it's actually built for decides the category. What is it for?",
    options:[
      {label:"Part of a resort, eco-park, or leisure/tourism development", code:"4.2"},
      {label:"Conservation or rehabilitation project (e.g. mangrove planting, coastal cleanup) with a public walkway", custom:CUSTOM_ENHANCE, openSituation:"enhance"},
      {label:"Access catwalk for a fishpond or aquaculture operation", code:"2.3.1"},
      {label:"Just a pedestrian bridge or walkway between two land areas, nothing else", code:"3.4.6"}
    ]},
  { match:["tower","antenna"],
    prompt:"\"Tower\" could mean a few different things — which is it?",
    options:[
      {label:"Cell site / telecommunications tower or antenna", code:"5.b"},
      {label:"Power transmission tower / line", code:"3.2.9b"},
      {label:"Part of a building (water tower, structure on a commercial/residential building)", code:"3.6.2"}
    ]},
  { match:["bridge"],
    prompt:"What kind of bridge is this?",
    options:[
      {label:"Vehicle bridge or viaduct, new construction", code:"3.4.3"},
      {label:"Vehicle bridge, rehabilitation or widening", code:"3.4.4"},
      {label:"Pedestrian bridge / footbridge only", code:"3.4.6"}
    ]},
  { match:["auto repair","auto shop","car repair","motor shop","mechanic shop","vulcanizing","engine shop","carburetor shop","auto supply"],
    prompt:"This depends on how much fuel/oil the shop actually keeps on site — which is it?",
    options:[
      {label:"Bulk storage of gasoline, diesel, or used oil on site (drums, tanks — not just what's in customers' vehicles)", code:"1.3.5"},
      {label:"Small-scale repair/vulcanizing shop, no bulk fuel or oil storage", code:"5.h"}
    ]},
  { match:["shed","warehouse","storage building","bodega"],
    prompt:"What will be stored there?",
    options:[
      {label:"Toxic or hazardous materials/substances", code:"3.6.4"},
      {label:"Ordinary goods, no hazardous materials", code:"3.6.2"}
    ]},
  { match:["cold storage","freezer","ref van","refrigeration"],
    prompt:"What's the main purpose of this cold storage?",
    options:[
      {label:"Storing/processing fish, meat, or other food products", code:"1.6.1"},
      {label:"General storage, not tied to food processing", code:"3.6.2"}
    ]},
  { match:["septic tank","septage"],
    prompt:"What scale is this septic/septage facility?",
    options:[
      {label:"A standalone septage/wastewater treatment facility", code:"3.8.5"},
      {label:"Just a household septic tank as part of a house/building", custom:customNotScreened("Household Septic Tank","See \"Family Dwellings / Apartment Type,\" or the Buildings entries if part of a larger structure.")}
    ]},
  { match:["junk shop","junkshop","scrap"],
    prompt:"What does the junk shop mainly handle?",
    options:[
      {label:"Paper, plastic, or other non-hazardous recyclables", code:"3.8.9"},
      {label:"Scrap metal, used oil, batteries, or other hazardous materials", code:"3.8.7"}
    ]},
  { match:["pond"],
    prompt:"A \"pond\" could be several different things — what's it for?",
    options:[
      {label:"Fishpond / aquaculture operation", code:"2.3.1"},
      {label:"Wastewater treatment pond or lagoon", code:"3.8.5"},
      {label:"Decorative or landscape pond, part of a resort/leisure development", code:"4.2"},
      {label:"Tailings pond, part of a mining operation", custom:customNotScreened("Mining Tailings Pond","This is evaluated as part of the mining project itself — search the specific mining/extraction activity instead (e.g. \"metallic ore extraction\").")}
    ]},
  { match:["farm"],
    prompt:"What kind of farm is this?",
    options:[
      {label:"Piggery / hog farm", code:"2.2.7a"},
      {label:"Poultry / chicken farm", code:"2.2.7c"},
      {label:"Fish farm / aquaculture", code:"2.3.1"},
      {label:"Plantation or orchard (crops)", code:"2.2.8a"},
      {label:"Solar or wind farm (renewable energy)", code:"3.2.7"}
    ]},
  { match:["station"],
    prompt:"What kind of station is this?",
    options:[
      {label:"Gas / gasoline / refilling station", code:"1.3.6"},
      {label:"Bus or land transport terminal", code:"3.5.2"},
      {label:"Water pumping / supply station", code:"3.1.3"},
      {label:"Power generating station", info:"Power plants are split by fuel type in Annex A — try searching the specific type instead, e.g. \"geothermal,\" \"hydropower,\" \"coal power plant,\" or \"solar.\""}
    ]},
  { match:["terminal"],
    prompt:"What kind of terminal is this?",
    options:[
      {label:"Bus / jeepney / land transport terminal", code:"3.5.2"},
      {label:"Seaport, harbor, or RO-RO terminal", code:"3.5.3"},
      {label:"Oil or fuel storage terminal", code:"1.3.5"}
    ]},
  { match:["mill"],
    prompt:"What kind of mill is this?",
    options:[
      {label:"Rice or corn mill", code:"1.6.7"},
      {label:"Sugar mill", code:"1.6.10"},
      {label:"Animal feed mill", code:"2.2.8b"},
      {label:"Sawmill / wood processing", code:"2.2.2"},
      {label:"Steel mill", code:"1.1–1.2"}
    ]},
  { match:["recycling"],
    prompt:"What material is being recycled?",
    options:[
      {label:"Paper, plastic, or other non-hazardous materials", code:"3.8.9"},
      {label:"Used oil or other petroleum-based chemicals", code:"1.3.3"},
      {label:"Scrap metal or other hazardous materials", code:"3.8.7"},
      {label:"Tire or rubber, via pyrolysis", code:"3.8.6"}
    ]},
  { match:["treatment plant","wastewater"],
    prompt:"What kind of treatment plant is this?",
    options:[
      {label:"Domestic wastewater or septage treatment", code:"3.8.5"},
      {label:"Hazardous waste treatment", code:"3.8.7"},
      {label:"Drinking water supply treatment", code:"3.1.3"}
    ]},
  { match:["park"],
    prompt:"What kind of park is this?",
    options:[
      {label:"Industrial park (flat terrain)", code:"3.6.6"},
      {label:"Industrial park (with critical slopes)", code:"3.6.5"},
      {label:"Memorial park / cemetery", code:"3.6.11"},
      {label:"Eco-park, leisure park, or tourism development", code:"4.2"}
    ]},
  { match:["well"],
    prompt:"What kind of well is this?",
    options:[
      {label:"Water supply well", code:"3.1.3"},
      {label:"Commercial oil extraction well", code:"2.1.4-oil"},
      {label:"Commercial gas extraction well", code:"2.1.4-gas"},
      {label:"Retesting an old/existing well for data purposes", code:"5.e"}
    ]},
  { match:["tank"],
    prompt:"What's being stored in the tank?",
    options:[
      {label:"Petroleum, fuel, or related products", code:"1.3.5"},
      {label:"Toxic or hazardous materials", code:"3.6.4"},
      {label:"Just a household water tank", custom:customNotScreened("Household Water Tank","See \"Family Dwellings / Apartment Type,\" or the Buildings entries if part of a larger structure.")}
    ]},
  { match:["yard"],
    prompt:"What kind of yard is this?",
    options:[
      {label:"Shipbuilding / boatbuilding / ship-breaking yard", code:"1.7.10"},
      {label:"Scrap or junk yard", code:"3.8.7"},
      {label:"Lumberyard / wood processing", code:"2.2.2"},
      {label:"General storage yard", code:"3.6.2"}
    ]},
  { match:["pier","jetty"],
    prompt:"What's this pier or jetty for?",
    options:[
      {label:"Part of a seaport, causeway, or harbor development", code:"3.5.3"},
      {label:"Small private access dock, not part of a commercial port", custom:customNotScreened("Small Private Dock","Usually Category D on its own, but confirm with EMB Region VII if it's near a sensitive area (mangroves, coral, etc.).")}
    ]},
  { match:["printing","laundry","car wash","carwash"],
    prompt:"Is this a standard-scale service business, or a larger operation with significant discharge?",
    options:[
      {label:"Standard-scale service business (printing press, laundry, car wash, similar)", code:"5.h"},
      {label:"Larger operation with significant wastewater or chemical discharge", code:"3.8.5"}
    ]},
  { match:["hatchery"],
    prompt:"What kind of hatchery is this?",
    options:[
      {label:"Fish or shrimp hatchery", code:"2.3.1"},
      {label:"Poultry / egg hatchery", code:"2.2.7c"}
    ]},
  { match:["abattoir","dressing plant","meat plant","slaughterhouse","ihawan","pamatyan","karnehan"],
    prompt:"This sounds like animal products processing — confirm:",
    options:[
      {label:"Slaughterhouse / meat, fish, or crabmeat processing", code:"1.6.1"}
    ]},
  { match:["road","kalsada"],
    prompt:"Is this a brand-new road, or work on an existing one?",
    options:[
      {label:"New road, built where none existed before", code:"3.4.1"},
      {label:"Widening, rehabilitation, or improvement of an existing road", code:"3.4.2"},
      {label:"Flyover, cloverleaf, or interchange", code:"3.4.5"},
      {label:"Tunnel or sub-grade road/railway", code:"3.4.7"}
    ]},
  { match:["dam","irrigation","patubig"],
    prompt:"Does this project involve building a dam/impoundment structure, or just distributing water?",
    options:[
      {label:"Dam or reservoir (irrigation, flood control, water source, hydropower)", code:"3.1.1"},
      {label:"Irrigation canals/distribution system only, no dam", code:"3.1.2"},
      {label:"Water supply project, no dam involved", code:"3.1.3"}
    ]},
  { match:["memorial","cemetery","columbarium","funeral"],
    prompt:"What kind of memorial/burial facility is this?",
    options:[
      {label:"Memorial park or cemetery", code:"3.6.11"}
    ]},
  { match:["sawmill","logging","kahoy","timber"],
    prompt:"What's the main activity involving wood/timber?",
    options:[
      {label:"Cutting/harvesting timber (CBFRU/IFMA/TLA/forestry project)", code:"2.2.1"},
      {label:"Sawmill / wood processing facility", code:"2.2.2"},
      {label:"Furniture assembly from processed wood", code:"1.7.3"}
    ]},
  { match:["reclamation","reclaim","foreshore"],
    prompt:"What's being reclaimed, and is it part of a port?",
    options:[
      {label:"General land reclamation / foreshore filling", code:"3.3"},
      {label:"Reclamation as part of a seaport/harbor development", code:"3.5.3"}
    ]}
];

// Context clues that hint the site may be an Environmentally Critical Area —
// this doesn't change the category by itself (Annex A already accounts for
// that), but it's exactly the kind of detail that changes what an examiner
// should ask next, so it's surfaced immediately.
const CONTEXT_HINTS = {
  "mangrove": "Mangrove areas are ECA Criterion #11. Once you have a category below, check the ECA tab — if this comes out Category A or B, the mangrove location must be described in the EMP.",
  "coral": "Coral reefs are ECA Criterion #12 — same note: relevant to the EMP if this project ends up Category A or B.",
  "watershed": "Watershed reserves are ECA Criterion #1 (often NIPAS-protected). Worth confirming with BMB's registry if you're unsure of the boundary.",
  "ancestral domain": "Areas under CADT/CALT/CADC/CALC are ECA Criterion #5 — this usually also means NCIP clearance (FPIC) is needed separately from the ECC.",
  "ancestral land": "Areas under CADT/CALT/CADC/CALC are ECA Criterion #5 — this usually also means NCIP clearance (FPIC) is needed separately from the ECC.",
  "critical slope": "Areas with 50%+ slope are ECA Criterion #7 — confirm against the latest NAMRIA topographic map.",
  "protected area": "NIPAS-declared parks, reserves, and sanctuaries are ECA Criterion #1 — check BMB's Registry of NIPAS Protected Areas.",
  "national park": "National parks are ECA Criterion #1 (NIPAS Act).",
  "wildlife sanctuary": "Wildlife sanctuaries are ECA Criterion #1/#3 — check BMB's registries.",
  "key biodiversity area": "Key Biodiversity Areas (KBAs) are ECA Criterion #3.",
  "cave": "Class 1 and 2 caves are ECA Criterion #2 — check EMB MC 2014-004 / DENR MC 2012-03.",
  "prime agricultural": "Prime agricultural land is ECA Criterion #8 — confirm against NIA/BSWM land suitability maps.",
  "flood-prone": "Flood-prone areas are ECA Criterion #6.2 — confirm against MGB/PAGASA hazard maps.",
  "aquifer": "Aquifer recharge areas are ECA Criterion #9.",
  "heritage": "Areas of historic, archeological, or cultural significance are ECA Criterion #4 — check with the National Museum or NHCP.",
  "shoreline": "Coastal/shoreline sites are often near mangroves (Criterion #11) or coral reefs (Criterion #12) — worth checking both.",
  "forest reserve": "Forest reserves are typically ECA Criterion #1 (NIPAS-related) — confirm with BMB.",
  "boracay": "Boracay Island has its own streamlined ECC/CNC processing rules under DAO 2025-36 (as amended by DAO 2026-23) for new national government infrastructure projects (water supply, energy, ports, telecom, and similar public infrastructure) and for existing unpermitted projects there. This is a procedural overlay, separate from the Annex A category/threshold result below — check DAO 2025-36 directly for the specific process."
};
