# Transformers, motors and protection dominate fresher panels

Across six research passes covering about 30 employers, **the evidence for what Indian core-electrical panels actually ask is topic-level, not question-level**: transformers and induction motors were reported at 7+ employers each, and circuit breakers, relays and protection at 5+, but only about two dozen *specific* questions were reported by two or more independent candidates, and none by more than five. The strongest single signals are "explain your final-year project / internship" (reported in nearly every account), "explain the working of a transformer", "what are the types of motors", "how does an induction motor work", "why a star-delta starter" and "MCB vs MCCB". The reported questions are overwhelmingly **conceptual and practical** (corona, power factor, CB rating, single-line diagrams, earthing, megger, a low-voltage tubewell). **No source reported a numerical with values** being asked in a fresher interview. Evidence quality is the binding constraint: AmbitionBox, Glassdoor, Quora, JoinTaro, Medium and Kreatryx blocked direct reading, so most company-attributed questions come from search-result snippets whose wording, year and role cannot be verified, and recent first-hand PSU (NTPC, BHEL, POWERGRID) accounts are scarce (the richest one dates from 2016). This bank therefore contains **250 unique entries**: 211 technical questions (155 reported as asked, of which 54 rest only on fully read pages, 92 only on search snippets and 9 on both, with about 8 being topic-level "questions on X" entries; 56 preparation-list), 26 HR and project questions (21 reported, 5 preparation-list) and 13 interview-style numerical templates, plus 17 follow-up prompts. The reported count clears 150 only when snippet-level evidence is included, and snippet items should be read as indicative, not verified.

---

## How to read this: evidence labels and limitations

**Evidence labels (applied per source, never upgraded).**

| Code | Label | Meaning |
|---|---|---|
| **RF** | Reported (read in full) | The researcher fetched and read a page in which a candidate says the question was asked (GeeksforGeeks experiences, the Gateway of Engineering PGCIL 2016 account, the BoardInfinity Tata Power GET compilation, WireUnwired L&T 2024). |
| **RS** | Reported (search snippet) | Reported as asked, but seen only through a search-result summary because the page was blocked (AmbitionBox, Glassdoor and Quora returned HTTP 403; Medium 403; JoinTaro 429; Kreatryx refused the connection). Wording, role, year and sometimes country are unverified. |
| **PL** | Preparation list | Appears only in generic question banks, coaching blogs or aggregator lists, with no evidence a candidate was asked it. |
| **PL-N** | Preparation list (interview-style numerical) | A numerical built from formulas in preparation sources. None was reported as asked. |

Where a question has sources at two levels, both codes are shown (for example "RF + RS"). **Freq** counts independent sources for that question's meaning (wording may differ); when recurrence holds only for the broader topic, the cell says "topic". Flags in square brackets: **[pre-2021]** older than the five-year window; **[role unconfirmed]** the role may not be a fresher one; **[non-fresher role]** the source names an experienced or non-engineer role; **[India unconfirmed]**; **[company unknown]**; **[ECE candidate]** the candidate was from electronics; **[diploma-level]**; **[aggregator]** a compilation of other people's reports.

**Limitations a reader must keep in mind.**

The biggest problem is **blocked sources**. AmbitionBox, Glassdoor, Quora, JoinTaro and Medium hold most first-hand Indian fresher reviews, and none could be read in full. Every RS item rests on a search engine's summary of that page, so its exact wording is a paraphrase of a paraphrase. Glassdoor also mirrors the same review across country domains (.co.in, .ca, .ie, .com.hk), so the research counted each distinct review ID once, but independence between Glassdoor, AmbitionBox, JoinTaro and BoardInfinity entries (which may syndicate the same candidate) could not be checked ([BoardInfinity Tata Power](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)). Counts are therefore approximate.

**Recent first-hand PSU evidence is thin.** The only fully read GATE-PSU electrical transcript is a POWERGRID account from June 2016 ([Gateway of Engineering PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)). NTPC and BHEL material is snippet-only, and some of it comes from experienced or technician roles. No DVC or SAIL interview accounts were found, and no Reddit thread with first-person core-EE questions surfaced at all.

**Recurrence is mostly topic-level.** Many reports say only "questions on transformers and induction motors". Those support statements like "transformers come up at Siemens Energy, L&T, Tata Power and Hitachi Energy", not "this exact question is asked everywhere". Section A separates the two.

