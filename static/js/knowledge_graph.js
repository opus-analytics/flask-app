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

  console.log("Numbers");
  console.log(jobTitleData.length);
  console.log(jobFunctionalityList.length);

  const data = {
    name,
    jobFunctionality,
    jobTitle,
    monthsInRole,
  };

  const assessmentString = jobTitleData.find(
    (job) => job.value == jobTitle
  ).assessment; // Extract the assessment string

  assessmentArray = assessmentString.split("\n"); // Split the string into an array
  //remove empty element in an array
  assessmentArray = assessmentArray.filter((item) => item); // Remove empty elements

  // Create the form and add it to the desired location (replace with your target element ID)
  formElement = document.getElementById("assessmentForm");
  formElement.appendChild(createFormAssessment(assessmentArray));

  submitButton = document.getElementById("submit-button");

  submitButton.addEventListener("click", (event) => {
    event.preventDefault();

    // Get all slider input elements
    const sliders = document.querySelectorAll(
      'assessmentForm input[type="range"]'
    );

    // Extract slider input values
    const sliderValues = [];
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

function createFormAssessment(assessmentData) {
  // Create the form element
  const form = document.createElement("assessmentForm");
  form.id = "assessment-form"; // Set the ID

  // Loop through each assessment point
  assessmentData.forEach((assessment, index) => {
    // Create a div element for each assessment
    const assessmentContainer = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = `${index + 1}. ${assessment}`;
    assessmentContainer.appendChild(label);

    // Create a range slider for each assessment
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 1;
    slider.max = 5;
    slider.value = 0; // Set default value (adjust as needed)
    slider.name = `assessment-${index}`; // Unique name for each slider
    assessmentContainer.appendChild(slider);

    const sliderValue = document.createElement("output");
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
  },
  {
    value: 4,
    text: "Engineering - Software",
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
  },
  {
    value: 5,
    text: "Sales",
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
  },
  {
    value: 6,
    text: "Marketing",
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
  },
  {
    value: 7,
    text: "Finance",
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
];

const coreCompetencies = [
  {
    title:
      "Valuing Diversity",
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
    value: 1,
    jobFunc: 1,
    text: "Mobile Apps Developer",
    assessment:
      "Responsible for developing apps on one or more mobile platforms (iOS, Android, Blackberry or Windows Phone,etc) \n publishing to the app store, monitoring downloads, implementing designs accurately, etc\n",
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
