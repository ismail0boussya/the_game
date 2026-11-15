const hardMissionForm = document.getElementById('hardMissionForm');

if (hardMissionForm) {
    const payloadSystems = {
        camera: { label: 'context camera', mass: 80, cost: 45, power: 10 },
        drill: { label: 'subsurface drill', mass: 180, cost: 90, power: 30 },
        spectrometer: { label: 'organic-molecule spectrometer', mass: 140, cost: 110, power: 25 },
        biosignature: { label: 'contamination-controlled life detector', mass: 160, cost: 145, power: 35 },
        cache: { label: 'sealed sample cache', mass: 110, cost: 85, power: 10 }
    };
    const vehicleSystems = {
        medium: { label: 'Medium lift', cost: 180, capacity: 1800 },
        heavy: { label: 'Heavy lift', cost: 620, capacity: 3750 }
    };
    const powerSystems = {
        solar: { label: 'Solar array and battery', mass: 120, cost: 65, supply: 70 },
        rtg: { label: 'Nuclear RTG', mass: 260, cost: 220, supply: 150 }
    };
    const communications = {
        direct: { label: 'Direct-to-Earth antenna', mass: 60, cost: 60, hours: 4 },
        relay: { label: 'Orbiter relay link', mass: 120, cost: 150, hours: 8 }
    };
    const landingSystems = {
        basic: { label: 'Parachute and basic heat shield', mass: 420, cost: 120 },
        skycrane: { label: 'Guided sky crane and heat shield', mass: 700, cost: 210 }
    };
    const thermalSystems = {
        basic: { label: 'Basic insulation', mass: 70, cost: 60 },
        rugged: { label: 'Rugged heaters and insulation', mass: 140, cost: 135 }
    };
    const baseRoverMass = 780;
    const baseRoverCost = 320;
    const operationsCost = 180;
    const fuelCapacity = 1400;
    const basePowerDemand = 35;
    const hardChecks = document.getElementById('hardChecks');
    const hardResult = document.getElementById('hardResult');

    function selectedValue(name) {
        const selected = hardMissionForm.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : '';
    }

    function readDesign() {
        const vehicle = vehicleSystems[selectedValue('rocket')];
        const power = powerSystems[selectedValue('power')];
        const communication = communications[selectedValue('communications')];
        const landing = landingSystems[selectedValue('landing')];
        const thermal = thermalSystems[selectedValue('thermal')];
        const selectedPayload = Array.from(hardMissionForm.querySelectorAll('input[name="payload"]:checked'))
            .map((input) => input.value);
        const scienceMass = selectedPayload.reduce((sum, key) => sum + payloadSystems[key].mass, 0);
        const scienceCost = selectedPayload.reduce((sum, key) => sum + payloadSystems[key].cost, 0);
        const sciencePower = selectedPayload.reduce((sum, key) => sum + payloadSystems[key].power, 0);
        const fuelPercent = Number(document.getElementById('hardFuel').value);
        const fuelMass = Math.round(fuelCapacity * fuelPercent / 100);
        const roverSystemsMass = baseRoverMass + scienceMass + power.mass + communication.mass + landing.mass + thermal.mass;
        const totalMass = roverSystemsMass + fuelMass;
        const totalCost = vehicle.cost + baseRoverCost + scienceCost + power.cost + communication.cost
            + landing.cost + thermal.cost + operationsCost + fuelMass / 1000 * 80;
        const budget = Number(document.getElementById('hardBudget').value);
        const powerDemand = basePowerDemand + sciencePower;
        const checks = [
            {
                pass: selectedValue('rocket') === 'heavy',
                message: 'A heavy-lift launch vehicle is mandatory for the Mars transfer and landing stack.'
            },
            {
                pass: ['drill', 'spectrometer', 'biosignature', 'cache'].every((key) => selectedPayload.includes(key)),
                message: 'The objective requires a drill, spectrometer, life detector, and sealed sample cache.'
            },
            {
                pass: fuelPercent >= 80,
                message: 'Fuel reserve must be at least 80% for transfer, corrections, and Mars arrival.'
            },
            {
                pass: totalMass <= vehicle.capacity,
                message: totalMass <= vehicle.capacity
                    ? `Launch mass is ${totalMass.toLocaleString()} kg, within the ${vehicle.capacity.toLocaleString()} kg Mars limit.`
                    : `Total launch mass is ${Math.max(0, totalMass - vehicle.capacity).toLocaleString()} kg above this vehicle's Mars limit of ${vehicle.capacity.toLocaleString()} kg.`
            },
            {
                pass: power.supply >= powerDemand,
                message: `Power demand is ${powerDemand} units; ${power.label} supplies ${power.supply}. Select a system that survives dust and winter darkness.`
            },
            {
                pass: communication.hours >= 6,
                message: 'The rover needs at least 6 Earth-contact hours per day to return science and receive commands.'
            },
            {
                pass: selectedValue('landing') === 'skycrane',
                message: 'Jezero terrain requires guided sky-crane landing for a safe, precise touchdown.'
            },
            {
                pass: selectedValue('thermal') === 'rugged',
                message: 'A two-year surface mission needs rugged heaters and insulation for Martian nights.'
            },
            {
                pass: Number.isFinite(budget) && budget >= 1800 && budget <= 2600 && totalCost <= budget,
                message: Number.isFinite(budget) && budget >= 1800 && budget <= 2600
                    ? `Mission cost must fit the entered budget of $${budget.toLocaleString()}M (maximum $2,600M).`
                    : 'Set a valid budget between $1,800M and $2,600M.'
            }
        ];
        return {
            vehicle, power, communication, landing, thermal, selectedPayload, scienceMass, fuelPercent,
            fuelMass, roverSystemsMass, totalMass, totalCost, budget, powerDemand, checks
        };
    }

    function advisorText(design) {
        const firstIssue = design.checks.find((check) => !check.pass);
        if (firstIssue) {
            return `Critical design issue: ${firstIssue.message}`;
        }
        if (design.totalMass > design.vehicle.capacity * 0.95) {
            return 'The rover is close to the mass ceiling. Consider removing the optional context camera or reducing fuel only if the 80% minimum remains satisfied.';
        }
        if (design.totalCost > design.budget * 0.96) {
            return 'All hard constraints pass, but your budget reserve is thin. The context camera is optional; removing it creates room for unexpected operations costs.';
        }
        return 'All design constraints currently pass. You have mass and budget margin to absorb small mission changes before launch.';
    }

    function updateDesign() {
        const design = readDesign();
        document.getElementById('hardFuelValue').value = `${design.fuelPercent}%`;
        document.getElementById('hardCost').textContent = `$${design.totalCost.toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
        document.getElementById('hardPayloadMass').textContent = `${design.roverSystemsMass.toLocaleString()} kg`;
        document.getElementById('hardFuelMass').textContent = `${design.fuelMass.toLocaleString()} kg`;
        document.getElementById('hardTotalMass').textContent = `${design.totalMass.toLocaleString()} / ${design.vehicle.capacity.toLocaleString()} kg`;
        document.getElementById('hardPower').textContent = `${design.power.supply} / ${design.powerDemand} units`;
        document.getElementById('hardContact').textContent = `${design.communication.hours} h/day`;
        document.getElementById('hardStatusSummary').textContent = `${design.checks.filter((check) => check.pass).length} of ${design.checks.length} constraints passed`;
        hardChecks.replaceChildren();

        design.checks.forEach((check) => {
            const item = document.createElement('p');
            item.className = `check_item${check.pass ? ' pass' : ''}`;
            item.textContent = `${check.pass ? '✓' : '!'} ${check.message}`;
            hardChecks.append(item);
        });

        document.getElementById('hardAdvice').textContent = advisorText(design);
        hardResult.hidden = true;
    }

    hardMissionForm.addEventListener('input', updateDesign);
    hardMissionForm.addEventListener('change', updateDesign);
    hardMissionForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const design = readDesign();
        const passedChecks = design.checks.filter((check) => check.pass).length;
        const ready = passedChecks === design.checks.length;
        document.getElementById('hardResultTitle').textContent = ready ? 'Mars mission success' : 'Mission failed before touchdown';
        document.getElementById('hardResultMessage').textContent = ready
            ? 'The rover landed safely in Jezero Crater and completed its two-year biosignature search. Every required system stayed within the engineering and budget limits.'
            : `The mission passed ${passedChecks} of ${design.checks.length} hard constraints. One or more failures would prevent a safe landing or a complete science mission.`;
        document.getElementById('hardScore').textContent = `${Math.round(passedChecks / design.checks.length * 100)}%`;

        const events = ready
            ? [
                ['1 · Interplanetary cruise', `${design.fuelPercent}% reserve supported trajectory corrections on the way to Mars.`],
                ['2 · Entry and landing', `${design.landing.label} delivered the ${design.totalMass.toLocaleString()} kg stack to Jezero Crater.`],
                ['3 · Two-year surface mission', `${design.power.label} supplied ${design.powerDemand} required power units; ${design.thermal.label} protected the rover.`],
                ['4 · Science return', `${design.communication.label} returned drill, spectrometer, life-detector, and sample-cache results to Earth.`]
            ]
            : design.checks.filter((check) => !check.pass).slice(0, 4)
                .map((check, index) => [`Mission blocker ${index + 1}`, check.message]);
        const timeline = document.getElementById('hardTimeline');
        timeline.replaceChildren();
        events.forEach(([title, detail]) => {
            const eventCard = document.createElement('div');
            eventCard.className = 'timeline_event';
            const heading = document.createElement('strong');
            const description = document.createElement('span');
            heading.textContent = title;
            description.textContent = detail;
            eventCard.append(heading, description);
            timeline.append(eventCard);
        });

        hardResult.hidden = false;
        hardResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    document.getElementById('hardRedesign').addEventListener('click', () => {
        hardResult.hidden = true;
        document.getElementById('hardBudget').focus();
    });

    updateDesign();
}
