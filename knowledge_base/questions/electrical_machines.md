---
doc_type: questions
subject: Electrical machines (transformers, induction motors, synchronous machines, DC machines)
role_family: electrical_machines
---

# Electrical machines interview questions (transformers, induction, synchronous, DC)

Source: reports/Electrical fresher interview questions.md. "Reported" = a candidate said it was
asked (company in brackets); unmarked lines are standard preparation questions.
Each question is tagged by difficulty: Easy, Intermediate or Hard.

## Transformer working and construction
Easy: Explain how a transformer works. Why does it work only on AC? (Reported: L&T, Havells, Hitachi Energy, Schneider, NTPC, BHEL)
Easy: Name the main parts of a transformer and the types you know. (Reported: Siemens Energy, Siemens, Tata Power)
Easy: Why is the transformer core laminated, and why silicon steel?
Intermediate: What happens if you connect a transformer primary to a DC supply of the same voltage?
Intermediate: (follow-up) Sketch the flux and the secondary current for a sinusoidal primary voltage. (Reported: NTPC)
Good answers cover: mutual induction, changing flux links both windings, V1/V2 = N1/N2; DC gives no back EMF, so only winding resistance limits current (overheating, saturation); laminations cut eddy-current loss, silicon steel cuts hysteresis loss; core, windings, tank, oil, conservator, bushings, breather, tap changer; core vs shell type.

## Transformer rating, losses and efficiency
Easy: Why is a transformer rated in kVA and not kW? (Reported: Siemens Energy, Bajaj Electricals)
Easy: What are the losses in a transformer and what does each depend on? (Reported: Tata Power, POWERGRID)
Intermediate: (follow-up) Then why are motors rated in kW?
Intermediate: What do the open-circuit and short-circuit tests tell you, and on which side is each done?
Hard: At what load is a transformer's efficiency maximum, and why do distribution transformers aim for it at lower load than power transformers?
Hard: What decides a transformer's fault level, and why does a lower-impedance transformer need breakers with a higher breaking capacity?
Good answers cover: copper loss depends on current, iron loss on voltage, neither on load power factor, so kVA; motor output is mechanical, so kW; OC test on LV side gives core loss, SC test on HV side gives copper loss and impedance; maximum efficiency when copper loss equals iron loss; fault MVA = rating / Z = 5 MVA, I = 5000 / (1.732 x 0.415) about 7 kA.

## Transformer operation: energising, connections and parallel running
Hard: What happens at the moment a transformer is energised? Why can the breaker trip with no fault? (Reported: Tata Power)
Intermediate: Why are distribution transformers usually delta-star (for example Dyn11)?
Hard: Explain transformer vector groups. (Reported: Siemens Energy)
Intermediate: What conditions must be met to run two transformers in parallel?
Easy: What is a tap changer for, and what is the difference between on-load and off-load tap changing?
Easy: Why do transformers need cooling, and what is ONAN versus ONAF? (Reported: Siemens Energy)
Good answers cover: inrush current (residual flux, switching instant, core saturation, 6-10x rated, rich in second harmonic, so differential relays use harmonic restraint); delta primary traps triplen harmonics and handles unbalance, star secondary gives a neutral for single-phase loads; Dyn11 means LV leads HV by 30 degrees; parallel: same ratio, polarity, phase sequence and vector group, similar per-unit impedance; OLTC regulates voltage under load.

## Induction motor principle, slip and losses
Easy: How does a three-phase induction motor work? (Reported: Siemens Energy, Torrent Power, L&T Power)
Easy: What types of motors do you know, and which is the most widely used in industry and why? (Reported: Emami, Siemens Energy, Havells, Hitachi Energy, L&T)
Easy: Why can an induction motor never run at synchronous speed?
Intermediate: How is an induction motor like a transformer, and where does the analogy break down?
Easy: What are the losses in an induction motor? (Reported: L&T Power)
Easy: Why does an induction motor always run slightly below synchronous speed, and what does the slip tell you about its load?
Good answers cover: rotating magnetic field from three-phase supply, induced rotor current, torque; at synchronous speed there is no relative motion, no induced current, no torque, so slip is needed; Ns = 120f/P = 1500 rpm, slip = 4%; rotor as a short-circuited rotating secondary; stator and rotor copper loss, core loss, friction and windage; squirrel cage is rugged, cheap, low maintenance.

