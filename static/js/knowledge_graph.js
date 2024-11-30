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

  let jobAssessmentArray = jobTitleData.find(
    (job) => job.value == jobTitle
  ).functionalAssessment;

  let assessmentArray = [];
  if (jobAssessmentArray.length == 0) {
    // Validate form data
    assessmentArray = jobFunctionalityList.find(
      (job) => job.value == jobFunctionality
    ).functionalCompetencies;
  } else {
    assessmentArray = jobAssessmentArray;
  }

  const functionalCompetencies = assessmentArray.length;
  if (jobFunctionalityList.find((job) => job.value == jobFunctionality).text == "Pharmaceutical"){
    assessmentArray = assessmentArray.concat(coreCompetencyPharmaceutical);
  }
  else if (jobFunctionalityList.find((job) => job.value == jobFunctionality).text == "Travel Industry"){
    assessmentArray = assessmentArray.concat(coreCompetencyTravel);
  }
  else{
    assessmentArray = assessmentArray.concat(coreCompetency);
  }

  const jobTitleName = jobTitleData
    .find((job) => job.value == jobTitle)
    .text.toLowerCase();

  if (
    jobTitleName.includes("manager") ||
    jobTitleName.includes("director") ||
    jobTitleName.includes("vice president") ||
    jobTitleName.includes("chief")
  ) {

    let LeadershipCompetency = {
      title: "Leadership",
      desc: "Demonstrates inclusivity in work processes and among working teams.Actively seeks out and invites alternative viewpoints. Listens attentively and respectfully. Builds highly effective and cohesive teams. Provides ongoing feedback. Leads with a growth mindset.",
    };
    assessmentArray.push(LeadershipCompetency);
  }

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
  infoSpan.textContent =
    "Selecting (NA) for a question will not affect your overall assessment score.";
  titleSection.appendChild(infoSpan);

  formElement.appendChild(titleSection);
  formElement.appendChild(
    createFormAssessment(assessmentArray, functionalCompetencies)
  );

  submitButton = document.getElementById("submit-button");

  submitButton.addEventListener("click", async (event) => {
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
      else {
        sliderValues[i] = parseInt(0);
      }
    }

    let userName = document.getElementById("username").value;
    
    
    sliderValuesFiltered = sliderValues.filter((value) => value !== "0");
    const sum = sliderValuesFiltered.reduce((a, b) => a + b, 0);
    const average = sum / sliderValuesFiltered.length;
    
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
    // Show result to add to database
    // console.log(name, jobFunctionality, jobTitle, monthsInRole, sliderValues);
    // Add the assessment to the database
    const assessment = {
      name: name,
      jobFunction: jobFunctionality,
      jobTitle: jobTitle,
      monthsInRole: monthsInRole,
      jobSkills: sliderValues,
      username: userName,
      score: weightedAssessmentScore,
    };
    await fetch(window.location.protocol+ "//" + window.location.host + "/add-competency", {
      method: "POST",
      body: JSON.stringify(assessment),
      headers: {
        "Content-Type": "application/json",
      },
    });
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
      {
        title: "Client Focus",
        desc: "Includes knowledge of client needs and the ability to provide client-focused services.",
      },
      {
        title: "Planning and Organizing",
        desc: "Includes knowledge of planning and organizing principles and the ability to prioritize and plan work activities.",
      },
      {
        title: "Fostering Communication",
        desc: "Includes knowledge of communication principles and the ability to communicate effectively.",
      },
      {
        title: "Attention to Detail",
        desc: "Includes knowledge of attention to detail principles and the ability to manage information and data.",
      },
      {
        title: "Professionalism",
        desc: "Includes knowledge of professionalism principles and the ability to demonstrate professionalism.",
      },
      {
        title: "Collaborating with Others",
        desc: "Includes knowledge of collaboration principles and the ability to work effectively with others.",
      },
      {
        title: "Problem Solving",
        desc: "Includes knowledge of problem-solving principles and the ability to solve problems.",
      },
      {
        title: " Achievement Orientation",
        desc: "Includes knowledge of achievement orientation principles and the ability to achieve results.",
      },
    ],
  },
  {
    value: 11,
    text: "Business Development",
    desc: [
      "Use strategic planning to ensure sale of services, analyzing business developments and monitoring market trends, market characteristics, and cost markup factors. Identify main client groups and audiences, determine the best way to communicate publicity information to them, and develop and implement a communication plan on appropriate channels to promote products or services, and identify, collect, and report appropriate (KPIs). Consult with product development personnel on service specifications to meet demand and trends.",
    ],
    functionalCompetencies: [
      {
        title: "Analyze business trends",
        desc: "Analyze business trends and identify opportunities for growth.",
      },
      { title: "Marketing", desc: "Develop and implement a marketing plan." },
      { title: "Meet Demand", desc: "Identify and meet customer demand." },
      {
        title: "Business Intelligence",
        desc: "Use business intelligence to make strategic decisions.",
      },
      { title: "Researching", desc: "Conduct market research." },
      {
        title: "Documentation of BDM activities",
        desc: "Document business development activities.",
      },
    ],
  },
  {
    value: 8,
    text: "Business Operations",
    desc: [
      "The functional skills needed to perform a business operations job are mainly focused on the ability to perform the specific tasks.  A business operations role is not just tasked with ensuring the operational health, but is directly linked to the overall growth, and profitability strategies of the business.",
    ],
    functionalCompetencies: [
      { title: "Asset Management", desc: "" },
      { title: "Concern for Safety", desc: "" },
      { title: "Global Business Perspective - Business Acumen", desc: "" },
      { title: "Global Sourcing", desc: "" },
      { title: "Information Management", desc: "" },
      { title: "Inventory/Supply Management", desc: "" },
      { title: "Logistic and transportation Management", desc: "" },
      { title: "Management Project Communications", desc: "" },
      { title: "Management Project Execution", desc: "" },
      { title: "Negotiation", desc: "" },
      { title: "Procurement Management", desc: "" },
      { title: "Project Planning", desc: "" },
      { title: "Project Risk & Change Management", desc: "" },
      { title: "Requirement Analysis", desc: "" },
      { title: "Sourcing", desc: "" },
      { title: "Strategic Planning of Sourcing Requirements", desc: "" },
      { title: "Supplier Relationship Management", desc: "" },
      { title: "Vendor Management", desc: "" },
      { title: "Warehouse/Stores Management", desc: "" },
    ],
  },
  {
    value: 10,
    text: "Education K-12",
    desc: [
      "The assessment questionnaire helps in identifying how the standards of functional delivery of K-12 school profess are measured and assessed.  This helps with the overall evaluation and management process ensuring standardized quality of the education delivered to the students.",
    ],
    functionalCompetencies: [
      { title: "Knowledge Management", desc: "" },
      { title: "Standard Operating Procedures (SOP)", desc: "" },
      { title: "Creativity", desc: "" },
      { title: "Flexibility and Adaptability", desc: "" },
      { title: "Oral Communication", desc: "" },
      { title: "Effective Communication", desc: "" },
      { title: "Presentations", desc: "" },
      { title: "Coaching", desc: "" },
      { title: "Decision Making and Critical Thinking", desc: "" },
      { title: "Educational Psychology", desc: "" },
      { title: "Child Psychology", desc: "" },
      { title: "Educational Professional Ethics Compliance", desc: "" },
      { title: "Student Counseling", desc: "" },
      { title: "Planning and Organizing", desc: "" },
      { title: "Academic Counseling", desc: "" },
      { title: "Academic Research", desc: "" },
      { title: "Knowledge of a Specific Academic Discipline", desc: "" },
      { title: "Academic Assessment", desc: "" },
      { title: "Academic Support System Administration", desc: "" },
      { title: "Educational Program Management", desc: "" },
      { title: "Student Performance Management", desc: "" },
      { title: "Lesson Planning and Delivery", desc: "" },
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
      {
        title: "Project Management",
        desc: "Includes knowledge of: IT project frameworks and their corresponding lifecycle; project management concepts, tools, and best practices; project reporting standards; and developing project plans.",
      },
      {
        title: "Requirements Gathering",
        desc: "Includes ability to identify key players and knowledge of requirements gathering techniques (i.e. brainstorming, document analysis, focus groups, interviews, prototyping, surveys, observation, reverse engineering, and workshops).",
      },
      {
        title: "Business Analysis",
        desc: "Includes knowledge of business functions and processes, business decision-making processes, and business case methodologies and measurement.",
      },
      {
        title: "Documentation and Measurement ",
        desc: "Includes knowledge of documentation procedures and the ability to track changes, make updates, and relay other important information related to IT systems.",
      },
      {
        title: "Troubleshooting and Support",
        desc: "Includes knowledge of troubleshooting and support processes, knowledge of troubleshooting techniques, and the ability to be responsive to key issues.",
      },
      {
        title: "Policy and Compliance",
        desc: "Includes knowledge of relevant external policy and compliance procedures and relevant organizational policy and compliance procedures.",
      },
      {
        title: "Security and Data Protection",
        desc: "Includes knowledge of relevant security legislation and laws, security procedures and practices, and information management (i.e. information quality, accessibility, security, accuracy, and integrity).",
      },
      {
        title: "Modeling",
        desc: "Includes knowledge of tools and methodologies (UML, BPMN, etc.); systems and business architecture modeling; and modeling abilities for applications, IT systems, business systems, system integration, and data.",
      },
      {
        title: "Programming",
        desc: "Includes knowledge of relevant programming languages and programming abilities for application development (C++, java), web design (HTML), database and warehouse development (SQL), etc. Further, knowledge of problem and system decomposition, along with code organization and the ability to develop readable code.",
      },
      {
        title: "Testing and Quality Assurance",
        desc: "Includes the ability to test for quality assurance and control, and the ability to develop test cases, strategies, methodologies, and standards. Further, includes the ability to test different types (volume, unit, stress) and develop testing tools (scripts, reports).",
      },
      {
        title: "Installation and Integration",
        desc: "Includes knowledge of installation and integration procedures, and knowledge of common installation and integration tools and techniques.",
      },
      {
        title: "Vendor Selection and Management",
        desc: "Includes knowledge of the process to get information on vendor offerings, vendor management, and vendor selection.",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans." 
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value." 
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders." 
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis." 
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully." 
      }
    ],
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
    functionalCompetencies: [],
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
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans." 
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value." 
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders." 
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis." 
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully." 
      }
    ],
  },
  {
    value: 9,
    text: "Human Resources",
    desc: [
      "A Human Resources Role Is Not Just Tasked With Ensuring The Organizational Health, but is directly linked to the Overall Growth, And Profitability Strategies of the business.",
    ],
    functionalCompetencies: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Facilitation",
        desc: "Takes an objective stance when guiding a group through a process to achieve defined objectives, enable collaborative knowledge transfer, and encourage participation.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Branding and Marketing",
        desc: "Includes managing branding of the employee value proposition (EVP), the ability to plan and develop communications content, and disseminating key messages using different mediums, including social media. Effectively communicates and promotes HR programs and initiatives.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 2,
    text: "Insurance",
    desc: [
      "A structured approach to capturing the skills of the industry specific requirements have been used.  The roles cover key tasks such as: Product innovation, Major product version updates, Claims and cost management, Sales production and customer service, Industry consolidation, mergers and acquisitions, Operational outsourcing, Compliance and quality (regulatory, quality, etc)",
    ],
    functionalCompetencies: [
      { title: "Knowledge of Organization", desc: "" },
      { title: "Service Excellence", desc: "" },
      { title: "Business Ethics", desc: "" },
      { title: "Office Support Tools", desc: "" },
      { title: "Flexibility and Adaptability", desc: "" },
      { title: "Teamwork", desc: "" },
      { title: "Accuracy and Attention to Detail", desc: "" },
      { title: "Initiative", desc: "" },
      { title: "Analytical Thinking", desc: "" },
      { title: "Followership", desc: "" },
      { title: "Insurance Legal and Regulatory Environment", desc: "" },
      { title: "Insurance Finance and Actuarial Concepts", desc: "" },
      { title: "Internet-Enabled Insurance Services", desc: "" },
      { title: "Agency Support", desc: "" },
      { title: "Knowledge of Underwriting", desc: "" },
      { title: "Risk Analysis and Selection", desc: "" },
      { title: "Pricing", desc: "" },
      { title: "Book Management", desc: "" },
      { title: "Producer Management", desc: "" },
      { title: "Provider Management", desc: "" },
      { title: "Medical Informatics", desc: "" },
      { title: "Knowledge of Reinsurance", desc: "" },
      { title: "Life Insurance", desc: "" },
      { title: "Health Insurance", desc: "" },
    ],
  },
  {
    value: 12,
    text: "Manufacturing",
    desc: [
      "Through a structured approach to understanding the skills and capabilities required, equipping those in this industry to ... - capture, recognize, and enhance innovation, - Enable product version updates, Keep track of vendor certification and support, - Be better prepared to compete for business and talent, - Management of costs and expenses, - Be equipped for compliance and quality (ISO, Regulatory, CMMI, Environmental), - Supply chain management ",
    ],
    functionalCompetencies: [
      {
        title: "Operational Functions",
        desc: "Understanding and managing core business processes.",
      },
      { title: "Products and Services", desc: "Deep knowledge of the organization's offerings and market." },
      { title: "Core Application Systems", desc: "Proficiency in key software tools and systems." },
      {
        title: "Risk Management",
        desc: "Identifying, assessing, and mitigating risks.",
      },
      { title: "Business Case Justification", desc: " Developing sound arguments for strategic decisions." },
      {
        title: "Process Management",
        desc: "Optimizing workflows and procedures.",
      },
      {
        title: "Employee Health and Safety",
        desc: "Prioritizing employee well-being and compliance with regulations.",
      },
      {
        title: "Problem Solving",
        desc: "Effectively addressing challenges and finding solutions.",
      },
      {
        title: "Effective Communications",
        desc: "Communicating clearly and persuasively.",
      },
      {
        title: "Decision Making and Critical Thinking",
        desc: "Analyzing information and making informed choices.",
      },
    ],
  },
  {
    value: 6,
    text: "Marketing",
    desc: [
      "The role of marketing has transformed and evolved.  The fundamental marketing skills that cut across the variety of marketing roles are represented here and can be used by many organizations.The depth of a specific skill set is influenced by hands-on experience of practicing the skill and how it is combined with other skills over time.",
    ],
    functionalCompetencies: [
      {
        title: "Industry Analysis",
        desc: "Includes the ability to forecast industry growth and examine trends in global and local markets. Further, it includes the ability to identify opportunities, conduct consumer segmentation analyses, collect competitor intelligence where possible, and have knowledge of the product lifecycle, product substitutes, and design best practices.",
      },
      {
        title: "Consumer and Customer Analysis",
        desc: "Includes the ability to identify target market selection, conduct analysis on consumer trends and buying power, develop insights on customers, and accurately forecast demand.",
      },
      {
        title: "Campaign Planning and Execution",
        desc: "Includes the ability to plan and develop marketing content, use different promotional mediums, disseminate marketing messages, conduct profitability analysis, plan for internal assessments around risk adoption, and manage external agencies where needed through an analysis of all campaign costs, both internal and external.",
      },
      {
        title: "Marketing Operations",
        desc: "Includes the ability to analyze and report on performance metrics, skills in customer relationship management (CRM), knowledge of data collection methods, knowledge of maintenance standards and integrity, and ability to develop project timelines, identify scope, and create budget.",
      },
      {
        title: "Demand Generation and Lead Management",
        desc: "Includes developing, qualifying, and nurturing promotions; identifying how to develop demand and lead management processes; knowledge of how to increase the speed of customer purchasing; and knowledge of when to offer promotional discounts to incent buyers.",
      },
      {
        title: "Sales Support",
        desc: "Includes knowledge of sales collateral and pipeline acceleration (i.e. accelerating the purchasing process for the buyer).",
      },
      {
        title: "Distribution Channels Support and Analysis",
        desc: "Includes the ability to analyze and support the distribution network, maintain distribution channel relationships, and support sales divisions with both direct and indirect sales channels.",
      },
      {
        title: "Customer Experience and Engagement Creation",
        desc: "Includes planning initial customer onboarding, developing word-of-mouth (WOM) initiatives, spearheading customer data initiatives, and developing customer loyalty programs.",
      },
      {
        title: "Product Planning and Development",
        desc: "Includes planning for new and existing product or service development through analyses of pricing, product packaging and design, product positioning, knowledge of the product lifecycle, and knowledge of merchandising and placement.",
      },
      {
        title: "Communications Development",
        desc: "Includes the ability to communicate internal/corporate marketing, external communication skills, crafting the organizational image, creating public and media relations campaigns, developing partnerships and sponsorships, and working with advertising agencies to aid in advertising development.",
      },
      {
        title: "Event Planning and Development",
        desc: "Includes planning event logistics, vendor management, coordinating with organization and party management, and working with third-party events",
      },
      {
        title: "Brand Development",
        desc: "Includes knowledge of brand development and positioning tactics, brand awareness and integrity, inventory of branded items, brand stewardship, and developing and measuring brand loyalty.",
      },
      {
        title: "Online Channel Support and Analysis",
        desc: "Includes social media marketing, knowledge of digital platforms and processes (webinars and teleconferencing), search engine marketing (SEM, SEO, and paid searches), mobile marketing, web development skills, and knowledge of marketing automation (email marketing, lead management automation, and enterprise marketing management).",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans." 
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value." 
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders." 
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis." 
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully." 
      }
    ],
  },
  {
    value: 13,
    text: "Pharmaceutical",
    desc: [
      "The Pharmaceutical Competencies aims to harmonize workforce development efforts and establish internationally accepted set of best practices. This maximizes the benefit of collaboration and cooperation in the field of medical products regulatory management",
    ],
    functionalCompetencies: [],
  },
  {
    value: 5,
    text: "Sales",
    desc: [
      "The skills needed to perform jobs in the Sales Function include subject knowledge and technical know-how, as well as  other functional skills related to a specific business.  The skills we identified are what is used by most organizations. The skills that are most valued, recognized for career advancement, and accordingly rewarded.",
    ],
    functionalCompetencies: [
      {
        title: "Business and Industry Analysis",
        desc: "Includes knowledge of common pricing and promotions, forecasting competitors' behavior, industry trends and forecasting, and client needs and forecasting. ",
      },
      {
        title: "Product Analysis",
        desc: "Includes creating organizational product offerings, taking in product feedback, crafting the organizational value proposition and client-product alignment, and having knowledge of competitors' offerings.",
      },
      {
        title: "Client Onboarding ",
        desc: "Includes knowledge of the client-organization onboarding, creating a smooth client transition to the organization's account manager, and working through all referrals.",
      },
      {
        title: "Overarching Sales Delivery",
        desc: "Includes ensuring service delivery quality, having knowledge of the sales process, responding to client queries, working through customer relationship management (CRM), performing data collection, ensuring data integrity, performing activity management, and working through client satisfaction surveys and individual feedback.",
      },
      {
        title: "Demand Generation",
        desc: "Includes working through sales prospecting, handling sales calls, researching and identifying sales opportunities, and ensuring data integrity in the search process.",
      },
      {
        title: "Development of Leads to Sales",
        desc: "Includes handling objections, qualifying opportunities and gauging the client's stage in the buying process, and working through negotiations with buyers.",
      },
      {
        title: "Sales Closing",
        desc: "Includes the ability to close the sale. Further, it includes the ability to cross-sell and upgrade or up-sell products where appropriate.",
      },
      {
        title: "Growing Accounts",
        desc: "Includes upgrading or up-selling (or cross-selling) clients' accounts, handling objections, and working through negotiations in the account growth process.",
      },
      {
        title: "Renewing Accounts",
        desc: "Includes reviewing all accounts, asking the client to renew, and handling difficult renewals.",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans." 
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value." 
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders." 
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis." 
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully." 
      }
    ],
  },
  {
    value: 14,
    text: "Travel Industry",
    desc: [
      "This is a useful tool used in identifying the job specific skills of the Travel Industry, promoting development, career progression, and lifelong learning.",
    ],
    functionalCompetencies: [],
  },
  {
    value: 15,
    text: "Business Process Outsourcing",
    desc: [
      "The business processes include contact centers, such as help desks, and various types of back office work, such as accounting, market research, tax preparation, airline and hotel reservations. They also include professional services such as medical transcription, data entry, digitizing, animation and multi-media.",
    ],
    functionalCompetencies: [
      {title:"Language proficiency",desc:"The ability to deliver the work required at the required level of delivery in the specific language needed to perform the work"},
      {title:"Domain expertise",desc:"The ability to apply and build knowledge of what the topic, it's target process, and the ability to retain knowledge sufficiently."},
      {title:"Customer care",desc:"The ability and willingness to work with the client to deliver quality customer experience."},
      {title:"Dispute resolution",desc:"The ability to deal well with conflict situations, avoiding escalations and negative customer experience."},
      {title:"Knowing your client",desc:"The ability and willingness to find out what the customer wants and needs and to act accordingly, taking the organization's costs and benefits into account."},
      {title:"Building rapport",desc:"The ability to identify common interests or common ground that all parties can agree upon.  The existence of a defined common ground to indicate trust and understanding."},
      {title:"Building trust",desc:"Gaining others' confidence by acting with integrity and following through on commitments, while sharing own perspective."},
    ],
  },
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
  {
    title: "Design Thinking",
    desc: "It is a creative problem-solving mindset and methodology which transforms complex problems into opportunities for development.The adoption of design thinking aims to promote greater collaboration amongst teams and supports organizations’ innovation agenda."
  }
];

