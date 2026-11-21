---
doc_type: questions
subject: Electrical earthing, testing, measurement and safety (megger, CT and PT, cables)
role_family: earthing_safety
---

# Earthing, testing, measurement and site-practice interview questions

Source: reports/Electrical fresher interview questions.md. "Reported" = a candidate said it was
asked (company in brackets); unmarked lines are standard preparation questions.
Each question is tagged by difficulty: Easy, Intermediate or Hard. These practical
questions are where reported evidence is richest: panels want to know you can reason on site.

## Earthing and its purpose
Easy: Why must all electrical equipment be earthed? (Reported)
Easy: What types of earthing are there? What is the difference between body earthing and neutral earthing? (Reported: Hitachi Energy)
Easy: What is an earth pit? What is an earth grid? (Reported: L&T)
Intermediate: How is earth resistance measured, which instrument is used, and what value is acceptable? (Reported: L&T)
Hard: What are step and touch potential, and how does a substation design keep them safe?
Good answers cover: earthing gives fault current a low-resistance path so protection operates and exposed metal stays near earth potential; equipment (body) earthing for safety, system (neutral) earthing for stable voltages and fault detection; pipe, plate, rod and strip electrodes, with salt and charcoal or chemical fill; earth tester using the fall-of-potential (3-point) method; the acceptable value depends on the installation (large substations aim for about 1 ohm or less), so say how it is decided rather than quote one number; grid design and a gravel layer limit step and touch voltages.

## Insulation resistance and the megger
Easy: What is a megger and why is it used? (Reported: L&T)
Intermediate: What is insulation resistance, and what value should it have? (Reported: L&T)
Hard: What is the polarisation index, and what does a low value tell you?
Intermediate: (follow-up) Why is a megger test done with DC and not AC?
Good answers cover: an insulation resistance tester applying 500 V to 5 kV DC; a common rule of thumb is at least 1 megaohm per kV plus 1 megaohm, and trends matter more than one reading; temperature and moisture lower IR; PI = 10-minute IR / 1-minute IR, above 2 is healthy, below 1 suggests moisture or contamination; DC avoids capacitive charging current masking the leakage current.

## CTs and PTs (current and potential transformers)
Easy: What is the role of CTs and PTs in a switchgear panel? (Reported)
Intermediate: Why must a CT secondary never be left open while the primary carries current? (Reported)
Intermediate: (follow-up) What must you do before removing a meter or relay from a live CT circuit?
Hard: What is the difference between a metering CT and a protection CT?
Good answers cover: CTs and PTs step current and voltage down to safe standard values (1 A or 5 A, 110 V) and isolate meters and relays from high voltage; with the secondary open there is no opposing ampere-turns, so the whole primary current magnetises the core, causing very high secondary voltage, insulation failure, danger to people and core overheating; short the secondary terminals first; metering CTs are accurate at normal current and saturate early to protect meters, protection CTs stay accurate up to many times rated current (class 5P, accuracy limit factor).

## Electrical testing and site safety
Easy: Which testing equipment have you used, and how do you use it safely? (Reported: Tata Power)
Hard: How are HT and LT panels tested before commissioning? (Reported: BHEL)
Easy: How do you ensure safety on an electrical site? (Reported: Havells)
Easy: What electrical hazards exist, and what PPE is used?
Good answers cover: multimeter, clamp meter, megger, earth tester, phase-sequence meter, relay test kit; panel tests: IR, high-voltage withstand, CT and PT ratio and polarity, relay testing, breaker timing, earth continuity; safety: permit-to-work, lockout-tagout, isolate, test for dead, earth before touching, insulated gloves, mats and tools, arc-flash PPE.

## Cables and their selection
Hard: How do you select a cable for an application? (Reported in candidate question lists)
Intermediate: Compare XLPE and PVC insulated cables. Why are cables armoured?
Intermediate: When sizing the supply cable for a three-phase motor, why do its power factor and efficiency matter, and what else decides the cable size?
Good answers cover: load current, voltage drop (often limited to a few percent), short-circuit withstand, installation method and derating for grouping, temperature and soil; XLPE runs at 90 C against 70 C for PVC, so it carries more current; armour gives mechanical protection and an earth path; I = 15000 / (1.732 x 415 x 0.85 x 0.9) about 27 A, then pick a size with derating.

## Troubleshooting, maintenance and energy saving
Hard: An MCB or relay keeps tripping. How do you find the cause? 
Intermediate: A circuit is not working. How do you troubleshoot it step by step?
Hard: How would you reduce a factory's electricity bill? (Reported: L&T)
Intermediate: What is your approach to preventive maintenance? 
Easy: How does an electric iron work? How does a tube light start? (Reported: Havells, Bajaj Electricals)
Good answers cover: separate overload, short circuit and earth leakage (check load current, insulation resistance, neutral-earth faults, loose connections, failing device); work from supply to load with a meter; energy saving through power-factor correction to avoid penalties, efficient motors and VFDs on fans and pumps, load scheduling to reduce maximum demand, LED lighting, energy audits; maintenance by schedule and condition (thermography, IR trends, vibration); Joule heating with a thermostat; the choke and starter create a high-voltage kick to strike the tube.

## Metering and industrial automation
Easy: How does an energy meter work, and what is a smart meter? (Reported: Torrent Power)
Intermediate: How does an electromagnetic flow meter work? (Reported: Torrent Power)
Intermediate: What are the parts of a PLC, and what is a scan cycle?
Good answers cover: electronic meters sample voltage and current and integrate power over time, smart meters add two-way communication and prepaid billing; flow meter uses Faraday's law, a conductive liquid crossing a magnetic field induces a voltage proportional to velocity; PLC: power supply, CPU, input and output modules, communication; scan cycle reads inputs, executes the ladder logic, updates outputs.
