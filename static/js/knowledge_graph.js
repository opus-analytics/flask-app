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

  const data = {
    name,
    jobFunctionality,
    jobTitle,
    monthsInRole,
  };

  const assessmentArray = jobTitleData.find(
    (job) => job.value == jobTitle
  ).assessment; // Extract the assessment array

  // Create the form and add it to the desired location (replace with your target element ID)
  formElement = document.getElementById("assessmentForm");
  formElement.appendChild(createFormAssessment(assessmentArray));

  submitButton = document.getElementById("submit-button");

  submitButton.addEventListener("click", (event) => {
    event.preventDefault();

    // Get all slider input elements
    const sliders = document.querySelectorAll('assessmentForm input[type="range"]');

    // Extract slider input values
    const sliderValues = [];
    sliders.forEach((slider) => {
      sliderValues.push(slider.value);
    });

    // Calculation to the form 
    // First get user experience 
    let userExperience = 0;
    if (monthsInRole < 24) { // If user has been in role for 1 year
      userExperience = 0.5;
    }
    else if (monthsInRole >= 24 && monthsInRole < 36) { // If user has been in role for 2 years
      userExperience = 0.75;
    }
    else if (monthsInRole >= 36 && monthsInRole < 48) { // If user has been in role for 3 years
      userExperience = 0.9;
    }
    else if (monthsInRole >= 48 && monthsInRole < 72) { // If user has been in role for 4-5 years
      userExperience = 1;
    }
    else if (monthsInRole >= 72 && monthsInRole < 84) { // If user has been in role for 6 years
      userExperience = 0.95;
    }
    else if (monthsInRole >= 84 && monthsInRole < 96) { // If user has been in role for 7 years
      userExperience = 0.9;
    }
    else if (monthsInRole >= 96 && monthsInRole < 108) { // If user has been in role for 8 years
      userExperience = 0.8;
    }
    else if (monthsInRole >= 108 && monthsInRole < 120) { // If user has been in role for 9 years
      userExperience = 0.75;
    }
    else if (monthsInRole >= 120) { // If user has been in role for 10 years or more
      userExperience = 0.65;
    }
    
    for (let i = 0; i < sliderValues.length; i++) {
      answerValue = parseInt(sliderValues[i]);
      if(answerValue == 1) {
        sliderValues[i] = parseInt(25);
      }
      else if(answerValue == 2) {
        sliderValues[i] = parseInt(50);
      }
      else if(answerValue == 3) {
        sliderValues[i] = parseInt(75);
      }
      else if(answerValue == 4) {
        sliderValues[i] = parseInt(85);
      }
      else if(answerValue == 5) {
        sliderValues[i] = parseInt(100);
      }
    }

    const sum = sliderValues.reduce((a, b) => a + b, 0);
    const average = sum / sliderValues.length;

    const assessmentScore = average * userExperience;
    let weightedAssessmentScore = 0;
    if (assessmentScore >= 85) {
      weightedAssessmentScore = 0.85;
    }
    else if (assessmentScore >= 75 && assessmentScore < 85) {
      weightedAssessmentScore = 0.75;
    }
    else if (assessmentScore >= 70 && assessmentScore < 75) {
      weightedAssessmentScore = 0.70;
    }
    else if (assessmentScore >= 65 && assessmentScore < 70) {
      weightedAssessmentScore = 0.65;
    }
    else if (assessmentScore < 65) {
      weightedAssessmentScore = 0.60;
    }
    weightedAssessmentScore = weightedAssessmentScore * 100;
    submitButton.style.display = "none"; // Hide the submit button

    // Display the result
    const resultElement = document.getElementById("result");
    resultElement.textContent = `Your assessment score is ${weightedAssessmentScore.toFixed(2)}%`;
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
    text: "Software Development",
  },
  {
    value: 2,
    text: "Human Resources",
  },
  {
    value: 3,
    text: "Office Administration",
  },
  {
    value: 4,
    text: "Sales",
  },
  {
    value: 5,
    text: "Marketing",
  },
  {
    value: 6,
    text: "Finance & Accounting",
  },
  {
    value: 7,
    text: "Legal",
  },
  {
    value: 8,
    text: "Design & User Interface",
  },
  {
    value: 9,
    text: "Training & Teaching",
  },
  {
    value: 10,
    text: "Education",
  },
  {
    value: 11,
    text: "Unspecified",
  },
  {
    value: 12,
    text: "Engineering",
  },
  {
    value: 13,
    text: "Broadcasting / Film / Video Production",
  },
  {
    value: 14,
    text: "Engineering",
  },
  {
    value: 15,
    text: "Petroleum Engineering",
  },
  {
    value: 16,
    text: "Electrical Engineering",
  },
  {
    value: 17,
    text: "Writing & Editing",
  },
  {
    value: 18,
    text: "Information Technology (IT)",
  },
  {
    value: 21,
    text: "Computer Hardware",
  },
  {
    value: 22,
    text: "Apparel & Fashion",
  },
  {
    value: 23,
    text: "Urban & Human Development",
  },
  {
    value: 24,
    text: "Psychology & Psychiatry",
  },
  {
    value: 25,
    text: "Business Management",
  },
  {
    value: 26,
    text: "Music & Audio Production",
  },
  {
    value: 27,
    text: "Pharmacy & Healthcare",
  },
  {
    value: 28,
    text: "Logistics & Operations",
  },
  {
    value: 29,
    text: "Banking and Financial Services",
  },
  {
    value: 30,
    text: "Entertainment and Media",
  },
  {
    value: 31,
    text: "Insurance",
  },
  {
    value: 32,
    text: "Science & Biotechnology",
  },
  {
    value: 33,
    text: "Hospitality",
  },
  {
    value: 34,
    text: "Medical",
  },
  {
    value: 35,
    text: "Construction",
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
    text: "Mobile Apps Developer",
    assessment: [
      "Responsible for developing apps on one or more mobile platforms (iOS, Android, Blackberry or Windows Phone, etc.)",
      "Publishing to the app store",
      "Monitoring downloads",
      "Implementing designs accurately",
    ],
    jobFunc: 1,
    value: 1,
  },
  {
    text: "Software Developer",
    jobFunc: 1,
    value: 2,
  },
  {
    text: "Java Developer",
    jobFunc: 1,
    value: 3,
  },
  {
    text: "Linux System Administrator",
    jobFunc: 1,
    value: 4,
  },
  {
    text: "Networks Engineer",
    jobFunc: 1,
    value: 5,
  },
  {
    text: "Quality Control",
    jobFunc: 1,
    value: 6,
  },
  {
    text: "PHP Developer",
    jobFunc: 1,
    value: 7,
  },
  {
    text: "SharePoint Developer",
    jobFunc: 1,
    value: 8,
  },
  {
    text: "Solution Developer",
    jobFunc: 1,
    value: 9,
  },
  {
    text: "System Administrator",
    jobFunc: 1,
    value: 10,
  },
  {
    text: "System Analyst",
    jobFunc: 1,
    value: 11,
  },
  {
    text: "Technical Consultant",
    jobFunc: 1,
    value: 12,
  },
  {
    text: "Technical Manager",
    jobFunc: 1,
    value: 13,
  },
  {
    text: "HR Specialist",
    jobFunc: 2,
    value: 14,
  },
  {
    text: "Recruitment Specialist",
    jobFunc: 2,
    value: 15,
  },
  {
    text: "Web Developer",
    jobFunc: 1,
    value: 16,
  },
  {
    text: "Sales Representative",
    jobFunc: 4,
    value: 17,
  },
  {
    text: "Sales Associate",
    jobFunc: 4,
    value: 18,
  },
  {
    text: "Customer Care Representative",
    jobFunc: 4,
    value: 19,
  },
  {
    text: "Sales Support",
    jobFunc: 4,
    value: 20,
  },
  {
    text: "Sales Consultant",
    jobFunc: 4,
    value: 21,
  },
  {
    text: "Sales Manager",
    jobFunc: 4,
    value: 22,
  },
  {
    text: "Sales Director",
    jobFunc: 4,
    value: 23,
  },
  {
    text: "Personal Assistant",
    jobFunc: 3,
    value: 24,
  },
  {
    text: "Secretary",
    jobFunc: 3,
    value: 25,
  },
  {
    text: "Payroll manager",
    jobFunc: 2,
    value: 26,
  },
  {
    text: "HR Manager",
    jobFunc: 2,
    value: 27,
  },
  {
    text: "Auditor",
    jobFunc: 6,
    value: 28,
  },
  {
    text: "Accountant",
    jobFunc: 6,
    value: 29,
  },
  {
    text: "Chartered Accountant",
    jobFunc: 6,
    value: 30,
  },
  {
    text: "Budget Analyst",
    jobFunc: 6,
    value: 31,
  },
  {
    text: "Market Analyst",
    jobFunc: 6,
    value: 32,
  },
  {
    text: "Tax Consultant",
    jobFunc: 6,
    value: 33,
  },
  {
    text: "Accounts Analyst",
    jobFunc: 6,
    value: 34,
  },
  {
    text: "Tax Associate",
    jobFunc: 6,
    value: 35,
  },
  {
    text: "Financial Due Diligence Associate",
    jobFunc: 6,
    value: 36,
  },
  {
    text: "Tax Analyst",
    jobFunc: 6,
    value: 37,
  },
  {
    text: "Financial Services Advisory Banking Tech Payments Associate",
    jobFunc: 6,
    value: 38,
  },
  {
    text: "Actuarial Associate",
    jobFunc: 6,
    value: 39,
  },
  {
    text: "Actuarial Analyst",
    jobFunc: 6,
    value: 40,
  },
  {
    text: "Contract Recruiter",
    jobFunc: 2,
    value: 41,
  },
  {
    text: "Benefits Administrator",
    jobFunc: 2,
    value: 42,
  },
  {
    text: "HR Administrative Assistant",
    jobFunc: 2,
    value: 43,
  },
  {
    text: "Employee Relations Manager",
    jobFunc: 2,
    value: 44,
  },
  {
    text: "HR Coordinator",
    jobFunc: 2,
    value: 45,
  },
  {
    text: "Payroll Administrator",
    jobFunc: 2,
    value: 46,
  },
  {
    text: "Compensation Analyst",
    jobFunc: 2,
    value: 47,
  },
  {
    text: "Training Coordinator",
    jobFunc: 2,
    value: 48,
  },
  {
    text: "Category Manager, HR",
    jobFunc: 2,
    value: 49,
  },
  {
    text: "Job Posting Specialist",
    jobFunc: 2,
    value: 50,
  },
  {
    text: "Administrative Assistant",
    jobFunc: 3,
    value: 51,
  },
  {
    text: "Administrative Coordinator",
    jobFunc: 3,
    value: 52,
  },
  {
    text: "Administrative Manager",
    jobFunc: 3,
    value: 53,
  },
  {
    text: "Data Entry",
    jobFunc: 3,
    value: 54,
  },
  {
    text: "Office Manager",
    jobFunc: 3,
    value: 55,
  },
  {
    text: "Receptionist",
    jobFunc: 3,
    value: 56,
  },
  {
    text: "Executive Assistant",
    jobFunc: 3,
    value: 57,
  },
  {
    text: "Office Assistant",
    jobFunc: 3,
    value: 58,
  },
  {
    text: "Senior Support Assistant",
    jobFunc: 3,
    value: 59,
  },
  {
    text: "Account Manager",
    jobFunc: 4,
    value: 60,
  },
  {
    text: "Advertising Sales Representative",
    jobFunc: 4,
    value: 61,
  },
  {
    text: "Area Sales Manager",
    jobFunc: 4,
    value: 62,
  },
  {
    text: "B2B Corporate Sales",
    jobFunc: 4,
    value: 63,
  },
  {
    text: "Distribution Sales Representative",
    jobFunc: 4,
    value: 64,
  },
  {
    text: "Enterprise Sales Representative",
    jobFunc: 4,
    value: 65,
  },
  {
    text: "Retail Store Manager",
    jobFunc: 4,
    value: 66,
  },
  {
    text: "Insurance Sales Representative",
    jobFunc: 4,
    value: 67,
  },
  {
    text: "Sales Operation Coordinator",
    jobFunc: 4,
    value: 68,
  },
  {
    text: "Sales Trainee",
    jobFunc: 4,
    value: 69,
  },
  {
    text: "Advertising Campaign Manager",
    jobFunc: 5,
    value: 70,
  },
  {
    text: "Creative Director",
    jobFunc: 5,
    value: 71,
  },
  {
    text: "Digital Media Planner",
    jobFunc: 5,
    value: 72,
  },
  {
    text: "Media Research Analyst",
    jobFunc: 5,
    value: 73,
  },
  {
    text: "Target Marketing Strategist",
    jobFunc: 5,
    value: 74,
  },
  {
    text: "Brand Manager",
    jobFunc: 5,
    value: 75,
  },
  {
    text: "Marketing Director",
    jobFunc: 5,
    value: 76,
  },
  {
    text: "Marcomm Supervisor",
    jobFunc: 5,
    value: 77,
  },
  {
    text: "Internet Marketing Coordinator",
    jobFunc: 5,
    value: 78,
  },
  {
    text: "Digital Brand Manager",
    jobFunc: 5,
    value: 79,
  },
  {
    text: "Accounting Clerk",
    jobFunc: 6,
    value: 80,
  },
  {
    text: "Accounting Manager",
    jobFunc: 6,
    value: 81,
  },
  {
    text: "Audit Supervisor",
    jobFunc: 6,
    value: 82,
  },
  {
    text: "Budget Analyst",
    jobFunc: 6,
    value: 83,
  },
  {
    text: "Chief Financial Officer",
    jobFunc: 6,
    value: 84,
  },
  {
    text: "Controller",
    jobFunc: 6,
    value: 85,
  },
  {
    text: "Tax Specialist",
    jobFunc: 6,
    value: 86,
  },
  {
    text: "Collector",
    jobFunc: 6,
    value: 87,
  },
  {
    text: "Contracts and Financial Compliance Manager",
    jobFunc: 6,
    value: 88,
  },
  {
    text: "Cost Accountant",
    jobFunc: 6,
    value: 89,
  },
  {
    text: "Graphic Designer",
    jobFunc: 8,
    value: 90,
  },
  {
    text: "Senior Web Designer",
    jobFunc: 8,
    value: 91,
  },
  {
    text: "UI Graphic Designer",
    jobFunc: 8,
    value: 92,
  },
  {
    text: "UX Graphic Designer",
    jobFunc: 8,
    value: 93,
  },
  {
    text: "Game Designer",
    jobFunc: 8,
    value: 94,
  },
  {
    text: "Mobile App UX Designer",
    jobFunc: 8,
    value: 95,
  },
  {
    text: "2D or 3D animator",
    jobFunc: 8,
    value: 96,
  },
  {
    text: "Visual Designer",
    jobFunc: 8,
    value: 97,
  },
  {
    text: "CX Interaction Designer",
    jobFunc: 8,
    value: 98,
  },
  {
    text: "Junior Creative Designer",
    jobFunc: 8,
    value: 99,
  },
  {
    text: "Web Content Editor",
    jobFunc: 17,
    value: 100,
  },
  {
    text: "Typewriter",
    jobFunc: 17,
    value: 101,
  },
  {
    text: "Technical Writer",
    jobFunc: 17,
    value: 102,
  },
  {
    text: "Data Entry",
    jobFunc: 17,
    value: 103,
  },
  {
    text: "Content Specialist",
    jobFunc: 17,
    value: 104,
  },
  {
    text: "Web Content Creator",
    jobFunc: 17,
    value: 105,
  },
  {
    text: "Translator",
    jobFunc: 17,
    value: 106,
  },
  {
    text: "Interpreter",
    jobFunc: 17,
    value: 107,
  },
  {
    text: "Assistant News Editor",
    jobFunc: 17,
    value: 108,
  },
  {
    text: "Copy Writer",
    jobFunc: 17,
    value: 109,
  },
  {
    text: "Application Developer",
    jobFunc: 18,
    value: 110,
  },
  {
    text: "Chief Technology Officer",
    jobFunc: 18,
    value: 111,
  },
  {
    text: "Computer Systems Manager",
    jobFunc: 18,
    value: 112,
  },
  {
    text: "Data Center Support Specialist",
    jobFunc: 18,
    value: 113,
  },
  {
    text: "Database Administrator",
    jobFunc: 18,
    value: 114,
  },
  {
    text: "Help Desk Specialist",
    jobFunc: 18,
    value: 115,
  },
  {
    text: "IT Systems Administrator",
    jobFunc: 18,
    value: 116,
  },
  {
    text: "Senior Network Engineer",
    jobFunc: 18,
    value: 117,
  },
  {
    text: "Network Systems Administrator",
    jobFunc: 18,
    value: 118,
  },
  {
    text: "Network Architect",
    jobFunc: 18,
    value: 119,
  },
  {
    text: "Conciliator",
    jobFunc: 7,
    value: 120,
  },
  {
    text: "Consultant",
    jobFunc: 7,
    value: 121,
  },
  {
    text: "Contract Drafting Legal Specialist",
    jobFunc: 7,
    value: 122,
  },
  {
    text: "Lawyer",
    jobFunc: 7,
    value: 123,
  },
  {
    text: "Legal Analyst",
    jobFunc: 7,
    value: 124,
  },
  {
    text: "Law Firm Administrator",
    jobFunc: 7,
    value: 125,
  },
  {
    text: "Legal Specialist",
    jobFunc: 7,
    value: 126,
  },
  {
    text: "Court Reporter",
    jobFunc: 7,
    value: 127,
  },
  {
    text: "Court Advocate",
    jobFunc: 7,
    value: 128,
  },
  {
    text: "Legal Secretary",
    jobFunc: 7,
    value: 129,
  },
  {
    text: "Training Consultant",
    jobFunc: 9,
    value: 130,
  },
  {
    text: "Learning Analyst",
    jobFunc: 9,
    value: 131,
  },
  {
    text: "Life Coach",
    jobFunc: 9,
    value: 132,
  },
  {
    text: "Trainer",
    jobFunc: 9,
    value: 133,
  },
  {
    text: "Learning Officer",
    jobFunc: 9,
    value: 134,
  },
  {
    text: "Learning and Development Facilitator",
    jobFunc: 9,
    value: 135,
  },
  {
    text: "Performance Strategist",
    jobFunc: 9,
    value: 136,
  },
  {
    text: "Training Advisor",
    jobFunc: 9,
    value: 137,
  },
  {
    text: "Instructional Designer",
    jobFunc: 9,
    value: 138,
  },
  {
    text: "Learning Developer",
    jobFunc: 9,
    value: 139,
  },
  {
    text: "Admissions Assistant",
    jobFunc: 10,
    value: 140,
  },
  {
    text: "Teacher",
    jobFunc: 10,
    value: 141,
  },
  {
    text: "Advisor",
    jobFunc: 10,
    value: 142,
  },
  {
    text: "Assistant Instructor",
    jobFunc: 10,
    value: 143,
  },
  {
    text: "Academic Support Coordinator",
    jobFunc: 10,
    value: 144,
  },
  {
    text: "Assistant Professor",
    jobFunc: 10,
    value: 145,
  },
  {
    text: "Education Specialist",
    jobFunc: 10,
    value: 146,
  },
  {
    text: "Preschool Teacher",
    jobFunc: 10,
    value: 147,
  },
  {
    text: "Adjunct Professor",
    jobFunc: 10,
    value: 148,
  },
  {
    text: "Lecturer",
    jobFunc: 10,
    value: 149,
  },
  {
    text: "Construction Engineer",
    jobFunc: 12,
    value: 150,
  },
  {
    text: "Civil Engineer",
    jobFunc: 12,
    value: 151,
  },
  {
    text: "Procurement Engineer",
    jobFunc: 12,
    value: 152,
  },
  {
    text: "Construction Technician",
    jobFunc: 12,
    value: 153,
  },
  {
    text: "Structural Investigator",
    jobFunc: 12,
    value: 154,
  },
  {
    text: "Testing Technician",
    jobFunc: 12,
    value: 155,
  },
  {
    text: "Civil Engineering Designer",
    jobFunc: 12,
    value: 156,
  },
  {
    text: "Architect Consultant",
    jobFunc: 12,
    value: 157,
  },
  {
    text: "Materials testing technologist",
    jobFunc: 12,
    value: 158,
  },
  {
    text: "Solid waste disposal technician",
    jobFunc: 12,
    value: 159,
  },
  {
    text: "Art Director",
    jobFunc: 8,
    value: 160,
  },
  {
    text: "Associate Producer",
    jobFunc: 13,
    value: 161,
  },
  {
    text: "Audio and Video Equipment Technician",
    jobFunc: 13,
    value: 162,
  },
  {
    text: "Broadcast News Analyst",
    jobFunc: 13,
    value: 163,
  },
  {
    text: "Executive Producer",
    jobFunc: 13,
    value: 164,
  },
  {
    text: "Film/Video Editor",
    jobFunc: 13,
    value: 165,
  },
  {
    text: "Photographer",
    jobFunc: 13,
    value: 166,
  },
  {
    text: "Social Media Specialist",
    jobFunc: 13,
    value: 167,
  },
  {
    text: "Sound Mixer",
    jobFunc: 13,
    value: 168,
  },
  {
    text: "Mechanical Engineer",
    jobFunc: 14,
    value: 169,
  },
  {
    text: "Lead Industrial Engineer",
    jobFunc: 14,
    value: 170,
  },
  {
    text: "Quality Engineer",
    jobFunc: 14,
    value: 171,
  },
  {
    text: "Maintenance Technician",
    jobFunc: 14,
    value: 172,
  },
  {
    text: "Mechanical Desinger",
    jobFunc: 14,
    value: 173,
  },
  {
    text: "Production Stress Engineer",
    jobFunc: 14,
    value: 174,
  },
  {
    text: "Facilities Engineer",
    jobFunc: 14,
    value: 175,
  },
  {
    text: "Control Engineer",
    jobFunc: 14,
    value: 176,
  },
  {
    text: "Product Engineer",
    jobFunc: 14,
    value: 177,
  },
  {
    text: "Equipment Engineer",
    jobFunc: 14,
    value: 178,
  },
  {
    text: "Production Engineer Oil&Gas",
    jobFunc: 15,
    value: 179,
  },
  {
    text: "Petroleum Engineer",
    jobFunc: 15,
    value: 180,
  },
  {
    text: "Drilling&Workover Engineer",
    jobFunc: 15,
    value: 181,
  },
  {
    text: "Geomechanics Pet.Eng.",
    jobFunc: 15,
    value: 182,
  },
  {
    text: "Reservoir Engineer",
    jobFunc: 15,
    value: 183,
  },
  {
    text: "Geophysicist Petroleum Engineering",
    jobFunc: 15,
    value: 184,
  },
  {
    text: "Chemical Engineering",
    jobFunc: 15,
    value: 185,
  },
  {
    text: "Process Engineer",
    jobFunc: 15,
    value: 186,
  },
  {
    text: "Midstream Pipeline Field Engineer",
    jobFunc: 15,
    value: 187,
  },
  {
    text: "Application Engineer (oil & gas pumping and compression)",
    jobFunc: 15,
    value: 188,
  },
  {
    text: "Geologist or Environmental Scientist",
    jobFunc: 15,
    value: 189,
  },
  {
    text: "Electrical Engineer",
    jobFunc: 16,
    value: 190,
  },
  {
    text: "Antenna Engineer",
    jobFunc: 16,
    value: 191,
  },
  {
    text: "Analogue amplifier design engineer",
    jobFunc: 16,
    value: 192,
  },
  {
    text: "Distribution planning engineer, electrical",
    jobFunc: 16,
    value: 193,
  },
  {
    text: "Electrical Research Engineer",
    jobFunc: 16,
    value: 194,
  },
  {
    text: "Electrical network engineer",
    jobFunc: 16,
    value: 195,
  },
  {
    text: "Technical services electrical engineer",
    jobFunc: 16,
    value: 196,
  },
  {
    text: "Signal Engineer",
    jobFunc: 16,
    value: 197,
  },
  {
    text: "Low voltage equipment engineer",
    jobFunc: 16,
    value: 198,
  },
  {
    text: "Electrical energy transmission planning engineer",
    jobFunc: 16,
    value: 199,
  },
  {
    text: "Satellite instrumentation engineer",
    jobFunc: 16,
    value: 200,
  },
  {
    text: "Capacity planner, network",
    jobFunc: 21,
    value: 201,
  },
  {
    text: "Computer systems engineer",
    jobFunc: 21,
    value: 202,
  },
  {
    text: "Optical communications hardware Engineer",
    jobFunc: 21,
    value: 203,
  },
  {
    text: "Technical architect - hardware",
    jobFunc: 21,
    value: 204,
  },
  {
    text: "Hardware Design Engineer",
    jobFunc: 21,
    value: 205,
  },
  {
    text: "Hardware Development Engineer",
    jobFunc: 21,
    value: 206,
  },
  {
    text: "Microprocessor designer and application engineer",
    jobFunc: 21,
    value: 207,
  },
  {
    text: "IT Specialist",
    jobFunc: 21,
    value: 208,
  },
  {
    text: "Linux Enterprise Support Engineer",
    jobFunc: 21,
    value: 209,
  },
  {
    text: "PC Technician",
    jobFunc: 21,
    value: 210,
  },
  {
    text: "Fashion Designer",
    jobFunc: 22,
    value: 211,
  },
  {
    text: "Merchandiser",
    jobFunc: 22,
    value: 212,
  },
  {
    text: "Pattern Maker",
    jobFunc: 22,
    value: 213,
  },
  {
    text: "Technical Designer",
    jobFunc: 22,
    value: 214,
  },
  {
    text: "Cutters",
    jobFunc: 22,
    value: 215,
  },
  {
    text: "Apparel workers",
    jobFunc: 22,
    value: 216,
  },
  {
    text: "Photographers - Fashion & Glamour",
    jobFunc: 22,
    value: 217,
  },
  {
    text: "Shoe and leather workers",
    jobFunc: 22,
    value: 218,
  },
  {
    text: "Textile Specialist",
    jobFunc: 22,
    value: 219,
  },
  {
    text: "Editorial Stylist",
    jobFunc: 22,
    value: 220,
  },
  {
    text: "Activity Assistant",
    jobFunc: 23,
    value: 221,
  },
  {
    text: "Behavior Technician",
    jobFunc: 23,
    value: 222,
  },
  {
    text: "In Home Support",
    jobFunc: 23,
    value: 223,
  },
  {
    text: "Recreational Service Assistant",
    jobFunc: 23,
    value: 224,
  },
  {
    text: "Youth Service Coordinator",
    jobFunc: 23,
    value: 225,
  },
  {
    text: "Correctional Officer",
    jobFunc: 23,
    value: 226,
  },
  {
    text: "Assistant Superintendent",
    jobFunc: 23,
    value: 227,
  },
  {
    text: "Job Coach",
    jobFunc: 23,
    value: 228,
  },
  {
    text: "Urban Design Planner",
    jobFunc: 23,
    value: 229,
  },
  {
    text: "Environmental and Natural Resource Planner",
    jobFunc: 23,
    value: 230,
  },
  {
    text: "Academic Counselor",
    jobFunc: 24,
    value: 231,
  },
  {
    text: "Animal Researcher",
    jobFunc: 24,
    value: 232,
  },
  {
    text: "Animal Trainer",
    jobFunc: 24,
    value: 233,
  },
  {
    text: "Child Psychologist",
    jobFunc: 24,
    value: 234,
  },
  {
    text: "Correctional Treatment Specialist",
    jobFunc: 24,
    value: 235,
  },
  {
    text: "Crisis Counselor",
    jobFunc: 24,
    value: 236,
  },
  {
    text: "Family and Marriage Therapist",
    jobFunc: 24,
    value: 237,
  },
  {
    text: "Vocational Rehabilitation Counselor",
    jobFunc: 24,
    value: 238,
  },
  {
    text: "Art Therapist",
    jobFunc: 24,
    value: 239,
  },
  {
    text: "Case Worker",
    jobFunc: 24,
    value: 240,
  },
  {
    text: "Labour market information analyst",
    jobFunc: 25,
    value: 241,
  },
  {
    text: "Economists",
    jobFunc: 25,
    value: 242,
  },
  {
    text: "Budget Analyst",
    jobFunc: 25,
    value: 243,
  },
  {
    text: "Credit Analyst",
    jobFunc: 25,
    value: 244,
  },
  {
    text: "Risk Analyst",
    jobFunc: 25,
    value: 245,
  },
  {
    text: "Tax Examiner",
    jobFunc: 25,
    value: 246,
  },
  {
    text: "Market Surveyor",
    jobFunc: 25,
    value: 247,
  },
  {
    text: "Stockbroker",
    jobFunc: 25,
    value: 248,
  },
  {
    text: "Mathematical Economist",
    jobFunc: 25,
    value: 249,
  },
  {
    text: "Investment Economist",
    jobFunc: 25,
    value: 250,
  },
  {
    text: "Deejay",
    jobFunc: 26,
    value: 251,
  },
  {
    text: "Audio Engineer",
    jobFunc: 26,
    value: 252,
  },
  {
    text: "Assistant Sound Editor",
    jobFunc: 26,
    value: 253,
  },
  {
    text: "Sound Effects Specialist",
    jobFunc: 26,
    value: 254,
  },
  {
    text: "Sound Recordist",
    jobFunc: 26,
    value: 255,
  },
  {
    text: "Recording Studio Technician",
    jobFunc: 26,
    value: 256,
  },
  {
    text: "Studio Manager",
    jobFunc: 26,
    value: 257,
  },
  {
    text: "Acoustic Consultant",
    jobFunc: 26,
    value: 258,
  },
  {
    text: "Playback Operator",
    jobFunc: 26,
    value: 259,
  },
  {
    text: "Re-recording Mixer",
    jobFunc: 26,
    value: 260,
  },
  {
    text: "Community Pharmacist",
    jobFunc: 27,
    value: 261,
  },
  {
    text: "Clinical Pharmacist",
    jobFunc: 27,
    value: 262,
  },
  {
    text: "Druggist",
    jobFunc: 27,
    value: 263,
  },
  {
    text: "Pharmacist Consultant",
    jobFunc: 27,
    value: 264,
  },
  {
    text: "Hospital Pharmacist",
    jobFunc: 27,
    value: 265,
  },
  {
    text: "Industrial Pharmacist",
    jobFunc: 27,
    value: 266,
  },
  {
    text: "Pharmacist Assistant",
    jobFunc: 27,
    value: 267,
  },
  {
    text: "Health care institution pharmacist",
    jobFunc: 27,
    value: 268,
  },
  {
    text: "Dispensary department supervisor",
    jobFunc: 27,
    value: 269,
  },
  {
    text: "Registered Pharmacist",
    jobFunc: 27,
    value: 270,
  },
  {
    text: "Senior System Integration Engineer",
    jobFunc: 1,
    value: 271,
  },
  {
    text: "Business System Analyst",
    jobFunc: 1,
    value: 272,
  },
  {
    text: "CRM Business Analyst",
    jobFunc: 1,
    value: 273,
  },
  {
    text: "Solution Architect",
    jobFunc: 1,
    value: 274,
  },
  {
    text: "Pre-Sales Engineer",
    jobFunc: 1,
    value: 275,
  },
  {
    text: "CRM Technical Developer",
    jobFunc: 1,
    value: 276,
  },
  {
    text: "Programmer Analyst",
    jobFunc: 1,
    value: 277,
  },
  {
    text: "ERP Functional Analyst",
    jobFunc: 1,
    value: 278,
  },
  {
    text: "Database Administrator",
    jobFunc: 1,
    value: 279,
  },
  {
    text: "Project Manager",
    jobFunc: 1,
    value: 280,
  },
  {
    text: "Call Center Agent",
    jobFunc: 4,
    value: 281,
  },
  {
    text: "Call Center Operator",
    jobFunc: 4,
    value: 282,
  },
  {
    text: "Customer Service Representative",
    jobFunc: 4,
    value: 283,
  },
  {
    text: "Inside Sales Representative",
    jobFunc: 4,
    value: 284,
  },
  {
    text: "Telemarketer",
    jobFunc: 4,
    value: 285,
  },
  {
    text: "Telemarketing Sales Representative",
    jobFunc: 4,
    value: 286,
  },
  {
    text: "Telemarketing Representative",
    jobFunc: 4,
    value: 287,
  },
  {
    text: "Telephone Sales Representative",
    jobFunc: 4,
    value: 288,
  },
  {
    text: "Telesales Specialist",
    jobFunc: 4,
    value: 289,
  },
  {
    text: "Marketing & Promotional Manager",
    jobFunc: 5,
    value: 290,
  },
  {
    text: "Advertising Account Manager",
    jobFunc: 5,
    value: 291,
  },
  {
    text: "Engagement Coordinator",
    jobFunc: 5,
    value: 292,
  },
  {
    text: "Advertising Specialist",
    jobFunc: 5,
    value: 293,
  },
  {
    text: "Engagement Manager",
    jobFunc: 5,
    value: 294,
  },
  {
    text: "Advertising Associate Editor",
    jobFunc: 5,
    value: 295,
  },
  {
    text: "Interactive Media Manager",
    jobFunc: 5,
    value: 296,
  },
  {
    text: "Multi Media Communications Consultant",
    jobFunc: 5,
    value: 297,
  },
  {
    text: "Advertising Buyer",
    jobFunc: 5,
    value: 298,
  },
  {
    text: "Community Manager",
    jobFunc: 5,
    value: 299,
  },
  {
    text: "Online Content Coordinator",
    jobFunc: 5,
    value: 300,
  },
  {
    text: "Advertising Junior Copywriter",
    jobFunc: 5,
    value: 301,
  },
  {
    text: "Internet Marketing Manager",
    jobFunc: 5,
    value: 302,
  },
  {
    text: "Agency Account Coordinator",
    jobFunc: 5,
    value: 303,
  },
  {
    text: "Interactive Media Coordinator",
    jobFunc: 5,
    value: 304,
  },
  {
    text: "Interactive Media Associate",
    jobFunc: 5,
    value: 305,
  },
  {
    text: "Blogger",
    jobFunc: 5,
    value: 306,
  },
  {
    text: "Content Manager",
    jobFunc: 5,
    value: 307,
  },
  {
    text: "Communications planner",
    jobFunc: 5,
    value: 308,
  },
  {
    text: "Traffic Manager",
    jobFunc: 5,
    value: 309,
  },
  {
    text: "Advertising Marketing Associates",
    jobFunc: 5,
    value: 310,
  },
  {
    text: "Social Media Account Executive",
    jobFunc: 5,
    value: 311,
  },
  {
    text: "Advertising Coordinator",
    jobFunc: 5,
    value: 312,
  },
  {
    text: "Preprint Analyst",
    jobFunc: 5,
    value: 313,
  },
  {
    text: "Advertising Assistant",
    jobFunc: 5,
    value: 314,
  },
  {
    text: "Social Media Analyst",
    jobFunc: 5,
    value: 315,
  },
  {
    text: "Advertising Sales Representative",
    jobFunc: 5,
    value: 316,
  },
  {
    text: "Assistant Media Planner",
    jobFunc: 5,
    value: 317,
  },
  {
    text: "Client Strategist",
    jobFunc: 5,
    value: 318,
  },
  {
    text: "Target Marketing Strategist II",
    jobFunc: 5,
    value: 319,
  },
  {
    text: "Associate Communications planner",
    jobFunc: 5,
    value: 320,
  },
  {
    text: "Trainee",
    jobFunc: 5,
    value: 321,
  },
  {
    text: "Chief Graphic Technology Officer",
    jobFunc: 8,
    value: 322,
  },
  {
    text: "Graphic Art Managers",
    jobFunc: 8,
    value: 323,
  },
  {
    text: "Creative Director",
    jobFunc: 8,
    value: 324,
  },
  {
    text: "Senior Art Director",
    jobFunc: 8,
    value: 325,
  },
  {
    text: "Art Production Manager",
    jobFunc: 8,
    value: 326,
  },
  {
    text: "Hands on Graphic Designer",
    jobFunc: 8,
    value: 327,
  },
  {
    text: "Brand Identity Developer",
    jobFunc: 8,
    value: 328,
  },
  {
    text: "Print Production manager",
    jobFunc: 8,
    value: 329,
  },
  {
    text: "Assistant Art Director",
    jobFunc: 8,
    value: 330,
  },
  {
    text: "Assistant Art Production Associate",
    jobFunc: 8,
    value: 331,
  },
  {
    text: "Broadcast Designer",
    jobFunc: 8,
    value: 332,
  },
  {
    text: "Logo Designer",
    jobFunc: 8,
    value: 333,
  },
  {
    text: "Senior Illustrator Manager",
    jobFunc: 8,
    value: 334,
  },
  {
    text: "Associate Broadcast Designer",
    jobFunc: 8,
    value: 335,
  },
  {
    text: "Senior Multimedia Developer",
    jobFunc: 8,
    value: 336,
  },
  {
    text: "Head of Photography Department",
    jobFunc: 8,
    value: 337,
  },
  {
    text: "Visual Image Developer",
    jobFunc: 8,
    value: 338,
  },
  {
    text: "Head Content Developer",
    jobFunc: 8,
    value: 339,
  },
  {
    text: "Illustrator Assistant Manager",
    jobFunc: 8,
    value: 340,
  },
  {
    text: "Visual Journalist",
    jobFunc: 8,
    value: 341,
  },
  {
    text: "Senior Layout Artist",
    jobFunc: 8,
    value: 342,
  },
  {
    text: "Interface Designer",
    jobFunc: 8,
    value: 343,
  },
  {
    text: "Layout Designer",
    jobFunc: 8,
    value: 344,
  },
  {
    text: "Head Web Designer / Developer",
    jobFunc: 8,
    value: 345,
  },
  {
    text: "Associate Web Designer",
    jobFunc: 8,
    value: 346,
  },
  {
    text: "Associate Content Developer",
    jobFunc: 8,
    value: 347,
  },
  {
    text: "Graphic Design Analyst",
    jobFunc: 8,
    value: 348,
  },
  {
    text: "Graphic Package Designer",
    jobFunc: 8,
    value: 349,
  },
  {
    text: "Photographer",
    jobFunc: 8,
    value: 350,
  },
  {
    text: "Junior Multimedia Developer",
    jobFunc: 8,
    value: 351,
  },
  {
    text: "Graphic Design Associate",
    jobFunc: 8,
    value: 352,
  },
  {
    text: "Graphic Design Trainee",
    jobFunc: 8,
    value: 353,
  },
  {
    text: "Chief Sales Executive",
    jobFunc: 4,
    value: 354,
  },
  {
    text: "National Sales Manager",
    jobFunc: 4,
    value: 355,
  },
  {
    text: "Sales Vice President",
    jobFunc: 4,
    value: 356,
  },
  {
    text: "General Manager – Sales",
    jobFunc: 4,
    value: 357,
  },
  {
    text: "Regional Sales Manager",
    jobFunc: 4,
    value: 358,
  },
  {
    text: "National Sales coordinator and Distributor",
    jobFunc: 4,
    value: 359,
  },
  {
    text: "Senior Sales Accountant",
    jobFunc: 4,
    value: 360,
  },
  {
    text: "Senior Sales Manager",
    jobFunc: 4,
    value: 361,
  },
  {
    text: "Sales Administrator",
    jobFunc: 4,
    value: 362,
  },
  {
    text: "Sales Branch Manager",
    jobFunc: 4,
    value: 363,
  },
  {
    text: "Assistant Sales Branch Manager",
    jobFunc: 4,
    value: 364,
  },
  {
    text: "Sales Specialist I",
    jobFunc: 4,
    value: 365,
  },
  {
    text: "Market Research Analyst",
    jobFunc: 4,
    value: 366,
  },
  {
    text: "Lead Development Officer",
    jobFunc: 4,
    value: 367,
  },
  {
    text: "Inside Sales Consultant",
    jobFunc: 4,
    value: 368,
  },
  {
    text: "Sales Coordinator",
    jobFunc: 4,
    value: 369,
  },
  {
    text: "Junior Sales Consultant",
    jobFunc: 4,
    value: 370,
  },
  {
    text: "Team Leader",
    jobFunc: 4,
    value: 371,
  },
  {
    text: "Senior Sales Analyst",
    jobFunc: 4,
    value: 372,
  },
  {
    text: "Quality Analyst",
    jobFunc: 4,
    value: 373,
  },
  {
    text: "Sales Person",
    jobFunc: 4,
    value: 374,
  },
  {
    text: "CTO or Chief Technical Officer",
    jobFunc: 1,
    value: 375,
  },
  {
    text: "Configuration Manager/Administrator",
    jobFunc: 1,
    value: 376,
  },
  {
    text: "Project engineer",
    jobFunc: 1,
    value: 377,
  },
  {
    text: "Senior Software Engineer/Developer",
    jobFunc: 1,
    value: 378,
  },
  {
    text: "Manager, Technical Recruitment",
    jobFunc: 1,
    value: 379,
  },
  {
    text: "Testing manager",
    jobFunc: 1,
    value: 380,
  },
  {
    text: "Software Engineer",
    jobFunc: 1,
    value: 381,
  },
  {
    text: "Process Analyst",
    jobFunc: 1,
    value: 382,
  },
  {
    text: "Implementation Manager",
    jobFunc: 1,
    value: 383,
  },
  {
    text: "Application Engineer",
    jobFunc: 1,
    value: 384,
  },
  {
    text: "Assistant System Admin",
    jobFunc: 1,
    value: 385,
  },
  {
    text: "Configuration Executive",
    jobFunc: 1,
    value: 386,
  },
  {
    text: "Software Associate/Trainee",
    jobFunc: 1,
    value: 387,
  },
  {
    text: "C++ engineer",
    jobFunc: 1,
    value: 388,
  },
  {
    text: "Assistant Quality Analyst",
    jobFunc: 1,
    value: 389,
  },
  {
    text: "Accounts Director",
    jobFunc: 6,
    value: 390,
  },
  {
    text: "Chief Finance Officer",
    jobFunc: 6,
    value: 391,
  },
  {
    text: "Accounts Vice President",
    jobFunc: 6,
    value: 392,
  },
  {
    text: "Senior Accounts Manager",
    jobFunc: 6,
    value: 393,
  },
  {
    text: "Senior Accounts Administrator",
    jobFunc: 6,
    value: 394,
  },
  {
    text: "Director of Cash Management",
    jobFunc: 6,
    value: 395,
  },
  {
    text: "Accounting Analyst I",
    jobFunc: 6,
    value: 396,
  },
  {
    text: "Senior Accounts Receivable Manager",
    jobFunc: 6,
    value: 397,
  },
  {
    text: "Senior Accounts Payable Manager",
    jobFunc: 6,
    value: 398,
  },
  {
    text: "Assistant Accounts Manager",
    jobFunc: 6,
    value: 399,
  },
  {
    text: "Accounting Analyst II",
    jobFunc: 6,
    value: 400,
  },
  {
    text: "Senior Accountant",
    jobFunc: 6,
    value: 401,
  },
  {
    text: "Revenue Cycle Administrator",
    jobFunc: 6,
    value: 402,
  },
  {
    text: "Revenue Cycle Executive",
    jobFunc: 6,
    value: 403,
  },
  {
    text: "Tax Accountant",
    jobFunc: 6,
    value: 404,
  },
  {
    text: "Strategic Program Analyst",
    jobFunc: 6,
    value: 405,
  },
  {
    text: "Audit",
    jobFunc: 6,
    value: 406,
  },
  {
    text: "Strategic Accounting Analysis",
    jobFunc: 6,
    value: 407,
  },
  {
    text: "Senior Chartered Accountant",
    jobFunc: 6,
    value: 408,
  },
  {
    text: "Budget Manager",
    jobFunc: 6,
    value: 409,
  },
  {
    text: "Senior Accounts Analyst",
    jobFunc: 6,
    value: 410,
  },
  {
    text: "Accounts Assistant",
    jobFunc: 6,
    value: 411,
  },
  {
    text: "Accounts Trainee",
    jobFunc: 6,
    value: 412,
  },
  {
    text: "Software Architect",
    jobFunc: 1,
    value: 413,
  },
  {
    text: "Software Programmer",
    jobFunc: 1,
    value: 414,
  },
  {
    text: "Software Analyst",
    jobFunc: 1,
    value: 415,
  },
  {
    text: "Trainee Engineer",
    jobFunc: 1,
    value: 416,
  },
  {
    text: "HR Director",
    jobFunc: 2,
    value: 417,
  },
  {
    text: "HR Generalist",
    jobFunc: 2,
    value: 418,
  },
  {
    text: "Deputy Director legal and payroll",
    jobFunc: 2,
    value: 419,
  },
  {
    text: "Senior  Executive HR",
    jobFunc: 2,
    value: 420,
  },
  {
    text: "Personal Manager Welfare and Benefit",
    jobFunc: 2,
    value: 421,
  },
  {
    text: "HR Administrator",
    jobFunc: 2,
    value: 422,
  },
  {
    text: "Training & Development Manager",
    jobFunc: 2,
    value: 423,
  },
  {
    text: "Human Resource Safety Manager",
    jobFunc: 2,
    value: 424,
  },
  {
    text: "HR Analyst",
    jobFunc: 2,
    value: 425,
  },
  {
    text: "HR Assistant",
    jobFunc: 2,
    value: 426,
  },
  {
    text: "HR Trainee",
    jobFunc: 2,
    value: 427,
  },
  {
    text: "Senior Administrative Coordinator",
    jobFunc: 3,
    value: 428,
  },
  {
    text: "Senior Administrative Analyst",
    jobFunc: 3,
    value: 429,
  },
  {
    text: "Senior Administrator",
    jobFunc: 3,
    value: 430,
  },
  {
    text: "Facility Manager",
    jobFunc: 3,
    value: 431,
  },
  {
    text: "Office Support Manager",
    jobFunc: 3,
    value: 432,
  },
  {
    text: "Mail Clerk",
    jobFunc: 3,
    value: 433,
  },
  {
    text: "Word Processor",
    jobFunc: 3,
    value: 434,
  },
  {
    text: "Typist",
    jobFunc: 3,
    value: 435,
  },
  {
    text: "Zonal Sales Manager",
    jobFunc: 4,
    value: 436,
  },
  {
    text: "Senior Sales Consultant",
    jobFunc: 4,
    value: 437,
  },
  {
    text: "Contract Lawyer",
    jobFunc: 7,
    value: 438,
  },
  {
    text: "Attorney",
    jobFunc: 7,
    value: 439,
  },
  {
    text: "Associate",
    jobFunc: 7,
    value: 440,
  },
  {
    text: "Law Clerk",
    jobFunc: 7,
    value: 441,
  },
  {
    text: "Paralegal",
    jobFunc: 7,
    value: 442,
  },
  {
    text: "Home-room Teacher",
    jobFunc: 10,
    value: 443,
  },
  {
    text: "Subject Teacher",
    jobFunc: 10,
    value: 444,
  },
  {
    text: "Administrator",
    jobFunc: 10,
    value: 445,
  },
  {
    text: "Dean of School",
    jobFunc: 10,
    value: 446,
  },
  {
    text: "Deputy Dean of the School",
    jobFunc: 10,
    value: 447,
  },
  {
    text: "Chief Engineering Officer",
    jobFunc: 12,
    value: 448,
  },
  {
    text: "Chief Technical Officer",
    jobFunc: 12,
    value: 449,
  },
  {
    text: "Senior Civil Engineer",
    jobFunc: 12,
    value: 450,
  },
  {
    text: "Senior Project Manager",
    jobFunc: 12,
    value: 451,
  },
  {
    text: "Senior Manager – Project Planning",
    jobFunc: 12,
    value: 452,
  },
  {
    text: "Project Administrator",
    jobFunc: 12,
    value: 453,
  },
  {
    text: "Design Engineer",
    jobFunc: 12,
    value: 454,
  },
  {
    text: "City Engineer",
    jobFunc: 12,
    value: 455,
  },
  {
    text: "Structural Engineer I",
    jobFunc: 12,
    value: 456,
  },
  {
    text: "Assistant Project Manager",
    jobFunc: 12,
    value: 457,
  },
  {
    text: "Associate Design Engineer",
    jobFunc: 12,
    value: 458,
  },
  {
    text: "Civil Engineering Manager",
    jobFunc: 12,
    value: 459,
  },
  {
    text: "Structural Engineer II",
    jobFunc: 12,
    value: 460,
  },
  {
    text: "Railroad Design Consultant",
    jobFunc: 12,
    value: 461,
  },
  {
    text: "Research Hydraulic Engineer",
    jobFunc: 12,
    value: 462,
  },
  {
    text: "Civil Engineer Technical Assistant",
    jobFunc: 12,
    value: 463,
  },
  {
    text: "Project Leader",
    jobFunc: 12,
    value: 464,
  },
  {
    text: "Help Desk Technician",
    jobFunc: 12,
    value: 465,
  },
  {
    text: "Database Administrator",
    jobFunc: 12,
    value: 466,
  },
  {
    text: "Civil Engineering Associate",
    jobFunc: 12,
    value: 467,
  },
  {
    text: "Analyst",
    jobFunc: 12,
    value: 468,
  },
  {
    text: "Assistant Civil Engineer",
    jobFunc: 12,
    value: 469,
  },
  {
    text: "Security Specialist",
    jobFunc: 12,
    value: 470,
  },
  {
    text: "Trainee",
    jobFunc: 12,
    value: 471,
  },
  {
    text: "Script writer",
    jobFunc: 13,
    value: 472,
  },
  {
    text: "Unit production manager",
    jobFunc: 13,
    value: 473,
  },
  {
    text: "Assistant director",
    jobFunc: 13,
    value: 474,
  },
  {
    text: "Casting director",
    jobFunc: 13,
    value: 475,
  },
  {
    text: "Location manager",
    jobFunc: 13,
    value: 476,
  },
  {
    text: "Director of photography",
    jobFunc: 13,
    value: 477,
  },
  {
    text: "Director of audiography",
    jobFunc: 13,
    value: 478,
  },
  {
    text: "Composer",
    jobFunc: 13,
    value: 479,
  },
  {
    text: "Production designer",
    jobFunc: 13,
    value: 480,
  },
  {
    text: "Costume designer",
    jobFunc: 13,
    value: 481,
  },
  {
    text: "Storyboard artist",
    jobFunc: 13,
    value: 482,
  },
  {
    text: "Choreographer",
    jobFunc: 13,
    value: 483,
  },
  {
    text: "Photo editor",
    jobFunc: 13,
    value: 484,
  },
  {
    text: "Sound editor",
    jobFunc: 13,
    value: 485,
  },
  {
    text: "Video/film  editor",
    jobFunc: 13,
    value: 486,
  },
  {
    text: "Distributor",
    jobFunc: 13,
    value: 487,
  },
  {
    text: "Box Office Manager",
    jobFunc: 13,
    value: 488,
  },
  {
    text: "Network Administrator",
    jobFunc: 18,
    value: 489,
  },
  {
    text: "Network Manager",
    jobFunc: 18,
    value: 490,
  },
  {
    text: "Network Programmer",
    jobFunc: 18,
    value: 491,
  },
  {
    text: "Network Technician",
    jobFunc: 18,
    value: 492,
  },
  {
    text: "Chief Technical Officer",
    jobFunc: 21,
    value: 493,
  },
  {
    text: "Chief Information Officer",
    jobFunc: 21,
    value: 494,
  },
  {
    text: "Information Technology Director",
    jobFunc: 21,
    value: 495,
  },
  {
    text: "Analyst",
    jobFunc: 21,
    value: 496,
  },
  {
    text: "Help Desk Technician",
    jobFunc: 21,
    value: 497,
  },
  {
    text: "Network Engineer",
    jobFunc: 21,
    value: 498,
  },
  {
    text: "Programmer",
    jobFunc: 21,
    value: 499,
  },
  {
    text: "Security Specialist",
    jobFunc: 21,
    value: 500,
  },
  {
    text: "System Administrator",
    jobFunc: 21,
    value: 501,
  },
  {
    text: "Technical Content Writer",
    jobFunc: 1,
    value: 502,
  },
  {
    text: "Web Master",
    jobFunc: 1,
    value: 503,
  },
  {
    text: "Software Testing Engineer",
    jobFunc: 1,
    value: 504,
  },
  {
    text: "Desktop Technician",
    jobFunc: 21,
    value: 505,
  },
  {
    text: "Creative Director",
    jobFunc: 22,
    value: 506,
  },
  {
    text: "Marketing & Promotional Manager",
    jobFunc: 22,
    value: 507,
  },
  {
    text: "Sales Director",
    jobFunc: 22,
    value: 508,
  },
  {
    text: "Advertising Director",
    jobFunc: 22,
    value: 509,
  },
  {
    text: "Marketing Director",
    jobFunc: 22,
    value: 510,
  },
  {
    text: "PR Manager",
    jobFunc: 22,
    value: 511,
  },
  {
    text: "Head of the Fashion Designer team",
    jobFunc: 22,
    value: 512,
  },
  {
    text: "Buying & Merchandising Director",
    jobFunc: 22,
    value: 513,
  },
  {
    text: "Production Artists",
    jobFunc: 22,
    value: 514,
  },
  {
    text: "Commercial Director",
    jobFunc: 22,
    value: 515,
  },
  {
    text: "Client Strategist",
    jobFunc: 22,
    value: 516,
  },
  {
    text: "Visual Merchandiser",
    jobFunc: 22,
    value: 517,
  },
  {
    text: "Senior Apparel Designer",
    jobFunc: 22,
    value: 518,
  },
  {
    text: "Fashion Stylist",
    jobFunc: 22,
    value: 519,
  },
  {
    text: "Studio Management",
    jobFunc: 22,
    value: 520,
  },
  {
    text: "Senior Photographer",
    jobFunc: 22,
    value: 521,
  },
  {
    text: "Surface Pattern Designer",
    jobFunc: 22,
    value: 522,
  },
  {
    text: "Communications Coordinator",
    jobFunc: 22,
    value: 523,
  },
  {
    text: "Assistant Fashion Designer",
    jobFunc: 22,
    value: 524,
  },
  {
    text: "Senior Accessory Designer",
    jobFunc: 22,
    value: 525,
  },
  {
    text: "Apparel Designer",
    jobFunc: 22,
    value: 526,
  },
  {
    text: "Art Director Fashion",
    jobFunc: 22,
    value: 527,
  },
  {
    text: "Colorist",
    jobFunc: 22,
    value: 528,
  },
  {
    text: "Costume Designer",
    jobFunc: 22,
    value: 529,
  },
  {
    text: "Footwear Stylist",
    jobFunc: 22,
    value: 530,
  },
  {
    text: "Store Manager",
    jobFunc: 22,
    value: 531,
  },
  {
    text: "Textile Designer",
    jobFunc: 22,
    value: 532,
  },
  {
    text: "Event Coordinator",
    jobFunc: 22,
    value: 533,
  },
  {
    text: "Sample Cutter",
    jobFunc: 22,
    value: 534,
  },
  {
    text: "Sample Room Manager",
    jobFunc: 22,
    value: 535,
  },
  {
    text: "Pharma Company Director",
    jobFunc: 27,
    value: 536,
  },
  {
    text: "Chief Pharma Company Executive",
    jobFunc: 27,
    value: 537,
  },
  {
    text: "Pharma Manager",
    jobFunc: 27,
    value: 538,
  },
  {
    text: "Pharma warehouse manager",
    jobFunc: 27,
    value: 539,
  },
  {
    text: "Pharma inventory manager",
    jobFunc: 27,
    value: 540,
  },
  {
    text: "Pharma finance executive",
    jobFunc: 27,
    value: 541,
  },
  {
    text: "Pharma transportation head",
    jobFunc: 27,
    value: 542,
  },
  {
    text: "Assistant Pharma manager",
    jobFunc: 27,
    value: 543,
  },
  {
    text: "Pharma legal expert",
    jobFunc: 27,
    value: 544,
  },
  {
    text: "Pharma PR representatives",
    jobFunc: 27,
    value: 545,
  },
  {
    text: "Pharma administrator",
    jobFunc: 27,
    value: 546,
  },
  {
    text: "Pharma company executive",
    jobFunc: 27,
    value: 547,
  },
  {
    text: "Pharma sales person",
    jobFunc: 27,
    value: 548,
  },
  {
    text: "Pharma clerk",
    jobFunc: 27,
    value: 549,
  },
  {
    text: "Pharma technician",
    jobFunc: 27,
    value: 550,
  },
  {
    text: "Chairman/CEO",
    jobFunc: 28,
    value: 551,
  },
  {
    text: "Project Director",
    jobFunc: 28,
    value: 552,
  },
  {
    text: "Head, Finance",
    jobFunc: 28,
    value: 553,
  },
  {
    text: "Market Analyst",
    jobFunc: 28,
    value: 554,
  },
  {
    text: "Sales Manager",
    jobFunc: 28,
    value: 555,
  },
  {
    text: "Manager, Admin",
    jobFunc: 28,
    value: 556,
  },
  {
    text: "Warehouse In-Charge",
    jobFunc: 28,
    value: 557,
  },
  {
    text: "Transport Manager",
    jobFunc: 28,
    value: 558,
  },
  {
    text: "Logistics Executive",
    jobFunc: 28,
    value: 559,
  },
  {
    text: "Material Handling Executive",
    jobFunc: 28,
    value: 560,
  },
  {
    text: "Associate, Tech Support",
    jobFunc: 28,
    value: 561,
  },
  {
    text: "Branch manager",
    jobFunc: 29,
    value: 562,
  },
  {
    text: "Auto Remarketing Manager",
    jobFunc: 29,
    value: 563,
  },
  {
    text: "Business Development Manager",
    jobFunc: 4,
    value: 564,
  },
  {
    text: "Card Operations Manager",
    jobFunc: 29,
    value: 565,
  },
  {
    text: "Commercial Lending Director",
    jobFunc: 29,
    value: 566,
  },
  {
    text: "Financial Planning Director",
    jobFunc: 29,
    value: 567,
  },
  {
    text: "Assistant Branch Manager",
    jobFunc: 29,
    value: 568,
  },
  {
    text: "ATM Specialist",
    jobFunc: 29,
    value: 569,
  },
  {
    text: "Auto Remarketing Specialist",
    jobFunc: 29,
    value: 570,
  },
  {
    text: "Card Operations Specialist",
    jobFunc: 29,
    value: 571,
  },
  {
    text: "Commercial Credit Analyst",
    jobFunc: 29,
    value: 572,
  },
  {
    text: "Commercial Loan Manager",
    jobFunc: 29,
    value: 573,
  },
  {
    text: "Compliance Research Manager",
    jobFunc: 29,
    value: 574,
  },
  {
    text: "Consumer Loan Manager",
    jobFunc: 29,
    value: 575,
  },
  {
    text: "Customer Wealth Manager",
    jobFunc: 29,
    value: 576,
  },
  {
    text: "Credit Card Manager",
    jobFunc: 29,
    value: 577,
  },
  {
    text: "Financial Planning Manager",
    jobFunc: 29,
    value: 578,
  },
  {
    text: "ATM Coordinator",
    jobFunc: 29,
    value: 579,
  },
  {
    text: "Cash Management Officer",
    jobFunc: 29,
    value: 580,
  },
  {
    text: "Cheque Processing Officer",
    jobFunc: 29,
    value: 581,
  },
  {
    text: "Loan Executive",
    jobFunc: 29,
    value: 582,
  },
  {
    text: "Compliance Officer",
    jobFunc: 29,
    value: 583,
  },
  {
    text: "Credit Card Fraud Investigator",
    jobFunc: 29,
    value: 584,
  },
  {
    text: "Credit Card Fraud Analyst",
    jobFunc: 29,
    value: 585,
  },
  {
    text: "Foreclosure Specialist",
    jobFunc: 29,
    value: 586,
  },
  {
    text: "Taxation Executive",
    jobFunc: 29,
    value: 587,
  },
  {
    text: "Foreign Exchange Trader",
    jobFunc: 29,
    value: 588,
  },
  {
    text: "Investment Services Executive",
    jobFunc: 29,
    value: 589,
  },
  {
    text: "Financial Services Representative",
    jobFunc: 29,
    value: 590,
  },
  {
    text: "Commercial Loan Servicing Representative",
    jobFunc: 29,
    value: 591,
  },
  {
    text: "Director of Media Company",
    jobFunc: 30,
    value: 592,
  },
  {
    text: "Chief Media Officer",
    jobFunc: 30,
    value: 593,
  },
  {
    text: "Creative Director",
    jobFunc: 30,
    value: 594,
  },
  {
    text: "General Media Manager",
    jobFunc: 30,
    value: 595,
  },
  {
    text: "Chief Media Executive",
    jobFunc: 30,
    value: 596,
  },
  {
    text: "Art Director",
    jobFunc: 30,
    value: 597,
  },
  {
    text: "Section Editor",
    jobFunc: 30,
    value: 598,
  },
  {
    text: "Producer",
    jobFunc: 30,
    value: 599,
  },
  {
    text: "Multimedia designer",
    jobFunc: 30,
    value: 600,
  },
  {
    text: "Media Administrator",
    jobFunc: 30,
    value: 601,
  },
  {
    text: "Creative Copywriter",
    jobFunc: 30,
    value: 602,
  },
  {
    text: "Production Artist",
    jobFunc: 30,
    value: 603,
  },
  {
    text: "Reporter",
    jobFunc: 30,
    value: 604,
  },
  {
    text: "Program Coordinator",
    jobFunc: 30,
    value: 605,
  },
  {
    text: "Public Affairs Specialist",
    jobFunc: 30,
    value: 606,
  },
  {
    text: "Media Information Specialist",
    jobFunc: 30,
    value: 607,
  },
  {
    text: "Publicist",
    jobFunc: 30,
    value: 608,
  },
  {
    text: "Media Technical Supervisor",
    jobFunc: 30,
    value: 609,
  },
  {
    text: "Media Information Assistant",
    jobFunc: 30,
    value: 610,
  },
  {
    text: "Photographer Head",
    jobFunc: 30,
    value: 611,
  },
  {
    text: "Social Media Specialist",
    jobFunc: 30,
    value: 612,
  },
  {
    text: "Technical Writer",
    jobFunc: 30,
    value: 613,
  },
  {
    text: "Sound Mixer",
    jobFunc: 30,
    value: 614,
  },
  {
    text: "Stage Hand",
    jobFunc: 30,
    value: 615,
  },
  {
    text: "Media Analyst",
    jobFunc: 30,
    value: 616,
  },
  {
    text: "Media Mentor",
    jobFunc: 30,
    value: 617,
  },
  {
    text: "Media Associate",
    jobFunc: 30,
    value: 618,
  },
  {
    text: "Trainee",
    jobFunc: 30,
    value: 619,
  },
  {
    text: "Senior computer programmer",
    jobFunc: 1,
    value: 620,
  },
  {
    text: "Senior software programmer",
    jobFunc: 1,
    value: 621,
  },
  {
    text: "Senior programmer",
    jobFunc: 1,
    value: 622,
  },
  {
    text: "Junior computer programmer",
    jobFunc: 1,
    value: 623,
  },
  {
    text: "Junior software programmer",
    jobFunc: 1,
    value: 624,
  },
  {
    text: "Junior programmer",
    jobFunc: 1,
    value: 625,
  },
  {
    text: "Junior programmer analyst",
    jobFunc: 1,
    value: 626,
  },
  {
    text: "Troubleshooting programmer",
    jobFunc: 1,
    value: 627,
  },
  {
    text: "Software designer",
    jobFunc: 1,
    value: 628,
  },
  {
    text: "C++ programmer",
    jobFunc: 1,
    value: 629,
  },
  {
    text: "Java analyst",
    jobFunc: 1,
    value: 630,
  },
  {
    text: "Technical programmer",
    jobFunc: 1,
    value: 631,
  },
  {
    text: "IT programmer",
    jobFunc: 1,
    value: 632,
  },
  {
    text: ".NET programmer",
    jobFunc: 1,
    value: 633,
  },
  {
    text: "Perl developer",
    jobFunc: 1,
    value: 634,
  },
  {
    text: "PeopleSoft developer",
    jobFunc: 1,
    value: 635,
  },
  {
    text: "Oracle programmer",
    jobFunc: 1,
    value: 636,
  },
  {
    text: "UNIX programmer",
    jobFunc: 1,
    value: 637,
  },
  {
    text: "Web programmer",
    jobFunc: 1,
    value: 638,
  },
  {
    text: "Web development",
    jobFunc: 1,
    value: 639,
  },
  {
    text: "Website programmer",
    jobFunc: 1,
    value: 640,
  },
  {
    text: "website development",
    jobFunc: 1,
    value: 641,
  },
  {
    text: "C++ developer",
    jobFunc: 1,
    value: 642,
  },
  {
    text: "Senior web programmer",
    jobFunc: 1,
    value: 643,
  },
  {
    text: "Lead developer",
    jobFunc: 1,
    value: 644,
  },
  {
    text: "Clerk",
    jobFunc: 1,
    value: 645,
  },
  {
    text: "Mobile application programmer",
    jobFunc: 1,
    value: 646,
  },
  {
    text: "Mobile application developer",
    jobFunc: 1,
    value: 647,
  },
  {
    text: "Mobile software developer",
    jobFunc: 1,
    value: 648,
  },
  {
    text: "Senior mobile application developer",
    jobFunc: 1,
    value: 649,
  },
  {
    text: "Senior mobile application programmer",
    jobFunc: 1,
    value: 650,
  },
  {
    text: "iOS lead developer",
    jobFunc: 1,
    value: 651,
  },
  {
    text: "Android app developer",
    jobFunc: 1,
    value: 652,
  },
  {
    text: "Windows based app developer",
    jobFunc: 1,
    value: 653,
  },
  {
    text: "Application support developer",
    jobFunc: 1,
    value: 654,
  },
  {
    text: "Marketing Technologist",
    jobFunc: 5,
    value: 655,
  },
  {
    text: "SEO Consultant",
    jobFunc: 5,
    value: 656,
  },
  {
    text: "Web Analytics Developer",
    jobFunc: 5,
    value: 657,
  },
  {
    text: "Digital Marketing Manager",
    jobFunc: 5,
    value: 658,
  },
  {
    text: "Social Media Manager",
    jobFunc: 5,
    value: 659,
  },
  {
    text: "Growth Hacker",
    jobFunc: 5,
    value: 660,
  },
  {
    text: "Content Strategist",
    jobFunc: 5,
    value: 661,
  },
  {
    text: "Information Architect",
    jobFunc: 5,
    value: 662,
  },
  {
    text: "UI Designer",
    jobFunc: 8,
    value: 663,
  },
  {
    text: "Accessibility Specialist",
    jobFunc: 5,
    value: 664,
  },
  {
    text: "Front-End Designer",
    jobFunc: 8,
    value: 665,
  },
  {
    text: "Front-End Developer",
    jobFunc: 1,
    value: 666,
  },
  {
    text: "Full-Stack Developer",
    jobFunc: 1,
    value: 667,
  },
  {
    text: "Wordpress Developer",
    jobFunc: 1,
    value: 668,
  },
  {
    text: "Frameworks Specialist",
    jobFunc: 1,
    value: 669,
  },
  {
    text: "RUBY On Rails Developer",
    jobFunc: 1,
    value: 670,
  },
  {
    text: "PYTHON Developer",
    jobFunc: 1,
    value: 671,
  },
  {
    text: "Business System Analyst",
    jobFunc: 1,
    value: 672,
  },
  {
    text: "Data Architect",
    jobFunc: 1,
    value: 673,
  },
  {
    text: "Data Modeler",
    jobFunc: 1,
    value: 674,
  },
  {
    text: "Data Analyst",
    jobFunc: 5,
    value: 675,
  },
  {
    text: "Data Scientist",
    jobFunc: 1,
    value: 676,
  },
  {
    text: "Cloud Architect",
    jobFunc: 1,
    value: 677,
  },
  {
    text: "Technical Lead",
    jobFunc: 1,
    value: 678,
  },
  {
    text: "DEVOPS Manager",
    jobFunc: 1,
    value: 679,
  },
  {
    text: "Agile Project Manager",
    jobFunc: 1,
    value: 680,
  },
  {
    text: "Product Manager",
    jobFunc: 1,
    value: 681,
  },
  {
    text: "Technical Account Manager",
    jobFunc: 1,
    value: 682,
  },
  {
    text: "QA Specialist",
    jobFunc: 1,
    value: 683,
  },
  {
    text: "Game Developer",
    jobFunc: 1,
    value: 684,
  },
  {
    text: "Application Support Analyst",
    jobFunc: 1,
    value: 685,
  },
  {
    text: "Associate Developer",
    jobFunc: 1,
    value: 686,
  },
  {
    text: "Computer and Information Systems Manager",
    jobFunc: 1,
    value: 687,
  },
  {
    text: "Customer Support Administrator",
    jobFunc: 1,
    value: 688,
  },
  {
    text: "Data Quality Manager",
    jobFunc: 1,
    value: 689,
  },
  {
    text: "Desktop Support Manager",
    jobFunc: 21,
    value: 690,
  },
  {
    text: "Director of Technology",
    jobFunc: 1,
    value: 691,
  },
  {
    text: "Information Technology Coordinator",
    jobFunc: 1,
    value: 692,
  },
  {
    text: "IT Support Manager",
    jobFunc: 1,
    value: 693,
  },
  {
    text: ".NET Developer",
    jobFunc: 1,
    value: 694,
  },
  {
    text: "System Architect",
    jobFunc: 1,
    value: 695,
  },
  {
    text: "Systems Designer",
    jobFunc: 1,
    value: 696,
  },
  {
    text: "Technical Operations Officer",
    jobFunc: 1,
    value: 697,
  },
  {
    text: "Technical Support Engineer",
    jobFunc: 1,
    value: 698,
  },
  {
    text: "Technical Specialist",
    jobFunc: 1,
    value: 699,
  },
  {
    text: "Webmaster",
    jobFunc: 1,
    value: 700,
  },
  {
    text: "Account Executive",
    jobFunc: 4,
    value: 701,
  },
  {
    text: "Administrative Assistant",
    jobFunc: 30,
    value: 702,
  },
  {
    text: "Animator",
    jobFunc: 30,
    value: 703,
  },
  {
    text: "Announcer",
    jobFunc: 30,
    value: 704,
  },
  {
    text: "Assistant Editor",
    jobFunc: 30,
    value: 705,
  },
  {
    text: "Author",
    jobFunc: 30,
    value: 706,
  },
  {
    text: "Broadcast and Sound Engineering Technician",
    jobFunc: 13,
    value: 707,
  },
  {
    text: "Broadcaster",
    jobFunc: 13,
    value: 708,
  },
  {
    text: "Copy Editor",
    jobFunc: 30,
    value: 709,
  },
  {
    text: "Copy Writer",
    jobFunc: 30,
    value: 710,
  },
  {
    text: "Digital Media Specialist",
    jobFunc: 30,
    value: 711,
  },
  {
    text: "Electronic Data Interchange Specialist",
    jobFunc: 30,
    value: 712,
  },
  {
    text: "Freelance Writer",
    jobFunc: 30,
    value: 713,
  },
  {
    text: "Intranet Applications Manager",
    jobFunc: 30,
    value: 714,
  },
  {
    text: "Journalist",
    jobFunc: 30,
    value: 715,
  },
  {
    text: "Line Producer",
    jobFunc: 30,
    value: 716,
  },
  {
    text: "Managing Editor",
    jobFunc: 30,
    value: 717,
  },
  {
    text: "Media Director",
    jobFunc: 30,
    value: 718,
  },
  {
    text: "Media Planner",
    jobFunc: 30,
    value: 719,
  },
  {
    text: "Media Product Development Manager",
    jobFunc: 30,
    value: 720,
  },
  {
    text: "Media and Communication Equipment Operator",
    jobFunc: 30,
    value: 721,
  },
  {
    text: "Merchandising Manager",
    jobFunc: 30,
    value: 722,
  },
  {
    text: "Motion Picture Set Worker",
    jobFunc: 30,
    value: 723,
  },
  {
    text: "Multimedia Services Manager",
    jobFunc: 30,
    value: 724,
  },
  {
    text: "News Analyst",
    jobFunc: 30,
    value: 725,
  },
  {
    text: "Promotions Specialist",
    jobFunc: 30,
    value: 726,
  },
  {
    text: "Proofreader",
    jobFunc: 30,
    value: 727,
  },
  {
    text: "Radio Operator",
    jobFunc: 30,
    value: 728,
  },
  {
    text: "Recording Engineer",
    jobFunc: 30,
    value: 729,
  },
  {
    text: "Technical Producer",
    jobFunc: 30,
    value: 730,
  },
  {
    text: "Telecommunications Technician",
    jobFunc: 30,
    value: 731,
  },
  {
    text: "Television Announcer",
    jobFunc: 30,
    value: 732,
  },
  {
    text: "Web Content Executive",
    jobFunc: 30,
    value: 733,
  },
  {
    text: "Web Customer Support Specialist",
    jobFunc: 30,
    value: 734,
  },
  {
    text: "Web Product Manager",
    jobFunc: 30,
    value: 735,
  },
  {
    text: "Senior Web Administrator",
    jobFunc: 1,
    value: 736,
  },
  {
    text: "Senior Security Specialist",
    jobFunc: 1,
    value: 737,
  },
  {
    text: "Senior System Designer",
    jobFunc: 1,
    value: 738,
  },
  {
    text: "Sales Executive",
    jobFunc: 4,
    value: 739,
  },
  {
    text: "Logistics Operations Specialist",
    jobFunc: 28,
    value: 740,
  },
  {
    text: "Business Developer",
    jobFunc: 4,
    value: 741,
  },
  {
    text: "Business Development Manager",
    jobFunc: 4,
    value: 742,
  },
  {
    text: "Business Development Executive",
    jobFunc: 4,
    value: 743,
  },
  {
    text: "Channel Partner Sales Executive",
    jobFunc: 4,
    value: 744,
  },
  {
    text: "Corporate Sales Account Executive",
    jobFunc: 4,
    value: 745,
  },
  {
    text: "Direct Sales Manager",
    jobFunc: 4,
    value: 746,
  },
  {
    text: "Direct Salesperson",
    jobFunc: 4,
    value: 747,
  },
  {
    text: "Director of Inside Sales",
    jobFunc: 4,
    value: 748,
  },
  {
    text: "Director of National Sales",
    jobFunc: 4,
    value: 749,
  },
  {
    text: "Director of Sales",
    jobFunc: 4,
    value: 750,
  },
  {
    text: "District Sales Manager",
    jobFunc: 4,
    value: 751,
  },
  {
    text: "Enterprise Resources Planning Representative",
    jobFunc: 4,
    value: 752,
  },
  {
    text: "Equipment Sales Specialist",
    jobFunc: 4,
    value: 753,
  },
  {
    text: "Executive Vice President, Sales",
    jobFunc: 4,
    value: 754,
  },
  {
    text: "Financial Advisor",
    jobFunc: 4,
    value: 755,
  },
  {
    text: "Financial Planner",
    jobFunc: 4,
    value: 756,
  },
  {
    text: "Financial Sales Assistant",
    jobFunc: 4,
    value: 757,
  },
  {
    text: "Fixed Income Specialist",
    jobFunc: 4,
    value: 758,
  },
  {
    text: "Franchise Development Manager",
    jobFunc: 4,
    value: 759,
  },
  {
    text: "Group and Events Sales Coordinator",
    jobFunc: 4,
    value: 760,
  },
  {
    text: "Group Sales Manager",
    jobFunc: 4,
    value: 761,
  },
  {
    text: "Healthcare Sales Representative",
    jobFunc: 4,
    value: 762,
  },
  {
    text: "Industrial Sales Representative",
    jobFunc: 4,
    value: 763,
  },
  {
    text: "Industry Representative",
    jobFunc: 4,
    value: 764,
  },
  {
    text: "Inside Sales Manager",
    jobFunc: 4,
    value: 765,
  },
  {
    text: "Inside Salesperson",
    jobFunc: 4,
    value: 766,
  },
  {
    text: "Investments Representative",
    jobFunc: 4,
    value: 767,
  },
  {
    text: "Key Account Manager",
    jobFunc: 4,
    value: 768,
  },
  {
    text: "Major Accounts Manager",
    jobFunc: 4,
    value: 769,
  },
  {
    text: "Manager, Business Development",
    jobFunc: 4,
    value: 770,
  },
  {
    text: "Market Development Manager",
    jobFunc: 4,
    value: 771,
  },
  {
    text: "Medical Sales Representative",
    jobFunc: 4,
    value: 772,
  },
  {
    text: "National Accounts Sales Analyst",
    jobFunc: 4,
    value: 773,
  },
  {
    text: "National Accounts Sales General Manager",
    jobFunc: 4,
    value: 774,
  },
  {
    text: "National Accounts Sales Representative",
    jobFunc: 4,
    value: 775,
  },
  {
    text: "Outside Sales Representative",
    jobFunc: 4,
    value: 776,
  },
  {
    text: "Regional Dealer Recruiter",
    jobFunc: 4,
    value: 777,
  },
  {
    text: "Regional Sales Account Manager",
    jobFunc: 4,
    value: 778,
  },
  {
    text: "Regional Sales Executive",
    jobFunc: 4,
    value: 779,
  },
  {
    text: "Retail Sales Representative",
    jobFunc: 4,
    value: 780,
  },
  {
    text: "Route Sales Representative",
    jobFunc: 4,
    value: 781,
  },
  {
    text: "Sales Account Executive, Small and Medium Business",
    jobFunc: 4,
    value: 782,
  },
  {
    text: "Sales and Community Marketing Manager",
    jobFunc: 4,
    value: 783,
  },
  {
    text: "Sales Representative",
    jobFunc: 4,
    value: 784,
  },
  {
    text: "Specialty Sales Representative",
    jobFunc: 4,
    value: 785,
  },
  {
    text: "Strategic Account Manager",
    jobFunc: 4,
    value: 786,
  },
  {
    text: "Territory Business Manager",
    jobFunc: 4,
    value: 787,
  },
  {
    text: "Territory Manager",
    jobFunc: 4,
    value: 788,
  },
  {
    text: "Territory Sales Manager",
    jobFunc: 4,
    value: 789,
  },
  {
    text: "Territory Sales Representative",
    jobFunc: 4,
    value: 790,
  },
  {
    text: "Wealth Management Advisor",
    jobFunc: 4,
    value: 791,
  },
  {
    text: "Wholesale Sales Manager",
    jobFunc: 4,
    value: 792,
  },
  {
    text: "HR Representative",
    jobFunc: 2,
    value: 793,
  },
  {
    text: "Administrative Manager",
    jobFunc: 2,
    value: 794,
  },
  {
    text: "Applications Specialist",
    jobFunc: 2,
    value: 795,
  },
  {
    text: "Assistant Director, Employment",
    jobFunc: 2,
    value: 796,
  },
  {
    text: "Assistant Director",
    jobFunc: 2,
    value: 797,
  },
  {
    text: "Assistant Director of Human Resources",
    jobFunc: 2,
    value: 798,
  },
  {
    text: "Assistant HR Manager",
    jobFunc: 2,
    value: 799,
  },
  {
    text: "Assistant VP Human Resources",
    jobFunc: 2,
    value: 800,
  },
  {
    text: "Associate Director of Human Resources",
    jobFunc: 2,
    value: 801,
  },
  {
    text: "Attorney",
    jobFunc: 2,
    value: 802,
  },
  {
    text: "Benefits and Work Comp Manager",
    jobFunc: 2,
    value: 803,
  },
  {
    text: "Benefits Coordinator",
    jobFunc: 2,
    value: 804,
  },
  {
    text: "Benefits Counselor",
    jobFunc: 2,
    value: 805,
  },
  {
    text: "Benefits Specialist",
    jobFunc: 2,
    value: 806,
  },
  {
    text: "Benefits Officer",
    jobFunc: 2,
    value: 807,
  },
  {
    text: "Chief Happiness Officer",
    jobFunc: 2,
    value: 808,
  },
  {
    text: "Chief Human Resources Officer",
    jobFunc: 2,
    value: 809,
  },
  {
    text: "Chief People Officer",
    jobFunc: 2,
    value: 810,
  },
  {
    text: "Client Facing Human Resources Specialist",
    jobFunc: 2,
    value: 811,
  },
  {
    text: "Coordinator, Administrative Services",
    jobFunc: 2,
    value: 812,
  },
  {
    text: "Coordinator, Talent Acquisition",
    jobFunc: 2,
    value: 813,
  },
  {
    text: "Director of Employment",
    jobFunc: 2,
    value: 814,
  },
  {
    text: "Director of Employment and Recruiting",
    jobFunc: 2,
    value: 815,
  },
  {
    text: "Director of Employment Services",
    jobFunc: 2,
    value: 816,
  },
  {
    text: "Director of Talent",
    jobFunc: 2,
    value: 817,
  },
  {
    text: "Director of Talent Management",
    jobFunc: 2,
    value: 818,
  },
  {
    text: "District Human Resources Manager",
    jobFunc: 2,
    value: 819,
  },
  {
    text: "eCommerce Recruiter",
    jobFunc: 2,
    value: 820,
  },
  {
    text: "E-Learning Analyst",
    jobFunc: 2,
    value: 821,
  },
  {
    text: "E-Learning Coordinator",
    jobFunc: 2,
    value: 822,
  },
  {
    text: "E-Learning Director",
    jobFunc: 2,
    value: 823,
  },
  {
    text: "E-Learning Executive Director",
    jobFunc: 2,
    value: 824,
  },
  {
    text: "E-Learning Manager",
    jobFunc: 2,
    value: 825,
  },
  {
    text: "E-Learning Specialist",
    jobFunc: 2,
    value: 826,
  },
  {
    text: "Employee Relations Leader",
    jobFunc: 2,
    value: 827,
  },
  {
    text: "Employment Supervisor",
    jobFunc: 2,
    value: 828,
  },
  {
    text: "Employee and Labor Relations Consultant",
    jobFunc: 2,
    value: 829,
  },
  {
    text: "Employee Benefits Account Manager",
    jobFunc: 2,
    value: 830,
  },
  {
    text: "Employee Benefits Law Specialist",
    jobFunc: 2,
    value: 831,
  },
  {
    text: "Employee Relations Associate Counsel",
    jobFunc: 2,
    value: 832,
  },
  {
    text: "Employee Relations Consultant",
    jobFunc: 2,
    value: 833,
  },
  {
    text: "Employee Relations Specialist",
    jobFunc: 2,
    value: 834,
  },
  {
    text: "Employee Retention Manager",
    jobFunc: 2,
    value: 835,
  },
  {
    text: "Employee Satisfaction Manager",
    jobFunc: 2,
    value: 836,
  },
  {
    text: "Employment Law Specialist",
    jobFunc: 2,
    value: 837,
  },
  {
    text: "Executive Recruiter",
    jobFunc: 2,
    value: 838,
  },
  {
    text: "Functional Leader",
    jobFunc: 2,
    value: 839,
  },
  {
    text: "HR Administrative Assistant",
    jobFunc: 2,
    value: 840,
  },
  {
    text: "HR Generalist",
    jobFunc: 2,
    value: 841,
  },
  {
    text: "HRIS Analyst",
    jobFunc: 2,
    value: 842,
  },
  {
    text: "HRIS Manager",
    jobFunc: 2,
    value: 843,
  },
  {
    text: "HR Manager Multi-site",
    jobFunc: 2,
    value: 844,
  },
  {
    text: "Human Resources Administrator",
    jobFunc: 2,
    value: 845,
  },
  {
    text: "Human Resources Advocate",
    jobFunc: 2,
    value: 846,
  },
  {
    text: "Human Resources Adviser",
    jobFunc: 2,
    value: 847,
  },
  {
    text: "Human Resources Analyst",
    jobFunc: 2,
    value: 848,
  },
  {
    text: "Human Resources and Safety Coordinator",
    jobFunc: 2,
    value: 849,
  },
  {
    text: "Human Resources Assistant",
    jobFunc: 2,
    value: 850,
  },
  {
    text: "Human Resources Associate",
    jobFunc: 2,
    value: 851,
  },
  {
    text: "Human Resources Business Partner",
    jobFunc: 2,
    value: 852,
  },
  {
    text: "Human Resources Champion",
    jobFunc: 2,
    value: 853,
  },
  {
    text: "Human Resources Clerk",
    jobFunc: 2,
    value: 854,
  },
  {
    text: "Human Resources Coach",
    jobFunc: 2,
    value: 855,
  },
  {
    text: "Human Resources Consultant",
    jobFunc: 2,
    value: 856,
  },
  {
    text: "Human Resources Compensation Coordinator",
    jobFunc: 2,
    value: 857,
  },
  {
    text: "Human Resources Coordinator",
    jobFunc: 2,
    value: 858,
  },
  {
    text: "HRD/Training and Development Administrator",
    jobFunc: 2,
    value: 859,
  },
  {
    text: "HRD/Training and Development Analyst",
    jobFunc: 2,
    value: 860,
  },
  {
    text: "HRD/Training and Development Manager",
    jobFunc: 2,
    value: 861,
  },
  {
    text: "HRD/Training and Development Director",
    jobFunc: 2,
    value: 862,
  },
  {
    text: "HRD/Training and Development Specialist",
    jobFunc: 2,
    value: 863,
  },
  {
    text: "HRD/Training and Development Supervisor",
    jobFunc: 2,
    value: 864,
  },
  {
    text: "HRD/Training and Development Vice President",
    jobFunc: 2,
    value: 865,
  },
  {
    text: "Human Resources Director",
    jobFunc: 2,
    value: 866,
  },
  {
    text: "Human Resources Generalist",
    jobFunc: 2,
    value: 867,
  },
  {
    text: "Human Resource Information Systems Coordinator",
    jobFunc: 2,
    value: 868,
  },
  {
    text: "Human Resources Manager/Architect Employee Relations",
    jobFunc: 2,
    value: 869,
  },
  {
    text: "Human Resources Payroll and Benefits Specialist",
    jobFunc: 2,
    value: 870,
  },
  {
    text: "Human Resources Representative",
    jobFunc: 2,
    value: 871,
  },
  {
    text: "Human Resources Team Leader",
    jobFunc: 2,
    value: 872,
  },
  {
    text: "Human Resources Technician",
    jobFunc: 2,
    value: 873,
  },
  {
    text: "Manager, Programs and Processes",
    jobFunc: 2,
    value: 874,
  },
  {
    text: "Manager IS Risk and Compliance",
    jobFunc: 2,
    value: 875,
  },
  {
    text: "Manager of Career and Employee Relations",
    jobFunc: 2,
    value: 876,
  },
  {
    text: "Ministers of Culture",
    jobFunc: 2,
    value: 877,
  },
  {
    text: "Organizational Development Specialist",
    jobFunc: 2,
    value: 878,
  },
  {
    text: "Organizational Development Administrator",
    jobFunc: 2,
    value: 879,
  },
  {
    text: "Organizational Development Analyst",
    jobFunc: 2,
    value: 880,
  },
  {
    text: "Organizational Development Manager",
    jobFunc: 2,
    value: 881,
  },
  {
    text: "Organizational Development Director",
    jobFunc: 2,
    value: 882,
  },
  {
    text: "Organizational Development VP",
    jobFunc: 2,
    value: 883,
  },
  {
    text: "Payroll Processing Specialist",
    jobFunc: 2,
    value: 884,
  },
  {
    text: "Plant Human Resources Manager",
    jobFunc: 2,
    value: 885,
  },
  {
    text: "Recruiting and Sourcing Coordinator",
    jobFunc: 2,
    value: 886,
  },
  {
    text: "Recruiting Interviewer",
    jobFunc: 2,
    value: 887,
  },
  {
    text: "Recruiting Manager",
    jobFunc: 2,
    value: 888,
  },
  {
    text: "Recruitment and Assessment Specialist",
    jobFunc: 2,
    value: 889,
  },
  {
    text: "Recruitment and Social Media Coordinator",
    jobFunc: 2,
    value: 890,
  },
  {
    text: "Retirement Plan Counselor",
    jobFunc: 2,
    value: 891,
  },
  {
    text: "Safety Compliance and Recruitment Specialist",
    jobFunc: 2,
    value: 892,
  },
  {
    text: "Senior Benefits Manager",
    jobFunc: 2,
    value: 893,
  },
  {
    text: "Senior Employee Benefits Consultant",
    jobFunc: 2,
    value: 894,
  },
  {
    text: "Senior Employee Benefits Manager",
    jobFunc: 2,
    value: 895,
  },
  {
    text: "Senior HR Specialist",
    jobFunc: 2,
    value: 896,
  },
  {
    text: "Social Media Recruiter",
    jobFunc: 2,
    value: 897,
  },
  {
    text: "Staffing Consultant",
    jobFunc: 2,
    value: 898,
  },
  {
    text: "Staffing Coordinator",
    jobFunc: 2,
    value: 899,
  },
  {
    text: "Talent Acquisition Consultant",
    jobFunc: 2,
    value: 900,
  },
  {
    text: "Talent Acquisition Manager",
    jobFunc: 2,
    value: 901,
  },
  {
    text: "Technical Recruiter",
    jobFunc: 2,
    value: 902,
  },
  {
    text: "Trainer",
    jobFunc: 2,
    value: 903,
  },
  {
    text: "Training and Technical Assistance Coordinator",
    jobFunc: 2,
    value: 904,
  },
  {
    text: "Training Coordinator",
    jobFunc: 2,
    value: 905,
  },
  {
    text: "Union Organizer",
    jobFunc: 2,
    value: 906,
  },
  {
    text: "Union Relations",
    jobFunc: 2,
    value: 907,
  },
  {
    text: "Vice President of Diversity",
    jobFunc: 2,
    value: 908,
  },
  {
    text: "Vice President of Human Resources",
    jobFunc: 2,
    value: 909,
  },
  {
    text: "Vice President of People",
    jobFunc: 2,
    value: 910,
  },
  {
    text: "Vice President of Talent Management",
    jobFunc: 2,
    value: 911,
  },
  {
    text: "Advertising Director",
    jobFunc: 5,
    value: 912,
  },
  {
    text: "Art Director",
    jobFunc: 5,
    value: 913,
  },
  {
    text: "Assistant Account Executive",
    jobFunc: 5,
    value: 914,
  },
  {
    text: "Assistant Brand Manager",
    jobFunc: 5,
    value: 915,
  },
  {
    text: "Assistant Marketing Director",
    jobFunc: 5,
    value: 916,
  },
  {
    text: "Assistant Product Manager",
    jobFunc: 5,
    value: 917,
  },
  {
    text: "Associate Brand Manager",
    jobFunc: 5,
    value: 918,
  },
  {
    text: "Associate Marketing Director",
    jobFunc: 5,
    value: 919,
  },
  {
    text: "Associate Product Manager",
    jobFunc: 5,
    value: 920,
  },
  {
    text: "Brand Assistant",
    jobFunc: 5,
    value: 921,
  },
  {
    text: "Brand Strategist",
    jobFunc: 5,
    value: 922,
  },
  {
    text: "Business Development Representative",
    jobFunc: 5,
    value: 923,
  },
  {
    text: "Communications Assistant",
    jobFunc: 5,
    value: 924,
  },
  {
    text: "Content Marketing Manager",
    jobFunc: 5,
    value: 925,
  },
  {
    text: "Creative Assistant",
    jobFunc: 5,
    value: 926,
  },
  {
    text: "Director of Digital Marketing",
    jobFunc: 5,
    value: 927,
  },
  {
    text: "eCommerce Marketing Director",
    jobFunc: 5,
    value: 928,
  },
  {
    text: "eCommerce Marketing Manager",
    jobFunc: 5,
    value: 929,
  },
  {
    text: "eCommerce Marketing Specialist",
    jobFunc: 5,
    value: 930,
  },
  {
    text: "Email Marketer",
    jobFunc: 5,
    value: 931,
  },
  {
    text: "Inside Sales Representative",
    jobFunc: 5,
    value: 932,
  },
  {
    text: "Internet Marketing Director",
    jobFunc: 5,
    value: 933,
  },
  {
    text: "Internet Marketing Specialist",
    jobFunc: 5,
    value: 934,
  },
  {
    text: "Market Research Analyst",
    jobFunc: 5,
    value: 935,
  },
  {
    text: "Market Research Assistant",
    jobFunc: 5,
    value: 936,
  },
  {
    text: "Marketing Analyst",
    jobFunc: 5,
    value: 937,
  },
  {
    text: "Marketing and Promotions Manager",
    jobFunc: 5,
    value: 938,
  },
  {
    text: "Marketing Assistant",
    jobFunc: 5,
    value: 939,
  },
  {
    text: "Marketing Communications Coordinator",
    jobFunc: 5,
    value: 940,
  },
  {
    text: "Marketing Communications Director",
    jobFunc: 5,
    value: 941,
  },
  {
    text: "Marketing Communications Manager",
    jobFunc: 5,
    value: 942,
  },
  {
    text: "Marketing Communications Specialist",
    jobFunc: 5,
    value: 943,
  },
  {
    text: "Marketing Consultant",
    jobFunc: 5,
    value: 944,
  },
  {
    text: "Marketing Data Analyst",
    jobFunc: 5,
    value: 945,
  },
  {
    text: "Marketing Promotions Specialist",
    jobFunc: 5,
    value: 946,
  },
  {
    text: "Media Assistant",
    jobFunc: 5,
    value: 947,
  },
  {
    text: "Media Buyer",
    jobFunc: 5,
    value: 948,
  },
  {
    text: "Media Director",
    jobFunc: 5,
    value: 949,
  },
  {
    text: "Media Relations Coordinator",
    jobFunc: 5,
    value: 950,
  },
  {
    text: "Media Relations Director",
    jobFunc: 5,
    value: 951,
  },
  {
    text: "Media Researcher",
    jobFunc: 5,
    value: 952,
  },
  {
    text: "Online Product Manager",
    jobFunc: 5,
    value: 953,
  },
  {
    text: "Outside Sales Representative",
    jobFunc: 5,
    value: 954,
  },
  {
    text: "Product Marketing Manager",
    jobFunc: 5,
    value: 955,
  },
  {
    text: "Project Manager",
    jobFunc: 5,
    value: 956,
  },
  {
    text: "Promotions Assistant",
    jobFunc: 5,
    value: 957,
  },
  {
    text: "Promotions Coordinator",
    jobFunc: 5,
    value: 958,
  },
  {
    text: "Promotions Director",
    jobFunc: 5,
    value: 959,
  },
  {
    text: "Public Relations Assistant",
    jobFunc: 5,
    value: 960,
  },
  {
    text: "Public Relations Coordinator",
    jobFunc: 5,
    value: 961,
  },
  {
    text: "Public Relations Director",
    jobFunc: 5,
    value: 962,
  },
  {
    text: "Public Relations Manager",
    jobFunc: 5,
    value: 963,
  },
  {
    text: "Public Relations Representative",
    jobFunc: 5,
    value: 964,
  },
  {
    text: "Public Relations Specialist",
    jobFunc: 5,
    value: 965,
  },
  {
    text: "Publicity Assistant",
    jobFunc: 5,
    value: 966,
  },
  {
    text: "Publicity Director",
    jobFunc: 5,
    value: 967,
  },
  {
    text: "Publicity Manager",
    jobFunc: 5,
    value: 968,
  },
  {
    text: "Regional Account Manager",
    jobFunc: 5,
    value: 969,
  },
  {
    text: "Regional Sales Manager",
    jobFunc: 5,
    value: 970,
  },
  {
    text: "Relationship Manager",
    jobFunc: 5,
    value: 971,
  },
  {
    text: "Sales Assistant",
    jobFunc: 5,
    value: 972,
  },
  {
    text: "Sales Associate",
    jobFunc: 5,
    value: 973,
  },
  {
    text: "Sales Consultant",
    jobFunc: 5,
    value: 974,
  },
  {
    text: "Sales Director",
    jobFunc: 5,
    value: 975,
  },
  {
    text: "Sales Engineer",
    jobFunc: 5,
    value: 976,
  },
  {
    text: "Senior Brand Manager",
    jobFunc: 5,
    value: 977,
  },
  {
    text: "Senior Product Manager",
    jobFunc: 5,
    value: 978,
  },
  {
    text: "Senior Sales Representative",
    jobFunc: 5,
    value: 979,
  },
  {
    text: "SEO Manager",
    jobFunc: 5,
    value: 980,
  },
  {
    text: "Social Media Marketing Analyst",
    jobFunc: 5,
    value: 981,
  },
  {
    text: "Social Media Marketing Coordinator",
    jobFunc: 5,
    value: 982,
  },
  {
    text: "Social Media Marketing Manager",
    jobFunc: 5,
    value: 983,
  },
  {
    text: "Territory Manager",
    jobFunc: 5,
    value: 984,
  },
  {
    text: "Vice President for Marketing",
    jobFunc: 5,
    value: 985,
  },
  {
    text: "Brand Ambassador",
    jobFunc: 5,
    value: 986,
  },
  {
    text: "Digital Communications Professional",
    jobFunc: 5,
    value: 987,
  },
  {
    text: "Digital Content Manager",
    jobFunc: 5,
    value: 988,
  },
  {
    text: "Digital Media Manager",
    jobFunc: 5,
    value: 989,
  },
  {
    text: "Digital Media Producer",
    jobFunc: 5,
    value: 990,
  },
  {
    text: "Digital Media Supervisor",
    jobFunc: 5,
    value: 991,
  },
  {
    text: "Director of Community",
    jobFunc: 5,
    value: 992,
  },
  {
    text: "Director, Communications Planning",
    jobFunc: 5,
    value: 993,
  },
  {
    text: "Director, Online Communications",
    jobFunc: 5,
    value: 994,
  },
  {
    text: "Director, Social Marketing and Brand Communications",
    jobFunc: 5,
    value: 995,
  },
  {
    text: "Director, Social Media Marketing",
    jobFunc: 5,
    value: 996,
  },
  {
    text: "Director of Social Media",
    jobFunc: 5,
    value: 997,
  },
  {
    text: "Director of Social Media Communications",
    jobFunc: 5,
    value: 998,
  },
  {
    text: "Director, Social Media Relations",
    jobFunc: 5,
    value: 999,
  },
  {
    text: "Director of Social Media Strategy",
    jobFunc: 5,
    value: 1000,
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
