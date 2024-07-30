const form = document.getElementById("wf-form-Submission-Form");
// Select the error message element
const errorMessage = document.querySelector(".w-form-fail");
const successMessage = document.querySelector(".w-form-done");
const resultElement = document.getElementById("result");
resultElement.style.display = "none"; // Hide the result initially

let formElement = document.getElementById("assessmentForm");
let submitButton = document.getElementById("submit-button");
form.addEventListener("submit", (event) => {
  event.preventDefault(); // Prevent default form submission

  // Get form data
  const name = document.getElementById("name").value;
  const jobFunctionality = document.getElementById("Job-Function").value;
  const jobTitle = document.getElementById("Job-Title").value;
  const monthsInRole = document.getElementById("monthsInRole").value;

  // Validate form data
  let assessmentArray = jobFunctionalityList.find(
    (job) => job.value == jobFunctionality
  ).functionalCompetencies;

  const functionalCompetencies = assessmentArray.length;
  assessmentArray = assessmentArray.concat(coreCompetency);


  // Create the form and add it to the desired location (replace with your target element ID)
  formElement = document.getElementById("assessmentForm");

  // Create the form title section 
  const titleSection = document.createElement("div");
  titleSection.classList.add("title-section");

  const formTitle = document.createElement("h2");
  formTitle.textContent = jobFunctionalityList.find(
    (job) => job.value == jobFunctionality
  ).text;
  titleSection.appendChild(formTitle);
  const formDescription = document.createElement("p");
  formDescription.textContent = jobFunctionalityList.find(
    (job) => job.value == jobFunctionality
  ).desc;
  titleSection.appendChild(formDescription);
  const infoSpan = document.createElement("span");
  infoSpan.textContent = "Selecting (NA) for a question will not affect your overall assessment score.";
  titleSection.appendChild(infoSpan);

  formElement.appendChild(titleSection);
  formElement.appendChild(createFormAssessment(assessmentArray, functionalCompetencies));

  submitButton = document.getElementById("submit-button");

  submitButton.addEventListener("click", (event) => {
    event.preventDefault();

    // Get all slider input elements
    const sliders = document.querySelectorAll(
      'assessmentForm input[type="range"]'
    );

    // Extract slider input values
    let sliderValues = [];
    sliders.forEach((slider) => {
      sliderValues.push(slider.value);
    });

    // Calculation to the form
    // First get user experience
    let userExperience = 0;
    if (monthsInRole < 24) {
      // If user has been in role for 1 year
      userExperience = 0.5;
    } else if (monthsInRole >= 24 && monthsInRole < 36) {
      // If user has been in role for 2 years
      userExperience = 0.75;
    } else if (monthsInRole >= 36 && monthsInRole < 48) {
      // If user has been in role for 3 years
      userExperience = 0.9;
    } else if (monthsInRole >= 48 && monthsInRole < 72) {
      // If user has been in role for 4-5 years
      userExperience = 1;
    } else if (monthsInRole >= 72 && monthsInRole < 84) {
      // If user has been in role for 6 years
      userExperience = 0.95;
    } else if (monthsInRole >= 84 && monthsInRole < 96) {
      // If user has been in role for 7 years
      userExperience = 0.9;
    } else if (monthsInRole >= 96 && monthsInRole < 108) {
      // If user has been in role for 8 years
      userExperience = 0.8;
    } else if (monthsInRole >= 108 && monthsInRole < 120) {
      // If user has been in role for 9 years
      userExperience = 0.75;
    } else if (monthsInRole >= 120) {
      // If user has been in role for 10 years or more
      userExperience = 0.65;
    }

    for (let i = 0; i < sliderValues.length; i++) {
      answerValue = parseInt(sliderValues[i]);
      if (answerValue == 1) {
        sliderValues[i] = parseInt(25);
      } else if (answerValue == 2) {
        sliderValues[i] = parseInt(50);
      } else if (answerValue == 3) {
        sliderValues[i] = parseInt(75);
      } else if (answerValue == 4) {
        sliderValues[i] = parseInt(85);
      } else if (answerValue == 5) {
        sliderValues[i] = parseInt(100);
      }
    }
    sliderValues = sliderValues.filter((value) => value !== "0");
    const sum = sliderValues.reduce((a, b) => a + b, 0);
    const average = sum / sliderValues.length;

    const assessmentScore = average * userExperience;
    let weightedAssessmentScore = 0;
    if (assessmentScore >= 85) {
      weightedAssessmentScore = 0.85;
    } else if (assessmentScore >= 75 && assessmentScore < 85) {
      weightedAssessmentScore = 0.75;
    } else if (assessmentScore >= 70 && assessmentScore < 75) {
      weightedAssessmentScore = 0.7;
    } else if (assessmentScore >= 65 && assessmentScore < 70) {
      weightedAssessmentScore = 0.65;
    } else if (assessmentScore < 65) {
      weightedAssessmentScore = 0.6;
    }
    weightedAssessmentScore = weightedAssessmentScore * 100;
    submitButton.style.display = "none"; // Hide the submit button

    // Display the result
    const resultElement = document.getElementById("result");
    resultElement.textContent = `Your assessment score is ${weightedAssessmentScore.toFixed(
      2
    )}%`;
    resultElement.style.display = "block"; // Show the result
  });

  const submitFormWrap = document.getElementById("start-button");
  submitFormWrap.style.display = "none"; // Hide the start button
});

