# Electrical fresher technical interview questions: Indian manufacturing / EPC / consumer-electrical and semiconductor firms

Method and access notes (read first):
- AmbitionBox (all pages) and Glassdoor (all pages) returned **HTTP 403** to direct fetch. Items marked "(via search snippet)" were seen only in search-engine result summaries of those Glassdoor/AmbitionBox pages; the full review text could not be read, so year/role details there are as the snippet gave them and are less certain.
- Fully read pages: GeeksforGeeks L&T 2020 experience, WireUnwired L&T GET 2024, GeeksforGeeks Micron Semiconductor Engineer (IIT Guwahati), GeeksforGeeks Texas Instruments internship (IIT Guwahati). The Medium Siemens Energy GET post was 403 (seen via snippet only; Siemens is out of scope but a useful proxy).
- No CG Power-specific or Polycab-specific technical question reports could be found or read. Polycab and CG Power sections are therefore thin; this is a real gap, not an omission.
- Status legend: **R** = "Reported in interview" (a candidate says it was asked); **P** = "Preparation list" (generic list or advice, no evidence it was asked).
- Difficulty: E = Easy, M = Medium, H = Hard.
- Frequency = number of independent sources in this note reporting the question/topic. Nothing was counted that was not seen.

## Which specific technical questions did candidates report, for which company/role/year?

### Takeaway
About 50 questions were captured with sources. The most solid first-hand material is for L&T (2020 diploma-level drive in Bangalore; 2024 ECC on-campus GET) and for Micron and Texas Instruments campus drives at IIT Guwahati. Havells, Thermax, Analog Devices and NXP reports come from Glassdoor search snippets (anonymous). No verifiable question-level reports were found for CG Power or Polycab.

### Cited Findings

#### L&T (Larsen & Toubro)

