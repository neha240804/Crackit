# Electrical core interview questions reported by Indian freshers at MNC electrical/automation companies (ABB, Siemens / Siemens Energy, Schneider Electric, Hitachi Energy, GE Vernova / GE Power, Mitsubishi Electric, Bosch)

> **How to read these notes (verification level)**
> - Research date: 2026-11-18. About 25 tool calls were made.
> - **AmbitionBox, Glassdoor, Medium and JoinTaro pages could not be fetched directly.** AmbitionBox, Glassdoor and Medium returned HTTP 403, and JoinTaro returned HTTP 429. For those sources, the question text below comes from **search-engine snippets and summaries of the page**, not from reading the full page. They are marked **[snippet]**. Before treating these as final, re-check them in a logged-in browser.
> - Three pages were fetched and read in full: GeeksforGeeks (ABB 2020, Siemens GTE, Schneider technical), and the AceRound blog, which is an aggregator. They are marked **[fetched]**.
> - "Reported in interview" means a candidate says the question was asked. "Preparation list" means a generic or aggregator list with no first-hand evidence.
> - Frequency counts only independent candidate reports found in this session. Many reports are anonymous, so independence is assumed when the reports come from different sites, dates or locations.

---

## Which specific technical questions did candidates report, for which company/role/year?

### Takeaway
Few first-hand, electrical-core question lists exist publicly. Most first-hand fresher reports are on AmbitionBox, Glassdoor and JoinTaro, which block scraping. From what could be reached:
- The ABB and Hitachi Energy reports are about protection and switchgear (relays, circuit breakers, star-delta) plus basic components.
- The Siemens Energy and Siemens reports are about machines, transformers and substations.
- The Schneider reports are about switchgear and protection devices (MCB/MCCB, relay vs switchgear, ELCB/RCD), plus power systems and machines.
- The Bosch fresher reports lean toward electronics and microcontrollers rather than motors.

Several "electrical student" reports (GfG ABB 2020, GfG Siemens GTE) are actually **software-track** interviews with no electrical questions. Keep this in mind when building a question bank.

### Cited Findings: question table

Difficulty key: E = Easy (definitions), M = Medium (concepts, comparisons, applications), H = Hard (numericals, troubleshooting, deep reasoning).

