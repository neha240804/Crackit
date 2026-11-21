---
doc_type: questions
subject: Power electronics and electric drives (SCR, MOSFET, IGBT, inverters, VFD)
role_family: power_electronics
---

# Power electronics and drives interview questions

Source: reports/Electrical fresher interview questions.md. "Reported" = a candidate said it was
asked (company in brackets); unmarked lines are standard preparation questions.
Each question is tagged by difficulty: Easy, Intermediate or Hard.

## Power semiconductor devices
Easy: What is a power semiconductor device? How is a power diode different from a signal diode? (Reported: GE)
Intermediate: Compare SCR, MOSFET and IGBT. Where would you use each? 
Intermediate: How is an SCR turned on and turned off? Draw its reverse-blocking condition. (Reported: Hind Rectifiers)
Intermediate: What do you know about IGBTs and the semiconductors used in solar and LED products? (Reported: Havells)
Good answers cover: power devices handle high voltage and current as switches, with thicker drift regions and heat sinking; SCR is latching, turned on by a gate pulse and off only when current falls below holding current (natural or forced commutation), used in HVDC and high-power rectifiers; MOSFET is fast and suits low voltage and high frequency (SMPS); IGBT combines MOS gate drive with bipolar conduction for medium and high power (VFDs, inverters, EVs).

## Rectifiers, inverters and PWM
Easy: How does a rectifier work? What do the capacitor and inductor filters do? (Reported: Schneider)
Easy: What is PWM, and why is it used?
Easy: How does an inverter produce AC from DC? (Reported: GE Vernova)
Hard: What is a 12-pulse converter, and why is it better than a 6-pulse one? (Reported: POWERGRID)
Good answers cover: diode bridge converts AC to pulsating DC, capacitor smooths voltage, inductor smooths current; PWM varies the duty cycle to control average voltage with low switching loss; inverters switch DC across the load in a pattern (sinusoidal PWM) and filter it; a 12-pulse converter uses two 6-pulse bridges fed 30 degrees apart (star and delta transformers), cancelling the 5th and 7th harmonics.

## Drives: VFD (variable frequency drive) and soft starter
Intermediate: What is a VFD? Draw its basic block diagram. (Reported: Thermax)
Intermediate: Why is V/f kept constant when changing motor speed?
Intermediate: When would you choose a soft starter instead of a VFD?
Hard: What problems can a VFD cause in a plant, and how are they handled?
Good answers cover: rectifier, DC link capacitor, IGBT inverter; varying frequency changes speed, and V/f is held constant to keep flux constant, avoiding saturation or weak torque; a soft starter only ramps voltage during starting with SCRs and is cheaper; VFDs suit variable-speed loads (fans and pumps save energy by the cube law); issues: harmonics (line reactors, filters, 12-pulse), bearing currents, long-cable overvoltages (dV/dt filters), braking energy (braking resistor or regeneration).

## DC-DC converters and applications
Intermediate: How does a buck converter step voltage down? What is the role of the inductor and diode?
Easy: What is the difference between a linear regulator and an SMPS?
Intermediate: How is a solar inverter different from a home UPS inverter?
Easy: How does a buck converter's duty cycle control its output voltage, and what happens as you reduce it?
Good answers cover: buck output = duty cycle x input (12 V at 50%, 6 V at 25%), inductor stores and releases energy, diode or synchronous switch carries current when the switch is off; linear regulators waste the voltage difference as heat, SMPS switch at high frequency for high efficiency; solar inverters track maximum power (MPPT) and synchronise with the grid, UPS inverters run from batteries during outages.
