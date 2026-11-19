# Electrical core interview questions for freshers at Indian power PSUs and utilities (NTPC, BHEL, POWERGRID, Tata Power, Adani Power, Torrent Power, plus NHPC)

> **Read this first: source access and evidence quality.**
> - **AmbitionBox, Glassdoor and Quora returned HTTP 403** to direct fetches (AmbitionBox NTPC/BHEL/Tata Power pages, Glassdoor Tata Power GET / NTPC ET / POWERGRID pages, Quora NTPC EE thread). The Kreatryx PGCIL interview page refused the connection (ECONNREFUSED). For these, the only evidence is the **search-engine result summary/snippet**. Those items are tagged **[snippet-only]**: the text says a candidate reported the question, but I could not read the full review, its date or its exact wording.
> - **Fully read pages:** Gateway of Engineering PGCIL EE 2016 (first-person candidate account), the Gateway of Engineering index (lists the PSU posts), the BoardInfinity Tata Power GET guide (a compilation of dated candidate reports), the forumautomation "BHEL electrical interview questions" list (no evidence that it was asked), the YourPedia BHEL ET page (coaching prep list), and placementpapers.app BHEL (no real stories). The Electrical-mentor blog turned out to cover IIT/IISc M.Tech interviews only, so it is **out of scope** and not used.
> - **Recent (2021-2026) first-hand GATE-PSU electrical transcripts were scarce in what I could reach.** The richest first-person PSU account is from **2016**. The best recent material is the Tata Power GET (2020-2024) set, and that comes through an aggregator.
> - Status labels: **Reported in interview** = a candidate account says it was asked. **Preparation list** = a generic list with no evidence it was asked.
> - Difficulty: E = Easy, M = Medium, H = Hard.

## Which specific technical questions did candidates report, and in which company/role/year?

### Takeaway
I could attribute about 45 reported questions to a company. They come mainly from POWERGRID (EE 2016 GATE interview), Tata Power GET (2020-2024 campus reports, via BoardInfinity), and Torrent/Adani/NTPC/BHEL (Glassdoor/AmbitionBox, snippet-only). The reported questions are conceptual and practical (power factor, corona, harmonics, CB rating, SLDs, sequence components, plant types), not numericals. About 25 more questions come from preparation lists and are labelled separately.

### Cited Findings

#### A. POWERGRID (PGCIL), Executive Trainee (Electrical), GATE-based, 2016. First-person account (fully read)
Source: [Gateway of Engineering, "PGCIL interview experience - EE 2016"](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html) (candidate Madhvendra Pratap, interview 30 June 2016, Gurgaon office). Interview type: GATE-based ET.

| # | Question (faithful paraphrase) | Subject / subtopic | Diff | Status |
|---|---|---|---|---|
| 1 | What are power factor and load factor? | Power systems / PF, load factor | E | Reported in interview |
| 2 | Explain harmonics in transformers | Machines / transformer harmonics (magnetising current) | M | Reported in interview |
| 3 | What harmonics occur in HVDC systems? (expected: characteristic 6k±1 from the converter/inverter) | Power systems / HVDC converters | H | Reported in interview |
| 4 | How do you suppress those HVDC harmonics? | Power systems / HVDC filters, higher pulse number | H | Reported in interview |
| 5 | What is corona? | Power systems / transmission lines | E | Reported in interview |
| 6 | How do you deal with lightning surges on transmission lines? | HV / protection: surge arresters, shielding | M | Reported in interview |
| 7 | Differences between hydro and thermal power plants (asked because he had trained at NTPC) | Generation / plant types | M | Reported in interview |
| 8 | T&D losses (asked to other candidates that day) | Power systems / losses | M | Reported in interview |
| 9 | 12-pulse converters (asked to other candidates) | Power electronics / HVDC | H | Reported in interview |
| 10 | Full forms of abbreviations (example "DSLP") (asked to other candidates) | General / power-sector terms | E | Reported in interview |

- The author said the panel concentrated on **transmission-line protection, HVDC converters and transformers**, and that freshers may be asked about their **major project in depth** and their **training**. — [Gateway of Engineering PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)