## Induction motor starting and speed control
Easy: Why is a star-delta starter used for induction motors? (Reported: ABB, Adani Electricity)
Intermediate: (follow-up) What is its disadvantage, and why not start a large motor direct-on-line?
Easy: Why is the starting current of an induction motor so high?
Intermediate: How can the speed of an induction motor be controlled? When would you use a VFD instead of a starter?
Hard: How can harmonics produced in an induction-motor drive be reduced? (Reported: ABB)
Intermediate: Two motors of the same power run at 415 V and 3.3 kV. Which draws less current, and why are large motors built for higher voltages? (Reported as a concept question: Siemens Energy)
Good answers cover: at standstill slip is 1, rotor acts like a shorted secondary, so starting current is 5-7x rated; star-delta applies 1/root 3 phase voltage, so starting current and torque fall to one third; low starting torque is the drawback; DOL causes voltage dips on the network; speed control by V/f (VFD), pole changing, rotor resistance for slip-ring motors; I = P / (1.732 x V x pf x efficiency), so higher voltage means proportionally less current.

## Single-phase induction motors
Easy: How does a single-phase induction motor work? (Reported: ReNew)
Easy: (follow-up) Why is it not self-starting, and how is it made self-starting?
Intermediate: Where would you use a capacitor-start versus a permanent split capacitor motor?
Good answers cover: a single winding gives a pulsating field, equal to two opposite rotating fields with zero net starting torque; an auxiliary winding with a capacitor (or resistance) shifts the phase to create a rotating field; centrifugal switch disconnects the start winding; fans and pumps use PSC, compressors need capacitor start for high torque.

## Synchronous machines and alternators
Easy: What is a synchronous generator, and how does an alternator work? (Reported: Adani Power, Siemens Gamesa, Torrent Power)
Easy: What is the difference between salient-pole and cylindrical rotors, and where is each used? (Reported: Siemens)
Intermediate: Why is a synchronous motor not self-starting, and how is it started?
Intermediate: What conditions must be met to synchronise an alternator with the grid?
Hard: How is a generator started and brought onto the grid in a power plant? (Reported: NTPC)
Hard: What happens to power factor when you change the field current of a synchronous motor (V-curves)?
Good answers cover: DC field on the rotor, rotating flux induces three-phase EMF in the stator; salient pole for low-speed hydro, cylindrical for high-speed steam and gas turbines; a stationary rotor cannot lock onto a fast rotating field, so damper windings or a VFD start it; synchronising needs equal voltage, frequency, phase sequence and phase angle (synchroscope); over-excitation gives leading pf (synchronous condenser).

## DC machines and special motors
Easy: Why is the starting current of a DC motor high? (Reported: Bajaj Electricals)
Easy: Why must a DC series motor never be started on no load? (Reported: Bajaj Electricals)
Intermediate: How is the speed of a DC series motor controlled? (Reported: Siemens Energy)
Easy: Which motor gives the highest starting torque, and why was it used for traction?
Intermediate: What are servo motors and stepper motors used for? (Reported: Havells)
Good answers cover: at standstill there is no back EMF, so I = V / Ra and a starter resistance is needed; series motor speed rises dangerously at no load because flux falls with current; speed control by field diverter, armature voltage or series resistance; series motor torque is proportional to current squared; servo for closed-loop position control, stepper for open-loop positioning.

## Machine maintenance and field practice
Intermediate: How is maintenance of motors and transformers done, and which parameters do you check? (Reported: L&T, Thermax, Tata Steel)
Hard: A motor is overheating in a plant. What do you check, in order?
Intermediate: What causes transformer humming, and when is a change in the sound a warning? (Reported: Bajaj Electricals)
Hard: What is checked in transformer oil, and what does dissolved gas analysis tell you?
Good answers cover: insulation resistance with a megger, winding resistance, vibration, bearing temperature and lubrication, load current against nameplate, supply voltage unbalance, ventilation and cooling; magnetostriction causes hum, louder hum suggests overvoltage or loose core; oil breakdown voltage, moisture, acidity; DGA gases (hydrogen, acetylene for arcing, CO for paper insulation) reveal incipient faults.