| # | Question (as reported / paraphrased by source) | Subject / subtopic | Company | Role | Interview type, year | Status | Diff. | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Define a relay | Protection / relays | ABB | Electrical GET / trainee | Campus, 2021 | Reported [snippet] | E | [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) |
| 2 | What is a PCB? | Electronics / components | ABB | Electrical GET | Campus, 2021 | Reported [snippet] | E | [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) |
| 3 | Define capacitor and resistor | Basic electrical / components | ABB | Electrical GET | Campus, 2021 | Reported [snippet] | E | [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) |
| 4 | Resistor colour coding | Basic electrical / components | ABB | Electrical GET | Campus, 2021 | Reported [snippet] | E | [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) |
| 5 | What is the use of a star-delta connection (starter)? | Machines / induction motor starting | ABB | Electrical GET | Not stated | Reported [snippet] | M | [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) |
| 6 | Methods to reduce harmonics in induction motors | Machines / power quality | ABB | Electrical GET | Not stated | Reported [snippet] | H | [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) |
| 7 | Explain how a circuit breaker works and when each type is used | Switchgear / CB types | ABB | Fresher (generic) | Not stated | Preparation list | M | [FACE Prep ABB](https://www.faceprep.in/abb/abb-interview-questions/) |
| 8 | Types of circuit breakers; how do you protect a feeder? | Switchgear & protection / feeder protection | ABB | Fresher | Not stated | Preparation list (aggregator) | M/H | [interviewquestions.app ABB](https://interviewquestions.app/abb/interview-experience/) |
| 9 | Relay coordination and protection (power roles) | Protection / coordination | ABB | Fresher, power track | Not stated | Preparation list | H | [interviewquestions.app ABB](https://interviewquestions.app/abb/) |
| 10 | Draw the vector (phasor) diagrams of AC and DC voltage and current, including leading and lagging cases | AC circuits / phasors, power factor | Siemens Energy | GET | Haryana, 2025 | Reported [snippet] | M | [Glassdoor Siemens Energy review](https://www.glassdoor.ie/Interview/Siemens-Energy-Interview-E4393689-RVW82850724.htm) |
| 11 | Name the parts of a substation | Power systems / substation | Siemens Energy | GET, electrical | Campus, about 2023 ("3 years ago") | Reported [snippet] | E | [Medium, Siemens Energy GET campus](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) |
| 12 | Types of motors | Machines / classification | Siemens Energy | GET, electrical | Campus, about 2023 | Reported [snippet] | E | [Medium, Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) |
| 13 | Speed control of a DC series motor | Machines / DC motor | Siemens Energy | GET, electrical | Campus, about 2023 | Reported [snippet] | M | [Medium, Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) |
| 14 | Working of an induction motor | Machines / induction motor | Siemens Energy | GET, electrical | Campus, about 2023 | Reported [snippet] | E/M | [Medium, Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) |
| 15 | What is a Buchholz relay? | Protection / transformer protection | Siemens Energy | GET, electrical | Campus, about 2023 | Reported [snippet] | M | [Medium, Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) |
| 16 | Components (parts) of a transformer and transformer cooling | Transformers / construction, cooling | Siemens Energy | GET, electrical | Campus, about 2023 | Reported [snippet] | M | [Medium, Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) |
| 17 | Transformer vector groups | Transformers / vector group | Siemens Energy | GET, electrical | Campus, about 2023 | Reported [snippet] | H | [Medium, Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) |
| 18 | Types of motors | Machines | Siemens | Graduate Engineer Trainee (EEE) | Hyderabad, Aug 2024 | Reported [snippet] | E | [JoinTaro Siemens GET Hyderabad 2024](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858) |
| 19 | Slip-ring vs cylindrical rotor (as summarised; likely salient vs cylindrical rotor, or slip-ring vs squirrel-cage) | Machines / rotor types | Siemens | GET (EEE) | Hyderabad, Aug 2024 | Reported [snippet], wording uncertain | M | [JoinTaro Siemens GET Hyderabad 2024](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858) |
| 20 | Reactive power vs real power | AC circuits / power | Siemens | GET (EEE) | Hyderabad, Aug 2024 | Reported [snippet] | E/M | [JoinTaro Siemens GET Hyderabad 2024](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858) |
| 21 | Types and parts of a transformer | Transformers | Siemens | GET (EEE) | Hyderabad, Aug 2024 | Reported [snippet] | E | [JoinTaro Siemens GET Hyderabad 2024](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858) |
| 22 | Induction motor and transformers; distance relays; switchgear and circuit breakers | Machines, protection | Siemens | GET / GTE (India) | 2022-2024 JoinTaro/Glassdoor reports | Reported [snippet], exact page not isolated | M | [JoinTaro Siemens listing](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-trainee-engineer-chennai-november-1-2022-accepted-offer-positive-f4ef523b) |
| 23 | Questions on alternator, induction motor, transmission line | Machines, power systems | Siemens Gamesa | Engineer (early career, India) | About 2022 | Reported [snippet] | M | [Glassdoor Siemens Gamesa Q](https://www.glassdoor.com/Interview/Started-with-Basic-Introduction-Explain-Previous-job-experience-if-you-have-any-Course-Project-Questions-related-to-I-QTN_5138668.htm) |
| 24 | Substation earthing | Power systems / earthing | Siemens Gamesa | Engineer | About 2022 | Reported [snippet] | M | same as #23 |
| 25 | Battery requirements in a substation | Power systems / substation auxiliaries (DC system) | Siemens Gamesa | Engineer | About 2022 | Reported [snippet] | H | same as #23 |
| 26 | Transformers, motors, drives, VFD, electrical panels, switchgear, SLDs, PLCs, RIOs, WinCC, HMI, PLC programming, power electronics | Automation / drives / PLC | Siemens | Service engineer (not GET) | Not stated | Reported [snippet], experienced role | M/H | [Glassdoor Siemens interview pages](https://www.glassdoor.co.in/Interview/Siemens-Interview-Questions-E3510_P3.htm) |
| 27 | What is switchgear and what is a relay? What are their differences? | Switchgear & protection | Schneider Electric | Fresher (Electrical subject chosen in test) | Year not stated | Reported [fetched] | E/M | [GfG Schneider technical interview](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/) |
| 28 | What are the types of circuit breakers? Explain one in detail. | Switchgear / CB types | Schneider Electric | Fresher | Year not stated | Reported [fetched] | M | [GfG Schneider](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/) |
| 29 | Questions on renewable energy and energy production | Power systems / renewables | Schneider Electric | Fresher | Year not stated | Reported [fetched], summary | M | [GfG Schneider](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/) |
| 30 | Explain some sustainable products related to the smart grid | Power systems / smart grid | Schneider Electric | Fresher | Year not stated | Reported [fetched] | M | [GfG Schneider](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/) |
| 31 | Circuit breakers: MCB and MCCB | Switchgear / LV breakers | Schneider Electric | R&D testing (entry) | Not stated | Reported [snippet] | E/M | [Glassdoor Schneider Electrical Engineer](https://www.glassdoor.com/Interview/Schneider-Electric-Electrical-Engineer-Interview-Questions-EI_IE3956.0,18_KO19,38.htm) |
| 32 | Difference between an ELCB and an RCD | Protection / earth-leakage | Schneider Electric | Electrical engineer | Not stated | Reported [snippet] | M | [Glassdoor Schneider GET / EE pages](https://www.glassdoor.com/Interview/Schneider-Electric-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE3956.0,18_KO19,51.htm) |
| 33 | Types of tripping equipment such as MCB and MCCB, and their differences | Switchgear / LV protection | Schneider Electric | Electrical engineer | Not stated | Reported [snippet] | M | [Glassdoor Schneider GET / EE pages](https://www.glassdoor.com/Interview/Schneider-Electric-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE3956.0,18_KO19,51.htm) |
| 34 | Types of control systems | Control systems | Schneider Electric | GET | Surat, Nov 2021 | Reported [snippet] | E/M | [JoinTaro Schneider GET Surat 2021](https://www.jointaro.com/interviews/companies/schneider-electric/experiences/graduate-engineer-trainee-get-surat-gujarat-november-1-2021-accepted-offer-positive-d2150465/) |
| 35 | How to convert between electrical network types (e.g. star-delta conversion) | Network analysis | Schneider Electric | GET | Surat, Nov 2021 | Reported [snippet] | M | same as #34 |
| 36 | Capacitance and inductance; rectifiers; transformers; relays | Basic electrical, power electronics | Schneider Electric | GET | India, 2021-2024 (Glassdoor/JoinTaro) | Reported [snippet] | E/M | [Glassdoor Schneider GET](https://static.glassdoor.at/Interview/Schneider-Electric-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3956.0,18_KO19,44.htm) |
| 37 | Ohm's law and its practical applications | Basic electrical | Schneider Electric | GET | India (Glassdoor) | Reported [snippet] | E | same as #36 |
| 38 | Microcontroller vs microprocessor | Electronics / MCU | Schneider Electric | GET | India (Glassdoor) | Reported [snippet] | E | same as #36 |
| 39 | Digital circuits: flip-flops, counters, then electrical drives and power systems | Digital electronics, drives | Schneider Electric | GET | Bangalore Rural, Aug 2024 | Reported [snippet] | M | [JoinTaro Schneider GET Bangalore 2024](https://www.jointaro.com/interviews/companies/schneider-electric/experiences/graduate-engineering-trainee-get-bangalore-rural-karnataka-august-1-2024-no-offer-positive-fdda1b21/) |
| 40 | Microcontroller specs (8051, ESP32), basic digital, analog circuit design | Electronics | Schneider Electric | GET | India (Glassdoor/JoinTaro) | Reported [snippet] | M | [Glassdoor Schneider review](https://www.glassdoor.co.in/Interview/Schneider-Electric-Interview-E3956-RVW91372349.htm) |
| 41 | Questions on relays and circuit breakers | Protection / switchgear | Hitachi Energy | Management Trainee | India (Glassdoor) | Reported [snippet] | E/M | [Glassdoor Hitachi Energy MT](https://www.glassdoor.com/Interview/Hitachi-Energy-Management-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,33.htm) |
| 42 | Types of motors and relays | Machines, protection | Hitachi Energy | Management Trainee | India | Reported [snippet] | E | same as #41 |
| 43 | Transformers and machines (motors and generators); basics of electrical engineering | Machines, transformers | Hitachi Energy | Trainee | Vadodara, Nov 2025 | Reported [snippet] | E/M | [Glassdoor Hitachi Energy GET](https://www.glassdoor.com/Interview/Hitachi-Energy-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,40.htm) |
| 44 | How power is transferred from primary to secondary in a power transformer; ratings of power transformers | Transformers / principle, ratings | Hitachi Energy | Intern | India | Reported [snippet] | M | [Glassdoor Hitachi Energy Intern](https://www.glassdoor.co.in/Interview/Hitachi-Energy-Intern-Interview-Questions-EI_IE3507483.0,14_KO15,21.htm) |
| 45 | Working principle of a transformer; star vs delta connection; role of a circuit breaker | Transformers, 3-phase, switchgear | Hitachi Energy | Not GET-specific (Indeed, UK site) | Not stated | Preparation list (aggregated "common questions") | E/M | [Indeed Hitachi Energy](https://uk.indeed.com/cmp/Hitachi-Energy/interviews) |
| 46 | Four pillars of OOP and code for inheritance (non-electrical) | Programming | Hitachi Energy | GET | Chennai, Jan 2025 | Reported [snippet] | M | [Glassdoor Hitachi Energy GET](https://www.glassdoor.com/Interview/Hitachi-Energy-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,40.htm) |
| 47 | DC motors, inverters, diodes, FPGAs, transformer windings | Machines, power electronics | GE Vernova | Engineer / GET (location not confirmed India) | Not stated | Reported [snippet] | M | [Glassdoor GE Vernova Engineering](https://www.glassdoor.co.in/Interview/GE-Vernova-Engineering-Interview-Questions-EI_IE740889.0,10_KO11,22.htm) |
| 48 | Outline how you would put together a physical substation design package | Power systems / substation design | GE Vernova | Engineer (not confirmed fresher or India) | Not stated | Reported [snippet] | H | [Glassdoor GE Vernova Engineer](https://www.glassdoor.com/Interview/GE-Vernova-Engineer-Interview-Questions-EI_IE740889.0,10_KO11,19.htm) |
| 49 | Basic knowledge of gas turbines, plus projects | Power generation | GE Vernova | GET | Not stated | Reported [snippet] | M | [Glassdoor GE Vernova GET](https://www.glassdoor.com/Interview/GE-Vernova-Graduate-Engineer-Trainee-Interview-Questions-EI_IE740889.0,10_KO11,36.htm) |
| 50 | Electro-mechanical panel design; AutoCAD/Creo; GD&T basics | Design / panels | GE Vernova | GET | Not stated | Preparation list (job/prep article) | M | [Frontlines Media](https://www.frontlinesmedia.in/ge-vernova-is-hiring-graduate-engineer-trainee/) |
| 51 | Technical test with mechanical + electrical questions and one SQL query | Mixed | Mitsubishi Electric Automation | Intern (not India-confirmed) | About 2023 | Reported [snippet] | M | [Glassdoor Mitsubishi Electric Automation](https://www.glassdoor.com/Interview/Mitsubishi-Electric-Automation-Interview-Questions-E270239.htm) |
| 52 | Diode characteristics and plotting the graph | Electronics / diodes | Bosch (Robert Bosch India) | GET | Not stated | Reported [snippet] | M | [Glassdoor Bosch India GET](https://www.glassdoor.com/Interview/Robert-Bosch-India-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE237727.0,18_KO19,51.htm) |
| 53 | Modulation; sampling theorem and Nyquist frequency | Communication | Bosch | GET | Not stated | Reported [snippet] | M | same as #52 |
| 54 | Steering: parts and how it works; what is an automobile? | Automobile | Bosch | GET | Not stated | Reported [snippet] | E/M | same as #52 |
| 55 | Microcontrollers, microprocessors, digital design, basic control systems; C (storage classes, OOP) | Electronics, control | Bosch | Fresher (ECE, campus via HirePro, PESIT Bangalore) | Year not stated (older) | Reported [snippet] | M | [Glassdoor Bosch India Q](https://www.glassdoor.com/Interview/I-am-from-ECE-background-It-was-conducted-by-HirePro-recruiting-agency-The-hiring-process-had-3-rounds-1-Aptitude-QTN_1243488.htm) |
| 56 | Power electronics, analog, machine braking concepts; DC-DC converter analysis (voltage across switch, ratings) | Power electronics, machines | Bosch (EV team) | Intern (not GET) | Not stated | Reported [snippet] | H | [Glassdoor Bosch India Internship](https://www.glassdoor.com/Interview/Robert-Bosch-India-Internship-Interview-Questions-EI_IE237727.0,18_KO19,29.htm) |
| 57 | Draw basic logic gates; half adder without an EXOR gate | Digital electronics | Bosch | Fresher | Not stated | Preparation list / aggregated | M | [FACE Prep Bosch](https://www.faceprep.in/robert-bosch/robert-bosch-interview-questions/) |
| 58 | Star-delta starter: starts in star to reduce starting current, then switches to delta | Machines / starters | (generic) | Fresher | Not stated | Preparation list | E/M | [plcblog.in](https://plcblog.in/electrical/interview/electrical-engineering-interview-questions-for-freshers.php) |
| 59 | PLC parts (input modules, CPU, output modules); PLC languages (IL, ST, FBD, ladder, SFC); scan cycle; sinking vs sourcing | Automation / PLC | (generic; pitched at Siemens/Mitsubishi prep) | Fresher | Not stated | Preparation list | E/M | [automationforum.co](https://automationforum.co/51-plc-interview-questions/); [GaugeHow](https://gaugehow.com/interview/plc-interview-questions) |
| 60 | VFD vs soft starter; VFD rectifier-inverter structure; braking; harmonics | Drives | (generic) | Fresher | Not stated | Preparation list | M | [ElectricalClassroom VFD](https://www.electricalclassroom.com/interview-question-vfd/) |

### Cited Findings: other reports
- **ABB, Placement 2020 (IIT pool campus, author was an electrical student, Software Engineer role):** every technical question was software (Java execution, OOP, instance vs object, interfaces, Java collections, REST APIs, substring frequency, the ABB Ability IoT/cloud platform). No core electrical questions were asked. — [GfG ABB 2020](https://www.geeksforgeeks.org/?p=528646) [fetched]
- **Siemens Graduate Trainee Engineer (off-campus, GfG):** also software only (Git, polymorphism, bubble sort, MongoDB vs MySQL, REST, Python list vs tuple). The online test was 91 MCQs in 80 minutes on Mettl. — [GfG Siemens GTE](https://www.geeksforgeeks.org/?p=1027316) [fetched]
- **ABB, 2014 Chennai (Associate Scientist, Power Electronics):** "they will ask about project in depth". This is older than the 2021-2026 window and is kept only for process context. — [Glassdoor ABB](https://www.glassdoor.co.uk/Interview/ABB-Associate-Scientist-Power-Electronics-Interview-Questions-EI_IE3076.0,3_KO4,41.htm) [snippet]

### Inferences
- Rows 1-6 and 41-44 point to ABB and Hitachi Energy panels asking definition-level component and protection questions (relay, CB, star-delta). Rows 10-25 suggest Siemens Energy and Siemens dig into transformers (parts, cooling, vector group, Buchholz) and substations.
- The same company runs separate software and core tracks (ABB, Siemens, Hitachi Energy Chennai GET with OOP questions). An electrical fresher's interview depends heavily on which track they are slotted into.

### Gaps
- No AmbitionBox page and no full Glassdoor review could be read (403 errors). The ABB and Hitachi Energy "Electrical GET" AmbitionBox pages are the richest likely sources and need manual extraction.
- No first-hand **India fresher** report was found for Mitsubishi Electric India or GE Power/GE Vernova India with core electrical questions. Rows 47-51 are not confirmed as India or fresher.
- No first-hand fresher report naming **PLC/ladder/VFD questions** at Siemens or Mitsubishi was found. The only PLC/VFD evidence is a Siemens *service engineer* review (row 26) and generic prep lists.
- No Reddit, Quora or LinkedIn first-hand posts with question lists were retrieved in this session.

---

## Which questions recur across multiple independent candidate reports?

### Takeaway
Only a handful of topics recur across independent first-hand reports. Exact-wording recurrence could not be established because most sources are snippets. The counts below are **topic-level**.

### Cited Findings
- **Circuit breakers (types, working, MCB/MCCB):** 4 independent reports.
  - Schneider GfG (row 28)
  - Schneider Glassdoor R&D testing (row 31)
  - Hitachi Energy MT Glassdoor (row 41)
  - Siemens GET reports mentioning switchgear and circuit breakers (row 22)

  The ABB aggregator (rows 7-8) is a preparation list and is not counted. — sources as cited in rows 22, 28, 31, 41
- **Relays (definition, types, relay vs switchgear, Buchholz, distance relays):** 5 reports.
  - ABB campus 2021 (row 1)
  - Siemens Energy Medium (row 15)
  - Siemens GET listing (row 22)
  - Schneider GfG (row 27)
  - Hitachi Energy MT (rows 41-42)
- **Transformers (parts, types, working, ratings, vector group):** 5 reports.
  - Siemens Energy Medium (rows 16-17)
  - Siemens Hyderabad 2024 (row 21)
  - Hitachi Energy Vadodara 2025 (row 43)
  - Hitachi Energy Intern (row 44)
  - Schneider Glassdoor (row 36)
- **Induction motor / types of motors:** 5 reports.
  - Siemens Energy Medium (rows 12, 14)
  - Siemens Hyderabad 2024 (row 18)
  - Siemens Gamesa (row 23)
  - Hitachi Energy MT (row 42)
  - Hitachi Energy Vadodara (row 43)
- **Real vs reactive power / phasor diagrams (lead-lag):** 2 reports (Siemens Energy 2025 row 10; Siemens Hyderabad 2024 row 20).
- **Substation (parts, earthing, battery):** 2 reports (Siemens Energy Medium row 11; Siemens Gamesa rows 24-25).
- **Star-delta (starter or connection):** 1 first-hand (ABB row 5), plus a preparation list (Hitachi Energy, Indeed, row 45).
- **Microcontroller vs microprocessor / MCU topics:** 3 reports (Schneider rows 38 and 40; Bosch row 55).
- **Final-year project discussed in depth:** the most universal item across almost every report. Examples: ABB Chennai, the Siemens resume focus on "Electrical projects", Schneider "most questions are based on your resume", and GE Vernova "leaned heavily on projects". — [Glassdoor ABB](https://www.glassdoor.co.uk/Interview/ABB-Associate-Scientist-Power-Electronics-Interview-Questions-EI_IE3076.0,3_KO4,41.htm); [Glassdoor Schneider GET](https://static.glassdoor.at/Interview/Schneider-Electric-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3956.0,18_KO19,44.htm); [Glassdoor GE Vernova GET](https://www.glassdoor.com/Interview/GE-Vernova-Graduate-Engineer-Trainee-Interview-Questions-EI_IE740889.0,10_KO11,36.htm)

### Inferences
- A core-electrical "MNC GET" question bank should weight these topics first: relays and CBs, transformers, induction motors and starting, real/reactive power with phasors, substations, and project deep-dives.

### Gaps
- Independence is uncertain for anonymous Glassdoor and JoinTaro entries, since the same candidate may post on both. Counts may overstate.
- No exact-wording recurrence count was possible.

---

## Which subjects dominate per company?

### Takeaway
The hypothesis in the brief is partly supported:
- **Supported:** switchgear and protection at ABB, Hitachi Energy and Schneider.
- **Siemens:** in the fresher reports found, machines, transformers and substations dominate. PLC and drives appear only for service roles.
- **Bosch:** fresher reports are dominated by **electronics, microcontrollers and digital**, not motors. Power electronics and machines appear only in an EV internship.
- **Mitsubishi and GE:** no usable India fresher evidence was found.

### Cited Findings
- **ABB:**
  - Components and protection basics (relay, capacitor, resistor, colour coding).
  - Star-delta and motor harmonics.
  - The online test covered digital logic, network analysis, C basics and control systems.
  - Sources: [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) [snippet]; online-test topics from [Glassdoor ABB Bengaluru](https://static-pc.glassdoor.fr/Interview/ABB-Trainee-Management-Interview-Questions-EI_IE3076.0,3_KO4,22_IP6.htm) [snippet]
- **Siemens / Siemens Energy:**
  - Machines (DC series speed control, induction motor, rotor types).
  - Transformers (parts, cooling, vector group, Buchholz).
  - Substations; phasors and power.
  - Rows 10-25 — [Medium Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a); [JoinTaro Siemens Hyderabad](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858)
  - One candidate said the written test was at about GATE level. — [JoinTaro Siemens listing](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-trainee-engineer-pune-september-25-2025-accepted-offer-neutral-8921a24b) [snippet]
- **Schneider Electric:**
  - LV switchgear and protection (MCB/MCCB, ELCB/RCD, CB types, relay vs switchgear).
  - Power systems, machines and networks ("most questions were related to power system, machines and network", Surat 2021).
  - Smart grid and renewables.
  - Some digital and microcontroller topics.
  - Rows 27-40.
- **Hitachi Energy:** relays, CBs, motors, transformers and power transformers (rows 41-44). Chennai GET reports also asked OOP. — [Glassdoor Hitachi Energy GET](https://www.glassdoor.com/Interview/Hitachi-Energy-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,40.htm)
- **GE Vernova:** DC motors, inverters, transformer windings, gas turbines, substation design, plus OOP/DSA/SQL in some rounds (rows 47-49).
- **Bosch:** diodes, modulation and sampling, microcontrollers and digital logic (mux, decoders, flip-flops, Schmitt trigger), control systems, C programming, automobile basics (rows 52-57).
- **Mitsubishi Electric:** only an intern technical test (mechanical, electrical, SQL) was found (row 51). JustCrackInterview's Mitsubishi page shows mostly aptitude puzzles. — [JustCrackInterview Mitsubishi](https://www.justcrackinterview.com/interviews/mitsubishi-electric-india-pvt-ltd/)

### Inferences
- Bosch GET hiring in India appears to draw mainly from ECE/electronics or automotive, so an "electrical motors" profile for Bosch is not supported by the found evidence.

### Gaps
- Mitsubishi Electric India and GE Power India subject profiles cannot be established from accessible sources.

---

## What does each company's process look like?

### Takeaway
The common pattern is an online test (aptitude, sometimes plus a technical/domain section, sometimes gamified), then 1-2 technical interviews with heavy project focus, then HR (relocation, why this company). Group discussions appear for ABB, Bosch and Hitachi Energy in some reports.

### Cited Findings
- **ABB:**
  - Off-campus follows the same flow as campus: online test, technical interview, HR. — [FACE Prep ABB](https://faceprep.in/article/abb-recruitment-process-details-for-freshers-face-prep/)
  - One Bengaluru campus report: 1 written test, 2 technical rounds, 1 HR, 1 case interview, 1 GD. — [Glassdoor ABB](https://static-pc.glassdoor.fr/Interview/ABB-Trainee-Management-Interview-Questions-EI_IE3076.0,3_KO4,22_IP6.htm) [snippet]
  - Electrical GET campus (pre-2023): aptitude test (logical + quant), then HR with introduction and relocation questions. — [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) [snippet]
  - Another guide lists online test, GD, technical, HR. — [FACE Prep ABB](https://www.faceprep.in/abb/abb-interview-questions/)
  - The technical interview runs 45-75 minutes, going deep on 2-3 core subjects plus project or internship (aggregator). — [interviewquestions.app](https://interviewquestions.app/abb/interview-experience/)
  - ABB 2020 IIT pool (software): online test (logical 20 min, coding 60 min with 3 questions, Java/OOP MCQ 20 min), 2 technical interviews, HR; 7 of 87 selected. — [GfG](https://www.geeksforgeeks.org/?p=528646) [fetched]
- **Siemens:**
  - India GET 2022: a technical interview, then a "personality check" round by the business head, then HR. — [JoinTaro Siemens GET 2022](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineering-trainee-get-india-december-28-2022-declined-offer-positive-b3e64a64) [snippet]
  - GTE off-campus: Mettl test (91 MCQs in 80 minutes, 4 timed sections), technical interview, managerial interview, HR. — [GfG](https://www.geeksforgeeks.org/?p=1027316) [fetched]
  - Sources disagree on test format: a C test plus aptitude, or a combined quant/reasoning/verbal/technical test. — [AceRound](https://www.aceround.app/blog/bosch-siemens-schneider-electric-fresher-interview-process-india/) [fetched]
- **Siemens Energy (campus, electrical):** online test on Mercer (91 questions in 80 minutes: aptitude, verbal, electrical domain), then a combined technical + HR interview. — [Medium](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) [snippet]
- **Schneider Electric:**
  - Online test with domain MCQs (EC, IT, etc.), gamified aptitude and English, then technical, then HR (Bengaluru, Sep 2024). — [Glassdoor Schneider GET](https://static.glassdoor.at/Interview/Schneider-Electric-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3956.0,18_KO19,44.htm) [snippet]
  - Another report: 30 technical MCQs in 30 minutes (choice of Electrical, Electronics or Software), game-based questions on the AON platform, about 30 minutes of technical interview, then HR (relocation, why hire you, family). — [GfG Schneider](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/) [fetched]
  - Electrical engineer: 2 technical rounds + 1 HR, focused on basics, internships and projects. — [Glassdoor Schneider EE](https://www.glassdoor.com/Interview/Schneider-Electric-Electrical-Engineer-Interview-Questions-EI_IE3956.0,18_KO19,38.htm) [snippet]
  - A Sep 2024 campus funnel: more than 2,000 took the test, 280 advanced, 40 reached HR. — [AceRound citing GfG](https://www.aceround.app/blog/bosch-siemens-schneider-electric-fresher-interview-process-india/)
- **Hitachi Energy:**
  - Online assessments (technical, problem-solving, aptitude), then a technical interview. — [LinkedIn StudentsCircles](https://www.linkedin.com/pulse/hitachi-energy-off-campus-drive-fresher-studentscircles)
  - A 2024 GET report: assessment, phone interview, final interview and group discussion, with behavioural questions (taking the lead on a problem; why the Power+ Graduate Trainee Program). — [Glassdoor Hitachi Energy GET](https://www.glassdoor.com/Interview/Hitachi-Energy-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,40.htm) [snippet]
  - Protection engineer: 4 steps, with the last 2 technical. — [Glassdoor Hitachi Energy](https://www.glassdoor.co.uk/Interview/Hitachi-Energy-Interview-Questions-E3507483.htm) [snippet]
- **GE Vernova:** written test, then 2 technical rounds + 1 HR. Questions covered projects, OOP, LeetCode-style DSA and SQL. Behavioural questions: why electrical engineering, strengths, failures, conflict with a manager. — [Glassdoor GE Vernova GET](https://www.glassdoor.com/Interview/GE-Vernova-Graduate-Engineer-Trainee-Interview-Questions-EI_IE740889.0,10_KO11,36.htm) [snippet]
- **Bosch:**
  - GET: aptitude, GD, technical, HR. — [Glassdoor Bosch GET](https://www.glassdoor.com/Interview/Robert-Bosch-India-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE237727.0,18_KO19,51.htm) [snippet]
  - ECE campus via HirePro: 60-question test (35 technical, 25 aptitude, no English), about 1 hour of technical interview, about 15 minutes of HR; about 30 selected. — [Glassdoor Bosch Q](https://www.glassdoor.com/Interview/I-am-from-ECE-background-It-was-conducted-by-HirePro-recruiting-agency-The-hiring-process-had-3-rounds-1-Aptitude-QTN_1243488.htm) [snippet]
  - Cut-off is reported as 70% / 7.0 CGPA in one source and 60-65% in another. — [AceRound](https://www.aceround.app/blog/bosch-siemens-schneider-electric-fresher-interview-process-india/)
- **Mitsubishi Electric Automation:** technical test, then an interview with an engineer and a manager (intern; India not confirmed). — [Glassdoor](https://www.glassdoor.com/Interview/Mitsubishi-Electric-Automation-Interview-Questions-E270239.htm) [snippet]

### Inferences
- Gamified or psychometric aptitude tests (AON, Mercer/Mettl) are common at Schneider and Siemens or Siemens Energy. The technical MCQ sections are pitched near GATE level for core tracks.
- HR rounds consistently probe relocation willingness and "why this company".

### Gaps
- No official process documentation from any of the seven companies was consulted.
- Mitsubishi Electric India and GE Power India fresher processes are unverified.
- AmbitionBox process statistics (round counts, difficulty) could not be read (403 error).