#### B. POWERGRID, other candidate reports [snippet-only]
Source: search summary of the [Kreatryx PGCIL interview page](https://blog.kreatryx.com/pgcil-interview/) (fetch refused) and the [Quora PSU EE thread](https://www.quora.com/How-do-I-prepare-for-a-PSU-interview-Electrical-Branch) (403). Year: not visible. Type: GATE-based ET.

| # | Question | Subject / subtopic | Diff | Status |
|---|---|---|---|---|
| 11 | How do we quench an arc (in a circuit breaker)? | Switchgear / arc quenching | M | Reported in interview [snippet-only] |
| 12 | How can we improve the transient stability of a system? | Power systems / stability | M | Reported in interview [snippet-only] |
| 13 | What are the advantages of HVDC over HVAC? | Power systems / HVDC | M | Reported in interview [snippet-only] |
| 14 | How many modes of power generation are there, and why is hydro not preferred despite so many water bodies? | Generation / plant types, hydro constraints | M | Reported in interview [snippet-only] |

#### C. NTPC [snippet-only; Glassdoor/AmbitionBox 403]
- From a Glassdoor NTPC entry for **Executive Engineer** (likely experienced hire, **not confirmed fresher**; four-member panel). Source: [Glassdoor NTPC interview questions](https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm)

| # | Question | Subject / subtopic | Diff | Status |
|---|---|---|---|---|
| 15 | Which protection devices are fitted on a transformer? | Protection / transformer protection (Buchholz, differential, etc.) | M | Reported in interview [snippet-only; role may not be fresher] |
| 16 | What grade of insulating oil is used in transformers? | Machines / transformer oil | M | Reported in interview [snippet-only] |
| 17 | Which gases are produced during internal faults in a transformer? | Protection / Buchholz, DGA | H | Reported in interview [snippet-only] |
| 18 | Power factor (concept/importance) | Power systems / PF | E | Reported in interview [snippet-only] |
| 19 | Working of a transformer | Machines / transformer | E | Reported in interview [snippet-only] |
| 20 | How is a generator started? | Generation / generator start-up | M | Reported in interview [snippet-only] |

- A 2016 NTPC candidate's blog (search summary) describes a ~30-minute panel that asked **how a transformer works and on what principle**, then asked for a **sketch of flux lines and secondary current** with a sinusoidal AC primary, going from basics into detail. — search summary pointing to [Gateway of Engineering NTPC 2016](https://gatewayofengineering.blogspot.com/2016/07/ntpc-interview-experience-2016.html) (that post is labelled **ECE**, so its relevance to EE is limited) [snippet-only]
  - Q21: Transformer working principle + draw flux lines / secondary current for sinusoidal primary — Machines / transformer — M — Reported in interview [snippet-only]
- Other Glassdoor NTPC entries (search summary) mention questions on **power system protection, synchronous machines, DC machines, transformers, cables**, and one ~15-minute interview that was mostly hobbies. — [Glassdoor NTPC](https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm) [snippet-only]

#### D. Tata Power, Graduate Engineer Trainee (Electrical). Campus/off-campus reports 2020-2024
Source: [BoardInfinity, "Tata Power GET interview questions & experience guide"](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624) (fully read; it compiles dated candidate reports and appears to aggregate AmbitionBox-style reviews, so the original reviews were not independently verifiable).

| # | Question / topic | Subject / subtopic | Year (as given) | Diff | Status |
|---|---|---|---|---|---|
| 22 | Questions on transformers and synchronous machines | Machines | Nov 2021 | M | Reported in interview |
| 23 | Power system protection questions | Protection | 2022 | M | Reported in interview |
| 24 | Draw the single-line diagram of a power system | Power systems / SLD | before Feb 2020 (NIT Bhopal) | M | Reported in interview |
| 25 | How do you compensate voltage at a load centre? | Power systems / reactive power, voltage control | before Feb 2020 (NIT Bhopal) | M | Reported in interview |
| 26 | Voltage at a tubewell is low: which method would you use to raise it? | Distribution / voltage regulation (practical troubleshooting) | before Feb 2020 (NIT Bhopal) | H | Reported in interview |
| 27 | Power plants, new generation methods, electric vehicles (current trends) | Generation / renewables, EVs | 2022 | M | Reported in interview |
| 28 | Parts of a relay, a circuit breaker and a transformer | Switchgear, machines / construction | 2023 | E | Reported in interview |
| 29 | Define zero-sequence components; which dominates, zero or negative sequence? | Power systems / symmetrical components, faults | 2023 | H | Reported in interview |
| 30 | Draw the power system from generating station to consumers | Power systems / G-T-D structure | Nov 2023 (KIIT) | E | Reported in interview |
| 31 | Interconnected power systems (why/advantages) | Power systems / grid | Nov 2023 (KIIT) | M | Reported in interview |
| 32 | Underground vs overhead cables | Power systems / cables vs lines | Nov 2023 (KIIT) | M | Reported in interview |
| 33 | Corona discharge | Power systems / transmission lines | Nov 2023 (KIIT) | E | Reported in interview |
| 34 | MCBs and other circuit breakers; smart power strips | Switchgear / LV protection | Nov 2023 (KIIT) | E | Reported in interview |
| 35 | Electrical testing equipment and tools, with their safety and maintenance | Measurement / safety | 2020 | E | Reported in interview |
| 36 | Ohm's law, Kirchhoff's laws, a power-distribution problem | Basics / circuits | 2024 | E | Reported in interview |
| 37 | Major-project and resume-based questions with diagrams | Project | 2022, Nov 2023 | M | Reported in interview |

#### E. Torrent Power, GET (Electrical). Campus [snippet-only; Glassdoor/AmbitionBox 403]
Sources: search summaries of [Glassdoor Torrent Power interview questions](https://www.glassdoor.co.in/Interview/Torrent-Power-Interview-Questions-E371099.htm), [Glassdoor review RVW100526359](https://www.glassdoor.ie/Interview/Torrent-Power-Interview-E371099-RVW100526359.htm), [AmbitionBox Torrent Power Electrical GET](https://www.ambitionbox.com/interviews/torrent-power-interview-questions/electrical-get). Years not visible.

| # | Question | Subject / subtopic | Diff | Status |
|---|---|---|---|---|
| 38 | How is electric power generated? | Generation | E | Reported in interview [snippet-only] |
| 39 | Working of alternators | Machines / synchronous generator | M | Reported in interview [snippet-only; a second search could not re-confirm "alternator", see Gaps] |
| 40 | Selection and rating of a circuit breaker | Switchgear / CB ratings | M | Reported in interview [snippet-only] |
| 41 | Operation of an induction motor | Machines / induction motor | E | Reported in interview [snippet-only] |
| 42 | How does an electromagnetic flow meter work? | Instrumentation | M | Reported in interview [snippet-only] |
| 43 | What types of power plants are there? | Generation | E | Reported in interview [snippet-only] |
| 44 | Relays and protection of the power system | Protection | M | Reported in interview [snippet-only] |
| 45 | Metering knowledge | Distribution / energy metering | E | Reported in interview [snippet-only] |
| 46 | Difference between switchgear and a circuit breaker | Switchgear | E | Reported in interview [snippet-only] |
| 47 | Which IEC standard is used for panel / switchgear selection? | Switchgear / standards | M | Reported in interview [snippet-only] |

#### F. Adani Power, GET (Electrical)
| # | Question | Subject / subtopic | Diff | Status | Source |
|---|---|---|---|---|---|
| 48 | How will you determine what voltage line is passing near you? | Power systems / practical (insulator discs, conductor, tower size) | M | Reported in interview [snippet-only] | [Glassdoor Adani Power GET](https://www.glassdoor.com/Interview/Adani-Power-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE473429.0,11_KO12,44.htm) |
| 49 | What is a synchronous generator? | Machines / alternator | E | Reported in interview [snippet-only] | same |
| 50 | Final-year project questions; readiness to relocate | Project / HR | E | Reported in interview [snippet-only] | same |
| 51 | What are the types of substations? | Substation | E | Labelled "question asked in interviews" (2016 blog); body not retrievable | [powerbycoal blog 2016](https://powerbycoal.blogspot.com/2016/05/adani-power-question-asked-in-interviews.html) [snippet-only] |
| 52 | How much power can be transmitted through a transmission line? | Power systems / transmission capacity, SIL | M | same as above | same |
| 53 | Power transformer vs distribution transformer: difference | Machines / transformer types | E | same as above | same |

- Note: a GeeksforGeeks "Adani Group GET" experience had mainly ECE-type questions (control systems, logic gates, networking), so it is not used for electrical. — [GeeksforGeeks Adani GET](https://www.geeksforgeeks.org/interview-experiences/adani-group-interview-experience-graduate-engineer-trainee-get/)

#### G. BHEL [snippet-only; AmbitionBox 403]
| # | Question | Subject | Diff | Status | Source |
|---|---|---|---|---|---|
| 54 | What is a transformer? Types, working, construction | Machines / transformer | E | Reported in interview [snippet-only]. Role on page is **Electrical Maintenance Technician, not ET** | [AmbitionBox BHEL](https://ambitionbox.com/interviews/bhel-interview-questions?page=6) |
| 55 | Circuit breakers, relays, faults, lightning arresters | Switchgear / protection | M | Reported in interview [snippet-only], role unclear | [AmbitionBox BHEL](https://ambitionbox.com/interviews/bhel-interview-questions) |
| 56 | Transmission and distribution of electricity (HT and ...) | Power systems / T&D | M | Reported in interview [snippet-only] | [AmbitionBox BHEL Electrical Engineer](https://www.ambitionbox.com/interviews/bhel-interview-questions/electrical-engineer) |

#### H. NHPC, Assistant Executive Engineer (Electrical) [snippet-only]
- Panel of 4-5. Difficulty "average, based on what you have studied". Most questions came from the **practical training report**, and the candidate was asked about the **college project**. A candidate advised reading the NHPC website and the basics of project technology. — [Glassdoor NHPC](https://www.glassdoor.co.in/Interview/NHPC-Interview-Questions-E507798.htm)

#### I. Preparation lists (NOT evidence of being asked)
- **forumautomation "BHEL Electrical Interview Questions"** (user post, 30 Jul 2024; no claim of who/when asked) — [forumautomation](https://forumautomation.com/t/bhel-electrical-interview-questions/12336): conditions for parallel operation of transformers (M); V and inverted-V curves of synchronous motors (M); corona and how to reduce it (E); P/PI/PID controllers (M); DC motor braking methods (M); water hammer (M); DC motor advantages over AC (E); load factor, demand factor, installed capacity, spinning reserve (E); which plants serve as peak-load plants and why (M); string efficiency of insulators (H, often numerical); transient stability and how to improve it (M); single-line diagram and its assumptions (E); step and touch potential (M, earthing); substation switching schemes (M); speed control of DC shunt motor (M); microprocessor vs microcontroller (E); SIL (M); Ex-OR from NAND gates (E); race-around condition (M); why a 1-phase induction motor is not self-starting and how to start it (M).
- **YourPedia "BHEL Electrical ET interview preparation"** (coaching blog; prep list) — [YourPedia](https://yourpedia.in/blog/BHEL-Engineer-Executive-Trainee-Interview-Preparation/bhel-electrical-et-interview-preparation): AC vs DC; 1-phase vs 3-phase; motor types; fuse; generator vs motor; power factor; protection schemes; PID; root locus; meters; transducers; PLC; electrical hazards and PPE. HR/company questions: products of BHEL, why BHEL, BHEL's history and projects.
- **NTPC lists (old blogs, 2010-2011)** — [electricalquestionsguide NTPC](http://electricalquestionsguide.blogspot.com/2011/06/ntpc-psu-electrical-interview-questions.html), [eeematerial](https://eeematerial.blogspot.com/2010/06/electrical-questions-for.html) (via search summary): similarity between induction motor and transformer; B-H curve; why a synchronous motor is not self-starting; why thermal plant efficiency is only ~30-40%; why generation voltage is 11-33 kV and not 220 kV; why transformer cores are laminated; corona and its reduction.
- A compilation (ecexplain/azadtechhub type) claims synchronous-machine topics (load angle and its limit, armature reaction, SCR, AVR, synchronising to the grid) are "heavily tested" at NTPC/BHEL/PGCIL. There is no candidate evidence, so this is a **Preparation list**. — [ecexplain synchronous machine](https://ecexplain.in/interview/synchronous-machine-interview)
- placementpapers.app "BHEL Interview Experience 2025-2026: Real Candidate Stories" contains **no individual stories** and has inconsistent dates and durations, so it is unreliable. — [placementpapers.app BHEL](https://placementpapers.app/bhel/interview-experience/)

### Inferences
- Reported questions are mostly **"explain / why / how in practice"** (corona, PF, CB rating, SLD, low tubewell voltage, identifying line voltage). Numericals were essentially never reported. Hard items are deeper-reasoning ones (HVDC harmonics, zero vs negative sequence dominance, gases in transformer faults).
- Private utilities (Tata, Torrent, Adani) lean **practical and distribution/metering-oriented**, while POWERGRID leans **transmission, HVDC and protection**. That fits each company's business (inference, not stated by sources).

### Gaps
- No readable **2021-2026 first-person GATE-PSU EE transcript** for NTPC, POWERGRID or BHEL: AmbitionBox, Glassdoor and Quora returned 403, and Kreatryx refused the connection.
- Exact years and wording for the snippet-only Glassdoor/AmbitionBox items are unknown.
- The Torrent "working of alternators" item appeared in one search summary but a second, targeted search said it found no alternator mention. Treat it as unconfirmed.
- The Adani 2016 blog body could not be retrieved (only its title, "Question asked in Interviews", is confirmed). The question items come from a search summary.
- **DVC and SAIL:** no electrical fresher interview accounts were found (SAIL results were written-test MCQ banks only).
- I did not reach Made Easy, ACE or BYJU'S candidate-transcript posts for these PSUs.

## Which questions recur across multiple independent candidate reports?

### Takeaway
Counting only "Reported in interview" items from distinct sources/candidates, the strongest recurring themes are: **transformer basics/working** (~4), **circuit breakers / protection / relays** (~4), **power plant types / generation** (~4), **project / training / internship** (≥5), **corona** (2), **power factor** (2), **synchronous generator / alternator** (~3), and **power-system SLD / G-T-D diagram** (2, both Tata Power). Exact-wording recurrence is rare. Recurrence is at the **topic** level.

### Cited Findings
- **Transformer working / basics:** NTPC Glassdoor ([Glassdoor NTPC](https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm)); NTPC 2016 blog ([Gateway of Engineering NTPC 2016](https://gatewayofengineering.blogspot.com/2016/07/ntpc-interview-experience-2016.html), ECE); Tata Power 2021/2023 ([BoardInfinity](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)); BHEL AmbitionBox ([AmbitionBox BHEL](https://ambitionbox.com/interviews/bhel-interview-questions?page=6)). Transformer harmonics at PGCIL ([Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)). Roughly 4-5 sources, several snippet-only.
- **Circuit breakers / relays / protection:** Torrent (CB selection and rating; relays) ([Glassdoor Torrent](https://www.glassdoor.co.in/Interview/Torrent-Power-Interview-Questions-E371099.htm)); Tata Power 2022/2023 ([BoardInfinity](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)); BHEL ([AmbitionBox BHEL](https://ambitionbox.com/interviews/bhel-interview-questions)); NTPC transformer protection ([Glassdoor NTPC](https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm)); PGCIL arc quenching ([Kreatryx](https://blog.kreatryx.com/pgcil-interview/), snippet). About 4-5 sources.
- **Power plant types / generation:** PGCIL hydro vs thermal ([Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)); PGCIL modes of generation and why not hydro ([Kreatryx](https://blog.kreatryx.com/pgcil-interview/), snippet); Torrent "how power is generated" and "types of power plants" ([Glassdoor Torrent](https://www.glassdoor.co.in/Interview/Torrent-Power-Interview-Questions-E371099.htm)); Tata Power 2022 plants and new methods ([BoardInfinity](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)). 4 sources.
- **Corona:** PGCIL 2016 ([Gateway](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)); Tata Power KIIT Nov 2023 ([BoardInfinity](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)). 2 reported. It also appears in BHEL and NTPC prep lists.
- **Power factor:** PGCIL 2016 and NTPC Glassdoor. 2 reported.
- **Synchronous generator / alternator:** Adani ([Glassdoor Adani GET](https://www.glassdoor.com/Interview/Adani-Power-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE473429.0,11_KO12,44.htm)); Torrent (unconfirmed); Tata 2021 synchronous machines. About 2-3.
- **Project / internship / training:** Tata Power ("all the questions were from my summer internship", "final year project was asked"); Adani (final-year project); Torrent ("whole interview was resume based ... summer internship and projects"); NHPC (practical training report, college project); PGCIL 2016 (major project, training) — sources as above. At least 5 sources.
- **HVDC:** PGCIL only (2016 harmonics; snippet HVDC vs HVAC). 2 PGCIL sources.

### Inferences
- The most reliably recurring "question" is **"explain your project / training"**, followed by **transformer basics** and **CB / protection**. A mock interviewer for this segment should open with the project, then move to transformers, protection and generation.
- Because several items come via aggregators and snippets, counts are approximate lower bounds. Some BoardInfinity entries may duplicate AmbitionBox reviews.

### Gaps
- Could not de-duplicate across Glassdoor, AmbitionBox and BoardInfinity, because the underlying pages were blocked.
- No recurring numericals (per-unit, fault MVA, load flow) were found in any reported account.

## What subjects/subtopics dominate?

### Takeaway
The reported questions concentrate on **power systems** (transmission, corona, HVDC, SLD, stability, sequence components), **switchgear and protection** (CB rating, relays, arc quenching, lightning surges), **transformers**, and **generation / plant types**. Rotating machines (induction motor, alternator) come next. **Per-unit, load flow and earthing barely appear in reported accounts**: step/touch potential, SIL and string efficiency appear only in preparation lists.

### Cited Findings
- Tally of the 56 attributed reported items in section A-H (my classification): power systems / transmission / HVDC / stability / faults ≈ 20; switchgear and protection ≈ 10; transformers ≈ 9; generation / plant ≈ 7; rotating machines (IM, alternator, sync) ≈ 5; instrumentation / metering / basics / safety ≈ 6; project ≈ several. Based on the tables above, from [Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html), [BoardInfinity Tata Power](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624) and the Glassdoor/AmbitionBox snippets.
- The PGCIL panel focused on "transmission line protection, HVDC converters and transformers". — [Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)
- An AmbitionBox tip for NTPC advises electrical candidates to focus mainly on **electrical machines and power systems**. — [AmbitionBox NTPC](https://ambitionbox.com/interviews/ntpc-interview-questions) [snippet-only]
- A Quora respondent: PSU interviews are "not highly technical, unlike GATE / ESE" and lean to management/HR. Topics to prepare: machines, power systems, power electronics, control, HVDC, FACTS, protection relays, **step and touch potential**. — [Quora PSU EE prep](https://www.quora.com/How-do-I-prepare-for-a-PSU-interview-Electrical-Branch) [snippet-only]
- Faults and sequence components appear once (Tata Power 2023, zero vs negative sequence). — [BoardInfinity](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)

### Inferences
- For a mock interviewer's "PSU / power utility" track, weight topics roughly: power systems and transmission > protection and switchgear > transformers > generation/plant > rotating machines > earthing/per-unit/load flow. Include practical "field" questions (low voltage at a tubewell, identifying line voltage, CB rating, metering).
- Generation companies (NTPC, Adani, Torrent) also ask about plant equipment and generation. Transmission (POWERGRID) asks HVDC, corona, surges.

### Gaps
- No reported per-unit, load-flow or earthing (step/touch) questions were found in the accessible candidate accounts. They may still be asked, but I found no evidence.
- No reported questions on thermal plant auxiliaries (boiler, turbine, cooling tower) for EE candidates at NTPC.

## What does the interview process look like for each company?

### Takeaway
PSUs (NTPC, POWERGRID, BHEL, NHPC) shortlist via **GATE or a CBT**, then hold a **personal interview by a 4-5 member panel** (sometimes with a **GD** first), mixing HR and technical, often **10-30 minutes** for freshers and leaning on the project/training. Private utilities (Tata, Torrent, Adani) run **campus/online processes**: aptitude/psychometric or a core-electrical test, then technical and HR interviews, often resume/internship-driven.

### Cited Findings
- **POWERGRID (2016):** document verification, then a ~4-member panel (half HR, half technical). Interviews mostly 10-20 minutes, usually without self-introduction. Some candidates had a **GD** (~7 per group: 2 min notes, 8 min discussion, 3 min written paragraph; topics like co-education, arranged vs love marriage). HR questions covered family, school and college background, and gap years. — [Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)
- **POWERGRID (current):** PapersAdda describes 2026 ET recruitment as "GATE-centric" (details not read). — [PapersAdda Power Grid 2026](https://papersadda.com/article/power-grid-placement-papers-2026/) [snippet-only]. Interviews may include "Why PGCIL?", and one candidate reported the whole interview was in **Hindi** — search summary of [Kreatryx](https://blog.kreatryx.com/pgcil-interview/) / [Quora](https://www.quora.com/What-was-your-interview-experience-at-PSU-companies-after-good-score-in-GATE-with-ECE-specialisation) [snippet-only].
- **NTPC:** ET shortlisting on GATE, then personal interview with no separate written test (third-party syllabus page) — [rojgardekho NTPC ET 2026](https://rojgardekho.in/article/ntpc-executive-trainee-syllabus-2026) [snippet-only]. A Glassdoor account says NTPC's own test "has been replaced with GATE", followed by GD and interview — [Glassdoor NTPC](https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm) [snippet-only]. A 2021 video-conference panel had 5 members and started with self-introduction and current employment — [Quora](https://www.quora.com/How-was-your-NTPC-interview-experience-for-an-electrical-engineer) [snippet-only]. One respondent mentioned "4 panels for Electrical" — same [snippet-only]. The 2016 NTPC (ECE) account: interview mostly personal/background, ~30 min — [Gateway NTPC 2016](https://gatewayofengineering.blogspot.com/2016/07/ntpc-interview-experience-2016.html) [snippet-only].
- **BHEL:** ET via **CBT** (e.g. held 2023, interview cut-offs Dec 2023), then interview — [YourPedia](https://yourpedia.in/blog/BHEL-Engineer-Executive-Trainee-Interview-Preparation/bhel-electrical-et-interview-preparation). A Glassdoor ET candidate reported GATE-based screening then a personal interview "mostly confined to technical questions" — [Glassdoor BHEL ET](https://www.glassdoor.co.in/Interview/Bharat-Heavy-Electricals-Engineer-Trainee-Interview-Questions-EI_IE40118.0,24_KO25,41.htm) [snippet-only]. The BHEL ET 2025 notification listed 400 vacancies with CBT, document verification and medical — [GeeksforGeeks BHEL recruitment 2025](https://www.geeksforgeeks.org/interview-experiences/bhel-recruitment-2025/) [snippet-only].
- **NHPC (AEE Electrical):** written MCQ, then a 4-5 member panel. Questions mostly from the practical training report and college project — [Glassdoor NHPC](https://www.glassdoor.co.in/Interview/NHPC-Interview-Questions-E507798.htm) [snippet-only].
- **Tata Power GET:** stages vary: resume shortlist, online aptitude (+ psychometric, sometimes coding), GD (e.g. sustainable energy), technical interview (core electrical, projects, diagrams), HR, sometimes a final combined technical + HR round. Some candidates said all questions came from their summer internship. — [BoardInfinity](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)
- **Torrent Power GET (campus):** pre-placement talk, then a written test on core electrical subjects, then technical interview and HR. One interview was "resume based" (internship, projects), mostly power systems and switchgear. — [Glassdoor Torrent](https://www.glassdoor.co.in/Interview/Torrent-Power-Interview-Questions-E371099.htm) [snippet-only]
- **Adani Power GET:** online test on electrical basics ("quite easy"), then an online technical + HR interview. Final-year project questions and relocation readiness. — [Glassdoor Adani Power GET](https://www.glassdoor.com/Interview/Adani-Power-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE473429.0,11_KO12,44.htm) [snippet-only]

### Inferences
- A realistic simulation for this segment: a short HR opening (background, why this PSU, relocation), then the project/training, then 4-8 conceptual core questions drifting toward the company's domain (transmission for POWERGRID, generation for NTPC/Adani, distribution/metering for Tata/Torrent). Total about 15-30 minutes.

### Gaps
- No official panel-composition or marks data; the duration figures are from individual accounts.
- No DVC or SAIL process details were found. The NTPC GD element is reported inconsistently across years.
