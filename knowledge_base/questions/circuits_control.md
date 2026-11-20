---
doc_type: questions
subject: Electrical circuits, network theory and control systems
role_family: circuits_control
---

# Electrical circuits, network theory and control systems interview questions

Source: reports/Electrical fresher interview questions.md. "Reported" = a candidate said it was
asked (company in brackets); unmarked lines are standard preparation questions.
Each question is tagged by difficulty: Easy, Intermediate or Hard. Panels use these
as openers, then move to practical use.

## Circuit basics and theorems
Easy: Where does Ohm's law stop holding, and where do you use it in practice? (Reported: Tata Power, Schneider)
Intermediate: How do Kirchhoff's laws explain the way current divides in a small distribution network? (Reported: Tata Power)
Easy: Explain Thevenin's theorem in one sentence, and where it is useful. (Reported: Bajaj Electricals)
Intermediate: How do you convert a star network to a delta network, and when do you need to? (Reported: Schneider)
Easy: Why would you convert a star network of resistors to delta, and when does it make a circuit easier to analyse?
Good answers cover: Ohm's law fails for non-linear devices (diodes, arcs) and when temperature changes resistance; KCL is conservation of charge at a node, KVL of energy around a loop; Thevenin replaces a linear network with one source and one series impedance (used for fault and load calculations); star to delta: R_delta = 3 x R_star for equal resistors, so 90 ohm each.

## AC fundamentals and three-phase systems
Easy: What is the difference between real, reactive and apparent power? (Reported: Siemens)
Intermediate: Draw phasor diagrams for resistive, inductive and capacitive loads, showing leading and lagging current. (Reported: Siemens Energy)
Intermediate: Why do we use three-phase supply, and why not four or more phases? (Reported: Bajaj Electricals)
Easy: Compare star and delta connections. Where is each used?
Easy: Why do we use AC for distribution and not DC?
Good answers cover: P in W, Q in VAR, S in VA, pf = cos phi; current lags voltage in an inductive load and leads in a capacitive one; three-phase gives constant instantaneous power, a rotating field for motors and saves conductor material, while more phases add cost with little gain; star gives a neutral and line voltage = root 3 x phase voltage, delta gives line current = root 3 x phase current; AC is easy to transform and interrupt (current zero).

## Transients and resonance
Intermediate: A switch connects a DC source to an RC circuit at t = 0. Sketch the capacitor voltage and current. (Reported: Texas Instruments)
Easy: (follow-up) What is the capacitor voltage after one time constant, and after five?
Intermediate: What is resonance in an RLC circuit? Where is it useful and where is it dangerous?
Easy: What does the time constant of an RC circuit tell you, and how does changing R or C change it?
Good answers cover: Vc rises exponentially as V(1 - e^(-t/RC)), current jumps to V/R then decays; about 63% at one tau and essentially full after five; at resonance XL = XC and f = 1 / (2 pi root(LC)), useful in filters and tuning, dangerous when capacitor banks resonate with system inductance at harmonic frequencies; tau = RC = 1 s.

## Control systems
Easy: What is a control system? Give examples from daily life. What types are there? (Reported: Adani Group, Schneider)
Intermediate: Explain the control system of an air conditioner. (Reported: Adani Group)
Intermediate: What do the P, I and D terms of a PID controller each do? Where is PID used in a plant?
Hard: How do you judge whether a control system is stable?
Good answers cover: open loop has no feedback (washing-machine timer), closed loop corrects using feedback (thermostat, cruise control); an AC uses a temperature sensor, comparator and on-off or inverter compressor control with hysteresis; P reacts to present error, I removes steady-state error, D damps overshoot; PID in boiler level, speed and temperature loops; stability through poles in the left half-plane, Routh-Hurwitz, Bode gain and phase margins, root locus.

## Basic electronics and microcontrollers
Easy: What is the difference between a microprocessor and a microcontroller? (Reported: Schneider)
Easy: Draw the characteristics of a diode and explain them. (Reported: Bosch)
Intermediate: What are ADCs and DACs, and where are they used in electrical equipment? (Reported: Bajaj Electricals)
Intermediate: Explain flip-flops and counters. (Reported: Schneider)
Good answers cover: a microcontroller has CPU, memory and peripherals on one chip for control tasks (8051, ESP32), a microprocessor needs external memory and peripherals; diode forward drop (about 0.7 V for silicon), reverse leakage and breakdown; ADCs in digital relays and meters, DACs in drives and signal generation; flip-flops store one bit, counters chain them.