const coreCompetencyPharmaceutical = [
  {
    title: "Collaboration",
    desc: "Promotes collaboration and open communication.  Establishes working relationships and communication inside and outside of the organization. Assumes additional responsibilities to achieve team goals.",
  },
  {
    title: "Communication",
    desc: "Listens calmly, diligently, and with empathy.  Responds using appropriate approaches.  Clarifies own understanding when necessary. Identifies audience appropriate communication strategies. Interprets and addresses questions effectively.",
  },
  {
    title: "Decision making",
    desc: "Recognizes implicit causes and consequences of actions and events. Uses logic and reasoning to identify strengths and weaknesses of alternative solutions.",
  },
  {
    title: "Problem solving",
    desc: "Adapts to new ideas and initiatives relevant to own area of work. Identifies risks and unknowns of each situation. Deals objectively with criticism of role/work. Achieves results through diplomatic handling of disagreements.",
  },
  {
    title: "Evidence informed practices",
    desc: "Interprets correctly national and international regulations, standards, guidelines and requirements.  Explains differences between primary source and secondary source  when citing professional literature. Makes business decisions based on frameworks and tools and considers risk, trade-off, timings, and available resources.",
  },
  {
    title: "Personal conduct",
    desc: "Complies with regulatory and technical requirements. Monitors procedures and methodologies accurately. Ensures integrity and compliance of work based on standards and regulations. Revises an existing control procedure in accordance with established change control systems.",
  },
  {
    title: "Integrity",
    desc: "Raises and escalates (as appropriate) significant organizational ethics and compliance issues. Makes decisions that are objective and reflect the just treatment of others.",
  },
  {
    title: "Lifelong learning",
    desc: "Uses newly learned knowledge and skills to complete specific tasks. Treats unexpected situations and tasks as an opportunity an opportunity to learn and grow. Takes charge of personal growth and development.",
  },
  {
    title: "Results driven",
    desc: "Monitors progress of activities against desired outcomes. Identifies needed adjustments in own area of responsibility. Takes responsibility of own decisions and actions. Develops ways to overcome obstacles.",
  },
  {
    title: "Teamwork and Collaboration",
    desc: "Actively participates as a member of a team to move the team towards completion of the goals.  Maintains strong, personal connections with team members and stakeholders.  Aligns personal work and performance with the broader team to achieve mutual outcomes.",
  },
  {
    title: "Design Thinking",
    desc: "It is a creative problem-solving mindset and methodology which transforms complex problems into opportunities for development.The adoption of design thinking aims to promote greater collaboration amongst teams and supports organizations’ innovation agenda."
  }
];

const coreCompetencyTravel = [
  {
    title: "Communication",
    desc: "Convey and exchange thoughts, ideas and information effectively through various mediums and approaches.",
  },
  {
    title: "Computational Thinking",
    desc: "Develop and use computational models, tools and techniques to interpret and understand data, solve problems and guide decision-making..",
  },
  {
    title: "Creative Thinking",
    desc: "Adopt a fresh perspective to combine ideas or information in new ways and make connections between seemingly unrelated fields to create new ideas and applications.",
  },
  {title:"Decision Making",desc:"Choose a course of action from various alternatives using a reasoned process to Developing People achieve intended goals."},
  {title:"Developing People",desc:"Help others to learn and develop their capabilities to enhance their performance and achieve personal or professional goals."},
  {title:"Digital Literacy",desc:"Use ICT tools, equipment and software to create, evaluate and share information digitally with others."},
  {title:"Global Mindset",desc:"Awareness of diversity across global cultures and markets. Seek opportunities to adopt successful practices and ideas."},
  {title:"Interpersonal Skills",desc:"Manage relationships efficiently and communicate with others effectively to achieve mutual consensus and outcomes."},
  {title:"Leadership",desc:"Lead others to achieve objectives in the most effective way. Provide an inclusive workplace that cultivates workplace relationships and teamwork, and foster the development of others."},
  {title:"Lifelong Learning",desc:"Seek out opportunities to enhance one's knowledge and skills. Access and acquire new knowledge and skills actively for continual learning."},
  {title:"Managing Diversity",desc:"Work well with people from different ethnic, social, cultural and educational backgrounds and understand the concerns and interests of diverse work groups."},
  {title:"Problem Solving",desc:"Generate feasible and efficient solutions to solve problems and capitalise on new opportunities.Generate feasible and efficient solutions to solve problems and capitalise on new opportunities."},
  {title:"Resource Management",desc:"Efficient and effective deployment and allocation of resources when and where they are needed. Include planning, allocating and scheduling of resources to tasks, which typically include manpower, machines, money and materials.Efficient and effective deployment and allocation of resources when and where they are needed. Include planning, allocating and scheduling of resources to tasks, which typically include manpower, machines, money and materials."},
  {title:"Sense Making",desc:"Organise and analyse data and information accurately to identify relationships and detect patterns and trends to gain insights for decision-making"},
  {title:"Service Orientation",desc:"Commit to exceeding both internal and external customers' needs. Proactively identify customer needs and sustain a culture of service excellence within the organisation.Commit to exceeding both internal and external customers' needs. Proactively identify customer needs and sustain a culture of service excellence within the organisation."},
  {title:"Teamwork",desc:"Work collaboratively and effectively with others to contribute to group efforts to achieve identified objectives."},
  {title:"Transdisciplinary Thinking",desc:"Understanding of concepts across multiple disciplines, with the capacity to synthesise the knowledge and insights to guide decisions and foster cooperation."},
  {title:"Virtual Collaboration",desc:"Use online collaborative communication tools to work as teams to accomplish tasks or projects."},
];

populateDropdown(jobFunctionalityList, jobFunctionalityElement);

