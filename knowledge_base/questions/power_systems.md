---
doc_type: questions
subject: Power systems (generation, transmission, distribution, load flow, faults, stability)
role_family: power_systems
---

# Power systems interview questions (generation, transmission, distribution, faults, stability)

Source: reports/Electrical fresher interview questions.md. "Reported" = a candidate said it was
asked (company in brackets); unmarked lines are standard preparation questions.
Each question is tagged by difficulty: Easy, Intermediate or Hard.

## Generation and power plants
Easy: How is electric power generated, and what types of power plants do you know? (Reported: Torrent Power, POWERGRID)
Intermediate: (follow-up) India has many rivers. Why isn't more of our power hydro? (Reported: POWERGRID)
Intermediate: Compare hydro and thermal plants: cost, start-up time, efficiency and the load they serve. (Reported: POWERGRID)
Intermediate: Why is a coal plant's efficiency only about 35-40%?
Intermediate: Which plants serve base load and which serve peak load, and why?
Easy: What new generation methods and trends do you follow (renewables, storage, EVs, smart grid)? (Reported: Tata Power, Schneider)
Good answers cover: thermal, hydro, nuclear, gas, solar, wind; hydro is site-specific, capital-heavy, slow to build, seasonal, with resettlement and environmental issues, but starts in minutes so it suits peaking; Rankine cycle and condenser heat rejection limit thermal efficiency; base load on coal and nuclear, peak on hydro, gas turbines and pumped storage; load factor, demand factor and plant factor.

## Power system structure and voltage levels
Easy: Draw the single-line diagram of a power system from the generating station to a consumer. (Reported: Tata Power)
Easy: Why are power systems interconnected into a grid? (Reported: Tata Power)
Easy: Why is power transmitted at high voltage?
Intermediate: Why are voltages like 11 kV, 33 kV and 132 kV used? (Reported: Havells)
Easy: Why does India use 50 Hz and three-phase AC? (Reported: TRL Krosaki)
Good answers cover: generator (about 11-25 kV), step-up transformer, EHV transmission (220/400/765 kV), grid substations, sub-transmission (66/33 kV), distribution (11 kV), distribution transformer to 415/230 V; for the same power, higher voltage means lower current and I-squared-R loss; interconnection shares reserves and improves reliability; standard voltage levels come from historical standardisation (the "form factor 1.11" explanation is a myth); 50 Hz is a historical choice; three-phase gives constant power and a rotating field.

## Transmission line phenomena
Easy: What is corona, and how is it reduced? (Reported: POWERGRID, Tata Power)
Intermediate: Explain the Ferranti effect. When does it occur?
Intermediate: What is skin effect, and how does it affect conductor design? (Reported: L&T)
Hard: How much power can a line carry? What is surge impedance loading? (Reported: Adani Power)
Intermediate: How do you protect transmission lines from lightning surges? (Reported: POWERGRID)
Intermediate: You see a line passing near you. How would you tell what voltage it carries? (Reported: Adani Power)
Good answers cover: corona is air ionisation when the surface gradient exceeds about 30 kV/cm peak, causing loss, noise and radio interference, reduced by larger or bundled conductors and corona rings; Ferranti: lightly loaded long lines, line capacitance charging current makes receiving-end voltage exceed sending-end, controlled by shunt reactors; skin effect raises AC resistance, hence stranded ACSR conductors; SIL = V squared / Zc (Zc about 400 ohm for overhead lines); earth wires, lightning arresters; insulator disc count and tower size indicate voltage.

## Underground cables and HVDC
Easy: Compare underground cables with overhead lines. When would you choose each? (Reported: Tata Power)
Intermediate: What are the advantages of HVDC over HVAC, and when is HVDC worth its cost? (Reported: POWERGRID)
Hard: (follow-up) Which harmonics appear in an HVDC converter, and how are they suppressed? (Reported: POWERGRID)
Intermediate: Why can't long AC cables be used for very long distances?
Good answers cover: cables cost several times more, are safer and weather-proof but hard to repair and have high capacitance (charging current); HVDC has no reactive power or stability limit, fewer conductors, can link asynchronous grids, cheaper beyond a break-even distance (several hundred km overhead, tens of km cable); converters are costly and produce harmonics; a 12-pulse converter produces AC-side harmonics of order 12k plus or minus 1 (11th, 13th), removed by tuned filters.

