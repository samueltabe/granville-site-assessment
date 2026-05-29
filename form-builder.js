(function () {
    const statusClass = {
      "Must complete on site": "site",
      "On-site start": "site",
      "On-site": "site",
      "Can complete later": "later",
      "Office / follow-up": "later",
      "Client / sales input": "client",
      "End of visit / office": "risk"
    };

    const options = {
      yesNo: ["Select", "Yes", "No", "To be confirmed", "N/A"],
      condition: ["Select", "Good", "Fair", "Poor", "Damaged", "Not accessible"],
      phases: ["Select", "Single-phase", "Three-phase", "Split-phase", "Unknown"],
      supplyType: ["Select", "LV", "MV", "HV", "Unknown"],
      method: ["Select method", "Physical Site Visit", "Remote / Desktop", "Hybrid"],
      assessmentType: ["Select type", "Residential", "Commercial", "Industrial", "Agricultural", "Utility-Scale"],
      sector: ["Select sector", "Residential", "Commercial", "Industrial", "Agricultural", "Public sector", "Utility"],
      dataAvailability: ["Select", "Bills available", "Bills to be emailed / sent later", "Interval data available", "New building / no consumption history", "No reliable data"],
      status: ["No", "Yes", "To be sent", "In progress", "N/A"],
      confidence: ["Select", "High", "Medium", "Low"],
      overheating: ["Select", "No", "Minor", "Yes", "Not accessible"],
      trenching: ["Select", "No", "Partial", "Yes", "To be confirmed"]
    };

    const sections = [
      {
        tag: "On-site start",
        title: "Assessment Setup",
        intro: "Identify the assessment type, visit method, reference, assessors, and client representative before the site walk begins.",
        groups: [
          { title: "Assessment Info", fields: [
            f("Assessment Type", "select", { required: true, options: options.assessmentType }),
            f("Assessment Method", "select", { required: true, options: options.method, id: "assessmentMethod" }),
            f("Reference ID", "text", { id: "refId", placeholder: "Auto-generated or project reference" }),
            f("Date of Assessment", "date", { id: "assessDate", required: true }),
            f("Start Time", "time"),
            f("End Time", "time")
          ]},
          { title: "Remote Assessment", condition: "remote", fields: [
            f("Data Source(s)", "textarea", { placeholder: "Client photos, satellite view, drawings, video call..." }),
            f("Remote Confidence Level", "select", { options: options.confidence, id: "remoteConfidence" })
          ]},
          { title: "Assessor(s)", fields: [
            f("Primary Assessor Name", "text", { required: true, placeholder: "Full name" }),
            f("Role / Title", "text", { placeholder: "Site Engineer" }),
            f("Email", "email", { placeholder: "assessor@granville-energy.com" }),
            f("Contact Number", "tel", { placeholder: "+27 ..." }),
            f("Second Assessor", "text", { placeholder: "Full name" }),
            f("Second Assessor Role", "text", { placeholder: "Structural observer" })
          ]},
          { title: "Client / Site Representative", fields: [
            f("Name", "text", { required: true, placeholder: "Full name" }),
            f("Role / Title", "text", { placeholder: "Facilities Manager" }),
            f("Contact Number", "tel", { required: true }),
            f("Email", "email")
          ]}
        ]
      },
      {
        tag: "On-site start",
        title: "Client, Site & Access Overview",
        intro: "Arrival, client identity, address, access rules, security, vehicle access, offloading, and general logistics now sit at the start of the form.",
        groups: [
          { title: "Client Information", fields: [
            f("Client / Company Name", "text", { required: true }),
            f("Deal / Project Name", "text"),
            f("Site Name", "text"),
            f("Sector / Site Type", "select", { options: options.sector })
          ]},
          { title: "Site Location", fields: [
            f("Street Address", "text", { required: true, full: true }),
            f("City / Town", "text", { required: true }),
            f("State / Province / Region", "text"),
            f("Country", "text", { value: "South Africa" }),
            f("Postal / ZIP Code", "text"),
            f("GPS Latitude", "number", { required: true, step: "any" }),
            f("GPS Longitude", "number", { required: true, step: "any" }),
            f("What3Words", "text"),
            f("Site Elevation", "text", { placeholder: "m above sea level" })
          ]},
          { title: "Site Access & Operations", fields: [
            f("Property / Facility Description", "textarea", { full: true }),
            f("Operating Hours", "text"),
            f("Security / Access Requirements", "textarea"),
            f("Site Access Restrictions", "textarea"),
            f("Shutdown / Outage Restrictions", "textarea"),
            f("HOA / Body Corporate / Heritage Restriction", "select", { options: options.yesNo }),
            f("Restriction Details", "textarea", { full: true })
          ]},
          { title: "Delivery & General Logistics", fields: [
            f("Nearest Offloading / Parking Point", "text"),
            f("Vehicle Access to Site", "select", { options: ["Select", "Bakkie", "Truck", "Crane truck", "Restricted", "Pedestrian only"] }),
            f("Crane / MEWP Access Available", "select", { options: options.yesNo }),
            f("Delivery / Logistics Notes", "textarea", { full: true })
          ]},
          photos("Embedded access photos", [
            p("Site Access / Delivery Route", true),
            p("Offloading / Parking Point", false),
            p("Security or access restriction", false)
          ])
        ]
      },
      {
        tag: "Client / sales input",
        title: "Client Requirements & Commercial Intent",
        intro: "Client and sales inputs are kept together and can be completed during the interview or later by the sales/design team.",
        notice: "Client / sales input - can be completed during client interview or later by sales/design team.",
        groups: [
          { title: "Primary Objectives", fields: [
            f("Primary Driver(s)", "textarea", { placeholder: "Cost saving, resilience, ESG, expansion, tariff management..." }),
            f("System Configuration", "select", { options: ["Select", "Grid-tied", "Hybrid", "Off-grid", "Backup only", "To be confirmed"] }),
            f("Desired System Size", "text", { placeholder: "kWp / kVA / kWh if known" })
          ]},
          { title: "Battery & Backup", fields: [
            f("Battery Storage Required", "select", { options: options.yesNo }),
            f("Required Backup Duration", "text", { placeholder: "Hours or business requirement" }),
            f("Critical Loads to Back Up", "textarea", { full: true }),
            f("Preferred Battery Chemistry", "select", { options: ["Select", "LFP", "NMC", "Lead-acid", "No preference", "Unknown"] })
          ]},
          { title: "Additional Requirements", fields: [
            f("EV Charging Required", "select", { options: options.yesNo }),
            f("EV Charging Details", "textarea"),
            f("Future Expansion Planned", "select", { options: options.yesNo }),
            f("Future Expansion Details", "textarea"),
            f("Any Other Client Requirements or Preferences", "textarea", { full: true })
          ]}
        ]
      },
      {
        tag: "Must complete on site",
        title: "Main Electrical Room / DB / Meter / Transformer",
        intro: "All supply, meter, transformer, DB, protection, earthing, PCC, wiring condition, and electrical-room photos are consolidated here.",
        groups: [
          { title: "Incoming Supply", fields: [
            f("Current Supply Source(s)", "text", { required: true, placeholder: "Utility, generator, PV, hybrid..." }),
            f("Utility / Municipality Provider", "text", { required: true }),
            f("Supply Type", "select", { options: options.supplyType, required: true }),
            f("Incoming Supply Voltage", "text", { required: true, placeholder: "230/400 V, 11 kV..." }),
            f("Frequency", "text", { value: "50 Hz" }),
            f("Number of Phases", "select", { options: options.phases, required: true }),
            f("Main Breaker / Incomer Rating", "text", { required: true, placeholder: "A" }),
            f("Notified Maximum Demand / NMD", "text"),
            f("Main Incoming Supply Location", "text", { full: true })
          ]},
          { title: "Meter & Transformer", fields: [
            f("Meter Type", "select", { options: ["Select", "Prepaid", "Postpaid", "Smart", "Bulk", "Bidirectional", "Unknown"], required: true }),
            f("Meter Location", "text", { required: true }),
            f("Meter Type / Model", "text"),
            f("On-Site Transformer Present", "select", { options: ["Select", "Yes", "No", "Unknown"], id: "transformerPresent", required: true }),
            f("Transformer Rating", "text", { condition: "transformer", placeholder: "kVA / MVA" }),
            f("Transformer Voltage", "text", { condition: "transformer" }),
            f("Transformer Ownership", "select", { condition: "transformer", options: ["Select", "Client", "Utility", "Landlord", "Unknown"] }),
            f("Distance: Transformer to Main DB", "text", { condition: "transformer", placeholder: "m" })
          ]},
          { title: "Main Distribution Board", fields: [
            f("Main DB Location", "text", { required: true }),
            f("Board Manufacturer / Type", "text"),
            f("Board Condition", "select", { options: options.condition, required: true }),
            f("Busbar Rating", "text"),
            f("Spare Ways / Breakers Available", "select", { options: options.yesNo }),
            f("Space for New Switchgear", "select", { options: options.yesNo })
          ]},
          { title: "DB Visual Condition", fields: [
            f("DB Overall Condition", "select", { options: options.condition, required: true }),
            f("Wiring Neatness", "select", { options: ["Select", "Good", "Acceptable", "Poor", "Unsafe", "Not accessible"] }),
            f("All Circuits Labelled", "select", { options: options.yesNo }),
            f("Signs of Overheating / Burn Marks", "select", { options: options.overheating, id: "overheating" }),
            f("DB Enclosure Intact / Sealed", "select", { options: options.yesNo }),
            f("Existing Wiring Appears Compliant", "select", { options: options.yesNo }),
            f("Wiring / DB Concerns", "textarea", { condition: "overheat", full: true }),
            f("On-Site Measurements Taken", "select", { options: options.yesNo }),
            f("Add Measurement", "textarea", { full: true, placeholder: "Voltage, current, phase balance, earth reading..." })
          ]},
          { title: "Protection & Earthing", fields: [
            f("Earthing Arrangement", "select", { options: ["Select", "TN-S", "TN-C-S", "TT", "IT", "Unknown"] }),
            f("Earthing Visible & Intact", "select", { options: options.yesNo, required: true }),
            f("Surge Protection Device Present", "select", { options: options.yesNo }),
            f("Existing Reverse Power Protection", "select", { options: options.yesNo }),
            f("Anti-Islanding Protection Present", "select", { options: options.yesNo }),
            f("Lightning Protection Present", "select", { options: options.yesNo }),
            f("Power Quality Issues Reported", "textarea", { full: true }),
            f("Earth Electrode Location", "text"),
            f("Estimated Earthing Cable Run", "text", { placeholder: "m" }),
            f("New Earth Electrode Required", "select", { options: options.yesNo })
          ]},
          { title: "Metering, PCC & Controls", fields: [
            f("Likely PCC Location", "text", { required: true }),
            f("Distance: PCC to Inverter Area", "text", { placeholder: "m" }),
            f("Existing Import / Export Metering", "select", { options: options.yesNo }),
            f("CTs / VTs Available", "select", { options: options.yesNo }),
            f("Communication Route: PCC to Controller", "textarea"),
            f("SCADA / BMS Integration Required", "select", { options: options.yesNo }),
            f("Third-Party PLC / EMS Required", "select", { options: options.yesNo })
          ]},
          { title: "Grid Compliance", fields: [
            f("Applicable Grid Interconnection Standard", "text"),
            f("Export to Grid Permitted by Utility", "select", { options: options.yesNo }),
            f("Export Limit", "text"),
            f("Utility Application / Approval Required", "select", { options: options.yesNo }),
            f("Zero-Export Audit Logs Required", "select", { options: options.yesNo })
          ]},
          photos("Embedded electrical photos", [
            p("Main DB inside", true),
            p("Main DB outside/location", true),
            p("Utility meter face/serial", true),
            p("Transformer and rating plate", false, "transformer"),
            p("Earth point", true),
            p("DB defect / overheating photos", false, "overheat")
          ])
        ]
      },
      {
        tag: "On-site",
        title: "Existing Energy Sources & Backup Systems",
        intro: "Existing generation assets, UPS or battery systems, existing PV, outage history, and non-interruptible loads move out of Client & Site and into one on-site plant section.",
        groups: [
          { title: "Generator", fields: [
            f("Existing Generator Details", "textarea", { full: true }),
            f("Generator Location", "text"),
            f("Generator Rating", "text", { placeholder: "kVA / kW" }),
            f("Changeover Type", "select", { options: ["Select", "Manual", "Automatic ATS", "Synchronised", "Unknown"] }),
            f("Fuel Type", "select", { options: ["Select", "Diesel", "Petrol", "Gas", "Hybrid", "Unknown"] }),
            f("Tank Location", "text")
          ]},
          { title: "UPS / Battery", fields: [
            f("Existing UPS / Battery Storage Details", "textarea", { full: true }),
            f("Make / Model", "text"),
            f("Capacity", "text", { placeholder: "kWh / Ah / kVA" }),
            f("Chemistry", "text"),
            f("Age", "text"),
            f("Condition", "select", { options: options.condition })
          ]},
          { title: "Existing Solar PV", fields: [
            f("Existing Solar PV System Details", "textarea", { full: true }),
            f("Inverter Make / Model", "text"),
            f("PV Size", "text", { placeholder: "kWp" }),
            f("Battery Size", "text", { placeholder: "kWh" }),
            f("Monitoring Platform", "text")
          ]},
          { title: "Outages & Critical Loads", fields: [
            f("Grid / Utility Outage History", "textarea"),
            f("Critical Loads That Cannot Be Interrupted", "textarea")
          ]},
          photos("Embedded backup-system photos", [
            p("Existing generator", false),
            p("UPS / BESS", false),
            p("Existing inverter / PV equipment", false),
            p("Critical load panel if separate", false)
          ])
        ]
      },
      {
        tag: "Must complete on site",
        title: "Roof / Ground / Carport Installation Area",
        intro: "PV mounting areas, roof access, shading, environmental exposure, and working-at-height fields are now captured while the technician is in the PV area.",
        groups: [
          { title: "Site Overview", fields: [
            f("Most Suitable Mounting Approach", "checks", { id: "mountingApproach", required: true, choices: ["Rooftop", "Ground Mount", "Carport / Shade Structure", "Hybrid", "To be confirmed"] }),
            f("Preliminary Feasibility", "select", { options: ["Select", "Good", "Feasible with constraints", "Poor", "Not feasible", "Needs engineering review"] })
          ]},
          repeater("Rooftop Areas", "roof", "Roof Area / Face", "roof", [
            f("Roof Face / Area Name", "text", { placeholder: "North face, Warehouse A..." }),
            f("Roof Material / Type", "text"),
            f("Roof Condition", "select", { options: options.condition }),
            f("Pitch", "text"),
            f("Orientation / Azimuth", "text"),
            f("Dimensions", "text"),
            f("Usable Area", "text"),
            f("Obstructions", "textarea"),
            f("Notes", "textarea")
          ]),
          repeater("Ground / Land Areas", "ground", "Ground Area", "ground", [
            f("Area Name", "text"),
            f("Dimensions", "text"),
            f("Slope / Terrain", "text"),
            f("Access Constraints", "textarea"),
            f("Drainage / Flooding Concerns", "textarea")
          ]),
          repeater("Carport / Shade Structure Areas", "carport", "Carport Area", "carport", [
            f("Carport Area Name", "text"),
            f("Existing or New Structure", "select", { options: ["Select", "Existing", "New proposed", "To be confirmed"] }),
            f("Dimensions", "text"),
            f("Structural Concerns", "textarea"),
            f("Notes", "textarea")
          ]),
          { title: "Shading Assessment", fields: [
            f("Shading Area", "textarea"),
            f("Best-Performing Areas", "textarea"),
            f("Areas to Exclude", "textarea"),
            f("Likely Energy Yield Impact", "select", { options: ["Select", "Low", "Medium", "High", "Needs modelling"] }),
            f("Shadow Analysis Tool Used", "text")
          ]},
          { title: "Environmental Conditions", fields: [
            f("Wind Exposure", "select", { options: ["Select", "Low", "Moderate", "High", "Extreme"] }),
            f("Coastal Proximity / Salt Air", "select", { options: options.yesNo }),
            f("Dust / Soiling Level", "select", { options: ["Select", "Low", "Moderate", "High"] }),
            f("Typical Ambient Temperature", "text"),
            f("Lightning / Surge Risk", "select", { options: ["Select", "Low", "Moderate", "High", "Unknown"] }),
            f("Flooding / Waterlogging Risk", "select", { options: ["Select", "Low", "Moderate", "High", "Unknown"] }),
            f("Any Other Environmental Concerns", "textarea", { full: true })
          ]},
          { title: "Roof Access & Working at Height", condition: "roof", fields: [
            f("Roof Access Method", "text", { required: true }),
            f("Height Above Ground", "text", { required: true }),
            f("Fall Protection / Edge Rails Present", "select", { options: options.yesNo }),
            f("Safe Roof Access for Install Crew", "select", { options: options.yesNo, required: true }),
            f("Roof Warranty Affected by PV Install", "select", { options: options.yesNo })
          ]},
          photos("Embedded PV-area photos", [
            p("Roof north face", true, "roof"),
            p("Roof south face", true, "roof"),
            p("Roof east / west faces", true, "roof"),
            p("Roof penetrations / vents", true, "roof"),
            p("Shading objects", true),
            p("Ground area", false, "ground"),
            p("Carport / shade structure", false, "carport"),
            p("Roof defects / concerns", false)
          ])
        ]
      },
      {
        tag: "Must complete on site",
        title: "Proposed Equipment Locations",
        intro: "Inverter, BESS, ventilation, fire separation, access, weather protection, security, and equipment-area photos remain together.",
        groups: [
          { title: "Inverter Location", fields: [
            f("Proposed Inverter Location", "text", { required: true }),
            f("Specific Location Description", "textarea"),
            f("Distance: Inverter Location to Main DB", "text", { required: true, placeholder: "m" }),
            f("Wall Mounting Possible", "select", { options: options.yesNo }),
            f("Ventilation at Inverter Location", "select", { options: ["Select", "Good", "Adequate", "Poor", "Needs mechanical ventilation"] }),
            f("Ambient Temp at Inverter Location", "text"),
            f("Approximate Available Space", "text"),
            f("Lockable / Security Controlled", "select", { options: options.yesNo }),
            f("Protected from Rain / Direct Sun", "select", { options: options.yesNo }),
            f("Noise Concern", "select", { options: options.yesNo }),
            f("Cellular / WiFi Signal Available", "select", { options: options.yesNo })
          ]},
          { title: "BESS Location", fields: [
            f("BESS Required", "select", { options: ["Select", "Yes", "No", "To be confirmed"], id: "bessRequired" }),
            f("BESS Location Type", "select", { condition: "bess", options: ["Select", "Indoor", "Outdoor", "Containerised", "Plant room", "To be confirmed"] }),
            f("Specific BESS Location", "textarea", { condition: "bess" }),
            f("Distance: BESS to Inverter", "text", { condition: "bess", placeholder: "m" }),
            f("Distance: BESS to Main DB", "text", { condition: "bess", placeholder: "m" }),
            f("Available Dimensions", "text", { condition: "bess" }),
            f("Ground / Floor Loading", "text", { condition: "bess" }),
            f("Ventilation Adequacy", "select", { condition: "bess", options: ["Select", "Good", "Adequate", "Poor", "Needs review"] }),
            f("Fire Separation Available", "select", { condition: "bess", options: options.yesNo }),
            f("Vehicle / Crane Access to BESS Area", "select", { condition: "bess", options: options.yesNo }),
            f("Insurance / Fire Suppression Requirements", "textarea", { condition: "bess", full: true })
          ]},
          photos("Embedded equipment photos", [
            p("Proposed inverter location", true),
            p("Proposed BESS location", false, "bess"),
            p("Available wall / floor space", true),
            p("Equipment delivery path", false),
            p("Fire separation concerns", false, "bess")
          ])
        ]
      },
      {
        tag: "Must complete on site",
        title: "Cable Route Walkdown",
        intro: "DC, AC, comms, route-specific earthing/bonding notes, trenching, penetrations, road crossings, civil works, and route photos are captured while walking the route.",
        notice: "Tip: Walk the likely cable route on site. Measure or pace distances where possible. Flag obstacles, road crossings, roof/wall penetrations, trenching, and cable tray needs.",
        groups: [
          { title: "DC Cabling", fields: [
            f("Estimated Number of Strings", "number"),
            f("Approximate Longest String Run", "text", { placeholder: "m" }),
            f("Estimated Total DC Cable Run", "text", { placeholder: "m" }),
            f("DC Cable Route Type", "select", { options: ["Select", "Cable tray", "Conduit", "Trunking", "Underground", "Mixed", "Unknown"] }),
            f("Roof-to-Ground Penetration Required", "select", { options: options.yesNo }),
            f("Penetration Method", "text"),
            f("DC Cable Route Notes", "textarea", { full: true })
          ]},
          { title: "AC Cabling", fields: [
            f("Estimated AC Cable Run", "text", { required: true, placeholder: "m" }),
            f("AC Cable Route Type", "select", { options: ["Select", "Cable tray", "Conduit", "Trunking", "Underground", "Mixed", "Unknown"] }),
            f("Trenching Required", "select", { options: options.trenching, id: "trenchingRequired" }),
            f("Estimated Trench Length", "text", { condition: "trench", placeholder: "m" }),
            f("Road / Hardstand Crossing Required", "select", { options: options.yesNo, id: "roadCrossing" }),
            f("Estimated Protection Device Rating", "text"),
            f("AC Cable Route Notes", "textarea", { full: true })
          ]},
          { title: "Earthing & Bonding", fields: [
            f("Roof Bonding Required", "select", { options: options.yesNo }),
            f("Route-Specific Earthing / Bonding Notes", "textarea", { full: true })
          ]},
          { title: "Comms Cabling", fields: [
            f("Monitoring / Comms Route", "textarea"),
            f("Estimated Comms Cable Run", "text", { placeholder: "m" }),
            f("Existing Network Infrastructure Available", "select", { options: options.yesNo }),
            f("Communication Interference Risks", "textarea")
          ]},
          { title: "Civil Works", fields: [
            f("Civil Works Identified", "checks", { id: "civilWorks", choices: ["None", "Trenching", "Core drilling", "Road crossing", "Cable tray supports", "Roof penetrations", "Wall penetrations"] }),
            f("Civil Works Notes", "textarea", { id: "civilNotes", full: true })
          ]},
          photos("Embedded cable-route photos", [
            p("Cable route roof to inverter", true),
            p("Inverter / BESS to DB", true),
            p("Cable tray / trunking route", false),
            p("Trenching route", false, "trench"),
            p("Road crossing", false, "road"),
            p("Wall / roof penetrations", false)
          ])
        ]
      },
      {
        tag: "Can complete later",
        title: "Energy & Consumption Data",
        intro: "Bills, tariff details, interval data, 12-month consumption, load schedule, peak demand, and load profile inputs move after the physical assessment.",
        notice: "Energy & Consumption Data - Office / Client-Supplied. These fields should not block site visit submission when documents are pending.",
        groups: [
          { title: "Data Availability", fields: [
            f("What consumption data is available?", "select", { options: options.dataAvailability, id: "consumptionData" }),
            f("Bills to be Provided By", "text", { condition: "billsLater" }),
            f("Expected By", "date", { condition: "billsLater" }),
            f("Known Average Monthly Consumption", "text", { placeholder: "kWh" }),
            f("Known Peak Demand", "text", { placeholder: "kVA / kW" }),
            f("Tariff / Meter Photo Reference", "text")
          ]},
          { title: "Bill Upload & Summary", condition: "bills", fields: [
            f("Months Available", "number"),
            f("Upload Utility Bills", "file"),
            f("12-Month Consumption Table", "textarea", { full: true, placeholder: "Month, kWh, demand, cost..." })
          ]},
          { title: "Interval / Load Profile Data", fields: [
            f("Upload Interval Data", "file"),
            f("Data Resolution", "select", { options: ["Select", "5-minute", "15-minute", "30-minute", "Hourly", "Daily", "Other"] }),
            f("Period Covered", "text")
          ]},
          { title: "New Building / No History", condition: "newBuilding", fields: [
            f("Load Schedule", "textarea", { full: true }),
            f("Add Load Item", "textarea", { full: true, placeholder: "Load, quantity, rating, hours, criticality..." })
          ]},
          { title: "Key Consumption Figures", fields: [
            f("Average Monthly Consumption", "text", { placeholder: "kWh" }),
            f("Peak Demand", "text", { placeholder: "kVA / kW" }),
            f("Tariff Category / Name", "text"),
            f("Tariff Structure", "text"),
            f("Load Profile Confidence", "select", { options: options.confidence }),
            f("Seasonal Variation", "select", { options: ["Select", "Low", "Moderate", "High", "Unknown"] }),
            f("Day vs Night Load Behaviour", "textarea"),
            f("Weekday vs Weekend Variation", "textarea")
          ]}
        ]
      },
      {
        tag: "Office / follow-up",
        title: "Documents Received / Pending",
        intro: "Document tracking is split out from assessor notes so owners, due dates, uploads, and design-blocking gaps are clear.",
        custom: "documents"
      },
      {
        tag: "End of visit / office",
        title: "Final Review, Risk Flags & Submission",
        intro: "The final section now collects risk flags, next steps, follow-up requirements, general notes, photo completion, missing items, and submission warnings.",
        groups: [
          { title: "Assessor Flags & Notes", fields: [
            f("Risk Flags / Red Flags Identified", "textarea", { id: "riskFlags", full: true }),
            f("Recommended Next Steps / Action Items", "textarea", { full: true }),
            f("Follow-Up Visit Required", "select", { options: options.yesNo, id: "followUpRequired" }),
            f("General Assessment Notes & Special Conditions", "textarea", { full: true })
          ]},
          { title: "Photo Completion Summary", custom: "photoSummary" },
          { title: "Submission Warnings", custom: "warnings" },
          { title: "Submit Assessment", custom: "submit" }
        ]
      }
    ];

    const documentRows = [
      "Electricity bills",
      "Electrical compliance certificate",
      "Existing SLD",
      "Load profile / interval data",
      "Building plans / roof drawings",
      "Utility tariff schedule",
      "Grid connection / utility interconnection documents",
      "Existing solar / battery system documents",
      "Land ownership / title documents"
    ];

    let current = 0;

    function f(label, type, cfg = {}) {
      return { label, type, ...cfg };
    }

    function p(label, required, condition) {
      return { label, required, condition };
    }

    function photos(title, items) {
      return { title, type: "photos", items };
    }

    function repeater(title, key, itemTitle, condition, fields) {
      return { title, type: "repeater", key, itemTitle, condition, fields };
    }

    function render() {
      const nav = document.getElementById("nav");
      const mount = document.getElementById("sections");
      if (!nav || !mount) {
        throw new Error("Form containers #nav and #sections must exist before render.");
      }
      renderNav();
      renderSections();
      bindEvents();
      applyConditions();
      updateProgress();
      goToSection(0, false);
    }

    function renderNav() {
      const nav = document.getElementById("nav");
      nav.innerHTML = sections.map((section, index) => `
        <button type="button" class="step-link" data-step="${index}">
          <span class="step-num">${index}</span>
          <span>
            <span class="step-title">${section.title}</span>
            <span class="step-tag">${section.tag}</span>
          </span>
        </button>
      `).join("");
    }

    function renderSections() {
      const mount = document.getElementById("sections");
      mount.innerHTML = sections.map((section, index) => `
        <section class="section form-section" id="sec${index}" data-section="${index}">
          <div class="section-head">
            <div class="section-kicker">
              <span>Section ${index}</span>
              <span class="tag ${statusClass[section.tag] || ""}">${section.tag}</span>
            </div>
            <h2>${section.title}</h2>
            <p>${section.intro}</p>
          </div>
          ${section.notice ? `<div class="notice">${section.notice}</div>` : ""}
          ${section.custom === "documents" ? renderDocuments() : ""}
          ${(section.groups || []).map(renderGroup).join("")}
        </section>
      `).join("");
    }

    function renderGroup(group) {
      const condition = group.condition ? ` data-condition="${group.condition}"` : "";
      if (group.type === "photos") {
        return `
          <div class="subsection"${condition}>
            <h3>${group.title}</h3>
            <div class="photo-grid">
              ${group.items.map(item => renderPhoto(item)).join("")}
            </div>
          </div>
        `;
      }
      if (group.type === "repeater") {
        return `
          <div class="subsection"${condition} data-repeater-wrap="${group.key}">
            <div class="repeat-head">
              <h3>${group.title}</h3>
              <button type="button" class="mini-btn" data-add-repeat="${group.key}">Add</button>
            </div>
            <div class="repeatable" data-repeat="${group.key}">
              ${renderRepeatItem(group, 1)}
            </div>
          </div>
        `;
      }
      if (group.custom === "photoSummary") {
        return `<div class="subsection"><h3>${group.title}</h3><div id="photoSummary"></div></div>`;
      }
      if (group.custom === "warnings") {
        return `<div class="subsection"><h3>${group.title}</h3><ul class="validation-list" id="warnings"></ul></div>`;
      }
      if (group.custom === "submit") {
        return `
          <div class="subsection">
            <h3>${group.title}</h3>
            <p>Submission remains at the end of the updated flow.</p>
            <button type="button" class="primary-btn" id="submitBtn">Submit Assessment</button>
          </div>
        `;
      }
      return `
        <div class="subsection"${condition}>
          <h3>${group.title}</h3>
          <div class="field-grid">
            ${group.fields.map(renderField).join("")}
          </div>
        </div>
      `;
    }

    function renderRepeatItem(group, number) {
      return `
        <div class="repeat-item">
          <div class="repeat-head">
            <strong>${group.itemTitle} ${number}</strong>
            <button type="button" class="mini-btn" data-remove-repeat>Remove</button>
          </div>
          <div class="field-grid">
            ${group.fields.map(field => renderField(field, `${group.key}-${number}`)).join("")}
          </div>
        </div>
      `;
    }

    function renderField(field, prefix = "") {
      const id = field.id || `${prefix}-${field.label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const classes = ["field", field.full ? "full" : ""].join(" ");
      const attrs = [
        `data-field-wrap="${id}"`,
        field.condition ? `data-condition="${field.condition}"` : ""
      ].filter(Boolean).join(" ");
      const requiredMark = field.required ? ` <span class="required">*</span>` : "";
      return `
        <div class="${classes}" ${attrs}>
          <label for="${id}">${field.label}${requiredMark}</label>
          ${renderInput(field, id)}
        </div>
      `;
    }

    function renderInput(field, id) {
      const common = `id="${id}" ${field.required ? "required data-required='true'" : ""} ${field.placeholder ? `placeholder="${field.placeholder}"` : ""}`;
      if (field.type === "select") {
        return `<select ${common}>${(field.options || ["Select"]).map(opt => `<option>${opt}</option>`).join("")}</select>`;
      }
      if (field.type === "textarea") {
        return `<textarea ${common}></textarea>`;
      }
      if (field.type === "checks") {
        return `
          <div class="choice-row" id="${id}" ${field.required ? "data-required='true' data-check-group='true'" : "data-check-group='true'"} data-field-id="${field.id || id}">
            ${field.choices.map(choice => `
              <label class="choice"><input type="checkbox" value="${choice}" data-choice-group="${field.id || id}">${choice}</label>
            `).join("")}
          </div>
        `;
      }
      if (field.type === "file") {
        return `<input ${common} type="file">`;
      }
      return `<input ${common} type="${field.type || "text"}" ${field.step ? `step="${field.step}"` : ""} ${field.value ? `value="${field.value}"` : ""}>`;
    }

    function renderPhoto(item) {
      const id = `photo-${item.label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const condition = item.condition ? ` data-condition="${item.condition}"` : "";
      return `
        <div class="photo-slot" data-photo-slot="${item.label}" data-required-photo="${item.required ? "true" : "false"}"${condition}>
          <strong>${item.label}${item.required ? " *" : ""}</strong>
          <span>${item.required ? "Required in this physical section" : "Optional or conditional"}</span>
          <input id="${id}" type="file" accept="image/*" data-photo-input="${item.label}">
        </div>
      `;
    }

    function renderDocuments() {
      return `
        <div class="subsection">
          <h3>Document tracker</h3>
          <div class="table-scroll">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Date requested</th>
                  <th>Expected date</th>
                  <th>Upload</th>
                  <th>Blocking design?</th>
                </tr>
              </thead>
              <tbody>
                ${documentRows.map((row, index) => `
                  <tr>
                    <td>${row}</td>
                    <td><select data-doc-status>${options.status.map(opt => `<option>${opt}</option>`).join("")}</select></td>
                    <td><input type="text" placeholder="Responsible person"></td>
                    <td><input type="date"></td>
                    <td><input type="date"></td>
                    <td><input type="file"></td>
                    <td><select data-blocking><option>No</option><option>Yes</option><option>Unknown</option></select></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function bindEvents() {
      document.querySelectorAll("[data-step]").forEach(button => {
        button.addEventListener("click", () => goToSection(Number(button.dataset.step)));
      });
      document.getElementById("prevBtn").addEventListener("click", () => goToSection(Math.max(0, current - 1)));
      document.getElementById("nextBtn").addEventListener("click", () => goToSection(Math.min(sections.length - 1, current + 1)));

      document.body.addEventListener("input", event => {
        if (event.target.matches("input, textarea, select")) {
          if (event.target.matches("[data-photo-input]")) {
            event.target.closest(".photo-slot").classList.toggle("complete", event.target.files.length > 0);
          }
          applyConditions();
          updateProgress();
        }
      });

      document.body.addEventListener("change", event => {
        if (event.target.matches("input, textarea, select")) {
          applyConditions();
          updateProgress();
        }
      });

      document.body.addEventListener("click", event => {
        const addButton = event.target.closest("[data-add-repeat]");
        if (addButton) {
          const key = addButton.dataset.addRepeat;
          const group = sections.flatMap(s => s.groups || []).find(g => g.key === key);
          const list = document.querySelector(`[data-repeat="${key}"]`);
          list.insertAdjacentHTML("beforeend", renderRepeatItem(group, list.children.length + 1));
          if (typeof window.ensureFieldIdentifiers === "function") {
            window.ensureFieldIdentifiers(list.lastElementChild);
          }
          applyConditions();
          updateProgress();
          return;
        }
        if (event.target.closest("[data-remove-repeat]")) {
          const list = event.target.closest(".repeatable");
          if (list.children.length > 1) {
            event.target.closest(".repeat-item").remove();
            updateProgress();
          }
          return;
        }
        if (event.target.id === "submitBtn" && typeof window.submitForm === "function") {
          buildWarnings(true);
          window.submitForm();
        }
      });
    }

    function getValue(id) {
      const el = document.getElementById(id);
      return el ? el.value : "";
    }

    function checkedValues(group) {
      return Array.from(document.querySelectorAll(`[data-choice-group="${group}"]:checked`)).map(input => input.value);
    }

    function isMount(type) {
      const selected = checkedValues("mountingApproach");
      return selected.includes(type) || selected.includes("Hybrid");
    }

    function applyConditions() {
      const method = getValue("assessmentMethod");
      const transformer = getValue("transformerPresent") === "Yes";
      const bess = ["Yes", "To be confirmed"].includes(getValue("bessRequired"));
      const trench = ["Yes", "Partial"].includes(getValue("trenchingRequired"));
      const road = getValue("roadCrossing") === "Yes";
      const overheat = ["Minor", "Yes"].includes(getValue("overheating"));
      const consumption = getValue("consumptionData");
      const civilSelected = checkedValues("civilWorks").filter(v => v !== "None").length > 0;

      const state = {
        remote: method === "Remote / Desktop" || method === "Hybrid",
        transformer,
        bess,
        roof: isMount("Rooftop"),
        ground: isMount("Ground Mount"),
        carport: isMount("Carport / Shade Structure"),
        trench,
        road,
        overheat,
        billsLater: consumption === "Bills to be emailed / sent later",
        bills: consumption === "Bills available",
        newBuilding: consumption === "New building / no consumption history",
        civil: civilSelected
      };

      document.querySelectorAll("[data-condition]").forEach(el => {
        const condition = el.dataset.condition;
        el.classList.toggle("hidden", !state[condition]);
      });

      const followUp = document.getElementById("followUpRequired");
      if (getValue("remoteConfidence") === "Low" && followUp && followUp.value !== "Yes") {
        followUp.value = "Yes";
      }

      buildPhotoSummary();
      buildWarnings(false);
      updateNextLabel();
    }

    function controlIsVisible(control) {
      if (typeof window.fieldVisible === "function") return window.fieldVisible(control);
      return !control.closest(".hidden");
    }

    function visibleRequiredControls() {
      return Array.from(document.querySelectorAll("[data-required='true']")).filter(controlIsVisible);
    }

    function isControlComplete(control) {
      if (control.dataset.checkGroup === "true") {
        return control.querySelectorAll("input:checked").length > 0;
      }
      if (control.tagName === "SELECT") {
        return control.value && !control.value.toLowerCase().startsWith("select");
      }
      if (control.type === "file") {
        return control.files && control.files.length > 0;
      }
      return Boolean(String(control.value || "").trim());
    }

    function controlLabel(control) {
      const field = control.closest(".field");
      const label = field?.querySelector("label");
      if (label) return label.textContent.replace(/\s+/g, " ").replace(/\*/g, "").trim();
      return control.id || "Required field";
    }

    function controlSectionTitle(control) {
      const section = control.closest(".form-section");
      const index = Number(section?.dataset.section ?? 0);
      const navTitle = document.querySelector(`.step-link[data-step="${index}"] .step-title`);
      return navTitle?.textContent.trim() || `Section ${index + 1}`;
    }

    function updateProgress() {
      const required = visibleRequiredControls();
      const complete = required.filter(isControlComplete);
      const percent = required.length ? Math.round((complete.length / required.length) * 100) : 0;
      const progressText = document.getElementById("progressText");
      const progressBar = document.getElementById("progressBar");
      if (progressText) progressText.textContent = `${percent}%`;
      if (progressBar) progressBar.style.width = `${percent}%`;
    }

    function buildPhotoSummary() {
      const mount = document.getElementById("photoSummary");
      if (!mount) return;
      const slots = Array.from(document.querySelectorAll("[data-photo-slot]")).filter(slot => !slot.closest(".hidden"));
      const rows = slots.map(slot => {
        const complete = slot.classList.contains("complete");
        const required = slot.dataset.requiredPhoto === "true";
        return `
          <tr>
            <td>${slot.dataset.photoSlot}</td>
            <td>${required ? "Required" : "Optional / conditional"}</td>
            <td>${complete ? "Uploaded" : "Missing"}</td>
          </tr>
        `;
      }).join("");
      mount.innerHTML = `
        <table class="summary-table">
          <thead><tr><th>Photo prompt</th><th>Requirement</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    function buildWarnings(showSubmitMessage) {
      const mount = document.getElementById("warnings");
      if (!mount) return;

      const items = [];
      let issueIndex = 0;

      const validation = typeof window.getFormValidationIssues === "function"
        ? window.getFormValidationIssues()
        : null;

      if (validation) {
        for (const issue of validation.fields) {
          items.push({
            type: "blocking",
            html: `<button type="button" class="warning-go" data-goto-issue="${issueIndex}">
              <strong>${issue.label}</strong>
              <span>Section: ${issue.sectionTitle} — tap to go to this field</span>
            </button>`
          });
          issueIndex += 1;
        }
        for (const issue of validation.photos) {
          items.push({
            type: "blocking",
            html: `<button type="button" class="warning-go" data-goto-issue="${issueIndex}">
              <strong>${issue.label}</strong>
              <span>Section: ${issue.sectionTitle} — required photo missing (tap to upload)</span>
            </button>`
          });
          issueIndex += 1;
        }
      } else {
        const visibleMissingRequired = visibleRequiredControls().filter(control => !isControlComplete(control));
        for (const control of visibleMissingRequired) {
          items.push({
            type: "blocking",
            html: `<button type="button" class="warning-go" data-goto-issue="${issueIndex}">
              <strong>${controlLabel(control)}</strong>
              <span>Section: ${controlSectionTitle(control)} — tap to go to this field</span>
            </button>`
          });
          issueIndex += 1;
        }
      }

      if (getValue("remoteConfidence") === "Low") {
        items.push({ type: "advisory", html: "Remote confidence is low, so a follow-up visit is required." });
      }
      if (["Minor", "Yes"].includes(getValue("overheating"))) {
        items.push({ type: "advisory", html: "Overheating or burn marks were flagged; defect notes and photos should be captured." });
      }
      if (getValue("roadCrossing") === "Yes") {
        items.push({ type: "advisory", html: "Road / hardstand crossing is selected; route notes and crossing photo should be completed." });
      }
      if (checkedValues("civilWorks").filter(v => v !== "None").length && !document.getElementById("civilNotes")?.value) {
        items.push({ type: "advisory", html: "Civil works are selected; civil works notes are required before final submission." });
      }

      if (!items.length && showSubmitMessage) {
        items.push({ type: "ok", html: "No blocking issues found. Submitting will send data to the server." });
      }

      mount.innerHTML = items.length
        ? items.map(item => `<li class="warning-item warning-${item.type}">${item.html}</li>`).join("")
        : `<li class="warning-item warning-ok">No blocking warnings currently visible.</li>`;
    }

    function updateNextLabel() {
      const nextBtn = document.getElementById("nextBtn");
      const prevBtn = document.getElementById("prevBtn");
      if (nextBtn) nextBtn.textContent = current === sections.length - 1 ? "Review" : "Next";
      if (prevBtn) prevBtn.disabled = current === 0;
    }

    function goToSection(index, shouldScroll = true) {
      current = index;
      document.querySelectorAll(".section").forEach(section => {
        section.classList.toggle("active", Number(section.dataset.section) === current);
      });
      document.querySelectorAll(".step-link").forEach(button => {
        button.classList.toggle("active", Number(button.dataset.step) === current);
      });
      updateNextLabel();
      buildPhotoSummary();
      buildWarnings(false);
      if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
    }

    window.renderSiteForm = render;
    window.applyFormConditions = applyConditions;
    window.buildFormWarnings = buildWarnings;
    window.getFormSectionCount = () => sections.length;
    window.goToFormSection = goToSection;
    window.updateFormProgress = updateProgress;
})();
