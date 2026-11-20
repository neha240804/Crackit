---
doc_type: questions
subject: Power system protection and switchgear (circuit breakers, relays, MCB, MCCB)
role_family: protection_switchgear
---

# Protection and switchgear interview questions

Source: reports/Electrical fresher interview questions.md. "Reported" = a candidate said it was
asked (company in brackets); unmarked lines are standard preparation questions.
Each question is tagged by difficulty: Easy, Intermediate or Hard.

## Switchgear, circuit breakers, isolators and fuses
Easy: What is switchgear, and how is it different from a circuit breaker? (Reported: Torrent Power, NTPC, BHEL)
Easy: What is the difference between switchgear and a relay? (Reported: Schneider)
Easy: Compare a circuit breaker, an isolator and a fuse. Why must an isolator never be opened on load?
Easy: How does a circuit breaker protect against a short circuit? (Reported: NTPC)
Easy: Name the parts of a relay and of a circuit breaker. (Reported: Tata Power)
Good answers cover: switchgear is the whole family of switching, protecting and isolating equipment; a relay senses the fault and commands, the breaker interrupts; an isolator is an off-load disconnector with no arc-quenching, opened only after the breaker; a fuse is a one-time device; CT senses current, relay picks up, trip coil opens the breaker.

## Circuit breaker types, arc quenching and ratings
Easy: What types of circuit breakers are there? Explain one in detail. (Reported: Schneider)
Intermediate: How is the arc quenched in a circuit breaker? (Reported: POWERGRID)
Intermediate: What properties make SF6 gas good for breakers, and what are its drawbacks? (Reported: L&T)
Hard: How do you select and rate a circuit breaker for an application? (Reported: Torrent Power)
Intermediate: Which standard would you refer to when selecting switchgear or a panel? (Reported: Torrent Power)
Good answers cover: air, air-blast, oil, SF6 and vacuum breakers (vacuum common up to 33 kV, SF6 at higher voltages); arc extinguished at current zero by cooling, lengthening and de-ionising the gap; SF6 is electronegative with 2-3 times the dielectric strength of air, but a strong greenhouse gas needing careful handling; ratings: rated voltage, normal current, breaking capacity (kA), making capacity, short-time withstand current, operating duty; IEC 62271 for HV switchgear, IEC 61439 for LV panels (IS equivalents).

## Relays and protection schemes
Easy: What is a relay? What types of protection relays do you know? (Reported: ABB, Hitachi Energy, BHEL)
Intermediate: How does a distance relay work, and why is it used on transmission lines? (Reported: Siemens)
Intermediate: Explain differential protection. Where is it used?
Hard: How would you protect an 11 kV feeder? What is relay coordination?
Intermediate: Why is the IDMT characteristic used for overcurrent relays?
Good answers cover: overcurrent, earth fault, differential, distance, directional; distance relay measures impedance (V/I), which is proportional to the distance to the fault, giving zones; differential compares current in and out of a zone (transformers, generators, busbars); feeder protection with overcurrent and earth-fault relays, graded so the nearest breaker trips first (time and current grading); IDMT trips faster for bigger faults.

## Transformer and generator protection
Intermediate: Which protection devices are fitted on a power transformer? (Reported: Hitachi Energy, NTPC, Tata Steel)
Intermediate: What is a Buchholz relay, and how does it work? (Reported: Siemens Energy)
Hard: (follow-up) Which gases form during internal faults in a transformer, and what do they indicate? (Reported: NTPC)
Hard: Why can a transformer's differential relay operate during energisation, and how is that prevented?
Good answers cover: differential, Buchholz, restricted earth fault, overcurrent and earth fault, oil and winding temperature indicators, pressure relief valve; Buchholz sits between tank and conservator, alarms on slow gas build-up and trips on an oil surge; hydrogen and hydrocarbons from oil breakdown, acetylene from arcing, CO and CO2 from paper insulation (dissolved gas analysis); inrush current is rich in second harmonic, so harmonic restraint blocks false trips.

## LV protection: MCB, MCCB, RCCB and ELCB
Easy: What are MCB, MCCB and ELCB, and how do MCB and MCCB differ? (Reported: Schneider, Tata Power)
Intermediate: How does an MCB work, and how is it different from a fuse? (Reported: Havells)
Intermediate: What is the difference between an ELCB and an RCD or RCCB? (Reported: Schneider)
Easy: What is the difference between single-pole and double-pole breakers? (Reported: Bajaj Electricals)
Intermediate: (follow-up) Which device protects against earth leakage and which against overcurrent? What sensitivity is used for protecting people?
Intermediate: (numerical) What MCB rating would you choose for a 2 kW, 230 V load? Explain the margin.
Good answers cover: MCB thermal (bimetal) trip for overload and magnetic trip for short circuit, fixed settings, up to about 125 A; MCCB larger currents with adjustable trips and higher breaking capacity; fuse melts once, MCB resets; RCCB trips on the difference between phase and neutral current (30 mA for people, 100-300 mA for fire); older ELCBs were voltage-operated; 2000/230 is about 8.7 A, so a 10 A MCB (16 A if cable allows) with curve chosen for inrush.

## Lightning and surge protection
Intermediate: How does a lightning arrester work? Where is it installed? (Reported: BHEL)
Intermediate: What is the difference between a lightning arrester and an earth wire?
Hard: What is insulation coordination?
Good answers cover: metal-oxide arresters conduct only above a threshold voltage, diverting the surge to earth, then reset; installed at line entries and near transformers; the earth wire shields lines from direct strokes; insulation coordination matches equipment insulation levels (BIL) with arrester protective levels so that arresters operate first.