## Faults, symmetrical components and per unit
Intermediate: What types of faults occur in a power system? Which is most common and which is most severe?
Hard: What are zero-sequence components, and when does zero-sequence current flow? (Reported: Tata Power)
Hard: (follow-up) Which matters more in a fault, zero or negative sequence? (Reported: Tata Power)
Intermediate: Why are quantities expressed in per unit? (Reported: Bajaj Electricals)
Intermediate: Why do engineers use per-unit values, and why must impedances be brought to a common base before you combine them?
Good answers cover: single line to ground is most common (about 70-80%), three-phase is usually most severe; zero sequence needs a return path through neutral or earth, and a delta winding blocks it; for a line-to-ground fault the three sequence currents are equal; per unit keeps values in a narrow range, gives the same transformer impedance from both sides and simplifies calculation; Z_new = Z_old x (MVA_new / MVA_old) = 1.0 pu.

## Reactive power, power factor and voltage control
Easy: What is power factor and why does it matter to a utility and to an industry? (Reported: POWERGRID, NTPC)
Intermediate: How do you compensate voltage at a load centre? (Reported: Tata Power)
Hard: The voltage at a farmer's tubewell at the end of a long low-voltage (415 V LT) line is very low. How would you raise it? (Reported: Tata Power)
Intermediate: (follow-up) What happens if you over-correct the power factor?
Hard: How does a capacitor bank improve a lagging power factor, and what goes wrong if you over-correct?
Good answers cover: low pf means more current for the same power, so more losses, voltage drop and bigger equipment, plus tariff penalties; shunt capacitors, synchronous condensers, SVC and STATCOM, on-load tap changers; for a long LT line: move a distribution transformer closer (HVDS), larger conductor, shunt capacitors, tap setting; over-correction gives leading pf and overvoltage; Qc = P (tan phi1 - tan phi2) = 100 (1.020 - 0.329) about 69 kVAR.

## Load flow and power system studies
Intermediate: What is a load flow study, and why is it done before adding a new substation or generator?
Intermediate: What are the bus types in a load flow study, and why do we need a slack bus?
Hard: Compare Gauss-Seidel and Newton-Raphson. Why does Newton-Raphson converge in fewer iterations, and when can it fail?
Hard: Your load flow shows 0.92 pu at a remote bus. What could cause it, and what would you try?
Hard: (follow-up) How did you choose the initial guess, and what would you do if the solution did not converge?
Good answers cover: steady-state voltages, angles and power flows for planning and operation; PQ (load), PV (generator) and slack buses, the slack bus balancing losses and providing the angle reference; Newton-Raphson linearises the power flow equations with the Jacobian and converges quadratically (a few iterations) but each step costs more, Gauss-Seidel is simple but slow; flat start (1.0 pu, 0 degrees); non-convergence from heavy loading, poor initial guess or data errors; fix low voltage with reactive support, tap changes or reconductoring.

## Stability and grid operation
Hard: What is transient stability, and how can it be improved? (Reported: POWERGRID)
Intermediate: What are transmission and distribution losses, and how are they reduced? (Reported: POWERGRID)
Intermediate: How is grid frequency kept at 50 Hz when load changes?
Intermediate: What do load dispatch centres (SLDC, RLDC, Grid-India) do?
Good answers cover: ability to stay in synchronism after a large disturbance; improved by faster fault clearing, auto-reclosing, series compensation, higher voltage, fast excitation, more parallel lines; technical losses (I-squared-R, transformer) and commercial losses (theft, metering), reduced by HVDS, better metering, capacitors; governor action and scheduling maintain frequency; load dispatch centres schedule generation and balance the grid.

## Substations
Easy: What is a substation? Name its main equipment. (Reported: Siemens Energy, Havells, POWERGRID)
Easy: What types of substations are there? (Reported: Adani Power)
Intermediate: Why does a substation need a battery bank, and what does it supply? (Reported: Siemens Gamesa)
Hard: Explain busbar arrangements such as single bus, double bus and one-and-a-half breaker.
Intermediate: How is a substation earthed? (Reported: Siemens Gamesa)
Good answers cover: transformers, circuit breakers, isolators, CTs and PTs, lightning arresters, busbars, relays and control panels, capacitor banks; step-up, step-down, switching, AIS versus GIS; the DC battery powers protection relays and breaker trip coils even when AC is lost; bus schemes trade cost for reliability; an earth mat or grid keeps step and touch voltages safe.