**Absence of a "reported" tag is weak evidence.** Staples such as the Ferranti effect, DC on a transformer, CB vs isolator, or OC/SC tests carry only a PL label here because the sources most likely to report them were blocked, not because candidates say they are rarely asked. These items appear in nearly every question bank ([eeemadeeasy](https://www.eeemadeeasy.com/electrical-engineering-interview-questions-answers/); [eeeguide T&D Q&A](https://www.eeeguide.com/transmission-and-distribution-interview-questions-and-answers/)), and a browser-based pass over the blocked review sites could move some of them to "reported".

**Exclusions.** Two GeeksforGeeks accounts written by electrical students were software-track interviews with no electrical questions and are excluded: ABB 2020 IIT pool, Software Engineer ([GfG ABB 2020](https://www.geeksforgeeks.org/?p=528646)), and Siemens Graduate Trainee Engineer off-campus ([GfG Siemens GTE](https://www.geeksforgeeks.org/?p=1027316)). Non-electrical items reported elsewhere (OOP at Hitachi Energy Chennai, DSA/SQL at GE Vernova, thermodynamics at one L&T panel, steering at Bosch) are mentioned for context but not counted as electrical questions.

---

## A. Most frequently reported: about two dozen questions clear the two-source bar

Only questions with **two or more independent reported sources** appear in the first table. Several of these counts include a source whose role, country or year is uncertain, and the table says so. Nothing reached more than five fully independent sources except the project/internship discussion.

### A1. Question-level recurrence (2+ independent reported sources)

| Rank | ID | Question (faithful paraphrase) | Freq | Who reported it | Labels |
|---|---|---|---|---|---|
| 1 | HR20 | Explain your final-year project / internship / training (often drilled into one project) | 10+ | Tata Power (several), Adani, Adani Power, Torrent, NHPC, POWERGRID 2016, L&T 2024, L&T Power 2025, Siemens Energy, Schneider, GE Vernova, Micron | RF + RS |
| 2 | EM01 | Explain the working principle of a transformer | 5 entry-level + 3 role-unconfirmed | L&T Construction GET, Havells GET, Hitachi Energy intern, Schneider GET, L&T Construction EE 2025; NTPC (x2), BHEL technician | RS |
| 3 | EM26 | What are the types of motors? | 5 | Emami, Siemens Energy, Siemens, Havells, Hitachi Energy | RF + RS |
| 4 | HR03 | Why do you want to join this company? | 7 | Adani, Tata Power, L&T, BHEL, Schneider, POWERGRID, Hitachi Energy | RF + RS |
| 5 | HR05 | Any issue with relocation / posting anywhere (including difficult locations)? | 6 | Adani, Adani Power, L&T (x2), ABB, Schneider | RF + RS |
| 6 | HR01 | Tell me about yourself / introduce yourself | 5+ | Tata Power (x2), L&T Power, Polycab, NTPC 2021 | RF + RS |
| 7 | HR08 | Strengths and weaknesses | 4 | Tata Power, BHEL, Schneider, GE Vernova | RF + RS |
| 8 | EM25 | How does an induction motor work? | 3 (+1 single-phase variant, EM28) | Siemens Energy, Torrent, L&T Power [pre-2021] | RS |
| 9 | EM30 | Why is a star-delta starter used / preferred for an induction motor? | 3 | ABB, Adani Electricity, a Glassdoor listing [company unknown] | RS |
| 10 | EM03 | Name the parts and types of a transformer | 3 (+1 technician) | Siemens Energy, Siemens, Tata Power | RF + RS |
| 11 | SI01 | MCB vs MCCB (and ELCB / other breakers) | 3-4 | Schneider (two Glassdoor entries, possibly one person), an AmbitionBox question entry, Tata Power 2023 | RF + RS |
| 12 | PS51 | Which protection is fitted on a transformer / transformer protection | 1 GET + 2 role-unconfirmed | Hitachi Energy GET, NTPC executive, Tata Steel | RS |
| 13 | PS44 | Difference between switchgear and a circuit breaker | 1 GET + 2 role-unconfirmed | Torrent GET, NTPC technician, BHEL electrical engineer | RS |
| 14 | BE15 | Explain the working / I-V characteristics of a MOSFET (semiconductor track) | 3 | Texas Instruments, Micron (x2) | RS |
| 15 | HR02 | Tell us about your family background | 3 | Adani, Tata Power, Schneider | RF |
| 16 | HR11 | Career interests / goals / five-year plan | 3 | Adani, Schneider, Havells | RF + RS |
| 17 | PS13 | What is power factor (and load factor)? | 2 India + 2 weak | POWERGRID 2016, NTPC; IMEG [India unconfirmed], a graduate listing [country unknown] | RF + RS |
| 18 | PS18 | What is corona? | 2 | POWERGRID 2016, Tata Power KIIT 2023 | RF |
| 19 | EM07 | What are the losses in a transformer? | 2 | Tata Power GET 2025, POWERGRID trainee | RS |
| 20 | EM06 | Why is a transformer rated in kVA? | 2 (one 2019) | Siemens Energy [India/fresher unverified], Bajaj Electricals 2019 | RS + RF |
| 21 | PS15 | Draw the single-line diagram of a power system, from generating station to consumers | 2 (two candidates, one aggregator) | Tata Power (pre-2020 and Nov 2023) | RF |
| 22 | PS02 | What types of power plants / modes of generation are there (and why not more hydro)? | 2 | Torrent, POWERGRID | RS |
| 23 | PS36 | What is a substation / name its parts | 2 (+1 topic) | Siemens Energy, Havells; POWERGRID (substation equipment) | RS |
| 24 | EM38 | What is a synchronous generator / how does an alternator work? | 2 (+1 unconfirmed) | Adani Power, Siemens Gamesa; Torrent unconfirmed | RS |
| 25 | NT01 | Ohm's law and its practical applications | 2 | Tata Power 2024, Schneider GET | RF + RS |
| 26 | NT11 | Draw an RC circuit's output waveform / plot Vc and Ic after a switch closes | 2 (+1 topic) | Texas Instruments, a fresher-engineer listing; NXP topic | RF + RS |
| 27 | SI08 | How is earth resistance measured, with which instrument, and what value is acceptable? | 2 (one electrician role) | L&T 2020 [diploma-level], AmbitionBox electrician profile | RF + RS |
| 28 | HR07 | Will you pursue higher studies? | 2 | Tata Power, L&T | RF + RS |
| 29 | HR13 | Why did you choose Electrical Engineering? | 2 | L&T, GE Vernova | RS |
| 30 | HR09 | What qualities make you fit for this position / why should we hire you? | 2 | Adani, Schneider | RF |
| 31 | HR10 | Which engineering division / department would you like to work in? | 2 | Adani, Havells | RF + RS |
| 32 | HR16 | Background, schooling, gap years | 2 | POWERGRID 2016, NTPC Korba 2022 | RF + RS |
| 33 | CS01 / CS03 | What is a control system, and what types are there? | 2 (one ECE candidate) | Adani [ECE candidate], Schneider Surat 2021 | RF + RS |

The core technical part of this list is short and clustered: **transformers (working, parts, losses, kVA, protection), induction motors (working, types, star-delta), switchgear (MCB/MCCB, switchgear vs CB), power factor, corona, generation types, substations and the single-line diagram**. Everything else in this report is either single-source or preparation-list.

### A2. Topic-level recurrence (the broader signal)

| Topic | Employers with a reported question on it | Evidence |
|---|---|---|
| Transformers (any aspect) | L&T Power (2017, 2025), L&T Construction, Tata Power, Siemens Energy (2 reviews), Siemens, ReNew, UPL, IMEG [India unconfirmed], Hitachi Energy, Havells, Schneider, NTPC, BHEL, POWERGRID | Mostly RS; Tata Power RF ([BoardInfinity](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)) |
| Induction motors / motor types | Emami, L&T Power, L&T 2020, ReNew, Siemens Energy, Siemens, Siemens Gamesa, UPL, IMEG, Adani Electricity, ABB, Torrent, Hitachi Energy, Havells, Thermax | Emami RF ([GfG Emami](https://www.geeksforgeeks.org/?p=1074649)); rest mostly RS |
| Circuit breakers, relays, protection, switchgear | ABB, Siemens, Siemens Energy, Schneider, Hitachi Energy, L&T (Mumbai, 2024), Tata Power, Torrent, UPL, IMEG, NTPC, BHEL, POWERGRID | Schneider RF ([GfG Schneider](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/)); rest mostly RS |
| Generation / power plant types | POWERGRID (x2), Torrent, Tata Power, L&T 2020, GE Vernova, Schneider (renewables) | RF + RS |
| Earthing | L&T 2020, Hitachi Energy, Siemens Gamesa, AmbitionBox EE profile | RF + RS |
| Real vs reactive power / phasors | Siemens Energy 2025, Siemens 2024 | RS |
| HVDC | POWERGRID only (2016 account and a Kreatryx snippet) | RF + RS |
| Harmonics | ABB (induction motors), POWERGRID (transformers, HVDC) | RF + RS |
| Microcontrollers / microprocessors | Schneider (x2), Bosch | RS |
| CMOS inverter / sequential logic | Texas Instruments, Micron, NXP; Schneider (flip-flops) | RF + RS |

Machines and transformers lead because they show up at manufacturers, utilities and MNCs alike; protection and switchgear lead at ABB, Schneider, Hitachi Energy, L&T and the utilities; HVDC and transmission theory appear almost only at POWERGRID ([Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)).

---

## B. Company-wise: each panel drifts toward its own business

Question IDs refer to the subject bank in Section C (and HR items in Section G). Process descriptions are from candidate reports unless marked otherwise; single-source claims are noted.

**ABB.** Reported electrical-GET questions are definition-level: define a relay, PCB, capacitor and resistor, resistor colour coding, the use of a star-delta starter, and methods to reduce harmonics in induction motors (PS42, BE01-BE03, EM30, EM31), all from one AmbitionBox campus page ([AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get), RS, 2021). The process varies by report: aptitude test then HR with relocation questions (same source); a Bengaluru campus run with a written test, two technical rounds, HR, a case interview and a GD ([Glassdoor ABB](https://static-pc.glassdoor.fr/Interview/ABB-Trainee-Management-Interview-Questions-EI_IE3076.0,3_KO4,22_IP6.htm), RS). An aggregator claims 45-75 minute technical rounds on 2-3 core subjects ([interviewquestions.app](https://interviewquestions.app/abb/interview-experience/), PL). The fully read ABB account is software-track and excluded.

**Siemens, Siemens Energy and Siemens Gamesa.** These panels lean on **machines, transformers and substations**: parts of a substation, types of motors, DC series motor speed control, induction motor working, Buchholz relay, transformer parts and cooling, vector groups, and which of two equal-power motors at different voltages draws less current (PS36, EM26, EM47, EM25, PS52, EM03, EM04, EM05, EM55) from one Siemens Energy campus GET account ([Medium Siemens Energy](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a), RS). A Siemens GET in Hyderabad (Aug 2024) was asked motor types, rotor types, real vs reactive power and transformer types and parts (EM26, EM39, NT10, EM03) ([JoinTaro Siemens Hyderabad 2024](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858), RS); a Siemens Energy GET in Haryana (2025) had to draw phasor diagrams with leading and lagging cases (NT09) ([Glassdoor Siemens Energy](https://www.glassdoor.ca/Interview/Siemens-Energy-Interview-E4393689-RVW82850724.htm), RS); Siemens Gamesa asked about alternators, substation earthing and substation batteries (EM38, PS38, PS39) ([Glassdoor Siemens Gamesa](https://www.glassdoor.com/Interview/Started-with-Basic-Introduction-Explain-Previous-job-experience-if-you-have-any-Course-Project-Questions-related-to-I-QTN_5138668.htm), RS). The Siemens Energy campus process was a Mercer test of 91 questions in 80 minutes (aptitude, verbal, electrical) then a combined technical + HR interview (Medium, RS); Siemens India GET 2022 added a "personality check" by the business head ([JoinTaro Siemens GET 2022](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineering-trainee-get-india-december-28-2022-declined-offer-positive-b3e64a64), RS), and one candidate called the written test "about GATE level" ([JoinTaro Siemens Pune 2025](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-trainee-engineer-pune-september-25-2025-accepted-offer-neutral-8921a24b), RS). PLC, VFD, WinCC and HMI questions appear only in a **service-engineer (experienced)** review ([Glassdoor Siemens](https://www.glassdoor.co.in/Interview/Siemens-Interview-Questions-E3510_P3.htm), RS) and are not counted as fresher evidence.

**Schneider Electric.** The best-evidenced MNC: a fully read GfG account asked switchgear vs relay, types of CBs (explain one in detail), renewables and smart-grid products (PS43, PS45, PS07, PS08) ([GfG Schneider](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/), RF). Snippets add MCB/MCCB, ELCB vs RCD, types of control systems, star-delta network conversion, Ohm's law, microcontroller vs microprocessor, 8051/ESP32, flip-flops and counters (SI01, SI03, CS03, NT08, NT01, BE05-BE07). Process: 30 technical MCQs in 30 minutes (Electrical, Electronics or Software track), gamified AON aptitude, about 30 minutes technical, then HR on relocation, "why hire you" and family (GfG, RF). One Sep 2024 campus funnel went from 2,000+ test-takers to 280 to 40 at HR ([AceRound](https://www.aceround.app/blog/bosch-siemens-schneider-electric-fresher-interview-process-india/), aggregator).

**L&T (L&T Power, L&T Construction, ECC).** Practical and site-oriented. The 2020 Bangalore drive (diploma-level candidates, fully read) asked about DC motors in refineries, the most widely used motor, maintenance and its parameters, insulation resistance, megger, earth pits, earth resistance, earth grids, cutting power cost, refinery power and diesel vs coal plants (EM50, EM29, EM56, MI05, MI04, SI07-SI09, SI16, PS05, PS04) ([GfG L&T 2020](https://www.geeksforgeeks.org/?p=700115), RF). Graduate GET snippets add SF6 gas and skin effect (PS48, PS21), with one Mumbai candidate saying the round was "mostly on power system protection and switchgears" ([Glassdoor L&T](https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW86786381.htm), RS), and L&T Power Chennai (Dec 2025) "mostly transformers and machines" after intro and internship ([Glassdoor L&T Power](https://www.glassdoor.com/Interview/L-and-T-Power-Interview-Questions-E579774.htm), RS). The ECC on-campus GET 2024 ran a CGPA shortlist, a 90-question online test (aptitude, analytical, verbal, sectional cut-off), a technical PI on machines, protection and the candidate's project, then HR with a 2-minute extempore; HR asked about posting in J&K and why the candidate had not built coding habits ([WireUnwired L&T GET 2024](https://wireunwired.com/lt-get-interview-experience-2024/), RF). One L&T panel asked a candidate mechanical subjects only, showing panels vary ([Glassdoor L&T](https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW100584575.htm), RS).

**Tata Power.** The richest dated set (2020-2025) comes via BoardInfinity, which compiles candidate reports (RF, aggregator): transformers and synchronous machines (2021), protection (2022), SLD and voltage compensation at a load centre, a low-voltage tubewell (pre-2020), plants, new generation and EVs (2022), parts of a relay, CB and transformer, zero vs negative sequence (2023), power system from generation to consumers, interconnection, underground vs overhead, corona, MCBs (Nov 2023, KIIT), testing equipment and safety (2020), Ohm's law and KCL with a power-distribution problem (2024) (PS15, PS32, PS33, PS06, PS50, PS29, PS16, PS17, PS18, SI01, MI08, NT01, NT02) ([BoardInfinity Tata Power](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)). Glassdoor snippets add transformer losses and transformer energisation for GET 2025 (EM07, EM08) ([Glassdoor Tata Power GET](https://www.glassdoor.co.in/Interview/Tata-Power-Graduate-Engineer-Trainee-GET-Interview-Questions-EI_IE152741.0,10_KO11,40.htm), RS). The process varies across years: resume shortlist, aptitude (sometimes with electrical questions or coding), psychometric test, GD (e.g. sustainable energy), technical and HR, sometimes a combined final round; several candidates said every question came from their summer internship (BoardInfinity).

**Adani (Adani Power, Adani Electricity, Adani Group).** Adani Power GET snippets: how to tell what voltage a nearby line carries, what a synchronous generator is, final-year project and relocation (PS24, EM38) ([Glassdoor Adani Power GET](https://www.glassdoor.com/Interview/Adani-Power-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE473429.0,11_KO12,44.htm), RS); online test on electrical basics ("quite easy") then online technical + HR (same). An older 2016 blog titled "question asked in interviews" lists substation types, line transmission capacity and power vs distribution transformer (PS37, PS23, EM12) ([powerbycoal 2016](https://powerbycoal.blogspot.com/2016/05/adani-power-question-asked-in-interviews.html), RS, body not retrievable). Adani Electricity: star-delta starter, two rounds (EM30) ([AmbitionBox Adani Electricity](https://ambitionbox.com/interviews/adani-electricity-interview-questions), RS). The fully read Adani Group GET (Dec 2022) was an **ECE candidate**: control system basics plus heavy HR and company knowledge; process was resume screen, a 160-minute online test, an asynchronous Talocity video interview (5 questions), then a 40-minute Teams panel of 2 technical + 1 HR ([GfG Adani GET](https://www.geeksforgeeks.org/?p=1047365), RF).

**NTPC.** All question evidence is snippet-level and partly from non-fresher roles: protection on transformers, insulating-oil grade, gases from internal faults, power factor, transformer working, how a generator is started (PS51, EM10, PS53, PS13, EM01, EM42) from an **Executive Engineer** entry with a four-member panel ([Glassdoor NTPC](https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm), RS, role unconfirmed); switchgear vs CB and CB short-circuit protection from technician/executive pages (PS44, PS49). ET shortlisting is by GATE with no separate written test ([rojgardekho NTPC ET](https://rojgardekho.in/article/ntpc-executive-trainee-syllabus-2026), RS, prep guide), which also claims a 3-member panel and a 10% interview weight (single source). A 2021 video panel had 5 members and opened with self-introduction ([Quora NTPC](https://www.quora.com/How-was-your-NTPC-interview-experience-for-an-electrical-engineer), RS). GD is reported inconsistently across years.

**BHEL.** Snippets: transformer types, working, construction (a **maintenance technician** role); CBs, relays, faults, lightning arresters; T&D; switchgear vs CB; testing of HT/LT panels; why BHEL; strengths and weaknesses (EM01, EM03, PS59, PS35, PS44, MI09) ([AmbitionBox BHEL](https://ambitionbox.com/interviews/bhel-interview-questions), RS). Everything else is preparation-list ([forumautomation BHEL](https://forumautomation.com/t/bhel-electrical-interview-questions/12336); [YourPedia BHEL](https://yourpedia.in/blog/BHEL-Engineer-Executive-Trainee-Interview-Preparation/bhel-electrical-et-interview-preparation)). ET selection is via a CBT (2023 cycle) then interview (YourPedia); a Glassdoor ET candidate described GATE screening and a mostly technical interview ([Glassdoor BHEL ET](https://www.glassdoor.co.in/Interview/Bharat-Heavy-Electricals-Engineer-Trainee-Interview-Questions-EI_IE40118.0,24_KO25,41.htm), RS). **Panel size conflicts**: 4 senior members in a 2013 review versus 5 and, elsewhere in the same prep blog, 8 members ([Glassdoor BHEL 2013](https://www.glassdoor.co.in/Interview/Bharat-Heavy-Electricals-Interview-E40118-RVW18570507.htm); [margdarshanprep](https://margdarshanprep.com/blog/?p=583), both RS).

**POWERGRID (PGCIL).** The one fully read EE account (June 2016, GATE-based ET) asked power and load factor, transformer harmonics, HVDC harmonics and their suppression, corona, lightning surges, hydro vs thermal, and (to others that day) T&D losses, 12-pulse converters and abbreviations (PS13, EM09, PS27, PS18, PS19, PS03, PS20, PE03, PS34); the panel of about 4 (half HR, half technical) ran 10-20 minutes and focused on transmission-line protection, HVDC and transformers, with some candidates sitting a GD first ([Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html), RF, [pre-2021]). Snippets add arc quenching, transient stability, HVDC vs HVAC and why hydro is not used more (PS47, PS28, PS26, PS02) ([Kreatryx PGCIL](https://blog.kreatryx.com/pgcil-interview/), RS), and a trainee who after basics and the GATE score got mostly substation equipment and transformer losses ([AmbitionBox POWERGRID](https://www.ambitionbox.com/interviews/power-grid-corporation-of-india-interview-questions/trainee), RS). A coaching blog puts PI weight at about 12% ([YourPedia PGCIL](https://www.yourpedia.in/blog/Interview-Group-Discussion-Preparation-for-PGCIL/how-an-electrical-engineer-should-prepare-for-pgcil-interviews), PL).

**Hitachi Energy.** Relays and CBs, motor and relay types, transformers and machines, power-transformer ratings, transformer protection and types of earthing (EM26, PS51, SI06, EM13, EM01) ([AmbitionBox Hitachi Energy Electrical GET](https://www.ambitionbox.com/interviews/hitachi-energy-interview-questions/electrical-get); [Glassdoor Hitachi MT](https://www.glassdoor.com/Interview/Hitachi-Energy-Management-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,33.htm); [Glassdoor Hitachi GET](https://www.glassdoor.com/Interview/Hitachi-Energy-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,40.htm), all RS). A 2024 GET process ran assessment, phone interview, final interview and GD with behavioural questions (same Glassdoor GET page); a Chennai GET was asked OOP (non-electrical, not counted).

**Torrent Power.** Campus GET snippets: how power is generated, plant types, alternator working (unconfirmed by a second search), CB selection and rating, induction motor operation, electromagnetic flow meter, relays and protection, metering, switchgear vs CB and the IEC standard for switchgear selection (PS01, PS02, EM38, PS46, EM25, MI06, MI07, PS44, PS57) ([Glassdoor Torrent Power](https://www.glassdoor.co.in/Interview/Torrent-Power-Interview-Questions-E371099.htm), RS). Process: pre-placement talk, written test on core subjects, technical, HR; one interview was "resume based" (same).

**Havells.** Snippets (anonymous, mostly undated): what is a substation (GTE-Electrical, Dec 2024), transformer working, types of motors, servo motors, the electric-iron principle, why 11 kV multiples, installation safety, solar LEDs and IGBTs, MCB vs fuse, synchronous motors (PS36, EM01, EM26, EM54, SI14, PS10, SI12, PE06, SI02, EM40) ([Glassdoor Havells](https://www.glassdoor.co.in/Interview/Havells-India-Interview-Questions-E352690.htm), RS). Process: 60-question MCQ test, CV-based technical, HR on department preference and five-year plan; "very strict about adhering to guidelines" on design diagrams (same).

**Thermax.** Mostly old (2010-2019) snippets: VFD and its circuit, circuit-design fundamentals, motors and maintenance, and "one numerical on basic electrical engineering" with no content given (PE04, SI24, EM56) ([Glassdoor Thermax](https://www.glassdoor.sg/Interview/Thermax-Interview-Questions-E142281.htm), RS). GET reports are mostly thermodynamics and boilers ([Glassdoor Thermax GET](https://www.glassdoor.com/Interview/Thermax-Graduate-Engineer-Trainee-Interview-Questions-EI_IE142281.0,7_KO8,33.htm), RS).

**Bosch.** Fresher evidence is **electronics, not motors**: diode characteristics, modulation and sampling, steering and automobiles, microcontrollers, digital design, basic control and C (BE10, BE12) ([Glassdoor Bosch GET](https://www.glassdoor.com/Interview/Robert-Bosch-India-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE237727.0,18_KO19,51.htm), RS; [Glassdoor Bosch ECE](https://www.glassdoor.com/Interview/I-am-from-ECE-background-It-was-conducted-by-HirePro-recruiting-agency-The-hiring-process-had-3-rounds-1-Aptitude-QTN_1243488.htm), RS). Power electronics (DC-DC converter analysis) appears only for an EV-team **intern** (PE07). Process: aptitude, GD, technical, HR; a HirePro ECE drive had a 60-question test, about an hour of technical and 15 minutes of HR. Cut-offs conflict (70% vs 60-65%) ([AceRound](https://www.aceround.app/blog/bosch-siemens-schneider-electric-fresher-interview-process-india/)).

**Micron (and other semiconductor firms).** Micron's IIT Guwahati Semiconductor Engineer drive (fully read): Hirepro OA (~30 questions: digital, analog, devices, control, signals), a technical round on project plus circuits (divide-by-2 and divide-by-3 dividers, inverter-chain frequency and how to raise its period, bit flips, CPU frequency and CPI), then a DSA round (BE18-BE20) ([GfG Micron](https://www.geeksforgeeks.org/interview-experiences/micron-technology-interview-experience-for-semiconductor-engineer-on-campus/), RF). Glassdoor snippets add MOSFET sketch, I-V, short-channel effects and reliability (BE15-BE17). Texas Instruments (intern, fully read): latches vs flip-flops, NAND feedback, NAND from muxes, CMOS inverter, RC transients (BE21-BE26, NT11) ([GfG TI](https://www.geeksforgeeks.org/?p=884598), RF). NXP and Analog Devices add RC/MOS/current mirrors and op-amp compensation (BE28, BE29), RS. These rounds test devices and digital logic, not power engineering.

**GE Vernova / GE.** Snippets mention DC motors, inverters, diodes, FPGAs, transformer windings, substation design packages and gas turbines, plus OOP, DSA and SQL (PE08, PS40, PS09) ([Glassdoor GE Vernova GET](https://www.glassdoor.com/Interview/GE-Vernova-Graduate-Engineer-Trainee-Interview-Questions-EI_IE740889.0,10_KO11,36.htm), RS), but **none is confirmed as an India fresher report**. A 2020 GE PGET (Warangal) asked what a power semiconductor device is (PE01) ([JoinTaro GE PGET](https://www.jointaro.com/interviews/companies/general-electric/experiences/post-graduate-engineering-trainee-pget-warangal-telangana-october-1-2020-no-offer-positive-4f535cd6/), RS). Treat GE Vernova as **no usable India-fresher evidence**.

**Companies with no usable evidence.** **CG Power**: no question-level report; its AmbitionBox Electrical GET page returned 403 ([AmbitionBox CG](https://ambitionbox.com/interviews/cg-interview-questions/electrical-get)). **Polycab**: only topic labels ("electrical engineering and basic electronics"), self-introduction, "why this post" and sales questions ([AmbitionBox Polycab](https://ambitionbox.com/interviews/polycab-wires-interview-questions), RS); cable topics are preparation-list only. **Mitsubishi Electric**: only an intern test mixing mechanical, electrical and one SQL query, India not confirmed ([Glassdoor Mitsubishi Electric Automation](https://www.glassdoor.com/Interview/Mitsubishi-Electric-Automation-Interview-Questions-E270239.htm), RS). **GE Vernova**: as above. The hypotheses "cables at Polycab" and "motors and transformers at CG Power" are plausible but unsupported.

**Other employers that supplied evidence.** Emami GET 2023 (on-campus; motor types, induction vs synchronous; technical round "mostly HR-style", about 5 questions in 25-30 minutes) ([GfG Emami](https://www.geeksforgeeks.org/?p=1074649), RF); Bajaj Electricals Junior Engineer (a full verbatim list, but **2019**) ([GfG Bajaj](https://www.geeksforgeeks.org/?p=357010), RF); NHPC AEE (4-5 member panel, questions mostly from the training report and project) ([Glassdoor NHPC](https://www.glassdoor.co.in/Interview/NHPC-Interview-Questions-E507798.htm), RS); ReNew, UPL, Hind Rectifiers, TRL Krosaki and Tata Steel (single snippets). IMEG appears on the Indian Glassdoor domain but is a US firm, so its items are flagged [India unconfirmed].

---

## C. Subject-wise bank: 211 technical entries, 155 of them reported as asked

Columns: **Diff** E = Easy (definitions), M = Medium (concepts, comparisons, applications), H = Hard (numericals, troubleshooting, deeper reasoning). **Type**: Campus, Off-campus, GET (route not stated), PSU via GATE, Other fresher, or Unknown. Source keys link to the register at the end.

### C1. Electrical Machines (56)

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| EM01 | Explain the working principle of a transformer / "What is a transformer?" | Transformer, principle | L&T Construction; Havells; Hitachi Energy; Schneider; L&T Construction; NTPC; BHEL | Electrical GET; GET; Intern; GET; Electrical Engineer (Feb 2025); executive [role unconfirmed]; maintenance technician [non-fresher role] | GET; others Unknown | E | RS | 5 + 3 | [LTC-AB] [HAV-GET] [HIT-INT] [SCH-GET44] [LTC-ABEE] [NTPC-GD] [NTPC-ABX] [BHEL-AB6] |
| EM02 | How does a transformer work, and sketch the flux lines and secondary current for a sinusoidal primary | Transformer, principle | NTPC | Not stated [ECE candidate] | PSU interview 2016 [pre-2021] | M | RS | 1 | [NTPC16] |
| EM03 | Name the parts and the types of a transformer | Transformer, construction | Siemens Energy; Siemens; Tata Power; BHEL | Electrical GET; GET (EEE); GET; technician [non-fresher role] | Campus ~2023; Hyderabad Aug 2024; Campus Jan 2023 | E | RF + RS | 3 + 1 | [SE-MED] [SIE-HYD24] [TATA-BI] [BHEL-AB6] |
| EM04 | Why do transformers need cooling (fans, radiators, oil)? | Transformer, cooling | Siemens Energy | Electrical GET | Campus ~2023 | M | RS | 1 | [SE-MED] |
| EM05 | Explain transformer vector groups | Transformer, connections | Siemens Energy | Electrical GET | Campus ~2023 | H | RS | 1 | [SE-MED] |
| EM06 | Why is a transformer rated in kVA and not kW? | Transformer, rating | Siemens Energy; Bajaj Electricals | Not confirmed [India unconfirmed]; Junior Engineer | Unknown; Other fresher 2019 [pre-2021] | E | RS + RF | 2 | [SE-GD1] [BAJAJ]; prep [C360-KVA] [EEEMADE] |
| EM07 | What are the losses in a transformer? | Transformer, losses | Tata Power; POWERGRID | GET 2025; trainee | GET; PSU via GATE | E | RS | 2 | [TATA-GD25] [PG-AB] |
| EM08 | What happens when a transformer is energised? | Transformer, inrush / no-load current | Tata Power | GET | GET | M | RS | 1 | [TATA-GD5] |
| EM09 | Explain harmonics in transformers | Transformer, magnetising current | POWERGRID | Executive Trainee (Electrical) | PSU via GATE 2016 [pre-2021] | M | RF | 1 | [PGCIL16] |
| EM10 | What grade of insulating oil is used in transformers? | Transformer, oil | NTPC | Executive Engineer [role unconfirmed] | Unknown | M | RS | 1 | [NTPC-GD] |
| EM11 | What are common causes of transformer humming? | Transformer, noise | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ] |
| EM12 | Power transformer vs distribution transformer | Transformer, types | Adani Power | Not stated | 2016 blog [pre-2021] | E | RS | 1 | [ADANI16] |
| EM13 | What ratings do power transformers come in? | Transformer, ratings | Hitachi Energy | Intern | Unknown | M | RS | 1 | [HIT-INT] |
| EM14 | Why does a transformer have to limit the current? | Transformer | Not visible | Graduate EE listing [company unknown] [India unconfirmed] | Unknown | M | RS | 1 | [GD-GRAD3] |
| EM15 | Describe the transformer maintenance procedure | Transformer, maintenance | Tata Steel | Electrical Engineer [role unconfirmed] | Unknown | M | RS | 1 | [LTC-ABEE] |
| EM16 | What happens if DC is applied to a transformer primary? | Transformer | none | none | none | M | PL | 3 prep | [FA100] [ECLASS-TX] [YP-POSOCO] |
| EM17 | What is the purpose of a tap changer? | Transformer, voltage regulation | none | none | none | E | PL | 1 prep | [FA100] |
| EM18 | Core-type vs shell-type transformer | Transformer, construction | none | none | none | E | PL | 1 prep | [FA100] |
| EM19 | Why is a transformer core laminated? | Transformer, eddy-current loss | none | none | none | E | PL | 3 prep | [ECLASS-TX] [NTPC11] [EEEMAT] |
| EM20 | Explain the OC and SC tests; when is efficiency maximum? | Transformer, testing | none | none | none | M | PL | 1 prep | [ECLASS-TX] |
| EM21 | Conditions for parallel operation of transformers | Transformer, operation | none | none | none | M | PL | 1 prep | [FA-BHEL] |
| EM22 | Delta-delta vs delta-star; why delta-star for distribution? | Transformer, connections | none | none | none | M | PL | 1 prep | [HITB] |
| EM23 | How are an induction motor and a transformer similar? | Machines, analogy | none | none | none | M | PL | 2 prep | [NTPC11] [EEEMAT] |
| EM24 | Explain the B-H curve | Magnetics | none | none | none | E | PL | 1 prep | [EEEMAT] |
| EM25 | How does an induction motor work? | Induction motor, principle | Siemens Energy; Torrent; L&T Power | Electrical GET; Electrical GET; Trainee Electrical | Campus ~2023; Campus; 2017 [pre-2021] | E | RS | 3 | [SE-MED] [TORRENT] [LTP17] |
| EM26 | What are the types of motors? | Machines, classification | Emami; Siemens Energy; Siemens; Havells; Hitachi Energy | GET; Electrical GET; GET (EEE); GET; Management Trainee | Campus 2023; Campus ~2023; Hyderabad 2024; GET; Unknown | E | RF + RS | 5 | [EMAMI] [SE-MED] [SIE-HYD24] [HAV-GET] [HIT-MT] |
| EM27 | Classify induction motors; how do they differ from synchronous motors? | Induction vs synchronous | Emami | GET | Campus 2023 | M | RF | 1 | [EMAMI] |
| EM28 | How does a single-phase induction motor work? | Single-phase IM | ReNew | Not stated | Unknown | M | RS | 1 | [RENEW] |
| EM29 | Which motor is most widely used, and why? | Induction motor, applications | L&T | Electrical [diploma-level] | Other fresher 2020 | E | RF | 1 | [LT20] |
| EM30 | Why is a star-delta starter used / preferred for induction motors? | IM starting | ABB; Adani Electricity; unknown | Electrical GET; not stated; listing [company unknown] | Campus; Unknown | M | RS | 3 | [ABB-AB] [ADANI-EL] [GD-ELEC106]; prep [SCRIBD1] [PLCBLOG] |
| EM31 | How can harmonics in induction motors be reduced? | IM, power quality | ABB | Electrical GET | Campus | H | RS | 1 | [ABB-AB] |
| EM32 | What are the losses in an induction motor? | IM, losses | L&T Power | Trainee Electrical | 2017 [pre-2021] | E | RS | 1 | [LTP17] |
| EM33 | Why is the starting current of an induction motor high? | IM, inrush | none | none | none | M | PL | 1 prep | [UPES] |
| EM34 | Why does an induction motor never run at synchronous speed? (slip) | IM, slip | none | none | none | E | PL | 1 prep | [HITB] |
| EM35 | Why is a single-phase IM not self-starting, and how is it made self-starting? | Single-phase IM | none | none | none | M | PL | 2 prep | [IMBLOG] [FA-BHEL] |
| EM36 | Why is a 3-phase IM self-starting? Why not DOL for large motors? Speed-control methods | IM, starting / speed control | none | none | none | M | PL | 2 prep | [IMBLOG] [EVOLT-IM] |
| EM37 | What is the load torque at induction-motor start? | IM, torque | none | none | none | M | PL | 1 (unverified list) | [NTPC11] |
| EM38 | What is a synchronous generator / how does an alternator work? | Synchronous generator | Adani Power; Siemens Gamesa; Torrent | GET; early-career engineer; GET | GET; ~2022; Campus | M | RS | 2 + 1 unconfirmed | [ADANIP-GD] [SGAMESA] [TORRENT] |
| EM39 | Slip-ring vs cylindrical rotor (wording uncertain; likely salient vs cylindrical) | Rotor types | Siemens | GET (EEE) | Hyderabad Aug 2024 | M | RS | 1 | [SIE-HYD24] |
| EM40 | Questions on synchronous motors and the power system | Synchronous motor | Havells | Not stated | Unknown | M | RS | 1 (topic) | [HAV-SYNC] |
| EM41 | Difference between a generator and an alternator | Machines | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ] |
| EM42 | How is a generator started? | Generator start-up | NTPC | Executive Engineer [role unconfirmed] | Unknown | M | RS | 1 | [NTPC-GD] |
| EM43 | Why is a synchronous motor not self-starting (why does it need a prime mover)? | Synchronous motor | none | none | none | M | PL | 3 prep | [SKL-EM] [NTPC11] [EEEMAT] |
| EM44 | Alternator synchronisation conditions; V-curves; why alternators are rated in kVA | Synchronous machine | none | none | none | M | PL | 2 prep | [SKL-EM] [FA-BHEL] |
| EM45 | Load angle and its limit, armature reaction, SCR, AVR, synchronising to the grid | Synchronous machine | none | none | none | H | PL | 1 prep | [ECEXP] |
| EM46 | Difference between a generator and a motor | Machines | none | none | none | E | PL | 1 prep | [YP-BHEL] |
| EM47 | How is the speed of a DC series motor controlled? | DC motor, speed control | Siemens Energy | Electrical GET | Campus ~2023 | M | RS | 1 | [SE-MED]; prep (shunt) [FA-BHEL] |
| EM48 | Why is the starting current high in a DC motor? | DC motor, starting | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ] |
| EM49 | Why can't a DC series motor be started on no load? | DC series motor | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | M | RF | 1 | [BAJAJ] |
| EM50 | What types of DC motors are used in refineries? | DC motor, applications | L&T | Electrical [diploma-level] | Other fresher 2020 | M | RF | 1 | [LT20] |
| EM51 | Which motor has the highest starting torque? | DC series motor | none | none | none | E | PL | 1 prep | [SCRIBD2] |
| EM52 | DC motor braking methods; advantages of DC motors over AC | DC motor | none | none | none | M | PL | 1 prep | [FA-BHEL] |
| EM53 | Which motor is used for traction? Can an AC motor be used? | Traction motors | none | none | none | E | PL | 1 prep | [YP-POSOCO] |
| EM54 | What are servo motors and what are their parts? | Special motors | Havells | Not stated | Unknown | M | RS | 1 | [HAV-GD] |
| EM55 | Two motors of equal power run at different voltages: which draws less current? | Motor current, reasoning | Siemens Energy | Electrical GET | Campus ~2023 | M | RS | 1 | [SE-MED] |
| EM56 | How is machine maintenance done, and which parameters are checked? / motors and their maintenance | Machines, maintenance | L&T; Thermax | Electrical [diploma-level]; Electrical Engineer [role unconfirmed] | Other fresher 2020; Unknown | M | RF + RS | 2 (topic) | [LT20] [THX] |

### C2. Power Systems: generation, transmission, substations, protection and switchgear (59)

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| PS01 | How is electric power generated? | Generation | Torrent | Electrical GET | Campus | E | RS | 1 | [TORRENT] |
| PS02 | What types of power plants / modes of generation exist, and why is hydro not used more despite many water bodies? | Generation, plant types | Torrent; POWERGRID | GET; ET | Campus; PSU via GATE | M | RS | 2 | [TORRENT] [KREA] |
| PS03 | Differences between hydro and thermal power plants | Generation | POWERGRID | ET (Electrical) | PSU via GATE 2016 [pre-2021] | M | RF | 1 | [PGCIL16] |
| PS04 | Compare diesel and coal-based power plants | Generation | L&T | Electrical [diploma-level] | Other fresher 2020 | M | RF | 1 | [LT20] |
| PS05 | How is power generated for a refinery? | Captive generation | L&T | Electrical [diploma-level] | Other fresher 2020 | M | RF | 1 | [LT20] |
| PS06 | Power plants, new generation methods and electric vehicles (current trends) | Generation, renewables, EVs | Tata Power | GET | Campus 2022 [aggregator] | M | RF | 1 | [TATA-BI] |
| PS07 | Questions on renewable energy and energy production | Renewables | Schneider | Fresher | Campus, year not stated | M | RF | 1 | [SCH-GFG] |
| PS08 | Explain some sustainable products related to the smart grid | Smart grid | Schneider | Fresher | Campus, year not stated | M | RF | 1 | [SCH-GFG] |
| PS09 | Basic knowledge of gas turbines | Generation | GE Vernova | GET [India unconfirmed] | Unknown | M | RS | 1 | [GEV-GET] |
| PS10 | Why is power generated at multiples of 11 kV (11, 33 kV)? | Voltage levels | Havells | Not stated | Unknown | M | RS | 1 | [HAV-GD]; prep [NTPC11] |
| PS11 | Why is thermal plant efficiency only about 30-40%? | Generation, efficiency | none | none | none | M | PL | 1 prep | [EEEMAT] |
| PS12 | Load factor, demand factor, installed capacity, spinning reserve; which plants serve peak load and why? | Power-system economics | none | none | none | M | PL | 1 prep | [FA-BHEL] |
| PS13 | What are power factor and load factor? Why does power factor matter? | Power factor | POWERGRID; NTPC; IMEG; unknown | ET; Executive Engineer [role unconfirmed]; not stated [India unconfirmed]; graduate listing [company unknown] | PSU via GATE 2016; Unknown | E | RF + RS | 2 + 2 weak | [PGCIL16] [NTPC-GD] [IMEG] [GD-GRAD5]; prep [YP-BHEL] |
| PS14 | What are the components of a power system? | Power-system basics | Not visible | Graduate listing [company unknown] | Unknown | E | RS | 1 | [GD-GRAD5] |
| PS15 | Draw the single-line diagram of a power system, from generating station to consumers | SLD, G-T-D structure | Tata Power | GET | Campus pre-2020 and Nov 2023 (KIIT) [aggregator] | M | RF | 2 | [TATA-BI]; prep [YP-POSOCO] [FA-BHEL] |
| PS16 | Why interconnect power systems? Advantages | Grid | Tata Power | GET | Campus Nov 2023 | M | RF | 1 | [TATA-BI] |
| PS17 | Underground cables vs overhead lines, and their advantages | Cables vs lines | Tata Power | GET | Campus Nov 2023 | E | RF | 1 | [TATA-BI] |
| PS18 | What is corona (and how is it reduced)? | Transmission lines | POWERGRID; Tata Power | ET; GET | PSU via GATE 2016; Campus Nov 2023 | E | RF | 2 | [PGCIL16] [TATA-BI]; prep [FA-BHEL] [NTPC11] |
| PS19 | How do you deal with lightning surges on transmission lines? | Surge protection | POWERGRID | ET | PSU via GATE 2016 [pre-2021] | M | RF | 1 | [PGCIL16] |
| PS20 | What are T&D losses? | Losses | POWERGRID | ET | PSU via GATE 2016 [pre-2021] | M | RF | 1 | [PGCIL16] |
| PS21 | Explain skin effect in transmission and distribution | Transmission lines | L&T | GET | GET, year not given | M | RS | 1 | [LT-GD1]; prep [EEEMADE] [AQUA] |
| PS22 | What is the Ferranti effect? | Transmission lines | none | none | none | M | PL | 4 prep | [EPOST] [EEEMADE] [SANF] [YP-POSOCO] |
| PS23 | How much power can a transmission line carry? / surge impedance loading | Transmission capacity | Adani Power | Not stated | 2016 blog [pre-2021] | M | RS | 1 | [ADANI16]; prep [FA-BHEL] [YP-POSOCO] |
| PS24 | How would you determine what voltage a line passing near you carries? | Practical identification | Adani Power | GET | GET | M | RS | 1 | [ADANIP-GD] |
| PS25 | What is string efficiency of an insulator string? | Insulators | none | none | none | H | PL | 1 prep | [FA-BHEL] |
| PS26 | Advantages of HVDC over HVAC | HVDC | POWERGRID | ET | PSU via GATE | M | RS | 1 | [KREA] |
| PS27 | Which harmonics occur in HVDC systems, and how are they suppressed? | HVDC converters, filters | POWERGRID | ET | PSU via GATE 2016 [pre-2021] | H | RF | 1 | [PGCIL16] |
| PS28 | How can transient stability be improved? | Stability | POWERGRID | ET | PSU via GATE | M | RS | 1 | [KREA]; prep [FA-BHEL] |
| PS29 | Define zero-sequence components; which dominates, zero or negative sequence? | Symmetrical components, faults | Tata Power | GET | Campus Jan 2023 | H | RF | 1 | [TATA-BI] |
| PS30 | Which fault is most severe? | Faults | none | none | none | M | PL | 2 prep | [EEEGUIDE] [EPOST] |
| PS31 | Why are most parameters expressed in per unit? | Per-unit system | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | M | RF | 1 | [BAJAJ]; prep [UPES] [EEEGUIDE] |
| PS32 | How do you compensate voltage at a load centre? | Reactive power, voltage control | Tata Power | GET | Campus pre-2020 [pre-2021] | M | RF | 1 | [TATA-BI] |
| PS33 | Voltage at a tubewell is low: which method would you use to raise it? | Distribution, troubleshooting | Tata Power | GET | Campus pre-2020 [pre-2021] | H | RF | 1 | [TATA-BI] |
| PS34 | Give the full forms of power-sector abbreviations (e.g. "DSLP") | Sector terms | POWERGRID | ET | PSU via GATE 2016 [pre-2021] | E | RF | 1 | [PGCIL16] |
| PS35 | Questions on transmission and distribution of electricity (HT and LT) | T&D | BHEL | Electrical Engineer [role unconfirmed] | Unknown | M | RS | 1 (topic) | [BHEL-ABEE] |
| PS36 | What is a substation? Name its parts / equipment | Substations | Siemens Energy; Havells; POWERGRID | Electrical GET; GTE-Electrical; trainee | Campus ~2023; Dec 2024; PSU via GATE | E | RS | 2 + 1 topic | [SE-MED] [HAV-GD] [PG-AB] |
| PS37 | What are the types of substations? | Substations | Adani Power | Not stated | 2016 blog [pre-2021] | E | RS | 1 | [ADANI16] |
| PS38 | Explain substation earthing | Substations, earthing | Siemens Gamesa | Early-career engineer | ~2022 | M | RS | 1 | [SGAMESA] |
| PS39 | What are the battery requirements in a substation? | Substation DC system | Siemens Gamesa | Early-career engineer | ~2022 | H | RS | 1 | [SGAMESA] |
| PS40 | Outline how you would put together a physical substation design package | Substation design | GE Vernova | Engineer [role unconfirmed] [India unconfirmed] | Unknown | H | RS | 1 | [GEV-ENGR] |
| PS41 | Explain substation switching (busbar) schemes | Substations | none | none | none | M | PL | 1 prep | [FA-BHEL] |
| PS42 | Define a relay | Protection | ABB | Electrical GET | Campus 2021 | E | RS | 1 | [ABB-AB] |
| PS43 | What is switchgear, what is a relay, and how do they differ? | Switchgear vs relay | Schneider | Fresher | Campus | M | RF | 1 | [SCH-GFG] |
| PS44 | Difference between switchgear and a circuit breaker | Switchgear | Torrent; NTPC; BHEL | GET; electrical technician [non-fresher role]; Electrical Engineer [role unconfirmed] | Campus; Unknown | E | RS | 1 + 2 | [TORRENT] [NTPC-ABT] [BHEL-ABEE]; prep [AB-EE] [UPES] |
| PS45 | What are the types of circuit breakers? Explain one in detail | CB types | Schneider | Fresher | Campus | M | RF | 1 | [SCH-GFG]; prep [FP-ABB] |
| PS46 | How do you select and rate a circuit breaker? | CB ratings | Torrent | GET | Campus | M | RS | 1 | [TORRENT] |
| PS47 | How is an arc quenched in a circuit breaker? | Arc quenching | POWERGRID | ET | PSU via GATE | M | RS | 1 | [KREA] |
| PS48 | What are the characteristics of SF6 gas? | SF6 breakers | L&T | GET (Mumbai) | GET, year not given | M | RS | 1 | [LT-GD1] |
| PS49 | How does a circuit breaker protect against a short circuit? | CB operation | NTPC | Executive [role unconfirmed] | Unknown | E | RS | 1 | [NTPC-ABX] |
| PS50 | Name the parts of a relay and of a circuit breaker | Construction | Tata Power | GET | Campus 2023 | E | RF | 1 | [TATA-BI] |
| PS51 | Which protection devices are fitted on a transformer? / transformer protection | Transformer protection | Hitachi Energy; NTPC; Tata Steel | Electrical GET; Executive Engineer [role unconfirmed]; Electrical Engineer [role unconfirmed] | Campus; Unknown | M | RS | 1 + 2 | [HIT-AB] [NTPC-GD] [LTC-ABEE] |
| PS52 | What is a Buchholz relay? | Transformer protection | Siemens Energy | Electrical GET | Campus ~2023 | M | RS | 1 | [SE-MED]; prep [EEEGUIDE] |
| PS53 | Which gases are produced during internal faults in a transformer? | Buchholz / DGA | NTPC | Executive Engineer [role unconfirmed] | Unknown | H | RS | 1 | [NTPC-GD] |
| PS54 | Distance relays | Line protection | Siemens | GET / GTE | India 2022-2024 (page not isolated) | M | RS | 1 | [SIE-CHN22] |
| PS55 | Explain relay types: overcurrent, earth-fault, differential | Relays | none | none | none | M | PL | 1 prep | [UPES] |
| PS56 | How do you protect a feeder? Relay coordination | Protection schemes | none | none | none | H | PL | 1 prep | [IQA-ABB] |
| PS57 | Which IEC standard is used for panel / switchgear selection? | Standards | Torrent | GET | Campus | M | RS | 1 | [TORRENT] |
| PS58 | Circuit breaker vs isolator vs fuse | Switchgear | none | none | none | E | PL | 2 prep | [EEEGUIDE] [EPOST] |
| PS59 | Questions on circuit breakers, relays, faults and lightning arresters | Protection | BHEL | Role unclear [role unconfirmed] | Unknown | M | RS | 1 (topic) | [BHEL-AB] |

### C3. Power Electronics (12)

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| PE01 | What is a power semiconductor device? | Devices | GE | Post-Graduate Engineering Trainee | Warangal, Oct 2020 | E | RS | 1 | [GE-PGET] |
| PE02 | Draw the reverse-voltage (reverse-blocking) circuit of a power device | Thyristor / diode blocking | Hind Rectifiers | GET | Unknown | M | RS | 1 | [HINDR2] |
| PE03 | Explain 12-pulse converters | HVDC converters | POWERGRID | ET | PSU via GATE 2016 [pre-2021] | H | RF | 1 | [PGCIL16] |
| PE04 | What is a VFD, and draw its basic circuit | Drives | Thermax | E&I Engineer [role unconfirmed] | 2010 [pre-2021] | M | RS | 1 | [THX] |
| PE05 | Questions on rectifiers (with capacitance, inductance, transformers, relays) | Rectifiers | Schneider | GET | India 2021-2024 | E | RS | 1 (topic) | [SCH-GET44] |
| PE06 | Basics of solar LEDs, IGBTs and semiconductor physics | Devices | Havells | Electronics roles | Unknown | M | RS | 1 | [HAV-GD] |
| PE07 | Analyse a DC-DC converter (voltage across the switch, ratings); machine braking | Converters | Bosch | EV-team intern [non-fresher role] | Unknown | H | RS | 1 | [BOSCH-INT] |
| PE08 | Questions on inverters, diodes, DC motors and transformer windings | Converters, machines | GE Vernova | Engineer / GET [India unconfirmed] | Unknown | M | RS | 1 (topic) | [GEV-ENG] |
| PE09 | What is PWM and why is it used? | PWM | none | none | none | E | PL | 1 prep | [UPES] |
| PE10 | Difference between MOSFET and IGBT | Devices | none | none | none | M | PL | 1 prep | [UPES] |
| PE11 | Power diode vs signal diode | Devices | none | none | none | E | PL | 1 prep | [SKL-PE] |
| PE12 | VFD vs soft starter; VFD rectifier-inverter structure; braking; harmonics | Drives | none | none | none | M | PL | 1 prep | [EC-VFD] |

### C4. Measurements and Instrumentation (11)

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| MI01 | Why is the CT secondary kept shorted (never left open)? | CT safety | Not visible [company unknown] | Not visible | Unknown | M | RS | 1 + 2 prep | [AB-CT]; prep [BYJUS] [TECHIQ] |
| MI02 | What is the role of CT and PT in a switchgear panel? | CT/PT | Not stated | EE listing [company unknown] [role unconfirmed] | Unknown | E | RS | 1 | [GD-EE60] |
| MI03 | Difference between a CT and a PT | CT/PT | none | none | none | E | PL | 1 prep | [UPES] |
| MI04 | What is a megger and why is it used? | Insulation testing | L&T | Electrical [diploma-level] | Other fresher 2020 | E | RF | 1 | [LT20] |
| MI05 | What is insulation resistance, and what value should it have? | Insulation testing | L&T | Electrical [diploma-level] | Other fresher 2020 | M | RF | 1 | [LT20]; prep [UPES] |
| MI06 | How does an electromagnetic flow meter work? | Instrumentation | Torrent | GET | Campus | M | RS | 1 | [TORRENT] |
| MI07 | Questions on energy metering | Metering | Torrent | GET | Campus | E | RS | 1 (topic) | [TORRENT] |
| MI08 | Which electrical testing equipment and tools do you know, and how are they used and maintained safely? | Test equipment | Tata Power | GET | Campus 2020 [pre-2021] | E | RF | 1 | [TATA-BI] |
| MI09 | How are HT and LT panels tested? | Panel testing | BHEL | Not stated [role unconfirmed] | Unknown | M | RS | 1 | [BHEL-AB] |
| MI10 | What instruments have you used in labs? | Instruments | none | none | none | E | PL | 1 prep | [UPES] |
| MI11 | Meters and transducers (types and use) | Instruments | none | none | none | E | PL | 1 prep | [YP-BHEL] |

### C5. Control Systems (5)

No first-hand fresher report of a transfer-function, stability, block-diagram or PID question was found in any research pass; the three reported items are definitional, and one comes from an ECE candidate.

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| CS01 | What is a control system? Give daily-life examples | Basics | Adani Group | GET [ECE candidate] | Campus Dec 2022 | E | RF | 1 | [ADANI-GFG] |
| CS02 | Explain the basic control system of an air conditioner | Applications | Adani Group | GET [ECE candidate] | Campus Dec 2022 | M | RF | 1 | [ADANI-GFG] |
| CS03 | What are the types of control systems? | Basics | Schneider | GET | Surat, Nov 2021 | E | RS | 1 | [SCH-SUR21] |
| CS04 | What is PID control and where is it used? (P vs PI vs PID) | Controllers | none | none | none | M | PL | 3 prep | [UPES] [FA-BHEL] [YP-BHEL] |
| CS05 | Explain the root locus | Stability | none | none | none | M | PL | 1 prep | [YP-BHEL] |

### C6. Network Theory and AC circuits (14)

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| NT01 | Ohm's law and its practical applications | Basics | Tata Power; Schneider | GET; GET | Campus 2024 [aggregator]; India | E | RF + RS | 2 | [TATA-BI] [SCH-GET44] |
| NT02 | Kirchhoff's laws, then a power-distribution problem | Basics | Tata Power | GET | Campus 2024 [aggregator] | E | RF | 1 | [TATA-BI] |
| NT03 | Explain Thevenin's theorem in one sentence | Theorems | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ] |
| NT04 | Difference between direct and alternating current | AC/DC | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ]; prep [YP-BHEL] |
| NT05 | Why do we use a 3-phase supply, and why not 4 or more phases? | Three-phase | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | M | RF | 1 | [BAJAJ] |
| NT06 | Single-phase vs three-phase systems | Three-phase | none | none | none | E | PL | 1 prep | [YP-BHEL] |
| NT07 | Difference between star and delta connection | Three-phase | none | none | none | E | PL | 2 prep | [UPES] [HIT-INDEED] |
| NT08 | How do you convert between network types (star-delta conversion)? | Network transformation | Schneider | GET | Surat, Nov 2021 | M | RS | 1 | [SCH-SUR21] |
| NT09 | Draw phasor diagrams of AC and DC voltage and current, including leading and lagging cases | Phasors, PF | Siemens Energy | GET | Haryana, 2025 | M | RS | 1 | [SE-GD2] |
| NT10 | Real power vs reactive power | AC power | Siemens | GET (EEE) | Hyderabad, Aug 2024 | E | RS | 1 | [SIE-HYD24] |
| NT11 | Draw an RC circuit's output waveform / plot Vc and Ic after a switch closes at t0 | Transients | Texas Instruments; unknown | Intern; fresher listing [company unknown] | Campus (IIT Guwahati); Unknown | M | RF + RS | 2 | [TI-GFG] [GD-FRESH457] |
| NT12 | Questions on capacitance and inductance | Components | Schneider | GET | India 2021-2024 | E | RS | 1 (topic) | [SCH-GET44] |
| NT13 | What is the frequency of electricity in India (and why 50 Hz)? | Supply basics | TRL Krosaki | Not stated | Unknown | E | RS | 1 | [AB-FREQ]; prep [NITK50] |
| NT14 | Why does India use an AC system and not DC? | Supply basics | none | none | none | E | PL | 1 prep [pre-2021] | [EW4U] |

### C7. Basic Electronics, digital and semiconductor (31)

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| BE01 | Define a capacitor and a resistor | Components | ABB | Electrical GET | Campus 2021 | E | RS | 1 | [ABB-AB]; prep [TPOINT] |
| BE02 | Explain resistor colour coding | Components | ABB | Electrical GET | Campus 2021 | E | RS | 1 | [ABB-AB] |
| BE03 | What is a PCB? | Components | ABB | Electrical GET | Campus 2021 | E | RS | 1 | [ABB-AB] |
| BE04 | How does a capacitor work in electrical appliances? | Components | Not stated | Assistant Electrical Engineer [company unknown] | Unknown | E | RS | 1 | [GD-AEE] |
| BE05 | Microcontroller vs microprocessor | Microcontrollers | Schneider | GET | India | E | RS | 1 (topic 3) | [SCH-GET44]; prep [FA-BHEL] |
| BE06 | Microcontroller specs (8051, ESP32), basic digital and analog circuit design | Microcontrollers | Schneider | GET | India | M | RS | 1 | [SCH-RVW] |
| BE07 | Flip-flops and counters | Sequential logic | Schneider | GET | Bangalore, Aug 2024 | M | RS | 1 | [SCH-BLR24] |
| BE08 | What are ADC and DAC conversion? | Data converters | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ] |
| BE09 | XOR truth table; CMOS circuits | Logic gates | Not stated | Fresher listing [company unknown] | Unknown | E | RS | 1 | [GD-FRESH12] |
| BE10 | Explain diode characteristics and plot the graph | Diodes | Bosch | GET | Unknown | M | RS | 1 | [BOSCH-GET] |
| BE11 | Ideal vs practical diode | Diodes | none | none | none | E | PL | 1 prep | [UPES] |
| BE12 | Modulation; sampling theorem and Nyquist frequency | Communication (non-core) | Bosch | GET | Unknown | M | RS | 1 | [BOSCH-GET] |
| BE13 | Build Ex-OR from NAND gates; what is the race-around condition? | Digital | none | none | none | M | PL | 1 prep | [FA-BHEL] |
| BE14 | Draw basic logic gates; build a half adder without an EXOR gate | Digital | none | none | none | M | PL | 1 prep | [FP-BOSCH] |
| BE15 | Explain the working and I-V characteristics of a MOSFET | MOSFET | Texas Instruments; Micron | Not stated | Kolkata 2020; Unknown | M | RS | 3 | [TI-GD20] [MIC-GD2] [MIC-GD3] |
| BE16 | Sketch an N-channel MOSFET | MOSFET structure | Micron | Not stated | Unknown [possibly pre-2021] | E | RS | 1 | [MIC-GD1] |
| BE17 | MOSFET short-channel effects, reliability, LDD, GIDL | Device physics | Micron | Not stated | Unknown | H | RS | 1 | [MIC-GD2] [MIC-GD3] |
| BE18 | Build a divide-by-2 frequency divider; now divide-by-3 | Sequential design | Micron | Semiconductor Engineer | Campus (IIT Guwahati) | H | RF | 1 | [MIC-GFG] |
| BE19 | Two inverters in series: what is the circuit's frequency, and how would you increase its period? | CMOS delay | Micron | Semiconductor Engineer | Campus | H | RF | 1 | [MIC-GFG] |
| BE20 | Handling memory bit flips (project); what affects processor frequency; cycles per instruction | Architecture | Micron | Semiconductor Engineer | Campus | H | RF | 1 | [MIC-GFG] |
| BE21 | What is the most basic sequential circuit element? | Latches | Texas Instruments | Digital intern | Campus | E | RF | 1 | [TI-GFG] |
| BE22 | D-latch with enable vs D flip-flop with clock held at 1: what are the outputs? | Latches vs flip-flops | Texas Instruments | Digital intern | Campus | M | RF | 1 | [TI-GFG] |
| BE23 | Combinational vs sequential circuits | Digital | Texas Instruments | Digital intern | Campus | E | RF | 1 | [TI-GFG] |
| BE24 | A NAND gate's output is fed back to one input: how does the output behave? | Feedback, oscillation | Texas Instruments | Digital intern | Campus | H | RF | 1 | [TI-GFG] |
| BE25 | Build a 3-input NAND using only 2:1 multiplexers | Mux logic | Texas Instruments | Digital intern | Campus | H | RF | 1 | [TI-GFG] |
| BE26 | CMOS inverter: structure, effect of input changes, gate capacitance | CMOS | Texas Instruments | Digital intern | Campus | M | RF | 1 (topic 3) | [TI-GFG] |
| BE27 | Given input and output waveforms, draw the circuit | Circuit analysis | Texas Instruments | Not stated | Unknown | H | RS | 1 | [TI-GD20] |
| BE28 | RC circuits, MOS capacitor, current mirrors | Analog | NXP | Analog design engineer [role unconfirmed] | ~2015 [pre-2021] | M | RS | 1 | [NXP] |
| BE29 | Op-amp frequency response and compensation | Analog design | Analog Devices | Analog design engineer [role unconfirmed] | Unknown | H | RS | 1 | [ADI] |
| BE30 | MOSFET saturation region, switching characteristics; draw a MOSFET inverter | MOSFET | none | none | none | M | PL | 1 prep | [FP-TI] |
| BE31 | Op-amp gain-bandwidth, slew rate, offset, CMRR | Op-amps | none | none | none | M | PL | 1 prep | [IND-ANALOG] |

### C8. Electrical Safety and Industrial knowledge (23)

| ID | Question | Subtopic | Company | Role | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|---|---|
| SI01 | What are MCB, MCCB and ELCB, and how do MCB and MCCB differ? | LV protective devices | Schneider (x2 entries); unknown; Tata Power | R&D testing; electrical engineer; not visible [company unknown]; GET | Unknown; Campus Nov 2023 | E | RF + RS | 3-4 | [SCH-EE] [SCH-GET51] [AB-MCB] [TATA-BI]; prep [UPES] |
| SI02 | How does an MCB work, and how does it differ from a fuse? | MCB vs fuse | Havells | Not stated | Unknown | M | RS | 1 | [HAV-GD]; prep [UPES] |
| SI03 | Difference between an ELCB and an RCD | Earth-leakage protection | Schneider | Electrical engineer | Unknown | M | RS | 1 | [SCH-GET51] |
| SI04 | Single-pole vs double-pole circuit breaker | LV breakers | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ] |
| SI05 | Why is earthing necessary for all electrical equipment? | Earthing | Not visible | Electrical Engineer profile [company unknown] | Unknown | E | RS | 1 | [AB-EE] |
| SI06 | What are the types of earthing? (body vs neutral earthing) | Earthing | Hitachi Energy | Electrical GET | Campus | M | RS | 1 | [HIT-AB]; prep [TECHIQ] |
| SI07 | What is an earth pit, and what resistance should it have? | Earthing | L&T | Electrical [diploma-level] | Other fresher 2020 | M | RF | 1 | [LT20] |
| SI08 | How is earth resistance measured; which instrument, what value? | Earth testing | L&T; unknown | Electrical [diploma-level]; electrician [non-fresher role] | Other fresher 2020; Unknown | M | RF + RS | 2 | [LT20] [AB-ELEC] |
| SI09 | What is an earth grid? | Substation earthing | L&T | Electrical [diploma-level] | Other fresher 2020 | E | RF | 1 | [LT20] |
| SI10 | Difference between earthing and grounding | Earthing | none | none | none | E | PL | 1 prep | [UPES] |
| SI11 | What are step and touch potential? | Earthing safety | none | none | none | M | PL | 2 prep | [FA-BHEL] [QUORA-PSU] |
| SI12 | How do you ensure safety in electrical installations / at a site? | Safety practice | Havells | Not stated | Unknown | M | RS | 1 | [HAV-GD]; prep [UPES] |
| SI13 | Types of electrical hazards; personal protective equipment for electrical work | Safety | none | none | none | E | PL | 1 prep | [YP-BHEL] |
| SI14 | On what principle does an electric iron work? | Appliances, Joule heating | Havells | Not stated | Unknown | E | RS | 1 | [HAV-GD] |
| SI15 | How does a tube light operate? | Lighting | Bajaj Electricals | Junior Engineer | Other fresher 2019 [pre-2021] | E | RF | 1 | [BAJAJ] |
| SI16 | How would you reduce the company's power-consumption cost? | Energy efficiency, PF, tariffs | L&T | Electrical [diploma-level] | Other fresher 2020 | H | RF | 1 | [LT20] |
| SI17 | Why does power factor matter in industry? Cable current-carrying capacity | Industrial PF, cables | Havells (user-submitted list, status unclear) | none | none | M | PL | 1 | [HAV-AI] |
| SI18 | How do you select a cable for an application (load current, voltage drop, derating)? | Cable sizing | none | none | none | H | PL | 1 prep | [UPES] |
| SI19 | XLPE (90 C) vs PVC (70 C) cables, armouring, IS 7098 | Cables | none | none | none | M | PL | 1 prep | [EVOLT-CAB] |
| SI20 | How do you handle repeated tripping of an MCB or relay? How do you troubleshoot a circuit that is not working? | Troubleshooting | none | none | none | H | PL | 1 prep | [UPES] |
| SI21 | What is your approach to preventive maintenance? | Maintenance | none | none | none | M | PL | 1 prep | [UPES] |
| SI22 | PLC parts, PLC languages (ladder, FBD, ST, IL, SFC), scan cycle, sinking vs sourcing | Automation | none | none | none | M | PL | 2 prep | [AF-PLC] [PLCBLOG] |
| SI23 | Fundamentals of electrical circuit design | Design | Thermax | E&I Engineer [role unconfirmed] | 2010 [pre-2021] | M | RS | 1 | [THX] |

---

## D. Practical and application questions are where reported evidence is richest

Reported questions skew practical: interviewers want to know whether a graduate can reason about equipment on a site, not only recite theory. The fully read L&T 2020 drive is almost entirely practical (maintenance, megger, insulation resistance, earth pits and grids, cost reduction, refinery power) ([GfG L&T 2020](https://www.geeksforgeeks.org/?p=700115)), and Tata Power's two hardest reported items are field problems: raising voltage at a remote tubewell and compensating voltage at a load centre ([BoardInfinity Tata Power](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)). The practical cluster below is drawn from the bank (no duplicates are re-listed; see Section C for full fields).

| Cluster | Reported items (ID, label) | Preparation-list items |
|---|---|---|
| Field troubleshooting | PS33 low tubewell voltage (RF), PS32 voltage compensation (RF), PS24 identify a nearby line's voltage (RS), SI16 reduce power cost (RF) | SI20 repeated MCB/relay tripping (PL) |
| Testing and maintenance | MI04 megger (RF), MI05 insulation resistance value (RF), EM56 maintenance parameters (RF + RS), EM15 transformer maintenance (RS), MI09 HT/LT panel testing (RS), MI08 test equipment and safety (RF) | SI21 preventive maintenance (PL) |
| Earthing | SI07 earth pit (RF), SI08 earth resistance measurement (RF + RS), SI09 earth grid (RF), SI06 earthing types (RS), SI05 why earth (RS), PS38 substation earthing (RS) | SI10 earthing vs grounding, SI11 step and touch potential (PL) |
| CT/PT and metering | MI01 CT secondary shorted (RS), MI02 CT/PT in a panel (RS), MI07 metering (RS), MI06 electromagnetic flow meter (RS) | MI03 CT vs PT (PL) |
| Switchgear selection | PS46 CB selection and rating (RS), PS57 IEC standard (RS), SI01 MCB/MCCB/ELCB (RF + RS), SI02 MCB vs fuse (RS), SI03 ELCB vs RCD (RS), PS48 SF6 (RS) | SI18-SI19 cable selection and types (PL) |
| Plant and site knowledge | PS05 refinery power (RF), EM50 DC motors in refineries (RF), PS39 substation batteries (RS), PS40 substation design package (RS, role unconfirmed), SI14 electric iron (RS), SI15 tube light (RF, 2019) | SI22 PLC basics, PE12 VFD vs soft starter (PL) |

Two practical items deserve special mention. **"Why is the CT secondary shorted?"** is the most consistently recurring practical question across reported and preparation sources (one AmbitionBox interview entry, plus PSU-prep lists), even though only one source reports it as asked ([AmbitionBox CT question](https://www.ambitionbox.com/interviews/question/why-is-the-ct-secondary-site-shorted-eM2yAyPf); [BYJU'S Exam Prep](https://byjusexamprep.com/electrical-interview-questions-i)). And **no verified source gives an acceptable earth-resistance value**; the AmbitionBox answer that might have was blocked, so a fresher should explain how the value depends on the installation rather than quote a single number from memory.

---

## E. Follow-ups: a handful of chains are reported, most are inferred

Only a few follow-up sequences appear in first-hand accounts; the recurring-questions pass found **no recorded follow-up chain for machines or power-systems questions** in what it could read ([GfG Emami](https://www.geeksforgeeks.org/?p=1074649) lists five questions with none). The reported pairs below come from accounts that list a first question and a second that builds on it; the inferred chains are textbook-logical and are labelled as such.

### E1. Follow-up pairs that appear in reported accounts

| Chain | Company | Label | Source |
|---|---|---|---|
| Which harmonics occur in HVDC (PS27) → how do you suppress them? | POWERGRID 2016 | RF [pre-2021] | [PGCIL16] |
| Define zero-sequence components (PS29) → which dominates, zero or negative sequence? | Tata Power 2023 | RF | [TATA-BI] |
| Transformer working principle → sketch flux lines and secondary current (EM02) | NTPC 2016 | RS [ECE candidate] | [NTPC16] |
| Types of circuit breakers → explain one in detail (PS45) | Schneider | RF | [SCH-GFG] |
| Divide-by-2 divider → now divide-by-3; inverter chain frequency → how to increase the period (BE18, BE19) | Micron | RF | [MIC-GFG] |
| What is a control system → daily-life examples → control system of an AC (CS01, CS02) | Adani Group | RF [ECE candidate] | [ADANI-GFG] |
| Modes of generation → why is hydro not used more? (PS02) | POWERGRID | RS | [KREA] |
| How an MCB works → how it differs from a fuse (SI02) | Havells | RS | [HAV-GD] |
| Maintenance → parameters checked → insulation resistance value → megger; earth pit → resistance → measurement → earth grid (asked in this order in one interview; whether as deliberate follow-ups is not stated) | L&T 2020 | RF [diploma-level] | [LT20] |

### E2. Inferred and preparation follow-ups (new questions, not reported)

| ID | Opening question | Follow-up | Label | Source |
|---|---|---|---|---|
| FU01 | Why is a transformer rated in kVA? (EM06) | Then why are motors rated in kW? (transformer PF depends on the load; motor PF on its construction) | PL (paired in Q&A pages) | [C360-KVA] [EEEMADE] |
| FU02 | Why kVA? | Because losses depend on voltage and current, not power factor | Inferred | research-note inference |
| FU03 | Why a star-delta starter? (EM30) | What is the disadvantage? (starting torque falls, torque proportional to V squared) Why not DOL for large motors? | PL | [EVOLT-IM] |
| FU04 | How does a single-phase IM work? (EM28) | Why is it not self-starting, and how is it made self-starting? (auxiliary winding) | PL | [IMBLOG] |
| FU05 | What happens when a transformer is energised? (EM08) | What is inrush current and why does it occur? | Inferred | research-note inference from [TATA-GD5] |
| FU06 | What is a power semiconductor device? (PE01) | SCR vs MOSFET vs IGBT, and where each is used | Inferred | research-note inference from [GE-PGET] |
| FU07 | Flip-flops (BE07) | JK race-around condition, then counters | Inferred | research-note inference from [SCH-BLR24] |
| FU08 | Role of CT and PT (MI02) → why the CT secondary is shorted (MI01) | Why is a fuse used on a PT but not on a CT? | Inferred (no source confirmed the claim; treat as a gap) | research-note inference |
| FU09 | Why is the CT secondary shorted? | What must you do before removing a meter from a live CT circuit? (short the secondary) | Inferred | research-note inference from [AB-CT] |
| FU10 | MCB / MCCB / ELCB (SI01) | Which protects against earth leakage and which against overcurrent? What is a typical RCCB sensitivity (30 mA)? | Inferred | research-note inference from [AB-MCB] |
| FU11 | Why is earthing necessary? (SI05) | What earth-resistance value is acceptable, and which instrument measures it? | Inferred (partly reported as SI08) | [AB-ELEC] |
| FU12 | What is neutral earthing for? (SI06) | How is earth-fault current sensed and cleared? (flows through the neutral, sensed by a CT and relay) | PL | [TECHIQ] |
| FU13 | What is corona? (PS18) | How is corona reduced? | PL | [FA-BHEL] |
| FU14 | Synchronous speed and slip (NUM03) | Why can the rotor never reach synchronous speed? | Inferred | research-note inference |
| FU15 | Turns ratio (NUM02) | Why does the HV side use thinner wire? (current ratio is inverse) | Inferred | research-note inference |
| FU16 | Power-factor correction (NUM05) | What happens if you over-correct? | Inferred | research-note inference |
| FU17 | RC time constant (NUM08) | What is the capacitor voltage after 1 tau (about 63%) and after 5 tau (essentially fully charged)? | Inferred | research-note inference |

---

## F. Numericals: none reported with values, so every item here is preparation

**No source in any research pass reported a specific numerical, with values, being asked in an Indian electrical fresher interview.** Searches for turns-ratio, synchronous-speed and slip interview numericals returned only GATE banks and formula references, for example an ExamSide GATE induction-motor problem that is an exam question, not an interview one ([ExamSide GATE EE](https://questions-next.examside.com/past-years/gate/question/pa-three-phase-415-v-50-hz-6-pole-960-rpm-4-hp-squirre-gate-ee-electromagnetic-fields-electrostatics-rwkxbyz1mo7oeeaz)). The closest reported items have no values: a "power-distribution problem" after Ohm's law and KCL at Tata Power 2024 (NT02, RF), "one numerical on basic electrical engineering" with no content for a Thermax quality-engineer role ([Glassdoor Thermax](https://www.glassdoor.sg/Interview/Thermax-Interview-Questions-E142281.htm), RS), the equal-power-motors current comparison at Siemens Energy (EM55, RS), the RC waveform at TI (NT11, RF) and DC-DC converter analysis for a Bosch EV intern (PE07, RS). Reported interviews ask the **concept behind the formula** (why kVA, why per unit, why high starting current), not the arithmetic. Every item below is therefore labelled **PL-N**. Values are given only where a source supplied them; the rest are templates built on sourced formulas.

| ID | Interview-style numerical | Subject | Diff | Label | Source |
|---|---|---|---|---|---|
| NUM01 | Fault level of a transformer: a 500 kVA, 10% impedance unit gives 5000 kVA of fault level, about 7 kA at 0.4 kV. Show the working | Machines / power systems | H | PL-N | [EVOLT-TX3] |
| NUM02 | Given primary and secondary voltages (or turns), find the turns ratio and the secondary current (V1/V2 = N1/N2 = I2/I1) | Transformer | H | PL-N | [SKL-EM] |
| NUM03 | Given poles and frequency, find synchronous speed; given rotor speed, find slip (Ns = 120f/P; s = (Ns - N)/Ns) | Induction motor | H | PL-N | [SKL-EM] [JNTUA] |
| NUM04 | Convert an impedance to per unit on a new base | Power systems | H | PL-N | concept from [UPES]; template |
| NUM05 | Size a capacitor to correct power factor from one value to another | Power systems / industrial | H | PL-N | concept from [UPES]; template |
| NUM06 | Convert a star of resistances to its delta equivalent (and back) | Network theory | H | PL-N | concept reported at Schneider [SCH-SUR21]; template |
| NUM07 | Find the resonant frequency of an LC circuit (f = 1 / (2 pi root(LC))) | Network theory | H | PL-N | research-note formula list; template |
| NUM08 | Find the RC time constant and the capacitor voltage after 1 tau and 5 tau | Network theory | H | PL-N | concept reported at TI [TI-GFG]; template |
| NUM09 | What MCB rating is needed for a 1/2 kVA power backup? | Switchgear sizing | H | PL-N (user-submitted list, status unclear) | [HAV-AI] |
| NUM10 | Size an HT XLPE cable for an 11 kV transformer system | Cables | H | PL-N (user-submitted list, status unclear) | [POLY-AI] |
| NUM11 | Calculate the string efficiency of a suspension insulator string | Power systems | H | PL-N | [FA-BHEL] |
| NUM12 | Find the load at which a transformer's efficiency is maximum (copper loss = iron loss) | Transformer | H | PL-N | [ECLASS-TX] |
| NUM13 | Two motors of equal power at different voltages: compute and compare their line currents (I = P / (root3 x V x pf x efficiency)) | Machines | H | PL-N (concept reported as EM55) | [SE-MED] |

---

## G. HR and basic-electrical openers: the most predictable part of the interview

The HR core is consistent across sources: introduce yourself (often with family background), why this company and what you know about it, relocation and site work, higher studies, strengths and weaknesses, and the project. **Relocation** is asked explicitly at Adani, Adani Power, L&T, ABB and Schneider ([GfG Adani GET](https://www.geeksforgeeks.org/?p=1047365); [WireUnwired L&T](https://wireunwired.com/lt-get-interview-experience-2024/)). No first-hand report of **"Why core and not IT?"** was found; its nearest reported relatives are "Why did you choose Electrical Engineering?" (L&T, GE Vernova) and an L&T HR question on why the candidate had not built coding habits for IT companies ([WireUnwired L&T](https://wireunwired.com/lt-get-interview-experience-2024/)). PSU bond questions appear only in compiled sources.

### G1. HR and project questions

| ID | Question | Company | Type | Diff | Label | Freq | Sources |
|---|---|---|---|---|---|---|---|
| HR01 | Tell me about yourself / introduce yourself | Tata Power (2023, 2024); L&T Power; Polycab; NTPC | Campus; GET; PSU | E | RF + RS | 5+ | [TATA-BI] [LTP25] [POLY-AB] [QUORA-NTPC] |
| HR02 | Tell us about your family background | Adani Group; Tata Power; Schneider | Campus | E | RF | 3 | [ADANI-GFG] [TATA-BI] [SCH-GFG] |
| HR03 | Why do you want to join this company? (incl. "Why PGCIL?", "why the Power+ programme?") | Adani; Tata Power; L&T; BHEL; Schneider; POWERGRID; Hitachi Energy | Campus; GET; PSU | E | RF + RS | 7 | [ADANI-GFG] [TATA-BI] [LT-GD2] [BHEL-AB] [SCH-GET44] [KREA] [HIT-GET] |
| HR04 | What do you know about our businesses? Name our subsidiaries / projects | Adani Group; L&T | Campus; GET | M | RF + RS | 2 | [ADANI-GFG] [LTC-AB] |
| HR05 | Any issue with relocation or posting (anywhere in India, including J&K)? | Adani; Adani Power; L&T (x2); ABB; Schneider | Campus; GET | E | RF + RS | 6 | [ADANI-GFG] [ADANIP-GD] [LT-GD2] [LT24] [ABB-AB] [SCH-GFG] |
| HR06 | Do you prefer office-based or site-based work? | L&T | GET | E | RS | 1 | [LT-GD2] |
| HR07 | Will you pursue higher studies? Future plans | Tata Power; L&T | Campus; GET | E | RF + RS | 2 | [TATA-BI] [LT-GD2] |
| HR08 | What are your strengths and weaknesses? | Tata Power; BHEL; Schneider; GE Vernova | Campus; PSU; GET | E | RF + RS | 4 | [TATA-BI] [BHEL-AB] [SCH-GET44] [GEV-GET] |
| HR09 | What qualities make you fit for this position / why should we hire you? | Adani Group; Schneider | Campus | E | RF | 2 | [ADANI-GFG] [SCH-GFG] |
| HR10 | Which engineering division / department would you like to work in? | Adani Group; Havells | Campus; GET | E | RF + RS | 2 | [ADANI-GFG] [HAV-GD] |
| HR11 | What are your career interests / goals / five-year plan? | Adani Group; Schneider; Havells | Campus; GET | E | RF + RS | 3 | [ADANI-GFG] [SCH-GET44] [HAV-GD] |
| HR12 | Explain your journey to becoming an engineer | Tata Power | Campus pre-2020 | E | RF | 1 | [TATA-BI] |
| HR13 | Why did you choose Electrical Engineering? | L&T; GE Vernova | GET | E | RS | 2 | [LT-GD2] [GEV-GET] |
| HR14 | How do you handle teamwork and conflict? A project delay? Conflict with a manager? Failures? | Tata Power; GE Vernova | Campus 2024; GET | E | RF + RS | 2 | [TATA-BI] [GEV-GET] |
| HR15 | Describe a time you took the lead on a problem | Hitachi Energy | GET 2024 | E | RS | 1 | [HIT-GET] |
| HR16 | Background, schooling, education and gap years | POWERGRID; NTPC Korba | PSU 2016; 2022 (not ET) | E | RF + RS | 2 | [PGCIL16] [NTPC-GDHK] |
| HR17 | Discuss your GATE score | POWERGRID | PSU via GATE | E | RS | 1 | [PG-AB] |
| HR18 | Are you up for a challenging job? | Tata Power | Campus 2023 | E | RF | 1 | [TATA-BI] |
| HR19 | Why have you not built coding habits for IT companies? | L&T ECC | Campus 2024 | M | RF | 1 | [LT24] |
| HR20 | Explain your final-year project / internship / training; what did you learn? (drilled into one project, often with diagrams) | Tata Power; Adani Group; Adani Power; Torrent; NHPC; POWERGRID; L&T; L&T Power; Siemens Energy; Schneider; GE Vernova; Micron | All types | M | RF + RS | 10+ | [TATA-BI] [ADANI-GFG] [ADANIP-GD] [TORRENT] [NHPC] [PGCIL16] [LT24] [LTP25] [SE-GD2] [SCH-GET44] [GEV-GET] [MIC-GFG] |
| HR21 | Extempore: speak for 2 minutes on a topic after 30 seconds' preparation | L&T ECC; L&T Power | Campus 2024; 2025 | M | RF + RS | 2 | [LT24] [LTP25] |
| HR22 | Why core and not IT? | none reported | none | E | PL (discussed only for the reverse case) | 0 reported | [PREPINSTA] |
| HR23 | Products of BHEL; role of an electrical engineer at BHEL; history, mission, recent projects; how can you contribute? How do you handle pressure? | BHEL (coaching list) | PSU ET | M | PL | 1 prep | [YP-BHEL] |
| HR24 | How does POSOCO work? Power regulators in India? Electricity Act 2003? What fuel does NEEPCO use? | POSOCO (page calls them "actual", but names no candidate) | PSU | M | PL | 1 prep | [YP-POSOCO] |
| HR25 | Company profile, recent news in your state, notable personalities from your town | POWERGRID (coaching advice) | PSU via GATE | M | PL | 1 prep | [YP-PGCIL] |
| HR26 | Bond, location and background (HR / document verification) | NTPC (low-reliability page) | PSU | E | PL | 1 prep | [PP-NTPC] |

On the bond itself, a recruitment guide states NTPC ET selectees sign a Rs 5,00,000 bond for at least 3 years (Rs 2,50,000 for SC/ST/PwBD), but this is a third-party summary of a 2026 notification, not the official notice ([centralstatejobs](https://centralstatejobs.in/jobs/ntpc-engineering-executive-trainee-recruitment-2026)).

### G2. Basic-electrical openers

The reported openers are a little more applied than "what is electricity?" (which no first-hand source reports): **Ohm's law and KCL (NT01, NT02), drawing the power system from generation to consumers (PS15), transformer working (EM01), switchgear vs circuit breaker (PS44), the frequency of supply in India (NT13), what a control system is (CS01), power factor (PS13), and AC vs DC (NT04, 2019)**. Preparation lists add 1-phase vs 3-phase (NT06), why India uses AC (NT14), fuse purpose, generator vs motor (EM46) and electrical hazards and PPE (SI13) ([YourPedia BHEL](https://yourpedia.in/blog/BHEL-Engineer-Executive-Trainee-Interview-Preparation/bhel-electrical-et-interview-preparation)). On 50 Hz, the explanatory sources attribute the 50/60 Hz split mainly to history (European vs Westinghouse equipment) rather than physics ([NITK IEEE blog](https://ieee.l1.nitk.ac.in/blog/why-50hz)).

---

## Conclusions

The research changes what "most frequently asked" can honestly mean. With the main review sites blocked, the defensible claims are about **topics and interview shape**, not exact wording: a short HR opening, then the project, then four to eight conceptual questions that drift toward the employer's business (transmission and HVDC at POWERGRID; generation and plant equipment at NTPC, Adani and Torrent; distribution, metering and field problems at Tata Power; LV switchgear at Schneider; transformers and substations at Siemens; devices and logic at Micron and TI). A candidate who can explain *why* (why kVA, why star-delta, why corona matters, why the CT secondary is shorted) and can **draw** (an SLD, a phasor diagram, an RC waveform) covers most of what was reported.

### 1. Top 50 questions every electrical fresher should prepare

Tier A = reported and recurring (2+ independent sources); Tier B = reported once, chosen for core relevance and recency; Tier C = the most consistently recommended preparation-list items. Labels as defined above.

| # | Tier | ID | Question | Label |
|---|---|---|---|---|
| 1 | A | HR20 | Explain your final-year project / internship in depth | RF + RS (10+) |
| 2 | A | EM01 | Explain the working principle of a transformer | RS (5 + 3) |
| 3 | A | EM26 | What are the types of motors? | RF + RS (5) |
| 4 | A | HR03 | Why do you want to join this company? | RF + RS (7) |
| 5 | A | EM25 | How does an induction motor work? | RS (3) |
| 6 | A | EM30 | Why is a star-delta starter used for induction motors? | RS (3) |
| 7 | A | EM03 | Parts and types of a transformer | RF + RS (3) |
| 8 | A | SI01 | MCB vs MCCB (and ELCB) | RF + RS (3-4) |
| 9 | A | HR05 | Relocation / posting anywhere | RF + RS (6) |
| 10 | A | HR01 | Tell me about yourself | RF + RS (5+) |
| 11 | A | PS51 | Transformer protection: which devices are fitted? | RS (1 + 2) |
| 12 | A | PS44 | Switchgear vs circuit breaker | RS (1 + 2) |
| 13 | A | PS13 | What is power factor (and load factor)? | RF + RS (2 + 2) |
| 14 | A | PS18 | What is corona? | RF (2) |
| 15 | A | EM07 | Losses in a transformer | RS (2) |
| 16 | A | EM06 | Why is a transformer rated in kVA? | RS + RF (2) |
| 17 | A | PS15 | Draw the SLD from generation to consumers | RF (2) |
| 18 | A | PS02 | Types of power plants; why not more hydro? | RS (2) |
| 19 | A | PS36 | What is a substation; name its parts | RS (2) |
| 20 | A | EM38 | What is a synchronous generator / alternator working? | RS (2) |
| 21 | A | NT01 | Ohm's law and practical applications | RF + RS (2) |
| 22 | A | SI08 | How is earth resistance measured, and what value? | RF + RS (2) |
| 23 | A | NT11 | RC circuit: draw the output waveform | RF + RS (2) |
| 24 | A | HR08 | Strengths and weaknesses | RF + RS (4) |
| 25 | A | HR02 | Family background | RF (3) |
| 26 | A | HR11 | Career goals / five-year plan | RF + RS (3) |
| 27 | A | HR07 | Higher studies? | RF + RS (2) |
| 28 | A | HR13 | Why Electrical Engineering? | RS (2) |
| 29 | A | CS01 / CS03 | What is a control system; types? | RF + RS (2) |
| 30 | A | BE15 | MOSFET working and I-V characteristics (semiconductor track) | RS (3) |
| 31 | B | MI01 | Why is the CT secondary kept shorted? | RS (1) + prep |
| 32 | B | PS45 | Types of circuit breakers; explain one | RF (1) |
| 33 | B | PS46 | How do you select and rate a circuit breaker? | RS (1) |
| 34 | B | PS52 | What is a Buchholz relay? | RS (1) |
| 35 | B | PS29 | Zero sequence; zero vs negative dominance | RF (1) |
| 36 | B | PS17 | Underground cables vs overhead lines | RF (1) |
| 37 | B | NT09 / NT10 | Phasor diagrams with lead and lag; real vs reactive power | RS (1 each; topic 2) |
| 38 | B | EM08 | What happens when a transformer is energised? | RS (1) |
| 39 | B | EM47 | Speed control of a DC series motor | RS (1) |
| 40 | B | SI02 | How does an MCB work; MCB vs fuse | RS (1) |
| 41 | B | MI04 / MI05 | Megger; insulation resistance and its value | RF (1) |
| 42 | B | PS33 | Low voltage at a tubewell: how to raise it? | RF (1) [pre-2021] |
| 43 | C | EM16 | What happens if DC is applied to a transformer? | PL (3 prep) |
| 44 | C | PS22 | What is the Ferranti effect? | PL (4 prep) |
| 45 | C | EM19 | Why is the transformer core laminated? | PL (3 prep) |
| 46 | C | EM35 | Why is a single-phase IM not self-starting; how is it started? | PL (2 prep) |
| 47 | C | EM43 | Why is a synchronous motor not self-starting? | PL (3 prep) |
| 48 | C | PS58 | Circuit breaker vs isolator vs fuse | PL (2 prep) |
| 49 | C | CS04 | What is PID control and where is it used? | PL (3 prep) |
| 50 | C | EM34 | Why does an induction motor never reach synchronous speed? (slip) | PL (1 prep, plus NUM03) |

### 2. Most important subjects for core electrical placements

**Electrical machines, transformers first**, have the broadest evidence: transformer and induction-motor questions were reported at 7+ employers each across utilities, manufacturers and MNCs (Section A2; for example [Glassdoor L&T Power](https://www.glassdoor.com/Interview/L-and-T-Power-Interview-Questions-E579774.htm) and [GfG Emami](https://www.geeksforgeeks.org/?p=1074649)), and an r/Btechtards moderator independently named transformers as the key machine topic ([Reddit mirror](https://r.datuan.dev/r/Btechtards/s/J3XHViChs9), single person, unofficial mirror). **Power systems with protection and switchgear** is a close second and dominates utilities: in a tally of 56 PSU and utility items, about 20 were power systems, transmission, HVDC, stability or faults, about 10 switchgear and protection, and about 9 transformers ([BoardInfinity Tata Power](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624); [Gateway PGCIL 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html)); protection is also the recurring theme at ABB, Schneider, Hitachi Energy and L&T. **Generation and plant types** form a distinct utility topic (4 sources). **Circuit basics** (Ohm, KCL, phasors, RC) appear as openers. **Measurements, earthing and safety** appear mainly through practical questions (megger, CT, earth resistance). **Power electronics and control systems are thinly evidenced** (no reported control question beyond definitions). **Electronics and microcontrollers** matter for Schneider, Bosch and the semiconductor firms. No placement-cell statistics exist; this ranking rests on qualitative agreement across reports.

### 3. Companies and their commonly reported interview patterns

| Company | Rounds and tests | Panel / format | Focus areas | Caveats |
|---|---|---|---|---|
| NTPC | GATE shortlist, no written test; PI (GD reported in some years) | 3 members (prep guide) vs 5 (2021 Quora) vs 4 (Executive Engineer review); 10-30 min | Machines, power systems, transformer protection; mostly HR/background in some accounts | 10% interview weight is single-source; GD inconsistent; questions mostly from non-fresher roles |
| POWERGRID | GATE shortlist, document verification, sometimes GD, PI | About 4 (half HR, half technical), 10-20 min (2016); 3-4 per Careers360 | Transmission, HVDC, protection, substations, transformers; project and training | ~12% PI weight from a coaching blog; one interview reported entirely in Hindi (snippet) |
| BHEL | CBT (2023 cycle) or GATE, then PI | 4 (2013) vs 5 vs 8 (same 2023 prep blog): **conflict** | Mostly technical; transformers, CBs, relays, HT/LT panel testing | Questions largely from non-ET roles |
| NHPC | Written MCQ, PI | 4-5 members | Training report and project | Single source |
| Tata Power | Resume shortlist, aptitude (+ psychometric, sometimes coding), GD, technical, HR, sometimes combined | Varies; one 2024 panel had HR, electrical and mechanical members | Machines, protection, power systems, SLDs, field problems, internship | Aggregator; varies by year |
| Torrent Power | Pre-placement talk, written core test, technical, HR | Not stated | Power systems, switchgear, metering, resume | Snippet-only |
| Adani Power / Group | Online test (Adani Group: 160 min), async video interview, technical + HR | 2 technical + 1 HR, ~40 min (Group, ECE candidate) | Basics, generation, line identification, company knowledge, relocation | Fully read account is ECE |
| L&T | CGPA shortlist, 90-question test with sectional cut-offs, technical PI, HR with extempore; GD in some drives | ~20 min 4-member panel (2020 diploma drive) | Machines, protection and switchgear, earthing, project | Panels vary (one asked mechanical subjects) |
| Siemens / Siemens Energy | Mercer/Mettl test (91 questions, 80 min), technical, managerial/"personality", HR | Combined technical + HR for Siemens Energy | Machines, transformers, substations, phasors | Test format reported inconsistently |
| Schneider Electric | Track-specific MCQs (30 in 30 min), gamified aptitude, technical (~30 min), HR | 2 technical + HR in some reports | LV switchgear, power systems, machines, networks, microcontrollers | Separate core and digital tracks |
| ABB | Aptitude (some with technical), GD, technical, HR; one campus had a case interview | Not stated | Relays, components, star-delta | Fully read account was software-track |
| Hitachi Energy | Online assessment, phone interview, final interview, GD | Not stated | Relays, CBs, transformers, motors, earthing | Some GET tracks asked OOP |
| Havells | 60-question MCQ test, CV-based technical, HR | Multi-day process (Dec 2024) | Transformers, motors, substations, MCB, safety | Snippet-only |
| Bosch | Aptitude, GD, technical (~1 h), HR (~15 min) | Not stated | Electronics, microcontrollers, digital | Cut-off conflict (70% vs 60-65%) |
| Micron / TI | Hirepro OA, 1-2 technical rounds, DSA (Micron), HR | 5 parallel panels (Micron) | MOSFET, CMOS, digital puzzles, project | IIT Guwahati only |
| CG Power, Polycab, Mitsubishi Electric, GE Vernova | No usable India-fresher process or question evidence | | | Gaps, not findings |

### 4. Recommended preparation order for a fresher

Start with the item every panel asks: a **project and internship story** you can draw and defend in depth, because several Tata Power and Torrent candidates said the whole technical round came from it ([BoardInfinity Tata Power](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624)). Then master **transformers and induction motors** (working, parts, losses, kVA rating, star-delta, single-phase starting, protection), followed by **power systems, protection and switchgear** (SLD from generation to consumer, corona, power factor, substation equipment, CB types and rating, MCB/MCCB/ELCB, Buchholz). Next cover the **practical layer** (CT/PT, megger and insulation resistance, earthing and its measurement, field troubleshooting like the low-voltage tubewell), then **circuit basics and openers** (Ohm, KCL, phasors, RC, 3-phase, 50 Hz). Add **power electronics, control and measurements** at definition level, and electronics and microcontrollers only if targeting Schneider, Bosch or semiconductor firms. Finish with **company research** (products, subsidiaries, recent projects; regulators and sector bodies for PSUs) and **HR answers** on relocation, site work and higher studies, with aptitude practice (or GATE for PSUs) running in parallel. The numericals in Section F are worth practising for written tests and depth, but the evidence says interviews test the reasoning behind them far more than the arithmetic.

---

## Source register

Access: **RF** = read in full; **RS** = search snippet (blocked page); **PL** = preparation source.

| Key | Source | Access |
|---|---|---|
| [ABB-AB] | [AmbitionBox ABB Electrical GET](https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get) | RS |
| [ADANI-EL] | [AmbitionBox Adani Electricity](https://ambitionbox.com/interviews/adani-electricity-interview-questions) | RS |
| [ADANI-GFG] | [GeeksforGeeks Adani Group GET (ECE candidate)](https://www.geeksforgeeks.org/?p=1047365) | RF |
| [ADANI16] | [powerbycoal blog, Adani Power 2016](https://powerbycoal.blogspot.com/2016/05/adani-power-question-asked-in-interviews.html) | RS |
| [ADANIP-GD] | [Glassdoor Adani Power GET](https://www.glassdoor.com/Interview/Adani-Power-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE473429.0,11_KO12,44.htm) | RS |
| [ADI] | [Glassdoor Analog Devices Analog Design Engineer](https://www.glassdoor.co.in/Interview/Analog-Devices-Analog-Design-Engineer-Interview-Questions-EI_IE49.0,14_KO15,37.htm) | RS |
| [AB-CT] | [AmbitionBox question: why is the CT secondary shorted](https://www.ambitionbox.com/interviews/question/why-is-the-ct-secondary-site-shorted-eM2yAyPf) | RS |
| [AB-EE] | [AmbitionBox Electrical Engineer profile questions](https://ambitionbox.com/profiles/electrical-engineer/interview-questions) | RS |
| [AB-ELEC] | [AmbitionBox Electrician profile questions](https://ambitionbox.com/profiles/electrician/interview-questions) | RS |
| [AB-FREQ] | [AmbitionBox question: frequency of electricity in India](https://www.ambitionbox.com/interviews/question/what-is-the-frequency-of-electricity-in-india-6b3q22Ho) | RS |
| [AB-MCB] | [AmbitionBox question: MCB, MCCB and ELCB](https://www.ambitionbox.com/interviews/question/what-are-mcb-mccb-and-elcb-cAQlXvUh) | RS |
| [AF-PLC] | [automationforum PLC questions](https://automationforum.co/51-plc-interview-questions/) | PL |
| [AQUA] | [Electrical interview questions PDF (2023)](https://kh.aquaenergyexpo.com/wp-content/uploads/2023/08/Electrical-Interview-Questions-with-Answers.pdf) | PL |
| [BAJAJ] | [GeeksforGeeks Bajaj Electricals Junior Engineer (2019)](https://www.geeksforgeeks.org/?p=357010) | RF |
| [BHEL-AB] | [AmbitionBox BHEL](https://ambitionbox.com/interviews/bhel-interview-questions) | RS |
| [BHEL-AB6] | [AmbitionBox BHEL page 6](https://ambitionbox.com/interviews/bhel-interview-questions?page=6) | RS |
| [BHEL-ABEE] | [AmbitionBox BHEL Electrical Engineer](https://www.ambitionbox.com/interviews/bhel-interview-questions/electrical-engineer) | RS |
| [BOSCH-GET] | [Glassdoor Robert Bosch India GET](https://www.glassdoor.com/Interview/Robert-Bosch-India-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE237727.0,18_KO19,51.htm) | RS |
| [BOSCH-INT] | [Glassdoor Robert Bosch India internship](https://www.glassdoor.com/Interview/Robert-Bosch-India-Internship-Interview-Questions-EI_IE237727.0,18_KO19,29.htm) | RS |
| [BYJUS] | [BYJU'S Exam Prep electrical interview questions](https://byjusexamprep.com/electrical-interview-questions-i) | PL |
| [C360-KVA] | [Careers360: transformer kVA vs motor kW](https://www.careers360.com/question-why-transformer-rating-is-in-kva-while-motor-rating-is-in-kw) | PL |
| [EC-VFD] | [ElectricalClassroom VFD questions](https://www.electricalclassroom.com/interview-question-vfd/) | PL |
| [ECEXP] | [ecexplain synchronous machine interview](https://ecexplain.in/interview/synchronous-machine-interview) | PL |
| [ECLASS-TX] | [ElectricalClassroom transformer FAQ](https://www.electricalclassroom.com/transformer-faq/) | PL |
| [EEEGUIDE] | [eeeguide T&D Q&A](https://www.eeeguide.com/transmission-and-distribution-interview-questions-and-answers/) | PL |
| [EEEMADE] | [eeemadeeasy EE interview Q&A](https://www.eeemadeeasy.com/electrical-engineering-interview-questions-answers/) | PL |
| [EEEMAT] | [eeematerial NTPC list (2010)](https://eeematerial.blogspot.com/2010/06/electrical-questions-for.html) | PL |
| [EMAMI] | [GeeksforGeeks Emami GET 2023](https://www.geeksforgeeks.org/?p=1074649) | RF |
| [EPOST] | [Electronics Post power systems Q&A](https://electronicspost.com/power-systems-interview-questions-and-answers/) | PL |
| [EVOLT-CAB] | [ElectricalVolt cables Q&A](https://www.electricalvolt.com/electrical-cables-interview-questions-answers/) | PL |
| [EVOLT-IM] | [ElectricalVolt induction motor Q51-60](https://www.electricalvolt.com/induction-motor-interview-questions-and-answers-q-51-60/) | PL |
| [EVOLT-TX3] | [ElectricalVolt transformer Q&A part 3](https://www.electricalvolt.com/transformer-interview-questions-answers-part-3/) | PL |
| [EW4U] | [electricalworld4u (2015)](https://electricalworld4u.blogspot.com/2015/02/electrical-engineering-interview-question-pdf.html) | PL |
| [FA-BHEL] | [forumautomation BHEL electrical questions (2024)](https://forumautomation.com/t/bhel-electrical-interview-questions/12336) | PL |
| [FA100] | [forumautomation 100+ EE questions](https://forumautomation.com/t/100-electrical-engineering-interview-questions/10000) | PL |
| [FP-ABB] | [FACE Prep ABB](https://www.faceprep.in/abb/abb-interview-questions/) | PL |
| [FP-BOSCH] | [FACE Prep Bosch](https://www.faceprep.in/robert-bosch/robert-bosch-interview-questions/) | PL |
| [FP-TI] | [FACE Prep Texas Instruments](https://faceprep.in/article/texas-instruments-interview-questions-for-analog-and-digital-profiles-face-prep/) | PL |
| [GD-AEE] | [Glassdoor assistant electrical engineer listing](https://api.glassdoor.com/Interview/assistant-electrical-engineer-interview-questions-SRCH_KO0,29.htm) | RS |
| [GD-EE60] | [Glassdoor electrical engineer listing p.60](https://static.glassdoor.com.ar/Interview/electrical-engineer-interview-questions-SRCH_KO0,19_IP60.htm) | RS |
| [GD-ELEC106] | [Glassdoor electrical listing p.106](https://static.glassdoor.at/Interview/electrical-interview-questions-SRCH_KO0,10_IP106.htm) | RS |
| [GD-FRESH12] | [Glassdoor fresher engineer listing p.12](https://clear.glassdoor.nl/Interview/fresher-engineer-interview-questions-SRCH_KO0,16_IP12.htm) | RS |
| [GD-FRESH457] | [Glassdoor fresher engineer listing p.457](https://static.glassdoor.at/Interview/fresher-engineer-interview-questions-SRCH_KO0,16_IP457.htm) | RS |
| [GD-GRAD3] | [Glassdoor graduate EE listing p.3](https://static.glassdoor.com.ar/Interview/graduate-electrical-engineer-interview-questions-SRCH_KO0,28_IP3.htm) | RS |
| [GD-GRAD5] | [Glassdoor graduate EE listing p.5](https://static.glassdoor.es/Interview/graduate-electrical-engineer-interview-questions-SRCH_KO0,28_IP5.htm) | RS |
| [GE-PGET] | [JoinTaro GE PGET Warangal 2020](https://www.jointaro.com/interviews/companies/general-electric/experiences/post-graduate-engineering-trainee-pget-warangal-telangana-october-1-2020-no-offer-positive-4f535cd6/) | RS |
| [GEV-ENG] | [Glassdoor GE Vernova engineering](https://www.glassdoor.co.in/Interview/GE-Vernova-Engineering-Interview-Questions-EI_IE740889.0,10_KO11,22.htm) | RS |
| [GEV-ENGR] | [Glassdoor GE Vernova engineer](https://www.glassdoor.com/Interview/GE-Vernova-Engineer-Interview-Questions-EI_IE740889.0,10_KO11,19.htm) | RS |
| [GEV-GET] | [Glassdoor GE Vernova GET](https://www.glassdoor.com/Interview/GE-Vernova-Graduate-Engineer-Trainee-Interview-Questions-EI_IE740889.0,10_KO11,36.htm) | RS |
| [HAV-AI] | [allinterview Havells (user-submitted)](https://www.allinterview.com/company/923/havells/interview-questions/82/electrical-engineering.html) | PL (status unclear) |
| [HAV-GD] | [Glassdoor Havells India](https://www.glassdoor.co.in/Interview/Havells-India-Interview-Questions-E352690.htm) | RS |
| [HAV-GET] | [Glassdoor Havells GET](https://www.glassdoor.com/Interview/Havells-India-Graduate-Engineer-Trainee-Interview-Questions-EI_IE352690.0,13_KO14,39.htm) | RS |
| [HAV-SYNC] | [Glassdoor Havells: synchronous motor and power system](https://www.glassdoor.co.in/Interview/Regarding-Synchronous-Motor-and-Power-System-QTN_5800378.htm) | RS |
| [HINDR2] | [Glassdoor Hind Rectifiers review](https://www.glassdoor.com/Interview/Hind-Rectifiers-Interview-E519266-RVW82815400.htm) | RS |
| [HIT-AB] | [AmbitionBox Hitachi Energy Electrical GET](https://www.ambitionbox.com/interviews/hitachi-energy-interview-questions/electrical-get) | RS |
| [HIT-GET] | [Glassdoor Hitachi Energy GET](https://www.glassdoor.com/Interview/Hitachi-Energy-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,40.htm) | RS |
| [HIT-INDEED] | [Indeed Hitachi Energy (UK) common questions](https://uk.indeed.com/cmp/Hitachi-Energy/interviews) | PL |
| [HIT-INT] | [Glassdoor Hitachi Energy intern](https://www.glassdoor.co.in/Interview/Hitachi-Energy-Intern-Interview-Questions-EI_IE3507483.0,14_KO15,21.htm) | RS |
| [HIT-MT] | [Glassdoor Hitachi Energy Management Trainee](https://www.glassdoor.com/Interview/Hitachi-Energy-Management-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,33.htm) | RS |
| [HITB] | [hitbullseye EE interview questions](https://gdpi.hitbullseye.com/MBA/Electrical-Engineering-Interview-Questions.php) | PL |
| [IMBLOG] | [Single-phase induction motor questions blog (2017)](https://inductionmotorsinterviewquestions.blogspot.com/2017/09/single-phase-induction-motors-interview-questions.html) | PL |
| [IMEG] | [Glassdoor IMEG review](https://www.glassdoor.co.in/Interview/IMEG-Interview-E1726797-RVW105039751.htm) | RS |
| [IND-ANALOG] | [Indeed analog electronics questions](https://in.indeed.com/career-advice/interviewing/analog-electronics-interview-questions) | PL |
| [IQA-ABB] | [interviewquestions.app ABB](https://interviewquestions.app/abb/interview-experience/) | PL |
| [JNTUA] | [JNTUA GATE material (slip definition)](https://jntua.ac.in/gate-online-classes/registration/downloads/material/a159100923459.pdf) | PL |
| [KREA] | [Kreatryx PGCIL interview](https://blog.kreatryx.com/pgcil-interview/) | RS |
| [LT-GD1] | [Glassdoor L&T review (SF6, skin effect)](https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW86786381.htm) | RS |
| [LT-GD2] | [Glassdoor L&T review (HR items)](https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW55991429.htm) | RS |
| [LT20] | [GeeksforGeeks L&T 2020 (diploma-level)](https://www.geeksforgeeks.org/?p=700115) | RF |
| [LT24] | [WireUnwired L&T ECC GET 2024](https://wireunwired.com/lt-get-interview-experience-2024/) | RF |
| [LTC-AB] | [AmbitionBox L&T Construction Electrical GET](https://www.ambitionbox.com/interviews/l-and-t-construction-interview-questions/electrical-get) | RS |
| [LTC-ABEE] | [AmbitionBox L&T Construction Electrical Engineer](https://www.ambitionbox.com/interviews/l-and-t-construction-interview-questions/electrical-engineer) | RS |
| [LTP17] | [Glassdoor L&T Power Trainee Electrical](https://www.glassdoor.co.in/Interview/L-and-T-Power-Trainee-Electrical-Interview-Questions-EI_IE579774.0,13_KO14,32.htm) | RS |
| [LTP25] | [Glassdoor L&T Power (Dec 2025)](https://www.glassdoor.com/Interview/L-and-T-Power-Interview-Questions-E579774.htm) | RS |
| [MIC-GD1] | [Glassdoor Micron review RVW752833](https://www.glassdoor.co.in/Interview/Micron-Technology-Interview-E1648-RVW752833.htm) | RS |
| [MIC-GD2] | [Glassdoor Micron review RVW51034112](https://www.glassdoor.com.hk/Interview/Micron-Technology-Interview-E1648-RVW51034112.htm) | RS |
| [MIC-GD3] | [Glassdoor Micron review RVW8573712](https://www.glassdoor.co.in/Interview/Micron-Technology-Interview-E1648-RVW8573712.htm) | RS |
| [MIC-GFG] | [GeeksforGeeks Micron Semiconductor Engineer](https://www.geeksforgeeks.org/interview-experiences/micron-technology-interview-experience-for-semiconductor-engineer-on-campus/) | RF |
| [NHPC] | [Glassdoor NHPC](https://www.glassdoor.co.in/Interview/NHPC-Interview-Questions-E507798.htm) | RS |
| [NITK50] | [NITK IEEE blog: why 50 Hz](https://ieee.l1.nitk.ac.in/blog/why-50hz) | PL |
| [NTPC-ABT] | [AmbitionBox NTPC electrical technician](https://www.ambitionbox.com/interviews/ntpc-interview-questions/electrical-technician) | RS |
| [NTPC-ABX] | [AmbitionBox NTPC executive](https://ambitionbox.com/interviews/ntpc-interview-questions/executive) | RS |
| [NTPC-GD] | [Glassdoor NTPC](https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm) | RS |
| [NTPC-GDHK] | [Glassdoor NTPC (Korba 2022)](https://www.glassdoor.com.hk/Interview/National-Thermal-Power-Interview-Questions-E8309.htm) | RS |
| [NTPC11] | [electricalquestionsguide NTPC list (2011)](http://electricalquestionsguide.blogspot.com/2011/06/ntpc-psu-electrical-interview-questions.html) | PL |
| [NTPC16] | [Gateway of Engineering NTPC 2016 (ECE)](https://gatewayofengineering.blogspot.com/2016/07/ntpc-interview-experience-2016.html) | RS |
| [NXP] | [Glassdoor NXP Analog Design Engineer](https://www.glassdoor.co.in/Interview/NXP-Semiconductors-Analog-Design-Engineer-Interview-Questions-EI_IE13528.0,18_KO19,41.htm) | RS |
| [PG-AB] | [AmbitionBox POWERGRID trainee](https://www.ambitionbox.com/interviews/power-grid-corporation-of-india-interview-questions/trainee) | RS |
| [PGCIL16] | [Gateway of Engineering PGCIL EE 2016](http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html) | RF |
| [PLCBLOG] | [plcblog EE fresher questions](https://plcblog.in/electrical/interview/electrical-engineering-interview-questions-for-freshers.php) | PL |
| [POLY-AB] | [AmbitionBox Polycab](https://ambitionbox.com/interviews/polycab-wires-interview-questions) | RS |
| [POLY-AI] | [allinterview Polycab (user-submitted)](https://www.allinterview.com/company/2405/polycab/interview-questions/82/electrical-engineering.html) | PL (status unclear) |
| [PP-NTPC] | [placementpapers.app NTPC (low reliability)](https://placementpapers.app/ntpc/interview-experience/) | PL |
| [PREPINSTA] | [PrepInsta: why IT after electrical](https://prepinsta.com/?p=1318700) | PL |
| [QUORA-NTPC] | [Quora NTPC EE interview experience](https://www.quora.com/How-was-your-NTPC-interview-experience-for-an-electrical-engineer) | RS |
| [QUORA-PSU] | [Quora PSU EE preparation](https://www.quora.com/How-do-I-prepare-for-a-PSU-interview-Electrical-Branch) | RS (advice) |
| [RENEW] | [Glassdoor ReNew review](https://www.glassdoor.co.in/Interview/ReNew-Interview-E675767-RVW75863135.htm) | RS |
| [SANF] | [Sanfoundry Ferranti effect](https://www.sanfoundry.com/power-systems-questions-answers-ferranti-effect-methods-voltage-control/) | PL |
| [SCH-BLR24] | [JoinTaro Schneider GET Bangalore 2024](https://www.jointaro.com/interviews/companies/schneider-electric/experiences/graduate-engineering-trainee-get-bangalore-rural-karnataka-august-1-2024-no-offer-positive-fdda1b21/) | RS |
| [SCH-EE] | [Glassdoor Schneider Electrical Engineer](https://www.glassdoor.com/Interview/Schneider-Electric-Electrical-Engineer-Interview-Questions-EI_IE3956.0,18_KO19,38.htm) | RS |
| [SCH-GET44] | [Glassdoor Schneider GET](https://static.glassdoor.at/Interview/Schneider-Electric-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3956.0,18_KO19,44.htm) | RS |
| [SCH-GET51] | [Glassdoor Schneider GET / EE](https://www.glassdoor.com/Interview/Schneider-Electric-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE3956.0,18_KO19,51.htm) | RS |
| [SCH-GFG] | [GeeksforGeeks Schneider Electric technical interview](https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/) | RF |
| [SCH-RVW] | [Glassdoor Schneider review RVW91372349](https://www.glassdoor.co.in/Interview/Schneider-Electric-Interview-E3956-RVW91372349.htm) | RS |
| [SCH-SUR21] | [JoinTaro Schneider GET Surat 2021](https://www.jointaro.com/interviews/companies/schneider-electric/experiences/graduate-engineer-trainee-get-surat-gujarat-november-1-2021-accepted-offer-positive-d2150465/) | RS |
| [SCRIBD1] | [Scribd question set](https://www.scribd.com/document/416277367/Questions) | PL |
| [SCRIBD2] | [Scribd core interview questions](https://www.scribd.com/document/92199888/Core-Interview-Questions) | PL |
| [SE-GD1] | [Glassdoor Siemens Energy RVW48689583](https://www.glassdoor.ie/Interview/Siemens-Energy-Interview-E4393689-RVW48689583.htm) | RS |
| [SE-GD2] | [Glassdoor Siemens Energy RVW82850724](https://www.glassdoor.ca/Interview/Siemens-Energy-Interview-E4393689-RVW82850724.htm) | RS |
| [SE-MED] | [Medium: Siemens Energy GET campus](https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a) | RS |
| [SGAMESA] | [Glassdoor Siemens Gamesa question](https://www.glassdoor.com/Interview/Started-with-Basic-Introduction-Explain-Previous-job-experience-if-you-have-any-Course-Project-Questions-related-to-I-QTN_5138668.htm) | RS |
| [SIE-CHN22] | [JoinTaro Siemens GTE Chennai 2022 listing](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-trainee-engineer-chennai-november-1-2022-accepted-offer-positive-f4ef523b) | RS |
| [SIE-HYD24] | [JoinTaro Siemens GET Hyderabad 2024](https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858) | RS |
| [SKL-EM] | [Skill-Lync electrical machines questions](https://resources.skill-lync.com/branches/electrical-engineering/questions/electrical-machines) | PL |
| [SKL-PE] | [Skill-Lync power electronics questions](https://resources.skill-lync.com/branches/electrical-engineering/questions/power-electronics) | PL |
| [TATA-BI] | [BoardInfinity Tata Power GET guide (compiles candidate reports)](https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624) | RF (aggregator) |
| [TATA-GD25] | [Glassdoor Tata Power GET (2025)](https://www.glassdoor.co.in/Interview/Tata-Power-Graduate-Engineer-Trainee-GET-Interview-Questions-EI_IE152741.0,10_KO11,40.htm) | RS |
| [TATA-GD5] | [Glassdoor Tata Power p.5](https://www.glassdoor.com.hk/Interview/Tata-Power-Interview-Questions-E152741_P5.htm) | RS |
| [TECHIQ] | [Technocracy IQ blog (2017)](https://technocracyiq.blogspot.com/2017/06/electrical-engineering-technical-q-part_15.html) | PL |
| [THX] | [Glassdoor Thermax](https://www.glassdoor.sg/Interview/Thermax-Interview-Questions-E142281.htm) | RS |
| [TI-GD20] | [Glassdoor Texas Instruments RVW38795941](https://www.glassdoor.com/Interview/Texas-Instruments-Interview-E651-RVW38795941.htm) | RS |
| [TI-GFG] | [GeeksforGeeks Texas Instruments digital intern](https://www.geeksforgeeks.org/?p=884598) | RF |
| [TORRENT] | [Glassdoor Torrent Power](https://www.glassdoor.co.in/Interview/Torrent-Power-Interview-Questions-E371099.htm) (also [review RVW100526359](https://www.glassdoor.ie/Interview/Torrent-Power-Interview-E371099-RVW100526359.htm), [AmbitionBox Torrent Electrical GET](https://www.ambitionbox.com/interviews/torrent-power-interview-questions/electrical-get)) | RS |
| [TPOINT] | [TpointTech EE interview questions](https://www.tpointtech.com/electrical-engineering-interview-questions) | PL |
| [UPES] | [UPES blog: EE interview questions](https://www.upes.ac.in/blog/advanced-engineering/electrical-engineering-interview-questions) | PL |
| [YP-BHEL] | [YourPedia BHEL ET preparation](https://yourpedia.in/blog/BHEL-Engineer-Executive-Trainee-Interview-Preparation/bhel-electrical-et-interview-preparation) | PL |
| [YP-PGCIL] | [YourPedia PGCIL preparation](https://www.yourpedia.in/blog/Interview-Group-Discussion-Preparation-for-PGCIL/how-an-electrical-engineer-should-prepare-for-pgcil-interviews) | PL |
| [YP-POSOCO] | [YourPedia POSOCO preparation](https://yourpedia.in/blog/Preparing-for-the-Next-Step-How-to-Ace-Your-POSOCO-Interview/posoco-interview-preparation-actual-interview-questions-electrical-branch) | PL |

[ABB-AB]: https://www.ambitionbox.com/interviews/abb-interview-questions/electrical-get
[ADANI-EL]: https://ambitionbox.com/interviews/adani-electricity-interview-questions
[ADANI-GFG]: https://www.geeksforgeeks.org/?p=1047365
[ADANI16]: https://powerbycoal.blogspot.com/2016/05/adani-power-question-asked-in-interviews.html
[ADANIP-GD]: https://www.glassdoor.com/Interview/Adani-Power-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE473429.0,11_KO12,44.htm
[ADI]: https://www.glassdoor.co.in/Interview/Analog-Devices-Analog-Design-Engineer-Interview-Questions-EI_IE49.0,14_KO15,37.htm
[AB-CT]: https://www.ambitionbox.com/interviews/question/why-is-the-ct-secondary-site-shorted-eM2yAyPf
[AB-EE]: https://ambitionbox.com/profiles/electrical-engineer/interview-questions
[AB-ELEC]: https://ambitionbox.com/profiles/electrician/interview-questions
[AB-FREQ]: https://www.ambitionbox.com/interviews/question/what-is-the-frequency-of-electricity-in-india-6b3q22Ho
[AB-MCB]: https://www.ambitionbox.com/interviews/question/what-are-mcb-mccb-and-elcb-cAQlXvUh
[AF-PLC]: https://automationforum.co/51-plc-interview-questions/
[AQUA]: https://kh.aquaenergyexpo.com/wp-content/uploads/2023/08/Electrical-Interview-Questions-with-Answers.pdf
[BAJAJ]: https://www.geeksforgeeks.org/?p=357010
[BHEL-AB]: https://ambitionbox.com/interviews/bhel-interview-questions
[BHEL-AB6]: https://ambitionbox.com/interviews/bhel-interview-questions?page=6
[BHEL-ABEE]: https://www.ambitionbox.com/interviews/bhel-interview-questions/electrical-engineer
[BOSCH-GET]: https://www.glassdoor.com/Interview/Robert-Bosch-India-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE237727.0,18_KO19,51.htm
[BOSCH-INT]: https://www.glassdoor.com/Interview/Robert-Bosch-India-Internship-Interview-Questions-EI_IE237727.0,18_KO19,29.htm
[BYJUS]: https://byjusexamprep.com/electrical-interview-questions-i
[C360-KVA]: https://www.careers360.com/question-why-transformer-rating-is-in-kva-while-motor-rating-is-in-kw
[EC-VFD]: https://www.electricalclassroom.com/interview-question-vfd/
[ECEXP]: https://ecexplain.in/interview/synchronous-machine-interview
[ECLASS-TX]: https://www.electricalclassroom.com/transformer-faq/
[EEEGUIDE]: https://www.eeeguide.com/transmission-and-distribution-interview-questions-and-answers/
[EEEMADE]: https://www.eeemadeeasy.com/electrical-engineering-interview-questions-answers/
[EEEMAT]: https://eeematerial.blogspot.com/2010/06/electrical-questions-for.html
[EMAMI]: https://www.geeksforgeeks.org/?p=1074649
[EPOST]: https://electronicspost.com/power-systems-interview-questions-and-answers/
[EVOLT-CAB]: https://www.electricalvolt.com/electrical-cables-interview-questions-answers/
[EVOLT-IM]: https://www.electricalvolt.com/induction-motor-interview-questions-and-answers-q-51-60/
[EVOLT-TX3]: https://www.electricalvolt.com/transformer-interview-questions-answers-part-3/
[EW4U]: https://electricalworld4u.blogspot.com/2015/02/electrical-engineering-interview-question-pdf.html
[FA-BHEL]: https://forumautomation.com/t/bhel-electrical-interview-questions/12336
[FA100]: https://forumautomation.com/t/100-electrical-engineering-interview-questions/10000
[FP-ABB]: https://www.faceprep.in/abb/abb-interview-questions/
[FP-BOSCH]: https://www.faceprep.in/robert-bosch/robert-bosch-interview-questions/
[FP-TI]: https://faceprep.in/article/texas-instruments-interview-questions-for-analog-and-digital-profiles-face-prep/
[GD-AEE]: https://api.glassdoor.com/Interview/assistant-electrical-engineer-interview-questions-SRCH_KO0,29.htm
[GD-EE60]: https://static.glassdoor.com.ar/Interview/electrical-engineer-interview-questions-SRCH_KO0,19_IP60.htm
[GD-ELEC106]: https://static.glassdoor.at/Interview/electrical-interview-questions-SRCH_KO0,10_IP106.htm
[GD-FRESH12]: https://clear.glassdoor.nl/Interview/fresher-engineer-interview-questions-SRCH_KO0,16_IP12.htm
[GD-FRESH457]: https://static.glassdoor.at/Interview/fresher-engineer-interview-questions-SRCH_KO0,16_IP457.htm
[GD-GRAD3]: https://static.glassdoor.com.ar/Interview/graduate-electrical-engineer-interview-questions-SRCH_KO0,28_IP3.htm
[GD-GRAD5]: https://static.glassdoor.es/Interview/graduate-electrical-engineer-interview-questions-SRCH_KO0,28_IP5.htm
[GE-PGET]: https://www.jointaro.com/interviews/companies/general-electric/experiences/post-graduate-engineering-trainee-pget-warangal-telangana-october-1-2020-no-offer-positive-4f535cd6/
[GEV-ENG]: https://www.glassdoor.co.in/Interview/GE-Vernova-Engineering-Interview-Questions-EI_IE740889.0,10_KO11,22.htm
[GEV-ENGR]: https://www.glassdoor.com/Interview/GE-Vernova-Engineer-Interview-Questions-EI_IE740889.0,10_KO11,19.htm
[GEV-GET]: https://www.glassdoor.com/Interview/GE-Vernova-Graduate-Engineer-Trainee-Interview-Questions-EI_IE740889.0,10_KO11,36.htm
[HAV-AI]: https://www.allinterview.com/company/923/havells/interview-questions/82/electrical-engineering.html
[HAV-GD]: https://www.glassdoor.co.in/Interview/Havells-India-Interview-Questions-E352690.htm
[HAV-GET]: https://www.glassdoor.com/Interview/Havells-India-Graduate-Engineer-Trainee-Interview-Questions-EI_IE352690.0,13_KO14,39.htm
[HAV-SYNC]: https://www.glassdoor.co.in/Interview/Regarding-Synchronous-Motor-and-Power-System-QTN_5800378.htm
[HINDR2]: https://www.glassdoor.com/Interview/Hind-Rectifiers-Interview-E519266-RVW82815400.htm
[HIT-AB]: https://www.ambitionbox.com/interviews/hitachi-energy-interview-questions/electrical-get
[HIT-GET]: https://www.glassdoor.com/Interview/Hitachi-Energy-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,40.htm
[HIT-INDEED]: https://uk.indeed.com/cmp/Hitachi-Energy/interviews
[HIT-INT]: https://www.glassdoor.co.in/Interview/Hitachi-Energy-Intern-Interview-Questions-EI_IE3507483.0,14_KO15,21.htm
[HIT-MT]: https://www.glassdoor.com/Interview/Hitachi-Energy-Management-Trainee-Interview-Questions-EI_IE3507483.0,14_KO15,33.htm
[HITB]: https://gdpi.hitbullseye.com/MBA/Electrical-Engineering-Interview-Questions.php
[IMBLOG]: https://inductionmotorsinterviewquestions.blogspot.com/2017/09/single-phase-induction-motors-interview-questions.html
[IMEG]: https://www.glassdoor.co.in/Interview/IMEG-Interview-E1726797-RVW105039751.htm
[IND-ANALOG]: https://in.indeed.com/career-advice/interviewing/analog-electronics-interview-questions
[IQA-ABB]: https://interviewquestions.app/abb/interview-experience/
[JNTUA]: https://jntua.ac.in/gate-online-classes/registration/downloads/material/a159100923459.pdf
[KREA]: https://blog.kreatryx.com/pgcil-interview/
[LT-GD1]: https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW86786381.htm
[LT-GD2]: https://www.glassdoor.co.in/Interview/Larsen-and-Toubro-Interview-E41782-RVW55991429.htm
[LT20]: https://www.geeksforgeeks.org/?p=700115
[LT24]: https://wireunwired.com/lt-get-interview-experience-2024/
[LTC-AB]: https://www.ambitionbox.com/interviews/l-and-t-construction-interview-questions/electrical-get
[LTC-ABEE]: https://www.ambitionbox.com/interviews/l-and-t-construction-interview-questions/electrical-engineer
[LTP17]: https://www.glassdoor.co.in/Interview/L-and-T-Power-Trainee-Electrical-Interview-Questions-EI_IE579774.0,13_KO14,32.htm
[LTP25]: https://www.glassdoor.com/Interview/L-and-T-Power-Interview-Questions-E579774.htm
[MIC-GD1]: https://www.glassdoor.co.in/Interview/Micron-Technology-Interview-E1648-RVW752833.htm
[MIC-GD2]: https://www.glassdoor.com.hk/Interview/Micron-Technology-Interview-E1648-RVW51034112.htm
[MIC-GD3]: https://www.glassdoor.co.in/Interview/Micron-Technology-Interview-E1648-RVW8573712.htm
[MIC-GFG]: https://www.geeksforgeeks.org/interview-experiences/micron-technology-interview-experience-for-semiconductor-engineer-on-campus/
[NHPC]: https://www.glassdoor.co.in/Interview/NHPC-Interview-Questions-E507798.htm
[NITK50]: https://ieee.l1.nitk.ac.in/blog/why-50hz
[NTPC-ABT]: https://www.ambitionbox.com/interviews/ntpc-interview-questions/electrical-technician
[NTPC-ABX]: https://ambitionbox.com/interviews/ntpc-interview-questions/executive
[NTPC-GD]: https://www.glassdoor.com/Interview/National-Thermal-Power-Interview-Questions-E8309.htm
[NTPC-GDHK]: https://www.glassdoor.com.hk/Interview/National-Thermal-Power-Interview-Questions-E8309.htm
[NTPC11]: http://electricalquestionsguide.blogspot.com/2011/06/ntpc-psu-electrical-interview-questions.html
[NTPC16]: https://gatewayofengineering.blogspot.com/2016/07/ntpc-interview-experience-2016.html
[NXP]: https://www.glassdoor.co.in/Interview/NXP-Semiconductors-Analog-Design-Engineer-Interview-Questions-EI_IE13528.0,18_KO19,41.htm
[PG-AB]: https://www.ambitionbox.com/interviews/power-grid-corporation-of-india-interview-questions/trainee
[PGCIL16]: http://gatewayofengineering.blogspot.com/2016/06/pgcil-interview-experience-ee-2016.html
[PLCBLOG]: https://plcblog.in/electrical/interview/electrical-engineering-interview-questions-for-freshers.php
[POLY-AB]: https://ambitionbox.com/interviews/polycab-wires-interview-questions
[POLY-AI]: https://www.allinterview.com/company/2405/polycab/interview-questions/82/electrical-engineering.html
[PP-NTPC]: https://placementpapers.app/ntpc/interview-experience/
[PREPINSTA]: https://prepinsta.com/?p=1318700
[QUORA-NTPC]: https://www.quora.com/How-was-your-NTPC-interview-experience-for-an-electrical-engineer
[QUORA-PSU]: https://www.quora.com/How-do-I-prepare-for-a-PSU-interview-Electrical-Branch
[RENEW]: https://www.glassdoor.co.in/Interview/ReNew-Interview-E675767-RVW75863135.htm
[SANF]: https://www.sanfoundry.com/power-systems-questions-answers-ferranti-effect-methods-voltage-control/
[SCH-BLR24]: https://www.jointaro.com/interviews/companies/schneider-electric/experiences/graduate-engineering-trainee-get-bangalore-rural-karnataka-august-1-2024-no-offer-positive-fdda1b21/
[SCH-EE]: https://www.glassdoor.com/Interview/Schneider-Electric-Electrical-Engineer-Interview-Questions-EI_IE3956.0,18_KO19,38.htm
[SCH-GET44]: https://static.glassdoor.at/Interview/Schneider-Electric-Graduate-Engineer-Trainee-Interview-Questions-EI_IE3956.0,18_KO19,44.htm
[SCH-GET51]: https://www.glassdoor.com/Interview/Schneider-Electric-Graduate-Engineering-Trainee-GET-Interview-Questions-EI_IE3956.0,18_KO19,51.htm
[SCH-GFG]: https://www.geeksforgeeks.org/interview-experiences/schneider-electric-technical-interview-experience/
[SCH-RVW]: https://www.glassdoor.co.in/Interview/Schneider-Electric-Interview-E3956-RVW91372349.htm
[SCH-SUR21]: https://www.jointaro.com/interviews/companies/schneider-electric/experiences/graduate-engineer-trainee-get-surat-gujarat-november-1-2021-accepted-offer-positive-d2150465/
[SCRIBD1]: https://www.scribd.com/document/416277367/Questions
[SCRIBD2]: https://www.scribd.com/document/92199888/Core-Interview-Questions
[SE-GD1]: https://www.glassdoor.ie/Interview/Siemens-Energy-Interview-E4393689-RVW48689583.htm
[SE-GD2]: https://www.glassdoor.ca/Interview/Siemens-Energy-Interview-E4393689-RVW82850724.htm
[SE-MED]: https://medium.com/@siddhantgupta.jp/siemens-energy-interview-experience-0cfe62d13f7a
[SGAMESA]: https://www.glassdoor.com/Interview/Started-with-Basic-Introduction-Explain-Previous-job-experience-if-you-have-any-Course-Project-Questions-related-to-I-QTN_5138668.htm
[SIE-CHN22]: https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-trainee-engineer-chennai-november-1-2022-accepted-offer-positive-f4ef523b
[SIE-HYD24]: https://www.jointaro.com/interviews/companies/siemens/experiences/graduate-engineer-trainee-hyderabad-august-1-2024-no-offer-positive-0be59858
[SKL-EM]: https://resources.skill-lync.com/branches/electrical-engineering/questions/electrical-machines
[SKL-PE]: https://resources.skill-lync.com/branches/electrical-engineering/questions/power-electronics
[TATA-BI]: https://discuss.boardinfinity.com/t/tata-power-graduate-engineer-trainee-interview-questions-experience-guide/23624
[TATA-GD25]: https://www.glassdoor.co.in/Interview/Tata-Power-Graduate-Engineer-Trainee-GET-Interview-Questions-EI_IE152741.0,10_KO11,40.htm
[TATA-GD5]: https://www.glassdoor.com.hk/Interview/Tata-Power-Interview-Questions-E152741_P5.htm
[TECHIQ]: https://technocracyiq.blogspot.com/2017/06/electrical-engineering-technical-q-part_15.html
[THX]: https://www.glassdoor.sg/Interview/Thermax-Interview-Questions-E142281.htm
[TI-GD20]: https://www.glassdoor.com/Interview/Texas-Instruments-Interview-E651-RVW38795941.htm
[TI-GFG]: https://www.geeksforgeeks.org/?p=884598
[TORRENT]: https://www.glassdoor.co.in/Interview/Torrent-Power-Interview-Questions-E371099.htm
[TPOINT]: https://www.tpointtech.com/electrical-engineering-interview-questions
[UPES]: https://www.upes.ac.in/blog/advanced-engineering/electrical-engineering-interview-questions
[YP-BHEL]: https://yourpedia.in/blog/BHEL-Engineer-Executive-Trainee-Interview-Preparation/bhel-electrical-et-interview-preparation
[YP-PGCIL]: https://www.yourpedia.in/blog/Interview-Group-Discussion-Preparation-for-PGCIL/how-an-electrical-engineer-should-prepare-for-pgcil-interviews
[YP-POSOCO]: https://yourpedia.in/blog/Preparing-for-the-Next-Step-How-to-Ace-Your-POSOCO-Interview/posoco-interview-preparation-actual-interview-questions-electrical-branch
