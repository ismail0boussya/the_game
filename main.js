const missionForm = document.getElementById('missionForm');

if (missionForm) {
    const destinationInput = document.getElementById('destination');
    const budgetInput = document.getElementById('budget');
    const fuelInput = document.getElementById('fuel');
    const fuelValue = document.getElementById('fuelValue');
    const destinationBrief = document.getElementById('destinationBrief');
    const missionChecks = document.getElementById('missionChecks');
    const aiSuggestion = document.getElementById('aiSuggestion');
    const resultPanel = document.getElementById('simulationResult');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const scoreValue = document.getElementById('scoreValue');
    const destinationDetails = {
        leo: {
            brief: 'A nearby orbit needs less fuel. Choose a camera or sensors for a climate-monitoring satellite, or adapt the mission to deliver supplies.',
            minimumFuel: 20,
            requiredRocket: 0
        },
        moon: {
            brief: 'A lunar south-pole landing needs enough fuel, a medium or heavy rocket, sensors to study ice, and a heat shield to protect the lander.',
            minimumFuel: 50,
            requiredRocket: 1
        },
        mars: {
            brief: 'Mars is a long, cold journey. Plan for a heavy rocket, high fuel, sensors, a landing heat shield, and an RTG for reliable power.',
            minimumFuel: 75,
            requiredRocket: 2
        }
    };
    const rockets = {
        light: {
            label: 'Light rocket',
            cost: 80,
            payloadCapacity: { leo: 1000, moon: 0, mars: 0 },
            fuelCapacity: 10000,
            launchMassCapacity: 12000
        },
        medium: {
            label: 'Medium rocket',
            cost: 180,
            payloadCapacity: { leo: 3500, moon: 1200, mars: 0 },
            fuelCapacity: 28000,
            launchMassCapacity: 32000
        },
        heavy: {
            label: 'Heavy rocket',
            cost: 420,
            payloadCapacity: { leo: 8000, moon: 4000, mars: 1500 },
            fuelCapacity: 75000,
            launchMassCapacity: 85000
        }
    };
    const payloadOptions = {
        camera: { label: 'high-resolution camera', mass: 120, cost: 35 },
        spectrometer: { label: 'sensors and spectrometer', mass: 80, cost: 50 },
        heatshield: { label: 'heat shield', mass: 450, cost: 70 }
    };
    const powerOptions = {
        solar: { label: 'solar panels', mass: 80, cost: 20 },
        rtg: { label: 'nuclear RTG', mass: 200, cost: 90 }
    };
    const missionBusMass = 250;

    function selectedValue(name) {
        const selected = missionForm.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : '';
    }

    function getDesign() {
        const destination = destinationInput.value;
        const rocket = rockets[selectedValue('rocket')];
        const powerName = selectedValue('power');
        const power = powerOptions[powerName];
        const payloadNames = Array.from(missionForm.querySelectorAll('input[name="payload"]:checked'))
            .map((input) => input.value);
        const payloadMass = payloadNames.reduce((total, name) => total + payloadOptions[name].mass, 0);
        const payloadCost = payloadNames.reduce((total, name) => total + payloadOptions[name].cost, 0);
        const fuelPercent = Number(fuelInput.value);
        const fuelMass = Math.round(rocket.fuelCapacity * fuelPercent / 100);
        const totalMass = missionBusMass + payloadMass + power.mass + fuelMass;
        const totalCost = rocket.cost + payloadCost + power.cost + fuelMass / 1000;
        const budget = Number(budgetInput.value);
        const payloadCapacity = rocket.payloadCapacity[destination];
        const requirements = destinationDetails[destination];
        const checks = [
            {
                pass: Object.keys(rockets).indexOf(selectedValue('rocket')) >= requirements.requiredRocket,
                message: `${requirements.requiredRocket === 0 ? 'A light' : requirements.requiredRocket === 1 ? 'A medium or heavy' : 'A heavy'} rocket is recommended for this destination.`
            },
            {
                pass: payloadCapacity > 0 && payloadMass + power.mass <= payloadCapacity,
                message: payloadCapacity === 0
                    ? `${rocket.label} cannot deliver this mission to the selected destination.`
                    : `Spacecraft payload and power system must fit within ${payloadCapacity.toLocaleString()} kg.`
            },
            {
                pass: totalMass <= rocket.launchMassCapacity,
                message: `Total launch mass must stay within ${rocket.launchMassCapacity.toLocaleString()} kg for this rocket.`
            },
            {
                pass: fuelPercent >= requirements.minimumFuel,
                message: `This destination needs at least ${requirements.minimumFuel}% fuel for the journey.`
            },
            {
                pass: destination === 'leo'
                    ? payloadNames.includes('camera') || payloadNames.includes('spectrometer')
                    : payloadNames.includes('spectrometer') && payloadNames.includes('heatshield'),
                message: destination === 'leo'
                    ? 'Choose a camera or sensors to give the mission a science objective.'
                    : 'This landing mission needs sensors and a heat shield.'
            },
            {
                pass: destination !== 'mars' || powerName === 'rtg',
                message: 'Mars missions need an RTG to provide power through long nights and low sunlight.'
            },
            {
                pass: Number.isFinite(budget) && budget >= 100 && budget <= 1000 && totalCost <= budget,
                message: Number.isFinite(budget) && budget >= 100 && budget <= 1000
                    ? `Estimated cost must fit within your $${budget.toLocaleString()}M budget.`
                    : 'Enter a mission budget between $100M and $1,000M.'
            }
        ];

        return { destination, rocket, power, payloadNames, payloadMass, fuelPercent, fuelMass, totalMass, totalCost, budget, checks };
    }

    function advisorMessage(design) {
        const failedCheck = design.checks.find((check) => !check.pass);
        if (failedCheck) {
            return `Design adjustment: ${failedCheck.message}`;
        }
        if (design.destination === 'mars') {
            return 'Your Mars design meets the core requirements. Consider whether the added RTG and fuel costs leave enough room in your budget for mission operations.';
        }
        if (design.destination === 'moon') {
            return 'Your lunar lander is within the mission limits. A spectrometer and heat shield let you investigate the south pole and protect the probe on landing.';
        }
        return 'Your Earth-orbit mission is ready. Keep the payload lean to reserve more of the budget for communications and mission operations.';
    }

    function updateMission() {
        const design = getDesign();
        const rocketName = selectedValue('rocket');
        fuelValue.value = `${design.fuelPercent}%`;
        destinationBrief.textContent = destinationDetails[design.destination].brief;
        document.getElementById('costMetric').textContent = `$${design.totalCost.toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
        document.getElementById('payloadMetric').textContent = `${(design.payloadMass + design.power.mass).toLocaleString()} kg`;
        document.getElementById('fuelMetric').textContent = `${design.fuelMass.toLocaleString()} kg`;
        document.getElementById('massMetric').textContent = `${design.totalMass.toLocaleString()} kg`;
        missionChecks.replaceChildren();

        design.checks.forEach((check) => {
            const item = document.createElement('p');
            item.className = `check_item${check.pass ? ' pass' : ''}`;
            item.textContent = `${check.pass ? '✓' : '!' } ${check.message}`;
            missionChecks.append(item);
        });

        aiSuggestion.textContent = advisorMessage(design);
        resultPanel.hidden = true;
        resultPanel.dataset.rocket = rocketName;
    }

    missionForm.addEventListener('input', updateMission);
    missionForm.addEventListener('change', updateMission);
    missionForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const design = getDesign();
        const passedChecks = design.checks.filter((check) => check.pass).length;
        const score = Math.round(passedChecks / design.checks.length * 100);
        const isSuccessful = passedChecks === design.checks.length;
        resultTitle.textContent = isSuccessful ? 'Mission success!' : 'Launch scrubbed';
        resultMessage.textContent = isSuccessful
            ? `The ${design.rocket.label.toLowerCase()} is cleared for ${design.destination === 'leo' ? 'low Earth orbit' : design.destination === 'moon' ? 'the Moon' : 'Mars'}. Your mission stayed within its budget and passed all ${design.checks.length} engineering checks.`
            : `The mission passed ${passedChecks} of ${design.checks.length} engineering checks. Resolve the highlighted design constraints, then run the simulation again.`;
        scoreValue.textContent = `${score}%`;
        resultPanel.hidden = false;
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    document.getElementById('redesignButton').addEventListener('click', () => {
        resultPanel.hidden = true;
        destinationInput.focus();
    });

    updateMission();
}