function createFormAssessment(assessmentData, functionalCompetenciesLength) {
  // Create the form element
  const form = document.createElement("assessmentForm");
  form.id = "assessment-form"; // Set the ID

  let indexAdjustment = 0;
  const divider1 = document.createElement("hr");
  form.appendChild(divider1);
  const functionalCompetencyHeader = document.createElement("h3");
  functionalCompetencyHeader.textContent = "Functional Competencies";
  form.appendChild(functionalCompetencyHeader);

  // Loop through each assessment point
  assessmentData.forEach((assessment, index) => {
    if (index == functionalCompetenciesLength) {
      const divider = document.createElement("hr");
      form.appendChild(divider);
      const coreCompetencyHeader = document.createElement("h3");
      coreCompetencyHeader.textContent = "Core Competencies";
      form.appendChild(coreCompetencyHeader);
      indexAdjustment = functionalCompetenciesLength;
    }

    // Create a div element for each assessment
    const assessmentContainer = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = `${index + 1 - indexAdjustment}. ${assessment.title}`;
    assessmentContainer.appendChild(label);

    const description = document.createElement("p"); 
    description.textContent = assessment.desc;
    assessmentContainer.appendChild(description);

    // Create a range slider for each assessment
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 5;
    slider.value = 1; // Set default value (adjust as needed)
    slider.name = `assessment-${index}`; // Unique name for each slider
    assessmentContainer.appendChild(slider);

    const sliderValue = document.createElement("output");
    const span0 = document.createElement("span");
    span0.textContent = "NA";
    sliderValue.appendChild(span0);
    const span1 = document.createElement("span");
    span1.textContent = "1";
    sliderValue.appendChild(span1);
    const span2 = document.createElement("span");
    span2.textContent = "2";
    sliderValue.appendChild(span2);
    const span3 = document.createElement("span");
    span3.textContent = "3";
    sliderValue.appendChild(span3);
    const span4 = document.createElement("span");
    span4.textContent = "4";
    sliderValue.appendChild(span4);
    const span5 = document.createElement("span");
    span5.textContent = "5";
    sliderValue.appendChild(span5);
    assessmentContainer.appendChild(sliderValue);
  
    form.appendChild(assessmentContainer);
  });

  // Create a submit button
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit";
  submitButton.id = "submit-button"; // Set the ID
  // Add class names to the button
  submitButton.classList.add("a-button-primary", "upload", "w-button"); // Using classList.add
  form.appendChild(submitButton);

  return form;
}

// Replace placeholders with your actual values
const jobFunctionalityElement = document.getElementById("Job-Function");
const jobTitleElement = document.getElementById("Job-Title");
const jobAssessmentElement = document.getElementById("job-assessment");

// Function to populate dropdown with options from JSON data
function populateDropdown(optionsList, dropdownElement) {
  dropdownElement.innerHTML = ""; // Clear existing options
  for (const option of optionsList) {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    if (option.value === "0") {
      optionElement.disabled = true;
      optionElement.selected = true;
    }
    dropdownElement.appendChild(optionElement);
  }
}

function updateTextInput(val) {
  document.getElementById("textInput").value = val;
}