const jobTitleData = [
  {
    text: "Select Job Title",
    jobFunc: 0,
    value: 0,
  },
  {
    value: 1,
    jobFunc: 5,
    text: "Account Development Manager",
    functionalAssessment: "",
  },
  {
    value: 2,
    jobFunc: 5,
    text: "Branch Manager",
    functionalAssessment: "",
  },
  {
    value: 3,
    jobFunc: 5,
    text: "Central Aisle Cashier",
    functionalAssessment: "",
  },
  {
    value: 4,
    jobFunc: 5,
    text: "Customer Assistant",
    functionalAssessment: "",
  },
  {
    value: 5,
    jobFunc: 5,
    text: "Director of Sales",
    functionalAssessment: "",
  },
  {
    value: 6,
    jobFunc: 5,
    text: "Event Specialist",
    functionalAssessment: "",
  },
  {
    value: 7,
    jobFunc: 5,
    text: "Inside Sales Manager",
    functionalAssessment: "",
  },
  {
    value: 8,
    jobFunc: 5,
    text: "Outside Sales Consultant",
    functionalAssessment: "",
  },
  {
    value: 9,
    jobFunc: 5,
    text: "Area Sales Manager",
    functionalAssessment: "",
  },
  {
    value: 10,
    jobFunc: 5,
    text: "Cashier",
    functionalAssessment: "",
  },
  {
    value: 11,
    jobFunc: 5,
    text: "Channel Sales Director",
    functionalAssessment: "",
  },
  {
    value: 12,
    jobFunc: 5,
    text: "Customer Engagement Manager",
    functionalAssessment: "",
  },
  {
    value: 13,
    jobFunc: 5,
    text: "Distribution Sales Manager",
    functionalAssessment: "",
  },
  {
    value: 14,
    jobFunc: 5,
    text: "Field Merchandiser",
    functionalAssessment: "",
  },
  {
    value: 15,
    jobFunc: 5,
    text: "Inside Sales Representative",
    functionalAssessment: "",
  },
  {
    value: 16,
    jobFunc: 5,
    text: "Outside Sales Manager",
    functionalAssessment: "",
  },
  {
    value: 17,
    jobFunc: 5,
    text: "Checker",
    functionalAssessment: "",
  },
  {
    value: 18,
    jobFunc: 5,
    text: "Customer Service Representative (CSR)",
    functionalAssessment: "",
  },
  {
    value: 19,
    jobFunc: 5,
    text: "District Sales Manager",
    functionalAssessment: "",
  },
  {
    value: 20,
    jobFunc: 5,
    text: "General Manager",
    functionalAssessment: "",
  },
  {
    value: 21,
    jobFunc: 5,
    text: "Marketing Representative",
    functionalAssessment: "",
  },
  {
    value: 22,
    jobFunc: 5,
    text: "Demonstrator",
    functionalAssessment: "",
  },
  {
    value: 23,
    jobFunc: 5,
    text: "Merchandiser",
    functionalAssessment: "",
  },
  {
    value: 24,
    jobFunc: 5,
    text: "Outside Sales Representative",
    functionalAssessment: "",
  },
  {
    value: 25,
    jobFunc: 5,
    text: "Product Sales Engineer",
    functionalAssessment: "",
  },
  {
    value: 26,
    jobFunc: 5,
    text: "Sales and Marketing Vice President",
    functionalAssessment: "",
  },
  {
    value: 27,
    jobFunc: 5,
    text: "Sales Consultant",
    functionalAssessment: "",
  },
  {
    value: 28,
    jobFunc: 5,
    text: "Sales Engineer, Account Manager",
    functionalAssessment: "",
  },
  {
    value: 29,
    jobFunc: 5,
    text: "Sales Representative",
    functionalAssessment: "",
  },
  {
    value: 30,
    jobFunc: 5,
    text: "Senior Sales Engineer",
    functionalAssessment: "",
  },
  {
    value: 31,
    jobFunc: 5,
    text: "Technical Sales Engineer",
    functionalAssessment: "",
  },
  {
    value: 32,
    jobFunc: 5,
    text: "Telemarketing Sales Representative",
    functionalAssessment: "",
  },
  {
    value: 33,
    jobFunc: 5,
    text: "Telesales Specialist",
    functionalAssessment: "",
  },
  {
    value: 34,
    jobFunc: 5,
    text: "Product Ambassador",
    functionalAssessment: "",
  },
  {
    value: 35,
    jobFunc: 5,
    text: "Regional Sales Manager",
    functionalAssessment: "",
  },
  {
    value: 36,
    jobFunc: 5,
    text: "Sales Associate",
    functionalAssessment: "",
  },
  {
    value: 37,
    jobFunc: 5,
    text: "Sales Engineer",
    functionalAssessment: "",
  },
  {
    value: 38,
    jobFunc: 5,
    text: "Sales Engineer, Engineered Products",
    functionalAssessment: "",
  },
  {
    value: 39,
    jobFunc: 5,
    text: "Sales Supervisor",
    functionalAssessment: "",
  },
  {
    value: 40,
    jobFunc: 5,
    text: "Store Manager",
    functionalAssessment: "",
  },
  {
    value: 41,
    jobFunc: 5,
    text: "Telemarketer",
    functionalAssessment: "",
  },
  {
    value: 42,
    jobFunc: 5,
    text: "Telephone Sales Representative (TSR)",
    functionalAssessment: "",
  },
  {
    value: 43,
    jobFunc: 5,
    text: "Vice President of Sales",
    functionalAssessment: "",
  },
  {
    value: 44,
    jobFunc: 5,
    text: "Sales Manager",
    functionalAssessment: "",
  },
  {
    value: 45,
    jobFunc: 5,
    text: "Telesales Representative",
    functionalAssessment: "",
  },
  {
    value: 46,
    jobFunc: 6,
    text: "Account Director",
    functionalAssessment: "",
  },
  {
    value: 47,
    jobFunc: 6,
    text: "Account Executive",
    functionalAssessment: "",
  },
  {
    value: 48,
    jobFunc: 6,
    text: "Advertising Associate",
    functionalAssessment: "",
  },
  {
    value: 49,
    jobFunc: 6,
    text: "Advertising Manager",
    functionalAssessment: "",
  },
  {
    value: 50,
    jobFunc: 6,
    text: "Business Development Director",
    functionalAssessment: "",
  },
  {
    value: 51,
    jobFunc: 6,
    text: "Client Service and Consulting Manager",
    functionalAssessment: "",
  },
  {
    value: 52,
    jobFunc: 6,
    text: "Communications Specialist",
    functionalAssessment: "",
  },
  {
    value: 53,
    jobFunc: 6,
    text: "Corporate Communications Specialist",
    functionalAssessment: "",
  },
  {
    value: 54,
    jobFunc: 6,
    text: "Desktop Publisher",
    functionalAssessment: "",
  },
  {
    value: 55,
    jobFunc: 6,
    text: "Account Manager",
    functionalAssessment: "",
  },
  {
    value: 56,
    jobFunc: 6,
    text: "Advertising Coordinator",
    functionalAssessment: "",
  },
  {
    value: 57,
    jobFunc: 6,
    text: "Brand Manager",
    functionalAssessment: "",
  },
  {
    value: 58,
    jobFunc: 6,
    text: "Business Development Manager",
    functionalAssessment: "",
  },
  {
    value: 59,
    jobFunc: 6,
    text: "Client Services Vice President",
    functionalAssessment: "",
  },
  {
    value: 60,
    jobFunc: 6,
    text: "Community Relations Director",
    functionalAssessment: "",
  },
  {
    value: 61,
    jobFunc: 6,
    text: "Creative Director",
    functionalAssessment: "",
  },
  {
    value: 62,
    jobFunc: 6,
    text: "Digital Marketing Consultant",
    functionalAssessment: "",
  },
  {
    value: 63,
    jobFunc: 6,
    text: "Business Development Specialist",
    functionalAssessment: "",
  },
  {
    value: 64,
    jobFunc: 6,
    text: "Advertising Copy Writer",
    functionalAssessment: "",
  },
  {
    value: 65,
    jobFunc: 6,
    text: "Director of Audience Generation, Search,& Analytics",
    functionalAssessment: "",
  },
  {
    value: 66,
    jobFunc: 6,
    text: "Director of Digital Marketing",
    functionalAssessment: "",
  },
  {
    value: 67,
    jobFunc: 6,
    text: "Director of Client Services",
    functionalAssessment: "",
  },
  {
    value: 68,
    jobFunc: 6,
    text: "Director of Search Engine Optimization (Director of SEO)",
    functionalAssessment: "",
  },
  {
    value: 69,
    jobFunc: 6,
    text: "Graphic Artist",
    functionalAssessment: "",
  },
  {
    value: 70,
    jobFunc: 6,
    text: "Director, Search Marketing Strategies",
    functionalAssessment: "",
  },
  {
    value: 71,
    jobFunc: 6,
    text: "Digital Marketing Manager",
    functionalAssessment: "",
  },
  {
    value: 72,
    jobFunc: 6,
    text: "Director of Public Relations",
    functionalAssessment: "",
  },
  {
    value: 73,
    jobFunc: 6,
    text: "Advertising Director",
    functionalAssessment: "",
  },
  {
    value: 74,
    jobFunc: 6,
    text: "Digital Marketing Specialist",
    functionalAssessment: "",
  },
  {
    value: 75,
    jobFunc: 9,
    text: "Assessment Services Manager",
    functionalAssessment: "",
  },
  {
    value: 76,
    jobFunc: 9,
    text: "Benefits Coordinator",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 77,
    jobFunc: 9,
    text: "Chief Diversity Officer (CDO)",
    functionalAssessment: "",
  },
  {
    value: 78,
    jobFunc: 9,
    text: "Compensation & Benefits Office Manager",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 79,
    jobFunc: 9,
    text: "Compensation Analyst",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 80,
    jobFunc: 9,
    text: "Compensation Manager",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 81,
    jobFunc: 9,
    text: "Corporate Recruiter",
    functionalAssessment: [
      { title: "Communication Ability", desc: "" },
      { title: "Building Relationship", desc: "" },
      { title: "Empathy", desc: "" },
      { title: "Influence & Persuasive ability", desc: "" },
      { title: "Flexibility", desc: "" },
      { title: "Result Orientation", desc: "" },
      { title: "Planning & Organizing", desc: "" },
      { title: "Domain Expertise", desc: "" },
      { title: "Ability to use hiring tools", desc: "" },
      { title: "Knowledge of HR Sub systems", desc: "" },
      { title: "Strategic Orientation", desc: "" },
      { title: "Knowledge of Business", desc: "" },
      { title: "Market intelligence", desc: "" },
      { title: "Talent Mindset", desc: "" },
      { title: "Personal Credibility", desc: "" },
    ],
  },
  {
    value: 82,
    jobFunc: 9,
    text: "Development Manager",
    functionalAssessment: "",
  },
  {
    value: 83,
    jobFunc: 9,
    text: "Employee Relations Manager",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 84,
    jobFunc: 9,
    text: "Field Operations Coordinator",
    functionalAssessment: "",
  },
  {
    value: 85,
    jobFunc: 9,
    text: "HR Administrative Assistant",
    functionalAssessment: "",
  },
  {
    value: 86,
    jobFunc: 9,
    text: "Industrial Psychologist",
    functionalAssessment: "",
  },
  {
    value: 87,
    jobFunc: 9,
    text: "Job Analyst",
    functionalAssessment: "",
  },
  {
    value: 88,
    jobFunc: 9,
    text: "Benefits Analyst",
    functionalAssessment: "",
  },
  {
    value: 89,
    jobFunc: 9,
    text: "Benefits Manager",
    functionalAssessment: "",
  },
  {
    value: 90,
    jobFunc: 9,
    text: "Compensation & Benefits Assistant",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 91,
    jobFunc: 9,
    text: "Compensation Director",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 92,
    jobFunc: 9,
    text: "Compensation and Benefits Manager",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 93,
    jobFunc: 9,
    text: "Computer Training Specialist",
    functionalAssessment: "",
  },
  {
    value: 94,
    jobFunc: 9,
    text: "Corporate Trainer",
    functionalAssessment: "",
  },
  {
    value: 95,
    jobFunc: 9,
    text: "Director of Human Resources",
    functionalAssessment: "",
  },
  {
    value: 96,
    jobFunc: 9,
    text: "Employment Coordinator",
    functionalAssessment: "",
  },
  {
    value: 97,
    jobFunc: 9,
    text: "Grievance Manager",
    functionalAssessment: "",
  },
  {
    value: 98,
    jobFunc: 9,
    text: "Human Resources Business Partner",
    functionalAssessment: "",
  },
  {
    value: 99,
    jobFunc: 9,
    text: "Intermediate Benefits Analyst",
    functionalAssessment: [
      {
        title: "Program Planning and Development",
        desc: "Develops, implements, evaluates, and owns various HR programs.",
      },
      {
        title: "Needs Analysis",
        desc: "Conducts internal and external organizational analyses to determine root causes of issues and provide solutions. Considers organizational direction when identifying relevant industry trends.",
      },
      {
        title: "Conflict Management",
        desc: "Investigates and resolves conflicts by applying conflict resolution methodologies. Preserves relationships throughout the resolution process.",
      },
      {
        title: "Managing Through Change and Uncertainty",
        desc: "Adjusts thinking and behavior to resiliently face change and uses experience to fuel growth. Embraces failure as a learning opportunity for themselves and others. Enables the process of change and transition while helping others deal with the effects of change.",
      },
      {
        title: "Customer Focus",
        desc: "Prioritizes and takes action on the needs of both internal and external customers. Designs and delivers products and services with the customer experience top of mind.",
      },
      {
        title: "Dynamic Learning Mindset",
        desc: "Continuously seeks opportunities to learn, questions the applicability of past approaches in the current environment, owns growth, and embraces failure as a learning opportunity.",
      },
      {
        title: "Technology Enablement",
        desc: "Leverages existing and seeks out new technologies to navigate, create, and share information to deliver more effective, efficient solutions.",
      },
      {
        title: "Influence",
        desc: "Impacts others' thinking, decisions, or behavior through inclusive practices and relationship building. Drives action through influence, often without authority.",
      },
      {
        title: "Relationship Building",
        desc: "Develops internal and external professional, trusting relationships. Purposefully develops networks to build value through collaboration.",
      },
      {
        title: "Business and Financial Acumen",
        desc: "Makes decisions based on a solid understanding of the business and the wider industry. Maximizes results by understanding and aligning actions with the organization's goals, core functions, needs, and values. Applies financial knowledge to address organizational needs.",
      },
      {
        title: "Data Literacy",
        desc: "Identifies, collects, and interprets quality data that informs human capital decision making. Communicates and acts on information and insight from relevant data (including metrics, visualizations, and analytics).",
      },
      {
        title: "Organizational Awareness",
        desc: "Contributes to the organization by understanding and aligning actions with the organization's goals, core functions, needs, and values.",
      },
      {
        title: "Communication",
        desc: "Effectively and appropriately interacts with others to build relationships, influence others, and facilitate the sharing of ideas and information. Uses tact and diplomacy to navigate difficult situations. Relays key messages by creating a compelling story, targeted to specific audiences.",
      },
      {
        title: "Inclusion",
        desc: "Contributes to an environment in which all employees feel a sense of belonging, valued for their differences, and empowered to participate and contribute freely. ",
      },
      {
        title: "Problem Solving and Decision Making",
        desc: "Uses critical thinking to evaluate problems, gather information, understand causes, and identify best-possible solutions. Invests time in planning, discovery, and reflection to drive better decisions and more efficient implementations.",
      },
      {
        title: "Project Management",
        desc: "Manages the delivery of projects within the appropriate scope, time, and budget. Includes management of resources and risk.",
      },
      {
        title: "Technical HR Expertise",
        desc: "Demonstrates in-depth knowledge in specific HR areas. For example, training, recruitment, strategic workforce planning, diversity and inclusion, compensation, health and wellness, and policy and governance. Is able to communicate and apply relevant HR expertise to create and maintain effective human management practices.",
      },
    ],
  },
  {
    value: 100,
    jobFunc: 9,
    text: "Job Training Specialist",
    functionalAssessment: "",
  },
  {
    value: 101,
    jobFunc: 9,
    text: "E-Learning Developer",
    functionalAssessment: "",
  },
  {
    value: 102,
    jobFunc: 9,
    text: "Consulting Psychologist",
    functionalAssessment: "",
  },
  {
    value: 103,
    jobFunc: 9,
    text: "Human Resources Manager",
    functionalAssessment: "",
  },
  {
    value: 104,
    jobFunc: 9,
    text: "Intermediate Compensation Analyst",
    functionalAssessment: "",
  },
  {
    value: 105,
    jobFunc: 9,
    text: "Talent Development",
    functionalAssessment: [
      { title: "Lifelong Learning", desc: "" },
      { title: "Training Delivery and Facilitation", desc: "" },
      { title: "Emotional intelligence and Decision Making", desc: "" },
      { title: "Compliance and Ethical Behavior", desc: "" },
      { title: "Cultural Awareness and Inclusion", desc: "" },
      { title: "Project Management", desc: "" },
      { title: "Collaboration and Leadership", desc: "" },
      { title: "Consulting and Business Partnering", desc: "" },
      { title: "Organization Development and Culture", desc: "" },
      { title: "Business Insight", desc: "" },
      { title: "Talent Strategy and Management", desc: "" },
      { title: "Future Readiness", desc: "" },
      { title: "Career and Leadership Development", desc: "" },
      { title: "Coaching", desc: "" },
      { title: "Performance Improvement", desc: "" },
      { title: "Evaluating Impact", desc: "" },
    ],
  },
  {
    value: 106,
    jobFunc: 8,
    text: "Administrative Aide",
    functionalAssessment: "",
  },
  {
    value: 107,
    jobFunc: 8,
    text: "Business Administrator",
    functionalAssessment: "",
  },
  {
    value: 108,
    jobFunc: 8,
    text: "Buyer",
    functionalAssessment: "",
  },
  {
    value: 109,
    jobFunc: 8,
    text: "Department Secretary",
    functionalAssessment: "",
  },
  {
    value: 110,
    jobFunc: 8,
    text: "Executive Administrative Assistant",
    functionalAssessment: "",
  },
  {
    value: 111,
    jobFunc: 8,
    text: "Executive Secretary",
    functionalAssessment: "",
  },
  {
    value: 112,
    jobFunc: 8,
    text: "General Manager (GM)",
    functionalAssessment: "",
  },
  {
    value: 113,
    jobFunc: 8,
    text: "Administrative Assistant",
    functionalAssessment: "",
  },
  {
    value: 114,
    jobFunc: 8,
    text: "Business Manager",
    functionalAssessment: "",
  },
  {
    value: 115,
    jobFunc: 8,
    text: "Chief Operating Officer (COO)",
    functionalAssessment: "",
  },
  {
    value: 116,
    jobFunc: 8,
    text: "Director of Operations",
    functionalAssessment: "",
  },
  {
    value: 117,
    jobFunc: 8,
    text: "Executive Assistant",
    functionalAssessment: "",
  },
  {
    value: 118,
    jobFunc: 8,
    text: "Facilities Manager",
    functionalAssessment: "",
  },
  {
    value: 119,
    jobFunc: 8,
    text: "Office Assistant",
    functionalAssessment: "",
  },
  {
    value: 120,
    jobFunc: 8,
    text: "Administrative Associate",
    functionalAssessment: "",
  },
  {
    value: 121,
    jobFunc: 8,
    text: "Clerk Typist",
    functionalAssessment: "",
  },
  {
    value: 122,
    jobFunc: 7,
    text: "Account Clerk",
    functionalAssessment: "",
  },
  {
    value: 123,
    jobFunc: 7,
    text: "Accounting Assistant",
    functionalAssessment: "",
  },
  {
    value: 124,
    jobFunc: 7,
    text: "Accounting Manager",
    functionalAssessment: "",
  },
  {
    value: 125,
    jobFunc: 7,
    text: "Accounting Supervisor",
    functionalAssessment: "",
  },
  {
    value: 126,
    jobFunc: 7,
    text: "Accounts Payable Specialist",
    functionalAssessment: "",
  },
  {
    value: 127,
    jobFunc: 7,
    text: "Accounts Receivable Clerk",
    functionalAssessment: "",
  },
  {
    value: 128,
    jobFunc: 7,
    text: "Assurance Senior",
    functionalAssessment: "",
  },
  {
    value: 129,
    jobFunc: 7,
    text: "Audit Partner",
    functionalAssessment: "",
  },
  {
    value: 130,
    jobFunc: 7,
    text: "Auditor-in-Charge",
    functionalAssessment: "",
  },
  {
    value: 131,
    jobFunc: 7,
    text: "Billing Clerk",
    functionalAssessment: "",
  },
  {
    value: 132,
    jobFunc: 7,
    text: "Budget Analyst",
    functionalAssessment: "",
  },
  {
    value: 133,
    jobFunc: 7,
    text: "Budget Officer",
    functionalAssessment: "",
  },
  {
    value: 134,
    jobFunc: 7,
    text: "Accounting Associate",
    functionalAssessment: "",
  },
  {
    value: 135,
    jobFunc: 7,
    text: "Accounting Officer",
    functionalAssessment: "",
  },
  {
    value: 136,
    jobFunc: 7,
    text: "Accounting Technician",
    functionalAssessment: "",
  },
  {
    value: 137,
    jobFunc: 7,
    text: "Accounts Payable Supervisor",
    functionalAssessment: "",
  },
  {
    value: 138,
    jobFunc: 7,
    text: "Accounts Receivable Manager",
    functionalAssessment: "",
  },
  {
    value: 139,
    jobFunc: 7,
    text: "Audit Manager",
    functionalAssessment: "",
  },
  {
    value: 140,
    jobFunc: 7,
    text: "Auditor",
    functionalAssessment: "",
  },
  {
    value: 141,
    jobFunc: 7,
    text: "Biller",
    functionalAssessment: "",
  },
  {
    value: 142,
    jobFunc: 7,
    text: "Billing Coordinator",
    functionalAssessment: "",
  },
  {
    value: 143,
    jobFunc: 7,
    text: "Budget and Policy Analyst",
    functionalAssessment: "",
  },
  {
    value: 144,
    jobFunc: 7,
    text: "Account Receivable Clerk",
    functionalAssessment: "",
  },
  {
    value: 145,
    jobFunc: 7,
    text: "Accountant",
    functionalAssessment: "",
  },
  {
    value: 146,
    jobFunc: 7,
    text: "Accounting Clerk",
    functionalAssessment: "",
  },
  {
    value: 147,
    jobFunc: 7,
    text: "Accounts Payables Clerk",
    functionalAssessment: "",
  },
  {
    value: 148,
    jobFunc: 7,
    text: "Accounts Receivable Specialist",
    functionalAssessment: "",
  },
  {
    value: 149,
    jobFunc: 7,
    text: "Billing Specialist",
    functionalAssessment: "",
  },
  {
    value: 150,
    jobFunc: 7,
    text: "Budget Coordinator",
    functionalAssessment: "",
  },
  {
    value: 151,
    jobFunc: 7,
    text: "Chief Financial Officer (CFO)",
    functionalAssessment: "",
  },
  {
    value: 152,
    jobFunc: 7,
    text: "Collector",
    functionalAssessment: "",
  },
  {
    value: 153,
    jobFunc: 7,
    text: "Cost Accountant",
    functionalAssessment: "",
  },
  {
    value: 154,
    jobFunc: 7,
    text: "Debt Collector",
    functionalAssessment: "",
  },
  {
    value: 155,
    jobFunc: 7,
    text: "Finance Vice President",
    functionalAssessment: "",
  },
  {
    value: 156,
    jobFunc: 7,
    text: "Financial Business Analyst",
    functionalAssessment: "",
  },
  {
    value: 157,
    jobFunc: 7,
    text: "Internal Audit Director",
    functionalAssessment: "",
  },
  {
    value: 158,
    jobFunc: 7,
    text: "Payroll Administrator",
    functionalAssessment: "",
  },
  {
    value: 159,
    jobFunc: 7,
    text: "Payroll Clerk",
    functionalAssessment: "",
  },
  {
    value: 160,
    jobFunc: 7,
    text: "Payroll Technician",
    functionalAssessment: "",
  },
  {
    value: 161,
    jobFunc: 7,
    text: "Staff Analyst",
    functionalAssessment: "",
  },
  {
    value: 162,
    jobFunc: 7,
    text: "Collections Manager",
    functionalAssessment: "",
  },
  {
    value: 163,
    jobFunc: 7,
    text: "Comptroller",
    functionalAssessment: "",
  },
  {
    value: 164,
    jobFunc: 7,
    text: "Credit Clerk",
    functionalAssessment: "",
  },
  {
    value: 165,
    jobFunc: 7,
    text: "Deputy for Audit",
    functionalAssessment: "",
  },
  {
    value: 166,
    jobFunc: 7,
    text: "Financial Auditor",
    functionalAssessment: "",
  },
  {
    value: 167,
    jobFunc: 7,
    text: "Financial Reporting Accountant",
    functionalAssessment: "",
  },
  {
    value: 168,
    jobFunc: 7,
    text: "Internal Auditor",
    functionalAssessment: "",
  },
  {
    value: 169,
    jobFunc: 7,
    text: "Payroll and Benefits Specialist",
    functionalAssessment: "",
  },
  {
    value: 170,
    jobFunc: 7,
    text: "Payroll Coordinator",
    functionalAssessment: "",
  },
  {
    value: 171,
    jobFunc: 7,
    text: "Personnel Assistant",
    functionalAssessment: "",
  },
  {
    value: 172,
    jobFunc: 7,
    text: "Telephone Collector",
    functionalAssessment: "",
  },
  {
    value: 173,
    jobFunc: 7,
    text: "Controller",
    functionalAssessment: "",
  },
  {
    value: 174,
    jobFunc: 7,
    text: "Finance Director",
    functionalAssessment: "",
  },
  {
    value: 175,
    jobFunc: 7,
    text: "General Accountant",
    functionalAssessment: "",
  },
  {
    value: 176,
    jobFunc: 7,
    text: "Payroll Assistant",
    functionalAssessment: "",
  },
  {
    value: 177,
    jobFunc: 7,
    text: "Payroll Representative",
    functionalAssessment: "",
  },
  {
    value: 178,
    jobFunc: 7,
    text: "Staff Accountant",
    functionalAssessment: "",
  },
  {
    value: 179,
    jobFunc: 7,
    text: "Treasurer",
    functionalAssessment: "",
  },
  {
    value: 180,
    jobFunc: 7,
    text: "Finance Manager",
    functionalAssessment: "",
  },
  {
    value: 181,
    jobFunc: 7,
    text: "Payroll Specialist",
    functionalAssessment: "",
  },
  {
    value: 182,
    jobFunc: 1,
    text: "Bank audit and compliance",
    functionalAssessment: "",
  },
  {
    value: 183,
    jobFunc: 1,
    text: "Branch banking",
    functionalAssessment: "",
  },
  {
    value: 184,
    jobFunc: 1,
    text: "Card services",
    functionalAssessment: "",
  },
  {
    value: 185,
    jobFunc: 1,
    text: "Commercial lending operations",
    functionalAssessment: "",
  },
  {
    value: 186,
    jobFunc: 1,
    text: "Intevestment banking",
    functionalAssessment: "",
  },
  {
    value: 187,
    jobFunc: 1,
    text: "Bank investment risk management",
    functionalAssessment: "",
  },
  {
    value: 188,
    jobFunc: 1,
    text: "Bank retail lending",
    functionalAssessment: "",
  },
  {
    value: 189,
    jobFunc: 1,
    text: "Bank retail operations",
    functionalAssessment: "",
  },
  {
    value: 190,
    jobFunc: 1,
    text: "Treasury services",
    functionalAssessment: "",
  },
  {
    value: 191,
    jobFunc: 1,
    text: "Wealth management and personal trust",
    functionalAssessment: "",
  },
  {
    value: 192,
    jobFunc: 1,
    text: "Investment Management services",
    functionalAssessment: "",
  },
  {
    value: 193,
    jobFunc: 1,
    text: "Capital market services",
    functionalAssessment: "",
  },
  {
    value: 194,
    jobFunc: 1,
    text: "Small business banking",
    functionalAssessment: "",
  },
  {
    value: 195,
    jobFunc: 1,
    text: "Digital banking",
    functionalAssessment: "",
  },
  {
    value: 196,
    jobFunc: 4,
    text: "Front-End Engineer",
    functionalAssessment: [
      { title: "Proficiency in HTML, CSS, and JavaScript", desc: "" },
      {
        title: "Experience with front-end frameworks and libraries",
        desc: "Like React, Angular, Vue.js, and jQuery",
      },
      { title: "Understanding of responsive design", desc: "" },
      { title: "Knowledge of browser compatibility issues", desc: "" },
      { title: "Familiarity with version control systems", desc: "" },
      { title: "Ability to work with APIs", desc: "" },
      { title: "Good communication and collaboration skills", desc: "" },
    ],
  },
  {
    value: 197,
    jobFunc: 4,
    text: "Back-End Engineer",
    functionalAssessment: [
      {
        title: "Proficiency in one or more programming languages",
        desc: "Like Java, Python, PHP, Ruby, or Node.js",
      },
      {
        title: "Understanding of web development frameworks",
        desc: "Like Spring, Django, Laravel, or Ruby on Rails",
      },
      {
        title:
          "Experience with databases such as MySQL, PostgreSQL, MongoDB, or Cassandra.",
        desc: "",
      },
      { title: "Knowledge of server and network architecture", desc: "" },
      { title: "Familiarity with RESTful APIs", desc: "" },
      { title: "Good debugging and problem-solving skills", desc: "" },
      { title: "Good communication and collaboration skills", desc: "" },
    ],
  },
  {
    value: 198,
    jobFunc: 4,
    text: "Full Stack Engineer",
    functionalAssessment: [
      {
        title: "Proficiency in one or more programming languages",
        desc: "Like Java, Python, PHP, Ruby, or Node.js",
      },
      {
        title: "Experience with front-end frameworks and libraries",
        desc: "Like React, Angular, Vue.js, and jQuery",
      },
      {
        title: "Understanding of web development frameworks",
        desc: "Like Spring, Django, Laravel, or Ruby on Rails",
      },
      {
        title:
          "Experience with databases such as MySQL, PostgreSQL, MongoDB, or Cassandra.",
        desc: "",
      },
      { title: "Knowledge of server and network architecture", desc: "" },
      { title: "Ability to work with APIs", desc: "" },
      { title: "Good debugging and problem-solving skills", desc: "" },
      { title: "Good communication and collaboration skills", desc: "" },
    ],
  },
  {
    value: 199,
    jobFunc: 4,
    text: "Software Engineer in Test (QA Engineer)",
    functionalAssessment: [
      {
        title: "Proficiency in one or more programming languages",
        desc: "Like Java, Python, PHP, Ruby, or Node.js to develop test automation scripts",
      },
      {
        title:
          "Understanding of different types of testing such as Unit Testing, Functional Testing, Cross Browser Testing, UI Testing, etc.",
        desc: "",
      },
      {
        title:
          "Knowledge of testing frameworks such as JUnit, TestNG, or PyTest to design and execute test cases",
        desc: "",
      },
      {
        title:
          "Experience with one or more automation Testing Tools and Libraries",
        desc: "Such as Selenium, Appium, Cypress, Playwright, Puppeteer, WebdriverIO, NightwatchJS, Espresso, XCUITest, Cucumber, etc.",
      },
      {
        title:
          "Knowledge of Tools like BrowserStack Live, App Live, Automate, App Automate, Percy, App Percy, etc.",
        desc: "",
      },
      {
        title:
          "Understanding of software development processes such as Agile and Scrum.",
        desc: "",
      },
      { title: "Familiarity of Databases to create Database Tests", desc: "" },
      {
        title: "Knowledge of continuous integration and delivery tools",
        desc: "Like Jenkins, Bamboo, Travis CI, CircleCI, etc.",
      },
      { title: "Strong analytical and problem-solving skills", desc: "" },
      {
        title: "Good documentation, communication and collaboration skills",
        desc: "",
      },
    ],
  },
  {
    value: 201,
    jobFunc: 4,
    text: "DevOps Engineer",
    functionalAssessment: [
      {
        title:
          "Proficiency in scripting languages such as Bash, Python, or Ruby",
        desc: "",
      },
      {
        title:
          "Experience with automation tools such as Chef, Puppet, Ansible, or Terraform",
        desc: "",
      },
      {
        title:
          "Familiarity with cloud platforms such as Amazon Web Services (AWS), Microsoft Azure, or Google Cloud Platform (GCP).",
        desc: "",
      },
      {
        title:
          "Understanding of containerization technologies such as Docker or Kubernetes",
        desc: "",
      },
      {
        title:
          "Knowledge of continuous integration and delivery tools like Jenkins, Bamboo, Travis CI, CircleCI, etc.",
        desc: "",
      },
      {
        title:
          "Familiarity with monitoring and logging tools such as Nagios, Prometheus, or ELK",
        desc: "",
      },
      { title: "Strong problem-solving skills", desc: "" },
      { title: "Good communication and collaboration skills", desc: "" },
    ],
  },
  {
    value: 202,
    jobFunc: 4,
    text: "Security Engineer",
    functionalAssessment: [
      { title: "Strong understanding of information security", desc: "" },
      {
        title: "Familiarity with security tools and technologies",
        desc: "Such as firewalls, intrusion detection and prevention systems (IDS/IPS), security information and event management (SIEM), and vulnerability scanning tools.",
      },
      {
        title:
          "Proficiency in scripting and programming languages such as Python, Perl, or Ruby",
        desc: "",
      },
      {
        title:
          "Experience with security compliance frameworks such as PCI-DSS, HIPAA, or ISO 27001",
        desc: "",
      },
      {
        title:
          "Familiarity with cloud security services such as AWS Security, Azure Security, or Google Cloud Security",
        desc: "",
      },
      {
        title: "Understanding of threat modeling and risk assessment",
        desc: "",
      },
      { title: "Strong analytical and problem-solving skills", desc: "" },
    ],
  },
  {
    value: 203,
    jobFunc: 4,
    text: "Data Engineer",
    functionalAssessment: [
      {
        title: "Proficiency in programming languages",
        desc: "Such as Python, Java, or Scala to develop and maintain data pipelines, ETL processes, and data models.",
      },
      {
        title:
          "Experience with big data technologies such as Hadoop, Spark, or Kafka",
        desc: "",
      },
      {
        title:
          "Familiarity with data warehousing technologies such as Snowflake, Redshift, or BigQuery",
        desc: "",
      },
      { title: "Knowledge of data modeling and database design", desc: "" },
      { title: "Understanding of data governance and security", desc: "" },
      { title: "Proficiency in SQL", desc: "" },
      {
        title:
          "Familiarity with cloud platforms such as AWS, Azure, or Google Cloud Platform",
        desc: "",
      },
      { title: "Strong problem-solving skills", desc: "" },
    ],
  },
  // {
  //   "value": 204,
  //   "jobFunc": 4,
  //   "text": "DevOps Engineer",
  //   "functionalAssessment": ""
  // },
  {
    value: 205,
    jobFunc: 4,
    text: "Cloud Architect",
    functionalAssessment: [
      { title: "Strong understanding of cloud computing", desc: "" },
      {
        title:
          "Proficiency in cloud platforms such as AWS, Azure, or Google Cloud Platform",
        desc: "",
      },
      { title: "Knowledge of cloud security", desc: "" },
      {
        title:
          "Familiarity with cloud-native technologies such as containers, microservices, and serverless computing",
        desc: "",
      },
      { title: "Strong infrastructure and network design skills", desc: "" },
      {
        title:
          "Understanding of compliance and regulatory requirements such as HIPAA, GDPR, or PCI-DSS",
        desc: "",
      },
      { title: "Experience with cloud migration and hybrid cloud", desc: "" },
    ],
  },
  {
    value: 206,
    jobFunc: 3,
    text: "Chief Information Officer (CIO)",
    functionalAssessment: "",
  },
  {
    value: 207,
    jobFunc: 3,
    text: "Information Systems Director (IS Director)",
    functionalAssessment: "",
  },
  {
    value: 208,
    jobFunc: 3,
    text: "Information Technology Director (IT Director)",
    functionalAssessment: "",
  },
  {
    value: 209,
    jobFunc: 3,
    text: "Information Systems Manager (IS Manager)",
    functionalAssessment: "",
  },
  {
    value: 210,
    jobFunc: 3,
    text: "Information Technology Manager (IT Manager)",
    functionalAssessment: "",
  },
  {
    value: 211,
    jobFunc: 3,
    text: "Information Systems Supervisor (IS Supervisor)",
    functionalAssessment: "",
  },
  {
    value: 212,
    jobFunc: 3,
    text: "IT Program Manager",
    functionalAssessment: "",
  },
  {
    value: 213,
    jobFunc: 3,
    text: "IT Project Manager",
    functionalAssessment: "",
  },
  {
    value: 214,
    jobFunc: 3,
    text: "Lead IT Project Manager",
    functionalAssessment: "",
  },
  {
    value: 215,
    jobFunc: 3,
    text: "Data Processing Manager",
    functionalAssessment: "",
  },
  {
    value: 216,
    jobFunc: 3,
    text: "Computer Technician",
    functionalAssessment: "",
  },
  {
    value: 217,
    jobFunc: 3,
    text: "Network Technician",
    functionalAssessment: "",
  },
  {
    value: 218,
    jobFunc: 3,
    text: "Network Support Specialist",
    functionalAssessment: "",
  },
  {
    value: 219,
    jobFunc: 3,
    text: "Local Area Network Administrator (LAN Administrator)",
    functionalAssessment: "",
  },
  {
    value: 220,
    jobFunc: 3,
    text: "Network Analyst",
    functionalAssessment: "",
  },
  {
    value: 221,
    jobFunc: 3,
    text: "Network Engineer",
    functionalAssessment: "",
  },
  {
    value: 222,
    jobFunc: 3,
    text: "Network Manager",
    functionalAssessment: "",
  },
  {
    value: 223,
    jobFunc: 3,
    text: "Systems Engineer",
    functionalAssessment: "",
  },
  {
    value: 224,
    jobFunc: 3,
    text: "Infrastructure Engineer",
    functionalAssessment: "",
  },
  {
    value: 225,
    jobFunc: 3,
    text: "Security Administrator",
    functionalAssessment: "",
  },
  {
    value: 226,
    jobFunc: 3,
    text: "Systems Security Analyst",
    functionalAssessment: "",
  },
  {
    value: 227,
    jobFunc: 3,
    text: "Telecommunications Analyst",
    functionalAssessment: "",
  },
  {
    value: 228,
    jobFunc: 3,
    text: "Telecommunications Engineer",
    functionalAssessment: "",
  },
  {
    value: 229,
    jobFunc: 3,
    text: "Computer Support Specialist",
    functionalAssessment: "",
  },
  {
    value: 230,
    jobFunc: 3,
    text: "Help Desk Analyst",
    functionalAssessment: "",
  },
  {
    value: 231,
    jobFunc: 3,
    text: "Applications Analyst",
    functionalAssessment: "",
  },
  {
    value: 232,
    jobFunc: 3,
    text: "Applications Architect",
    functionalAssessment: "",
  },
  {
    value: 233,
    jobFunc: 3,
    text: "Computer Systems Analyst",
    functionalAssessment: "",
  },
  {
    value: 234,
    jobFunc: 3,
    text: "Database Analyst",
    functionalAssessment: "",
  },
  {
    value: 235,
    jobFunc: 3,
    text: "IT Business Analyst",
    functionalAssessment: "",
  },
  {
    value: 236,
    jobFunc: 3,
    text: "IT Business Systems Analyst",
    functionalAssessment: "",
  },
  {
    value: 237,
    jobFunc: 3,
    text: "Quality Assurance Analyst (QA Analyst)",
    functionalAssessment: "",
  },
  {
    value: 238,
    jobFunc: 10,
    text: "Admissions Representative - Higher Ed",
    functionalAssessment: "",
  },
  {
    value: 239,
    jobFunc: 10,
    text: "Bursar",
    functionalAssessment: "",
  },
  {
    value: 240,
    jobFunc: 10,
    text: "Chief Admissions Officer",
    functionalAssessment: "",
  },
  {
    value: 241,
    jobFunc: 10,
    text: "Chief Enrollment Management Officer",
    functionalAssessment: "",
  },
  {
    value: 242,
    jobFunc: 10,
    text: "Ceremony Co-coordinator",
    functionalAssessment: "",
  },
  {
    value: 243,
    jobFunc: 10,
    text: "Examination Co-coordinator",
    functionalAssessment: "",
  },
  {
    value: 244,
    jobFunc: 10,
    text: "Financial Aid Counselor - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 245,
    jobFunc: 10,
    text: "Registrar",
    functionalAssessment: "",
  },
  {
    value: 246,
    jobFunc: 10,
    text: "Scheduling Officer",
    functionalAssessment: "",
  },
  {
    value: 255,
    jobFunc: 10,
    text: "Early Childhood Education Professional Development Coordinator & Lecturer",
    functionalAssessment: "",
  },
  {
    value: 256,
    jobFunc: 10,
    text: "Education Administrator, Elementary and Secondary School",
    functionalAssessment: "",
  },
  {
    value: 257,
    jobFunc: 10,
    text: "Educational, Vocational, and School Counselor",
    functionalAssessment: "",
  },
  {
    value: 258,
    jobFunc: 10,
    text: "Elementary School Teacher",
    functionalAssessment: "",
  },
  {
    value: 259,
    jobFunc: 10,
    text: "K-12 Teacher",
    functionalAssessment: "",
  },
  {
    value: 260,
    jobFunc: 10,
    text: "Kindergarten Teacher",
    functionalAssessment: "",
  },
  {
    value: 261,
    jobFunc: 10,
    text: "School Nurse",
    functionalAssessment: "",
  },
  {
    value: 262,
    jobFunc: 10,
    text: "School Principal",
    functionalAssessment: "",
  },
  {
    value: 263,
    jobFunc: 10,
    text: "School Psychologist",
    functionalAssessment: "",
  },
  {
    value: 264,
    jobFunc: 10,
    text: "School Superintendent",
    functionalAssessment: "",
  },
  {
    value: 265,
    jobFunc: 10,
    text: "Self-Enrichment Education Teacher",
    functionalAssessment: "",
  },
  {
    value: 266,
    jobFunc: 10,
    text: "Academic Advisor",
    functionalAssessment: "",
  },
  {
    value: 267,
    jobFunc: 10,
    text: "Academic Support Coordinator",
    functionalAssessment: "",
  },
  {
    value: 268,
    jobFunc: 10,
    text: "Associate Dean",
    functionalAssessment: "",
  },
  {
    value: 269,
    jobFunc: 10,
    text: "Associate Professor",
    functionalAssessment: "",
  },
  {
    value: 270,
    jobFunc: 10,
    text: "Chief Academic Officer",
    functionalAssessment: "",
  },
  {
    value: 271,
    jobFunc: 10,
    text: "Dean",
    functionalAssessment: "",
  },
  {
    value: 272,
    jobFunc: 10,
    text: "Post-Secondary Teacher",
    functionalAssessment: "",
  },
  {
    value: 273,
    jobFunc: 10,
    text: "Professor",
    functionalAssessment: "",
  },
  {
    value: 274,
    jobFunc: 10,
    text: "Athletics Director - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 275,
    jobFunc: 10,
    text: "Annual Gift Coordinator - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 276,
    jobFunc: 10,
    text: "Bookstore Director - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 277,
    jobFunc: 10,
    text: "Career Counselor - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 278,
    jobFunc: 10,
    text: "Counseling Psychologist - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 279,
    jobFunc: 10,
    text: "Laboratory Coordinator - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 280,
    jobFunc: 10,
    text: "Librarian - Higher Ed.",
    functionalAssessment: "",
  },
  {
    value: 281,
    jobFunc: 10,
    text: "Student Activities Officer",
    functionalAssessment: "",
  },
  {
    value: 282,
    jobFunc: 2,
    text: "Actuarial",
    functionalAssessment: "",
  },
  {
    value: 283,
    jobFunc: 2,
    text: "Agent Service and Support",
    functionalAssessment: "",
  },
  {
    value: 284,
    jobFunc: 2,
    text: "Annuities",
    functionalAssessment: "",
  },
  {
    value: 285,
    jobFunc: 2,
    text: "Claims Processing",
    functionalAssessment: "",
  },
  {
    value: 286,
    jobFunc: 2,
    text: "Healthcare Insurance Management",
    functionalAssessment: "",
  },
  {
    value: 287,
    jobFunc: 2,
    text: "Insurance Administration",
    functionalAssessment: "",
  },
  {
    value: 288,
    jobFunc: 2,
    text: "Insurance Sales and Marketing",
    functionalAssessment: "",
  },
  {
    value: 289,
    jobFunc: 2,
    text: "Loss Control/Risk Engineering",
    functionalAssessment: "",
  },
  {
    value: 290,
    jobFunc: 2,
    text: "Product Development",
    functionalAssessment: "",
  },
  {
    value: 291,
    jobFunc: 2,
    text: "Provider Management",
    functionalAssessment: "",
  },
  {
    value: 292,
    jobFunc: 2,
    text: "Quality Management & Compliance",
    functionalAssessment: "",
  },
  {
    value: 293,
    jobFunc: 2,
    text: "Underwriting",
    functionalAssessment: "",
  },
  {
    value: 294,
    jobFunc: 11,
    text: "Business development executive",
    functionalAssessment: "",
  },
  {
    value: 295,
    jobFunc: 11,
    text: "Business Development Consultant",
    functionalAssessment: "",
  },
  {
    value: 296,
    jobFunc: 11,
    text: "Business Development Manager",
    functionalAssessment: "",
  },
  {
    value: 297,
    jobFunc: 11,
    text: "Partnerships",
    functionalAssessment: "",
  },
  {
    value: 298,
    jobFunc: 11,
    text: "Business Development Director",
    functionalAssessment: "",
  },
  {
    value: 299,
    jobFunc: 11,
    text: "Vice President of Business Development",
    functionalAssessment: "",
  },
  {
    value: 301,
    jobFunc: 12,
    text: "Facilities & Plant Management",
    functionalAssessment: "",
  },
  {
    value: 302,
    jobFunc: 12,
    text: "Manufacturing Research & Development",
    functionalAssessment: "",
  },
  {
    value: 303,
    jobFunc: 12,
    text: "Manufacturing Operations",
    functionalAssessment: "",
  },
  {
    value: 304,
    jobFunc: 12,
    text: "Quality Management",
    functionalAssessment: "",
  },
  {
    value: 305,
    jobFunc: 12,
    text: "Safety",
    functionalAssessment: "",
  },
  {
    value: 306,
    jobFunc: 12,
    text: "Supply Chain Management & Logistics",
    functionalAssessment: "",
  },
  {
    value: 307,
    jobFunc: 12,
    text: "Sourcing and Procurement",
    functionalAssessment: "",
  },
  {
    value: 308,
    jobFunc: 12,
    text: "3D Printing - Additive Manufacturing",
    functionalAssessment: "",
  },
  {
    value: 309,
    jobFunc: 13,
    text: "Regulatory Systems",
    functionalAssessment: [
      {
        title: "Organizational awareness",
        desc: "Understanding and applying formal rules and structures; identifying decision-makers and individuals who can influence them",
      },
      {
        title:
          "Regulatory decision-making",
        desc: "Preparing for and providing recommendations for regulatory decisions on individual products",
      },
      {
        title:
          "QMS",
        desc: "Applying principles of quality management in routine work",
      },
      {
        title:
          "Regulatory framework, policies and process",
        desc: "Providing regulatory support and guidance to industry and other government departments on regulated issues",
      },
      {
        title:
          "Surveillance and enforcement",
        desc: "Providing regulatory support and guidance to industry and other government departments on regulated issues",
      }
    ],
  },
  {
    value: 310,
    jobFunc: 13,
    text: "Inspector",
    functionalAssessment: [
      {
        title: "Data Management and Informatics",
        desc: "Collecting data from various sources, such as clinical trials, production and quality control; managing, manipulating and querying the data through a locked database",
      },
      {
        title:
          "Evaluation of submitted documentation for compliance with regulations and requirements",
        desc: "Assessing applications for manufacturing licenses and wholesale dealers’ licenses, along with variations to these licenses, for compliance with regulations and requirements",
      },
      {
        title:
          "Management of the inspectorate system",
        desc: "Managing, maintaining and updating an inspectorate system in support of inspection activities",
      },
      {
        title:
          "Performance of regulatory inspections",
        desc: "Performing regulatory inspections – such as pre-approval, routine and investigative regulatory inspections of manufacturing facilities, testing laboratories, clinical research organizations and distribution channels (throughout the supply chain) – for compliance with applicable national and international requirements (i.e. GxPs, as required)",
      },
      {
        title:
          "Product quality",
        desc: "Applying scientific and regulatory requirements to chemistry, manufacturing and controls for a drug substance or drug product",
      },
      {
        title:
          "Regulatory decision-making",
        desc: "Making or recommending regulatory decisions on facilities based on appropriate reviews of documentation, inspections (as applicable)",
      }
    ],
  },
  {
    value: 311,
    jobFunc: 13,
    text: "The Reviewers",
    functionalAssessment: [
      {
        title: "Bioavailability / bioequivalence",
        desc: "Applying scientific principles, regulatory requirements and best practices to review bioavailability and bioequivalence data",
      },
      {
        title:
          "Review of clinical trial notifications and oversight of clinical trials",
        desc: "",
      },
      {
        title:
          "Clinical Study Operations (GCP)",
        desc: "Managing clinical studies (adverse event identification and reporting, post-market surveillance, and pharmacovigilance [PV]); handling of investigational product",
      },
      {
        title:
          "Data Management and Informatics",
        desc: "Ensuring best practices and resources required for standardizing data collection, capture, management, analysis and reporting",
      },
      {
        title:
          "Design and analysis of clinical trials, and analysis of real-world and other sources of data",
        desc: "",
      },
      {
        title:
          "Ethical and Participant Safety Considerations",
        desc: "Considering the care of patients, aspects of human participant protection, and safety in the conduct of a clinical trial",
      },
      {
        title:
          "Investigational product development and regulation",
        desc: "Concerns knowledge of the development and regulation of investigational products",
      },
      {
        title:
          "Data review on safety, efficacy and quality",
        desc: "Reviewing data on safety, efficacy and quality in applications for clinical studies, marketing authorization and post-approval changes (variations)",
      },
      {
        title:
          "Maintenance of a register of approved products",
        desc: "Maintaining a register of approved products, including periodic renewal and regulatory actions to suspend, withdraw or cancel registrations due to non-compliance with requirements",
      }
    ],
  },
  {
    value: 312,
    jobFunc: 13,
    text: "Product Quality",
    functionalAssessment: [
      {
        title: "Applying scientific and regulatory requirements to chemistry, manufacturing and controls for a drug substance or drug product",
        desc: "",
      }
    ],
  },
  {
    value: 313,
    jobFunc: 13,
    text: "Laboratory Analyst",
    functionalAssessment: [
      {
        title: "Work environment safety",
        desc: "Maintaining a safe and productive work environment",
      },
      {
        title: "Laboratory systems and equipment",
        desc: "Ensuring proper functioning of laboratory systems and equipment, including operation, maintenance and calibration of equipment and workflow",
      },
      {
        title: "Analytical methods and reports",
        desc: "Analyzing data, test results and reports using mathematical and statistical (if applicable) calculations",
      },
      {
        title: "Routine laboratory operations",
        desc: "Understanding and applying principles, procedures and standards of routine laboratory operations in compliance with the regulation of medicines",
      }
    ],
  },
  {
    value: 314,
    jobFunc: 13,
    text: "Work Environment Safety",
    functionalAssessment: [
      {
        title: "Routine laboratory operations maintenance of a safe and productive work environment",
        desc: "",
      }
    ],
  },
  {
    value: 315,
    jobFunc: 13,
    text: "Vigilance Personnel",
    functionalAssessment: [
      {
        title: "Post-market surveillance",
        desc: "Monitoring the safety of medicines on the market; assessing the effectiveness of risk mitigation/minimization measures",
      },
      {
        title: "Pre-market vigilance",
        desc: "Assessing pre-market risk management measures to ensure the safety of medicines",
      },
      {
        title: "PV system strengthening",
        desc: "Building and strengthening national capacity for PV of medicines",
      },
      {
        title: "Regulatory actions",
        desc: "Communicating risk of signals detected from PV activities, and evaluating the performance of the national PV system",
      },
    ],
  },
  {
    value: 316,
    jobFunc: 13,
    text: "The Prescriber - Prescribing Governance",
    functionalAssessment: [
      {
        title: "Prescribe Safely",
        desc: "",
      },
      {
        title: "Prescribe Professionally",
        desc: "",
      },
      {
        title: "Improve prescribing practices",
        desc: "",
      },
      {
        title: "Prescribe as part of a team",
        desc: "",
      },
      {
        title: "Data management",
        desc: "",
      },
      {
        title: "Product quality",
        desc: "",
      },
      {
        title: "Compliance with regulatory requirements",
        desc: "",
      },
      {
        title: "Product information and labeling",
        desc: "",
      },
      {
        title: "Maintenance of the product review system",
        desc: "",
      },
    ],
  },
  {
    value: 317,
    jobFunc: 14,
    text: "Assistant Marketing Executive",
    functionalAssessment: [
      {
        title: "Brand Campaign Management",
        desc: "",
      },
      {
        title: "Brand Guideline Development",
        desc: "",
      },
      {
        title: "Media Platforms Management",
        desc: "",
      },
      {
        title: "Brand Portfolio Management",
        desc: "",
      },
      {
        title: "Media Strategy Development",
        desc: "",
      },
      {
        title: "Budgeting",
        desc: "",
      },
      {
        title: "Social Media Management",
        desc: "",
      },
      {
        title: "Content Writing and Editing ",
        desc: "",
      },
      {
        title: "Stakeholder Management",
        desc: "",
      },
      {
        title: "Data Mining and Modelling ",
        desc: "",
      },
      {
        title: "Strategy Implementation",
        desc: "",
      },
      {
        title: "Design Concepts Generation",
        desc: "",
      },
      {
        title: "Technology Application",
        desc: "",
      },
      {
        title: "Digital Marketing",
        desc: "",
      },
      {
        title: "Technology Scanning",
        desc: "",
      },
      {
        title: "E-Commerce Campaign Management",
        desc: "",
      },
      {
        title: "Tourism and Economic Development",
        desc: "",
      },
      {
        title: "Infographics and Data Visualisation ",
        desc: "",
      },
      {
        title: "Visual Collaterals Production",
        desc: "",
      },
      {
        title: "Market Research",
        desc: "",
      },
      {
        title: "Website Design",
        desc: "",
      },
      {
        title: "Marketing Campaign Management ",
        desc: "",
      },
      {
        title: "Website Performance Management",
        desc: "",
      },
    ],
  },
  {
    value: 318,
    jobFunc: 14,
    text: "Marketing Executive",
    functionalAssessment: [{title:"Brand Campaign Management ",desc:""},{title:"Marketing Communications Plan Development ",desc:""},{title:"Brand Guideline Development ",desc:""},{title:"Media Platforms Management ",desc:""},{title:"Brand Portfolio Management ",desc:""},{title:"Media Strategy Development ",desc:""},{title:"Budgeting ",desc:""},{title:"Social Media Management ",desc:""},{title:"Content Writing and Editing ",desc:""},{title:"Stakeholder Management ",desc:""},{title:"Data Mining and Modelling ",desc:""},{title:"Strategy Implementation ",desc:""},{title:"Design Concepts Generation ",desc:""},{title:"Technology Application ",desc:""},{title:"Digital Marketing ",desc:""},{title:"Technology Scanning ",desc:""},{title:"E-Commerce Campaign Management ",desc:""},{title:"Tourism and Economic Development ",desc:""},{title:"Infographics and Data Visualisation ",desc:""},{title:"Visual Collaterals Production ",desc:""},{title:"Market Research ",desc:""},{title:"Website Design ",desc:""},{title:"Marketing Campaign Management ",desc:""},{title:"Website Performance Management",desc:""}],
  },
  {
    value: 319,
    jobFunc: 14,
    text: "Sponsorship Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Sponsorship Management",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],
  },
  {
    value: 320,
    jobFunc: 14,
    text: "Sales Executive/Travel Consultant (Sales)",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Sales Closure",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Sales Target Management",desc:""},
      {title:"Customer Acquisition Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Customer Loyalty and Retention Strategy Formulation",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Demand Analysis",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],
  },
  {
    value: 321,
    jobFunc: 14,
    text: "Sales Executive/Travel Consultant (Sales)",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Sales Closure",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Sales Target Management",desc:""},
      {title:"Customer Acquisition Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Customer Loyalty and Retention Strategy Formulation",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Demand Analysis",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],
  },
  {
    value: 322,
    jobFunc: 14,
    text: "Marketing Manager",
    functionalAssessment: [{title:"Brand Campaign Management",desc:""},
      {title:"Marketing Communications Plan Development",desc:""},
      {title:"Brand Guideline Development",desc:""},
      {title:"Media Platforms Management",desc:""},
      {title:"Brand Portfolio Management",desc:""},
      {title:"Media Strategy Development",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Social Media Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Content Writing and Editing",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Design Concepts Generation",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Digital Marketing",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"E-Commerce Campaign Management",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Infographics and Data Visualisation",desc:""},
      {title:"Visual Collaterals Production",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Website Design",desc:""},
      {title:"Market Research",desc:""},
      {title:"Website Performance Management",desc:""},
      {title:"Marketing Campaign Management",desc:""},
      ],
  },
  {
    value: 323,
    jobFunc: 14,
    text: "Sponsorship Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Sponsorship Management",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Networking",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],
  },
  {
    value: 324,
    jobFunc: 14,
    text: "Business Development Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Networking",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Opportunities Development",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Market Research",desc:""},
      ],      
  },
  {
    value: 325,
    jobFunc: 14,
    text: "Sales Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Market Research",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Networking",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Sales Closure",desc:""},
      {title:"Customer Acquisition Management",desc:""},
      {title:"Sales Target Management",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Customer Loyalty and Retention Strategy Formulation",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Demand Analysis",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],            
  },
  {
    value: 326,
    jobFunc: 14,
    text: "Marketing Director",
    functionalAssessment: [{title:"Brand Campaign Management",desc:""},
      {title:"Market Research",desc:""},
      {title:"Brand Guideline Development",desc:""},
      {title:"Marketing Campaign Management",desc:""},
      {title:"Brand Portfolio Management",desc:""},
      {title:"Marketing Communications Plan Development",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Media Strategy Development",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Social Media Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Digital Marketing",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"E-Commerce Campaign Management",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Infographics and Data Visualisation",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Learning and Development",desc:""},
      ],                  
  },
  {
    value: 327,
    jobFunc: 14,
    text: "Sponsorship Director",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Sponsorship Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Networking",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      ],                     
  },
  {
    value: 328,
    jobFunc: 14,
    text: "Business Development Director",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Market Research",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Networking",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Opportunities Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],                         
  },
  {
    value: 329,
    jobFunc: 14,
    text: "Sales Director",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Market Research",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Networking",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Customer Acquisition Management",desc:""},
      {title:"Sales Target Management",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Customer Loyalty and Retention Strategy Formulation",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Demand Analysis",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],                              
  },
  {
    value: 330,
    jobFunc: 14,
    text: "Operations Crew",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Attractions Ride and Equipment Maintenance",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                              
  },
  {
    value: 331,
    jobFunc: 14,
    text: "Admission and Ticketing Crew",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Sales Closure",desc:""},
      {title:"Attractions Membership, Admission and Ticketing Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                    
  },
  {
    value: 332,
    jobFunc: 14,
    text: "Membership Crew",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Sales Closure",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Attractions Membership, Admission and Ticketing Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      ],                                       
  },
  {
    value: 333,
    jobFunc: 14,
    text: "Guest Service Crew",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      ],                                             
  },
  {
    value: 334,
    jobFunc: 14,
    text: "Guide",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Attractions Content and Experience Development and Delivery",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Attractions Transportation Operations",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Resource Management",desc:""},
      ],                                                  
  },
  {
    value: 335,
    jobFunc: 14,
    text: "Assistant Content and Experience Development Executive/Assistant Curator",
    functionalAssessment: [{title:"Attractions Content and Experience Development and Delivery",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Content Writing and Editing",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Market Research",desc:""},
      {title:"Volunteer Management",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      ],                                                      
  },
  {
    value: 336,
    jobFunc: 14,
    text: "Assistant Keeper/Assistant Aquarist",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Knowledge Management",desc:""},
      {title:"Animal Conditioning and Enrichment",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Animal Habitat Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Animal Husbandry and Nutrition",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Animal Transaction",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Attractions Programme Development",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                        
  },
  {
    value: 337,
    jobFunc: 14,
    text: "Assistant Horticulturist",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Attractions Programme Development",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Content Writing and Editing",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Horticulture Management",desc:""},
      {title:"Volunteer Management",desc:""},
      {title:"Knowledge Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Learning and Development",desc:""},
      ],                                                           
  },
  {
    value: 338,
    jobFunc: 14,
    text: "Attractions Operations Supervisor/Attractions Operations Executive",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Attractions Membership, Admission and Ticketing Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Attractions Ride and Equipment Maintenance",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Attractions Transportation Operations",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Internet of Things Management",desc:""},
      ],                                                         
  },
  {
    value: 339,
    jobFunc: 14,
    text: "Keeper/Aquarist",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Knowledge Management",desc:""},
      {title:"Animal Conditioning and Enrichment",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Animal Habitat Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Animal Husbandry and Nutrition",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Animal Transaction",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Attractions Programme Development",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                               
  },
  {
    value: 340,
    jobFunc: 14,
    text: "Horticulturist",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Attractions Programme Development",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Content Writing and Editing",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Horticulture Management",desc:""},
      {title:"Volunteer Management",desc:""},
      {title:"Knowledge Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                   
  },
  {
    value: 341,
    jobFunc: 14,
    text: "Attractions Operations Manager",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Merchandise Buying",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Merchandise Performance Analysis",desc:""},
      {title:"Attractions Membership, Admission and Ticketing Management",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Attractions Ride and Equipment Maintenance",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Attractions Transportation Operations",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Internet of Things Management",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                  
  },
  {
    value: 341,
    jobFunc: 14,
    text: "Head Keeper/Head Aquarist",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Animal Conditioning and Enrichment",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Animal Habitat Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Animal Husbandry and Nutrition",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Animal Transaction",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Attractions Guest Relations Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Attractions Programme Development",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Knowledge Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Learning and Development",desc:""},
      ],                                                                      
  },
  {
    value: 342,
    jobFunc: 14,
    text: "Assistant Research Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Content and Experience Development and Delivery",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],                                                                           
  },
  {
    value: 343,
    jobFunc: 14,
    text: "Assistant Event Executive/Assistant Project Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Market Research",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Management",desc:""},
      {title:"Vendor Management",desc:""},
      ],                                                                             
  },
  {
    value: 344,
    jobFunc: 14,
    text: "Assistant Event Operations Executive",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Delegate and Participant Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Volunteer Management",desc:""},
      {title:"Project Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                               
  },
  {
    value: 345,
    jobFunc: 14,
    text: "Research Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Intellectual Property Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Internet of Things Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Content and Experience Development and Delivery",desc:""},
      ],                                                                                   
  },
  {
    value: 346,
    jobFunc: 14,
    text: "Event Executive/Project Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Market Research",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Management",desc:""},
      {title:"Vendor Management",desc:""},
      ],                                                                                 
  },
  {
    value: 347,
    jobFunc: 14,
    text: "Event Operations Executive",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Delegate and Participant Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Volunteer Management",desc:""},
      {title:"Project Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                                       
  },
  {
    value: 348,
    jobFunc: 14,
    text: "Exhibition Producer/Conference Producer/Meeting Planner",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Content and Experience Development and Delivery",desc:""},
      {title:"Business Planning",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Change Management",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Intellectual Property Management",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Internet of Things Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],                                                                                            
  },
  {
    value: 349,
    jobFunc: 14,
    text: "Event Manager/Project Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Project Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Vendor Management",desc:""},
      ],                                                                                             
  },
  {
    value: 350,
    jobFunc: 14,
    text: "Event Operations Manager",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Project Management",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Delegate and Participant Management",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Volunteer Management",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      ],                                                                                                
  },
  {
    value: 351,
    jobFunc: 14,
    text: "Exhibition Director/Conference Director/Meeting Director",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Content and Experience Development and Delivery",desc:""},
      {title:"Business Planning",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Change Management",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Intellectual Property Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Internet of Things Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Manpower Planning",desc:""},
      ],                                                                                                      
  },
  {
    value: 352,
    jobFunc: 14,
    text: "Assistant Event Services Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Market Research",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Equipment Management and Venue Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Management",desc:""},
      ],                                                                                                            
  },
  {
    value: 353,
    jobFunc: 14,
    text: "Assistant Venue Operations Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Market Research",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Equipment Management and Venue Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Management",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                                                               
  },
  {
    value: 354,
    jobFunc: 14,
    text: "Event Services Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Market Research",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Equipment Management and Venue Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Management",desc:""},
      ],                                                                                                                     
  },
  {
    value: 355,
    jobFunc: 14,
    text: "Venue Operations Executive",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Equipment Management and Venue Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                                                                        
  },
  {
    value: 356,
    jobFunc: 14,
    text: "Event Services Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Project Feasibility Assessment",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Project Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Equipment Management and Venue Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Administration",desc:""},
      ],                                                                                                                         
  },
  {
    value: 357,
    jobFunc: 14,
    text: "Venue Operations Manager",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Project Management",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Crowd Control and Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Events Planning and Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Meetings, Incentives, Conferences and Exhibitions (MICE) Equipment Management and Venue Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Project Administration",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                                                                               
  },
  {
    value: 358,
    jobFunc: 14,
    text: "Assistant Customer Support Executive/Assistant Travel Consultant (Customer Support)",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tour and Travel Coordination, Ticketing and Reservations Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Sales Closure",desc:""},
      ],                                                                                                                               
  },
  {
    value: 359,
    jobFunc: 14,
    text: "Assistant Coordination and Reservations Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tour and Travel Coordination, Ticketing and Reservations Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Service Excellence",desc:""},
      ],                                                                                                                                 
  },
  {
    value: 360,
    jobFunc: 14,
    text: "Assistant Product and Experience Development Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Scanning in Tourism",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Vendor Management",desc:""},
      ],                                                                                                                                  
  },
  {
    value: 361,
    jobFunc: 14,
    text: "Tour Leader",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Tour Leading Operations",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      {title:"Stakeholder Management ",desc:""},
      ],                                                                                                                            
  },
  {
    value: 362,
    jobFunc: 14,
    text: "Tourist Guide",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Tour Guide Operations",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Vendor Management",desc:""},
      ],                                                                                                                                
  },
  {
    value: 363,
    jobFunc: 14,
    text: "Travel Account Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Sales Closure",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Sales Target Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Customer Loyalty and Retention Strategy Formulation",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Technology Scanning in Tourism",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Proposal Writing",desc:""},
      ],                                                                                                                                 
  },
  {
    value: 364,
    jobFunc: 14,
    text: "Customer Support Executive/Travel Consultant(Customer Support)",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tour and Travel Coordination, Ticketing and Reservations Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Sales Closure",desc:""},
      ],                                                                                                                             
  },
  {
    value: 365,
    jobFunc: 14,
    text: "Coordination and Reservations Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tour and Travel Coordination, Ticketing and Reservations Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Service Excellence",desc:""},
      ],                                                                                                                            
  },
  {
    value: 366,
    jobFunc: 14,
    text: "Coordination and Reservations Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tour and Travel Coordination, Ticketing and Reservations Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Service Excellence",desc:""},
      ],                                                                                                                            
  },
  {
    value: 367,
    jobFunc: 14,
    text: "Product and Experience Development Executive",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Change Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Scanning in Tourism",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Intellectual Property Management",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Market Research",desc:""},
      {title:"Vendor Management",desc:""},
      ],                                                                                                                          
  },
  {
    value: 368,
    jobFunc: 14,
    text: "Travel Account Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Proposal Writing",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Sales Closure",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Sales Target Management",desc:""},
      {title:"Business Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Customer Loyalty and Retention Strategy Formulation",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Technology Scanning in Tourism",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Market Research",desc:""},
      ],                                                                                                                         
  },
  {
    value: 370,
    jobFunc: 14,
    text: "Travel Operations Manager",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Data Mining and Modelling",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Tour and Travel Coordination, Ticketing and Reservations Management",desc:""},
      {title:"Market Research",desc:""},
      {title:"Tour Guide Operations",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Tour Leading Operations",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                                                                            
  },
  {
    value: 371,
    jobFunc: 14,
    text: "Product and Experience Development Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Market Research",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Business Planning",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Change Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Implementation",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Financial Planning and Analysis",desc:""},
      {title:"Technology Application",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Technology Scanning in Tourism",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Intellectual Property Management",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Vendor Management",desc:""},
      ],                                                                                                                               
  },
  {
    value: 372,
    jobFunc: 14,
    text: "Product and Experience Development Manager",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Business Data Analysis",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Sales Target Management",desc:""},
      {title:"Business Planning",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Customer Behaviour Analysis",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Customer Loyalty and Retention Strategy Formulation",desc:""},
      {title:"Technology Scanning in Tourism",desc:""},
      {title:"Customer Relationship Management",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Tourism and the Economy",desc:""},
      ],                                                                                                                              
  },
  {
    value: 373,
    jobFunc: 14,
    text: "Travel Operations Director",
    functionalAssessment: [{title:"Accident and Incident Response Management",desc:""},
      {title:"Productivity Improvement",desc:""},
      {title:"Budgeting",desc:""},
      {title:"Resource Management",desc:""},
      {title:"Business Continuity Planning",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Systems Thinking Application",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Manpower Planning",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Workplace Safety and Health Performance Management",desc:""},
      ],                                                                                                                               
  },
  {
    value: 374,
    jobFunc: 14,
    text: "Product and Experience Development Director",
    functionalAssessment: [{title:"Budgeting",desc:""},
      {title:"Learning and Development",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Business Planning",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Change Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Contract Development and Management",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Technology Scanning in Tourism",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Tour and Travel Services Product and Experience Development and Delivery",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Tourism and the Economy",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Vendor Management",desc:""},
      {title:"Intellectual Property Management",desc:""},
      ],                                                                                                                                    
  },
  {
    value: 375,
    jobFunc: 14,
    text: "Chief Executive Officer/Managing Director/General Manager",
    functionalAssessment: [{title:"Business Continuity Planning",desc:""},
      {title:"Networking",desc:""},
      {title:"Business Negotiation",desc:""},
      {title:"Organisational Vision, Mission and Values Formulation",desc:""},
      {title:"Business Performance Management",desc:""},
      {title:"Product, Content and Experience Performance Management",desc:""},
      {title:"Business Planning",desc:""},
      {title:"Risk Management and Administration",desc:""},
      {title:"Change Management",desc:""},
      {title:"Service Excellence",desc:""},
      {title:"Continuous Improvement Management",desc:""},
      {title:"Stakeholder Management",desc:""},
      {title:"Corporate Governance",desc:""},
      {title:"Strategy Planning",desc:""},
      {title:"Employee and Labour Relations",desc:""},
      {title:"Succession Planning",desc:""},
      {title:"Financial Management",desc:""},
      {title:"Technology Scanning",desc:""},
      {title:"Innovation Management",desc:""},
      {title:"Tourism and Economic Development",desc:""},
      ],                                                                                                                                      
  },
  {
    value: 376,
    jobFunc: 14,
    text: "Human Resources",
    functionalAssessment: [{title:"Project Administration",desc:"Plan and coordinate project closures and documentation processes, and refine project administration policies and procedures"},
      {title:"Project Feasibility Assessment",desc:"Assess the business environment and organisational capabilities to evaluate and determine the feasibility of a project"},
      {title:"Project Management",desc:"Execute projects by managing stakeholder, resources,budgets and resolving problems"},
      {title:"Tour and Travel Coordination,Ticketing and Reservations Management",desc:"Develop policies and procedures for management of coordination, ticketing and travel reservations in support of customers’ requirements"},
      {title:"Tour Guide Operations",desc:"Manage tour guiding operations and duties, including the development of policies and procedures in compliance with legal and regulatory requirements of local tour operations"},
      {title:"Tour Leading Operations",desc:"Manage overseas travel operations including performance of emergency responses and recovery procedures where necessary"}
      ],                                                                                                                                      
  },
  {
    value: 377,
    jobFunc: 15,
    text: "Customer Service",
    functionalAssessment: [],                                                                                                                                      
  },
  {
    value: 378,
    jobFunc: 15,
    text: "Technical Support",
    functionalAssessment: [],
  },
  {
    value: 379,
    jobFunc: 15,
    text: "Tele-marketing",
    functionalAssessment: [],
  },
  {
    value: 380,
    jobFunc: 15,
    text: "Lead Generation",
    functionalAssessment: [],
  },
  {
    value: 381,
    jobFunc: 15,
    text: "Administrative back-office services",
    functionalAssessment: [],
  },
  {
    value: 382,
    jobFunc: 15,
    text: "Digitization Clerk",
    functionalAssessment: [],
  },
  {
    value: 383,
    jobFunc: 15,
    text: "Customer care management",
    functionalAssessment: [
      {title:"Language proficiency",desc:"The ability to deliver the work required at the required level of delivery in the specific language needed to perform the work"},
      {title:"Domain expertise",desc:"The ability to apply and build knowledge of what the topic, it's target process, and the ability to retain knowledge sufficiently."},
      {title:"Customer care",desc:"The ability and willingness to work with the client to deliver quality customer experience."},
      {title:"Dispute resolution",desc:"The ability to deal well with conflict situations, avoiding escalations and negative customer experience."},
      {title:"Knowing your client",desc:"The ability and willingness to find out what the customer wants and needs and to act accordingly, taking the organization's costs and benefits into account."},
      {title:"Building rapport",desc:"The ability to identify common interests or common ground that all parties can agree upon.  The existence of a defined common ground to indicate trust and understanding."},
      {title:"Building trust",desc:"Gaining others' confidence by acting with integrity and following through on commitments, while sharing own perspective."},
      {title:"Sourcing Capability",desc:"The ability to access whatever resources are required to deliver the service targets."},
      {title:"KPI management",desc:"The ability to monitor, track, and report performance against the set key performance indicators.  The ability to identify key trends that need to be monitored."},
    ],
  },
  {
    value: 384,
    jobFunc: 13,
    text: "Sales",
    functionalAssessment: [
      {
        title: "Business and Industry Analysis",
        desc: "Includes knowledge of common pricing and promotions, forecasting competitors' behavior, industry trends and forecasting, and client needs and forecasting. ",
      },
      {
        title: "Product Analysis",
        desc: "Includes creating organizational product offerings, taking in product feedback, crafting the organizational value proposition and client-product alignment, and having knowledge of competitors' offerings.",
      },
      {
        title: "Client Onboarding ",
        desc: "Includes knowledge of the client-organization onboarding, creating a smooth client transition to the organization's account manager, and working through all referrals.",
      },
      {
        title: "Overarching Sales Delivery",
        desc: "Includes ensuring service delivery quality, having knowledge of the sales process, responding to client queries, working through customer relationship management (CRM), performing data collection, ensuring data integrity, performing activity management, and working through client satisfaction surveys and individual feedback.",
      },
      {
        title: "Demand Generation",
        desc: "Includes working through sales prospecting, handling sales calls, researching and identifying sales opportunities, and ensuring data integrity in the search process.",
      },
      {
        title: "Development of Leads to Sales",
        desc: "Includes handling objections, qualifying opportunities and gauging the client's stage in the buying process, and working through negotiations with buyers.",
      },
      {
        title: "Sales Closing",
        desc: "Includes the ability to close the sale. Further, it includes the ability to cross-sell and upgrade or up-sell products where appropriate.",
      },
      {
        title: "Growing Accounts",
        desc: "Includes upgrading or up-selling (or cross-selling) clients' accounts, handling objections, and working through negotiations in the account growth process.",
      },
      {
        title: "Renewing Accounts",
        desc: "Includes reviewing all accounts, asking the client to renew, and handling difficult renewals.",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans.",
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value.",
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders.",
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis.",
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully.",
      },
    ],
  },
  {
    value: 385,
    jobFunc: 13,
    text: "Marketing",
    functionalAssessment: [
      {
        title: "Industry Analysis",
        desc: "Includes the ability to forecast industry growth and examine trends in global and local markets. Further, it includes the ability to identify opportunities, conduct consumer segmentation analyses, collect competitor intelligence where possible, and have knowledge of the product lifecycle, product substitutes, and design best practices.",
      },
      {
        title: "Consumer and Customer Analysis",
        desc: "Includes the ability to identify target market selection, conduct analysis on consumer trends and buying power, develop insights on customers, and accurately forecast demand.",
      },
      {
        title: "Campaign Planning and Execution",
        desc: "Includes the ability to plan and develop marketing content, use different promotional mediums, disseminate marketing messages, conduct profitability analysis, plan for internal assessments around risk adoption, and manage external agencies where needed through an analysis of all campaign costs, both internal and external.",
      },
      {
        title: "Marketing Operations",
        desc: "Includes the ability to analyze and report on performance metrics, skills in customer relationship management (CRM), knowledge of data collection methods, knowledge of maintenance standards and integrity, and ability to develop project timelines, identify scope, and create budget.",
      },
      {
        title: "Demand Generation and Lead Management",
        desc: "Includes developing, qualifying, and nurturing promotions; identifying how to develop demand and lead management processes; knowledge of how to increase the speed of customer purchasing; and knowledge of when to offer promotional discounts to incent buyers.",
      },
      {
        title: "Sales Support",
        desc: "Includes knowledge of sales collateral and pipeline acceleration (i.e. accelerating the purchasing process for the buyer).",
      },
      {
        title: "Distribution Channels Support and Analysis",
        desc: "Includes the ability to analyze and support the distribution network, maintain distribution channel relationships, and support sales divisions with both direct and indirect sales channels.",
      },
      {
        title: "Customer Experience and Engagement Creation",
        desc: "Includes planning initial customer onboarding, developing word-of-mouth (WOM) initiatives, spearheading customer data initiatives, and developing customer loyalty programs.",
      },
      {
        title: "Product Planning and Development",
        desc: "Includes planning for new and existing product or service development through analyses of pricing, product packaging and design, product positioning, knowledge of the product lifecycle, and knowledge of merchandising and placement.",
      },
      {
        title: "Communications Development",
        desc: "Includes the ability to communicate internal/corporate marketing, external communication skills, crafting the organizational image, creating public and media relations campaigns, developing partnerships and sponsorships, and working with advertising agencies to aid in advertising development.",
      },
      {
        title: "Event Planning and Development",
        desc: "Includes planning event logistics, vendor management, coordinating with organization and party management, and working with third-party events",
      },
      {
        title: "Brand Development",
        desc: "Includes knowledge of brand development and positioning tactics, brand awareness and integrity, inventory of branded items, brand stewardship, and developing and measuring brand loyalty.",
      },
      {
        title: "Online Channel Support and Analysis",
        desc: "Includes social media marketing, knowledge of digital platforms and processes (webinars and teleconferencing), search engine marketing (SEM, SEO, and paid searches), mobile marketing, web development skills, and knowledge of marketing automation (email marketing, lead management automation, and enterprise marketing management).",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans.",
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value.",
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders.",
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis.",
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully.",
      },
    ],
  },
  {
    value: 386,
    jobFunc: 13,
    text: "Finance",
    functionalAssessment: [
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
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans.",
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value.",
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders.",
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis.",
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully.",
      },
    ],
  },
  {
    value: 387,
    jobFunc: 13,
    text: "IT",
    functionalAssessment: [
      {
        title: "Project Management",
        desc: "Includes knowledge of: IT project frameworks and their corresponding lifecycle; project management concepts, tools, and best practices; project reporting standards; and developing project plans.",
      },
      {
        title: "Requirements Gathering",
        desc: "Includes ability to identify key players and knowledge of requirements gathering techniques (i.e. brainstorming, document analysis, focus groups, interviews, prototyping, surveys, observation, reverse engineering, and workshops).",
      },
      {
        title: "Business Analysis",
        desc: "Includes knowledge of business functions and processes, business decision-making processes, and business case methodologies and measurement.",
      },
      {
        title: "Documentation and Measurement ",
        desc: "Includes knowledge of documentation procedures and the ability to track changes, make updates, and relay other important information related to IT systems.",
      },
      {
        title: "Troubleshooting and Support",
        desc: "Includes knowledge of troubleshooting and support processes, knowledge of troubleshooting techniques, and the ability to be responsive to key issues.",
      },
      {
        title: "Policy and Compliance",
        desc: "Includes knowledge of relevant external policy and compliance procedures and relevant organizational policy and compliance procedures.",
      },
      {
        title: "Security and Data Protection",
        desc: "Includes knowledge of relevant security legislation and laws, security procedures and practices, and information management (i.e. information quality, accessibility, security, accuracy, and integrity).",
      },
      {
        title: "Modeling",
        desc: "Includes knowledge of tools and methodologies (UML, BPMN, etc.); systems and business architecture modeling; and modeling abilities for applications, IT systems, business systems, system integration, and data.",
      },
      {
        title: "Programming",
        desc: "Includes knowledge of relevant programming languages and programming abilities for application development (C++, java), web design (HTML), database and warehouse development (SQL), etc. Further, knowledge of problem and system decomposition, along with code organization and the ability to develop readable code.",
      },
      {
        title: "Testing and Quality Assurance",
        desc: "Includes the ability to test for quality assurance and control, and the ability to develop test cases, strategies, methodologies, and standards. Further, includes the ability to test different types (volume, unit, stress) and develop testing tools (scripts, reports).",
      },
      {
        title: "Installation and Integration",
        desc: "Includes knowledge of installation and integration procedures, and knowledge of common installation and integration tools and techniques.",
      },
      {
        title: "Vendor Selection and Management",
        desc: "Includes knowledge of the process to get information on vendor offerings, vendor management, and vendor selection.",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans.",
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value.",
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders.",
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis.",
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully.",
      },
    ],
  },
  {
    value: 388,
    jobFunc: 15,
    text: "Project Leader",
    functionalAssessment: [],
  },
  {
    value: 389,
    jobFunc: 15,
    text: "Process Consultant",
    functionalAssessment: [],
  },
  {
    value: 390,
    jobFunc: 15,
    text: "Process Coordinator",
    functionalAssessment: [],
  },
  {
    value: 391,
    jobFunc: 15,
    text: "Process Owner",
    functionalAssessment: [],
  },
  {
    value: 392,
    jobFunc: 15,
    text: "Process Controller",
    functionalAssessment: [],
  },
  {
    value: 393,
    jobFunc: 15,
    text: "Process Staff",
    functionalAssessment: [],
  },
  {
    value: 394,
    jobFunc: 15,
    text: "IT",
    functionalAssessment: [
      {
        title: "Project Management",
        desc: "Includes knowledge of: IT project frameworks and their corresponding lifecycle; project management concepts, tools, and best practices; project reporting standards; and developing project plans.",
      },
      {
        title: "Requirements Gathering",
        desc: "Includes ability to identify key players and knowledge of requirements gathering techniques (i.e. brainstorming, document analysis, focus groups, interviews, prototyping, surveys, observation, reverse engineering, and workshops).",
      },
      {
        title: "Business Analysis",
        desc: "Includes knowledge of business functions and processes, business decision-making processes, and business case methodologies and measurement.",
      },
      {
        title: "Documentation and Measurement ",
        desc: "Includes knowledge of documentation procedures and the ability to track changes, make updates, and relay other important information related to IT systems.",
      },
      {
        title: "Troubleshooting and Support",
        desc: "Includes knowledge of troubleshooting and support processes, knowledge of troubleshooting techniques, and the ability to be responsive to key issues.",
      },
      {
        title: "Policy and Compliance",
        desc: "Includes knowledge of relevant external policy and compliance procedures and relevant organizational policy and compliance procedures.",
      },
      {
        title: "Security and Data Protection",
        desc: "Includes knowledge of relevant security legislation and laws, security procedures and practices, and information management (i.e. information quality, accessibility, security, accuracy, and integrity).",
      },
      {
        title: "Modeling",
        desc: "Includes knowledge of tools and methodologies (UML, BPMN, etc.); systems and business architecture modeling; and modeling abilities for applications, IT systems, business systems, system integration, and data.",
      },
      {
        title: "Programming",
        desc: "Includes knowledge of relevant programming languages and programming abilities for application development (C++, java), web design (HTML), database and warehouse development (SQL), etc. Further, knowledge of problem and system decomposition, along with code organization and the ability to develop readable code.",
      },
      {
        title: "Testing and Quality Assurance",
        desc: "Includes the ability to test for quality assurance and control, and the ability to develop test cases, strategies, methodologies, and standards. Further, includes the ability to test different types (volume, unit, stress) and develop testing tools (scripts, reports).",
      },
      {
        title: "Installation and Integration",
        desc: "Includes knowledge of installation and integration procedures, and knowledge of common installation and integration tools and techniques.",
      },
      {
        title: "Vendor Selection and Management",
        desc: "Includes knowledge of the process to get information on vendor offerings, vendor management, and vendor selection.",
      },
      {
        title: "Data Analysis",
        desc: "Analyzes and draws insights from relevant data to identify organizational challenges and opportunities. Uses storytelling to effectively communicate insights and actionable, data-informed recommendations.",
      },
      {
        title: "Strategic Thinking",
        desc: "The ability to analyze complex situations, anticipate future trends, and develop effective long-term plans." 
      },
      {
        title: "Innovation",
        desc: "The capacity to generate new ideas, approaches, or products that improve efficiency, effectiveness, or value." 
      },
      {
        title: "Customer Service",
        desc: "The skills and behaviors necessary to provide exceptional service to customers, clients, or stakeholders." 
      },
      {
        title: "Financial Acumen",
        desc: "The knowledge and understanding of financial concepts, including budgeting, forecasting, and analysis." 
      },
      {
        title: "Project Management",
        desc: "The skills and abilities required to plan, organize, and execute projects successfully." 
      }
    ],
  },
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