Source A: GeeksforGeeks, L&T interview 17 Sep 2020, Bangalore, Electrical branch, diploma-level candidates, campus type not stated; rounds: company presentation, document verification, GD, group task, ~20-min 4-member panel PI — [GfG L&T Interview Experience](https://www.geeksforgeeks.org/?p=700115) (also at https://www.geeksforgeeks.org/interview-experiences/lt-interview-experience/)

| # | Question (paraphrased by source) | Subject / subtopic | Role / type | Status | Diff |
|---|---|---|---|---|---|
| 1 | What types of DC motors are used in refineries? | Machines / DC motors, applications | L&T, diploma-level electrical, other fresher, 2020 | R | M |
| 2 | Which motor is most widely used, and why? | Machines / induction motor | same | R | E |
| 3 | How is machine maintenance performed? | Maintenance / machines | same | R | M |
| 4 | What parameters are checked during maintenance? | Maintenance / testing | same | R | M |
| 5 | What is insulation resistance and what is its value? | Testing / insulation | same | R | M |
| 6 | What is a megger and why is it used? | Measurement / insulation testing | same | R | E |
| 7 | What is an earth pit and what resistance value should it have? | Earthing | same | R | M |
| 8 | How is earth resistance measured? | Earthing / measurement | same | R | M |
| 9 | What is an earth grid? | Earthing / substation | same | R | E |
| 10 | How would you reduce the company's power consumption cost? | Energy efficiency / PF, tariffs | same | R | H |
| 11 | How is power generated for a refinery? | Power generation / captive plants | same | R | M |
| 12 | Compare diesel and coal-based power plants | Power generation | same | R | M |

Source B: WireUnwired, L&T ECC on-campus GET, Electrical, posted 27 Jan 2024 (first-person account under editorial byline; authenticity not verified). Rounds: CGPA shortlist → online test 90 Q (30 aptitude, 30 analytical reasoning, 30 verbal, ~1 h 20 min, sectional cutoff) → technical PI → HR with extempore (30 s prep, 2 min talk) — [WireUnwired L&T GET 2024](https://wireunwired.com/lt-get-interview-experience-2024/)
- No specific technical questions listed; technical PI topics: machines, power system protection, own project / internship / vocational training; candidates advised to know MCBs, their college's transformer ratings, substation layout, smart grid / microgrid. Status P (advice), but topic list R. — [WireUnwired](https://wireunwired.com/lt-get-interview-experience-2024/)
- HR questions reported: willingness to be posted in difficult locations such as J&K; why the candidate had not built coding habits for IT companies. — [WireUnwired](https://wireunwired.com/lt-get-interview-experience-2024/)

Source C: Glassdoor L&T reviews (via search snippet; full text 403):
| # | Question | Subject | Role / type | Status | Diff |
|---|---|---|---|---|---|
| 13 | Characteristics of SF6 gas | Switchgear / SF6 breakers | L&T GET, Mumbai (year not given in snippet) | R | M |
| 14 | Skin effect in transmission & distribution | Power systems / T&D | L&T GET (year not given) | R | M |
| 15 | Explain the working of a transformer | Machines / transformer | L&T Construction, Electrical GET (AmbitionBox snippet) | R | E |
| 16 | Why do you want to join L&T? / Name a few L&T projects | HR / company knowledge | L&T GET | R | E |
- Mumbai candidate: questions "mostly on power system protection and switchgears" — [Glassdoor L&T review](https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW86786381.htm) (snippet; exact review that matches each item could not be verified because all Glassdoor pages returned 403)
- L&T Power, Chennai, Dec 2025: electrical students "mostly asked about transformers and machines", plus introduction and internship/project questions — [Glassdoor L&T Power](https://www.glassdoor.com/Interview/L-and-T-Power-Interview-Questions-E579774.htm) (snippet)
- One L&T candidate was asked Thermodynamics, Fluid Mechanics, SOM, Manufacturing, Machine Design (non-electrical; shows panels vary) — [Glassdoor L&T](https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW100584575.htm) (snippet)

#### Havells (all via Glassdoor search snippets; anonymous; years mostly not visible)
| # | Question | Subject | Role / type | Status | Diff |
|---|---|---|---|---|---|
| 17 | What is a power sub-station? | Power systems / substations | GTE-Electrical, Dec 2024 | R | E |
| 18 | Working principle of a transformer | Machines | Havells GET | R | E |
| 19 | Different types of motors | Machines | Havells GET | R | E |
| 20 | What are servo motors and what are their parts? | Machines / special motors | Havells | R | M |
| 21 | On what principle does an electric iron work? | Appliances / heating (Joule) | Havells | R | E |
| 22 | Why is power generated at multiples of 11 kV (11, 33 kV)? | Power systems / voltage levels | Havells (also on allinterview) | R | M |
| 23 | How do you ensure safety in electrical installations? | Safety / installation | Havells | R | M |
| 24 | Basics of solar LEDs, IGBTs, semiconductor physics | Power electronics / devices | Havells (electronics roles) | R | M |
| 25 | Working principle of an MCB and how it differs from a fuse | Switchgear / protection | Havells (candidate report via snippet) | R | M |
| 26 | Synchronous motor and power system | Machines / synchronous | Havells | R | M |
| 27 | What MCB rating is needed for a 1/2 kVA power backup? | Switchgear / sizing numerical | Havells (allinterview, user-submitted, likely pre-2019) | P/R unclear | H |
| 28 | Cable current-carrying capacity; why power factor matters in industry | Cables / PF | Havells (allinterview) | P/R unclear | M |
- Sources: [Glassdoor Havells India interviews](https://www.glassdoor.co.in/Interview/Havells-India-Interview-Questions-E352690.htm); [Glassdoor Havells GET](https://www.glassdoor.com/Interview/Havells-India-Graduate-Engineer-Trainee-Interview-Questions-EI_IE352690.0,13_KO14,39.htm); [Glassdoor Havells question: synchronous motor and power system](https://www.glassdoor.co.in/Interview/Regarding-Synchronous-Motor-and-Power-System-QTN_5800378.htm); [allinterview Havells electrical](https://www.allinterview.com/company/923/havells/interview-questions/82/electrical-engineering.html)

#### Thermax (Glassdoor snippets; mostly older, 2010-2019)
| # | Question | Subject | Role / type | Status | Diff |
|---|---|---|---|---|---|
| 29 | What is a VFD and its basic circuit? | Drives / power electronics | E&I Engineer, Pune, 2010 (old) | R | M |
| 30 | Fundamentals of electrical circuit design | Design | same | R | M |
| 31 | All motors information and their maintenance | Machines / maintenance | Electrical Engineer | R | M |
| 32 | One numerical on basic electrical engineering | Basic EE | Quality Engineer | R | H |
| 33 | General core electrical concepts (30-min interview) | Core EE | Graduate Apprentice Trainee | R | E |
- Sources: [Glassdoor Thermax GET](https://www.glassdoor.co.in/Interview/Thermax-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE142281.0,7_KO8,40.htm); [Glassdoor Thermax](https://www.glassdoor.sg/Interview/Thermax-Interview-Questions-E142281.htm)

#### Polycab
- One Polycab GET report lists "electrical engineering and basic electronics" as topics; another electrical role asked self-introduction and why this post (via AmbitionBox snippet) — [AmbitionBox Polycab](https://ambitionbox.com/interviews/polycab-wires-interview-questions)
- Polycab reports also include sales/business questions such as how to increase sales — [AmbitionBox Polycab](https://ambitionbox.com/interviews/polycab-wires-interview-questions?page=2)
- allinterview lists ~12 Polycab questions but text was not visible; visible item is sizing HT XLPE cable for an 11 kV transformer system (status unclear) — [allinterview Polycab](https://www.allinterview.com/company/2405/polycab/interview-questions/82/electrical-engineering.html)
- Cable topics (XLPE 90 °C vs PVC 70 °C, armouring, IS 7098) appear only in generic prep lists: Status P — [ElectricalVolt cables Q&A](https://www.electricalvolt.com/electrical-cables-interview-questions-answers/); [Polycab HT XLPE datasheet](https://vijayshreegroup.com/img/POLYCAB_HT-XLPE.pdf)

#### CG Power
- No CG Power interview report with questions was found. AmbitionBox has a CG Electrical GET page but it returned 403 — [AmbitionBox CG Electrical GET](https://ambitionbox.com/interviews/cg-interview-questions/electrical-get)
- Proxy (out of scope company, similar transformer/motor manufacturer): Siemens Energy GET campus — online test on Mercer, 91 Q / 80 min (aptitude, verbal, electrical domain); technical+HR round asked substation components, motor types, DC series motor speed control, Buchholz relay, why transformers use cooling fans/radiators/oil, and which of two equal-power motors at different voltages draws less current (snippet only; Medium page 403) — [Medium Siemens Energy GET](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a)

#### Micron Technology
Source: GeeksforGeeks, Semiconductor Engineer, on-campus IIT Guwahati, B.Tech ECE/EEE + M.Tech EEE eligible, CPI ≥ 7; year not stated (page updated Oct 2024). OA (Hirepro, ~30 Q: digital, analog, semiconductors, control systems, signals & systems, some aptitude; 39 of 71 advanced) → technical round (project + circuits, 5 panels) → DSA round — [GfG Micron Semiconductor Engineer](https://www.geeksforgeeks.org/interview-experiences/micron-technology-interview-experience-for-semiconductor-engineer-on-campus/)
| # | Question | Subject | Status | Diff |
|---|---|---|---|---|
| 34 | Create a frequency divider by 2 | Digital / sequential | R | M |
| 35 | Now a divide-by-3 | Digital / sequential | R | H |
| 36 | Two inverters in series: what is the frequency of the circuit? (ring-oscillator style) | Digital/CMOS / delay | R | H |
| 37 | How would you increase the period of that circuit? | CMOS / delay | R | H |
| 38 | Handling internal memory errors such as bit flips (project-based) | Memory / ECC | R | H |
| 39 | Which factors affect microprocessor frequency; cycles per instruction (project) | Computer architecture | R | M |
- Glassdoor Micron (snippets, years mixed/older): most questions MOSFET/semiconductor, sketch an N-channel MOSFET, signal delay through a gate; explain MOSFET I-V characteristics; core round on MOSFET and BJT then HR; short-channel effects, MOSFET reliability, LDD, GIDL — [Glassdoor Micron RVW752833](https://www.glassdoor.co.in/Interview/Micron-Technology-Interview-E1648-RVW752833.htm); [Glassdoor Micron RVW51034112](https://www.glassdoor.com.hk/Interview/Micron-Technology-Interview-E1648-RVW51034112.htm); [Glassdoor Micron RVW8573712](https://www.glassdoor.co.in/Interview/Micron-Technology-Interview-E1648-RVW8573712.htm)
| # | Question | Subject | Status | Diff |
|---|---|---|---|---|
| 40 | Sketch an N-channel MOSFET | Devices / MOSFET structure | R | E |
| 41 | Explain MOSFET I-V characteristics | Devices / MOSFET | R | M |
| 42 | MOSFET short-channel effects | Devices / scaling | R | H |
| 43 | MOSFET reliability issues; LDD; GIDL | Devices / reliability | R | H |
- Micron 2020 campus drive: written test with a "Circuit, Semiconductor and electronics" section per role; interview focused on projects, SQL — [GfG Micron 2020](https://www.geeksforgeeks.org/micron-interview-experience-on-campus-2020/) (snippet)

#### Texas Instruments
Source: GeeksforGeeks, TI Digital Engineering Intern, on-campus IIT Guwahati (ECE/EEE/EP eligible, CPI ≥ 7), year not stated (updated Sep 2024). OA on Hirepro (20 aptitude Q / 30 min + 20 Q per role / 45 min) → ~75-min Webex technical interview — [GfG TI internship](https://www.geeksforgeeks.org/?p=884598)
| # | Question | Subject | Status | Diff |
|---|---|---|---|---|
| 44 | Most basic sequential circuit element? (latch) | Digital | R | E |
| 45 | D-latch enable vs D-flip-flop clock held at 1: outputs? | Digital / latches vs FFs | R | M |
| 46 | Combinational vs sequential circuits | Digital | R | E |
| 47 | NAND with output fed back to one input: output behaviour? | Digital / feedback, oscillation | R | H |
| 48 | Build a 3-input NAND using only 2:1 muxes | Digital / mux logic | R | H |
| 49 | CMOS inverter: structure, input changes, gate capacitance | CMOS | R | M |
| 50 | RC circuit, switch closes at t0: plot Vc and Ic | Circuits / transients | R | M |
- Glassdoor TI (snippets): 2017 Bengaluru "mostly basic analog questions such as mosfet, vlsi design flow"; 2020 Kolkata "Explain the working of MOSFET"; one candidate given input/output waveforms and asked to draw the circuit; Sep 2022 Bengaluru entry-level CMOS mixed-signal design via university — [Glassdoor TI RVW22365887](https://www.glassdoor.co.in/Interview/Texas-Instruments-Interview-E651-RVW22365887.htm); [Glassdoor TI RVW38795941](https://www.glassdoor.com/Interview/Texas-Instruments-Interview-E651-RVW38795941.htm); [Glassdoor TI entry-level CMOS](https://www.glassdoor.ca/Interview/Texas-Instruments-Entry-Level-CMOS-Mixed-Signal-Circuit-Design-Engineer-Interview-Questions-EI_IE651.0,17_KO18,71.htm)
| 51 | Explain the working of a MOSFET | Devices | R (TI 2020 Kolkata) | E |
| 52 | Given input and output waveforms, draw the circuit | Circuits / analysis | R (TI) | H |
- Prep-list only (P): MOSFET saturation-region behaviour, MOSFET switching characteristics, draw and explain a MOSFET inverter — [FACE Prep TI](https://faceprep.in/article/texas-instruments-interview-questions-for-analog-and-digital-profiles-face-prep/)

#### Analog Devices / NXP (Glassdoor snippets, India)
- ADI analog design: broad, from CMOS device fundamentals to precision op-amp design; op-amp frequency response / compensation called the hardest — [Glassdoor ADI Analog Design Engineer](https://www.glassdoor.co.in/Interview/Analog-Devices-Analog-Design-Engineer-Interview-Questions-EI_IE49.0,14_KO15,37.htm) (R, H)
- ADI India: analog layout candidate asked about schematic-to-GDSII flow; another said online assessment was simple and background checks strict — [Glassdoor ADI India](https://www.glassdoor.co.in/Interview/Analog-Devices-India-Interview-Questions-EI_IE49.0,14_IL.15,20_IN115.htm)
- NXP Bengaluru (one report ~2015, old): written round (descriptive + MCQ), two technical rounds, HR; asked RC circuits, MOS, current mirrors, projects; advised transient analysis of RC, MOS capacitor, inverter characteristics — [Glassdoor NXP Analog Design Engineer](https://www.glassdoor.co.in/Interview/NXP-Semiconductors-Analog-Design-Engineer-Interview-Questions-EI_IE13528.0,18_KO19,41.htm) (R, M)
- Op-amp prep items (GBW, slew rate, offset, CMRR, balance resistors): P only — [Indeed analog electronics Qs](https://in.indeed.com/career-advice/interviewing/analog-electronics-interview-questions)
- Intel: no fresher EE question report found.

### Inferences
- Manufacturing/EPC panels ask practical, site-oriented basics (earthing, megger, maintenance, substations, switchgear, transformer working) more than derivations; semiconductor panels ask MOSFET/CMOS and digital-logic puzzles plus project deep-dives.
- Project/internship discussion is reported in almost every company's technical round.

### Gaps
- AmbitionBox and Glassdoor full texts were inaccessible (403); exact years and roles for snippet-derived items are unverified.
- No question-level reports for CG Power or Polycab; no Intel fresher EE reports.
- Most semiconductor reports are from IIT Guwahati via GfG; a single campus may not represent other colleges.

## Which questions recur across multiple independent candidate reports?

### Takeaway
Few exact questions recur; topics recur. Strongest recurrences: transformer working (L&T AmbitionBox snippet, L&T Power Glassdoor, Havells Glassdoor = 3), MOSFET working / I-V characteristics (Micron Glassdoor x2, TI Glassdoor = 3), project/internship discussion (essentially all), and power system protection / switchgear at L&T (WireUnwired 2024 + Glassdoor Mumbai = 2).

### Cited Findings
- Transformer working / transformers: L&T Construction GET — [AmbitionBox](https://www.ambitionbox.com/interviews/l-and-t-construction-interview-questions/electrical-get) (snippet); L&T Power Dec 2025 — [Glassdoor](https://www.glassdoor.com/Interview/L-and-T-Power-Interview-Questions-E579774.htm) (snippet); Havells GET — [Glassdoor](https://www.glassdoor.com/Interview/Havells-India-Graduate-Engineer-Trainee-Interview-Questions-EI_IE352690.0,13_KO14,39.htm) (snippet). Frequency 3.
- Motors / machines (types, most-used motor, maintenance): L&T 2020 — [GfG](https://www.geeksforgeeks.org/?p=700115); Havells — [Glassdoor](https://www.glassdoor.co.in/Interview/Havells-India-Interview-Questions-E352690.htm); Thermax — [Glassdoor](https://www.glassdoor.sg/Interview/Thermax-Interview-Questions-E142281.htm); L&T 2024 topic list — [WireUnwired](https://wireunwired.com/lt-get-interview-experience-2024/). Frequency 4 (topic level).
- Power system protection / switchgear at L&T: [WireUnwired](https://wireunwired.com/lt-get-interview-experience-2024/); [Glassdoor L&T](https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW86786381.htm). Frequency 2.
- Substation (what is a substation / layout / components): Havells Dec 2024 (Glassdoor snippet); L&T 2024 advice ([WireUnwired](https://wireunwired.com/lt-get-interview-experience-2024/)); Siemens proxy. Frequency 2 in-scope.
- MOSFET working / I-V / structure: Micron x2 and TI x1 (Glassdoor snippets above). Frequency 3.
- CMOS inverter / inverter characteristics / inverter chains: TI GfG, Micron GfG, NXP Glassdoor. Frequency 3.
- RC circuit transients: TI GfG ([link](https://www.geeksforgeeks.org/?p=884598)); NXP Glassdoor. Frequency 2.
- "Why generate at multiples of 11 kV": Havells Glassdoor snippet and allinterview — not clearly independent; count 1-2.

### Inferences
- For a question bank, weight topics (transformer, motors, protection/switchgear, earthing, substation; MOSFET/CMOS inverter, sequential logic, RC transients) rather than exact wording.

### Gaps
- Without full Glassdoor/AmbitionBox text, I could not check whether some snippet items are the same review syndicated across country domains (glassdoor.co.in/.ca/.com.hk mirror the same reviews); counts above treat each distinct review ID as one source only.

## Which subjects dominate per company?

### Takeaway
L&T: machines, power system protection/switchgear, earthing/maintenance, projects. Havells: transformer/motors, substations, MCB/protection, appliance principles, safety; CV-driven. Thermax: mostly thermal/mechanical for GETs; electrical candidates get motors/VFD/maintenance. Polycab: electrical + basic electronics (no question-level data), plus sales questions. CG Power: no data. Micron/TI/NXP/ADI: MOSFET physics, CMOS, digital logic, analog (RC, current mirrors, op-amps), project deep-dives, sometimes DSA.

### Cited Findings
- L&T: protection/switchgear, machines, earthing, refinery power — [GfG](https://www.geeksforgeeks.org/?p=700115); [WireUnwired](https://wireunwired.com/lt-get-interview-experience-2024/)
- Havells: "most of the interview was based on resume"; "mainly design diagrams and very strict about adhering to guidelines"; online test heavy on EMT for some — [Glassdoor Havells](https://www.glassdoor.co.in/Interview/Havells-India-Interview-Questions-E352690.htm) (snippet)
- Thermax: GET reports mostly thermodynamics, heat transfer, boilers; questions drawn from resume / favourite subject — [Glassdoor Thermax GET](https://www.glassdoor.com/Interview/Thermax-Graduate-Engineer-Trainee-Interview-Questions-EI_IE142281.0,7_KO8,33.htm) (snippet)
- Polycab: electrical engineering + basic electronics; sales questions — [AmbitionBox Polycab](https://ambitionbox.com/interviews/polycab-wires-interview-questions) (snippet)
- Micron: OA in digital, analog, semiconductors, control, signals; interview project + circuits + DSA — [GfG Micron](https://www.geeksforgeeks.org/interview-experiences/micron-technology-interview-experience-for-semiconductor-engineer-on-campus/)
- TI: digital logic puzzles, CMOS, RC transients — [GfG TI](https://www.geeksforgeeks.org/?p=884598)
- ADI: CMOS to op-amp compensation — [Glassdoor ADI](https://www.glassdoor.co.in/Interview/Analog-Devices-Analog-Design-Engineer-Interview-Questions-EI_IE49.0,14_KO15,37.htm)

### Inferences
- The brief's hypothesis "cables at Polycab, motors/transformers at CG Power" is plausible but not supported by any candidate report found; treat as unverified.

### Gaps
- CG Power and Polycab subject mix unverified.

## What does each company's process look like?

### Takeaway
Industrial firms: CGPA/resume shortlist → online aptitude test (sometimes with an electrical section) → technical PI (project-heavy) → HR; L&T adds extempore/GD in some drives. Semiconductor firms on campus: Hirepro-style OA (aptitude + domain) → 1-2 technical rounds (circuits, devices, projects; Micron also DSA) → HR.

### Cited Findings
- L&T ECC GET 2024: CGPA shortlist; 90-Q online test (aptitude/analytical/verbal, ~80 min, sectional cutoff); technical PI; HR with extempore — [WireUnwired](https://wireunwired.com/lt-get-interview-experience-2024/)
- L&T 2020 diploma-level: presentation, document verification, GD, group task, panel PI — [GfG](https://www.geeksforgeeks.org/?p=700115)
- Havells GET: 60-Q MCQ online technical + aptitude test; then CV-based technical interview and HR (department preference, 5-year plan); one GTE-Electrical (Dec 2024) process spanned four days — [Glassdoor Havells](https://www.glassdoor.co.in/Interview/Havells-India-Interview-Questions-E352690.htm) (snippet)
- Thermax GET: aptitude test then technical/HR interview; Glassdoor lists IQ tests, group panels, presentations, personality tests — [Glassdoor Thermax](https://www.glassdoor.sg/Interview/Thermax-Interview-Questions-E142281.htm) (snippet)
- Polycab: typically 2-3 rounds; most common HR, resume shortlist, one-on-one — [AmbitionBox Polycab](https://ambitionbox.com/interviews/polycab-wires-interview-questions) (snippet). Polycab runs a "GET Manufacturing 2026" listing on Unstop — [Unstop](https://api.unstop.com/jobs/polycab-get-manufacturing-2026-polycab-1617585) (not fetched)
- Micron Semiconductor Engineer: Hirepro OA (~30 Q) → technical (project+circuits) with HR call → DSA round — [GfG Micron](https://www.geeksforgeeks.org/interview-experiences/micron-technology-interview-experience-for-semiconductor-engineer-on-campus/)
- TI intern: Hirepro OA (aptitude 20 Q/30 min + 20 Q per role/45 min) → ~75-min technical interview on chosen topic — [GfG TI](https://www.geeksforgeeks.org/?p=884598)
- NXP: written (descriptive + MCQ) → two technical → HR — [Glassdoor NXP](https://www.glassdoor.co.in/Interview/NXP-Semiconductors-Analog-Design-Engineer-Interview-Questions-EI_IE13528.0,18_KO19,41.htm) (snippet)

### Inferences
- A mock interview for these companies should open with project/internship discussion, then core fundamentals, and include a company-motivation HR question ("Why L&T?", relocation willingness).

### Gaps
- CG Power process unknown; Intel and ADI fresher campus process details not found; TI full-time (vs intern) process not verified.