// Fetch data if using external JSON file
const jobFunctionalityList = [
  {
    value: 0,
    text: "Select Job Function",
  },
  {
    value: 1,
    text: "Banking",
    desc: [
      "Product innovation",
      "Oversight and regulatory compliance",
      "Sales production",
      "Customer service",
      "Industry consolidation, mergers and acquisitions",
      "Retail and investment services",
    ],
    functionalCompetencies: [
      {title:"Client Focus", desc: "Includes knowledge of client needs and the ability to provide client-focused services." },
      {title:"Planning and Organizing", desc: "Includes knowledge of planning and organizing principles and the ability to prioritize and plan work activities." },
      {title:"Fostering Communication", desc: "Includes knowledge of communication principles and the ability to communicate effectively." },
      {title:"Attention to Detail", desc: "Includes knowledge of attention to detail principles and the ability to manage information and data." },
      {title:"Professionalism", desc: "Includes knowledge of professionalism principles and the ability to demonstrate professionalism." },
      {title:"Collaborating with Others", desc: "Includes knowledge of collaboration principles and the ability to work effectively with others." },
      {title:"Problem Solving", desc: "Includes knowledge of problem-solving principles and the ability to solve problems." },
      {title:" Achievement Orientation", desc: "Includes knowledge of achievement orientation principles and the ability to achieve results." },
    ]
    },
  {
    value: 2,
    text: "Insurance",
    desc: [
      "Product innovation",
      "Major product version updates",
      "Claims and cost management",
      "Sales production and customer service",
      "Industry consolidation, mergers and acquisitions",
      "Operational outsourcing",
      "Compliance and quality (regulatory, quality, etc)",
    ],
  },
  {
    value: 3,
    text: "Engineering - IT",
    desc: [
      "Major product version updates",
      "Mission critical infrastructure operations",
      "Security management and updates",
      "Vendor certification and support",
      "Compliance (regulatory, security, ISO/CMMI, etc.)",
      "Application development and support",
      "Changing contractor population",
      "Outsourced vendor services",
    ],
    functionalCompetencies: [
      {title: "Project Management", desc: "Includes knowledge of: IT project frameworks and their corresponding lifecycle; project management concepts, tools, and best practices; project reporting standards; and developing project plans."},
      {title: "Requirements Gathering", desc: "Includes ability to identify key players and knowledge of requirements gathering techniques (i.e. brainstorming, document analysis, focus groups, interviews, prototyping, surveys, observation, reverse engineering, and workshops)."},
      {title: "Business Analysis", desc: "Includes knowledge of business functions and processes, business decision-making processes, and business case methodologies and measurement."},
      {title: "Documentation and Measurement ", desc: "Includes knowledge of documentation procedures and the ability to track changes, make updates, and relay other important information related to IT systems."},
      {title: "Troubleshooting and Support", desc: "Includes knowledge of troubleshooting and support processes, knowledge of troubleshooting techniques, and the ability to be responsive to key issues."},
      {title: "Policy and Compliance", desc: "Includes knowledge of relevant external policy and compliance procedures and relevant organizational policy and compliance procedures."},
      {title: "Security and Data Protection", desc: "Includes knowledge of relevant security legislation and laws, security procedures and practices, and information management (i.e. information quality, accessibility, security, accuracy, and integrity)."},
      {title: "Modeling", desc: "Includes knowledge of tools and methodologies (UML, BPMN, etc.); systems and business architecture modeling; and modeling abilities for applications, IT systems, business systems, system integration, and data."},
      {title: "Programming", desc: "Includes knowledge of relevant programming languages and programming abilities for application development (C++, java), web design (HTML), database and warehouse development (SQL), etc. Further, knowledge of problem and system decomposition, along with code organization and the ability to develop readable code."},
      {title: "Testing and Quality Assurance", desc: "Includes the ability to test for quality assurance and control, and the ability to develop test cases, strategies, methodologies, and standards. Further, includes the ability to test different types (volume, unit, stress) and develop testing tools (scripts, reports)."},
      {title: "Installation and Integration", desc: "Includes knowledge of installation and integration procedures, and knowledge of common installation and integration tools and techniques."},
      {title: "Vendor Selection and Management", desc: "Includes knowledge of the process to get information on vendor offerings, vendor management, and vendor selection."},
      {title: "Data Analysis", desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations."},
    ]
  },
  {
    value: 4,
    text: "Engineering - Software",
    desc: [
      "The design, development, testing, and maintenance of software applications",
      "Fulfilling specific tasks in the software development lifecycle",
      "Analyzing, cleaning and data management",
      "Process, filter and simplify the user experience",
      "Use the right programming languages, platforms, and architectures when developing",
      " In addition to building their own systems, software engineers also test, improve, and maintain software built by other engineers",
    ],
    functionalCompetencies: []
  },
  {
    value: 5,
    text: "Sales",
    desc: [
      "The skills needed to perform jobs in the Sales Function include subject knowledge and technical know-how, as well as  other functional skills related to a specific business.  The skills we identified are what is used by most organizations. The skills that are most valued, recognized for career advancement, and accordingly rewarded.",
    ],
    functionalCompetencies: [
      {title : "Business and Industry Analysis", desc: "Includes knowledge of common pricing and promotions, forecasting competitors' behavior, industry trends and forecasting, and client needs and forecasting. "},
      {title : "Product Analysis", desc: "Includes creating organizational product offerings, taking in product feedback, crafting the organizational value proposition and client-product alignment, and having knowledge of competitors' offerings."},
      {title : "Client Onboarding ", desc: "Includes knowledge of the client-organization onboarding, creating a smooth client transition to the organization's account manager, and working through all referrals."},
      {title : "Overarching Sales Delivery", desc: "Includes ensuring service delivery quality, having knowledge of the sales process, responding to client queries, working through customer relationship management (CRM), performing data collection, ensuring data integrity, performing activity management, and working through client satisfaction surveys and individual feedback."},
      {title : "Demand Generation", desc: "Includes working through sales prospecting, handling sales calls, researching and identifying sales opportunities, and ensuring data integrity in the search process."},
      {title : "Development of Leads to Sales", desc: "Includes handling objections, qualifying opportunities and gauging the client's stage in the buying process, and working through negotiations with buyers."},
      {title : "Sales Closing", desc: "Includes the ability to close the sale. Further, it includes the ability to cross-sell and upgrade or up-sell products where appropriate."},
      {title : "Growing Accounts", desc: "Includes upgrading or up-selling (or cross-selling) clients' accounts, handling objections, and working through negotiations in the account growth process."},
      {title : "Renewing Accounts", desc: "Includes reviewing all accounts, asking the client to renew, and handling difficult renewals."},
      {title : "Data Analysis", desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations."},
    ]
  },
  {
    value: 6,
    text: "Marketing",
    desc: [
      "The role of marketing has transformed and evolved.  The fundamental marketing skills that cut across the variety of marketing roles are represented here and can be used by many organizations.The depth of a specific skill set is influenced by hands-on experience of practicing the skill and how it is combined with other skills over time.",
    ],
    functionalCompetencies: [
      {title: "Industry Analysis", desc: "Includes the ability to forecast industry growth and examine trends in global and local markets. Further, it includes the ability to identify opportunities, conduct consumer segmentation analyses, collect competitor intelligence where possible, and have knowledge of the product lifecycle, product substitutes, and design best practices."},
      {title: "Consumer and Customer Analysis", desc: "Includes the ability to identify target market selection, conduct analysis on consumer trends and buying power, develop insights on customers, and accurately forecast demand."},
      {title: "Campaign Planning and Execution", desc: "Includes the ability to plan and develop marketing content, use different promotional mediums, disseminate marketing messages, conduct profitability analysis, plan for internal assessments around risk adoption, and manage external agencies where needed through an analysis of all campaign costs, both internal and external."},
      {title: "Marketing Operations", desc: "Includes the ability to analyze and report on performance metrics, skills in customer relationship management (CRM), knowledge of data collection methods, knowledge of maintenance standards and integrity, and ability to develop project timelines, identify scope, and create budget."},
      {title: "Demand Generation and Lead Management", desc: "Includes developing, qualifying, and nurturing promotions; identifying how to develop demand and lead management processes; knowledge of how to increase the speed of customer purchasing; and knowledge of when to offer promotional discounts to incent buyers."},
      {title: "Sales Support", desc: "Includes knowledge of sales collateral and pipeline acceleration (i.e. accelerating the purchasing process for the buyer)."},
      {title: "Distribution Channels Support and Analysis", desc: "Includes the ability to analyze and support the distribution network, maintain distribution channel relationships, and support sales divisions with both direct and indirect sales channels."},
      {title: "Customer Experience and Engagement Creation", desc: "Includes planning initial customer onboarding, developing word-of-mouth (WOM) initiatives, spearheading customer data initiatives, and developing customer loyalty programs."},
      {title: "Product Planning and Development", desc: "Includes planning for new and existing product or service development through analyses of pricing, product packaging and design, product positioning, knowledge of the product lifecycle, and knowledge of merchandising and placement."},
      {title: "Communications Development", desc: "Includes the ability to communicate internal/corporate marketing, external communication skills, crafting the organizational image, creating public and media relations campaigns, developing partnerships and sponsorships, and working with advertising agencies to aid in advertising development."},
      {title: "Event Planning and Development", desc: "Includes planning event logistics, vendor management, coordinating with organization and party management, and working with third-party events"},
      {title: "Brand Development", desc: "Includes knowledge of brand development and positioning tactics, brand awareness and integrity, inventory of branded items, brand stewardship, and developing and measuring brand loyalty."},
      {title: "Online Channel Support and Analysis", desc: "Includes social media marketing, knowledge of digital platforms and processes (webinars and teleconferencing), search engine marketing (SEM, SEO, and paid searches), mobile marketing, web development skills, and knowledge of marketing automation (email marketing, lead management automation, and enterprise marketing management)."},
      {title: "Data Analysis", desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations."},
    ]
    },
  {
    value: 7,
    text: "Finance",
    desc: [
      "The functional skills needed to perform a finance job are mainly focused on the ability to perform the specific tasks.  A finance role is not just tasked with ensuring the financial health, overall growth, and profitability strategies.  The skills will vary depending on the hands-on experience, past, and future career prospects in the discipline of finance.",
    ],
    functionalCompetencies: [
      {
        title:
        "Professional Accounting Standards, Requirements, and Procedures Understanding and Compliance ",
        desc: "Includes knowledge of professional accounting standards, requirements, and procedures related to the business (i.e. IFRS or GAAP).",
      },
      {
        title: "Organizational Finance Policies Compliance and Maintenance",
        desc: "Includes knowledge and ability to develop policies such as travel, expenses, bad debt, refunds, and internal compliance.",
      },
      {
        title: "Financial Accounting",
        desc: "Includes numerous skills: financial statement preparation, compliance, and analysis; and reconciling operational processes and their underlying financial transactions. Further, it includes knowledge of processes supporting general accounting (i.e. sales, receivables, collection and purchase, payables, payment).",
      },
      {
        title: "Management Accounting ",
        desc: "Includes features such as cost management, revenue and profitability management, working with various accounting systems, reporting organizational performance measurements, and results benchmarking (both internally and externally).",
      },
      {
        title: "Internal Control",
        desc: "Includes knowledge of and ability to work with different types of control systems. Further, it includes the ability to identify fraud and errors while conducting internal audits, and the ability to communicate all internal audits and compare them to external audits.",
      },
      {
        title: "Finance",
        desc: "Includes knowledge of working capital management, cash management, capital structures, treasury management, financing sources and initiatives (i.e. debt and equity), M&A deals, valuations, risk management, foreign exchange management, and macroeconomic analyses.",
      },
      {
        title: "Financial Planning",
        desc: "Includes skills such as budget development, forecasting, and analysis; also includes the ability to set financial goals and manage financial resources.",
      },
      {
        title: "Taxation",
        desc: "Includes skills surrounding tax: compliance, audits, knowledge of implications of different business decisions, classes of tax, taxation law, tax planning, and tax accounting.",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
    ],
  },
  {
    value: 8,
    text: "Business Development",
    desc: [
      "Use strategic planning to ensure sale of services, analyzing business developments and monitoring market trends, market characteristics, and cost markup factors. Identify main client groups and audiences, determine the best way to communicate publicity information to them, and develop and implement a communication plan on appropriate channels to promote products or services, and identify, collect, and report appropriate (KPIs). Consult with product development personnel on service specifications to meet demand and trends.",
    ],
    functionalCompetencies: [
      {title: "Analyze business trends", desc: "Analyze business trends and identify opportunities for growth."},
      {title: "Marketing", desc: "Develop and implement a marketing plan."},
      {title: "Meet Demand", desc: "Identify and meet customer demand."},
      {title: "Business Intelligence", desc: "Use business intelligence to make strategic decisions."},
      {title: "Researching", desc: "Conduct market research."},
      {title: "Documentation of BDM activities", desc: "Document business development activities."},
    ]
  },
  {
    value: 9,
    text: "Human Resources",
    desc: [
      "The functional skills needed to perform a human resources job are mainly focused on the ability to perform the specific tasks.  A human resources role is not just tasked with ensuring the financial health, overall growth, and profitability strategies.  The skills will vary depending on the hands-on experience, past, and future career prospects in the discipline of human resources.",
    ],
    functionalCompetencies: [
      {title: "Program Planning and Development", desc: "Develops, implements, evaluates, and owns various HR programs."},
      {title: "Needs Analysis", desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends."},
      {title: "Conflict Management", desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process."},
      {title: "Facilitation", desc: "Takes an objective stance when guiding a group through a process to achieve defined objectives, enable collaborative knowledge transfer, and encourage participation."},
      {title: "Managing Through Change and Uncertainty", desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change."},
      {title: "Customer Focus", desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind."},
      {title: "Dynamic Learning Mindset", desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity."},
      {title: "Branding and Marketing", desc: "Includes managing branding of the employee value proposition (EVP), the ability to plan and develop communications content, and disseminating key messages using different mediums, including social media. Effectively communicates and promotes HR programs and initiatives."},
      {title: "Technology Enablement", desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions."},
      {title: "Influence", desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority."},
      {title: "Relationship Building", desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration."},
      {title: "Business and Financial Acumen", desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs."},
      {title: "Data Literacy", desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics)."},
      {title: "Organizational Awareness", desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values."},
      {title: "Communication", desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences."},
      {title: "Inclusion", desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. "},
      {title: "Problem Solving and Decision Making", desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations."},
      {title: "Project Management", desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk."},
      {title: "Technical HR Expertise", desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices."},
    ]
  },
  {
    value: 10,
    text: "Education",
    desc: ["Academic Accreditation","Professional Development and knowledge management", "Lack of development and investment funding","Organized Employment","Staffing demographic challenges"],

  }
];

const coreCompetency = [
  {
    title: "Valuing Diversity",
    desc: "Appreciates and leverages the capabilities, insights, and ideas of all individuals.  Works effectively with individuals of diverse style, ability, and motivation.",
  },
  {
    title: "Customer Focus",
    desc: "Makes customers and their needs a primary focus of one's actions.  Develops and sustains productive customer relationships.",
  },
  {
    title: "Communication",
    desc: "Pro-actively communicates; informs others of what they need to know.  Utilizes written and oral communication to enhance relationships across the organization.  Capably articulates thoughts and ideas in speaking and listening carefully to others.",
  },
  {
    title: "Teamwork and Collaboration",
    desc: "Actively participates as a member of a team to move the team towards completion of the goals.  Maintains strong, personal connections with team members and stakeholders.  Aligns personal work and performance with the broader team to achieve mutual outcomes.",
  },
  {
    title: "Planning and organizing",
    desc: "Establishes courses of action for self and others to ensure that work is completed effectively.",
  },
  {
    title: "Accountability",
    desc: "Takes responsibility for actions, decisions and deliverables.  Works to establish a culture of accountability among team, cross teams, and direct reports (as relevant).",
  },
  {
    title: "Building Trust",
    desc: "Interacting with others in a way that gives them confidence in one's intentions and those of the organization.",
  },
  {
    title: "Continuous Learning",
    desc: "Actively identified new areas for learning.  Regularly creates and takes advantage of learning opportunities.  Uses newly gained knowledge and skills on the job and learns through application.",
  },
  {
    title: "Creativity and Innovation",
    desc: "Generates innovative solutions to work situations. Tries noval ways to deal with work problems and opportunities.",
  },
  {
    title: "Business Acumen",
    desc: "Achieves a satisfactory level of technical and professional skills or knowledge in position related areas. Keeps up with current development and trends in areas of expertise.",
  },
  {
    title: "Problem Solving",
    desc: "Uses sound or logical judgement to spot or analyze problems, develop alternative solutions and initiate corrective actions.",
  },
  {
    title: "Ability to Influence",
    desc: "Uses interpersonal styles and techniques to gain acceptance of ideas or plans.  Effectively explains alternatives to reach outcomes that gain support of others.",
  },
];
populateDropdown(jobFunctionalityList, jobFunctionalityElement);

const jobTitleData = [
  {
    text: "Select Job Title",
    jobFunc: 0,
    value: 0,
  },
  {
    "value": 1,
    "jobFunc": 5,
    "text": "Account Development Manager",
  },
  {
    "value": 2,
    "jobFunc": 5,
    "text": "Branch Manager",
  },
  {
    "value": 3,
    "jobFunc": 5,
    "text": "Central Aisle Cashier",
  },
  {
    "value": 4,
    "jobFunc": 5,
    "text": "Customer Assistant",
  },
  {
    "value": 5,
    "jobFunc": 5,
    "text": "Director of Sales",
  },
  {
    "value": 6,
    "jobFunc": 5,
    "text": "Event Specialist",
  },
  {
    "value": 7,
    "jobFunc": 5,
    "text": "Inside Sales Manager",
  },
  {
    "value": 8,
    "jobFunc": 5,
    "text": "Outside Sales Consultant",
  },
  {
    "value": 9,
    "jobFunc": 5,
    "text": "Area Sales Manager",
  },
  {
    "value": 10,
    "jobFunc": 5,
    "text": "Cashier",
  },
  {
    "value": 11,
    "jobFunc": 5,
    "text": "Channel Sales Director",
  },
  {
    "value": 12,
    "jobFunc": 5,
    "text": "Customer Engagement Manager",
  },
  {
    "value": 13,
    "jobFunc": 5,
    "text": "Distribution Sales Manager",
  },
  {
    "value": 14,
    "jobFunc": 5,
    "text": "Field Merchandiser",
  },
  {
    "value": 15,
    "jobFunc": 5,
    "text": "Inside Sales Representative",
  },
  {
    "value": 16,
    "jobFunc": 5,
    "text": "Outside Sales Manager",
  },
  {
    "value": 17,
    "jobFunc": 5,
    "text": "Checker",
  },
  {
    "value": 18,
    "jobFunc": 5,
    "text": "Customer Service Representative (CSR)",
  },
  {
    "value": 19,
    "jobFunc": 5,
    "text": "District Sales Manager",
  },
  {
    "value": 20,
    "jobFunc": 5,
    "text": "General Manager",
  },
  {
    "value": 21,
    "jobFunc": 5,
    "text": "Marketing Representative",
  },
  {
    "value": 22,
    "jobFunc": 5,
    "text": "Demonstrator",
  },
  {
    "value": 23,
    "jobFunc": 5,
    "text": "Merchandiser",
  },
  {
    "value": 24,
    "jobFunc": 5,
    "text": "Outside Sales Representative",
  },
  {
    "value": 25,
    "jobFunc": 5,
    "text": "Product Sales Engineer",
  },
  {
    "value": 26,
    "jobFunc": 5,
    "text": "Sales and Marketing Vice President",
  },
  {
    "value": 27,
    "jobFunc": 5,
    "text": "Sales Consultant",
  },
  {
    "value": 28,
    "jobFunc": 5,
    "text": "Sales Engineer, Account Manager",
  },
  {
    "value": 29,
    "jobFunc": 5,
    "text": "Sales Representative",
  },
  {
    "value": 30,
    "jobFunc": 5,
    "text": "Senior Sales Engineer",
  },
  {
    "value": 31,
    "jobFunc": 5,
    "text": "Technical Sales Engineer",
  },
  {
    "value": 32,
    "jobFunc": 5,
    "text": "Telemarketing Sales Representative",
  },
  {
    "value": 33,
    "jobFunc": 5,
    "text": "Telesales Specialist",
  },
  {
    "value": 34,
    "jobFunc": 5,
    "text": "Product Ambassador",
  },
  {
    "value": 35,
    "jobFunc": 5,
    "text": "Regional Sales Manager",
  },
  {
    "value": 36,
    "jobFunc": 5,
    "text": "Sales Associate",
  },
  {
    "value": 37,
    "jobFunc": 5,
    "text": "Sales Engineer",
  },
  {
    "value": 38,
    "jobFunc": 5,
    "text": "Sales Engineer, Engineered Products",
  },
  {
    "value": 39,
    "jobFunc": 5,
    "text": "Sales Supervisor",
  },
  {
    "value": 40,
    "jobFunc": 5,
    "text": "Store Manager",
  },
  {
    "value": 41,
    "jobFunc": 5,
    "text": "Telemarketer",
  },
  {
    "value": 42,
    "jobFunc": 5,
    "text": "Telephone Sales Representative (TSR)",
  },
  {
    "value": 43,
    "jobFunc": 5,
    "text": "Vice President of Sales",
  },
  {
    "value": 44,
    "jobFunc": 5,
    "text": "Sales Manager",
  },
  {
    "value": 45,
    "jobFunc": 5,
    "text": "Telesales Representative",
  },
  {
    "value": 46,
    "jobFunc": 6,
    "text": "Account Director",
  },
  {
    "value": 47,
    "jobFunc": 6,
    "text": "Account Executive",
  },
  {
    "value": 48,
    "jobFunc": 6,
    "text": "Advertising Associate",
  },
  {
    "value": 49,
    "jobFunc": 6,
    "text": "Advertising Manager",
  },
  {
    "value": 50,
    "jobFunc": 6,
    "text": "Business Development Director",
  },
  {
    "value": 51,
    "jobFunc": 6,
    "text": "Client Service and Consulting Manager",
  },
  {
    "value": 52,
    "jobFunc": 6,
    "text": "Communications Specialist",
  },
  {
    "value": 53,
    "jobFunc": 6,
    "text": "Corporate Communications Specialist",
  },
  {
    "value": 54,
    "jobFunc": 6,
    "text": "Desktop Publisher",
  },
  {
    "value": 55,
    "jobFunc": 6,
    "text": "Account Manager",
  },
  {
    "value": 56,
    "jobFunc": 6,
    "text": "Advertising Coordinator",
  },
  {
    "value": 57,
    "jobFunc": 6,
    "text": "Brand Manager",
  },
  {
    "value": 58,
    "jobFunc": 6,
    "text": "Business Development Manager",
  },
  {
    "value": 59,
    "jobFunc": 6,
    "text": "Client Services Vice President",
  },
  {
    "value": 60,
    "jobFunc": 6,
    "text": "Community Relations Director",
  },
  {
    "value": 61,
    "jobFunc": 6,
    "text": "Creative Director",
  },
  {
    "value": 62,
    "jobFunc": 6,
    "text": "Digital Marketing Consultant",
  },
  {
    "value": 63,
    "jobFunc": 6,
    "text": "Business Development Specialist",
  },
  {
    "value": 64,
    "jobFunc": 6,
    "text": "Advertising Copy Writer",
  },
  {
    "value": 65,
    "jobFunc": 6,
    "text": "Director of Audience Generation, Search,& Analytics",
  },
  {
    "value": 66,
    "jobFunc": 6,
    "text": "Director of Digital Marketing",
  },
  {
    "value": 67,
    "jobFunc": 6,
    "text": "Director of Client Services",
  },
  {
    "value": 68,
    "jobFunc": 6,
    "text": "Director of Search Engine Optimization (Director of SEO)",
  },
  {
    "value": 69,
    "jobFunc": 6,
    "text": "Graphic Artist",
  },
  {
    "value": 70,
    "jobFunc": 6,
    "text": "Director, Search Marketing Strategies",
  },
  {
    "value": 71,
    "jobFunc": 6,
    "text": "Digital Marketing Manager",
  },
  {
    "value": 72,
    "jobFunc": 6,
    "text": "Director of Public Relations",
  },
  {
    "value": 73,
    "jobFunc": 6,
    "text": "Advertising Director",
  },
  {
    "value": 74,
    "jobFunc": 6,
    "text": "Digital Marketing Specialist",
  },
  {
    "value": 75,
    "jobFunc": 9,
    "text": "Assessment Services Manager",
  },
  {
    "value": 76,
    "jobFunc": 9,
    "text": "Benefits Coordinator",
  },
  {
    "value": 77,
    "jobFunc": 9,
    "text": "Chief Diversity Officer (CDO)",
  },
  {
    "value": 78,
    "jobFunc": 9,
    "text": "Compensation & Benefits Office Manager",
  },
  {
    "value": 79,
    "jobFunc": 9,
    "text": "Compensation Analyst",
  },
  {
    "value": 80,
    "jobFunc": 9,
    "text": "Compensation Manager",
  },
  {
    "value": 81,
    "jobFunc": 9,
    "text": "Corporate Recruiter",
  },
  {
    "value": 82,
    "jobFunc": 9,
    "text": "Development Manager",
  },
  {
    "value": 83,
    "jobFunc": 9,
    "text": "Employee Relations Manager",
  },
  {
    "value": 84,
    "jobFunc": 9,
    "text": "Field Operations Coordinator",
  },
  {
    "value": 85,
    "jobFunc": 9,
    "text": "HR Administrative Assistant",
  },
  {
    "value": 86,
    "jobFunc": 9,
    "text": "Industrial Psychologist",
  },
  {
    "value": 87,
    "jobFunc": 9,
    "text": "Job Analyst",
  },
  {
    "value": 88,
    "jobFunc": 9,
    "text": "Benefits Analyst",
  },
  {
    "value": 89,
    "jobFunc": 9,
    "text": "Benefits Manager",
  },
  {
    "value": 90,
    "jobFunc": 9,
    "text": "Compensation & Benefits Assistant",
  },
  {
    "value": 91,
    "jobFunc": 9,
    "text": "Compensation Director",
  },
  {
    "value": 92,
    "jobFunc": 9,
    "text": "Compensation and Benefits Manager",
  },
  {
    "value": 93,
    "jobFunc": 9,
    "text": "Computer Training Specialist",
  },
  {
    "value": 94,
    "jobFunc": 9,
    "text": "Corporate Trainer",
  },
  {
    "value": 95,
    "jobFunc": 9,
    "text": "Director of Human Resources",
  },
  {
    "value": 96,
    "jobFunc": 9,
    "text": "Employment Coordinator",
  },
  {
    "value": 97,
    "jobFunc": 9,
    "text": "Grievance Manager",
  },
  {
    "value": 98,
    "jobFunc": 9,
    "text": "Human Resources Business Partner",
  },
  {
    "value": 99,
    "jobFunc": 9,
    "text": "Intermediate Benefits Analyst",
  },
  {
    "value": 100,
    "jobFunc": 9,
    "text": "Job Training Specialist",
  },
  {
    "value": 101,
    "jobFunc": 9,
    "text": "E-Learning Developer",
  },
  {
    "value": 102,
    "jobFunc": 9,
    "text": "Consulting Psychologist",
  },
  {
    "value": 103,
    "jobFunc": 9,
    "text": "Human Resources Manager",
  },
  {
    "value": 104,
    "jobFunc": 9,
    "text": "Intermediate Compensation Analyst",
  },
  {
    "value": 105,
    "jobFunc": 9,
    "text": "Labor Relations Director",
  },
  {
    "value": 106,
    "jobFunc": 8,
    "text": "Administrative Aide",
  },
  {
    "value": 107,
    "jobFunc": 8,
    "text": "Business Administrator",
  },
  {
    "value": 108,
    "jobFunc": 8,
    "text": "Buyer",
  },
  {
    "value": 109,
    "jobFunc": 8,
    "text": "Department Secretary",
  },
  {
    "value": 110,
    "jobFunc": 8,
    "text": "Executive Administrative Assistant",
  },
  {
    "value": 111,
    "jobFunc": 8,
    "text": "Executive Secretary",
  },
  {
    "value": 112,
    "jobFunc": 8,
    "text": "General Manager (GM)",
  },
  {
    "value": 113,
    "jobFunc": 8,
    "text": "Administrative Assistant",
  },
  {
    "value": 114,
    "jobFunc": 8,
    "text": "Business Manager",
  },
  {
    "value": 115,
    "jobFunc": 8,
    "text": "Chief Operating Officer (COO)",
  },
  {
    "value": 116,
    "jobFunc": 8,
    "text": "Director of Operations",
  },
  {
    "value": 117,
    "jobFunc": 8,
    "text": "Executive Assistant",
  },
  {
    "value": 118,
    "jobFunc": 8,
    "text": "Facilities Manager",
  },
  {
    "value": 119,
    "jobFunc": 8,
    "text": "Office Assistant",
  },
  {
    "value": 120,
    "jobFunc": 8,
    "text": "Administrative Associate",
  },
  {
    "value": 121,
    "jobFunc": 8,
    "text": "Clerk Typist",
  },
  {
    "value": 122,
    "jobFunc": 7,
    "text": "Account Clerk",
  },
  {
    "value": 123,
    "jobFunc": 7,
    "text": "Accounting Assistant",
  },
  {
    "value": 124,
    "jobFunc": 7,
    "text": "Accounting Manager",
  },
  {
    "value": 125,
    "jobFunc": 7,
    "text": "Accounting Supervisor",
  },
  {
    "value": 126,
    "jobFunc": 7,
    "text": "Accounts Payable Specialist",
  },
  {
    "value": 127,
    "jobFunc": 7,
    "text": "Accounts Receivable Clerk",
  },
  {
    "value": 128,
    "jobFunc": 7,
    "text": "Assurance Senior",
  },
  {
    "value": 129,
    "jobFunc": 7,
    "text": "Audit Partner",
  },
  {
    "value": 130,
    "jobFunc": 7,
    "text": "Auditor-in-Charge",
  },
  {
    "value": 131,
    "jobFunc": 7,
    "text": "Billing Clerk",
  },
  {
    "value": 132,
    "jobFunc": 7,
    "text": "Budget Analyst",
  },
  {
    "value": 133,
    "jobFunc": 7,
    "text": "Budget Officer",
  },
  {
    "value": 134,
    "jobFunc": 7,
    "text": "Accounting Associate",
  },
  {
    "value": 135,
    "jobFunc": 7,
    "text": "Accounting Officer",
  },
  {
    "value": 136,
    "jobFunc": 7,
    "text": "Accounting Technician",
  },
  {
    "value": 137,
    "jobFunc": 7,
    "text": "Accounts Payable Supervisor",
  },
  {
    "value": 138,
    "jobFunc": 7,
    "text": "Accounts Receivable Manager",
  },
  {
    "value": 139,
    "jobFunc": 7,
    "text": "Audit Manager",
  },
  {
    "value": 140,
    "jobFunc": 7,
    "text": "Auditor",
  },
  {
    "value": 141,
    "jobFunc": 7,
    "text": "Biller",
  },
  {
    "value": 142,
    "jobFunc": 7,
    "text": "Billing Coordinator",
  },
  {
    "value": 143,
    "jobFunc": 7,
    "text": "Budget and Policy Analyst",
  },
  {
    "value": 144,
    "jobFunc": 7,
    "text": "Account Receivable Clerk",
  },
  {
    "value": 145,
    "jobFunc": 7,
    "text": "Accountant",
  },
  {
    "value": 146,
    "jobFunc": 7,
    "text": "Accounting Clerk",
  },
  {
    "value": 147,
    "jobFunc": 7,
    "text": "Accounts Payables Clerk",
  },
  {
    "value": 148,
    "jobFunc": 7,
    "text": "Accounts Receivable Specialist",
  },
  {
    "value": 149,
    "jobFunc": 7,
    "text": "Billing Specialist",
  },
  {
    "value": 150,
    "jobFunc": 7,
    "text": "Budget Coordinator",
  },
  {
    "value": 151,
    "jobFunc": 7,
    "text": "Chief Financial Officer (CFO)",
  },
  {
    "value": 152,
    "jobFunc": 7,
    "text": "Collector",
  },
  {
    "value": 153,
    "jobFunc": 7,
    "text": "Cost Accountant",
  },
  {
    "value": 154,
    "jobFunc": 7,
    "text": "Debt Collector",
  },
  {
    "value": 155,
    "jobFunc": 7,
    "text": "Finance Vice President",
  },
  {
    "value": 156,
    "jobFunc": 7,
    "text": "Financial Business Analyst",
  },
  {
    "value": 157,
    "jobFunc": 7,
    "text": "Internal Audit Director",
  },
  {
    "value": 158,
    "jobFunc": 7,
    "text": "Payroll Administrator",
  },
  {
    "value": 159,
    "jobFunc": 7,
    "text": "Payroll Clerk",
  },
  {
    "value": 160,
    "jobFunc": 7,
    "text": "Payroll Technician",
  },
  {
    "value": 161,
    "jobFunc": 7,
    "text": "Staff Analyst",
  },
  {
    "value": 162,
    "jobFunc": 7,
    "text": "Collections Manager",
  },
  {
    "value": 163,
    "jobFunc": 7,
    "text": "Comptroller",
  },
  {
    "value": 164,
    "jobFunc": 7,
    "text": "Credit Clerk",
  },
  {
    "value": 165,
    "jobFunc": 7,
    "text": "Deputy for Audit",
  },
  {
    "value": 166,
    "jobFunc": 7,
    "text": "Financial Auditor",
  },
  {
    "value": 167,
    "jobFunc": 7,
    "text": "Financial Reporting Accountant",
  },
  {
    "value": 168,
    "jobFunc": 7,
    "text": "Internal Auditor",
  },
  {
    "value": 169,
    "jobFunc": 7,
    "text": "Payroll and Benefits Specialist",
  },
  {
    "value": 170,
    "jobFunc": 7,
    "text": "Payroll Coordinator",
  },
  {
    "value": 171,
    "jobFunc": 7,
    "text": "Personnel Assistant",
  },
  {
    "value": 172,
    "jobFunc": 7,
    "text": "Telephone Collector",
  },
  {
    "value": 173,
    "jobFunc": 7,
    "text": "Controller",
  },
  {
    "value": 174,
    "jobFunc": 7,
    "text": "Finance Director",
  },
  {
    "value": 175,
    "jobFunc": 7,
    "text": "General Accountant",
  },
  {
    "value": 176,
    "jobFunc": 7,
    "text": "Payroll Assistant",
  },
  {
    "value": 177,
    "jobFunc": 7,
    "text": "Payroll Representative",
  },
  {
    "value": 178,
    "jobFunc": 7,
    "text": "Staff Accountant",
  },
  {
    "value": 179,
    "jobFunc": 7,
    "text": "Treasurer",
  },
  {
    "value": 180,
    "jobFunc": 7,
    "text": "Finance Manager",
  },
  {
    "value": 181,
    "jobFunc": 7,
    "text": "Payroll Specialist",
  },
  {
    "value": 182,
    "jobFunc": 1,
    "text": "Bank audit and compliance",
  },
  {
    "value": 183,
    "jobFunc": 1,
    "text": "Branch banking",
  },
  {
    "value": 184,
    "jobFunc": 1,
    "text": "Card services",
  },
  {
    "value": 185,
    "jobFunc": 1,
    "text": "Commercial lending operations",
  },
  {
    "value": 186,
    "jobFunc": 1,
    "text": "Intevestment banking",
  },
  {
    "value": 187,
    "jobFunc": 1,
    "text": "Bank investment risk management",
  },
  {
    "value": 188,
    "jobFunc": 1,
    "text": "Bank retail lending",
  },
  {
    "value": 189,
    "jobFunc": 1,
    "text": "Bank retail operations",
  },
  {
    "value": 190,
    "jobFunc": 1,
    "text": "Treasury services",
  },
  {
    "value": 191,
    "jobFunc": 1,
    "text": "Wealth management and personal trust",
  },
  {
    "value": 192,
    "jobFunc": 1,
    "text": "Investment Management services",
  },
  {
    "value": 193,
    "jobFunc": 1,
    "text": "Capital market services",
  },
  {
    "value": 194,
    "jobFunc": 1,
    "text": "Small business banking",
  },
  {
    "value": 195,
    "jobFunc": 1,
    "text": "Digital banking",
  },
  {
    "value": 196,
    "jobFunc": 4,
    "text": "Front-End Engineer",
  },
  {
    "value": 197,
    "jobFunc": 4,
    "text": "Back-End Engineer",
  },
  {
    "value": 198,
    "jobFunc": 4,
    "text": "Full Stack Engineer",
  },
  {
    "value": 199,
    "jobFunc": 4,
    "text": "Software Engineer in Test (QA Engineer)",
  },
  {
    "value": 200,
    "jobFunc": 4,
    "text": "Software Development Engineer in Test (SDET)",
  },
  {
    "value": 201,
    "jobFunc": 4,
    "text": "DevOps Engineer",
  },
  {
    "value": 202,
    "jobFunc": 4,
    "text": "Security Engineer",
  },
  {
    "value": 203,
    "jobFunc": 4,
    "text": "Data Engineer",
  },
  {
    "value": 204,
    "jobFunc": 4,
    "text": "Cloud Architect",
  },
  {
    "value": 205,
    "jobFunc": 3,
    "text": "Chief Information Officer (CIO)",
  },
  {
    "value": 206,
    "jobFunc": 3,
    "text": "Information Systems Director (IS Director)",
  },
  {
    "value": 207,
    "jobFunc": 3,
    "text": "Information Technology Director (IT Director)",
  },
  {
    "value": 208,
    "jobFunc": 3,
    "text": "Information Systems Manager (IS Manager)",
  },
  {
    "value": 209,
    "jobFunc": 3,
    "text": "Information Technology Manager (IT Manager)",
  },
  {
    "value": 210,
    "jobFunc": 3,
    "text": "Information Systems Supervisor (IS Supervisor)",
  },
  {
    "value": 211,
    "jobFunc": 3,
    "text": "IT Program Manager",
  },
  {
    "value": 212,
    "jobFunc": 3,
    "text": "IT Project Manager",
  },
  {
    "value": 213,
    "jobFunc": 3,
    "text": "Lead IT Project Manager",
  },
  {
    "value": 214,
    "jobFunc": 3,
    "text": "Data Processing Manager",
  },
  {
    "value": 215,
    "jobFunc": 3,
    "text": "Computer Technician",
  },
  {
    "value": 216,
    "jobFunc": 3,
    "text": "Network Technician",
  },
  {
    "value": 217,
    "jobFunc": 3,
    "text": "Network Support Specialist",
  },
  {
    "value": 218,
    "jobFunc": 3,
    "text": "Local Area Network Administrator (LAN Administrator)",
  },
  {
    "value": 219,
    "jobFunc": 3,
    "text": "Network Analyst",
  },
  {
    "value": 220,
    "jobFunc": 3,
    "text": "Network Engineer",
  },
  {
    "value": 221,
    "jobFunc": 3,
    "text": "Network Manager",
  },
  {
    "value": 222,
    "jobFunc": 3,
    "text": "Systems Engineer",
  },
  {
    "value": 223,
    "jobFunc": 3,
    "text": "Infrastructure Engineer",
  },
  {
    "value": 224,
    "jobFunc": 3,
    "text": "Security Administrator",
  },
  {
    "value": 225,
    "jobFunc": 3,
    "text": "Systems Security Analyst",
  },
  {
    "value": 226,
    "jobFunc": 3,
    "text": "Telecommunications Analyst",
  },
  {
    "value": 227,
    "jobFunc": 3,
    "text": "Telecommunications Engineer",
  },
  {
    "value": 228,
    "jobFunc": 3,
    "text": "Computer Support Specialist",
  },
  {
    "value": 229,
    "jobFunc": 3,
    "text": "Help Desk Analyst",
  },
  {
    "value": 230,
    "jobFunc": 3,
    "text": "Applications Analyst",
  },
  {
    "value": 231,
    "jobFunc": 3,
    "text": "Applications Architect",
  },
  {
    "value": 232,
    "jobFunc": 3,
    "text": "Computer Systems Analyst",
  },
  {
    "value": 233,
    "jobFunc": 3,
    "text": "Database Analyst",
  },
  {
    "value": 234,
    "jobFunc": 3,
    "text": "IT Business Analyst",
  },
  {
    "value": 235,
    "jobFunc": 3,
    "text": "IT Business Systems Analyst",
  },
  {
    "value": 236,
    "jobFunc": 3,
    "text": "Quality Assurance Analyst (QA Analyst)",
  }
];

populateDropdown(jobTitleData, jobTitleElement);
// Event listener for job functionality change
jobFunctionalityElement.addEventListener("change", (event) => {
  const selectedJobFunctionality = event.target.value;
  const jobTitleList = jobTitleData.filter(
    (value) => value.jobFunc === parseInt(selectedJobFunctionality)
  );

  populateDropdown(jobTitleList, jobTitleElement);
});
