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
    value: 12,
    text: "Construction Engineering",
  },
  {
    value: 13,
    text: "Broadcasting / Film / Video Production",
  },
  {
    value: 14,
    text: "Medical Engineering",
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
    value: 1,
    jobFunc: 1,
    text: "Mobile Apps Developer",
    assessment: "Responsible for developing apps on one or more mobile platforms (iOS, Android, Blackberry or Windows Phone,etc) \n publishing to the app store, monitoring downloads, implementing designs accurately, etc\n"
  },
  {
    value: 2,
    jobFunc: 1,
    text: "Software Developer",
    assessment: "Integrate software with existing systems, Performance improvement, balancing, usability, and automation\nDesigning, coding and debugging applications\n  Software analysis, code analysis, requirements analysis, software review, identification of code metrics, and system risk analysis\nSoftware simulation and modeling\nFront end graphical user interface design\nSoftware testing and quality assurance\nFull application development\nSupport, maintain and document software functionality\n"
  },
  {
    value: 3,
    jobFunc: 1,
    text: "Java Developer",
    assessment: "\nDesign and develop high-volume, low-latency applications for mission-critical systems, delivering high-availability and performance\nContribute in all phases of the development lifecycle\nWrite well designed, testable, efficient code\nEnsure designs are in compliance with specifications\nPrepare and produce releases of software components\nSupport continuous improvement by investigating alternatives and technologies and presenting these for architectural review\n"
  },
  {
    value: 4,
    jobFunc: 1,
    text: "Linux System Administrator",
    assessment: "\nHelp tune performance and ensure high availability of infrastructure\nDesign and develop infrastructure monitoring and reporting tools\nDevelop and maintain configuration management solutions\nDevelop test automation frameworks in collaboration with rest of the team\nCreate tools to help teams make the most out of the available infrastructure"
  },
  {
    value: 5,
    jobFunc: 1,
    text: "Networks Engineer",
    assessment: "\nConfigure and install various network devices and services (eg, routers, switches, firewalls, load balancers, VPN, QoS)\nPerform network maintenance and system upgrades including service packs, patches, hot fixes and security configurations\nMonitor performance and ensure system availability and reliability\nMonitor system resource utilization, trending, and capacity planning\nProvide Level-2/3 support and troubleshooting to resolve issues"
  },
  {
    value: 6,
    jobFunc: 1,
    text: "Quality Control",
    assessment: "\nDevelop deep understanding of the currently employed technologies, data models, application functionality and development process\nParticipate in full cycle development of system components\nAssess and advise with best practices for enhancing application quality in terms of development process, release, and support\nConduct software compatibility tests with programs, hardware, operating systems, or network environments\nCreate / maintain databases of known test defects\nDesign test plans, scenarios, scripts, or procedures\nDesign / develop automated testing tools\n"
  },
  {
    value: 7,
    jobFunc: 1,
    text: "PHP Developer",
    assessment: "\nWrite “clean”, well designed code\nProduce detailed specifications\nTroubleshoot, test and maintain the core product software and databases to ensure strong optimization and functionality\nContribute in all phases of the development lifecycle\nFollow industry best practices\nDevelop and deploy new features to facilitate related procedures and tools if necessary"
  },
  {
    value: 9,
    jobFunc: 1,
    text: "SharePoint Developer",
    assessment: "\nDesign and code superior technical solutions\nCreate well designed, reusable objects\nCreate efficient and logical databases for clients\nCreate and execute project work plans, revising as necessary to meet changing needs and requirements\nCommunicate and enforce best practice coding standards\nConsistently deliver high-quality services to clients on schedule\nCommunicate complex information effectively to team and clients\nAbility to scale the solution to the client’s goals and budget"
  },
  {
    value: 12,
    jobFunc: 1,
    text: "System Administrator",
    assessment: "\nSupport LANs, WANs, network segments, Internet, and intranet systems\nMaintain system efficiency\nEnsure design of system allows all components to work properly together\nTroubleshoot problems reported by users\nMake recommendations for future upgrades\nMaintain network and system security\nAnalyze and isolate issues\nMonitor networks to ensure security and availability to specific users\nEvaluate and modify system's performance\nIdentify user needs\nMaintain integrity of the network, server deployment, and security\n"
  },
  {
    value: 13,
    jobFunc: 1,
    text: "System Analyst",
    assessment: "\nDefines application problem by conferring with clients; evaluating procedures and processes\nDevelops solution by preparing and evaluating alternative workflow solutions\nControls solution by establishing specifications; coordinating production with programmers\nValidates results by testing programs\nEnsures operation by training client personnel; providing support\nProvides reference by writing documentation\nUpdates job knowledge by participating in educational opportunities; reading professional publications; maintaining personal networks; participating in professional organizations\nAccomplishes information systems and organization mission by completing related results as needed\n"
  },
  {
    value: 14,
    jobFunc: 1,
    text: "Technical Consultant",
    assessment: "\n Conducting training sessions and seminars \n Reporting on daily responsibilities and tasks \n Resolving client issues \n  Testing products and applications \n  Documenting processes and application instructions \n Supporting and troubleshooting software issues \n  Attending meetings, sessions and other company events \n Generating innovate ideas"
  },
  {
    value: 15,
    jobFunc: 1,
    text: "Technical Manager",
    assessment: "\nProficient in handling the most complex of technical development concepts, latest software tools and technologies, strong database concepts and designing techniques\nUnderstands different programming languages and ability to solve problems in coding, testing and deployment\nPossesses good knowledge of different software systems, client/server architectures and various compatibility requirements\nExperience in troubleshooting, software development processes and ability to understand and implement client requirements\nAbility to communicate effectively with teams and clients\nUnderstand project requirements, coordinate with resources and direct the projects in the right direction in a timely manner"
  },
  {
    value: 16,
    jobFunc: 2,
    text: "HR Specialist",
    assessment: "\nPerforming searches for qualified candidates according to relevant job criteria, using our database, networking as well as employee referrals\nSupporting the recruitment function by screening, interviewing and selecting candidates, whenever required while ensuring efficient comments documentation\nCoordinating interviews with the relevant managers\nAdvising job applicants of the success or failure of their application\nCarrying out other HR related jobs\n"
  },
  {
    value: 18,
    jobFunc: 2,
    text: "Recruitment Specialist",
    assessment: "\nPerforming searches for qualified candidates according to relevant job criteria, using our database, networking as well as employee referrals\nSupporting the recruitment function by screening, interviewing and selecting candidates, whenever required while ensuring efficient comments documentation\nCoordinating interviews with the relevant managers\nAdvising job applicants of the success or failure of their application\nCarrying out other HR related jobs\n"
  },
  {
    value: 19,
    jobFunc: 1,
    text: "Web Developer",
    assessment: "\nConsult with managerial and technical personnel to clarify program intent, identify problems, and suggest changes\n Perform systems analysis and programming tasks to maintain and control the use of software applications\nPrepare detailed workflow charts and diagrams that describe input, output, and logical operation, and convert them into high quality computer programs\nWrite, analyze, review, and rewrite programs, using design diagrams, and applying knowledge of computer capabilities, subject matter, and symbolic logic\n"
  },
  {
    value: 20,
    jobFunc: 4,
    text: "Sales Representative",
    assessment: "\nAcquire companies that have no significant revenue history with our organization by selling our products and services\nInitiate and develop a strong relationship with companies\nDetermine customers' needs, and prepare proposals to sell services that address these needs\nGive online demonstrations to clients in order to handle objections and convince customers to buy\nManage growth of new business by transitioning them to be loyal customers\n"
  },
  {
    value: 21,
    jobFunc: 4,
    text: "Sales Associate",
    assessment: "\nAcquire companies that have no significant revenue history with our organization by selling our products and services\nInitiate and develop a strong relationship with companies\nDetermine customers' needs, and prepare proposals to sell services that address these needs\nGive online demonstrations to clients in order to handle objections and convince customers to buy\nManage growth of new business by transitioning them to be loyal customers\n"
  },
  {
    value: 22,
    jobFunc: 4,
    text: "Customer Care Representative",
    assessment: "The Customer Care Specialist will train our clients on the use of our online services, audit their satisfaction as well as motivate the repeat usage of our products and services\n The Customer Care Specialist will be available to assist the clients with any issues they might have\n A professional attitude is the key for this role\n"
  },
  {
    value: 23,
    jobFunc: 4,
    text: "Sales Support",
    assessment: "Determine customers' needs, and prepare proposals to sell services that address these needs\nGive online demonstrations to clients in order to handle objections and convince customers to buy\n"
  },
  {
    value: 24,
    jobFunc: 4,
    text: "Sales Consultant",
    assessment: "\nScrutinizing sales results, trends and key performance indicators (KPI’s) and conferring with representatives accountable for achieving targets\nActing as primary contact with General Manager – Regional Sales Head for all retail sales issues and keeping abreast of government & international commercial laws to ascertain their effect on agency’s sales & marketing performance\n"
  },
  {
    value: 25,
    jobFunc: 4,
    text: "Sales Manager",
    assessment: "\nDesigning/implementing sales plans to accommodate department goals for company products/ services vehicles in Abu Dhabi city\n Directing sales forecasting activities and setting performance goals accordingly\nAdministering showrooms to maintain high volume along with increased turnover and enhanced customer satisfaction, particularly of high net worth customers\n Interfacing directly with stocking dealer groups to achieve sales goals, increasing market segment business awareness\nFormulating and controlling budgetary allocations for the department, establishing/ meeting company objectives through training and motivation of employees\nCreating cost-effective advertising programs and merchandising strategies for the showroom to acquire major sales opportunities\n Monitoring daily log"
  },
  {
    value: 26,
    jobFunc: 4,
    text: "Sales Director",
    assessment: "\nDesigning/implementing sales plans to accommodate department goals for company products/ services vehicles in Abu Dhabi city\n Directing sales forecasting activities and setting performance goals accordingly\nCreating cost-effective merchandising strategies for the showroom to acquire major sales opportunities\n Monitoring daily logs to verify sales on a regular basis and providing management reports pertaining to the same\n"
  },
  {
    value: 27,
    jobFunc: 3,
    text: "Personal Assistant",
    assessment: "\nResponsible for daily communications including maintenance of calendar and appointments for the general manager\nMonitoring, all personnel functions, purchase orders, travel arrangements, requests for disbursements and requisite office supply\nServing as administrative liaison for all positions reporting to the general manager\n Providing administrative support, which included organization and daily maintenance of office, communication system, filing, correspondence, copying, etc\n"
  },
  {
    value: 28,
    jobFunc: 3,
    text: "Secretary",
    assessment: "\nResponsible for daily communications including maintenance of calendar and appointments for the general manager\nMonitoring, all personnel functions, purchase orders, travel arrangements, requests for disbursements and requisite office supply\nServing as administrative liaison for all positions reporting to the general manager\n Providing administrative support, which included organization and daily maintenance of office, communication system, filing, correspondence, copying, etc\n"
  },
  {
    value: 29,
    jobFunc: 2,
    text: "Payroll manager",
    assessment: "Maintains payroll information by designing systems; directing the collection, calculation, and entering of data\nUpdates payroll records by reviewing and approving changes in exemptions, insurance coverage, savings deductions, and job titles, and department/ division transfers\nPays employees by directing the production and issuance of paychecks or electronic transfers to bank accounts\nPrepares reports by compiling summaries of earnings, taxes, deductions, leave, disability, and nontaxable wages\nDetermines payroll liabilities by approving the calculation of employee federal and state income and social security taxes, and employer's social security, unemployment, and workers compensation payments\n"
  },
  {
    value: 30,
    jobFunc: 2,
    text: "HR Manager",
    assessment: "Maintains the work structure by updating job requirements and job descriptions for all positions\nMaintains organization staff by establishing a recruiting, testing, and interviewing program; counseling managers on candidate selection; conducting and analyzing exit interviews; recommending changes\nPrepares employees for assignments by establishing and conducting orientation and training programs\n"
  },
  {
    value: 31,
    jobFunc: 6,
    text: "Auditor",
    assessment: "Plans financial audits by understanding organization objectives, structure, policies, processes, internal controls, and external regulations; identifying risk areas; preparing audit scope and objectives; preparing audit programs\nAssesses compliance with financial regulations and controls by executing audit program steps; testing general ledger, account balances, balance sheets, income statements, and related financial statements; examining and analyzing records, reports, operating practices, and documentation\nAssesses risks and internal controls by identifying areas of non-compliance; evaluating manual and automated financial processes; identifying process weaknesses and inefficiencies and operational issues\n"
  },
  {
    value: 32,
    jobFunc: 6,
    text: "Accountant",
    assessment: "Prepares asset, liability, and capital account entries by compiling and analyzing account information\nDocuments financial transactions by entering account information\nRecommends financial actions by analyzing accounting options\nSummarizes current financial status by collecting information; preparing balance sheet, profit and loss statement, and other reports\n"
  },
  {
    value: 33,
    jobFunc: 6,
    text: "Chartered Accountant",
    assessment: "continuous management of financial systems and budgets\nundertaking financial audits (an independent check of an organisation's financial position)\nproviding financial advice\ncounselling clients on areas of business improvement, or dealing with insolvency\ndetecting and preventing fraud (forensic accounting)\nmanaging junior colleagues\n"
  },
  {
    value: 35,
    jobFunc: 6,
    text: "Market Analyst",
    assessment: "Determines cost of operations by establishing standard costs; collecting operational data\nIdentifies financial status by comparing and analyzing actual results with plans and forecasts\nGuides cost analysis process by establishing and enforcing policies and procedures; providing trends and forecasts; explaining processes and techniques; recommending actions\nImproves financial status by analyzing results; monitoring variances; identifying trends; recommending actions to management\nReconciles transactions by comparing and correcting data\n"
  },
  {
    value: 36,
    jobFunc: 6,
    text: "Tax Consultant",
    assessment: "Recommend appropriate strategies to all management to reduce all obligations and determine complexity of all issues\nCollaborate with various departments to ensure achievement of all organizational objectives\nAssist pricing group members to design and implement all company transfer policy and prepare plans for all tax departments\n"
  },
  {
    value: 37,
    jobFunc: 6,
    text: "Accounts Analyst",
    assessment: "Ensure accuracy of client billing activities\nReview and process unpaid or pending accounts\nManage overpayment and refunding activities\nManage internal and external financial reporting\nProvide financial and economic advice when needed\nPrepare and manage new business bids\nMake price adjustments according to client requirements\n"
  },
  {
    value: 38,
    jobFunc: 6,
    text: "Tax Associate",
    assessment: "sit with clients to interview them regarding their annual income and expenses so that they can file the correct form, prepare filings, and include as many deductions as possible to reduce the client’s tax obligation\n In addition to interviewing the client, the associate will use financial records and other statements to use adjustments and keep the person or company’s tax liability as low as possible while still complying with the tax law\n"
  },
  {
    value: 39,
    jobFunc: 6,
    text: "Financial Due Diligence Associate",
    assessment: "Participate in buy-side and sell-side transaction advisory engagements, providing financial and commercial due diligence assistance, and accounting advisory services including IPO assistance, carve-outs,"
  },
  {
    value: 40,
    jobFunc: 6,
    text: "Tax Analyst",
    assessment: "Prepare all financial information and provide required documents and prepare all sales and excise tax returns and ensure compliance to all Form 1099 and design all projections for tax credits\nMaintain and reconcile all tax general ledger accounts and evaluate all account balances and prepare all tax returns and schedule for same and perform regular audits on all tax returns\nAnalyze all accounting information and prepare required paperwork\n"
  },
  {
    value: 41,
    jobFunc: 6,
    text: "Financial Services Advisory Banking Tech Payments Associate",
    assessment: "contacting clients and setting up meetings, either within an office environment or in clients' homes or business premises\nconducting in-depth reviews of clients' financial circumstances, current provision and future aims\nanalysing information and preparing plans best suited to individual clients' requirements\ncompleting risk analyses;"
  },
  {
    value: 42,
    jobFunc: 6,
    text: "Actuarial Associate",
    assessment: "Support actuarial function by applying quantitative skills and analytical methods\n Analyze data and present preliminary conclusions to supervisors\n"
  },
  {
    value: 43,
    jobFunc: 6,
    text: "Actuarial Analyst",
    assessment: "Support actuarial function by applying quantitative skills and analytical methods\n Analyze data and present preliminary conclusions to supervisors\n"
  },
  {
    value: 45,
    jobFunc: 2,
    text: "Contract Recruiter",
    assessment: "Source and hire candidates through various channels with appropriate qualifications and necessary references\nScreen candidates and check references\nDevelop appropriate logistics and strategies for recruiting\nDevelop appropriate roles for assigned positions\nDevelop strategies to build diversified talent pool\n"
  },
  {
    value: 46,
    jobFunc: 2,
    text: "Benefits Administrator",
    assessment: "A benefits administrator has numerous responsibilities within a company’s human resources department\n The job description of a benefits administrator involves overseeing the systems of compensation and benefits of a company\nPosition Description\nBenefits administrators perform tasks related to job analysis, pension research, attendance monitoring and workers’ compensation as well as other benefits\nEssential Duties and Responsibilities of a Benefits Administrators"
  },
  {
    value: 47,
    jobFunc: 2,
    text: "HR Administrative Assistant",
    assessment: "Provides job candidates by screening, interviewing, and testing applicants; notifying existing staff of internal opportunities; maintaining personnel records; obtaining temporary staff from agencies\nPays employees by calculating pay; distributing checks; maintaining records\nAdministers student loan, medical insurance, savings bond, and disability programs by advising employees of eligibility; providing application information; helping with form completion; verifying submission; notifying employees of approvals\n"
  },
  {
    value: 48,
    jobFunc: 2,
    text: "Employee Relations Manager",
    assessment: "Administer all working of employees and ensure compliance to all programs and policies and develop good professional relations with all employees\nDevelop various tools to assist all employees in effective resolutions of all issues and provide required feedback to all supervisors and production managers to ensure effective in performance\n"
  },
  {
    value: 49,
    jobFunc: 2,
    text: "HR Coordinator",
    assessment: "Coordinate with various team to maintain efficient recruitment process and evaluate all applications and perform phone interviews and screen all candidates and participate in all jobs fairs and other associated events\nCoordinate with HR Generalist to compile all information for salary and job offers and manage all correspondence with employees and prepare required paperwork and manage an efficient applicant system\nDesign all sourcing strategies for advertising procedures and coordinate with HR team to implement all recruitment strategies and assist all management with various employment processes\n"
  },
  {
    value: 50,
    jobFunc: 2,
    text: "Payroll Administrator",
    assessment: "Prepare and manage payroll processes of employees\nGather all payroll related data\nReview and calculate timesheets data and hours worked\nCalculate salaries, wages and overtime wage sheets\nCreate and run salary sheets and reports\nManage, maintain and update payroll related data\nUpdate salary sheets and schedules\n"
  },
  {
    value: 51,
    jobFunc: 2,
    text: "Compensation Analyst",
    assessment: "Assist all client groups for all compensation related issues and develop and implement various compensation programs and evaluate all changes in salaries according to required organization policies\nAdminister and implement all compensation policies and programs and perform research to gather all information for compensation and prepare required strategies for same\n"
  },
  {
    value: 52,
    jobFunc: 2,
    text: "Training Coordinator",
    assessment: "Map out training plans, design and develop training programs (outsourced or in-house)\nChoose appropriate training methods per case (simulations, mentoring, on the job training, professional development classes etc)\nMarket available training opportunities to employees and provide necessary information\nConduct organisation wide needs assessment and identify skills or knowledge gaps that need to be addressed\nUse accepted education principles and track new training methods and techniques"
  },
  {
    value: 53,
    jobFunc: 2,
    text: "Category Manager, HR",
    assessment: "-Lead ongoing category mgmt activities within assigned scope of spend categories to achieve business objectives & benefit targets\n-Drive development of supplier & industry category profiles\n-Identify & leverage clients company-wide spend opportunities\n-Lead supplier selection & recommendation activities including qualitative/quantitative analysis, selection criteria, long/short lists, RFI/RFP development & analysis\n-Develop & execute sourcing strategies for highest spend, greatest complexity & most critical/strategic categories\n-Drive development of high level & detailed benefits cases\n-Provide strategic guidance to profiles & Total Cost of Ownership models used to support sourcing decisions"
  },
  {
    value: 55,
    jobFunc: 3,
    text: "Administrative Assistant",
    assessment: "Maintains workflow by studying methods; implementing cost reductions; and developing reporting procedures\nCreates and revises systems and procedures by analyzing operating practices, recordkeeping systems, forms control, office layout, and budgetary and personnel requirements; implementing changes\nDevelops administrative staff by providing information, educational opportunities, and experiential growth opportunities\nResolves administrative problems by coordinating preparation of reports, analyzing data, and identifying solutions\n"
  },
  {
    value: 56,
    jobFunc: 3,
    text: "Administrative Coordinator",
    assessment: "Maintains administrative workflow by studying methods; implementing cost reductions; developing reporting procedures\nGuides employee actions by researching, developing, writing, and updating administrative policies, procedures, methods, and guidelines; communicating developments to management\nCompletes administrative projects by identifying and implementing new technology and resources; redesigning systems; recommending re-deployment of designated resources\nAccomplishes department and organization mission by completing related results as needed\n"
  },
  {
    value: 57,
    jobFunc: 3,
    text: "Administrative Manager",
    assessment: "Maintains administrative staff by recruiting, selecting, orienting, and training employees; maintaining a safe and secure work environment; developing personal growth opportunities\nAccomplishes staff results by communicating job expectations; planning, monitoring, and appraising job results; coaching, counseling, and disciplining employees; initiating, coordinating, and enforcing systems, policies, and procedures\nProvides supplies by identifying needs for reception, switchboard, mailroom, and kitchen; establishing policies, procedures, and work schedules\n"
  },
  {
    value: 58,
    jobFunc: 3,
    text: "Data Entry",
    assessment: "Insert customer and account data by inputting text based and numerical information from source documents within time limits\nCompile, verify accuracy and sort information according to priorities to prepare source data for computer entry\nReview data for deficiencies or errors, correct any incompatibilities if possible and check output\nApply data program techniques and procedures"
  },
  {
    value: 60,
    jobFunc: 3,
    text: "Office Manager",
    assessment: "Maintains office services by organizing office operations and procedures; preparing payroll; controlling correspondence; designing filing systems; reviewing and approving supply requisitions; assigning and monitoring clerical functions\nProvides historical reference by defining procedures for retention, protection, retrieval, transfer, and disposal of records\nMaintains office efficiency by planning and implementing office systems, layouts, and equipment procurement\nDesigns and implements office policies by establishing standards and procedures; measuring results against standards; making necessary adjustments\nCompletes operational requirements by scheduling and assigning employees; following up on work results\n"
  },
  {
    value: 61,
    jobFunc: 3,
    text: "Receptionist",
    assessment: "Welcomes visitors by greeting them, in person or on the telephone; answering or referring inquiries\nDirects visitors by maintaining employee and department directories; giving instructions\nMaintains security by following procedures; monitoring logbook; issuing visitor badges\nMaintains telecommunication system by following manufacturer's instructions for house phone and console operation\n"
  },
  {
    value: 62,
    jobFunc: 3,
    text: "Executive Assistant",
    assessment: "Provide support to all administrative procedures and coordinate with customers and employees and receive and screen all incoming calls and maintain documents of all scan and fax copies\nManage all correspondence with staff and customers and monitor office supply inventory and assist to make all required travel arrangements for staff and ensure efficient greetings for all employees and visitors and resolve all complex issues\n"
  },
  {
    value: 63,
    jobFunc: 3,
    text: "Office Assistant",
    assessment: "Forwards information by receiving and distributing communications; collecting and mailing correspondence; copying information\nMaintains supplies by checking stock to determine inventory levels; anticipating requirements; placing and expediting orders; verifying receipt; stocking items; delivering supplies to work stations\nMaintains equipment by completing preventive maintenance; troubleshooting failures; calling for repairs; monitoring equipment operation; monitoring and purchasing meter fund"
  },
  {
    value: 64,
    jobFunc: 3,
    text: "Senior Support Assistant",
    assessment: "Assist support clerks in their daily activities and functions in a business unit\nAssist and support patients and their families in care delivery setting\nAssist and support patients and their families in processing finance and insurance issues\nAssist administrative department in maintaining and organizing files and documents\n"
  },
  {
    value: 65,
    jobFunc: 4,
    text: "Account Manager",
    assessment: "Manage every aspect of allotted territory responsibilities\nImplement and conduct marketing programs as well as message\nProvide target aesthetic device sales to all qualified aesthetic practices following company direction\nAttain sales objectives as well as customer satisfaction consistently\n"
  },
  {
    value: 66,
    jobFunc: 4,
    text: "Advertising Sales Representative",
    assessment: "Introduce sales strategies and approaches to achieve sales and revenue goals\nDevelop sales proposals and sales orders for customers\nProvide excellent customer services to ensure customer satisfaction\nAddress customer queries in a timely manner\nAnalyze customer complaints and provide appropriate resolutions\nCoordinate with Advertising Director to create multi platform ad campaigns to increase revenue\n"
  },
  {
    value: 67,
    jobFunc: 4,
    text: "Area Sales Manager",
    assessment: "Manage sales initiatives and operations in the assigned area\nSupervise and guide sales team in achieving revenue target\nDevelop positive client relationship for repeat business and new opportunities\nProvide expert sales solutions to meet company objectives\nConduct sales presentations to customers when needed\nAddress customer issues and queries in a timely manner to ensure customer satisfaction\n"
  },
  {
    value: 68,
    jobFunc: 4,
    text: "B2B Corporate Sales",
    assessment: "To identify & develop new business opportunities in B2B channel \n- To act effectively as team player with company management / colleagues taking proactive role in improving overall company performance\n- To establish / build long term efficient relationship with clients in targeted channel / market\n- Manage customers’ needs / expectation in line of company guidelines to ensure win / win relation"
  },
  {
    value: 69,
    jobFunc: 4,
    text: "Distribution Sales Representative",
    assessment: "Make daily customer visits\n Follow-up on customer quotations\n Perform basic relationship building on a daily basis\nProvide technical training or technical information to distributor sales staff\nProvide feedback reports to the Regional Sales Manager regarding customer contacts\n Collect as much information regarding the sales process from distributors in the territory\nAssist the Regional Sales Manager in the planning, forecasting, and management of the sales territory\nRepresent the company at open houses, trade shows, and industry groups\n"
  },
  {
    value: 71,
    jobFunc: 4,
    text: "Retail Store Manager",
    assessment: "Completes store operational requirements by scheduling and assigning employees; following up on work results\nMaintains store staff by recruiting, selecting, orienting, and training employees\nMaintains store staff job results by coaching, counseling, and disciplining employees; planning, monitoring, and appraising job results\nAchieves financial objectives by preparing an annual budget; scheduling expenditures; analyzing variances; initiating corrective actions\nIdentifies current and future customer requirements by establishing rapport with potential and actual customers and other persons in a position to understand service requirements\n"
  },
  {
    value: 72,
    jobFunc: 4,
    text: "Insurance Sales Representative",
    assessment: "Sell insurance policies to potential clients\nHelp individuals, businesses, and families select the most appropriate policies for health, life, and properties\nOffer property and casualty, life, health, disability, and long-term care insurance\nSell policies that protect individuals and businesses from financial loss resulting from automobile accidents, fire, theft, storms, and other events that can damage property\nPay beneficiaries when policyholders die\n"
  },
  {
    value: 73,
    jobFunc: 4,
    text: "Sales Operation Coordinator",
    assessment: "Perform as prime point of contact to main constituents or media partners in market launch\nPerform externally with all main constituents as well as media partners to convey online plus offline marketing program information and help with internal deployment\nEstablish plus coordinate events of in-market to facilitate drive merchant along with consumer engagement\n"
  },
  {
    value: 74,
    jobFunc: 4,
    text: "Sales Trainee",
    assessment: "Learns sales administration by completing rotation in sales office functions\nLearns sales process by completing training program; completing study assignments\nObserves sales process by traveling with sales representatives; attending sales and service calls\nPractices sales process by calling on existing and then new accounts; adhering to established sales steps\nUpdates job knowledge by participating in educational improvement opportunities; reading sales and marketing publications; maintaining personal networks; participating in sales and marketing organizations\nAccomplishes sales and organization mission by completing related results as needed\n"
  },
  {
    value: 75,
    jobFunc: 5,
    text: "Advertising Campaign Manager",
    assessment: "Plan, direct, or coordinate advertising policies and programs or produce collateral materials, such as posters, contests, coupons, or give-aways, to create extra interest in the purchase of a product or service for a department, an entire organization, or on an account basis\n"
  },
  {
    value: 76,
    jobFunc: 5,
    text: "Creative Director",
    assessment: "Accomplishes work requirements by orienting, training, assigning, scheduling, coaching employees\nMeets work standards by following production, productivity, quality, and customer-service standards; resolving operational problems; identifying work process improvements\nMeets cost standards by monitoring expenses; implementing cost-saving actions\nDevelops basic presentation approaches by reviewing materials and information presented by client\nDetermines production requirements by reviewing client requirements; considering scheduling factors\nDetermines production schedule by conferring with heads of art, copy writing, and production departments; outlining basic presentation concepts; coordinating creative activities\n"
  },
  {
    value: 77,
    jobFunc: 5,
    text: "Digital Media Planner",
    assessment: "working with the client and the account team to understand the client's business objectives and advertising strategy\nliaising with the creative agency team, clients and consumers to develop media strategies and campaigns\nrecommending the most appropriate types of media to use, as well as the most effective time spans and locations\nworking with colleagues, other departments and media buyers either in-house or in a specialist agency;"
  },
  {
    value: 78,
    jobFunc: 5,
    text: "Media Research Analyst",
    assessment: "Execute all types of measurement, reporting, and analysis for media campaigns, including display, video, mobile, search, social, and television\nManage external agencies to produce regular and ad hoc campaign reports, drawing out insights and optimizations related to media objectives, and clearly communicating results to internal and external stakeholders\nWork with media managers to develop proper naming convention methodology based on campaign-specific and franchise-specific KPIs\n Use Tableau to design dashboard visualizations around media performance for various franchise campaigns\n"
  },
  {
    value: 79,
    jobFunc: 5,
    text: "Target Marketing Strategist",
    assessment: "Develops unique strategies and builds upon current client strategies within\nthe digital arena to meet/exceed objectives\n Executes projects to be high quality, on time and cost-effective/on budget\n Fosters timeline development and monitors progress, ensuring deadlines\nare met\n Manages overall project scope and ensures staffing assumptions adhere\nto budget\n Develops strong, trusting relationships between clients and agency\npartners, providing leadership and support during strategy, ideation, and \nexecution"
  },
  {
    value: 80,
    jobFunc: 5,
    text: "Brand Manager",
    assessment: "Monitor, measure and manage brand equity/strength\nIncrease brand awareness, relevant differentiation, value, accessibility and emotional connection\nDevelop brand plan\nMonitor progress against brand plan\nBe responsible for results against brand plan\nDrive brand understanding and support throughout the organization"
  },
  {
    value: 81,
    jobFunc: 5,
    text: "Marketing Director",
    assessment: "Contributes to marketing effectiveness by identifying short-term and long-range issues that must be addressed; providing information and commentary pertinent to deliberations; recommending options and courses of action; implementing directives\nObtains market share by developing marketing plans and programs for each product; directing promotional support\nMaintains relations with customers by organizing and developing specific customer- relations programs; determining company presence at conventions, annual meetings, trade associations, and seminars\nProvides short- and long-term market forecasts and reports by directing market research collection, analysis, and interpretation of market data\n"
  },
  {
    value: 82,
    jobFunc: 5,
    text: "Marcomm Supervisor",
    assessment: "Supervise strategy of integrated marketing communication (MarCom) and programs for market segment\nDevelop and present value story related to marketing communications\nAnalyze and prepare for potential crises as well as catastrophes impacting organization’s image and reputation\nDevelop suitable communication strategies to mitigate prevailing crisis\nSupervise messaging from joint ventures to assure consistent general messaging plus communication strategy\n"
  },
  {
    value: 83,
    jobFunc: 5,
    text: "Internet Marketing Coordinator",
    assessment: "organize planning strategies to increase the visibility of a company online\n By integrating many traditional marketing techniques in the digital world, these professionals manage web strategy – from development to continued support\nhelp to ensure that content and online advertising efforts are progressing smoothly\n study market research to gain information about what consumers are interested in, and then develop strategies to publish content that reflects those interests\n"
  },
  {
    value: 84,
    jobFunc: 5,
    text: "Digital Brand Manager",
    assessment: "researching consumer markets, monitoring market trends and identifying potential areas in which to invest, based upon consumer needs and spending habits\nlooking at the pricing of products and analysing the potential profitability\ngenerating names for new and existing products and services, coming up with ideas for new packaging designs, including shape, size, colours, fonts and imagery\noverseeing the production of TV adverts, newspaper and magazine advertisements, direct mail packs, email campaigns, websites, exhibition stands, road shows and liaising with art designers, copywriters, media buyers and printers"
  },
  {
    value: 85,
    jobFunc: 6,
    text: "Accounting Clerk",
    assessment: "Maintains accounting records by making copies; filing documents\nReconciles bank statements by comparing statements with general ledger\nMaintains accounting databases by entering data into the computer; processing backups\nVerifies financial reports by running performance analysis software program\n"
  },
  {
    value: 86,
    jobFunc: 6,
    text: "Accounting Manager",
    assessment: "Accomplishes accounting human resource objectives by recruiting, selecting, orienting, training, assigning, scheduling, coaching, counseling, and disciplining employees; communicating job expectations; planning, monitoring, appraising, and reviewing job contributions; planning and reviewing compensation actions; enforcing policies and procedures\nAchieves accounting operational objectives by contributing accounting information and recommendations to strategic plans and reviews; preparing and completing action plans; implementing production, productivity, quality, and customer-service standards; resolving problems; completing audits; identifying trends; determining system improvements; implementing change\n"
  },
  {
    value: 87,
    jobFunc: 6,
    text: "Audit Supervisor",
    assessment: "Supervise Internal Audit staff performance while conducting on-site financial and operational audits of different complexity and scope\nConvey audit status to apt management and internal business units\nLead proactively audit planning efforts\nDefine internal audit project scope and approval timeframe\nEnsures internal audits are resourced and completed properly\n"
  },
  {
    value: 88,
    jobFunc: 6,
    text: "Budget Analyst",
    assessment: "Work with program and project managers to develop the organization's budget\nReview managers' budget proposals for completeness, accuracy, and compliance with laws and other regulations\nCombine all the program and department budgets together into a consolidated organizational budget and review all funding requests for merit\nExplain their recommendations for funding requests to others in the organization, legislators, and the public\nHelp the chief operations officer, agency head, or other top managers analyze proposed plans and find alternatives if the projected results are unsatisfactory\nMonitor organizational spending to ensure that it is within budget"
  },
  {
    value: 89,
    jobFunc: 6,
    text: "Chief Financial Officer",
    assessment: "Accomplishes finance human resource strategies by determining accountabilities; communicating and enforcing values, policies, and procedures; implementing recruitment, selection, orientation, training, coaching, counseling, disciplinary, and communication programs; planning, monitoring, appraising, and reviewing job contributions; planning and reviewing compensation strategies\nDevelops finance organizational strategies by contributing financial and accounting information, analysis, and recommendations to strategic thinking and direction; establishing functional objectives in line with organizational objectives\n"
  },
  {
    value: 90,
    jobFunc: 6,
    text: "Controller",
    assessment: "Guides financial decisions by establishing, monitoring, and enforcing policies and procedures\nProtects assets by establishing, monitoring, and enforcing internal controls\nMonitors and confirms financial condition by conducting audits; providing information to external auditors\nMaximizes return, and limits risk, on cash by minimizing bank balances; making investments\nPrepares budgets by establishing schedules; collecting, analyzing, and consolidating financial data; recommending plans\nAchieves budget objectives by scheduling expenditures; analyzing variances; initiating corrective actions\nProvides status of financial condition by collecting, interpreting, and reporting financial data\nPrepares special reports by collecting, analyzing, and summarizing information and trends\n"
  },
  {
    value: 91,
    jobFunc: 6,
    text: "Tax Specialist",
    assessment: "Develop and maintain all account reconciliations\nSearch and solve tax account balance problems with different tax agencies\nConduct sales tax audits and utilize tax for entire US Agfa legal entities\nPrepare personal property tax renditions for every Agfa US legal entity\nHead responsibility for personal property tax as well as real estate tax payments for entire Agfa US legal entities\n"
  },
  {
    value: 92,
    jobFunc: 6,
    text: "Collector",
    assessment: "Extract from the database all unpaid and long pending account dues\nCommunicate with customers relating their pending payments\nManage and update customer database\nAssist sales and marketing in follow-up of payments\nEnsure delinquent account debtors to meet their debt obligations\nDesign, initiate and implement effective collection procedures and processes\n"
  },
  {
    value: 93,
    jobFunc: 6,
    text: "Contracts and Financial Compliance Manager",
    assessment: "ensures that a company's operations adhere to the laws regulating the particular industry\n Specific duties and responsibilities will, therefore, vary by industry\n"
  },
  {
    value: 94,
    jobFunc: 6,
    text: "Cost Accountant",
    assessment: "Collect operational data and make analyses reports to forecast expenses and budgets\nCollect production data, maintenance and inventory control data\nManage and coordinate annual physical counts and cycle counts in a plant\nEvaluate production costs, gains & losses and month-end closing data\nForecast, prepare and implement a plant’s budget\nCollect and analyze past years data to forecast budget for the ensuing year\n"
  },
  {
    value: 95,
    jobFunc: 8,
    text: "Graphic Designer",
    assessment: "Create multiple design options for clients\nUnderstand project requirements and adhere to client specifications\nAdhere to aesthetic design style guides, procedures, systems and templates\nCreate and design advertising circular page layouts\nCreate sale signs with strong concepts and designs\nAssist and support software engineers in executing projects successfully and on time\n"
  },
  {
    value: 96,
    jobFunc: 8,
    text: "Senior Web Designer",
    assessment: "Architect and develop web designing applications appropriate to clients’ needs and requirements\nDevelop programming features and enhancements\nPrepare flowcharts, diagrams, functional requirements and documentation\nExecute current design trends and techniques in web applications\nDevelop site architecture and functionalities including content development\n"
  },
  {
    value: 97,
    jobFunc: 8,
    text: "UI Graphic Designer",
    assessment: "Initiate and implement fundamental usability and aesthetic properties in user interface designs\nDetermine and define software user interface designs to customers\nDevelop software user interface with specifications appropriate to products or projects\nCoordinate and collaborate with software professionals, graphic artists and others on assigned projects\n"
  },
  {
    value: 98,
    jobFunc: 8,
    text: "UX Graphic Designer",
    assessment: "Participate in user research as well as learning about end-users\nInform user experience design with learning\nExecute incremental improvements and radical changes to Dealix web sites\nEnsure to push boundaries of what’s probable to develop better experiences for users as well as customers\nWrite comprehensive User Experience Specifications for product, engineering and marketing use\n"
  },
  {
    value: 100,
    jobFunc: 8,
    text: "Game Designer",
    assessment: "Work with Architects and Engineers to design and develop interactive games\nMake enhancements to existing games to improve gaming experience\nDevelop game proposals and concepts for new game applications\nIdentify story, aesthetic, mechanics, meta-structure and pacing for assigned game projects\nDevelop functional and technical design documents for projects\n"
  },
  {
    value: 101,
    jobFunc: 8,
    text: "Mobile App UX Designer",
    assessment: "Developed graphics, content, process flow diagrams and information architecture components\nPrepared media banners and solutions in coordination with media team members\nAssisted in development and maintenance of mobile design mockups and specifications\nImplemented procedures for completion of design concepts, layouts and UI details\nParticipated in all phases of design development lifecycle for new products and features\nCoordinated with mobile development teams for programming, testing and launching of feature sets\nProvided technical assistance for creation and optimization of graphics for development purpose\nSupported technical team members in designing of user flows, prototypes and scenarios\n"
  },
  {
    value: 102,
    jobFunc: 8,
    text: "2D or 3D animator",
    assessment: "Develop 3D multimedia projects involving computer graphics\nCoordinate and create illustrations, scanning and photo retouching\nUse imagination, judgment, skill, and experience to design life-like animations\nCreate 3D art animation assets for interactive productions\nDesign brochures, logos, presentations, print ads as needed\nCooperate with the production staffs to analyze and understand the 3D graphic requests\n"
  },
  {
    value: 103,
    jobFunc: 8,
    text: "Visual Designer",
    assessment: "meet with art directors and clients\n They often plan a design in advance and go through a process of sketching, market research and submitting proposals to ensure that their design is what their employer has in mind\n They rely increasingly on design software to lay out their designs\n Designers working in print media, such as newspapers, magazines and journals, are usually responsible for developing the overall layout of the publication and must produce work according to a deadline\n"
  },
  {
    value: 106,
    jobFunc: 8,
    text: "Junior Creative Designer",
    assessment: "\nDesign and creation of marketing and communication materials for various mediums (print and digital) including but not limited to flyers, brochures, presentations, direct mail, websites, email, social media, diagrams, logos, etc\nImplement design for products and all marketing related materials for business units\nManagement and adherence to brand standards and copyright images/logos usage guidelines"
  },
  {
    value: 107,
    jobFunc: 17,
    text: "Web Content Editor",
    assessment: "producing new content and writing it in an interesting and appealing manner\nsourcing images and artwork, and commissioning photographers planning the style of copy required and the frequency with which it will need updating\ncreating schedules and agreeing deadlines\nproducing new content and writing it in an interesting and appealing manner\nidentifying suitable subjects for interview"
  },
  {
    value: 108,
    jobFunc: 17,
    text: "Typewriter",
    assessment: "Check completed work for spelling, grammar, punctuation, and format\nPerform other clerical duties such as answering telephone, sorting and distributing mail, running errands or sending faxes\nGather, register, and arrange the material to be typed, following instructions\nType correspondence, reports, text and other written material from rough drafts, corrected copies, voice recordings, dictation or previous versions, using a computer, word processor, or typewriter\n"
  },
  {
    value: 109,
    jobFunc: 17,
    text: "Technical Writer",
    assessment: "Work with internal teams to obtain an in-depth understanding of the product and the documentation requirements\nAnalyze existing and potential content, focusing on reuse and single-sourcing opportunities\nCreate and maintain the information architecture\nProduce high-quality documentation that meets applicable standards and is appropriate for its intended audience\nWrite easy-to-understand user interface text, online help and"
  },
  {
    value: 110,
    jobFunc: 17,
    text: "Data Entry",
    assessment: "Prepares source data for computer entry by compiling and sorting information; establishing entry priorities\nProcesses customer and account source documents by reviewing data for deficiencies; resolving discrepancies by using standard procedures or returning incomplete documents to the team leader for resolution\nEnters customer and account data by inputting alphabetic and numeric information on keyboard or optical scanner according to screen format\nMaintains data entry requirements by following data program techniques and procedures\n"
  },
  {
    value: 111,
    jobFunc: 17,
    text: "Content Specialist",
    assessment: "Assess and test product documentation\nCompile and test online help systems\nDevelop, write and maintain Training materials for clients and internal employees\nExecute internal processes to create documentation and content\nResearch and collect information for departmental and company communication\n"
  },
  {
    value: 112,
    jobFunc: 17,
    text: "Web Content Creator",
    assessment: "Perform ad hoc research to develop and produce new web based and print content\nFunction as moderator and administrator for onsite asynchronous message boards and blogs\nDraft email newsletters weekly to produce thousands of dollars in revenues every day\nAdd to creative and strategic ideas for online marketing initiatives of EducationDynamics\n"
  },
  {
    value: 113,
    jobFunc: 17,
    text: "Translator",
    assessment: "reading through original material and rewriting it in the target language, ensuring that the meaning of the source text is retained\nusing Translation Memory software, such as Wordfast, memoQ, across, SDL Trados and Transit NXT, to ensure consistency of translation within documents and help efficiency\nusing specialist dictionaries, thesauruses and reference books to find the closest equivalents for terminology and words used;"
  },
  {
    value: 115,
    jobFunc: 17,
    text: "Interpreter",
    assessment: "assimilating speakers' words quickly, including jargon and acronyms\nbuilding up specialist vocabulary banks\nwriting notes to aid memory\nusing microphones and headsets\npreparing paperwork - considering agendas before meetings, or lectures and speeches when received in advance;"
  },
  {
    value: 116,
    jobFunc: 17,
    text: "Assistant News Editor",
    assessment: "supporting editorial staff in all activities leading to publication, including acting as a personal assistant to commissioning editors and overseeing tasks such as issuing contracts and dealing with royalties\nliaising with other in-house teams, writers, photographers, printers, designers and production staff to negotiate and monitor timescales for stages in the publishing process\ndealing with the administration of work commissioned to freelance writers, picture researchers, photographers, stylists and illustrators;"
  },
  {
    value: 117,
    jobFunc: 17,
    text: "Copy Writer",
    assessment: "Draft compelling, benefits copy for business catalogs, web stores, articles and press releases\nInput to catalog layout and merchandising\nCreate, implement and analyze promotions\nManage and enhance product category database\nProof copy to check information correctness\n"
  },
  {
    value: 118,
    jobFunc: 18,
    text: "Application Developer",
    assessment: "Identify, create and define the application requirements\nDefine data structures and application solutions\nDefine application solutions appropriate to customer requirements\nCode, document and implement project specifications programs\nTest, code and perform unit test plan for programs assigned\nDesign and build prototypes and designs\nManage websites for high search engine rankings\n"
  },
  {
    value: 119,
    jobFunc: 18,
    text: "Chief Technology Officer",
    assessment: "Identify opportunities and risks for the business\nManage research and development (R&D)\nMonitor technology and social trends that could impact the company\nParticipate in management decisions about corporate governance\nCommunicate the company's technology strategy to partners, management, investors and employees\n"
  },
  {
    value: 120,
    jobFunc: 18,
    text: "Computer Systems Manager",
    assessment: "Manage backup, security and user help systems\nConsult with users, management, vendors, and technicians to assess computing needs and system requirements\nDirect daily operations of department, analyzing workflow, establishing priorities, developing standards and setting deadlines\nAssign and review the work of systems analysts, programmers, and other computer-related workers\nStay abreast of advances in technology\n"
  },
  {
    value: 121,
    jobFunc: 18,
    text: "Data Center Support Specialist",
    assessment: "Analyze and determine appropriate layout of all equipments in data center with help of balancing and cooling\nMonitor and supervise all data center solutions\nAssist various departments in installations and removal of data center hardware as per requirement\nDocument all power and space schematics and ensure accuracy in same\n"
  },
  {
    value: 122,
    jobFunc: 18,
    text: "Database Administrator",
    assessment: "Develop database, design appropriate frameworks and prepare reports according to operation guidelines\nMaintain all data, perform data recovery according to requirements and ensure compliance to all policies and procedures\nAssist various departments in designing and testing various databases across multiple platforms\nManage various database technologies and assist in various application development projects\n"
  },
  {
    value: 123,
    jobFunc: 18,
    text: "Help Desk Specialist",
    assessment: "Improve information sharing and decrease team stress by building teamwork\nBuild analysts’ skills and meet skill requirements by coordinating with higher level agents and Management\nAccomplish agent skill building through training and coaching\nHandle work requests to ensure quality work during non-phone time or when Dealer Help Desk has low call volume\n"
  },
  {
    value: 124,
    jobFunc: 18,
    text: "IT Systems Administrator",
    assessment: "Design all servers and maintain effective performance of all systems and assist to install and provide enhancements to all existing servers and configure all hardware and associate peripherals and execute and maintain network infrastructure for all IT applications\nAdminister and develop effective enterprise storage system and maintain high performance for same and assist to configure all network equipments and data center systems for clients and evaluate availability of peripherals for smooth functioning of system\n"
  },
  {
    value: 125,
    jobFunc: 18,
    text: "Senior Network Engineer",
    assessment: "Install,\tsupport\tand\tmaintain\thardware\tand\tsoftware\tinfrastructure\taccording\tto\tbest\t\npractices,\tincluding\trouters,\taggregators,\tswitches,\twifi\tcontrollers,\tand\tfirewalls\n Perform\tnetwork\tsecurity\tdesign\tand\tintegration\n Diagnose\tproblems\tand\tsolve\tissues,\toften\tunder\ttime\tconstraints\n Provide\tnetwork\tand\thost\tbased\tsecurity,\tincident\tresponse,\tfirewall\tand\tVPN\t\nmanagement\tand\tadministration\t\n Implement the\tnecessary\tcontrols\tand\tprocedures\tto\tprotect\tinformation\tsystems\tassets\t\nfrom\tintentional\tor\tinadvertent modification,\tdisclosure,\tor\tdestruction;"
  },
  {
    value: 126,
    jobFunc: 18,
    text: "Network Systems Administrator",
    assessment: "Designing and planning the network\nSetting up the network\nMaintaining the network\nExpanding the network Adding new host machines to the network\nAdministering network security\nAdministering network services, such as NFSTM services, name services, and electronic mail\nTroubleshooting network problems"
  },
  {
    value: 127,
    jobFunc: 18,
    text: "Network Architect",
    assessment: "Provide technical backup to architectural designs and oversaw external clientele for global marketing field\nDesign schemes and provide effective future plan to increase organization skill and reinforce architectural network\nConduct analysis in the sphere of business field to support the growth oriented architectural projects\nPerform research programs for IT sector as well as in various technical spheres\n"
  },
  {
    value: 128,
    jobFunc: 7,
    text: "Conciliator",
    assessment: "Review and evaluate information from documents such as claim applications, birth or death certificates, and physician or employer records\nSet up appointments for parties to meet for mediation\nUse mediation techniques to facilitate communication between disputants, to further parties' understanding of different perspectives, and to guide parties toward mutual agreement\nAuthorize payment of valid claims\nDetermine existence and amount of liability, according to evidence, laws, and administrative and judicial precedents\nIssue subpoenas and administer oaths to prepare for formal hearings\n"
  },
  {
    value: 129,
    jobFunc: 7,
    text: "Consultant",
    assessment: "Improve Law Firm’s profitability and efficiency using legal practice knowledge\nAdvise solutions for client development strategies, marketing and productivity\nConsult on legal and program issues to actively manage risks\nAnalyze problems and develop solutions for meeting parent company’s objectives\nReview, draft and negotiate legal documents\n"
  },
  {
    value: 131,
    jobFunc: 7,
    text: "Lawyer",
    assessment: "Communicate with clients\nMaintain confidentiality of the client and case\nStrengthen their client’s case\nAssist clients with legal matters\nProvide legal advice and counseling to clients\n"
  },
  {
    value: 132,
    jobFunc: 7,
    text: "Legal Analyst",
    assessment: "Handle paper document collection, track, scan and code\nHandle electronic data collection, tracking, production and conversion\nCoach legal teams on Ringtail Casebook, Lotus Notes and MS Access\nEducate policies and procedures to legal teams\nTrack and communicate project status and issues to legal teams\n"
  },
  {
    value: 133,
    jobFunc: 7,
    text: "Law Firm Administrator",
    assessment: "Execute legal research using automated research services and other methods\nPerform with external and internal legal staff on different projects\nConduct interviews and collect information from law clients and others\nDraft and prepare pleadings, correspondence and other documents related to law\nCollect and arrange documents, exhibits, trial data and other materials requiring case management\n"
  },
  {
    value: 134,
    jobFunc: 7,
    text: "Legal Specialist",
    assessment: "Collect and update databases for tracking and corporate entity formation\nGather and facilitate invoice approval\nFacilitate bank account formation, tax and regulatory filings and corporate restructurings\nReview contracts and legally direct procedures\nMonitor hospital Lien process for court recording and satisfaction\n"
  },
  {
    value: 135,
    jobFunc: 7,
    text: "Court Reporter",
    assessment: "Attend depositions, hearings, proceedings, and other events that require written transcripts\n Capture spoken dialogue with specialized equipment, including stenography machines, video and audio recording devices, and covered microphones\n"
  },
  {
    value: 137,
    jobFunc: 7,
    text: "Legal Secretary",
    assessment: "Provide paralegal, secretarial support to lawyers\nInitiate basic legal research and make notes appropriate to the case\nAnswer phone calls from clients and respond to their inquiries\nHandle clients and their legal problems\nPrepare and file all legal documents\nReview, verify and route correspondence, files, legal documents and reports\nCreate and maintain database of clients including complete history of the legal cases\n"
  },
  {
    value: 138,
    jobFunc: 9,
    text: "Training Consultant",
    assessment: "identifying training and development needs within an organisation through job analysis, appraisal schemes and regular consultation with business managers and human resources departments\ndesigning and expanding training and development programmes based on the needs of the organisation and the individual\nworking in a team to produce programmes that are satisfactory to all relevant parties in an organisation, such as line managers, accountants and senior managers at board level;"
  },
  {
    value: 139,
    jobFunc: 9,
    text: "Learning Analyst",
    assessment: "Contributes to development of Learning & Development strategy, roadmap and key metrics/dashboard\nAssesses training & development needs in the organization by analyzing key metrics, facilitating conversations with management and leadership, and seeking input from employees\nEmpowers managers and employees in the organization to drive and deliver training solutions grounded in instructional design and become stellar trainers by providing frameworks and structures and improving their training skills\n"
  },
  {
    value: 140,
    jobFunc: 9,
    text: "Life Coach",
    assessment: "Meet with clients to discuss needs and goals\nDevelop strategies and plans for clients\nKeep records of client progress\nMeet with and evaluate clients\nAdjust clients’ goal strategies as needed"
  },
  {
    value: 142,
    jobFunc: 9,
    text: "Learning Officer",
    assessment: "Write desk guides and program management to maintain organizational quality standards\nAdapt curriculum for face-to-face training in synchronous or asynchronous delivery modes\nFollow strict production schedules and meet aggressive deadlines\nDraft graphic materials in PowerPoint package through advanced functions\nResearch subject matter and apply to specific learning projects\n"
  },
  {
    value: 145,
    jobFunc: 9,
    text: "Training Advisor",
    assessment: "interviewing people one-to-one or in small groups to discuss career or education options\nidentifying skills gaps and how to deal with them\nhelping young people to draw up action plans for employment, education and training and supporting them to achieve these goals\nresearching careers, options and support organisations to meet people's needs\nadvising people on how to source relevant training courses or qualifications and what funding might be available\nproviding advice on CV, applications, job hunting and interview techniques;"
  },
  {
    value: 146,
    jobFunc: 9,
    text: "Instructional Designer",
    assessment: "Create engaging learning activities and compelling course content that enhances retention and transfer\nWork with subject matter experts and identify target audience’s training needs\nState instructional end goals and create content that matches them\nVisualize instructional graphics, the user interface and the finished product\nConduct instructional research and analysis on learners and contexts"
  },
  {
    value: 147,
    jobFunc: 9,
    text: "Learning Developer",
    assessment: "talk with users to find out about their training needs\nwork with tutors, trainers or development teams to create online learning materials\ncreate interactive multimedia like video clips - webcasts; or audio clips - podcasts\nmodify content for use on other platforms, such as mobile phones or tablets\nmake sure security measures are in place to control access\nwrite training support materials for users"
  },
  {
    value: 148,
    jobFunc: 10,
    text: "Admissions Assistant",
    assessment: "Provide assistance to students in all aspects of admissions processes\nProcess, verify and assess applications from students seeking admissions\nProvide counsel to students on registration and enrollment processes\nLead students and parents seeking admissions to the admissions counselor\nProvide counsel to students seeking financial aid for their education\nAnswer and respond e-mails and telephone inquiries from students\nMaintain, manage and schedule interviews of students and parents with the admissions counselor\n"
  },
  {
    value: 149,
    jobFunc: 10,
    text: "Teacher",
    assessment: "Follows professional practices consistent with school and system policies in working with students, students’ records, parents, and colleagues\nDemonstrates communication and interpersonal skills as they relate to interaction with students, parents, other teachers, administrators, and other school personnel\nIs available to students and parents for conferences according to system policies\n Facilitates home-school communication by such means as holding conferences, telephoning, and sending written communications\nMaintains confidentiality of students and students’ records\nWorks cooperatively with school administrators, special support personnel, colleagues, and parents"
  },
  {
    value: 150,
    jobFunc: 10,
    text: "Advisor",
    assessment: "Develop strategies and advise on administrative processes\nManage and monitor administrative activities\nDevelop and advise on training methodologies to new staff\nAdvise on financial operations\nRender sound advice on mergers and acquisitions\nManage and troubleshoot complex issues\n"
  },
  {
    value: 151,
    jobFunc: 10,
    text: "Assistant Instructor",
    assessment: "Assist respective teachers with managing children in classroom\nDevelop class materials for forthcoming activities and projects\nAssist teachers in entire thematic units and utilize district behavior change program as required\nConsult and interact with classroom teacher with respect to students’ progress\nSupport teachers with all classroom duties through preparing copies and filing paperwork along with working with students\n"
  },
  {
    value: 152,
    jobFunc: 10,
    text: "Academic Support Coordinator",
    assessment: "Coordinate various faculty searches and maintain faculty search database\nAssist in screening and selecting faculty applications\nManage orientation, training and relocation for new faculties\nProvide support and guidance to academic trainees\nCollaborate with faculty to conduct new student workshops\nAssist in selecting right student leaders\nAssist in managing schedule, student payroll, rooms and instructional supplies for workshops and other study programs\n"
  },
  {
    value: 153,
    jobFunc: 10,
    text: "Assistant Professor",
    assessment: "Develop and implement innovative instructional methods\nDevelop professional logistics to improvise student performance\nGuide, lead and mentor students in research projects\nEvaluate, monitor and mentor student academic progress\nCreate, innovate and implement career-enhancement programs and activities\n"
  },
  {
    value: 154,
    jobFunc: 10,
    text: "Education Specialist",
    assessment: "Evaluate individual participant and determine training needs\nDraft reports as per program director and supervisor’s directions\nDetermine, develop and execute quality improvement programs\nOversee and encourage college and training search through internet\nHandle career planning, higher education exploration and study skills workshops\n"
  },
  {
    value: 155,
    jobFunc: 10,
    text: "Preschool Teacher",
    assessment: "Provide a variety of materials and resources for children to explore, manipulate and use, both in learning activities and in imaginative play\nAttend to children's basic needs by feeding them, dressing them, and changing their diapers\nTeach basic skills such as color, shape, number and letter recognition, personal hygiene, and social skills\nEstablish and enforce rules for behavior, and procedures for maintaining order\nRead books to entire classes or to small groups\n"
  },
  {
    value: 156,
    jobFunc: 10,
    text: "Adjunct Professor",
    assessment: "Creates, distributes, and reviews the course syllabus\nUtilizes a variety of instructional strategies in order to engage students, including cooperative and experiential learning\nMeets with academic department chair to develop courseware and curriculum\nPresents prepared materials and supervises organized activities\n Evaluates student performance promptly and accurately based on departmental rubrics\nCoordinates with the college or university bookstore in order to ensure class material availability\nMaintains records of student attendance, involvement, and progress\n"
  },
  {
    value: 157,
    jobFunc: 10,
    text: "Lecturer",
    assessment: "delivering lectures, seminars and tutorials\ndeveloping and implementing new methods of teaching to reflect changes in research\ndesigning, preparing and developing teaching materials\nassessing students' coursework\nsetting and marking examinations\nsupporting students through a pastoral or advisory role\nundertaking personal research projects and actively contributing to the institution's research profile;"
  },
  {
    value: 158,
    jobFunc: 12,
    text: "Construction Engineer",
    assessment: "Coordinate with project manager and administer efficient working of construction process and monitor lifecycle of all projects and prepare all project controls and update as per requirement and document all processes\nProvide technical support to all management processes and maintain and update all logs and document all estimates and change orders for vendors and perform quantity survey with help of different software and maintain compliance to an efficient project schedule\n"
  },
  {
    value: 159,
    jobFunc: 12,
    text: "Civil Engineer",
    assessment: "Analyze survey reports, maps, drawings, blueprints, aerial photography, and other topographical or geologic data to plan projects\n2) Plan and design transportation or hydraulic systems and structures, following construction and government standards, using design software and drawing tools\n3) Compute load and grade requirements, water flow rates, and material stress factors to determine design specifications\n"
  },
  {
    value: 160,
    jobFunc: 12,
    text: "Procurement Engineer",
    assessment: "Analyze all suppliers in order to select the most suitable suppliers who are able to deliver high quality products at competitive pricing\nNegotiate with suppliers on lead-time, cost and quality so as to obtain the maximum benefit for the company\nManage suppliers to meet objectives related to cost, delivery performance, schedule and quality\nDevelop purchasing or sourcing strategies based on portfolio analyses and supplier preferencing study\n"
  },
  {
    value: 161,
    jobFunc: 12,
    text: "Construction Technician",
    assessment: "Assist to prepare site for all substation construction and perform all manual labor functions\nDesign and implement construction of all substation structures\nMonitor and install various substation equipments and associated attachments\nManage and operate all construction equipments and power hand tools\nProvide assistance to all processes in emergency outages and administer efficient flow of all work\n"
  },
  {
    value: 163,
    jobFunc: 12,
    text: "Testing Technician",
    assessment: "Resolve and troubleshoot technical problems\nInitiate preventative measures to contain breakdowns\nAssist and support other technical persons in maximizing their performances\nMaintain and manage a productive workflow\nPrepare schedules for other technicians and interns to follow\n"
  },
  {
    value: 164,
    jobFunc: 12,
    text: "Civil Engineering Designer",
    assessment: "Develop cost-effective design layouts based on construction specifications and requirements\nAdhere to established design guidelines and procedures\nAnalyze design issues and recommend corrective actions\nPerform civil design analysis and calculations according to project requirements\n"
  },
  {
    value: 165,
    jobFunc: 12,
    text: "Architect Consultant",
    assessment: "Architect and develop customer solutions with product line knowledge, storage, management, networking and other client processes\nEstablish and manage strong client relationships at CIO, CEO and EVP levels\nBuild high level customer relationships to establish future value creation by offering trusted value advisor status to clients\nCollect comprehensive client business and technical requirements and specify to execute customer solutions\nEducate and suggest clients on industry trends\n"
  },
  {
    value: 166,
    jobFunc: 12,
    text: "Materials testing technologist",
    assessment: "Collects samples of soils and construction materials in the field to measure physical characteristics\n Performs a variety of tests on construction materials including soils, aggregates, concrete/mortar/grout, reinforcing steel and asphalt using materials-testing equipment"
  },
  {
    value: 167,
    jobFunc: 12,
    text: "Solid waste disposal technician",
    assessment: "Establish and maintain effective working relationships with customers, contracted agencies and workers, other employees, supervisory personnel, and the public\n·               Communicate clearly and concisely, both orally and in writing\n·               Knowledge of city, federal, state and county solid waste and recycling laws and codes\n"
  },
  {
    value: 168,
    jobFunc: 8,
    text: "Art Director",
    assessment: "working from a brief with a copywriter, generating ideas to present to the client\nworking on designs to produce an effective advertising campaign\ncommissioning specialists, such as artists and photographers, to work on projects\nmanaging projects and working within a budget\n"
  },
  {
    value: 169,
    jobFunc: 13,
    text: "Associate Producer",
    assessment: "Assist and support creative staff in producing live events\nCapture, assemble and edit production elements in programs and events\nPrepare metadata for program elements serving on-line, mobile and emerging mediums\nHandle digital video non-linear editing & encoding\nDevelop proposals and budgets and source vendors\n"
  },
  {
    value: 170,
    jobFunc: 13,
    text: "Audio and Video Equipment Technician",
    assessment: "Perform minor repairs and routine cleaning of audio and video equipment\nDiagnose and resolve media system problems in classrooms\nSwitch sources of video input from one camera or studio to another, from film to live programming, or from network to local programming\nMeet with directors and senior members of camera crews to discuss assignments and determine filming sequences, camera movements, and picture composition\n"
  },
  {
    value: 171,
    jobFunc: 13,
    text: "Broadcast News Analyst",
    assessment: "Write and report the news\nOperate control board\nAsk experts to come on the show and provide feedback and analysis\nConduct interviews\nAsk relevant questions\nProvide lead-ins for reports\nRead teleprompters and scripts\nImprovise as needed\nPresent sports and weather\n"
  },
  {
    value: 173,
    jobFunc: 13,
    text: "Executive Producer",
    assessment: "Supervise all staffing requirements and prepare required budget and ensure compliance to budget and recommend improvements to production process if required and manage and supervise all projects for development activities\nPrepare strategies for various development intellectual properties and coordinate with clients, publishers and external resources to ensure smooth working of all development processes and design all content for advertising programs\n"
  },
  {
    value: 174,
    jobFunc: 13,
    text: "Film/Video Editor",
    assessment: "receiving a brief, and maybe an outline of footage and/or a shot list, script, or screenplay\nassembling all raw footage, with camera shots either recorded or transferred onto video tape in preparation for inputting into the computer\ninputting uncut rushes and sound, and synchronising and storing them into files on the computer\ndigitally cutting the files to put together the sequence of the film and deciding what is usable\ncreating a 'rough cut' (or assembly edit) of the programme/film and determining the exact cutting for the next and final stages;"
  },
  {
    value: 175,
    jobFunc: 13,
    text: "Photographer",
    assessment: "Adjust apertures, shutter speeds, and camera focus based on a combination of factors such as lighting, field depth, subject motion, film type, and film speed\n2) Create artificial light, using flashes and reflectors\n3) Determine desired images and picture composition; and select and adjust subjects, equipment, and lighting to achieve desired effects\n4) Develop and print exposed film, using chemicals, touchup tools, and developing and printing equipment, or send film to photofinishing laboratories for processing\n"
  },
  {
    value: 176,
    jobFunc: 13,
    text: "Social Media Specialist",
    assessment: "Build and execute social media strategy through competitive research, platform determination, benchmarking, messaging and audience identification\nGenerate, edit, publish and share daily content (original text, images, video or HTML) that builds meaningful connections and encourages community members to take action\nSet up and optimize company pages within each platform to increase the visibility of company’s social content\nModerate all user-generated content in line with the moderation policy for each community"
  },
  {
    value: 177,
    jobFunc: 13,
    text: "Sound Mixer",
    assessment: "location sound recordist, location sound engineer or simply sound mixer is the member of a film crew or television crew responsible for recording all sound recording on set during the filmmaking or television production using professional audio equipment, for later inclusion in the finished product, or for reference to be used by the sound designer, sound effects editors, or foley artists\n This requires choice and deployment of microphones, choice of recording media, and mixing of audio signals in real time\n"
  },
  {
    value: 178,
    jobFunc: 14,
    text: "Mechanical Engineer",
    assessment: "Develop and analyze continuous fiber composite structures\nConduct test correlation for components and multi-material systems\nEvaluate damage and damage tolerance of new composite material systems\nSynthesize with product departments, material developers and strategic suppliers\nVisit and obtain technical details for implementing mechanical models\n"
  },
  {
    value: 179,
    jobFunc: 14,
    text: "Lead Industrial Engineer",
    assessment: "Determine all operational methods according to required work standards and analyze all information to resolve specific issues such as optimal utilization of personnel and materials\nCoordinate with engineering department and outside suppliers and recommend changes to layout and maintain control on all labor and material costs\nEnsure optimal utilization of all personnel and materials and provide support to all SPQRC processes and ensure achievement of all safety and cost objectives\n"
  },
  {
    value: 180,
    jobFunc: 14,
    text: "Quality Engineer",
    assessment: "Involve in focused development plan across product’s life cycle from concept till production to ensure effective compliance with process\nEnsure software, hardware systems and engineering activities adhere to established procedures\nAssist client and regulatory agencies for product and site assessments\nGuide and provide feedback to project management and engineering teams for design and development conformance\n"
  },
  {
    value: 181,
    jobFunc: 14,
    text: "Maintenance Technician",
    assessment: "Conduct everyday repairs, preventative maintenance and emergency maintenance on different allocated accounts and properties\nReceive work orders for curative repair activities on different building physical structure, system components and equipment\nEstimate detailed amount of time along with materials required for finished tasks\nEnsure to place orders of essential materials to furnish all necessary repairs\nComplete all necessary paperwork to finalize work orders\n"
  },
  {
    value: 182,
    jobFunc: 14,
    text: "Mechanical Desinger",
    assessment: "Design layouts for new and conceptual products and direct to fulfill end requirements\nCheck Engineering drawings as per AME Y14\n5 standards and company practices\nSupport engineers with timely project delivery responsibilities\nUpdate on technologies related to design, drafting, CAD and manufacturing\nEstimate project, gather pre-project data and plan preliminary project\n"
  },
  {
    value: 183,
    jobFunc: 14,
    text: "Production Stress Engineer",
    assessment: "Plan and coordinate production engineering processes on daily basis to produce high quality products\nDevelop process improvements to effectively utilize equipment and materials to maximize production\nDevelop operational strategies to achieve production and financial objectives\nIdentify unsafe operations and practices and report the same to Manager immediately\n"
  },
  {
    value: 184,
    jobFunc: 14,
    text: "Facilities Engineer",
    assessment: "Develop security systems and monitor infrastructure systems\nDevelop infrastructure systems troubleshooting and repair\nPerform HVAC system and electrical system troubleshooting and repairs\nPlan, design and oversee reconfiguration, maintenance and alteration of equipment, machinery, buildings, structures, and other facilities\n"
  },
  {
    value: 185,
    jobFunc: 14,
    text: "Control Engineer",
    assessment: "Develop, maintain and enhance electrical instruments, equipment, components and systems for company projects\nConstruct, install, maintain, document and test for specification compliance and customer needs\nConduct detailed calculations to set up manufacturing, constructions and installation standards\nCheck installations and observe operations for design equipment conformance and safety standards compliance\nOversee and train project team members\n"
  },
  {
    value: 186,
    jobFunc: 14,
    text: "Product Engineer",
    assessment: "Administer and validate various new products and services to ensure effective implementation plans\nAssist all departments and provide technical assistance according to regulations\nCoordinate with departments and select appropriate products for various device designs\nCoordinate with suppliers and external vendors and ensure effectiveness of all programs\n"
  },
  {
    value: 187,
    jobFunc: 14,
    text: "Equipment Engineer",
    assessment: "Provide technical assistance in installation and maintenance of company equipment\nVisit customer site to install and test equipment for proper functioning\nPerform equipment upgrades as per customer requirements\nAnalyze equipment malfunctions and failures and accordingly develop corrective actions\nDevelop improvements to enhance equipment reliability and scalability\n"
  },
  {
    value: 188,
    jobFunc: 15,
    text: "Production Engineer Oil&Gas",
    assessment: "Plan and coordinate production engineering processes on daily basis to produce high quality products\nDevelop process improvements to effectively utilize equipment and materials to maximize production\nDevelop operational strategies to achieve production and financial objectives\nIdentify unsafe operations and practices and report the same to Manager immediately\n"
  },
  {
    value: 189,
    jobFunc: 15,
    text: "Petroleum Engineer",
    assessment: "liaising with geoscientists, production and reservoir engineers and commercial managers to interpret well-logging results and predict production potential\ncompiling detailed development plans of reservoir performance using mathematical models\nselecting optimal tubing size and suitable equipment in the well for different functions\ndesigning the completion - the part of the well that communicates with the reservoir rock and fluids\ndesigning systems that help the well to flow, for example using submersible pumps\nmanaging problems of fluid behaviour and production chemistry;"
  },
  {
    value: 190,
    jobFunc: 15,
    text: "Drilling&Workover Engineer",
    assessment: "Ensure drilling programs, program amendments and dispensations to policy are prepared on\nschedule and are adequately risk assessed\n Work closely with resource teams, geologists, production and service company personnel to\nensure an efficient operation\n Estimate and control costs for wells activities\n Monitor all phases of the drilling operations, perform post-analyses for benchmarking and\nlearning, and identify and implement appropriate new technologies;"
  },
  {
    value: 191,
    jobFunc: 15,
    text: "Geomechanics Pet\nEng\n",
    assessment: "Reservoir compaction and surface subsidence\nWell damage risk analysis and design\noptimization\nShale fracture mechanics\nGeothermal reservoir geomechanics\nGas storage geomechanics\nSalt deformation and salt cavern analysis\nE&P Injection Well Design, Permitting, and Monitoring"
  },
  {
    value: 192,
    jobFunc: 15,
    text: "Reservoir Engineer",
    assessment: "Design various reservoir field and identify appropriate tools to resolve all reservoir engineering issues and develop support package for new wells\nEstablish all developed and undeveloped reserves and maintain an efficient reserve systems and evaluate all completion and drilling activities and for various projects and coordinate with various teams for project development according to production guidelines\n"
  },
  {
    value: 193,
    jobFunc: 15,
    text: "Geophysicist Petroleum Engineering",
    assessment: "Participate hands-on in project activity to gain familiarity with geologic and geophysical objectives as well as risks for client\nFoster technical solutions, enhance project execution efficiency, ensure effective team participation\nPerform quality control, monitoring, and interpretation of geophysical data\nUpdate client on technical matters and help manage expectations\n"
  },
  {
    value: 194,
    jobFunc: 15,
    text: "Chemical Engineering",
    assessment: "working closely with process chemists and control engineers to ensure the process plant is set up to provide maximum output levels and efficient running of the production facility\ndesigning plant and equipment configuration so that they can be readily adapted to suit the product range and the process technologies involved, taking environmental and economic aspects into account\nsetting up scale-up and scale-down processes including appropriate changes to equipment design and configuration;"
  },
  {
    value: 195,
    jobFunc: 15,
    text: "Process Engineer",
    assessment: "Develop and implement process improvement strategies\nWork closely with the staff to select most appropriate process improvement techniques\nIdentify and manage resources to execute process improvement projects\nDevelop new processes for high efficiency and cost effectiveness\nPrioritize and develop projects based on critical needs\n"
  },
  {
    value: 197,
    jobFunc: 15,
    text: "Application Engineer (oil & gas pumping and compression)",
    assessment: "Conduct market research and identify new product development opportunities\nAssist and support senior engineering staff in developing application programs\nAssist and support technical people working on new and existing applications\nDevelop test programs to run applications\nProvide necessary technical inputs to troubleshoot and resolve complex issues\nProcess and implement specifications for required specific applications\n"
  },
  {
    value: 198,
    jobFunc: 15,
    text: "Geologist or Environmental Scientist",
    assessment: "Perform geological and field tasks by applying standard geological techniques and analysis\nPrepare and read geologic structures and maps\nStay up-to-date with geological theories and principles\nPerform field sampling and analyze sample data for geological setting\nPerform geologic analyses and perform geophysical and geotechnical testing\n"
  },
  {
    value: 199,
    jobFunc: 16,
    text: "Electrical Engineer",
    assessment: "identifying customer requirements\ndesigning systems and products\nreading design specifications and technical drawings\nresearching suitable solutions and estimating costs and timescales\nmaking models and prototypes of products using three-dimensional design software\nworking to British (BS), European (EN) and other standards\nliaising with others in the design team\ncommunicating with clients and contractors;"
  },
  {
    value: 200,
    jobFunc: 16,
    text: "Antenna Engineer",
    assessment: "Design, create and implement LNA and antenna system solutions in order to improve the performance of communication systems and GNSS receivers\nMaintain patent and protection of IP for any innovative technology creations\nPerform simulation, optimization and testing with the help of latest tools\nCoordinate with EMC engineers, antenna design engineers and industrial designers in order to test and integrate the antenna solution developed with other products\nCommunicate effectively with both the hardware and firmware teams in order to present the design concepts clearly\n"
  },
  {
    value: 201,
    jobFunc: 16,
    text: "Analogue amplifier design engineer",
    assessment: "Lead team of analog electronics in order to design circuits and perform simulation\nValidate design of circuits and perform EMC and lab tests to verify design\nProvide technical support to designers and system engineers on OEM testing\nAnalyze, design, validate and implement design as per engineering standards\nAdhere to established procedures and determine program requirements\nPrepare appropriate technical documents on analog designs\nContribute to addressing general issues and participate in company initiatives\n"
  },
  {
    value: 202,
    jobFunc: 16,
    text: "Distribution planning engineer, electrical",
    assessment: "Build electrical power distribution systems in overhead and underground facilities\nDesign cable routes and develop physical layouts including height, spacing and location parameters\nDetermine electrical equipment needs and quantities for development of new power systems\nManage voltage drop, short circuit, power factor, and sag and stress in a timely manner\nProvide engineering support to operations and maintenances of power distribution systems\n"
  },
  {
    value: 203,
    jobFunc: 16,
    text: "Electrical Research Engineer",
    assessment: "Conduct system research to identify defect and vulnerability\nProvide R&D support to system design, development and implementation activities\nWork with project team in performing project research and analysis\nMaintain clear and complete research documentations for management reviews\nCommunicate research results to management in meetings, conferences and presentations\n"
  },
  {
    value: 204,
    jobFunc: 16,
    text: "Electrical network engineer",
    assessment: "Install and perform upgrade on various new devices\nAssist to prepare license and maintain an inventory for same on regular basis\nPrepare all technical reports regarding server and networking system\nMonitor and provide upgrade to all computer related technologies inclusive of operating systems\nIdentify and resolve problems and assist users as per requirement\n"
  },
  {
    value: 205,
    jobFunc: 16,
    text: "Technical services electrical engineer",
    assessment: "Conduct all duties safely conforming with Kinectrics procedures and policies\nConduct routine electrical investigations, tests and technical studies for clients in more than one discipline\nConduct lab as well as field tests utilizing principally standard techniques\nSupport laboratory and field environments through conducting experiments, tests and using servicing equipment along with quality control\n"
  },
  {
    value: 206,
    jobFunc: 16,
    text: "Signal Engineer",
    assessment: "The installation and maintenance of all signalling and telecommunication equipment under his charge in a satisfactory and safe condition\n Observance of the rules and procedures laid down in the General and Subsidiary Rules, Rules for opening of a Railway, the Signal Engineering Manual, the Telecommunication Manual, relevant Rule books and Manuals and orders and circulars issued by the Chief Signal and Telecommunication Engineer from time-to-time and ensuring that all staff under his charge are acquainted with relevant rules and working methods and efficiently perform their allotted duties\nPreparation of plans and estimates and safe execution of works in his charge\nEnsuring that all important inspection notes of higher authorities receive prompt action\n"
  },
  {
    value: 207,
    jobFunc: 16,
    text: "Low voltage equipment engineer",
    assessment: "Proactively liaise with customers regarding the status of their active faults\n Learn and understand capabilities, operation and limitations of company and\n other manufacturers' fault location equipment\n Provide technical support to customers who are installing and using fault location equipment"
  },
  {
    value: 208,
    jobFunc: 16,
    text: "Electrical energy transmission planning engineer",
    assessment: "Assist to direct and review transmission planning related technical studies\nDesign transmission substation conceptual layouts and provide input to capital budget and regulatory support\nPerform operations planning studies, assist administration of IPP’s as well as on-site generation\nSupervise small engineering team to perform transmission planning technical studies\n"
  },
  {
    value: 209,
    jobFunc: 16,
    text: "Satellite instrumentation engineer",
    assessment: "Manage, update and supply collected data\nAnalyze and ensure to standardize equipment on return\nSupport section supervisor to coordinate and maintain facilities of Environmental Systems Integration Laboratory (ESIL)\nDetermine ESIL needs for services and equipments\nSupervise current equipment service contracts\nCoordinate repairs plus supervise defective equipment returns\n"
  },
  {
    value: 210,
    jobFunc: 21,
    text: "Capacity planner, network",
    assessment: "Evaluate performance and prepare plans for capacity procedures and provide comprehensive support for same\nCoordinate with various departments and perform all capacity planning activities in facility\nAnalyze capacity planning and provide appropriate recommendation for same\nPerform analysis on all development plans for production and ensure compliance to all customer demands in facility\n"
  },
  {
    value: 211,
    jobFunc: 21,
    text: "Computer systems engineer",
    assessment: "Support delivery, upgrade and maintenance of software applications from all aspects\nDevelop, install, test, debug, maintain and resolve problems for enterprise wide software application deployments\nImprove system capabilities by developing software, applications, scripts and automations\nDetermine program design feasibility within time and cost constraints through software requirement analysis\n"
  },
  {
    value: 212,
    jobFunc: 21,
    text: "Optical communications hardware Engineer",
    assessment: "Manage engineering team and develop and evaluate all optical designs for various enterprise network and monitor product cycle form conceptualization to obsolescence\nAdministers and provide specifications for all lenses and illumination systems and perform production tests on all equipments and ensure quality control according to customer and system requirements and transit all design requirements into optical assemblies\n"
  },
  {
    value: 213,
    jobFunc: 21,
    text: "Technical architect - hardware",
    assessment: "Design new product and maintain all Digital electrical boards and/or Analog, circuits, components and interconnects\nProvide technical and non technical support and prepare new business proposals to increase business prospects\nDevelop and implement product designs and provide support to production and ensure compliance to time-frame, quality and cost targets\nManage technical aspects and monitor efficient deployment of new technologies and systems\n"
  },
  {
    value: 214,
    jobFunc: 21,
    text: "Hardware Design Engineer",
    assessment: "Design and develop hardware products and systems\nDesign and develop new products and as well update existing products\nDesign, define, and simulate analog and digital circuits\nDesign, test and debug digital, analog, and RF based circuits\nDebug and evaluate motherboard and resolve circuit problems\nAssist and support CAD team or design team in schematic designs and developments\n"
  },
  {
    value: 215,
    jobFunc: 21,
    text: "Hardware Development Engineer",
    assessment: "Assist in design and development of hardware systems\nComplete the hardware development tasks within the allotted budget and timelines\nDevelop cost-effective engineering solutions while maintaining quality and productivity\nAssist in system integration, changes and upgrades based on project specifications\nMaintain accurate design documentations for reference purposes\nDevelop test plan and procedures for hardware testing\n"
  },
  {
    value: 217,
    jobFunc: 21,
    text: "IT Specialist",
    assessment: "Handle customer support calls in a timely and accurate manner\nProvide first-level support to customer service requests\nEscalate complex support requests to relevant IT staffs for resolutions\nUnderstand support problems, analyze problem data and determine appropriate solutions\nMaintain problem documentations and their resolution procedures for reference procedures\nPlan and complete daily assigned tasks within deadlines\n"
  },
  {
    value: 218,
    jobFunc: 21,
    text: "Linux Enterprise Support Engineer",
    assessment: "Initiate, demonstrate and assume ownership of major areas of functionalities\nProvide and establish correct technical direction to teams and professionals\nResearch technical challenges, evaluate and provide creative solutions\nWrite code and develop embedded cutting-edge applications and operating systems\nEnsure best practices and standards are followed\n"
  },
  {
    value: 219,
    jobFunc: 21,
    text: "PC Technician",
    assessment: "Assist in set-up and maintenance of PC systems and its peripherals including printers, scanners, copiers, and fax\nAnalyze root causes of PC problems and recommend appropriate resolutions\nAttend service calls, resolve issues and escalate complex issues to appropriate service teams\nPrepare work orders and maintain daily log of work completed\n"
  },
  {
    value: 220,
    jobFunc: 22,
    text: "Fashion Designer",
    assessment: "creating/visualising an idea and producing a design by hand or using computer-aided design (CAD)\nkeeping up to date with emerging fashion trends as well as general trends relating to fabrics, colours and shapes\nplanning and developing ranges; understanding design from a technical perspective, i\ne\n producing patterns, toiles and technical specifications for designs\nsourcing, selecting and buying fabrics, trims, fastenings and embellishments\nadapting existing designs for mass production;"
  },
  {
    value: 221,
    jobFunc: 22,
    text: "Merchandiser",
    assessment: "planning product ranges and preparing sales and stock plans in conjunction with buyers\nliaising with buyers, analysts, stores, suppliers and distributors\nmaintaining a comprehensive library of appropriate data\nworking closely with visual-display staff and department heads to decide how goods should be displayed to maximise sales\nproducing layout plans for stores, sometimes called 'statements'\nforecasting profits and sales, and optimising the sales volume and"
  },
  {
    value: 222,
    jobFunc: 22,
    text: "Pattern Maker",
    assessment: "Compute dimensions of patterns according to sizes, considering stretching of material\n2) Create a master pattern for each size within a range of garment sizes, using charts, drafting instruments, computers, and/or grading devices\n3) Create a paper pattern from which to mass-produce a design concept\n4) Determine the best layout of pattern pieces to minimize waste of material, and mark fabric accordingly\n"
  },
  {
    value: 223,
    jobFunc: 22,
    text: "Technical Designer",
    assessment: "involve ensuring that products meet brand standards\n A technical designer measures all garments and accessories to ensure they align with product specifications\n Attending product fittings and collaborating with vendors on all issues is a key component of the job\n The technical designer identifies potential problems with products and follows through to ensure all glitches are resolved prior to scheduled releases\n"
  },
  {
    value: 224,
    jobFunc: 22,
    text: "Cutters",
    assessment: "Placed, measured and marked fabric using specified patterns\nCut fabric and sewed that fabric and appropriate accessories to produce customer specific orders\nExamined fabric pieces for compliance to quality standards and to material specifications\nPacked fabric pieces for storage and shipping, in a proper manner\nProcured, stocked, and maintainedraw materials and fabric supplies\nOperated and maintained equipments and reported their malfunctions\n"
  },
  {
    value: 225,
    jobFunc: 22,
    text: "Apparel workers",
    assessment: "Develop and implement state-of-the-art merchandising trends\nDevelop attractive visual methods and techniques in display of garments\nMaintain appealing visual standards in display of garments on racks and counters\nEnsure excellent and efficient customer service\nDevelop and implement merchandising strategies at the store level\nRecommend interior modeling and fixtures to enhance display of apparel\n"
  },
  {
    value: 226,
    jobFunc: 22,
    text: "Photographers - Fashion & Glamour",
    assessment: "Involves long hours of work, sometimes in uncomfortable conditions\nTake photographs of many models, in studios and on location\nTake photographs of models in accordance with specifications of the client\nBuild good rapport with the models in order to make them feel relaxed and work with comfort in front of the camera\nAware of the very minute technical details such as how to work with studio lighting so as to emphasize the best features of the models\nUse different back drafts and props to create the required setting for the photo shoot\nWork with digital or film technology\nEstablish good interactions and work in coordination with art directors, fashion stylists, fashion editors, art directors and agencies\n"
  },
  {
    value: 227,
    jobFunc: 22,
    text: "Shoe and leather workers",
    assessment: "Dress and otherwise finish boots or shoes, as by trimming the edges of new soles and heels to the shoe shape\n\t\nEstimate the costs of requested products or services such as custom footwear or footwear repair, and receive payment from customers\n\t\nAttach insoles to shoe lasts, affix shoe uppers, and apply heels and outsoles\n\t\nCement, nail, or sew soles and heels to shoes\n\t\nCut out parts following patterns or outlines, using knives, shears, scissors, or machine presses\n\t\nConstruct, decorate, or repair leather products according to specifications, using sewing machines, needles and thread, leather lacing, glue, clamps, hand tools, and/or rivets\n"
  },
  {
    value: 228,
    jobFunc: 22,
    text: "Textile Specialist",
    assessment: "liaising with clients and technical, marketing and buying staff to plan and develop designs\naccurately interpreting and representing clients' ideas\nproducing sketches, designs and samples for presentation to customers\nmaking up sets of sample designs\nworking out design formulae for a group of samples\nassessing and approving completed items and production standards\nworking independently, if self-employed, or liaising closely with colleagues as part of a small team;"
  },
  {
    value: 229,
    jobFunc: 22,
    text: "Editorial Stylist",
    assessment: "Select items to appear in fashion magazines/media\nSelect clothing for TV personalities, celebrities or the wardrobe for film or TV characters\nSource fashion items and props for photographic shoots or film/tv personalities, or product placement in fashion magazines/media\nAdvise on photographic approaches and the selection of locations, props, clothing, models, makeup artists, photographers, hair stylists and the overall look for photo shoots\n"
  },
  {
    value: 230,
    jobFunc: 23,
    text: "Activity Assistant",
    assessment: "Organized, lead and promoted interest in recreational activities such as arts, crafts, sports, games, and hobbies\nAssisted clients in their ambulation at their appointments and provided companionship\nTransported clients to their doctors' appointments\nEnforced regulations of recreational facilities, adhered to company's procedures to ensure safety of all residents"
  },
  {
    value: 231,
    jobFunc: 23,
    text: "Behavior Technician",
    assessment: "Provide direct behavioral services to clients in individual and group sessions\n Run skill acquisition programs with clients using Applied Behavior Analysis and Verbal\nBehavior Analysis\n Complete weekly program writing and maintain client’s program book\n Work with Board Certified Behavior Analysts and/or Board Certified Assistant Behavior\nAnalysts to implement individualized treatment plans"
  },
  {
    value: 232,
    jobFunc: 23,
    text: "In Home Support",
    assessment: "Provide healthcare and comfort to patients at their residences\nEvaluate nursing assessment prior to providing in-home care\nMake changes if necessary in in-home nursing care as per physician’s orders\nEvaluate and document physiological, psychological cognitive status of the patients\nEducate and instruct patients, patients’ family or other staff in in-home patient care delivery\n"
  },
  {
    value: 233,
    jobFunc: 23,
    text: "Recreational Service Assistant",
    assessment: "Assist in recreation activities of patients and volunteers\nAssist in conducting recreation programs and activities\nAssist recreation staff in conducting sports, games and events\nConduct tournaments and matches for school students\nOrganize arts and crafts at a recreation facility\n"
  },
  {
    value: 234,
    jobFunc: 23,
    text: "Youth Service Coordinator",
    assessment: "Hire and train staff to promote youth programs\nSupervise everyday activities and prepare reports for same\nAnalyze youth requirements, develop programs and identify resources for same\nCoordinate with various teams to meet all youth requirements\nDesign and execute programs and ensure inclusion of various recreation and sports activities\n"
  },
  {
    value: 235,
    jobFunc: 23,
    text: "Correctional Officer",
    assessment: "Monitor inmates in living areas as well as recreational activities\nOversee inmates plus visitors at visitation areas\nPerform as control center officer and provide emergency response\nCoordinate and supervise inmate movements and perform counts\nPerform as mailroom, medical security, field tower, gate officer and perimeter security\nProvide treatment activities security and oversee labor crews in kitchen along with various specialized areas\n"
  },
  {
    value: 236,
    jobFunc: 23,
    text: "Assistant Superintendent",
    assessment: "Provide professional support to negotiate contracts prior to settlement\nDevelop and implement administrative and policy regulations to operate contracts for various stakeholders\nEvaluate all sub contracts and purchase orders and manage all communication in written and oral format and prepare reports for senior management\nAssist management to qualitative review of entire contract documents to identify imminent conflicts or issues and reduce risks\n"
  },
  {
    value: 237,
    jobFunc: 23,
    text: "Job Coach",
    assessment: "Support people served in accomplishing employment goals\nCounsel and suggest individuals served and provide guidance on group and educational services\nOversee youth performance at performing job responsibilities\nInteract positively and teach right work attitudes along with behaviors\nSupport and help tutoring or customized instructional time for talent building as needed\n"
  },
  {
    value: 238,
    jobFunc: 23,
    text: "Urban Design Planner",
    assessment: "Evaluate Urban Design criteria of Roadway Corridor as well as Context\nDevelop corridor analysis to determine urban design issues as well as opportunities\nPrepare Urban Design Evaluation Criteria for analysis of alternatives\nEnsure to include Bostons Complete Streets items program as suitable\nPrepare apt range of alternatives\nIdentify alternative to develop or reparcelize any residual property through corridor\n"
  },
  {
    value: 239,
    jobFunc: 23,
    text: "Environmental and Natural Resource Planner",
    assessment: "Plan and coordinate environmental activities for timely completions\nProvide assistance and job trainings for team members when required\nDelegate daily workload and timelines for team members\nAssist management in developing project proposals and presentations\nParticipate in feasibility studies and assist in determining estimations\nEnsure that plant operations are in compliance with environmental compliances\n"
  },
  {
    value: 240,
    jobFunc: 24,
    text: "Academic Counselor",
    assessment: "Execute academic counselor functions to manage students’ academic performances\nCoordinate academic counselor functions with that of admissions, finance and academics personnel\nRespond proactively to student inquiries and requests regarding their academic issues\nDevelop and implement strategies to promote students’ academic progress and performances\nAssist and support academic staff in developing curriculum for students\nAssist and support academic audit schedules\n"
  },
  {
    value: 241,
    jobFunc: 24,
    text: "Animal Researcher",
    assessment: "Formulate animal scientist initiatives to increase poultry, eggs, meat and milk\nDevelop and improvise parasite and disease control methods through animal scientist functions\nConduct clinical experiments on birds and animals\nAssess record and document experimental methods on farm animals\nIncrease the production of animal products through scientific research on animals\n"
  },
  {
    value: 242,
    jobFunc: 24,
    text: "Animal Trainer",
    assessment: "Conduct training programs in order to develop and maintain desired animal behaviors for competition, entertainment, obedience, security, riding and related areas\nCue or signal animals during performances\nEvaluate animals in order to determine their temperaments, abilities, and aptitude for training\nFeed and exercise animals, and provide other general care such as cleaning and maintaining holding and performance areas\n"
  },
  {
    value: 243,
    jobFunc: 24,
    text: "Child Psychologist",
    assessment: "Monitor assigned cases daily taking care of patients\nParticipate in programs and events related to child psychology\nExecute discretion and judge performance independently\nMaintain and provide appropriate training required to meet patient’s needs\nRecommend development in medical policy and various clinical child programs\nProvide child psychology evaluation and consultation\n"
  },
  {
    value: 244,
    jobFunc: 24,
    text: "Correctional Treatment Specialist",
    assessment: "Provide excellent nursing treatment and healthcare to patients\nTreat patients suffering from various illnesses through nursing care activities\nAssist and support physicians, surgeons and clinicians in treating patients\nAssist patients with lab tests, x-rays, and other related tests as ordered by doctors or surgeons\nProvide pre-operative and post-operative nursing care\n"
  },
  {
    value: 246,
    jobFunc: 24,
    text: "Family and Marriage Therapist",
    assessment: "Ask questions that will help clients identify their feelings and behaviors\n\t\nCounsel clients on concerns, such as unsatisfactory relationships, divorce and separation, child rearing, home management, and financial difficulties\n\t\nEncourage individuals and family members to develop and use skills and strategies for confronting their problems in a constructive manner\n\t\nMaintain case files that include activities, progress notes, evaluations, and recommendations\n\t\nCollect information about clients, using techniques such as testing, interviewing, discussion, and observation\n\t\nDevelop and implement individualized treatment plans addressing family relationship problems\n"
  },
  {
    value: 247,
    jobFunc: 24,
    text: "Vocational Rehabilitation Counselor",
    assessment: "Analyze information from interviews, educational and medical records, consultation with other professionals, and diagnostic evaluations, in order to assess clients' abilities, needs, and eligibility for services\nArrange for physical, mental, academic, vocational, and other evaluations to obtain information for assessing clients' needs and developing rehabilitation plans\nCollaborate with clients' families to implement rehabilitation plans that include behavioral, residential, social, and/or employment goals\n"
  },
  {
    value: 248,
    jobFunc: 24,
    text: "Art Therapist",
    assessment: "taking referred patients, including self-referrals and referrals from other professionals such as teachers, psychologists, occupational therapists and psychiatrists\nmaking referrals to other professionals\nassessing the needs of the client by listening and providing guidance\nworking creatively with various client groups in a therapeutic setting\nworking in a group or one-to-one setting, often as part of a multidisciplinary team of professionals\nenabling clients to explore their art work and the process of its production\nassessing and understanding the feelings or temperament of others;"
  },
  {
    value: 249,
    jobFunc: 24,
    text: "Case Worker",
    assessment: "caseworker is a type of social worker who is employed by a government agency, non-profit organization, or other group to take on the cases of individuals and provide them with advocacy, information or other services\n"
  },
  {
    value: 250,
    jobFunc: 25,
    text: "Labour market information analyst",
    assessment: "Perform routine as well as non-routine evaluation of raw materials, intermediate and finished pharmaceutical formulations along with packaging components as per SOPs\nEnsure to get familiar with standard analytical lab equipment usage in pharmaceutical industry\nCompile and record data for documentation needed for testing and reports preparation\nImplement development method and validation protocols\n"
  },
  {
    value: 251,
    jobFunc: 25,
    text: "Economists",
    assessment: "devising methods and procedures for obtaining data\nunderstanding various sampling techniques that may be used to conduct different types of surveys\ncreating, as well as using, various econometric modelling techniques to develop forecasts\nunderstanding and interpreting data\nanalysing data to test the effectiveness of current policies, products or services and advising on the suitability of alternative courses of action and the allocation of scarce resources\nexplaining research methodology and justifying conclusions drawn from research data;"
  },
  {
    value: 252,
    jobFunc: 25,
    text: "Budget Analyst",
    assessment: "Analyze monthly department budgeting and accounting reports to maintain expenditure controls\nDirect the preparation of regular and special budget reports\nConsult with managers to ensure that budget adjustments are made in accordance with program changes\nMatch appropriations for specific programs with appropriations for broader programs, including items for emergency funds\n"
  },
  {
    value: 253,
    jobFunc: 25,
    text: "Credit Analyst",
    assessment: "Determine creditworthiness and set appropriate credit limits\nEvaluate customer financial statements and other credit related information\nPrepare loan presentation documents, loan worksheets and risk rating worksheets\nEvaluate and assess new accounts\nMaintain and manage all financial statements and trade references\n"
  },
  {
    value: 254,
    jobFunc: 25,
    text: "Risk Analyst",
    assessment: "Perform risk analysis, management and prevention activities for company systems\nAssess potential risks in business systems and develop appropriate mitigation plans\nMonitor business systems and identify and report violations of risk limits\nAnalyze audit findings and assist in implementing audit recommendations\nIdentify areas of concerns and suggest actions items\nReview business contracts, terms and scope to identify any risks\n"
  },
  {
    value: 255,
    jobFunc: 25,
    text: "Tax Examiner",
    assessment: "Develop and maintain all account reconciliations\nSearch and solve tax account balance problems with different tax agencies\nConduct sales tax audits and utilize tax for entire US Agfa legal entities\nPrepare personal property tax renditions for every Agfa US legal entity\nHead responsibility for personal property tax as well as real estate tax payments for entire Agfa US legal entities\n"
  },
  {
    value: 256,
    jobFunc: 25,
    text: "Market Surveyor",
    assessment: "Track industry trends and competitive landscape\nAssist in internal communication to drive dissemination insights\nDevelop and implement custom research to support advertising business goals\nCoordinate with multiple teams to deliver insights\nPerform internal data analysis to support research initiatives and curiosity\nMaintain global advertiser loyalty program and drive change\n"
  },
  {
    value: 257,
    jobFunc: 25,
    text: "Stockbroker",
    assessment: "represents clients to buy or sell stocks and other securities\n The term is applied to both companies that deal in securities and their employees, who technically are registered representatives working for the brokerage\n To most investors, however, the broker is the person they call when they want to invest in or trade stocks\n Most individual brokers work in offices far removed from the stock trading floors\n"
  },
  {
    value: 258,
    jobFunc: 25,
    text: "Mathematical Economist",
    assessment: "study the production and distribution of resources, goods, and services by collecting and analyzing data, researching trends, and evaluating economic issues\n Economists typically do the following: Research and analyze economic issues\n Conduct surveys and collect data\n"
  },
  {
    value: 259,
    jobFunc: 25,
    text: "Investment Economist",
    assessment: "Develop plan to accomplish firm’s equity investment goals\nProvide investment information related to new equity products, regulatory issues and new policies\nIdentify and convey issues or constraints associated with product, operations, systems, platform, pricing and propose alternatives\nEnsure conformance with entire company guidelines and regulatory policies\n"
  },
  {
    value: 260,
    jobFunc: 26,
    text: "Deejay",
    assessment: "Providing music at events\nDeveloping playlists\nInteracting with public at parties\nPlaying music at radio stations\nMixing music tracks\n"
  },
  {
    value: 261,
    jobFunc: 26,
    text: "Audio Engineer",
    assessment: "Develop audio visual equipment\nDevelop and install teleconferencing equipment for business needs\nUnderstand and develop codec and infrastructure\nResearch and implement new technologies\nStudy, understand and architect various audio and video technologies\nTroubleshoot complex audio video problems\nDocument solutions to various audio and visual processes and issues\nProvide customer support and resolve customer related issues in audio engineering\n"
  },
  {
    value: 262,
    jobFunc: 26,
    text: "Assistant Sound Editor",
    assessment: "participates in the post-production phase of a film or television show and works under the supervision of the supervising sound editor and sound effects editor\n He or she is responsible for all tasks assigned by the crew lead, which can include searching sound effects libraries for necessary audio tracks; organizing and transferring sound files; laying up tracks to the editing console for the sound effects editor; and the preparation of cue sheets, which document the precise time code of each sound effect\n In addition, the assistant sound effects editor prepares raw sound effects tracks for the final sound mix by cleaning tracks to remove unwanted background sound or other distortions"
  },
  {
    value: 263,
    jobFunc: 26,
    text: "Sound Effects Specialist",
    assessment: "begins work on the script breakdown: making detailed notes identifying all sounds specifically mentioned in the script or implied by the action\n Sound effects fall under four basic categories: hard sounds, background, Foley, and design\n Most hard sounds and background can be sourced from sound effects libraries, which exist as digital files or on CDs and are carefully cataloged with precise descriptions\n All production companies and motion picture studios have their own unique libraries, and a veteran SFX editor will have his or her own collection of recorded material\n These sound effects are used to replace “dirty” (that is, unusable) sound recorded during principal photography"
  },
  {
    value: 264,
    jobFunc: 26,
    text: "Sound Recordist",
    assessment: "Monitoring audio signals to detect sound-quality deviations or malfunctions so that the audio is produced to a high quality\nAnticipating and correcting any problems that may occur during the recording of audio or Foley\nMaintaining and repairing sound equipment so that the production of the audio can run smoothly without stalling\nAssessing the acoustics of the performance area so that the audio is kept sharp and clear\nApplying technical knowledge of sound recording equipment to accurately achieve the determined artistic objectives\n"
  },
  {
    value: 265,
    jobFunc: 26,
    text: "Recording Studio Technician",
    assessment: "is primarily concerned with maintenance and repair of electronic equipment, including cables, microphones, and amps\n Depending on the individual’s range of expertise, he or she may also be tasked with caring for instruments in the studio’s inventory and performing repairs like bridge replacements on guitars or changing out drum heads\n The studio technician works closely with in-house recording engineers and staff to regularly inspect gear for damage and wear, and will respond to immediate needs for troubleshooting"
  },
  {
    value: 266,
    jobFunc: 26,
    text: "Studio Manager",
    assessment: "Ensures that all work produced is technically correct resulting in high-quality, printer-ready files\n Assigns, schedules and estimates all production art\n Ensures that production pieces are produced timely, on budget and with the degree of quality promised to the client\n Maintains interaction with print production and art directors on scope of projects\n Directs and guides production artists in preparation of files\n Collaborates, as needed, with art directors to design and produce pieces for new business and client presentation\n Remains current on industry trends and technology\n"
  },
  {
    value: 267,
    jobFunc: 26,
    text: "Acoustic Consultant",
    assessment: "Assist team members and provide technical assistance to acoustic team\nAdminister all acoustic concepts and resolve all issues on same\nAnalyze acoustic design, perform tests and integrate various engineering resources\nCoordinate with internal and external customer and present various technical data\nOrganize initiatives for various teams and assist to share engineering information and promote open communication\nPerform noise assessments and invention disclosures in competitive environement\n"
  },
  {
    value: 269,
    jobFunc: 26,
    text: "Re-recording Mixer",
    assessment: "work with all the sound elements (dialogue, automated dialogue replacement, foley, sound effects, atmospheres, and music), and mix them together to create the final soundtrack for a film or television production\n They are primarily responsible for ensuring that film sound is correct both technically and stylistically\n Setting the relative volume levels and positioning these sounds is an art form in its own right, requiring the skill and aesthetic judgement provided by experienced Re-Recording Mixers\n Because of changes in technology, many jobs in sound post production are less easily defined, eg, on some small to medium budget films, Re-Recording Mixers may also work as sound designers"
  },
  {
    value: 270,
    jobFunc: 27,
    text: "Community Pharmacist",
    assessment: "dispensing prescription medicines to the public\nensuring that different treatments are compatible\nchecking dosage and ensuring that medicines are correctly and safely supplied and labelled (pharmacists are legally responsible for any dispensing errors)\nsupervising the preparation of any medicines (not all are supplied ready made-up by the manufacturer)\nkeeping a register of controlled drugs for legal and stock control purposes\nliaising with doctors about prescriptions\nselling over-the-counter medicines\ncounselling and advising the public on the treatment of minor ailments\nadvising patients of any adverse side-effects of medicines or potential"
  },
  {
    value: 271,
    jobFunc: 27,
    text: "Clinical Pharmacist",
    assessment: "pharmacists provide patient care that optimizes the use of medication and promotes health, wellness, and disease prevention\n"
  },
  {
    value: 272,
    jobFunc: 27,
    text: "Druggist",
    assessment: "Plan and execute effective treatment and counseling sessions inclusive of a minimum of 10 hours of primary care services weekly\nPrepare audits and records of documentation for cases and teaching opportunities\nTrack patient progress, arrange for accurate documents and transfers, and counsel patients on prevention and cure of addiction\nAssess clients psychologically and provide effective counseling services and manage all related procedures as well as ensure complete secrecy\n"
  },
  {
    value: 273,
    jobFunc: 27,
    text: "Pharmacist Consultant",
    assessment: "Review all physician medication orders and administer appropriate dosage and recommend all therapy changes to patients if required\nEvaluate all drug history of individual resident and prepare reports for any irregularities for Director of Nursing and recommend changes if required and document all communication with physicians and nurses as per requirement\n"
  },
  {
    value: 274,
    jobFunc: 27,
    text: "Hospital Pharmacist",
    assessment: "checking prescriptions to ensure that there are no errors and that they are appropriate and safe for the individual patient\nproviding advice on the dosage of medicines and the most appropriate form of medication, for example, tablet, injection, ointment or inhaler\nparticipating in ward rounds, taking patient drug histories and involvement in decision-making on appropriate treatments\nliaising with other medical staff on problems patients may experience when taking their medicines\ndiscussing treatments with patients' relatives, community pharmacists and GPs;"
  },
  {
    value: 275,
    jobFunc: 27,
    text: "Industrial Pharmacist",
    assessment: "research drug compounds and develop new medications based on research\n They test medications for efficiency and safety, oversee the production process to ensure medications are produced accurately, and they engage marketing and promoting new drugs to consumers, hospitals and doctors' offices\n An industrial pharmacist may also be responsible for conducting clinical drug trials and evaluating the results of these trials to gauge a drug’s effectiveness and to determine potential risks or side effects\n As part of a drug trial, industrial pharmacists collaborate with other pharmaceutical companies, local and federal governments, and a variety of health care professionals to ensure trials are conducted safety and within federal or state guidelines for drug testing\n"
  },
  {
    value: 276,
    jobFunc: 27,
    text: "Pharmacist Assistant",
    assessment: "Develop prescribed product, attain product from shelf, count specified quantity, place drug in apt container and label on items to be checked by pharmacist\nEnsure to package product after it is checked by pharmacist\nPerform drug scan, place it in bag having printed paperwork as well as receipt\nEnsure to sort packages to specific locations through computer system scan into apt tote to be shipped to stores\nReceive prescriptions from patients plus verify needed information is written on form\n"
  },
  {
    value: 279,
    jobFunc: 27,
    text: "Registered Pharmacist",
    assessment: "Suggest physicians and varied health practitioners on selection, interactions, dosages and medications’ side effects\nProvide information on drugs over-the-counter and recommend options after speaking with patients\nOrder and store medicines along with ensure safety and purity of all pharmaceutical products\nComply strictly with laws to regulate manufacture and pharmaceutical products sale\nMaintain all pharmaceutical products records handled complying with legal requirements\n"
  },
  {
    value: 280,
    jobFunc: 1,
    text: "Senior System Integration Engineer",
    assessment: "\nDevelop and manage prototype build engineering bill of materials\nHandle SSE support to develop prototype shop activities\nCreate algorithms and models using performance data to determine potential system performance\nEstablish methods to determine certainty and sensitivities’ statistical level\nIntegrate with hardware OEM/ODM and chipset vendors\nFunction as technical contact main point and drive technical issues to resolve\nInteract with chipset and device manufacturers to impact system designs\nUpgrade and integrate new field releases into third party systems interfacing within customer environment\n"
  },
  {
    value: 281,
    jobFunc: 1,
    text: "Business System Analyst",
    assessment: "\nDetermines operational objectives by studying business functions; gathering information; evaluating output requirements and formats\nDesigns new computer programs by analyzing requirements; constructing workflow charts and diagrams; studying system capabilities; writing specifications\nImproves systems by studying current practices; designing modifications\nRecommends controls by identifying problems; writing improved procedures\nDefines project requirements by identifying project milestones, phases, and elements; forming project team; establishing project budget\n"
  },
  {
    value: 282,
    jobFunc: 1,
    text: "CRM Business Analyst",
    assessment: "\nDetermine, implement, and evaluate business metrics to meet ongoing organizational or customer information needs\nAnalyze and report on complex data to meet customer needs\nCommunicate complex data in comprehensible ways\nIdentify user needs from user requests and develop strategies by which to meet those needs\nCritically evaluate information from multiple sources and clearly indicate quality of final analysis\n"
  },
  {
    value: 283,
    jobFunc: 1,
    text: "Solution Architect",
    assessment: "\ndefine, document, and communicate it\nmake sure everyone is using it, and using it correctly\nmake sure that it comes out in stages in a timely way so that the overall organization can make progress before it's complete\nmake sure the software and system architectures are in synchronization\nact as the emissary of the architecture\nmake sure management understands it (to the detail necessary)\nmake sure the right modeling is being done, to know that qualities like performance are going to be met\ngive input as needed to issues like tool and environment selection"
  },
  {
    value: 284,
    jobFunc: 1,
    text: "Pre-Sales Engineer",
    assessment: "\nResearch and understand customers’ business needs\nDemonstrate, validate software fit and handle pre-sale discovery\nPresent proposed solutions to customers\nReview, understand and qualify customer’s business processes\nDevelop compelling value proposition to identified needs\nOffer presales support to sales team members for products and solutions\nConfer with delivery team on design and solutions\nCollect market and customer requirements on ongoing customer visits\nDevelop customer proposals\n"
  },
  {
    value: 285,
    jobFunc: 1,
    text: "CRM Technical Developer",
    assessment: "\nCollaborate with other software developers, business analysts, software architects and IT professionals to implement Microsoft Dynamics CRM solutions\nDevelop and maintain a platform roadmap\nCustomize the system to meet the business needs of the company\nIntegrate existing systems and services into the CRM architecture\nAssist with deployment and provisioning activities\n"
  },
  {
    value: 286,
    jobFunc: 1,
    text: "Programmer Analyst",
    assessment: "\nIdentifies requirements by establishing personal rapport with potential and actual clients and with other persons in a position to understand service requirements\nArranges project requirements in programming sequence by analyzing requirements; preparing a work flow chart and diagram using knowledge of computer capabilities, subject matter, programming language, and logic\nPrograms the computer by encoding project requirements in computer language; entering coded information into the computer\nConfirms program operation by conducting tests; modifying program sequence and/or codes\nProvides reference for use of prime and personal computers by writing and maintaining user documentation; maintaining a help desk\n"
  },
  {
    value: 287,
    jobFunc: 1,
    text: "ERP Functional Analyst",
    assessment: "\nConduct application fit-gap analysis with assistance of packaged application specific technical resources\nAssist ERP Functional Lead in overseeing functional aspect of the new Order-To-Cash systems implementation and complete assigned tasks on time\nPrepare JAR/JAD materials, capture notes and parking lot items during JAR/JAD meetings\nAssist with project communications, scheduling and logistics\nSupport business and end-user correspondence\nDevelop and maintain relations between business process owners, users and consultants\n"
  },
  {
    value: 288,
    jobFunc: 1,
    text: "Database Administrator",
    assessment: "\nAssisting in database design\nUpdating and amending existing databases\nSetting up and testing new database and data handling systems\nMonitoring database efficiency\nSustaining the security and integrity of data\nCreating complex query definitions that allow data to be extracted\nTraining colleagues in how to input and extract data"
  },
  {
    value: 289,
    jobFunc: 1,
    text: "Project Manager",
    assessment: "\nPlanning and Defining Scope\nActivity Planning and Sequencing\nResource Planning\nDeveloping Schedules\nTime Estimating\nCost Estimating\nDeveloping a Budget\nDocumentation\nCreating Charts and Schedules\nRisk Analysis"
  },
  {
    value: 290,
    jobFunc: 4,
    text: "Call Center Agent",
    assessment: "Answer courteously inbound calls\nRespond to customer inquiries\nGenerate customer interest in the services or products offered by the company\nProvide personalized customer service by responding to the needs of the customers\nEnsure feedback from the customer to further improve the customer services\nManage and update customer databases with the status of each customer\n"
  },
  {
    value: 291,
    jobFunc: 4,
    text: "Call Center Operator",
    assessment: "Obtains client information by answering telephone calls; interviewing clients; verifying information\nDetermines eligibility by comparing client information to requirements\nEstablishes policies by entering client information; confirming pricing\nInforms clients by explaining procedures; answering questions; providing information\nMaintains communication equipment by reporting problems\n"
  },
  {
    value: 292,
    jobFunc: 4,
    text: "Customer Service Representative",
    assessment: "Deliver prompt and professional solutions for customer inquires via phone, email, online chat etc\nResearch, prioritize and resolve customer issues in timely and accurate fashion\nMaintain documentation of customer inquiries and responses for future reference\nDirect or route customer calls to appropriate personnel for assistance\nHandle dissatisfied customers in a polite and professional fashion\n"
  },
  {
    value: 293,
    jobFunc: 4,
    text: "Inside Sales Representative",
    assessment: "Develop and manage professional relations with peers, customers and other departments\nStudy, learn and interpret company system applications like HSOE, Business Objects, Oracle and Salesforce\ncom\nInterpret and manage particular customer portals like Vendor Central, Retail Link and Margin Maker Program\nPerform with warehouse to assure every purchase order is shipped on time and as per customers’ specifications\n"
  },
  {
    value: 294,
    jobFunc: 4,
    text: "Telemarketer",
    assessment: "Identifies prospects by reading telephone and zip code directories and other prepared listings\nCalls prospective customers by operating telephone equipment, automatic dialing systems, and other telecommunications technologies\nInfluences customers to buy services and merchandise by following a prepared sales talk to give service and product information and price quotations\nCompletes orders by recording names, addresses, and purchases; referring orders for filling\n"
  },
  {
    value: 295,
    jobFunc: 4,
    text: "Telemarketing Sales Representative",
    assessment: "Advises present or prospective customers by answering incoming calls on a rotating basis; operating telephone equipment, automatic dialing systems, and other telecommunications technologies\nInfluences customers to buy or retain product or service by following a prepared script to give product reference information\nDocuments transactions by completing forms and record logs\nMaintains database by entering, verifying, and backing up data\nKeeps equipment operational by following manufacturer's instructions and established procedures; notifying team leader of needed repairs\n"
  },
  {
    value: 296,
    jobFunc: 4,
    text: "Telemarketing Representative",
    assessment: "Advises present or prospective customers by answering incoming calls on a rotating basis; operating telephone equipment, automatic dialing systems, and other telecommunications technologies\nInfluences customers to buy or retain product or service by following a prepared script to give product reference information\nDocuments transactions by completing forms and record logs\nMaintains database by entering, verifying, and backing up data\nKeeps equipment operational by following manufacturer's instructions and established procedures; notifying team leader of needed repairs\n"
  },
  {
    value: 297,
    jobFunc: 4,
    text: "Telephone Sales Representative",
    assessment: "sales people who use the telephone to reach potential or existing customers\n Those who sell their companies' products to other organizations can be called inside sales representatives\n Selling done through phone calls to an individual might be referred to as telemarketing\n Excellent communication and phone skills, persuasiveness, patience, persistence, and keyboarding skills are needed for either type of telesales position\n"
  },
  {
    value: 298,
    jobFunc: 4,
    text: "Telesales Specialist",
    assessment: "sales people who use the telephone to reach potential or existing customers\n Those who sell their companies' products to other organizations can be called inside sales representatives\n Selling done through phone calls to an individual might be referred to as telemarketing\n"
  },
  {
    value: 310,
    jobFunc: 5,
    text: "Marketing & Promotional Manager",
    assessment: "Assess potential advertising options, create annual advertising plans for print, radio, web and social media\nDevelop effective plans to market new programs and initiatives\nManage excellent relations with faculty, staff and vendors\nSynthesize marketing and communications efforts with key department activities\nManage budget responsibilities for marketing and communications\nMeet advertising goals without overextending budget by working with Finance and Accounting Director\n"
  },
  {
    value: 311,
    jobFunc: 5,
    text: "Advertising Account Manager",
    assessment: "Manage a team of account executives to successfully execute advertising projects\nEnsure that the advertising campaign progresses according to customer needs\nIdentify prospective customers for new business deals through phone calls, networking, and meetings\nBuild and maintain strong relationship with the clients\nInteract regularly with clients throughout the campaign\nPrepare sales proposals and advertising contracts according to the company guidelines\nPerform customer negotiations for advertising cost and terms\nPrepare and present the documentation on new customer deals to the operations team\n"
  },
  {
    value: 313,
    jobFunc: 5,
    text: "Advertising Specialist",
    assessment: "Assist in managing and advertising the marketing projects for clients\nDevelop, monitor and implement the advertising projects submitted by clients\nWork with customers in analyzing product information, advertising history, needs, etc to provide appropriate marketing assistance\nWork with company’s supervisor in developing the strategies for project management and execution\nDetermine a proper advertising medium including direct mail, newspaper ads, online banners and email-marketing initiatives\n"
  },
  {
    value: 314,
    jobFunc: 5,
    text: "Engagement Manager",
    assessment: "Control multi-phase, multi-dimensional, multi -resource projects from start till end to conclude maintaining high customer satisfaction\nPrepare timeline estimates, resource requirements and detailed project plans\nPerform in compliance with operational aspects of the consulting practice\nEnsure contractual commitments delivery\nEnsure compliance with Project Management Office (PMO) delivery and risk mitigation standards\n"
  },
  {
    value: 315,
    jobFunc: 5,
    text: "Advertising Associate Editor",
    assessment: "Assign reporting tasks to reporters and correspondents\nConduct daily meetings on editorials\nLead, guide and direct reporters and assigned feature writers in developing news stories and features\nEdit, revise and rewrite content copies in accordance to the established procedures and standards\nInteract and confer with staff writers and authors\n"
  },
  {
    value: 316,
    jobFunc: 5,
    text: "Interactive Media Manager",
    assessment: "lead teams of marketing professionals through the creative development process\n They brainstorm different ways of interacting with consumers, from video, to polls, and even online games\ninvolve the consumer in the branding of a product\n This allows a consumer to feel more connected to the marketing process, and it even becomes something they enjoy participating in\n"
  },
  {
    value: 317,
    jobFunc: 5,
    text: "Multi Media Communications Consultant",
    assessment: "Drafting press releases, news, and magazine articles\nSetting up speaking engagements and preparing speeches for spokespeople\nDeveloping media plans and policies with executives in the organization\nDirecting public relations campaigns for a company or organization"
  },
  {
    value: 318,
    jobFunc: 5,
    text: "Advertising Buyer",
    assessment: "Plan, arrange, execute and control routine media buy process\nDevelop sound media buys to facilitate increase in sales and traffic for customers and negotiate best rates along with added value\nPerform with account services teams on competitive, marketplace conditions, promotional opportunities, media opportunities and billing\nPerform with account service and planning teams in different respects such as marketplace\n"
  },
  {
    value: 319,
    jobFunc: 5,
    text: "Community Manager",
    assessment: "Develop plans to preserve and amplify presentability of the community\nEvaluate applicants and oversee prompt renewals of certifications\nProvide inputs in recruitment, training and dismissal of staff\nMentor and guide staff to achieve management and community objectives\nSustain site operations, an oversee inspection of vacant and occupied property\nFollow inspection deadlines to ensure property maintenance\n"
  },
  {
    value: 320,
    jobFunc: 5,
    text: "Online Content Coordinator",
    assessment: "Develop digital publications for assigned web sites as per requirements\nDesign and provide digital content feeds to operate assigned webs on 24X7 basis\nPerform daily posting on websites with latest updates to provide sustainability to all online visitors\nDevelop and edit contents and obtain approval from managing editor for web publication\nAdminister work in work related environment to show case individual editing talents\n"
  },
  {
    value: 321,
    jobFunc: 5,
    text: "Advertising Junior Copywriter",
    assessment: "liaising with clients and interpreting their briefs\ndeveloping creative ideas and concepts, often in partnership with the art director\npresenting ideas to colleagues and clients\nfamiliarising themselves with their clients' products and services, the target audience and their competitors' activities\nwriting clear, persuasive, original copy\nupdating digital media\nproofreading copy to check spelling and grammar;"
  },
  {
    value: 322,
    jobFunc: 5,
    text: "Internet Marketing Manager",
    assessment: "Monitor all long term objectives and prepare efficient reporting tools for all search terms across various marketing channels\nAnalyze website and develop strategies to bring new visitors and retain all visitors to site with help of relationship marketing practices\nEnsure appropriate SEO of all websites and provide white SEO optimization and assist to rank website higher on search engines\nDevelop various internet marketing techniques and identify appropriate opportunity and prepare effective business cases\n"
  },
  {
    value: 323,
    jobFunc: 5,
    text: "Agency Account Coordinator",
    assessment: "Account coordinators act as representatives of a marketing firm\n In order to satisfy a client's needs, the account coordinator meets with that client to collect ideas and direction about a marketing campaign\n Then, the account coordinator meets with the sales and advertising team to communicate those ideas\nAccount coordinators are a mid-level position in an organization, and must effectively communicate goals and issues to a variety of marketing team members"
  },
  {
    value: 324,
    jobFunc: 5,
    text: "Interactive Media Coordinator",
    assessment: "Provide imperative input to media mix analysis and strategy\nDevelop and maintain relations between creative and marketing department for materials\nEnsure to posses sturdy negotiation skills outcomes in favored advertising rates\nIdentify apt placement tactics and spending levels working with marketing personnel\nIdentify and implement value-added opportunities for interactive media\n"
  },
  {
    value: 325,
    jobFunc: 5,
    text: "Interactive Media Associate",
    assessment: "Provide imperative input to media mix analysis and strategy\nDevelop and maintain relations between creative and marketing department for materials\nEnsure to posses sturdy negotiation skills outcomes in favored advertising rates\nIdentify apt placement tactics and spending levels working with marketing personnel\n"
  },
  {
    value: 326,
    jobFunc: 5,
    text: "Blogger",
    assessment: "Write fiction or nonfiction through scripts, novels, and biographies\nConduct research to obtain factual information and authentic detail\nChoose subject matter that interests readers\nWork with editors and clients to shape the material so it can be published\nManage the blog community by moderating and responding to comments\nSEO implementation\nHandle social media marketing activities such as posting to Twitter and Facebook\nAnswer emails on behalf of the blog\nPerform blog maintenance activities such as updating plugins\nWrite content for the blog\n"
  },
  {
    value: 327,
    jobFunc: 5,
    text: "Content Manager",
    assessment: "Create content strategy on business objectives and customer needs\nIdentify projects’ overall content requirements and prospective content sources\nDevelop creative solutions for content presentation, management, workflow and maintenance\nDevelop taxonomies and metadata framework for grouping and tagging content\nAssure content conforms to Search Engine Optimization best practices\n"
  },
  {
    value: 328,
    jobFunc: 5,
    text: "Communications planner",
    assessment: "reaching target audiences using marketing communication channels such as advertising, public relations, experiences or direct mail for example\n It is concerned with deciding who to target, when, with what message and how\n"
  },
  {
    value: 329,
    jobFunc: 5,
    text: "Traffic Manager",
    assessment: "Present written directions along with schedules to stations plus networks relevant with creative usage\nEnsure to order broadcast as well as telecast commercial material for air as in radio, TV, cable and satellite\nEnsure to deliver all creative on time\nUtilize media to buy plus prepare daily reports to assure air dates, logos, billboards and instructions sent within correct flight period\n"
  },
  {
    value: 330,
    jobFunc: 5,
    text: "Advertising Marketing Associates",
    assessment: "Investigate promotional opportunities and marketing initiatives like annual goals, messaging and business focus\nProduce approved content for placement in newsletters, websites, webinars and conference calls\nDevelop approved marketing materials to resonate with marketing initiatives\nEnsure materials follow regulations with management and legal teams\n"
  },
  {
    value: 331,
    jobFunc: 5,
    text: "Social Media Account Executive",
    assessment: "Manage all aspects of the inside sales function including the development of new and incremental business by seeking out new clients, determining needs, and proposing appropriate programs to them directly\n Develop and maintain relationships within the automotive category specifically individual dealerships and associations nationwide\n Develop and maintain sales forecasts against plan, and assist in providing competitive analysis and strategies\n"
  },
  {
    value: 332,
    jobFunc: 5,
    text: "Advertising Coordinator",
    assessment: "Coordinate all advertising related activities\nCoordinate with accounts department for billing issues\nCoordinate and support sales and marketing teams in capturing new clients\nCoordinate and interact with creative heads in creating advertising campaigns\nAssist creative team in building brand image for clients’ products or services\nMaintain and update customer databases\n"
  },
  {
    value: 334,
    jobFunc: 5,
    text: "Advertising Assistant",
    assessment: "Assist the creative team in designing and creating advertising campaigns\nInteract with clients and identify their goals and objectives\nConduct market research appropriate to customers’ needs\nAssist in competitor analysis and other surveys\nCommunicate clients about rates, changes and corrections\n Prepare market analysis reports for the"
  },
  {
    value: 335,
    jobFunc: 5,
    text: "Social Media Analyst",
    assessment: "\nManage and help to create marketing content to socialize and use for social media purposes (eg customer videos briefs, customer case studies, blog posts, posts from analysts and customers)\nSupport SEO strategies by understanding keyword priorities and how they integrate into content marketing plans\nAssist in link building campaigns in coordination with client SEO goals\nProvide analysis and recommendations as the program evolves and can be reviewed\nResearch and administer social media tools on a daily basis in support of clients’ social media strategy\nMonitor and evaluate social media results on a daily basis in coordination with client goals and benchmarks"
  },
  {
    value: 336,
    jobFunc: 5,
    text: "Advertising Sales Representative",
    assessment: "Introduce sales strategies and approaches to achieve sales and revenue goals\nDevelop sales proposals and sales orders for customers\nProvide excellent customer services to ensure customer satisfaction\nAddress customer queries in a timely manner\nAnalyze customer complaints and provide appropriate resolutions\nCoordinate with Advertising Director to create multi platform ad campaigns to increase revenue\n"
  },
  {
    value: 337,
    jobFunc: 5,
    text: "Assistant Media Planner",
    assessment: "Assist in coordinating, developing and implementing media plan\nUse research tools to collect and organize information for media planning\nCollaborate with Head Planner to issue buying specification and authorization\nMaintain professional relationship with vendors and organize vendor meetings as required\nAssist in budget preparation and allocation for different media\nMaintain budget reports and control expenses within allotted budget\n"
  },
  {
    value: 338,
    jobFunc: 5,
    text: "Client Strategist",
    assessment: "Responsible for working with clients to oversee their Interactive Marketing programs with us, which could include: Search Engine Marketing (cost per click/cpc), Search Engine Optimization, Web Design, Mobile, Analytics Consulting, Digital and Social Media\nCollaborate with internal colleagues, responsible for tactical management of the client’s advertising, optimization and social campaigns\nMonitor advertising budget and increase client’s ROI and conversion performance through recommendations of new strategies and ideas to test\n"
  },
  {
    value: 339,
    jobFunc: 5,
    text: "Target Marketing Strategist II",
    assessment: "Arrange, implement and monitor marketing and sales campaigns\nFacilitate and head annual customer business meetings\nParticipate in all strategy sessions to identify customer and prospect sales opportunities\nManage or coordinate marketing multiple campaigns for different product lines\nContribute to quantitative and qualitative campaign research\n"
  },
  {
    value: 340,
    jobFunc: 5,
    text: "Associate Communications planner",
    assessment: "Manage day-to-day plan changes/maintenance of media plans\nWork directly with the Assistant Media Planner in creating, updating, and presenting media plans\nPresent plans both internally and externally\nDevelop strategically solid media recommendations with supporting rationale\nAssist in the analysis of research to develop the objectives, strategies, and tactics"
  },
  {
    value: 341,
    jobFunc: 5,
    text: "Trainee",
    assessment: "Manage operations, staffing and sales along with profit goals in sole assigned retail store\nEnsure complete conformance with entire store operations policies\nManage store’s inventory with all established company guidelines\nEnsure to receive, check and place all merchandise orders\n"
  },
  {
    value: 343,
    jobFunc: 8,
    text: "Graphic Art Managers",
    assessment: "Design and develop creative graphics for web and publications\nDevelop and maintain graphics for banners, magazines, marketing materials, website, apparel, and accessories\nProduce graphics that accurately conveys the outlined viewpoint and information\nUnderstand requirements and develop high quality graphics in a cost-effective manner\nCreate seasonal graphics when needed\n"
  },
  {
    value: 344,
    jobFunc: 8,
    text: "Creative Director",
    assessment: "Write creative briefs and presentations\nDirect, guide and oversee designers and project teams\nLead and handle creative key accounts\nAssess and evaluate creative needs for a project\nDesign recommendations to meet client requirements\nSet creative goals for a site design\nConduct creative review meetings to evaluate and refine creative concepts\n"
  },
  {
    value: 345,
    jobFunc: 8,
    text: "Senior Art Director",
    assessment: "Create and integrate innovative logistics in the functions of an art director\nDirect, lead and guide operations of art department in an advertising agency\nCreate original conceptual advertising campaigns for clients and their products\nCoordinate with copywriters, artists, photographers and production teams in preparing commercial campaigns\nInteract with clients and account executive in creating advertising campaigns\nManage multiple projects within the time limits meeting deadlines\n"
  },
  {
    value: 346,
    jobFunc: 8,
    text: "Art Production Manager",
    assessment: "keeps all tasks in line with production, timeframe and budget\n In the gaming industry, an art production manager is essential in implementing the artistic vision while following project specifications, timeline, budget and deadlines\n Regardless of industry, an art production manager works with a wide range of professionals from the research and development, editing, quality control and other departments to solve issues that need to be dealt with\n The art production manager also meets with different department heads regularly to discuss project improvement\n"
  },
  {
    value: 348,
    jobFunc: 8,
    text: "Brand Identity Developer",
    assessment: "Brand identity design is associated with the visual features of an organization’s brand identity\nBrand identity design is the visual element that represents how a company wants to be seen; it is the\ncompany’s visual\ncharacter, and is how a company illustrates\nits ‘image\n’ A company’s brand identity\ncan be represented in terms of design through a unique logo, or signage, and is then often included\nthroughout all the elements of a company’s\nresources such as business cards, stationery, packaging, media advertising, promotions, and more\n Brand identity may include logo design\n Brand identity development is usually a combined effort between creative directors, art directors, copywriters account managers and the client\n"
  },
  {
    value: 349,
    jobFunc: 8,
    text: "Print Production manager",
    assessment: "Conduct project management of direct mail plus newspaper insert print programs by negotiating, sourcing, awarding as well as management of Bed Bath along with approved suppliers\nCoordinate and manage workflow throughout multiple agency and production relationships\nManage BBB and subsidiary assets related to print production\nImplement special projects as assigned like digital asset management system, central photography studio, soft proofing process and in-house operation exploratory etc\n"
  },
  {
    value: 350,
    jobFunc: 8,
    text: "Assistant Art Director",
    assessment: "basic design or clerical work\n They may also be tasked with supervising and coordinating illustrators, photographers, designers or videographers, and reviewing the portfolios of potential freelancers\n In addition, they may help the art director in deciding what photographs and artwork to use in publications or shows\n"
  },
  {
    value: 351,
    jobFunc: 8,
    text: "Assistant Art Production Associate",
    assessment: "Assist Production Manager in planning and performing production related activities\nPrioritize, plan, schedule and manage production activities to meet manufacturing objectives in timely and cost-effective manner\nIdentify production issues, analyze root causes and derive resolutions\nPerform inventory management and report warehouse status to Manager\n"
  },
  {
    value: 352,
    jobFunc: 8,
    text: "Broadcast Designer",
    assessment: "Often working with artistic and creative directors, writers, technicians, producers and other artists, broadcast designers are generally good listeners and effective communicators\n They must possess adequate drawing and composition skills because many ideas and presentations begin with a sketch or storyboard\n Storyboards are illustrative outlines of a scene or sequence of scenes to be filmed or animated later\n These sketches are presented to clients and may undergo revisions\n"
  },
  {
    value: 353,
    jobFunc: 8,
    text: "Logo Designer",
    assessment: "Creating layouts by implementing the appropriate design principles\nWorking from rough instructions to prepare layouts including online promotions, digital signage and online demos etc\nDesigning logos and collateral materials as per the specifications of the clients\nCoordinating with the design director in all phases of project development\nCreating and modifying Illustrator vector graphics\nProviding creative and functional design solutions to clients\n"
  },
  {
    value: 354,
    jobFunc: 8,
    text: "Senior Illustrator Manager",
    assessment: "liaising with clients, editors and authors in order to understand and interpret their business needs\ngaining knowledge of appropriate styles\nnegotiating pricing and deadlines\nanalysing a brief's specification and the text to be illustrated as well as researching sources\nthinking creatively and using imagination to produce new ideas\ncreating images and designs by using the traditional hand skills of drawing and painting, alongside other techniques, to meet design briefs;"
  },
  {
    value: 355,
    jobFunc: 8,
    text: "Associate Broadcast Designer",
    assessment: "Often working with artistic and creative directors, writers, technicians, producers and other artists, broadcast designers are generally good listeners and effective communicators\n They must possess adequate drawing and composition skills because many ideas and presentations begin with a sketch or storyboard\n Storyboards are illustrative outlines of a scene or sequence of scenes to be filmed or animated later\n These sketches are presented to clients and may undergo revisions\n"
  },
  {
    value: 356,
    jobFunc: 8,
    text: "Senior Multimedia Developer",
    assessment: "Complete project assignments within allotted budget and timeline\nDevelop graphics and animations based on client needs and company standards\nDesign and develop complex animations using experience, creativity skills and independent judgment\nProvide design support to multimedia development and enhancement projects\nAttend client meetings to understand project requirements\nAssist in development of storyboarding to display the flow of animation sequence\n"
  },
  {
    value: 357,
    jobFunc: 8,
    text: "Head of Photography Department",
    assessment: "Directors of Photography (DoPs) are key Heads of Department on film productions and theirs is one of the major creative roles\n They provide a film with its unique visual identity, or look\nDoPs must discover the photographic heart of a screenplay, using a variety of source material including stills photography, painting, other films, etc\nThey create the desired look using lighting, framing, camera movement, etc\n DoPs collaborate closely with the camera crew (Camera Operator, 1st and 2nd Assistant Camera, Camera Trainee and Grips)\n"
  },
  {
    value: 358,
    jobFunc: 8,
    text: "Visual Image Developer",
    assessment: "Design and develop systems administration and maintenance\nProvide onsite customer support\nDetermine and develop required enhancements to the system\nInitiate and implement full life-cycle development\nWrite code for software applications\nDevelop designs to support business requirements and needs\nInitiate and implement quality assurance protocols for software\n"
  },
  {
    value: 359,
    jobFunc: 8,
    text: "Head Content Developer",
    assessment: "Evaluating and building upon communication strategies\nUnderstanding the attitudes and behaviors of target customers\nFluency in major communications channels and ability to think and execute at the intersection of offline/online and paid/non-paid channels\nKnowing the basic technical possibilities of various communications channels\nParticipating in and overseeing concept development in various communications channels\nWorking with associates in brand planning/brand strategy to ensure that creative work is on strategy\n"
  },
  {
    value: 360,
    jobFunc: 8,
    text: "Illustrator Assistant Manager",
    assessment: "liaising with clients, editors and authors in order to understand and interpret their business needs\ngaining knowledge of appropriate styles\nnegotiating pricing and deadlines\nanalyzing a brief's specification and the text to be illustrated as well as researching sources\nthinking creatively and using imagination to produce new ideas\ncreating images and designs by using the traditional hand skills of drawing and painting, alongside other techniques, to meet design briefs;"
  },
  {
    value: 361,
    jobFunc: 8,
    text: "Visual Journalist",
    assessment: "Take photographs or film video segments\nProcess and print negatives or film\nCapture images in an authentic and ethical manner\nWrite copy, captions or headlines to accompany photos\nUse image-editing software such as Photoshop to edit images\nPrepare audio to accompany video segments\nPitch ideas and photographs to editorial staff\nTravel to photo shoot locations\nEdit photographs or video for publication specific to Internet"
  },
  {
    value: 362,
    jobFunc: 8,
    text: "Senior Layout Artist",
    assessment: "Meet with clients and find out the requirements for their projects Develop concepts that are creative and innovative Design sample layouts by applying information related to the layout principles and procedures Select applicable font and size, and copy that style and size for the material that is to be illustrated Make use of computers to create and concept graphics and layouts for numerous products Manage an archive of photographs and images, which can be used for the company’s websites Use series of charts, illustrations, graphs, and other relevant designs, and review the final layout and make suggestions to boost it"
  },
  {
    value: 363,
    jobFunc: 8,
    text: "Interface Designer",
    assessment: "Initiate and implement fundamental usability and aesthetic properties in user interface designs\nDetermine and define software user interface designs to customers\nDevelop software user interface with specifications appropriate to products or projects\nCoordinate and collaborate with software professionals, graphic artists and others on assigned projects\n"
  },
  {
    value: 364,
    jobFunc: 8,
    text: "Layout Designer",
    assessment: "Develop layouts in InDesign suitable for entire product categories\nPrepare templates and die-lines from scratch\nDevelop and present production mock-ups\nArrange office supplies commensurate to department budgets\n"
  },
  {
    value: 365,
    jobFunc: 8,
    text: "Head Web Designer / Developer",
    assessment: "liaising with outside agencies\ntesting the website to ensure it is working\nhanding the completed website over to the client\npost-sales technical support\ntraining client's staff\nresearching current design trends\ncontinual professional development to keep up to date with new software developments\n"
  },
  {
    value: 366,
    jobFunc: 8,
    text: "Associate Web Designer",
    assessment: "meeting clients to identify their needs and liaising regularly with them\ndrawing up detailed website specifications\ndesigning sample page layouts including text size and colours\ndesigning graphics, animations and manipulating digital photographs\nregistering web domain names and organising the hosting of the website\npresenting initial design ideas to clients\ncoding using a variety of software;"
  },
  {
    value: 367,
    jobFunc: 8,
    text: "Associate Content Developer",
    assessment: "Create, write and manage user documentation for company products\nCoordinate on cross-functional teams to determine content and training needs\nAssess, test and document new and upcoming product features\nDraft and review product design and requirements documents\nDraft and manage corporate style guide and terminology conventions\n"
  },
  {
    value: 368,
    jobFunc: 8,
    text: "Graphic Design Analyst",
    assessment: "Create engaging and inspirational materials using Adobe software and Microsoft Office\nCreate and edit PowerPoint presentations to powerfully represent information in a clear and understandable manner\nStrong understanding of information design to create info graphics, charts and graphs\nParticipate in brainstorming session to share new design perspectives and ideas\nMaintain up-to-date knowledge about latest graphic design techniques\nDiscuss technical solutions with clients and management and provide innovative new ideas and solutions to problems"
  },
  {
    value: 369,
    jobFunc: 8,
    text: "Graphic Package Designer",
    assessment: "begin the design process by meeting with clients to develop an understanding of their packaging needs\n They then assess consumer tastes, market trends and product details to conceptualize package designs\n Together, clients and designers determine how to meet goals pertaining to cost, safety and branding\n Package designers may spend time conducting additional research and meeting with suppliers or consumer groups to develop ideas\nNext, package designers illustrate their ideas\n They may use hand-drawn sketches or design software to create digital drafts\n After they've developed and edited a design, package designers again meet with clients to gather additional feedback\n The process of re-designing continues until the designer and client are satisfied with the design\n"
  },
  {
    value: 370,
    jobFunc: 8,
    text: "Photographer",
    assessment: "working with clients to discuss the images they require and how they want to use them\nseeking out appropriate photographic subjects and opportunities\ncarrying out research and preparation for a shoot\nworking in different locations and in different circumstances to get the right image\nusing an extensive range of technical equipment, including cameras, lenses, lighting and specialist software\ncommunicating with photographic subjects, putting them at ease, encouraging them and directing them;"
  },
  {
    value: 371,
    jobFunc: 8,
    text: "Junior Multimedia Developer",
    assessment: "Complete project assignments within allotted budget and timeline\nDevelop graphics and animations based on client needs and company standards\nDesign and develop complex animations using experience, creativity skills and independent judgment\nProvide design support to multimedia development and enhancement projects\nAttend client meetings to understand project requirements\n"
  },
  {
    value: 372,
    jobFunc: 8,
    text: "Graphic Design Associate",
    assessment: "An associate graphic designer teams up with other staff in the creative team for brainstorming\nHe helps in preparing presentations for the clients and delivering the same if asked by the design director\nHe presents estimated costs to the clients and project manager\nHe utilizes his creativity and technical expertise and designs graphical content for the projects\n"
  },
  {
    value: 373,
    jobFunc: 8,
    text: "Graphic Design Trainee",
    assessment: "Offering input to creative meetings and sharing ideas\nProducing attractive and effective designs for all media\nCommunicating with senior team members to receive feedback\nLiaising effectively with clients and other team members\nSupporting the team throughout the execution of campaigns and projects"
  },
  {
    value: 374,
    jobFunc: 4,
    text: "Chief Sales Executive",
    assessment: "Aligns the sales organization’s objectives with firm business\nstrategy through active participation in corporate strategic\nplanning, sales strategy development, forecasting, sales resource\nplanning, and budgeting\n Accountable for effective sales organization design, including sales\njob roles, sales channel design, and sales resource deployment\n Meets assigned targets for profitable sales volume, market share,\nand other key financial performance objectives\n Leads learning and development initiatives impacting the sales\norganization, and provides stewardship of sales and sales\nmanagement talent"
  },
  {
    value: 375,
    jobFunc: 4,
    text: "National Sales Manager",
    assessment: "Oversee national sales, promotions, collections and other activities to achieve sales target\nBuild positive working relationship with existing clients for repeat business\nIdentify and contact potential customers for new business opportunities\nCoordinate with sales team to plan promotional activities, trade shows and special events\nMotive and guide sales team to achieve revenue targets\n"
  },
  {
    value: 376,
    jobFunc: 4,
    text: "Sales Vice President",
    assessment: "Develop plans and strategies for developing business and achieving the company’s sales goals\nCreate a culture of success and ongoing business and goal achievement – possibly more important than the first item on this list\nManage the sales teams, operations and resources to deliver profitable growth\nManage the use of budgets\nDefine optimal sales force structure\nHire and develop sales staff\nBecome known as an employer of choice and a sales force that top sales people want to join\nDefine and oversee sales staff compensation and incentive programs that motivate the sales team to achieve their sales targets"
  },
  {
    value: 377,
    jobFunc: 4,
    text: "General Manager – Sales",
    assessment: "Oversee sales and marketing activities to achieve corporate revenue goals\nPlan and assign daily workload to sales team\nInterview, hire and train sales representatives\nEvaluate performance of sales team and provide appropriate feedback\nProvide guidance to sales representatives in their assigned duties\n"
  },
  {
    value: 378,
    jobFunc: 4,
    text: "Regional Sales Manager",
    assessment: "Accomplishes regional sales human resource objectives by recruiting, selecting, orienting, training, assigning, scheduling, coaching, counseling, and disciplining employees in assigned districts; communicating job expectations; planning, monitoring, appraising, and reviewing job contributions; planning and reviewing compensation actions; enforcing policies and procedures\n"
  },
  {
    value: 379,
    jobFunc: 4,
    text: "National Sales coordinator and Distributor",
    assessment: "Supervise daily operations of account team for continuous business growth\nBuild positive relationship with clients to maximize sales revenue\nIdentify and contact potential customers for new business opportunities\nCooperate with other managers to develop business plan and strategies\nRecommend process improvements to improve sales and profitability\n"
  },
  {
    value: 380,
    jobFunc: 4,
    text: "Senior Sales Accountant",
    assessment: "Accounting for the sales & collections, follow up for the timely collections from all the customers\n Ensuring that the credit limit is not surpassed and overdue collections are collected immediately\n Reconciliation of the receivables with the customer statements\n Coordination and liaison with the customers regarding any official correspondence\n Assisting sales management in the preparation, review and renewal of the sales contracts, space rent contract\n"
  },
  {
    value: 381,
    jobFunc: 4,
    text: "Senior Sales Manager",
    assessment: "Lead, guide and mentor sales personnel\nSet sales targets for the sales team to achieve outcomes\nProvide daily support to the sales force\nStudy and analyze marketing trends for own products or services\nCreate innovative ways to attract and capture customers\nResolve complex customer issues and needs\n"
  },
  {
    value: 382,
    jobFunc: 4,
    text: "Sales Administrator",
    assessment: "Sales Administrator\nInitiate and implement sales strategies\nManage pre-sales activities\nProvide administrative counsel to sales team\nPlan, schedule and execute sales meetings to achieve outcomes\nSet goals for sales and marketing personnel\nMaintain and manage accounts receivables\nMaintain and manage sales databases\n"
  },
  {
    value: 383,
    jobFunc: 4,
    text: "Sales Branch Manager",
    assessment: "Administer and ensure compliance to all sales practices for branch and perform various training sessions for same and coordinate with sales associates to maintain all activity\nAdminister and review efficient usage of all sales formula and aid and prepare effective sales programs for fields and maintain quality of all images\nIdentify appropriate sales staff and establish an efficient work procedure and prepare required work schedule and analyze all cancellation requests for customers\n"
  },
  {
    value: 384,
    jobFunc: 4,
    text: "Assistant Sales Branch Manager",
    assessment: "Assist sales and marketing staff in achieving sales targets\nAssist and support in maintaining and managing customer databases\nAssist in preparing sales budget\nAssist top sales management in executing sales strategies\nManage and build customer relationships\nGather and collect market survey reports\n"
  },
  {
    value: 385,
    jobFunc: 4,
    text: "Sales Specialist I",
    assessment: "Create and develop sales strategies to enhance business growth\nAnalyze, evaluate and assess sales territories for own products or services\nRecommend improvements and changes as appropriate to company sales policies\nDetermine and set goals and objectives for the sales professionals\nSupport, lead and mentor sales personnel in achieving sales outcomes\n"
  },
  {
    value: 386,
    jobFunc: 4,
    text: "Market Research Analyst",
    assessment: "Communicating with clients to understand and document the business objectives\nFormulating analysis plans and acquiring client sign-off\nDesigning or assisting in the development of questionnaires and moderator guides to ensure the necessary data is captured\nConducting in-depth data analyses using traditional and advanced methods\nAuthoring reports containing actionable recommendations\nMaking presentations—answering questions and instilling confidence"
  },
  {
    value: 387,
    jobFunc: 4,
    text: "Lead Development Officer",
    assessment: "Elaborate business development plans, design and implement processes to support business growth, through customer and market definition\nFacilitate business growth by working together with clients as well as business partners (suppliers, subcontractors, JV partners, technology providers,etc) \n\nBuild and maintain high-level contacts with current and prospective customer and other business and project partners\nDrive prospects through to contract award (including identifying new customers and markets, developing approaches to the market, identifying prospects, proposal preparation,etc) \n\nDevelop marketing strategy, manage proposal teams and client account managers\n"
  },
  {
    value: 388,
    jobFunc: 4,
    text: "Inside Sales Consultant",
    assessment: "Perform as consultant to identify sales opportunities with prospective customer accounts\nDevelop and manage relations with new buying accounts\nPlan and execute telemarketing along with prospecting objectives\nProvide clients with complete details on products and services\nEnsure to upsell services and products as appropriate\n"
  },
  {
    value: 389,
    jobFunc: 4,
    text: "Sales Coordinator",
    assessment: "Coordinate support to sales professionals in creating sales strategies\nDevelop methodologies and logistics to market and sell products or services\nCoordinate and assist customers in meeting their merchandise requirements\nSupport sales and marketing teams in achieving hundred percent outcomes\nCoordinate sales efforts in reaching or exceeding sales targets and goals\n"
  },
  {
    value: 390,
    jobFunc: 4,
    text: "Junior Sales Consultant",
    assessment: "Identify market needs for clients’ products or services\nCreate marketing strategies for clients to capture market share for their products or services\nResearch, study and assess current marketing trends for clients\nAnalyze and write reports on marketing trends\nAnalyze competitors’ products and market trends\n"
  },
  {
    value: 391,
    jobFunc: 4,
    text: "Team Leader",
    assessment: "Endeavor to establish an outstanding working relationship with service providers in designated field\nBargain or support bargaining with key essential service so as to enhance the cost structure\nPrepares annual, quarterly and monthly update accounts on current opponents or business possibilities\nWork together with colleagues from other departments to improve efficiency and overall service delivery\nGive prompt reports on crucial issues to direct senior officer, suggest answers where obtainable\nSupervise essential key account possibilities\n"
  },
  {
    value: 392,
    jobFunc: 4,
    text: "Senior Sales Analyst",
    assessment: "Create and develop sales strategies for business units\nConduct research on marketing trends and issues\nAnalyze current sales strategies and make recommendations\nAnalyze, evaluate and assess pricing proposals\nAnalyze and evaluate competitor marketing trends\n"
  },
  {
    value: 393,
    jobFunc: 4,
    text: "Quality Analyst",
    assessment: "Provide feedback, coaching and mentoring on an ongoing basis to improve process efficiency\nShould work closely with Operations and Training team and give inputs to improve quality standards\nContent development\n Should be well versed with developing quality guidelines for the process\nTransaction monitoring\nEnsuring zero defects\nReview quality process periodically and prepare action plans for process excellence\n"
  },
  {
    value: 394,
    jobFunc: 4,
    text: "Sales Person",
    assessment: "Ensure to greet clients coming to store\nRespond to all incoming calls plus complete suitable paperwork for entire sales\nExecute task to make outgoing calls to all past and prospective customers\nLog statements along with new prospects in computer systems\nCoordinate selection of vehicle under Store Manager’s guidance\n"
  },
  {
    value: 395,
    jobFunc: 1,
    text: "CTO or Chief Technical Officer",
    assessment: "Establish the company’s technical vision and leads all aspects of the company’s technological development\nDirects the company’s strategic direction, development and future growth\nWorks in a consultative fashion with other department heads, such as marketing, production and operations as an advisor of technologies that may improve their efficiency and effectiveness\nProvide leadership to department heads in a fashion that supports the company’s culture, mission and values\n"
  },
  {
    value: 396,
    jobFunc: 1,
    text: "Configuration Manager/Administrator",
    assessment: "Provide support to project teams in configuring and base-lining project items\nPrepare configuration documentations and maintain Configuration Management (CM) database\nReview and recommend improvements to existing CM processes\nMaintain data quality, integrity and security of CM database\nSchedule audits on CM database and assist in implementing audit recommendations\n"
  },
  {
    value: 397,
    jobFunc: 1,
    text: "Project engineer",
    assessment: "Develops project objectives by reviewing project proposals and plans; conferring with management\nDetermines project responsibilities by identifying project phases and elements; assigning personnel to phases and elements; reviewing bids from contractors\nDetermines project specifications by studying product design, customer requirements, and performance standards; completing technical studies; preparing cost estimates\nConfirms product performance by designing and conducting tests\nDetermines project schedule by studying project plan and specifications; calculating time requirements; sequencing project elements\n"
  },
  {
    value: 398,
    jobFunc: 1,
    text: "Senior Software Engineer/Developer",
    assessment: "Develops software solutions by studying information needs; conferring with users; studying systems flow, data usage, and work processes; investigating problem areas; following the software development lifecycle\nDetermines operational feasibility by evaluating analysis, problem definition, requirements, solution development, and proposed solutions\nDocuments and demonstrates solutions by developing documentation, flowcharts, layouts, diagrams, charts, code comments and clear code\nPrepares and installs solutions by determining and designing system specifications, standards, and programming\n"
  },
  {
    value: 400,
    jobFunc: 1,
    text: "Testing manager",
    assessment: "Understand the testing effort by analyzing the requirements of project\nEstimate and obtain management support for the time, resources and budget required to perform the testing\nOrganize the testing kick-off meeting\nDefine the Strategy\nBuild a testing team of professionals with appropriate skills, attitudes and motivation\nIdentify Training requirements and forward it to the Project Manager (Technical and Soft skills)\n"
  },
  {
    value: 401,
    jobFunc: 1,
    text: "Software Engineer",
    assessment: "\nDetermines operational feasibility by evaluating analysis, problem definition, requirements, solution development, and proposed solutions\nDocuments and demonstrates solutions by developing documentation, flowcharts, layouts, diagrams, charts, code comments and clear code\nPrepares and installs solutions by determining and designing system specifications, standards, and programming\nImproves operations by conducting systems analysis; recommending changes in policies and procedures\nObtains and licenses software by obtaining required information from vendors; recommending purchases; testing and approving products\n"
  },
  {
    value: 402,
    jobFunc: 1,
    text: "Process Analyst",
    assessment: "Analyze, develop and configure business processes and data structures\nAnalyze, develop and implement new business architecture\nTranslate business objectives and requirements into functional and system specifications\nDevelop, configure and test business requirements\nCreate and generate detailed project documentation\n"
  },
  {
    value: 403,
    jobFunc: 1,
    text: "Implementation Manager",
    assessment: "Manage future implementations and system enhancements by collaborating with various business areas and system owners\nDefine requirements and monitor those through to implementation\nCollaborate with vendors to implement enhancements\nDevelop and maintain implementation and enhancement project plans\nManage project with specific focus on deliverables, tasks and due dates\n"
  },
  {
    value: 404,
    jobFunc: 1,
    text: "Application Engineer",
    assessment: "Assist customer to understand all products and perform demo for various field applications\nInstall and configure system and perform troubleshoot on process and resolve issues\nProvide technical support to customer and configure services\nDevelop and maintain documents for designs and application notes and provide updates\n"
  },
  {
    value: 405,
    jobFunc: 1,
    text: "Assistant System Admin",
    assessment: "Work closely with the IT Manager to insure as little employee downtime as possible\nOutstanding customer service\nHandle and resolve help desk tickets and escalate to IT Manager when necessary\nCable management\nVirus and malware removal skills\nNew PC deployment skills\nIdentify, interpret, and evaluate systems and network requirements\nBe proactive\nSupport remote users via remote control software and telephone"
  },
  {
    value: 406,
    jobFunc: 1,
    text: "Configuration Executive",
    assessment: "Schedule audits on CM database and assist in implementing audit recommendations\nDevelop security guidelines to avoid unauthorized damage or usage of project items\nWork with configuration teams in development and enhancement of CM tools\nAssist in management, maintenance and automating of CM tools\nMaintain proper version controls of software deliverables\n"
  },
  {
    value: 407,
    jobFunc: 1,
    text: "Software Associate/Trainee",
    assessment: "Determines operational feasibility by evaluating analysis, problem definition, requirements, solution development, and proposed solutions\nDocuments and demonstrates solutions by developing documentation, flowcharts, layouts, diagrams, charts, code comments and clear code\nPrepares and installs solutions by determining and designing system specifications, standards, and programming\nImproves operations by conducting systems analysis; recommending changes in policies and procedures\nObtains and licenses software by obtaining required information from vendors; recommending purchases; testing and approving products\n"
  },
  {
    value: 408,
    jobFunc: 1,
    text: "C++ engineer",
    assessment: "Design, build, and maintain efficient, reusable, and reliable C++ code\nImplement performance and quality modules\nIdentify bottlenecks and bugs, and devise solutions to these problems\nHelp maintain code quality, organization, and automatization"
  },
  {
    value: 409,
    jobFunc: 1,
    text: "Assistant Quality Analyst",
    assessment: "look at products, systems and materials to make sure there are no defects, and make sure that it is made to company standards\n QA analysts work in many different fields, from the food industry to transportation, ensuring quality products leave the manufacturer on the way to consumers\n They read blueprints and use specialized inspection equipment such as gauges, calipers, voltmeters and others to measure the standards of quality needed to deliver safe goods\n"
  },
  {
    value: 410,
    jobFunc: 6,
    text: "Accounts Director",
    assessment: "Identify business opportunities with both new and existing customers\nWork with customers to understand business needs and provide optimum solutions\nManage day-to-day activities of Account Managers and Account Coordinators\nProvide support and guidance to account management team\nTrack and monitor overall account performance to meet revenue targets\nWork with management in identifying business success factors and risks for new and existing clients\n"
  },
  {
    value: 411,
    jobFunc: 6,
    text: "Chief Finance Officer",
    assessment: "Accomplishes finance human resource strategies by determining accountabilities; communicating and enforcing values, policies, and procedures; implementing recruitment, selection, orientation, training, coaching, counseling, disciplinary, and communication programs; planning, monitoring, appraising, and reviewing job contributions; planning and reviewing compensation strategies\nDevelops finance organizational strategies by contributing financial and accounting information, analysis, and recommendations to strategic thinking and direction; establishing functional objectives in line with organizational objectives\n"
  },
  {
    value: 412,
    jobFunc: 6,
    text: "Accounts Vice President",
    assessment: "Directing all aspects of accounting operations, overseeing all transactions related to general ledger, receivables, payables, payroll and financial reporting\nAnalyzing company's financial results with respect to profits, trends, costs and compliance with budgets\n Issue regular status and ad hoc reports to senior management\n"
  },
  {
    value: 413,
    jobFunc: 6,
    text: "Senior Accounts Manager",
    assessment: "Participate in various trade and association meeting and develop strategies to achieve sales goals\nDevelop and maintain professional relationship with regional accounts and prospects\nManage and prepare all underwriting documents and implement all volume plans\nPrepare and negotiate contracts and ensure compliance to regulations formulated by business managers\n"
  },
  {
    value: 414,
    jobFunc: 6,
    text: "Senior Accounts Administrator",
    assessment: "Manage processing and reconciliation of various cash deposits and journal entries for investment accounts\nPrepare and maintain records of purchase orders and cash payments for all accounts\nAssist various departments to perform audit, issue certificates and policies for same\nManage all bill premiums and maintain appropriate documentation for all reinsurance activities\nMaintain and update all client files on standard filing system and ensure availability of projects and investigate any issues\n"
  },
  {
    value: 415,
    jobFunc: 6,
    text: "Director of Cash Management",
    assessment: "Manage incoming and outgoing cash effectively on a daily basis\nDevelop strategies to optimize cash position of the company\nPredict cash requirements and cash position through analysis of budgetary needs and financial reports\nForecast daily cash position by utilizing cash receipts and disbursements\n"
  },
  {
    value: 416,
    jobFunc: 6,
    text: "Accounting Analyst I",
    assessment: "Initiate analyses of all accounting systems and procedures\nPlan and deploy proactive accounting systems in sales and marketing departments\nAnalyze, initiate and implement best practices and procedures in the accounting department\nEstablish accounting controls to generate various financial reports\nAnalyze financial performance and day-to-day tasks\n"
  },
  {
    value: 417,
    jobFunc: 6,
    text: "Senior Accounts Receivable Manager",
    assessment: "Accomplishes accounts receivable human resource objectives by selecting, orienting, training, assigning, scheduling, coaching, counseling, and disciplining employees; communicating job expectations; planning, monitoring, appraising job contributions; recommending compensation actions; adhering to policies and procedures\nMeets accounts receivable operational standards by contributing information to strategic plans and reviews; implementing production, productivity, quality, and customer-service standards; resolving problems; identifying system improvements\nMeets accounts receivable financial standards by providing annual accounts receivable budget information; monitoring expenditures; identifying variances; implementing corrective actions\n"
  },
  {
    value: 418,
    jobFunc: 6,
    text: "Senior Accounts Payable Manager",
    assessment: "Maintain records of individual rebates and prepare records for same\nMaintain account payable systems, analyze its effective and recommend improvements on same\nAdminister all projects, ensure work according to technical specifications and manage work as departmental requirement\nEnsure compliance to GAAP regulations and prepare documents for accruals\nAnalyze staffing requirements and recommend appropriate rebate budgets for efficient remuneration\n"
  },
  {
    value: 419,
    jobFunc: 6,
    text: "Assistant Accounts Manager",
    assessment: "Interview and hire candidates to fill job openings\nSchedule vacations, days off and holidays for employees according to the work load\nCreate work schedule and job duties for employees\nOversee the general use of office equipment and materials inventory\nProvide individual motivation and guidance to employees to help them maximize their potential\nImplement discipline guidelines, circulate disciplinary action notices and take follow up action if necessary\n"
  },
  {
    value: 420,
    jobFunc: 6,
    text: "Accounting Analyst II",
    assessment: "Perform audit on all new accounts and monitor all activities for same and ensure appropriate identification of same\nCoordinate with accounts manager and ensure optimal levels of maintenance services for various accounts\nMaintain professional relationship with customers and maintain accounting calendars for same\nEvaluate data from pre process and ensure accuracy in same and monitor it for completion\n"
  },
  {
    value: 421,
    jobFunc: 6,
    text: "Senior Accountant",
    assessment: "Prepares and records asset, liability, revenue, and expenses entries by compiling and analyzing account information\nMaintains and balances subsidiary accounts by verifying, allocating, posting, reconciling transactions; resolving discrepancies\nMaintains general ledger by transferring subsidiary accounts; preparing a trial balance; reconciling entries\nSummarizes financial status by collecting information; preparing balance sheet, profit and loss, and other statements\nProduces payroll by initiating computer processing; printing checks, verifying finished product\nCompletes external audit by analyzing and scheduling general ledger accounts; providing information for auditors\n"
  },
  {
    value: 422,
    jobFunc: 6,
    text: "Revenue Cycle Administrator",
    assessment: "Perform company accounting operations and determine revenues and expenditures\nWork with account team to perform financial planning, analysis and reporting activities\nDetermine monthly revenue forecast and perform monthly revenue analysis and calculation\nGenerate monthly revenue and expenditure reports to management\n"
  },
  {
    value: 423,
    jobFunc: 6,
    text: "Revenue Cycle Executive",
    assessment: "Perform company accounting operations and determine revenues and expenditures\nWork with account team to perform financial planning, analysis and reporting activities\nDetermine monthly revenue forecast and perform monthly revenue analysis and calculation\nGenerate monthly revenue and expenditure reports to management\n"
  },
  {
    value: 424,
    jobFunc: 6,
    text: "Tax Accountant",
    assessment: "Assist to prepare all tax returns and schedule same and administer compilation of multi state tax allocations\nCoordinate with tax auditors to reply to various notices and provide third party assistance\nDesign all tax disclosures and accruals in collaboration with corporate controller\nEvaluate all expenses and perform research on various tax issues to perform all internet based research and maintain knowledge on all pricing policies\n"
  },
  {
    value: 426,
    jobFunc: 6,
    text: "Audit",
    assessment: "Execute audit assistant functions to check the accuracy of accounting systems and procedures\nReview, assess and recommend changes in accounting systems and controls of a business unit\nVerify and inspect accounts receivable and payable ledgers and general ledger for its accuracy\nCheck, inspect and reconcile bank deposits and payments\nInspect, test and assess software and hardware systems for its failure\n"
  },
  {
    value: 427,
    jobFunc: 6,
    text: "Strategic Accounting Analysis",
    assessment: "Initiate analyses of all accounting systems and procedures\nPlan and deploy proactive accounting systems in sales and marketing departments\nAnalyze, initiate and implement best practices and procedures in the accounting department\nEstablish accounting controls to generate various financial reports\nAnalyze financial performance and day-to-day tasks\nMake appropriate changes to the financial system in place to maximize revenues\n"
  },
  {
    value: 428,
    jobFunc: 6,
    text: "Senior Chartered Accountant",
    assessment: "continuous management of financial systems and budgets\nundertaking financial audits (an independent check of an organisation's financial position)\nproviding financial advice\ncounselling clients on areas of business improvement, or dealing with insolvency\ndetecting and preventing fraud (forensic accounting)\nmanaging junior colleagues\n"
  },
  {
    value: 429,
    jobFunc: 6,
    text: "Budget Manager",
    assessment: "Review and Approve Original Charges: All invoices and requests for payment, including any related backup documentation, should be reviewed by the appropriate authority and signed as approved\nKeep Appropriate Records: Records (i\ne\n: a copy of the invoice, sole source documentation, business meeting notes, etc…) should be kept in accordance with departmental and university Records Retention policies\nReview Posting of Charges: A review of all charges and deposits to accounts under your purview should be made regularly and at least monthly\n"
  },
  {
    value: 430,
    jobFunc: 6,
    text: "Senior Accounts Analyst",
    assessment: "Establish financial controls to reduce costs\nDevelop, test and initiate strategies for auditing and testing of programs and procedures\nEnsure reconciliation and analyses of various records and registers\nImplement best qualitative practices and procedures\n"
  },
  {
    value: 431,
    jobFunc: 6,
    text: "Accounts Assistant",
    assessment: "Maintain, manage and record day-to-day transactions\nPrepare, maintain and manage general ledger accounting\nInspect, verify and reconcile accounts receivable records and its balances\nCoordinate with sales team in collecting customer balances\nAssist in preparation of annual accounts and annual budget\nManage office expenditure within the expenditure budgetary limits\n"
  },
  {
    value: 432,
    jobFunc: 6,
    text: "Accounts Trainee",
    assessment: "Trainee accountants check entries for accuracy; they make necessary corrections and file documents as needed\n Some trainee accountants might work on payroll, quarterly taxes, asset inventory, cost accounting or other disciplines within the accounting department\n"
  },
  {
    value: 433,
    jobFunc: 1,
    text: "Software Architect",
    assessment: "define, document, and communicate it\nmake sure everyone is using it, and using it correctly\nmake sure that it comes out in stages in a timely way so that the overall organization can make progress before it's complete\nmake sure the software and system architectures are in synchronization\nact as the emissary of the architecture\nmake sure management understands it (to the detail necessary)"
  },
  {
    value: 434,
    jobFunc: 1,
    text: "Software Programmer",
    assessment: "Code, test and troubleshoot programs utilizing the appropriate hardware, database, and programming technology\nRefine data and format final product\nMaintain and modify programs; make approved changes by amending flow charts, develop detailed programming logic, and coding changes\nTest and develop programming modifications\nWrite new program code using prescribed specifications\n"
  },
  {
    value: 435,
    jobFunc: 1,
    text: "Software Analyst",
    assessment: "Perform complex analysis, designing and programming to meet business requirements\nMaintain, manage and modify all software systems and applications\nDefine specifications for complex software programming applications\nInterface with end-users and software consultants\n"
  },
  {
    value: 436,
    jobFunc: 1,
    text: "Trainee Engineer",
    assessment: "The trainee engineer is majorly responsible of the tasks that are desk job nature\nThe engineer trainee is responsible for the designs of the commodity depending on the sector in which he/ she is based\nThe engineer trainee is responsible for managing the data and all the information related to the particular project he/ she is assigned to\nThe trainee is responsible to follow all the directions given by his/ her mentor\n"
  },
  {
    value: 437,
    jobFunc: 2,
    text: "HR Director",
    assessment: "Develops organization strategies by identifying and researching human resources issues; contributing information, analysis, and recommendations to organization strategic thinking and direction; establishing human resources objectives in line with organizational objectives\nImplements human resources strategies by establishing department accountabilities, including talent acquisition, staffing, employment processing, compensation, health and welfare benefits, training and development, records management, safety and health, succession planning, employee relations and retention, AA/EEO compliance, and labor relations\n"
  },
  {
    value: 438,
    jobFunc: 2,
    text: "HR Generalist",
    assessment: "Implements human resources programs by providing human resources services, including talent acquisition, staffing, employment processing, compensation, health and welfare benefits, training and development, records management, safety and health, succession planning, employee relations and retention, AA/EEO compliance, and labor relations; completing personnel transactions\nDevelops human resources solutions by collecting and analyzing information; recommending courses of action\nImproves manager and employee performance by identifying and clarifying problems; evaluating potential solutions; implementing selected solution; coaching and counseling managers and employees\n"
  },
  {
    value: 439,
    jobFunc: 2,
    text: "Deputy Director legal and payroll",
    assessment: "Coordinate with executive director and implement all administrative strategies within required timeframe and IRTEA regulations and develop all communication policies according to board policies\nMonitor all staff activities according to existing policies and evaluate all financial statements on monthly basis and analyze all trends and develop all program grants and financial contracts\n"
  },
  {
    value: 441,
    jobFunc: 2,
    text: "Personal Manager Welfare and Benefit",
    assessment: "Manage all employees of organization\nUpdate and maintain record of client’s requirement\nPrepare, direct and coordinate methods pertinent to staff and faculty personnel matters\nEnsure to handle HR-related issues complying with established policies and processes\nHead responsibility to execute entire personnel related activities to manage positive employee relations atmosphere\n"
  },
  {
    value: 442,
    jobFunc: 2,
    text: "HR Administrator",
    assessment: "Administer and update Human Resource Information System (HRIS) as per requirement and monitor perspective database and ensure accuracy in same within required timeframe\nCoordinate with employees and applicants on front desk and ensure completion of all line application and complete all paperwork accurately\n"
  },
  {
    value: 443,
    jobFunc: 2,
    text: "Training & Development Manager",
    assessment: "Conduct orientation sessions and arrange on-the-job training for new hires\nEvaluate instructor performance and the effectiveness of training programs, providing recommendations for improvement\nDevelop testing and evaluation procedures\nConduct or arrange for ongoing technical training and personal development classes for staff members"
  },
  {
    value: 445,
    jobFunc: 2,
    text: "HR Analyst",
    assessment: "Perform research for various new hire training programs and coordinate with benefit vendors to prepare new packages for all employees and prepare reports for same\nMonitor on boarding and off boarding of employees and maintain human resource databases and recommend changes to enhance processes and perform research on all current events and provide update to all information\n"
  },
  {
    value: 446,
    jobFunc: 2,
    text: "HR Assistant",
    assessment: "Assist in maintaining personnel records in a confidential and efficient manner\nAssist in maintaining and updating employee database\nMaintain hourly performance reviews for the management\nEnsure adherence to all company policies, standards and procedures\nImplement and monitor all safety measures and procedures\n"
  },
  {
    value: 447,
    jobFunc: 2,
    text: "HR Trainee",
    assessment: "Working with other employees so that various issues can be discussed and solutions can be found o Giving information related to any particular issue to the higher officials if it is an unmanageable one\nHelp the different departments to conduct the process of recruitment easily by collaborating with advertisers and consulting agencies\nIdentifying and selecting candidates with potential\nConducting the interview process smoothly and with maximum effectiveness"
  },
  {
    value: 448,
    jobFunc: 3,
    text: "Senior Administrative Coordinator",
    assessment: "Maintains administrative workflow by studying methods; implementing cost reductions; developing reporting procedures\nCreates and revises systems and procedures by analyzing operating practices; studying utilization of micro-computer and software technologies; evaluating personnel and technological requirements; implementing changes\nDevelops administrative staff by providing information, educational opportunities, and coaching\nResolves administrative problems by analyzing information; identifying and communication solutions\nMaintains rapport with customers, managers, and employees by arranging continuing contacts; researching and developing new services and methods; setting priorities; resolving problem situations\n"
  },
  {
    value: 449,
    jobFunc: 3,
    text: "Senior Administrative Analyst",
    assessment: "Perform administration tasks relating to product standardization, inventory control and cost control\nAssist in product development and product recall activities\nGenerate and analyze inventory and administrative reports to identify cost saving options\nReview new products and provide cost options\nProvide support for daily administrative tasks including answering and routing calls, scheduling meeting, organizing mails, maintaining calendar for senior managers, ordering supplies and attending to pending issues\n"
  },
  {
    value: 450,
    jobFunc: 3,
    text: "Senior Administrator",
    assessment: "Implement office procedures\nExecute assigned projects and tasks effectively\nTrain personnel\nManage travel, timesheets, payroll, correspondence and other tasks\nArrange meetings and record minutes\nCreate and maintain office systems\nArrange meetings, appointments and organize travel for staff\nManage and maintain budgets and other office expenditure\n"
  },
  {
    value: 451,
    jobFunc: 3,
    text: "Facility Manager",
    assessment: "preparing documents to put out tenders for contractors\nproject management and supervising and coordinating work of contractors\ninvestigating availability and suitability of options for new premises\ncalculating and comparing costs for required goods or services to achieve maximum value for money\nplanning for future development in line with strategic business objectives\nmanaging and leading change to ensure minimum disruption to core activities\ndirecting, coordinating and planning essential central services such as"
  },
  {
    value: 452,
    jobFunc: 3,
    text: "Office Support Manager",
    assessment: "using a range of office software, including email, spreadsheets and databases\nmanaging filing systems\ndeveloping and implementing new administrative systems, such as record management\nrecording office expenditure and managing the budget\norganising the office layout and maintaining supplies of stationery and equipment\nmaintaining the condition of the office and arranging for necessary repairs;"
  },
  {
    value: 453,
    jobFunc: 3,
    text: "Mail Clerk",
    assessment: "Ensure to sort every mail coming in and ensure to deliver it to concerned departments\nLog in entire overnight packages on scanning system and ensure to deliver to apt departments\nGather mail from every departments as well as redistribute it suitably\nEnsure to process every outgoing mail on Post Office stamp machine\n"
  },
  {
    value: 454,
    jobFunc: 3,
    text: "Word Processor",
    assessment: "Check completed work for spelling, grammar, punctuation, and format\n Perform other clerical duties such as answering telephone, sorting and distributing mail, running errands or sending faxes\nGather, register, and arrange the material to be typed, following instructions\nType correspondence, reports, text and other written material from rough drafts, corrected copies, voice recordings, dictation or previous versions, using a computer, word processor, or typewriter\n"
  },
  {
    value: 455,
    jobFunc: 3,
    text: "Typist",
    assessment: "Input data into computers at a very efficient rate of speed\nSet up and prepare reports\nPerform research as necessary\nPrepare letters and other correspondence\nType emails and speeches\nPrepare mailing labels\nWrite highly technical material\nPlan and key complex statistical tables\n"
  },
  {
    value: 456,
    jobFunc: 4,
    text: "Zonal Sales Manager",
    assessment: "Leading the provincial or district sales manager and develop sales operation plans with the approval of the national and global sales managers\nShould be capable of managing the region assigned to them to ensure proper sales\n Responsible for achieving the client or activation targets of their specified region\nCreate awareness of products, conduct training and seminars for clients and sales team\n"
  },
  {
    value: 457,
    jobFunc: 4,
    text: "Senior Sales Consultant",
    assessment: "Sales Consultant must understand the product benefits and advantages and should prepare strategies according to it to the sales force and should be able to execute those strategies at right time\nEnsure the sales team force is positive and are geared up for the challenge\nFind out prospective customers/clients and new target segment and penetrate sales in that area\nTeach the sales force about converting leads to sales through good communication, follow-ups and positive attitude\n"
  },
  {
    value: 459,
    jobFunc: 7,
    text: "Attorney",
    assessment: "Develop, assess and negotiate contracts on non-disclosure, consulting, service, consignments, terms and conditions and commercial documents for business units in many areas\nEnsure consistency of contract terms with company policies and goals\nExpedite and review contracts from company’s suppliers, customers and parties\nReview and negotiate contracts\nReduce company’s contract risk\n"
  },
  {
    value: 460,
    jobFunc: 7,
    text: "Associate",
    assessment: "Collaborate Intake Unit’s legal secretaries’ activities\nSupport, direct and train whenever needed\nIdentify defendants eligibility requesting Appellate Counsel’s SPD appointment\nDevelop system to obtain conflict information\nMonitor private bar cases and staff assignment\nDevelop, open and close private bar cases\n"
  },
  {
    value: 461,
    jobFunc: 7,
    text: "Law Clerk",
    assessment: "Execute legal research using automated research services and other methods\nPerform with external and internal legal staff on different projects\nConduct interviews and collect information from law clients and others\nDraft and prepare pleadings, correspondence and other documents related to law\nCollect and arrange documents, exhibits, trial data and other materials requiring case management\n"
  },
  {
    value: 462,
    jobFunc: 7,
    text: "Paralegal",
    assessment: "Provide support to Attorney in various litigation activities\nAnalyze case issues and perform legal research as assigned\nSummarize and submit research findings to Attorney for making legal decisions\nPrepare court filings, draft pleadings, notices of violations, citations and memoranda for Attorney\nAssist Attorney in drafting and proofreading legal documentations\n"
  },
  {
    value: 463,
    jobFunc: 10,
    text: "Home-room Teacher",
    assessment: "Teaching required areas of the curriculum\n Taking responsibility for the progress of a class of primary-age pupils\n Organising the classroom and learning resources and creating displays to\nencourage a positive learning environment\n Planning, preparing and presenting differentiated lessons that cater for the\nneeds of the whole ability range within their class\n Motivating pupils with enthusiastic and imaginative lessons\n"
  },
  {
    value: 464,
    jobFunc: 10,
    text: "Subject Teacher",
    assessment: "Prepare well each and every aspect of the lesson before the delivery of the lesson\nMotivate the students before the actual delivery of the lesson\nLink the topic with the previous knowledge of the students\nDevelop and use the relevant teaching aid\nUse a combination of different methods and techniques of teaching\nInteract with the students to induce curiosity, motivate, and provoke thinking, imagination and application of the concept taught\nGive activity/application- based work/assignment beyond the book, with guidance to use various resources and keep a record of the work given\nMaintain cleanliness and discipline\n"
  },
  {
    value: 465,
    jobFunc: 10,
    text: "Administrator",
    assessment: "working on committees including academic boards, governing bodies and task groups\nassisting with recruitment, public or alumni relations and marketing activities\nadministering the 'student lifecycle' from registration or admission to graduation or leaving\nproviding administrative support to an academic team of lecturers, tutors or teachers\ndrafting and interpreting regulations and dealing with queries and complaints procedures;"
  },
  {
    value: 466,
    jobFunc: 10,
    text: "Dean of School",
    assessment: "Coordinating the assessment and development of academic programs within the\nSchool/College\nPreparing and revising, as necessary, academic program plans for the\nSchool/College\nPromoting and serving as a model for teaching professional achievement and\nprofessional service\nOverseeing all personnel matters involving academic and non-academic employees\nincluding: recruiting, appointment, re-appointment; termination and dismissal; faculty\nevaluation, tenure, promotion and merit; and the preparation and approval(s) of\nfaculty workload plans and long-range professional development plans\n"
  },
  {
    value: 467,
    jobFunc: 10,
    text: "Deputy Dean of the School",
    assessment: "Acting for the Dean when the Dean is absent from the University\n Participating in the development of strategic directions for the School within the context\nof the University's planning framework and the University's overarching strategies\n Assisting the Dean in development, implementation and monitoring of progress of the\nSchool Strategic Plan\n Co-ordinating the implementation, at School level, of the University's Learning and\nTeaching, Research, and Engagement Plans\n"
  },
  {
    value: 468,
    jobFunc: 12,
    text: "Chief Engineering Officer",
    assessment: "determines the goals of the company or organization\ndevises plans for each phase of the project\nidentifies and procures the resources needed\nrecruits engineering staff\nperforms quality control checks, ensuring the safety and effectiveness or reliability of the system or product\nevaluates the costs within a specific time frame\nsupervises the installation of the equipment or the manufacturing process of a product"
  },
  {
    value: 469,
    jobFunc: 12,
    text: "Chief Technical Officer",
    assessment: "Organize and monitor all technical activities for various projects and ensure compliance to all objectives and prepare appropriate budgets and coordinate with various staff to ensure customer satisfaction\nPrepare and maintain project budgets and ensure compliance to all project schedule and ensure optimal customer satisfaction\nMonitor and provide expert knowledge on all tests and technologies and perform all system level engineering services to develop hardware and software for systems and ensure adherence to all product designs and project requirements\n"
  },
  {
    value: 470,
    jobFunc: 12,
    text: "Senior Civil Engineer",
    assessment: "Assess project and its requirements\nAssess the impact and feasibility of site due diligence, preliminary layout and up to the final engineering design\nPrepare architectural drawings and schematic designs based on project requirements\nStudy and assess drawings, plans, specifications and other documents relating to construction projects\n"
  },
  {
    value: 471,
    jobFunc: 12,
    text: "Senior Project Manager",
    assessment: "Meets financial objectives by forecasting requirements; preparing an annual budget; scheduling expenditures; analyzing variances; initiating corrective actions\nUpdates job knowledge by participating in educational opportunities; reading professional publications; maintaining personal networks; participating in professional organizations\nEnhances department and organization reputation by accepting ownership for accomplishing new and different requests; exploring opportunities to add value to job accomplishments\n"
  },
  {
    value: 472,
    jobFunc: 12,
    text: "Senior Manager – Project Planning",
    assessment: "Accomplishes human resource objectives by recruiting, selecting, orienting, training, assigning, scheduling, coaching, counseling, and disciplining employees; communicating job expectations; planning, monitoring, appraising, and reviewing job contributions; planning and reviewing compensation actions; enforcing policies and procedures\n"
  },
  {
    value: 473,
    jobFunc: 12,
    text: "Project Administrator",
    assessment: "ensuring that projects are run in compliance with the Organisation’s requirements\nproviding guidance to project teams\nmaintaining and integrating project plans\ntracking & reporting overall progress\nadministering the project budget\nplanning & scheduling resources for a group of projects\nmonitoring resource utilisation\nperforming quality reviews\nestablishing and maintaining the project documentation library\n"
  },
  {
    value: 474,
    jobFunc: 12,
    text: "Design Engineer",
    assessment: "Provide mechanical design and development new products for automotive equipment and industrial tools industry\nPerform in team environment with engineers belonging to other disciplines and nationalities\nResolve problems and improve manufacturability and serviceability of products working with manufacturing and service personnel\nDevelop and recommend changes if any for manufacturing processes\n"
  },
  {
    value: 475,
    jobFunc: 12,
    text: "City Engineer",
    assessment: "Supervises Project Coordinator/Construction Inspector, civil engineer, engineering clerk\nhires and trains employees; evaluates and disciplines employees; assigns, monitors and\ncoordinates work\n*-- Provides information for master planning, streets, flood control, and oversees the same\nadministers state and county flood control monies\n*-- Pursues Federal, State and County funding for transportation projects\n"
  },
  {
    value: 476,
    jobFunc: 12,
    text: "Structural Engineer I",
    assessment: "analysing configurations of the basic structural components of a building or other structure\ncalculating the pressures, stresses and strains that each component, such as a beam or lintel, will experience from other parts of the structure due to human use or environmental pressures such as weather or earthquakes\nconsidering the strength of various materials, eg timber, concrete, steel and brick, to see how their inclusion may necessitate a change of structural design;"
  },
  {
    value: 477,
    jobFunc: 12,
    text: "Assistant Project Manager",
    assessment: "Perform cost analysis of a project\nAssist and support project team members in completing the project\nCoordinate and schedule execution of the project\nReview, assess and evaluate execution of the project on a regular basis\nTroubleshoot and resolve complex issues arising in a project\nEnsure completion of the project in a timely manner and within the budgetary limits\n"
  },
  {
    value: 478,
    jobFunc: 12,
    text: "Associate Design Engineer",
    assessment: "Supervise all designs and construction of various rural projects and prepare reports for same\nDesign various construction drawings and associate documents, coordinate with managers and specialists to plan production and analyze all samples for construction site\nEvaluate all designs of vendors and make appropriate recommendation to site engineer\nAssist to prepare project plans and associate design sheets and provides technical support to technical staff at all times\n"
  },
  {
    value: 479,
    jobFunc: 12,
    text: "Civil Engineering Manager",
    assessment: "undertaking technical and feasibility studies and site investigations\ndeveloping detailed designs\nassessing the potential risks of specific projects, as well as undertaking risk management in specialist roles\nsupervising tendering procedures and putting together proposals\nmanaging, supervising and visiting contractors on site and advising on civil engineering issues;"
  },
  {
    value: 480,
    jobFunc: 12,
    text: "Structural Engineer II",
    assessment: "making drawings, specifications and computer models of structures for building contractors\nworking with geotechnical engineers to investigate ground conditions and analyse results of soil sample and in situ tests\nliaising with construction contractors to ensure that newly erected buildings are structurally sound\napplying expert knowledge of the forces that act on various structures\nusing computers and computer-aided design (CAD) technology for simulation purposes\n"
  },
  {
    value: 481,
    jobFunc: 12,
    text: "Railroad Design Consultant",
    assessment: "Perform engineering duties in planning, designing, and overseeing construction and maintenance of building structures, and facilities, such as roads, railroads, airports, bridges, harbors, channels, dams, irrigation projects, pipelines, power plants, water and sewage systems, and waste disposal units\n Includes architectural, structural, traffic, ocean, and geo-technical engineers\n"
  },
  {
    value: 482,
    jobFunc: 12,
    text: "Research Hydraulic Engineer",
    assessment: "Perform engineering duties in planning, designing, and overseeing construction and maintenance of building structures, and facilities, such as roads, railroads, airports, bridges, harbors, channels, dams, irrigation projects, pipelines, power plants, water and sewage systems, and waste disposal units\n Includes architectural, structural, traffic, ocean, and geo-technical engineers\n"
  },
  {
    value: 483,
    jobFunc: 12,
    text: "Civil Engineer Technical Assistant",
    assessment: "Calculate dimensions, square footage, profile and component specifications, and material quantities, using calculator or computer\nDraft detailed dimensional drawings and design layouts for projects and to ensure conformance to specifications\nAnalyze proposed site factors and design maps, graphs, tracings, and diagrams to illustrate findings\nRead and review project blueprints and structural specifications to determine dimensions of structure or system and material requirements\n"
  },
  {
    value: 484,
    jobFunc: 12,
    text: "Project Leader",
    assessment: "\nDefine the project management process to be applied to the project\nSelect team members and, if cross-functional as the Core Team Leader, select Core Team Members\nPrepare project plan and obtain management approval of the project plan\nAssure that all team members understand their roles and accept their responsibilities\nApply project resources according to the approved project plan\nAnalyze risk and instigate avoidance activities\n Establish contingency plans and identify trigger events and responsibility for initiating corrective action\nTrack and report on progress to plan\n"
  },
  {
    value: 486,
    jobFunc: 12,
    text: "Help Desk Technician",
    assessment: "Provide first level contact and convey resolutions to customer issues\nProperly escalate unresolved queries to the next level of support\nTrack, route and redirect problems to correct resources\nUpdate customer data and produce activity reports\nWalk customers through problem solving process\nFollow up with customers, provide feedback and see problems through to resolution"
  },
  {
    value: 487,
    jobFunc: 12,
    text: "Database Administrator",
    assessment: "establishing the needs of users and monitoring user access and security\nmonitoring performance and managing parameters to provide fast responses to front-end users\nmapping out the conceptual design for a planned database\nconsidering both back-end organisation of data and front-end accessibility for end-users;"
  },
  {
    value: 488,
    jobFunc: 12,
    text: "Civil Engineering Associate",
    assessment: "Assist all engineering superintendents and subcontractors and ensure compliance to all project schedule and budgets and evaluate all associated equipments and workforce to meet all design requirements\nAnalyze, identify and resolve all technical issues in all files projects and ensure efficient interpretation of all design drawings and install all Quality Control procedures in projects\n"
  },
  {
    value: 489,
    jobFunc: 12,
    text: "Analyst",
    assessment: "Plan, design, and supervise construction, maintenance, and alteration of structures and facilities or projects\n Estimate personnel needs and schedule work to meet completion dates and technical specifications\n Apply comprehensive knowledge of the particular field of specialization to the completion of complex assignments and cross engineering disciplines\n"
  },
  {
    value: 490,
    jobFunc: 12,
    text: "Assistant Civil Engineer",
    assessment: "Evaluate and analyze dam-break, spillway design, dam design and dam safety inspections\nProduce engineering drawings, specifications and cost estimates for projects\nDevelop strategies to meet project schedules and budgets in a timely and cost-efficient manner\n"
  },
  {
    value: 491,
    jobFunc: 12,
    text: "Security Specialist",
    assessment: "Develop and design security and safety devices and products according to client specifications\nMaintain and manage security systems and safety products and equipment\nConduct security checks and inspections of systems and network processes\nPerform auditory checks on all security and safety initiatives\nProtect internal information systems and sensitive databases\n"
  },
  {
    value: 492,
    jobFunc: 12,
    text: "Trainee",
    assessment: "performs most of the same duties as a civil engineer, only under supervision of a licensed, registered, experienced civil engineer\n The purpose of a civil engineering trainee position is to train a newly graduated and licensed engineer how to correctly perform all job duties while in a safe environment that allows for guidance and learning\n A civil engineering trainee learns how to analyze, take field tests, and research in order to complete engineering projects that are limited in scope\n As experience grows, so do the complexity of tasks, while supervision diminishes\n At the end of the trainee period, the engineer may take an exam to earn the right to practice civil engineering without supervision\n"
  },
  {
    value: 493,
    jobFunc: 13,
    text: "Script writer",
    assessment: "Creating characters, crafting dialogue and writing an engaging plot are all part of a scriptwriter’s job\n Essentially, these creative dynamos form something which acts as the skeleton on which a director can map their creative vision\n"
  },
  {
    value: 494,
    jobFunc: 13,
    text: "Unit production manager",
    assessment: "the UPM is responsible for preparing a preliminary shooting schedule and below-the-line budget by breaking down the script and assessing time and cost\n This person will also work with the location manager to search for and survey all shooting locations and secure permission contracts\n The UPM will participate in the hiring of below-the-line crew and coordinate arrangements for housing and transportation, as well as obtaining rental agreements for gear and materials\n During principal photography"
  },
  {
    value: 495,
    jobFunc: 13,
    text: "Assistant director",
    assessment: "Assist director and other managerial staff\nProvide training and guidance\nDelegate duties such as typing, copying, and scanning\nHire, terminate, and train staff\nCreate schedules\nWork with the Director to sustain and grow programs and service\nManage administrative functions to ensure smooth and efficient operations of the organization\nSupport the organization's strategic alliances and partnership\nEnsure performance goals are met and set\n"
  },
  {
    value: 496,
    jobFunc: 13,
    text: "Casting director",
    assessment: "meets with the producers, the director and possibly the writer to understand the project\nmeets with the production accountant for information about the casting budget, the money that'll be used to pay the actors\nreads the script and make notes about all the speaking parts\ncreates a list of possible actors, in preferred order, for the most important parts first\ncontacts the actors or their agents to determine their availability\nprovides the list to the producers and director to make their decision Lead actors may not be asked to audition\n"
  },
  {
    value: 497,
    jobFunc: 13,
    text: "Location manager",
    assessment: "assessing and interpreting scripts or story boards to get an understanding of the location required\nmeeting with the director and designer to discuss projects and working to their creative vision\ncollating ideas and undertaking research using resources such as the internet, specialist location libraries, local and regional film commissions and agencies\nvisiting and photographing locations appropriate to budget in order to assess suitability;"
  },
  {
    value: 498,
    jobFunc: 13,
    text: "Director of photography",
    assessment: "translating the Director’s cinematic vision onto the screen\n Not only does a Cinematographer need to be adept at creating engaging visual moods, but must also be able to both envision them and execute them\n"
  },
  {
    value: 499,
    jobFunc: 13,
    text: "Director of audiography",
    assessment: "responsible for planning the audiography and managing the audiographers of a film\n The title is not used professionally in most of the world\n The role of audiographer and the title director of audiography derives from Bollywood-style filmmaking in India, where it is an established title credit\n[2][3][4][5] The DA works to carry out the director's vision, identifies the tasks necessary to realize this vision, budgets for those tasks and coordinates all the work from pre-production to post-production whilst keeping an eye on overall sound quality\n"
  },
  {
    value: 500,
    jobFunc: 13,
    text: "Composer",
    assessment: "Creates original musical form or writes within circumscribed musical form, such as sonata, symphony, or opera\nTranscribes or records musical ideas into notes on scored music paper\nDevelops pattern of harmony, applying knowledge of music theory\nSynthesizes ideas for melody of musical scores for choral group, or band\nCreates musical and tonal structure, applying elements of music theory, such as instrumental and vocal capabilities\n Determines basic pattern of melody, applying knowledge of music theory\n"
  },
  {
    value: 501,
    jobFunc: 13,
    text: "Production designer",
    assessment: "responsible for the visual concept of a film, television or theatre production\n They identify a design style for sets, locations, graphics, props, lighting, camera angles and costumes, while working closely with the director and producer\n"
  },
  {
    value: 502,
    jobFunc: 13,
    text: "Costume designer",
    assessment: "Work with director to understand his/her vision and needs, as well as to work out any\npotential problems related to time period or other limitations\n Determine best design of costumes considering script, time period of show, and body types\nof actors\n Work with producer to communicate budgetary needs and work within the assigned budget\n Collect all receipts for expenses and turn in to producer\n Work with producer as necessary to find alternate sources of costumes if unable to provide\nwhat is needed"
  },
  {
    value: 503,
    jobFunc: 13,
    text: "Storyboard artist",
    assessment: "Meet with creative supervisors to discuss objectives of storyboard; what is desired or to be achieved\n* Create storyboards by implementing storytelling objectives\n Follow instructions of creative supervisors\n* Address any problems with creative supervisors; ask necessary questions\n* Communicate progress of work to creative supervisors and to appropriate production staff\n* Ensure quality and style of show is consistently achieved in storyboard work"
  },
  {
    value: 504,
    jobFunc: 13,
    text: "Choreographer",
    assessment: "Direct rehearsals to instruct dancers in how to use dance steps, and in techniques to achieve desired effects\n2) Experiment with different types of dancers, steps, dances, and placements, testing ideas informally to get feedback from dancers\n3) Read and study story lines and musical scores to determine how to translate ideas and moods into dance movements\n4) Record dance movements and their technical aspects, using a technical understanding of the patterns and formations of choreography\n"
  },
  {
    value: 505,
    jobFunc: 13,
    text: "Photo editor",
    assessment: "Handle requests from reporters and producers to select and prepare strong images for different stories as well as galleries\nPresent photo coverage of high volume news events as well as breaking news situations\nResearch and present slideshows and varied visual-based features to photo editors\nAttain photos from diverse sources quickly and must be within budgetary limits\n"
  },
  {
    value: 506,
    jobFunc: 13,
    text: "Sound editor",
    assessment: "creates the soundtrack by cutting and synchronizing to the picture, sound elements, such as production wild tracks, dialogue tracks, library material and foley in analog or digital form and presents these to the re-recording mixer for final sound balance\n Depending on the complexity and the tightness of the schedule it may be necessary to employ a dialogue editor and/or foley editor\n They work closely with the sound designer, re-recording mixer and the director to establish what sound effects are required throughout the production and to ensure that these effects are available from sound effect libraries, or can be created to production requirements within tight time schedules\n"
  },
  {
    value: 507,
    jobFunc: 13,
    text: "Video/film  editor",
    assessment: "receiving a brief, and maybe an outline of footage and/or a shot list, script, or screenplay\nassembling all raw footage, with camera shots either recorded or transferred onto video tape in preparation for inputting into the computer\ninputting uncut rushes and sound, and synchronising and storing them into files on the computer\ndigitally cutting the files to put together the sequence of the film and deciding what is usable\ncreating a 'rough cut' (or assembly edit) of the programme/film and determining the exact cutting for the next and final stages\nreordering and tweaking the content to ensure the logical sequencing and smooth running of the film/video\n"
  },
  {
    value: 508,
    jobFunc: 13,
    text: "Distributor",
    assessment: "may set the release date of a film and the method by which a film is to be exhibited or made available for viewing: for example, directly to the public either theatrically or for home viewing (DVD, video-on-demand, download, television programs through broadcast syndicationetc) \n\n A distributor may do this directly, if the distributor owns the theaters or film distribution networks, or through theatrical exhibitors and other sub-distributors\n A limited distributor may deal only with particular products, such as DVDs or Blu-ray, or may act in a particular country or market\n The primary distributor will often receive credit in the film's credits, one sheet or other marketing material\n"
  },
  {
    value: 509,
    jobFunc: 13,
    text: "Box Office Manager",
    assessment: "Prepare everyday attendance records and maintain reports for all receipts and cash deposits for box office, oversee efficient retail functioning of organization and ensure optimal level of customer services\nSupervise efficient development and implementation of all ticket office policies and procedures as per customer requirement and prepare efficient box office strategies to handle ticket sales efficient and develop various fund raising strategies\n"
  },
  {
    value: 510,
    jobFunc: 18,
    text: "Network Administrator",
    assessment: "Establishes network specifications by conferring with users; analyzing workflow, access, information, and security requirements; designing router administration, including interface configuration and routing protocols\nEstablishes network by evaluating network performance issues including availability, utilization, throughput, goodput, and latency; planning and executing the selection, installation, configuration, and testing of equipment; defining network policies and procedures; establishing connections and firewalls\nMaintains network performance by performing network monitoring and analysis, and performance tuning; troubleshooting network problems; escalating problems to vendor\n"
  },
  {
    value: 511,
    jobFunc: 18,
    text: "Network Manager",
    assessment: "Participate in upgradation of IT strategies in association with executive team\nPrepare design and execute all short and long term methods to enhance infrastructural capacity\nPerform reviews and provide support to network strategies before implementation\nCoordinate with various departments and develop processes and policies\nManage staff and perform completion of all assignments and help assessment process\nPrepare and negotiate reports on indoor and outdoor services\n"
  },
  {
    value: 512,
    jobFunc: 18,
    text: "Network Programmer",
    assessment: "Install and perform upgrade on various new devices\nAssist to prepare license and maintain an inventory for same on regular basis\nPrepare all technical reports regarding server and networking system\nMonitor and provide upgrade to all computer related technologies inclusive of operating systems\n"
  },
  {
    value: 513,
    jobFunc: 18,
    text: "Network Technician",
    assessment: "Review and ensure isolation related shortcomings in data communication systems\nProvide backup and ensure fulfillment of plans and programs in relation to Mid-continent Communication\nProvide support to communication program establishing indoor and outdoor contacts\nEnsure application of customer service tools in fortifying communication with indoor customers\n"
  },
  {
    value: 514,
    jobFunc: 21,
    text: "Chief Technical Officer",
    assessment: "Organize and monitor all technical activities for various projects and ensure compliance to all objectives and prepare appropriate budgets and coordinate with various staff to ensure customer satisfaction\nPrepare and maintain project budgets and ensure compliance to all project schedule and ensure optimal customer satisfaction\nMonitor and provide expert knowledge on all tests and technologies and perform all system level engineering services to develop hardware and software for systems and ensure adherence to all product designs and project requirements\n"
  },
  {
    value: 515,
    jobFunc: 21,
    text: "Chief Information Officer",
    assessment: "Plan, develop and implement information technology initiatives\nImplement information processes in academic and administrative operations\nPlan effective media campaigns to hard sell company’s products and services\nDirect, guide and provide leadership to the information department\nBuild strategic relationship with customers, vendors, suppliers and internal staff\n"
  },
  {
    value: 516,
    jobFunc: 21,
    text: "Information Technology Director",
    assessment: "Confer with IT technicians and management on system details, problems and improved operational areas\nCommunicate and establish close working relationship with business areas\nEnsure reliability of infrastructure supporting systems and perform to acceptable levels\nCoordinate with Enterprise Computing and Corporate Services to ensure system supports business needs\n"
  },
  {
    value: 528,
    jobFunc: 21,
    text: "Analyst",
    assessment: "Identify trends and errors by conducting earnings review of assigned projects\nPrepare and review Prime and Sub consultant Agreements and compensation clauses, salary rates and determine overhead charges\nGuarantee cash management by working with clients on new contracts\nTrain and answer questions related to organization’s project management standards and applications\nHandle corrections under Project Manager, Business Manager or Office Leader ‘s direction to assure timely and accurate reporting\n"
  },
  {
    value: 529,
    jobFunc: 21,
    text: "Help Desk Technician",
    assessment: "Improve information sharing and decrease team stress by building teamwork\nBuild analysts’ skills and meet skill requirements by coordinating with higher level agents and Management\nAccomplish agent skill building through training and coaching\nHandle work requests to ensure quality work during non-phone time or when Dealer Help Desk has low call volume\n"
  },
  {
    value: 530,
    jobFunc: 21,
    text: "Network Engineer",
    assessment: "Develop and design plans for LAN and WAN network within organization\nCoordinate with staff members to obtain networking systems and services\nPerform complete security audits and provide technical backup inclusive of retrieval process\nManage server and ensure budget-friendly and efficient servers\nOrganize training programs for customers in technology and enable to gain competency\n"
  },
  {
    value: 531,
    jobFunc: 21,
    text: "Programmer",
    assessment: "Maintains historical records by documenting program development and revisions\nMaintains client confidence and protects operations by keeping information confidential\nEnsures operation of equipment by following manufacturer's instructions; troubleshooting malfunctions; calling for repairs; evaluating new equipment and techniques\nMaintains professional and technical knowledge by attending educational workshops; reviewing professional publications; establishing personal networks; participating in professional societies\nContributes to team effort by accomplishing related results as needed\n"
  },
  {
    value: 532,
    jobFunc: 21,
    text: "Security Specialist",
    assessment: "Develop and design security and safety devices and products according to client specifications\nMaintain and manage security systems and safety products and equipment\nConduct security checks and inspections of systems and network processes\nPerform auditory checks on all security and safety initiatives\n"
  },
  {
    value: 533,
    jobFunc: 21,
    text: "System Administrator",
    assessment: "Maintain and manage systems and network connections\nEnsure security support to business applications\nPlan, develop and implement systems administration, software tools and protocols\nDevelop and implement long term strategic goals in systems administration\nCoordinate with end-users, software professionals and third party vendors to establish systems administrative procedures\nPlan and implement database and applications administrative functions\n"
  },
  {
    value: 534,
    jobFunc: 1,
    text: "Technical Content Writer",
    assessment: "Work with internal teams to obtain an in-depth understanding of the product and the documentation requirements\nAnalyze existing and potential content, focusing on reuse and single-sourcing opportunities\nCreate and maintain the information architecture\nProduce high-quality documentation that meets applicable standards and is appropriate for its intended audience\nWrite easy-to-understand user interface text, online help and developer guides\nCreate tutorials to help end-users use a variety of applications"
  },
  {
    value: 535,
    jobFunc: 1,
    text: "Web Master",
    assessment: "Build or assist in the development of a website\nManage websites and perform continual maintenance; this can includes links, database, and other functions\nProvide web space for individuals and businesses\nWeb programming (knowledge of HTML codes, HTTP, and XML required)\nMarketing of websites on various platforms including other sites and search engines; determine ad structures, pricing, placement, etc\nAdministrative work \nSite promotion, sending out email, voicemail, newsletters, etc\n"
  },
  {
    value: 536,
    jobFunc: 1,
    text: "Software Testing Engineer",
    assessment: "Test networking features across OS platforms\nDevelop test plans and follow guidelines set by test plan\nBuild test environments and update bug database\nTrack software engineering, test processes and procedures\nPerform programming depending upon project or group\n"
  },
  {
    value: 537,
    jobFunc: 21,
    text: "Desktop Technician",
    assessment: "Install, configure, test, maintain and record desktop PC’s, printers, scanners and other end-user peripherals\nMonitor, plan, and coordinate distribution of client software, operating systems, software patches and service packs\nRespond to incoming calls, e-mails and work order system regarding desktop computer and telephone problems\nSupport software applications to ensure highest quality of service to department’s business partners\n"
  },
  {
    value: 538,
    jobFunc: 22,
    text: "Creative Director",
    assessment: "Write creative briefs and presentations\nDirect, guide and oversee designers and project teams\nLead and handle creative key accounts\nAssess and evaluate creative needs for a project\nDesign recommendations to meet client requirements\nSet creative goals for a site design\n"
  },
  {
    value: 539,
    jobFunc: 22,
    text: "Marketing & Promotional Manager",
    assessment: "Prepare advertising and promotional plans to achieve sales goals\nPrepare annual budget and determine cost estimates for the advertising campaign\nMonitor and manage expenses within the assigned budget\nCoordinate with customers, sales departments and advertising agencies to collect and analyze information to plan the marketing\ncampaign\nReview the advertising layouts and scripts to ensure that they satisfy the customer requirements and quality standards\nCoordinate with various teams including sales, media, graphics, finance, ad agencies and customers for their support and\ncooperation to successful execute the campaign\n"
  },
  {
    value: 540,
    jobFunc: 22,
    text: "Sales Director",
    assessment: "Establishes and adjusts selling prices by monitoring costs, competition, and supply and demand\nCompletes national sales operational requirements by scheduling and assigning employees; following up on work results\nMaintains national sales staff by recruiting, selecting, orienting, and training employees\nMaintains national sales staff job results by counseling and disciplining employees; planning, monitoring, and appraising job results\nMaintains professional and technical knowledge by attending educational workshops; reviewing professional publications; establishing personal networks; participating in professional societies\nContributes to team effort by accomplishing related results as needed\n"
  },
  {
    value: 541,
    jobFunc: 22,
    text: "Advertising Director",
    assessment: "Create, design and develop brand image for customers’ products or services\nCreate and direct advertising campaign to raise brand recognition and awareness among the consumers\nDevelop brand building strategies for the creative team\nAssist creative teams in implementing brand building strategies\nDevelop and initiate artistic strategies for advertising campaigns\nConduct frequent creative meetings to ensure effective advertising campaign for the client\n"
  },
  {
    value: 542,
    jobFunc: 22,
    text: "Marketing Director",
    assessment: "Prepare specific marketing plans as well as budgets to attain new product launch along with solution marketing objectives and varied strategic initiatives\nDevelop and implement regional marketing plans as well as programs to endorse solutions with integrated marketing mix\nManage solution and product launch in region performing with product marketing teams\nDevelop and manage regional solution and product marketing campaigns\n"
  },
  {
    value: 543,
    jobFunc: 22,
    text: "PR Manager",
    assessment: "Develop opportunities, messaging and managing press interactions\nManage relationships with key business press and social media influencers\nAdvance executive profiles promotion through traditional and new media channels\nDrive PR programs to encourage client’s position and assist anti-piracy agenda\nSupport company’s Corporate Social Responsibility initiatives like Environmental Sustainability and Community Involvement\n"
  },
  {
    value: 544,
    jobFunc: 22,
    text: "Head of the Fashion Designer team",
    assessment: "Analyze suitable colors, cuts and designs for client and select uniforms for company\nFacilitate nonprofit charities to build wardrobes for underprivileged unable to afford services of stylist\nSelect clothing, makeup and hairstyle conforming to figure of client and occasion\nDecide clothing during photo shoots, fashion shows or any other event\nHelp people in closet organization and classification of clothing as per occasion\n"
  },
  {
    value: 545,
    jobFunc: 22,
    text: "Buying & Merchandising Director",
    assessment: "Coordinate with various departments and monitor various store setups and resets in region\nDevelop and execute various store rotation schedule for appropriate region\nManage and validate model store program for assign area\nDevelop and ensure compliance to budget for all merchandising process\nSupervise and ensure effectiveness of all merchant activities\nPrepare training and job orientation programs for all new merchants\n"
  },
  {
    value: 546,
    jobFunc: 22,
    text: "Production Artists",
    assessment: "Develop artwork for organization’s web pages, exhibits and marketing collaterals, advertisements, proposals, presentations and other printed materials\nWork with Senior Artist in designing and developing artworks including models, layouts, drawings and graphics\nCoordinate with Senior Artists to prepare and maintain design assets\nMaintain style and format guidelines for reference purposes\n"
  },
  {
    value: 547,
    jobFunc: 22,
    text: "Commercial Director",
    assessment: "Examines company rules to make sure they stay relevant and makes recommendations for necessary changes\nLooks for opportunities to grow a business, whether through partnerships or new initiatives, and works to take advantage of those opportunities\nAnalyses sales and other reports that give insight into how a company can make adjustments to improve performance\nAssists commercial directors and works as a member of a cohesive team\nWorks with contract managers\nResolves issues with contracts and commercial operations\nCommunicates with parties in a contract so that all understand the terms, particularly a contract's financial aspects\nAssesses risks and makes recommendations based on a thorough analysis of all factors involved in a business situation\nManages daily company operations"
  },
  {
    value: 549,
    jobFunc: 22,
    text: "Visual Merchandiser",
    assessment: "liaising with teams such as buying, design and marketing to create design themes and plans, often months in advance, including window and in-store displays, signage and pricing concepts\nconducting research on current and future trends in design and lifestyle, and associated target market features\nmeeting with business, sales managers and retail managers to discuss sales strategies\nidentifying and sourcing props, fabrics, hardware and lighting\nmaintaining a budget and negotiating with suppliers of visual materials;"
  },
  {
    value: 550,
    jobFunc: 22,
    text: "Senior Apparel Designer",
    assessment: "Attend regular design and product development meetings\nResearch product trends and development\nResearch material, fabrics, and color trend\nCreate new designs in line with current trends and the target audience\nEvaluate prototypes and improve design\n"
  },
  {
    value: 551,
    jobFunc: 22,
    text: "Fashion Stylist",
    assessment: "Picking clothing and accessories for editorial features and advertisements, concerts, music videos, films and TV shows\nWorking with designers, tailors, models, photographers, hair and makeup artists, retailers, members of the media, publicists, celebrities and public figures\nCreating an image for celebrities\nResearching fabrics, clothing construction and fashion accessories\nKeeping up with different designer labels and fashion designers\nAttending fashion shows\nPredicting and spotting fashion trends\nLocating clothing from all over the world\nBuilding professional networks\nLifting heavy garment bags"
  },
  {
    value: 552,
    jobFunc: 22,
    text: "Studio Management",
    assessment: "Ensures that all work produced is technically correct resulting in high-quality, printer-ready files\n Assigns, schedules and estimates all production art\n Ensures that production pieces are produced timely, on budget and with the degree of quality promised to the client\n Maintains interaction with print production and art directors on scope of projects\n Directs and guides production artists in preparation of files\n Collaborates, as needed, with art directors to design and produce pieces for new business and client presentation\n Remains current on industry trends and technology\n"
  },
  {
    value: 553,
    jobFunc: 22,
    text: "Senior Photographer",
    assessment: "Market and advertise services to attract clients\nAnalyze and decide how to compose a subject\nUse various photographic techniques and equipment\nCapture subjects in commercial-quality photographs\nEnhance the subject’s appearance with natural or artificial light\nUse photo enhancing software\nMaintain a digital portfolio, often on a website, to demonstrate work"
  },
  {
    value: 555,
    jobFunc: 22,
    text: "Communications Coordinator",
    assessment: "Designs marketing and promotional materials for the company\nAssists in recruiting and hiring marketing specialists for the department\nDelegates assignments to subordinate marketing specialists\nResearches ways to reach a wider consumer base, either online or in print\nAdvises company directors or managers on ways to improve or update public image\nEnsures that all promotional materials are aligned with company’s brand identity\n"
  },
  {
    value: 556,
    jobFunc: 22,
    text: "Assistant Fashion Designer",
    assessment: "Fashion assistants may function as assistant buyers\n They work for retail companies and keep track of the purchase-order process\n The job listings show that this involves planning inventory and tracking sales, as well as interacting with vendors\n Assistant buyers need to be knowledgeable about the product and participate in competitive shopping\n"
  },
  {
    value: 557,
    jobFunc: 22,
    text: "Senior Accessory Designer",
    assessment: "create accessories -- including handbags, jewelry and shoes -- to accompany clothes and outerwear\n Accessories designers work in a variety of settings, including clothing manufacturers, department stores and online retailers\n Some designers have their own businesses\n"
  },
  {
    value: 558,
    jobFunc: 22,
    text: "Apparel Designer",
    assessment: "understanding design from a technical perspective, i\ne\n producing patterns, toiles and technical specifications for designs\nsourcing, selecting and buying fabrics, trims, fastenings and embellishments\nadapting existing designs for mass production\ndeveloping a pattern that is cut and sewn into sample garments and supervising the creation of these, including fitting, detailing and adaptations\noverseeing production\nnegotiating with customers and suppliers\nmanaging marketing, finances and other business activities, if working on a self-employed basis\n"
  },
  {
    value: 559,
    jobFunc: 22,
    text: "Art Director Fashion",
    assessment: "might take the form of an art director for a high-fashion magazine; or a creative director of a fashion design company overseeing the design of apparel\n No matter the format in which they work, creative directors in the fashion industry use the skills of creativity in exercising concepts, communication, leadership and industry-related technology\n"
  },
  {
    value: 560,
    jobFunc: 22,
    text: "Colorist",
    assessment: "responsible for mixing, developing, and creating colors and color palettes for clothing, clothing lines, and textiles\n In some cases the designer or other client will have a specific color in mind, and it is up to the colorist to mix it to precise specifications\n In others, the colorist might have complete creative freedom to create colors for a client based on the way he or she might interpret them\nFashion colorists are responsible for more than just color creation\n They approve final color palettes, and they also check and receive swatches and fabrics from overseas dyers\n They maintain color libraries, manage labs, and develop new techniques for mixing and developing color\n They meet with vendors, agents, and mills, and they also develop color standards\n"
  },
  {
    value: 561,
    jobFunc: 22,
    text: "Costume Designer",
    assessment: "combine elements of color and fabric textures to provide a visual understanding of characters in terms of age, social status, occupation and era\n Their work can also create fashion statements and is a critical element in television shows, theater productions and movies\n Because costume design is a branch of fashion design, the majority of costume designers hold an undergraduate degree in fashion design\n Fashion design, in general, is a competitive field for employment and not many positions are expected to be created in the coming years, increasing the competition among"
  },
  {
    value: 562,
    jobFunc: 22,
    text: "Footwear Stylist",
    assessment: "working with other designers on styles and trends\nmaking rough design drawings by hand or using a computer\nresearching ideas at fashion shows and events\nmaking sample shoes to present their ideas\nconducting quality checks and overseeing production\n"
  },
  {
    value: 563,
    jobFunc: 22,
    text: "Store Manager",
    assessment: "Develop business strategies to raise our customers’ pool, expand store traffic and optimise profitability\nMeet sales goals by training, motivating, mentoring and providing feedback to sales staff\nEnsure high levels of customers satisfaction through excellent service\nComplete store administration and ensure compliance with policies and procedures\nMaintain outstanding store condition and visual merchandising standards\nReport on buying trends, customer needs, profits etc"
  },
  {
    value: 564,
    jobFunc: 22,
    text: "Textile Designer",
    assessment: "liaising with clients and technical, marketing and buying staff to plan and develop designs\naccurately interpreting and representing clients' ideas;keeping up to date and spotting fashion trends in fabric design by reading forecasts in trade magazines and using internet resources\ndeveloping a network of business contacts\nif self-employed, managing marketing and public relations, finances and business administration and maintaining websites\n"
  },
  {
    value: 565,
    jobFunc: 22,
    text: "Event Coordinator",
    assessment: "researching markets to identify opportunities for events\nliaising with clients to ascertain their precise event requirements\nproducing detailed proposals for events (eg timelines, venues, suppliers, legal obligations, staffing and budgets)\nagreeing to, and managing a budget\nsecuring and booking a suitable venue or location\nensuring insurance, legal, health and safety obligations are adhered to\ncoordinating venue management, caterers, stand designers, contractors and equipment hire;"
  },
  {
    value: 566,
    jobFunc: 22,
    text: "Sample Cutter",
    assessment: "Cuts upholstery fabric into squares for use as sample swatches, using electric knife, scissors, and pinking machine: Reads sample list to determine specified fabric and pattern and quantity of swatches to be fabricated\n Spreads fabric on table in single or multiple layers\nPositions pattern over fabric to ensure fabric design is on swatch area and traces outline of pattern, using chalk\nRemoves pattern and cuts along outline, using scissors, electric knife, and pinking machine, to form swatch\nPunches holes in swatches, using drill press\n"
  },
  {
    value: 568,
    jobFunc: 27,
    text: "Pharma Company Director",
    assessment: "Ensure routine smooth operations across pharmacy department\nManage pharmacy staff inclusive but not restricted to training and interviewing\nAssist with overtime for staff management, annual reviews, schedule hours and subordinates time off\nRespond to telephone calls and fill all prescriptions ordered\nHead responsibility to ship procedures to assure customer orders are processed accurately, efficiently as well as timely\n"
  },
  {
    value: 569,
    jobFunc: 27,
    text: "Chief Pharma Company Executive",
    assessment: "Provides leadership in the development for the continuous evaluation of short and long-term strategic financial objectives\nEnsure credibility of Finance group by providing timely and accurate analysis of budgets, financial trends and forecasts\nTake hands-on lead position of developing, implementing, and maintaining a comprehensive project costing system\nDirect and oversee all aspects of the Finance & Accounting functions of the organization\n"
  },
  {
    value: 570,
    jobFunc: 27,
    text: "Pharma Manager",
    assessment: "Plan, organize and supervise all pharmacy functionalities and activities\nStructure and initiate innovative pharmacy administrative measures\nSet priorities to make pharmacy activities more proactive and qualitative\nAnswer and respond to client inquiries\nResolve problems arising in pharmacy administration\nPrepare operating budgets for pharmacy activities\n"
  },
  {
    value: 571,
    jobFunc: 27,
    text: "Pharma warehouse manager",
    assessment: "Develop prescribed product, attain product from shelf, count specified quantity, place drug in apt container and label on items to be checked by pharmacist\nEnsure to package product after it is checked by pharmacist\nPerform drug scan, place it in bag having printed paperwork as well as receipt\nEnsure to sort packages to specific locations through computer system scan into apt tote to be shipped to stores\n"
  },
  {
    value: 572,
    jobFunc: 27,
    text: "Pharma inventory manager",
    assessment: "Inventory managers are responsible for recording and ordering supplies, products, and materials for businesses both small and large\n People with strong organizational and record-keeping skills may be a good fit for a career in inventory management\n Becoming an inventory manager generally entails completion of a bachelor's degree program\n Managers may also benefit from completing graduate coursework and earning certification\n"
  },
  {
    value: 575,
    jobFunc: 27,
    text: "Assistant Pharma manager",
    assessment: "Assist Pharmacy Manager in supervising daily operations of pharmacy\nAssist in processing new and refill prescriptions for patients\nCoordinate with Manager in developing pharmacy policies and procedures\nPrepare, pack and label drugs according to the patient’s prescriptions\nOrder and stock pharmacy supplies\nMaintain the inventories according to pharmacy standards"
  },
  {
    value: 577,
    jobFunc: 27,
    text: "Pharma PR representatives",
    assessment: "Assess clients needs and present suitable promoted products\nLiaise with and persuade targeted doctors to prescribe our products utilizing effective selling skills and performing cost-benefit analysis\nProvide product information and deliver product samples\nAttend sales meetings, conference calls, training sessions and symposium circuits\nWork with sales team to develop strategies and implement brand strategies to ensure a consistent marketing message"
  },
  {
    value: 578,
    jobFunc: 27,
    text: "Pharma administrator",
    assessment: "Provide effectual customer service as well as role model service guidelines\nEnsure to receive inventory, check delivery for correctness commensurate to invoices\nManage and maintain inventory through breaking out inventory into stocking sections\nEnsure return tote to shipping backroom to warehouse\nEnsure to check line through line receiving\n"
  },
  {
    value: 580,
    jobFunc: 27,
    text: "Pharma sales person",
    assessment: "Sell pharmaceutical products or services to potential and prospective customers\nContact potential customers like doctors, staff and nurses in GP surgeries, hospital medical teams, and pharmacists with pre-arranged appointment\nBuild and maintain positive working relationships with medical staff and administration staff\nOrganize conferences for doctors and other medical staff to hard-sell pharmaceutical products or services\nManage budgets and expenses for conferences\n"
  },
  {
    value: 581,
    jobFunc: 27,
    text: "Pharma clerk",
    assessment: "Provide effectual customer service as well as role model service guidelines\nEnsure to receive inventory, check delivery for correctness commensurate to invoices\nManage and maintain inventory through breaking out inventory into stocking sections\nEnsure return tote to shipping backroom to warehouse\nEnsure to check line through line receiving\n"
  },
  {
    value: 582,
    jobFunc: 27,
    text: "Pharma technician",
    assessment: "Rearrange all schedules to balance for staffing changes\nDevelop small and large volume parenteral products through aseptic technique to manage sterility\nDevelop select sterile products utilizing American Society of Hospital Pharmacy risk level 2 bulk production procedures\nRespond to phone by fourth ring accurately with respect to identify department, stating name and courteously\nUtilize apt judgment while responding and triaging telephone calls\n"
  },
  {
    value: 583,
    jobFunc: 28,
    text: "Chairman/CEO",
    assessment: "Evaluate and interpret thoroughly all freight charges sustained\nDevelop and execute operational strategies to optimize customer service as well as economic results\nComply with local, federal and state warehousing, material handling as well as shipping requirements through studying current and new legislation\nEnforce conformance to requirements and recommend management on necessary actions\n"
  },
  {
    value: 584,
    jobFunc: 28,
    text: "Project Director",
    assessment: "Define, launch and drive mission-crucial strategic as well as operational initiatives in core non-technical projects\nDevelop method of change management inclusive of ownership of documentation library, process training and communication plans etc\nSupport budget, personnel and varied resources necessary to attain goals and objectives of program group\nInterview, select and train staff to present quality results for organization as required\n"
  },
  {
    value: 585,
    jobFunc: 28,
    text: "Head, Finance",
    assessment: "\n Lead the global forecast process, providing leadership and direction to regional finance teams, regional/WW operations teams\n Work with headquarters finance to provide analysis, commentary for consolidated company financial statements\n Perform month/quarter end financial close duties"
  },
  {
    value: 586,
    jobFunc: 28,
    text: "Market Analyst",
    assessment: "Manage schedules of ship installation to attain documentation development time frames\nDevelop ILS certifications and prepare to deliver needed data packages for installation groups\nProvide assistance for research to develop and review technical documentation\nDevelop and maintain equipment nomenclature along with data of Allowance Parts Lists (APL) for equipment lifecycle\nAssist to collect, analyze and report data contained within Stepping Stones product\n"
  },
  {
    value: 587,
    jobFunc: 28,
    text: "Sales Manager",
    assessment: "Lead, guide and mentor sales personnel\nSet sales targets for the sales team to achieve outcomes\nProvide daily support to the sales force\nStudy and analyze marketing trends for own products or services\nCreate innovative ways to attract and capture customers\nResolve complex customer issues and needs\n"
  },
  {
    value: 588,
    jobFunc: 28,
    text: "Manager, Admin",
    assessment: "Provides supplies by identifying needs for reception, switchboard, mailroom, and kitchen; establishing policies, procedures, and work schedules\nProvides communication systems by identifying needs; evaluating options; maintaining equipment; approving invoices\nPurchases printed materials and forms by obtaining requirements; negotiating price, quality, and delivery; approving invoices\nCompletes special projects by organizing and coordinating information and requirements; planning, arranging, and meeting schedules; monitoring results\n"
  },
  {
    value: 589,
    jobFunc: 28,
    text: "Warehouse In-Charge",
    assessment: "Pack, stock, organize and rearrange products in warehouse\nKeep neat and clean warehouse premises\nOrganize and maintain records of inventories up to date\nMonitor and manage inventory control\nManage and handle shipping, loading and unloading of products\nOperate forklifts and pallet jacks\n"
  },
  {
    value: 590,
    jobFunc: 28,
    text: "Transport Manager",
    assessment: "Direct activities related to dispatching, routing, and tracking transportation vehicles, such as aircraft and railroad cars\n Plan, organize and manage the work of subordinate staff to ensure that the work is accomplished in a manner consistent with organizational requirements\nDirect investigations to verify and resolve customer or shipper complaints\n Serve as contact persons for all workers within assigned territories\nImplement schedule and policy changes\n"
  },
  {
    value: 591,
    jobFunc: 28,
    text: "Logistics Executive",
    assessment: "Processing orders\nOrganising the dispatch and delivery of goods\nEnsuring goods are stored safely\nKeeping staff fully trained\nMaintaining health and safety standards\nKeeping accurate records\nManaging timesheets"
  },
  {
    value: 592,
    jobFunc: 28,
    text: "Material Handling Executive",
    assessment: "Increase effective capacity\nMinimize aisle space\nReduce product handling\nDevelop effective working conditions\nReduce heavy labor\nReduce cost"
  },
  {
    value: 593,
    jobFunc: 28,
    text: "Associate, Tech Support",
    assessment: "Perform troubleshoot on all technical processes and provide resolution through ticketing system\nProvide support to all internal and external systems and maintain efficient product knowledge on all processes\nAdminister all operational issues and according to standard communications\n"
  },
  {
    value: 594,
    jobFunc: 29,
    text: "Branch manager",
    assessment: "Lead and direct banking staff to achieve banking objectives and goals\nInitiate and implement strategies to improve revenue growth\nControl expenditure budget and maximize profits\nEnsure quality and exceptional services to bank customers\nCreate logistics to improve sales and service goals and objectives\nAssess and evaluate all financial products and services\n"
  },
  {
    value: 596,
    jobFunc: 4,
    text: "Business Development Manager",
    assessment: "Identifies trendsetter ideas by researching industry and related events, publications, and announcements; tracking individual contributors and their accomplishments\nLocates or proposes potential business deals by contacting potential partners; discovering and exploring opportunities\nScreens potential business deals by analyzing market strategies, deal requirements, potential, and financials; evaluating options; resolving internal priorities; recommending equity investments\nDevelops negotiating strategies and positions by studying integration of new venture with company strategies and operations; examining risks and potentials; estimating partners' needs and goals\n"
  },
  {
    value: 597,
    jobFunc: 29,
    text: "Card Operations Manager",
    assessment: "Manage the daily operations of the department in an efficient and effective manner\n Establish and maintain an efficient and productive working environment within the\ndepartment based on continuous and effective staff communication\n Achieve established\ndepartmental goals within defined timelines, as well as define and implement a\nmeasurement of acceptable staff performance in order to safeguard the Bank’s loan\nportfolio\n Successfully interact with the lending staff at both banks to improve accuracies and\nefficiencies\n Perform on going training, review and communicate current or developing\nlending industry topics/concerns or standards"
  },
  {
    value: 598,
    jobFunc: 29,
    text: "Commercial Lending Director",
    assessment: "Approve loans within specified limits, and refer loan applications outside those limits to management for approval\n Meet with applicants to obtain information for loan applications and to answer questions about the process\nAnalyze applicants' financial status, credit, and property evaluations to determine feasibility of granting loans\nExplain to customers the different types of loans and credit options that are available, as well as the terms of those services\n"
  },
  {
    value: 599,
    jobFunc: 29,
    text: "Financial Planning Director",
    assessment: "Developing reports \n Utilizing knowledge of compliance regulations, ISO standards, federal edicts, and other policies \n Performing financial analysis \n Leading projects and teams \n Recommending fiscal changes and measures \n Using fiscal tools, models, and reports \n Drafting, reviewing and analyzing budgets \n Chairing meetings \n Attending seminars, workshops and other meetings"
  },
  {
    value: 600,
    jobFunc: 29,
    text: "Assistant Branch Manager",
    assessment: "Manage daily operations of branch in the absence of Branch Manager\nAssist Branch Manager in implementing business development strategies\n for assigned branch\nProvide warm, friendly and welcoming atmosphere for both employees and customers\nProvide quality and exceptionally services to customers\nAssist Branch Manager to achieve sales target and projected profit\n"
  },
  {
    value: 601,
    jobFunc: 29,
    text: "ATM Specialist",
    assessment: "repair and install ATM machines\n ATM field technicians travel to client locations to diagnose and fix the problem on site or remove the machine and take it back to the shop where it will be worked on by ATM bench technicians\n Using equipment that includes multimeters, diagnostic software and hand tools, ATM technicians fix problems such as worn card readers and malfunctioning cash dispensing systems\n As the financial industry implements new technology, more ATM technicians are required to work on electronic kiosks as well\n"
  },
  {
    value: 603,
    jobFunc: 29,
    text: "Card Operations Specialist",
    assessment: "Manage the daily operations of the department in an efficient and effective manner\n Establish and maintain an efficient and productive working environment within the\ndepartment based on continuous and effective staff communication\n Achieve established\ndepartmental goals within defined timelines, as well as define and implement a\nmeasurement of acceptable staff performance in order to safeguard the Bank’s loan\nportfolio\n Successfully interact with the lending staff at both banks to improve accuracies and\nefficiencies\n Perform on going training, review and communicate current or developing\nlending industry topics/concerns or standards"
  },
  {
    value: 604,
    jobFunc: 29,
    text: "Commercial Credit Analyst",
    assessment: "evaluate the credit worthiness of businesses and determine their ability to repay loans and lines of credit, including those used to purchase equipment and other goods\n Their responsibilities include developing financial profiles and investigating credit histories\n Before reaching a decision, analysts also compare how much cash and liquid assets a business has on hand with how much it owes\n Commercial credit analysts are usually employed by banks, government agencies or other commercial lenders\n"
  },
  {
    value: 605,
    jobFunc: 29,
    text: "Commercial Loan Manager",
    assessment: "Responsible for soliciting and servicing a variety of commercial loans\n Requires a bachelor's degree in area of specialty and at least 8 years of experience in the field or in a related area\n Familiar with a variety of the field's concepts, practices, and procedures\n Relies on experience and judgment to plan and accomplish goals\n Performs a variety of tasks\n A wide degree of creativity and latitude is expected\n Typically reports to a manager or head of a unit/department"
  },
  {
    value: 607,
    jobFunc: 29,
    text: "Consumer Loan Manager",
    assessment: "Administer all lending activities for all consumer loan operations\nCollect all everyday operations and manage all membership service programs and provide required training\nDetermine and maintain all internal control on all loan processes\nManage all collection area and design all appropriate methods and procedures and maintain effectiveness of all loan programs and provide training to all service personnel\nManage all loan cycle process and determine efficient work plan to achieve all business objectives\n"
  },
  {
    value: 608,
    jobFunc: 29,
    text: "Customer Wealth Manager",
    assessment: "deliver an absolute performance within the return and risk range agreed upon with their investors\n The financial needs of investors cannot be left to the vagaries of market performance, and therefore, the responsibility of a wealth manager is superior to that of an investment manager\n This distinction is lost when wealth managers work as agents selling financial products to investors\n"
  },
  {
    value: 610,
    jobFunc: 29,
    text: "Financial Planning Manager",
    assessment: "Developing reports \n Utilizing knowledge of compliance regulations, ISO standards, federal edicts, and other policies \n Performing financial analysis \n Leading projects and teams \n Recommending fiscal changes and measures \n Using fiscal tools, models, and reports \n Drafting, reviewing and analyzing budgets \n Chairing meetings \n Attending seminars, workshops and other meetings"
  },
  {
    value: 611,
    jobFunc: 29,
    text: "ATM Coordinator",
    assessment: "repair and install ATM machines\n ATM field technicians travel to client locations to diagnose and fix the problem on site or remove the machine and take it back to the shop where it will be worked on by ATM bench technicians\n Using equipment that includes multimeters, diagnostic software and hand tools, ATM technicians fix problems such as worn card readers and malfunctioning cash dispensing systems\n As the financial industry implements new technology, more ATM technicians are required to work on electronic kiosks as well\n"
  },
  {
    value: 612,
    jobFunc: 29,
    text: "Cash Management Officer",
    assessment: "responsible for identifying, analyzing, selling and supporting cash management products and services to established business customers and targeted prospective corporate clients\n Works closely with relationship officers in attaining service charge and deposit goals; solidify customer retention efforts by providing a superior level of customer service\n Responds to a Request for Proposal (RFP); assesses customer needs and recommends effective strategies; performs a cost benefit and risk analysis;"
  },
  {
    value: 614,
    jobFunc: 29,
    text: "Loan Executive",
    assessment: "Approve loans within specified limits, and refer loan applications outside those limits to management for approval\nMeet with applicants to obtain information for loan applications and to answer questions about the process\nAnalyze applicants' financial status, credit, and property evaluations to determine feasibility of granting loans\nExplain to customers the different types of loans and credit options that are available, as well as the terms of those services\nObtain and compile copies of loan applicants' credit histories, corporate financial statements, and other financial information\nReview and update credit and loan files\n"
  },
  {
    value: 615,
    jobFunc: 29,
    text: "Compliance Officer",
    assessment: "Develops, initiates, maintains, and revises policies and procedures for the general operation of the Compliance Program and its related activities to prevent illegal, unethical, or improper conduct\n Manages day-to-day operation of the Program\nDevelops and periodically reviews and updates Standards of Conduct to ensure continuing currency and relevance in providing guidance to management and employees\n"
  },
  {
    value: 616,
    jobFunc: 29,
    text: "Credit Card Fraud Investigator",
    assessment: "Reviews customer documentation, inbound/outbound transactions, and account details for suspected fraud activities\nAnalyzes and identifies fraud trends to prevent/minimize monetary loss and implement prevention measures\nProvides support to victims of identity theft via phone and email\nProcesses and analyzes credit card chargeback/dispute cases"
  },
  {
    value: 617,
    jobFunc: 29,
    text: "Credit Card Fraud Analyst",
    assessment: "Monitor real time queues and identify high risk transactions within the business portfolio\nObserve customer transactions to identify fraudulent activity such as account take over, friendly fraud, theft and similar other risks\nIdentify fraudulent transactions and cancel them from further processing\nResolve queued transactions within the service level agreements to reduce potential revenue losses\n"
  },
  {
    value: 618,
    jobFunc: 29,
    text: "Foreclosure Specialist",
    assessment: "Manage all attorney communication through phone and Lenstar and prepare payment slip\nEnsure maintenance of all processing of activities and administer responsiveness of alerts to determine foreclosure timeline management\nAnalyze and design strategies to minimize all losses via management of attorney and enhance better foreclosure process\nMaintain and update all portfolios by State given by foreclosure management\n"
  },
  {
    value: 619,
    jobFunc: 29,
    text: "Taxation Executive",
    assessment: "Coordinate with clients and ensure achievement of all objectives and design all project budgets and maintain compliance to same and identify and mitigate all tax risks\nManage all communication with staff and clients\nPerform research all tax planning projects and implement all tax return position and ensure compliance to all departmental policies and procedures\n"
  },
  {
    value: 620,
    jobFunc: 29,
    text: "Foreign Exchange Trader",
    assessment: "speaking with colleagues, making phone calls and making instant decisions\nmaking prices in their relevant products\nexecuting trades electronically or by phone\nliaising with sales traders/clients on market movements\npredicting how markets will move and buying and selling accordingly (especially derivatives traders who try to predict the state of a market at a future date)\ninforming all relevant parties of the most relevant trades for the day;"
  },
  {
    value: 621,
    jobFunc: 29,
    text: "Investment Services Executive",
    assessment: "Plan and perform group and individual training sessions with investment banking employees\nDevelop and handle client meetings to review current accounts and close sales with licensed bankers\nWork on client’s investment needs and problems and delegate tasks daily\nMaintain relationships and develop referrals from current client base post-appointment\n"
  },
  {
    value: 622,
    jobFunc: 29,
    text: "Financial Services Representative",
    assessment: "Develop and maintain professional relationships with customers and ensure customer satisfaction\nCoordinate with clients and acquire all information and resolve issue effectively\nProvide professional assistance to all clients issues and ensure confidentiality of all client information\nMaintain knowledge and interpret all policies and procedures of bank and ensure compliance with all ethics and conducts\n"
  },
  {
    value: 624,
    jobFunc: 30,
    text: "Director of Media Company",
    assessment: "Ensure to capture high quality, notable footage plus screenshots from latest versions of in-development multiple game projects\nCollaborate with promotions, editorial and operational personnel on different projects\nEnsure to complete dubs as stated by viewers\nEnsure to delete plus preserve content ahead of instruction\nEdit and manage video in linear as well as non- linear formats\n"
  },
  {
    value: 626,
    jobFunc: 30,
    text: "Creative Director",
    assessment: "Write creative briefs and presentations\nDirect, guide and oversee designers and project teams\nLead and handle creative key accounts\nAssess and evaluate creative needs for a project\nDesign recommendations to meet client requirements\nSet creative goals for a site design\n"
  },
  {
    value: 627,
    jobFunc: 30,
    text: "General Media Manager",
    assessment: "Establish and monitor performance benchmarks and media cost with agencies\nEvaluate media efforts results and prepare measures of success\nEnsure program outcomes receive best possible business benefit levels\nRecommend marketing management on media policies development for maximum effectiveness\nPerform with Market Research, agencies as well as brand teams to optimize investment return for advertising management and media planning\n"
  },
  {
    value: 629,
    jobFunc: 30,
    text: "Art Director",
    assessment: "Create and integrate innovative logistics in the functions of an art director\nDirect, lead and guide operations of art department in an advertising agency\nCreate original conceptual advertising campaigns for clients and their products\nCoordinate with copywriters, artists, photographers and production teams in preparing commercial campaigns\nInteract with clients and account executive in creating advertising campaigns\nManage multiple projects within the time limits meeting deadlines\n"
  },
  {
    value: 630,
    jobFunc: 30,
    text: "Section Editor",
    assessment: "work as part of an editorial team, taking responsibility for the content of a specific part of a magazine\n On an entertainment magazine, a team of section editors might take responsibility for film, television or theater features\n A sports magazine might appoint different editors to handle football, basketball or swimming sections\n Section editors generally work for a senior editor who takes overall responsibility for a magazine’s output\n"
  },
  {
    value: 631,
    jobFunc: 30,
    text: "Producer",
    assessment: "raising funding\nreading, researching and assessing ideas and finished scripts\ncommissioning writers or securing the rights to novels, plays or screenplays\nbuilding and developing a network of contacts\nliaising and discussing projects with financial backers - projects can range from a small, corporate video costing £500 to a multimillion-pound-budget Hollywood feature film\nusing computer software packages for screenwriting, budgeting and scheduling\nhiring key staff, including a director and a crew to shoot programmes, films or videos;"
  },
  {
    value: 632,
    jobFunc: 30,
    text: "Multimedia designer",
    assessment: "Design graphics and animations for websites, trade shows and marketing promotions\nRecommend design techniques to improve look and feel of the graphics\nModify and improvise graphics to optimize load time, structure and layout\nIdentify and troubleshoot design related problems in a timely fashion\nEdit video and audio to support multimedia programs\n"
  },
  {
    value: 633,
    jobFunc: 30,
    text: "Media Administrator",
    assessment: "Support Internal Communications with media writing assignments and update to Intranet\nProvide assistance for sales on small deals with purpose to capitalize on best accessible inventory\nDevelop, maintain and manage relations with external audiences, media as well as non-media to convey required message\nCoordinate focused PR tasks and events with varied departments as guided by supervisors\n"
  },
  {
    value: 634,
    jobFunc: 30,
    text: "Creative Copywriter",
    assessment: "Draft compelling, benefits copy for business catalogs, web stores, articles and press releases\nInput to catalog layout and merchandising\nCreate, implement and analyze promotions\nManage and enhance product category database\nProof copy to check information correctness\nDraft captivating copy to integrate brand and client strategy\n"
  },
  {
    value: 635,
    jobFunc: 30,
    text: "Production Artist",
    assessment: "Develop artwork for organization’s web pages, exhibits and marketing collaterals, advertisements, proposals, presentations and other printed materials\nWork with Senior Artist in designing and developing artworks including models, layouts, drawings and graphics\nCoordinate with Senior Artists to prepare and maintain design assets\nMaintain style and format guidelines for reference purposes\n"
  },
  {
    value: 636,
    jobFunc: 30,
    text: "Reporter",
    assessment: "Analyze and collect information through various modes such as personal interviews and news briefings to prepare news reports\nMonitor daily events locally, nationally and internationally and assist others to gather current events\nPrepare reports to keep the public informed about daily happenings\nCoordinate with news editor and fellow reporters to develop story ideas for report writing\nMaintain relations with all news sources on daily basis to develop story ideas and compile appropriate reports\n"
  },
  {
    value: 637,
    jobFunc: 30,
    text: "Program Coordinator",
    assessment: "Supports the Program Director by scheduling meetings, providing agenda and minutes, developing reports relevant to the residency program, implementation of policies\nDevelops a time-line for the annual cycle in a residency program\nSupports the program director in preparations for the resident selection process\nAssists in the preparation and update of resident handbook\nPrepares educational material and documents for the residents\nAssists the program director in the orientation of the resident to the program\nCoordinates, prepares and distributes resident activities and schedules with the program director, faculty and chief resident"
  },
  {
    value: 638,
    jobFunc: 30,
    text: "Public Affairs Specialist",
    assessment: "Message and offer tools and training for effective communication to supervisors and managers\nPlan and implement internal employee events like employee meetings and promotions\nAssist management and engage employees on company sponsored internal and external outreach events\nEmployee, team and business successes through various communication vehicles\n"
  },
  {
    value: 639,
    jobFunc: 30,
    text: "Media Information Specialist",
    assessment: "Lead and direct media kit development\nEnsure to write articles, action calls and varied media or program materials\nDevelop and maintain contacts as well as professional relations with print plus electronic media personnel intended to move ahead with media action plan goals\nCollaborate with all participating community and agencies partnering to develop and manage media prevention activities\nProvide prevention, outreach and media education to all youths, community groups and collaborations\n"
  },
  {
    value: 640,
    jobFunc: 30,
    text: "Publicist",
    assessment: "to generate and manage publicity for a public figure, especially a celebrity, a business, or for a work such as a book, film or album\n Most top-level publicists work in private practice, handling multiple clients\n"
  },
  {
    value: 641,
    jobFunc: 30,
    text: "Media Technical Supervisor",
    assessment: "Prepare, present, manage and ensure to quantify media programs\nDefine all media objectives as well as strategies\nEnsure strategic steadiness throughout all elements of plan implementation and development\nPrepare buying guidelines along with supervise buying process as well as media programs stewardship\nSupervise relations with media suppliers and oversee negotiation of media\n"
  },
  {
    value: 642,
    jobFunc: 30,
    text: "Media Information Assistant",
    assessment: "Seek and sort media kits and publications\nOrganize tearsheets and media agreements\nManage billboard agreements for out-of-home inventory\nCreate and send traffic instructions for out-of-home broadcast, print and online orders\nSupport routine management of agencies, merchants and vendors\nSupport media group with administrative functions and extend internal support\nSupport Media Buyers to reach budget goals\nResearch time periods were station ran wrong tape and act suitably\n"
  },
  {
    value: 643,
    jobFunc: 30,
    text: "Photographer Head",
    assessment: "assists the film director by establishing the visual look of the movie\n As a DP, you’ll help tell the story through the artistic and technical decisions you make regarding lighting, film stock, shot selection, camera operation and other elements\n A DP's duties and responsibilities include the work he does before, during and after film production\n"
  },
  {
    value: 644,
    jobFunc: 30,
    text: "Social Media Specialist",
    assessment: "Build and execute social media strategy through competitive research, platform determination, benchmarking, messaging and audience identification\nGenerate, edit, publish and share daily content (original text, images, video or HTML) that builds meaningful connections and encourages community members to take action\nSet up and optimize company pages within each platform to increase the visibility of company’s social content\nModerate all user-generated content in line with the moderation policy for each community\nCreate editorial calendars and syndication schedules"
  },
  {
    value: 645,
    jobFunc: 30,
    text: "Technical Writer",
    assessment: "Work with internal teams to obtain an in-depth understanding of the product and the documentation requirements\nAnalyze existing and potential content, focusing on reuse and single-sourcing opportunities\nCreate and maintain the information architecture\nProduce high-quality documentation that meets applicable standards and is appropriate for its intended audience\nWrite easy-to-understand user interface text, online help and developer guides\nCreate tutorials to help end-users use a variety of applications"
  },
  {
    value: 646,
    jobFunc: 30,
    text: "Sound Mixer",
    assessment: "responsible for recording all sound recording on set during the filmmaking or television production using professional audio equipment, for later inclusion in the finished product, or for reference to be used by the sound designer, sound effects editors, or foley artists\n This requires choice and deployment of microphones, choice of recording media, and mixing of audio signals in real time\n"
  },
  {
    value: 647,
    jobFunc: 30,
    text: "Stage Hand",
    assessment: "Load and unload props and materials from trucks\nAssemble and disassemble parts\nSet up lighting, props, and microphones\nMove and rearrange furniture\nUnload and set up road cases\nPerform spotlight operation during shows\nConstruct and paint set pieces\nSet up risers and musical equipment\n"
  },
  {
    value: 648,
    jobFunc: 30,
    text: "Media Analyst",
    assessment: "Assess and present research data and offer forward thinking suggestions\nOffer insight on past performance and suggest to serve as basis for key strategic media planning\nHandle media buys within placement platforms bid\nDevelop, oversee and measure campaign data for optimization\nEstablish responsive working relationships with internal team and vendors\n"
  },
  {
    value: 649,
    jobFunc: 30,
    text: "Media Mentor",
    assessment: "Responsible for meeting with the assigned mentee for the agreed-upon time frame (i\ne\n, often weekly\nmeetings for at least one year)\n Act as a resource and guide\n Work closely with agency staff through phone contact, personal conferences and group meetings\n Serve as an example/role model\n Accept and relate to youth who may not share the volunteer’s lifestyle and values\n Respect the mentee’s right to self-determination and independence"
  },
  {
    value: 650,
    jobFunc: 30,
    text: "Media Associate",
    assessment: "Train organization’s new members regarding use of media database plus develop targeted and effectual press lists\nIntroduce organizations to company through online “tours,” as well as manage all member accounts in salesforce\nMaintain regular contact with member organizations, analyze respective communications and media training requirements\nProvide continuing assistance to attain identified needs\n"
  },
  {
    value: 652,
    jobFunc: 1,
    text: "Senior computer programmer",
    assessment: "Supervises the work of other Programmer Analyst and Programmer positions; provides\ntechnical assistance, as required, to Programmer Analysts and other I\nS\n employees,\ncapable of performing any function on installed systems\n*-- Functions as the Data Base Administrator\n Has responsibility to define all databases and\nmaintain accuracy and consistency in the data dictionary for all applications in the City\nResponsible for defining and maintaining all data interface definitions between various\napplication platforms, such as GIS, Network Servers, Public Safety, Web Servers, etc\n"
  },
  {
    value: 653,
    jobFunc: 1,
    text: "Senior software programmer",
    assessment: "Accomplishes programming project requirements by coaching programmers\nMeets programming standards by following production, productivity, quality, and customer-service standards; identifying work process improvements; implementing new technology\nPlans programming projects by confirming program objective and specifications with clients\nArranges program specifications by confirming logical sequence and flowcharts; researching and employing established operations\nVerifies program operation by confirming tests\n"
  },
  {
    value: 654,
    jobFunc: 1,
    text: "Senior programmer",
    assessment: "Architect, develop and implement software programs to meet business requirements\nDevelop application code and modules for business and technical requirements\nTune up design for maintainability, scalability and efficiency\nDevelop and implement programs, designs and codes\nDesign and develop systems, sub-systems and programs\n"
  },
  {
    value: 655,
    jobFunc: 1,
    text: "Junior computer programmer",
    assessment: "Analysis and Design: They analyze the needs of their clients before they begin their software project\n Then once they meet all these requirements they begin to develop the software\n Junior programmers assist in the analysis and design phase of the project\nWriting Code: They are usually responsible for writing the code of the application to be developed\n The senior programmer on the other hand will just be the one to assign the functions and specify the methods and events needed for the program and the junior programmer will do it\n"
  },
  {
    value: 656,
    jobFunc: 1,
    text: "Junior software programmer",
    assessment: "Performs coding in VB\nNet and ASP\nNet\nSupports/updates stored procedures, writes and maintains SQL Server Reports\nResponds to, researches, and resolves on-going client inquiries\nWrites functional requirements for systems in standard template format\nInteracts with project sponsor(s), internal team members, client, and vendor project team members to develop and maintain project management documents\nStrives to manage stakeholder expectations via planning and work outcomes\n"
  },
  {
    value: 657,
    jobFunc: 1,
    text: "Junior programmer",
    assessment: "assists a project's senior programmer in the many tasks needed to complete and implement a computer application\n These include preliminary designing, coding, and debugging\n Junior programmers are also often asked to document the progress made on projects and to present their records when requested\n Other responsibilities include developing modifications to the software and providing instructions on how to use the program\n These numerous duties help a junior programmer develop the skills needed to eventually become a project lead\n"
  },
  {
    value: 658,
    jobFunc: 1,
    text: "Junior programmer analyst",
    assessment: "Follows business requirements, implements a set of specifications by coding, compiling and testing the\napplication\n Work closely with the Application Development Manager and Business Analysts to ensure code quality,\naccuracy and correct business solution has been developed\n Develop unit test cases/criteria to verify all functionality is working correctly\n"
  },
  {
    value: 659,
    jobFunc: 1,
    text: "Troubleshooting programmer",
    assessment: "Confirms project requirements by reviewing program objective, input data, and output requirements with analyst, supervisor, and client\nArranges project requirements in programming sequence by analyzing requirements; preparing a work flow chart and diagram using knowledge of computer capabilities, subject matter, programming language, and logic\nEnsures operation of equipment by following manufacturer's instructions; troubleshooting malfunctions; calling for repairs; evaluating new equipment and techniques\n"
  },
  {
    value: 660,
    jobFunc: 1,
    text: "Software designer",
    assessment: "Design, develop and execute unit test plans, test designs, test cases and test strategies\nDesign, develop and execute subsystem test plans, procedures and processes\nDocument all test plans, test cases and strategies procedures and issues\nDesign and implement test scripts on test tools and scripting languages\n"
  },
  {
    value: 661,
    jobFunc: 1,
    text: "C++ programmer",
    assessment: "Design, build, and maintain efficient, reusable, and reliable C++ code\nImplement performance and quality modules\nIdentify bottlenecks and bugs, and devise solutions to these problems\nHelp maintain code quality, organization, and automatization"
  },
  {
    value: 662,
    jobFunc: 1,
    text: "Java analyst",
    assessment: "Develop technical specifications and implementation of java codes\nEnsure to record developed java programs and client documentation\nProvide guidance and technical expertise to less experienced programmer analysts in resolving design problems\nHead and perform as subject matter expert for assigned technology platforms\n"
  },
  {
    value: 663,
    jobFunc: 1,
    text: "Technical programmer",
    assessment: "Confirms project requirements by reviewing program objective, input data, and output requirements with analyst, supervisor, and client\nArranges project requirements in programming sequence by analyzing requirements; preparing a work flow chart and diagram using knowledge of computer capabilities, subject matter, programming language, and logic\nEncodes project requirements by converting work flow information into computer language\nPrograms the computer by entering coded information\n"
  },
  {
    value: 664,
    jobFunc: 1,
    text: "IT programmer",
    assessment: "Correct errors by making appropriate changes and then rechecking the program to ensure that the desired results are produced\nConduct trial runs of programs and software applications to be sure they will produce the desired information and that the instructions are correct\nCompile and write documentation of program development and subsequent revisions, inserting comments in the coded instructions so others can understand the program\n"
  },
  {
    value: 665,
    jobFunc: 1,
    text: "\nNET programmer",
    assessment: "Develop flow charts and block diagrams to show programming workflow\nDevelop subroutines to simplify application programming and coding\nAnalyze project and design specifications to develop \nNET software applications\nPrepare technical documentations at both program level and user level\nFollow coding standards defined by Company\n"
  },
  {
    value: 666,
    jobFunc: 1,
    text: "Perl developer",
    assessment: "Assist in design and development of large-scale Perl applications\nPerform application modifications and enhancements based on business needs\nDevelop clean, high-quality and reusable codes based on programming standards\nCoordinate with Project Manager to clearly understand business requirements and expectations\n"
  },
  {
    value: 667,
    jobFunc: 1,
    text: "PeopleSoft developer",
    assessment: "Coordinate with Business Analyst to understand client business needs and requirements\nAssist in design and development of Peoplesoft applications based on business requirements\nUpgrade and modify Peoplesoft applications as per business needs\nAssist in preparing project plan and technical and functional specifications\n"
  },
  {
    value: 668,
    jobFunc: 1,
    text: "Oracle programmer",
    assessment: "Perform design and development of Oracle applications according to project requirements\nDesign, code, and maintain the Oracle systems based on established standards\nUnderstand project requirements and develop design specifications\nPerform initial design reviews and recommend improvements\nWrite clear codes and prepare coding documentations\n"
  },
  {
    value: 669,
    jobFunc: 1,
    text: "UNIX programmer",
    assessment: "Design, develop and implement applications appropriate to business needs and requirements\nInterface with customers to identify and understand their business goals\nPerform analysis and evaluation of customer requirements\nDevelop appropriate software development life cycle logistics to suit business objectives"
  },
  {
    value: 670,
    jobFunc: 1,
    text: "Web programmer",
    assessment: "Perform research and develop new technologies for web development\nMaintain and compile records of website content\nDesign various applications for effective implementation of web services and provide support to all media activities\nAnalyze develop designs and prepare appropriate software on same\n"
  },
  {
    value: 671,
    jobFunc: 1,
    text: "Web development",
    assessment: "Program, test and debug all web applications\nDesign, develop, test and deploy web applications\nCode pages, files, test, debug and deploy\nDevelop appropriate code structures to solve specific tasks\nCoordinate with other designers and programmers to develop web projects\n"
  },
  {
    value: 672,
    jobFunc: 1,
    text: "Website programmer",
    assessment: "Perform research and develop new technologies for web development\nMaintain and compile records of website content\nDesign various applications for effective implementation of web services and provide support to all media activities\nAnalyze develop designs and prepare appropriate software on same\n"
  },
  {
    value: 673,
    jobFunc: 1,
    text: "website development",
    assessment: "Program, test and debug all web applications\nDesign, develop, test and deploy web applications\nCode pages, files, test, debug and deploy\nDevelop appropriate code structures to solve specific tasks\nCoordinate with other designers and programmers to develop web projects\n"
  },
  {
    value: 674,
    jobFunc: 1,
    text: "C++ developer",
    assessment: "Design, build, and maintain efficient, reusable, and reliable C++ code\nImplement performance and quality modules\nIdentify bottlenecks and bugs, and devise solutions to these problems\nHelp maintain code quality, organization, and automatization"
  },
  {
    value: 675,
    jobFunc: 1,
    text: "Senior web programmer",
    assessment: "Defines site objectives by analyzing user requirements; envisioning system features and functionality\nDesigns and develops user interfaces to Internet/intranet applications by setting expectations and features priorities throughout development life cycle; determining design methodologies and tool sets; completing programming using languages and software products; designing and conducting tests\nRecommends system solutions by comparing advantages and disadvantages of custom development and purchase alternatives\nIntegrates applications by designing database architecture and server scripting; studying and establishing connectivity with network systems, search engines, and information servers\n"
  },
  {
    value: 676,
    jobFunc: 1,
    text: "Lead developer",
    assessment: "Sets the standard (coding and otherwise)\nResearches new technologies for the team\nSets the technical direction for the team\nHas the final say on matters\nDesigns the architecture of a system"
  },
  {
    value: 678,
    jobFunc: 1,
    text: "Mobile application programmer",
    assessment: "Contribute to the native apps written in Objective-C\nIntegrate with backend services to make sure we are delivering a great mobile user experience that’s super-fast for end users\nHelp improve code quality through writing unit tests, automation and performing code reviews\nParticipate in brainstorming sessions and have the chance to contribute innovative and original ideas to our technology, algorithms and product\nWork with the product and design team to understand end-user requirements and use cases, then translate that into a pragmatic and effective technical solution\nDive into difficult problems and successfully deliver results within a schedule"
  },
  {
    value: 679,
    jobFunc: 1,
    text: "Mobile application developer",
    assessment: "Contribute to the native apps written in Objective-C\nIntegrate with backend services to make sure we are delivering a great mobile user experience that’s super-fast for end users\nHelp improve code quality through writing unit tests, automation and performing code reviews\nParticipate in brainstorming sessions and have the chance to contribute innovative and original ideas to our technology, algorithms and product\nWork with the product and design team to understand end-user requirements and use cases, then translate that into a pragmatic and effective technical solution\nDive into difficult problems and successfully deliver results within a schedule"
  },
  {
    value: 680,
    jobFunc: 1,
    text: "Mobile software developer",
    assessment: "Work on the design and development of the highly-visible Android and/or iOS mobile apps\nWrite high performance, native mobile code in Java and/or Objective-C\nWork with sensor data, including location services\nMaintain a focus on battery and performance optimization\nBuild and support both client and server components\nWrite test automation, conduct code reviews, and take end-to-end ownership of deployments to production"
  },
  {
    value: 681,
    jobFunc: 1,
    text: "Senior mobile application developer",
    assessment: "Deliver across the entire app life cycle –concept, design, build, deploy, test, release to app stores and support\nBuild prototypes at tech scoping stage of projects\nWorking along the web developers to create and maintain a robust framework to support the apps/web\nWorking with the front end developers to build the interface with focus on usability features\nCreate compelling mobile device specific user interfaces and experiences\nOptimizing performance for the apps /web\nKeep up to date on the latest industry trends in the mobile/web technologies"
  },
  {
    value: 682,
    jobFunc: 1,
    text: "Senior mobile application programmer",
    assessment: "Deliver across the entire app life cycle –concept, design, build, deploy, test, release to app stores and support\nBuild prototypes at tech scoping stage of projects\nWorking along the web developers to create and maintain a robust framework to support the apps/web\nWorking with the front end developers to build the interface with focus on usability features\nCreate compelling mobile device specific user interfaces and experiences\nOptimizing performance for the apps /web\nKeep up to date on the latest industry trends in the mobile/web technologies"
  },
  {
    value: 683,
    jobFunc: 1,
    text: "iOS lead developer",
    assessment: "Cultivate a collaborative working environment with a growing team\nHands-on coding, systems analysis, design, and delivery of projects assigned\nCoordinate project performance with clients\n Respond to problems in a timely, effective manner\nComplete assigned projects in a timely manner within project parameters\nMeet project objectives, providing systems that operate in a cost-effective manner\nProvide good technical guidance to project team members within the organization so that their abilities and the overall project quality are enhanced\n"
  },
  {
    value: 684,
    jobFunc: 1,
    text: "Android app developer",
    assessment: "Translate designs and wireframes into high quality code\nDesign, build, and maintain high performance, reusable, and reliable Java code\nEnsure the best possible performance, quality, and responsiveness of the application\nIdentify and correct bottlenecks and fix bugs\nHelp maintain code quality, organization, and automatization"
  },
  {
    value: 685,
    jobFunc: 1,
    text: "Windows based app developer",
    assessment: "collaborate with the UX Team to create customer-centric applications\nunderstand user requirements and how they translate into application features\ndesign creative prototypes according to specifications\nwrite high quality source code to program complete applications within deadlines\nperform unit and integration testing before launch\nconduct functional and non-functional testing\ntroubleshoot and debug applications"
  },
  {
    value: 686,
    jobFunc: 1,
    text: "Application support developer",
    assessment: "Develop and implement solution design\nProvide support to other programmers and developers\nDesign and develop document application solutions\nTroubleshoot to restore application use in the event of a failure\nResolve complex issues in applications development\nTranslate customer needs and requirements into application solutions\nDevelop integrated applications for business clients\nDevelop and implement strategies to address complex technical challenges\nCreate environment support for a variety of applications and programs\nMaintain, manage and update technical system documentation\n"
  },
  {
    value: 687,
    jobFunc: 5,
    text: "Marketing Technologist",
    assessment: "selecting, evaluating and choosing marketing technology providers to match the organisation’s needs\n So the job is part creative, part strategy and part technology\n"
  },
  {
    value: 688,
    jobFunc: 5,
    text: "SEO Consultant",
    assessment: "put in place procedures that make a website more attractive\n The content put onto a site needs to be relevant and unique in order to draw in and retain visitors\n SEO consultants aim to provide clients with all the information they need to implement their search engine optimisation strategies\n"
  },
  {
    value: 689,
    jobFunc: 5,
    text: "Web Analytics Developer",
    assessment: "Provide support to various websites, conduct appropriate tests and analyze test results\nEvaluate appropriate traffic metrics for external audiences and monitor competitor site and incorporate optimization technique\nDevelop various measurement tools and analyze business requirements and implement appropriate plans\nPerform analysis on dashboard program and facilitate in decision making process\n"
  },
  {
    value: 690,
    jobFunc: 5,
    text: "Digital Marketing Manager",
    assessment: "Plan and execute all web, SEO/SEM, marketing database, email, social media and display advertising campaigns\nDesign, build and maintain our social media presence\nMeasure and report performance of all digital marketing campaigns, and assess against goals (ROI and KPIs)\nIdentify trends and insights, and optimize spend and performance based on the insights\nBrainstorm new and creative growth strategies\nPlan, execute, and measure experiments and conversion tests"
  },
  {
    value: 691,
    jobFunc: 5,
    text: "Social Media Manager",
    assessment: "\nCreate the social media strategy\nCreate budgets for social media activities\nManage social media campaigns and day to day activities\nManage presence in social networking sites\nDevelop benchmark metrics to measure the results of social media programs\nAnalyze and evaluate social media campaigns and strategies\nReport on effectiveness of campaigns"
  },
  {
    value: 692,
    jobFunc: 5,
    text: "Growth Hacker",
    assessment: "Set up, QA and run A/B tests using Optimizely\nSet up, QA and run usability tests, often, but not always, using UserTesting\ncom\nEnsure tests get up and running, and willing and able to help product and marketing team interpret results and present them to management without bias"
  },
  {
    value: 693,
    jobFunc: 5,
    text: "Content Strategist",
    assessment: "Assist Web Editor to define and oversee content life cycles\nCoordinate to define and monitor site taxonomy\nAlign with online content strategies\nAssess ways to enhance handling of content throughout lifecycle\nReview content creation and production methods\nPerform content audits and develop editorial calendars\n"
  },
  {
    value: 694,
    jobFunc: 5,
    text: "Information Architect",
    assessment: "Enhances information architecture team accomplishments and competence by planning delivery of solutions; answering technical and procedural questions for less experienced team members; teaching improved processes; mentoring team members\nIdentifies user requirements by researching and analyzing user needs, preferences, objectives, and working methods; studying how users consume content, including data categorization and labeling; meeting with focus groups\n"
  },
  {
    value: 695,
    jobFunc: 8,
    text: "UI Designer",
    assessment: "Collaborate with product management and engineering to define and implement innovative solutions for the product direction, visuals and experience\nExecute all visual design stages from concept to final hand-off to engineering\nConceptualize original ideas that bring simplicity and user friendliness to complex design roadblocks\nCreate wireframes, storyboards, user flows, process flows and site maps to effectively communicate interaction and design ideas"
  },
  {
    value: 697,
    jobFunc: 8,
    text: "Front-End Designer",
    assessment: "Lead the design and development efforts for all user experiences\nCreate visual design and development standards / guidelines for other developers\nDevelop proof of concepts\nCreate graphical elements\nDevelop user experiences"
  },
  {
    value: 698,
    jobFunc: 1,
    text: "Front-End Developer",
    assessment: "Develop new user-facing features\nBuild reusable code and libraries for future use\nEnsure the technical feasibility of UI/UX designs\nOptimize application for maximum speed and scalability\nAssure that all user input is validated before submitting to back-end\nCollaborate with other team members and stakeholders"
  },
  {
    value: 699,
    jobFunc: 1,
    text: "Full-Stack Developer",
    assessment: "Understand and evolve the overall design of the backend, API, and clients\nImplement of a robust set of services and APIs to power the web and mobile applications\nBuild reusable code and libraries for future use\nOptimize the application for maximum speed and scalability\nEnsure the integrity, privacy, and security of stored data\nTranslate of UI/UX wireframes to visual elements"
  },
  {
    value: 700,
    jobFunc: 1,
    text: "Wordpress Developer",
    assessment: "Contributing to “scope of build” conversations with development team, project managers, designers and other developers\nIntegrating sliced PSD files (usually already converted to HTML/CSS) into either WordPress or some other proven open source system (note: WordPress is our primary CMS platform); many of our builds are responsive\nDeveloping custom web applications that drive business processes\nSetting up e-commerce applications\nMonitoring health and uptime of servers (general server admin in a managed services environment; no in-depth configuration required)\nCollaborating with design, strategy and sales teams to find solutions for client website projects\nContributing to support of current client websites"
  },
  {
    value: 702,
    jobFunc: 1,
    text: "RUBY On Rails Developer",
    assessment: "Write clean, maintainable and efficient code\nDesign robust, scalable and secure features\nContribute in all phases of the development lifecycle\nFollow best practices (test-driven development, continuous integration, SCRUM, refactoring, code standards)\nDrive continuous adoption and integration of relevant new technologies into design"
  },
  {
    value: 703,
    jobFunc: 1,
    text: "PYTHON Developer",
    assessment: "Writing reusable, testable, and efficient code\nDesign and implementation of low-latency, high-availability, and performant applications\nIntegration of user-facing elements developed by front-end developers with server side logic\nImplementation of security and data protection\nIntegration of data storage solutions {{may include databases, key-value stores, blob stores, etc\n}}"
  },
  {
    value: 704,
    jobFunc: 1,
    text: "Business System Analyst",
    assessment: "Determines operational objectives by studying business functions; gathering information; evaluating output requirements and formats\nDesigns new computer programs by analyzing requirements; constructing workflow charts and diagrams; studying system capabilities; writing specifications\nImproves systems by studying current practices; designing modifications\nRecommends controls by identifying problems; writing improved procedures\nDefines project requirements by identifying project milestones, phases, and elements; forming project team; establishing project budget\nMonitors project progress by tracking activity; resolving problems; publishing progress reports; recommending actions\n"
  },
  {
    value: 705,
    jobFunc: 1,
    text: "Data Architect",
    assessment: "Determines database structural requirements by analyzing client operations, applications, and programming; reviewing objectives with clients; evaluating current systems\nDevelops database solutions by designing proposed system; defining database physical structure and functional capabilities, security, back-up, and recovery specifications\nInstalls database systems by developing flowcharts; applying optimum access techniques; coordinating installation actions; documents actions\nMaintains database performance by identifying and resolving production and application development problems; calculating optimum values for parameters; evaluating, integrating, and installing new releases; completing maintenance; answering user questions\nPrepares users by conducting training\n"
  },
  {
    value: 706,
    jobFunc: 1,
    text: "Data Modeler",
    assessment: "Understand and translate business needs into data models supporting long-term solutions\nWork with the Application Development team to implement data strategies, build data flows and develop conceptual data models\nCreate logical and physical data models using best practices to ensure high data quality and reduced redundancy\nOptimize and update logical and physical data models to support new and existing projects\n"
  },
  {
    value: 707,
    jobFunc: 5,
    text: "Data Analyst",
    assessment: "Interpret data, analyze results using statistical techniques and provide ongoing reports\nDevelop and implement data collection systems and other strategies that optimize statistical efficiency and data quality\nAcquire data from primary or secondary data sources and maintain databases/data systems\nIdentify, analyze, and interpret trends or patterns in complex data sets"
  },
  {
    value: 708,
    jobFunc: 1,
    text: "Data Scientist",
    assessment: "Develop and plan required analytic projects in response to business needs\nIn conjunction with data owners and department managers, contribute to the development of data models and protocols for mining production databases\nDevelop new analytical methods and/or tools as required\nContribute to data mining architectures, modeling standards, reporting, and data analysis methodologies\nConduct research and make recommendations on data mining products, services, protocols, and standards in support of procurement and development efforts\nWork with application developers to extract data relevant for analysis\n"
  },
  {
    value: 709,
    jobFunc: 1,
    text: "Cloud Architect",
    assessment: "Demonstrate thought leadership and the effective application of technology to support technology cloud strategies\nApply defined principles and reference architectures to develop longer range roadmaps that improve operational maturity, enable new capabilities, and drive efficiency for cloud solutions\nCreate migration strategies that balance benefits with the organizations ability to evolve and adopt\nDevelop creative and innovative cloud solutions to business or technical problems\nEngaging with C-level executives to define Enterprise cloud strategies\n"
  },
  {
    value: 710,
    jobFunc: 1,
    text: "Technical Lead",
    assessment: "Own the Responsibility of the overall sprint or iteration outcome\nUse project’s best practices and coding standards\nPrepare and help team to prepare the design; should have a very good understanding of the project architecture\nCoding and unit testing including JUnits\nConduct peer review and provide feedback\nRemove the technical impediments\nUpdate regular associates RAG (Red, Amber, Green) status; discuss the Red cases on the immediate basis with the project manager to help the manager in the attrition management"
  },
  {
    value: 711,
    jobFunc: 1,
    text: "DEVOPS Manager",
    assessment: "Integrate various components and build tools that allow our system and the entire team to operate more efficiently\nRe-engineer processes by finding better ways to do things and improve how we deploy, test, and monitor our systems\nPerforms application profiling, capacity planning, workload modeling and forecasting on systems, networks and storage\nMonitor systems to ensure stability, reliability and availability of applications and services for the business\nFull-stack troubleshooting and resolution of monitoring issues"
  },
  {
    value: 712,
    jobFunc: 1,
    text: "Agile Project Manager",
    assessment: "Project Financials & Financial/Portfolio Reporting\nStatus Reporting\nProject Governance\nIdentification of missing roles/resources and resolution/escalation of same\nBusiness stakeholder communication\nIssue/Risk communication/resolution/escalation – removing blockers\nProject Planning\nChange Management"
  },
  {
    value: 713,
    jobFunc: 1,
    text: "Product Manager",
    assessment: "Determines customers' needs and desires by specifying the research needed to obtain market information\nRecommends the nature and scope of present and future product lines by reviewing product specifications and requirements; appraising new product ideas and/or product or packaging changes\nAssesses market competition by comparing the company's product to competitors' products\nProvides source data for product line communications by defining product marketing communication objectives\nObtains product market share by working with sales director to develop product sales strategies\n"
  },
  {
    value: 714,
    jobFunc: 1,
    text: "Technical Account Manager",
    assessment: "Manage a portfolio of clients\n Build strong and positive relationships with clients at various levels\n Build and document knowledge about the clients business and technical setup\n Project manage and document all technical projects carried out with clients\n Actively play a part in ensuring financial targets are reached\n Log any bugs or feature requests in the bug and feature handling system\n Build strong relationships with Client Services team members"
  },
  {
    value: 715,
    jobFunc: 1,
    text: "QA Specialist",
    assessment: "Record all defects encountered during review process and coordinate resolution of those issues with proper resources\nUtilize knowledge and experience to consistently refine QA/QC process to increase efficiency and decrease errors\nProvide feedback to management and peers to improve continuously processes of achieving goals within department\nDesign, develop, execute and maintain QA test plans and cases\n"
  },
  {
    value: 716,
    jobFunc: 1,
    text: "Game Developer",
    assessment: "Creating story lines and character biographies\nConducting design reviews\nDesigning role-play mechanics\nCreating prototypes for staff and management\nDocumenting game design process"
  },
  {
    value: 717,
    jobFunc: 1,
    text: "Application Support Analyst",
    assessment: "Perform analysis of existing application protocols and software tools\nDesign and develop new applications that support business growth\nProvide and support recommendations for improved procedures and policies\nProvide application support in resolving and troubleshooting problems\nAssist and support in achieving departmental goals and objectives\nProvide advanced application support to effectively utilize the system infrastructure and resources\n"
  },
  {
    value: 718,
    jobFunc: 1,
    text: "Associate Developer",
    assessment: "Identifies the requirements of the clients and discusses it with the development manager\nselects team members for the project and assigns tasks to all the team members\nmonitors software development process and supports the team members in all phases of the project\nparticipates or initiates the testing process and discusses test results with the senior developer to alter or modify current features and specifications\nprototypes the software and helps in integration of third party plug ins and applications with the software\nexplains the features and specifications of the software to the sales engineers\nassists the clients in the installation, maintenance, troubleshooting and updating the software\n"
  },
  {
    value: 719,
    jobFunc: 1,
    text: "Computer and Information Systems Manager",
    assessment: "evaluating user needs and system functionality and ensuring that ICT facilities meet these needs\nplanning, developing and implementing the ICT budget, obtaining competitive prices from suppliers, to ensure cost effectiveness\nscheduling upgrades and security backups of hardware and software systems\nresearching and installing new systems\nguaranteeing the smooth running of all ICT systems, including anti-virus software, print services and email provision\nensuring that software licensing laws are adhered to;"
  },
  {
    value: 721,
    jobFunc: 1,
    text: "Data Quality Manager",
    assessment: "Review data loaded into the data warehouse for accuracy\n Recommend maintenance enhancements to data acquisition processes to improve accuracy of data\nwarehouse data\n Make recommendations to operational support for enhancements to systems of record to improve\naccuracy of operational data\n Review referential integrity of data warehouse data\n Review historical integrity of data warehouse data"
  },
  {
    value: 723,
    jobFunc: 1,
    text: "Director of Technology",
    assessment: "Interact with business partners across organization to identify opportunities and drive growth\nDirect development and delivery of software solutions to meet customer needs\nIdentify and execute business process improvements related to technical applications, systems and client implementations\nContribute in key customer meetings to promote existing relationships\n"
  },
  {
    value: 724,
    jobFunc: 1,
    text: "Information Technology Coordinator",
    assessment: "Install, maintain and resolve computer and network system equipment issues on headquarters and office locations\nImage systems with standard agency applications\nRepair computer equipment\nConduct server and workstation upgrades to third party software applications used by agency\nOrganize and optimize shared network drives and electronic storage\n"
  },
  {
    value: 725,
    jobFunc: 1,
    text: "IT Support Manager",
    assessment: "Administer all technology integration processes on various servers and assist to install various product solutions and manage regular communication with all customers and personnel and provide assistance to perform troubleshoot on all processes\nProvide support to all IT processes and maintain exceptional quality in all products and develop all materials according to customers and end user requirements and assist to resolve all complex issues for all internal and external customers\n"
  },
  {
    value: 726,
    jobFunc: 1,
    text: "\nNET Developer",
    assessment: "Prepare test based applications for various Dot Net applications\nPrepare and maintain code for various dot Net applications and resolve any defects in systems\nManage defect tracking system and resolve all issues and prepare update for systems\nAdminister change requests and provide estimation of all risks\nDevelop documents for various policies and procedures for applications\nDesign various application systems for Dot Net applications\n"
  },
  {
    value: 727,
    jobFunc: 1,
    text: "System Architect",
    assessment: "Lead strategically across Trane Intelligent Services projects\nRealize target architecture advancing business and information technology strategies\nHandle high level system architectures and interfaces for Trane Intelligent Services\nAnalyze current IT environment to detect critical deficiencies and suggest enhancement solutions\nAnalyze industry and market trends to identify impact on enterprise architecture\n"
  },
  {
    value: 728,
    jobFunc: 1,
    text: "Systems Designer",
    assessment: "Conduct software programming through established design standards\nOwn or share ownership of game content as per lead\nPrototype and iterate on core game mechanics and content\nBalance and adjust game-play experiences to ensure product’s critical and commercial success\nCoordinate with project team members to implement design and work through design revisions\n"
  },
  {
    value: 729,
    jobFunc: 1,
    text: "Technical Operations Officer",
    assessment: "Provide support to all business units including administrative, financial and human resource departments\nEnsure that operational activities are executed within allotted budget and timelines\nPerform budget allocation and expense management for all business operational activities\nConduct regular operational reviews and audits for preventive maintenance\n"
  },
  {
    value: 730,
    jobFunc: 1,
    text: "Technical Support Engineer",
    assessment: "Installing and configuring computer hardware operating systems and applications\nmonitoring and maintaining computer systems and networks\ntalking staff or clients through a series of actions, either face-to-face or over the telephone, to help set up systems or resolve issues\ntroubleshooting system and network problems and diagnosing and solving hardware or software faults\nreplacing parts as required\nproviding support, including procedural documentation and relevant reports\nfollowing diagrams and written instructions to repair a fault or set up a system;"
  },
  {
    value: 731,
    jobFunc: 1,
    text: "Technical Specialist",
    assessment: "Evaluates system potential by testing compatibility of new programs with existing programs\nEvaluates expansions or enhancements by studying work load and capacity of computer system\nAchieves computer system objectives by gathering pertinent data; identifying and evaluating options; recommending a course of action\nConfirms program objectives and specifications by testing new programs; comparing programs with established standards; making modifications\n"
  },
  {
    value: 732,
    jobFunc: 1,
    text: "Webmaster",
    assessment: "Build or assist in the development of a website\nManage websites and perform continual maintenance; this can includes links, database, and other functions\nProvide web space for individuals and businesses\nWeb programming (knowledge of HTML codes, HTTP, and XML required)\nMarketing of websites on various platforms including other sites and search engines; determine ad structures, pricing, placement, etc\nAdministrative work \nSite promotion, sending out email, voicemail, newsletters, etc\n"
  },
  {
    value: 733,
    jobFunc: 4,
    text: "Account Executive",
    assessment: "meeting and liaising with clients to discuss and identify their advertising requirements\nworking with agency colleagues to devise an advertising campaign that meets the client's brief and budget\npresenting alongside agency colleagues (particularly the account manager), the campaign ideas and budget to the client\nworking with the account manager to brief media, creative and research staff and assisting with the formulation of marketing strategies\nliaising with, and acting as the link between, the client and the advertising agency by maintaining regular contact with both,\nensuring that communication flows effectively;"
  },
  {
    value: 734,
    jobFunc: 30,
    text: "Administrative Assistant",
    assessment: "Maintains workflow by studying methods; implementing cost reductions; and developing reporting procedures\nCreates and revises systems and procedures by analyzing operating practices, recordkeeping systems, forms control, office layout, and budgetary and personnel requirements; implementing changes\nDevelops administrative staff by providing information, educational opportunities, and experiential growth opportunities\nResolves administrative problems by coordinating preparation of reports, analyzing data, and identifying solutions\n"
  },
  {
    value: 735,
    jobFunc: 30,
    text: "Animator",
    assessment: "recording dialogue and working with editors to composite the various layers of animation (backgrounds, special effects, characters and graphics) in order to produce the finished piece\nworking to production deadlines and meeting clients' commercial requirements\nworking as part of a broader production team, which might include liaising with printers, copywriters, photographers, designers, account executives, website designers or marketing specialists\ndealing with diverse business cultures, delivering presentations and finding funding\n"
  },
  {
    value: 736,
    jobFunc: 30,
    text: "Announcer",
    assessment: "Operate control consoles\n\t\nPrepare and deliver news, sports, and/or weather reports, gathering and rewriting material so that it will convey required information and fit specific time slots\n\t\nAnnounce musical selections, station breaks, commercials, or public service information, and accept requests from listening audience\n\t\nRead news flashes to inform audiences of important events\n\t\nIdentify stations, and introduce or close shows, using memorized or read scripts, and/or ad-libs\n\t\nKeep daily program logs to provide information on all elements aired during broadcast, such as musical selections and station promotions\n"
  },
  {
    value: 737,
    jobFunc: 30,
    text: "Assistant Editor",
    assessment: "supporting editorial staff in all activities leading to publication, including acting as a personal assistant to commissioning editors and overseeing tasks such as issuing contracts and dealing with royalties\nliaising with other in-house teams, writers, photographers, printers, designers and production staff to negotiate and monitor timescales for stages in the publishing process\ndealing with the administration of work commissioned to freelance writers, picture researchers, photographers, stylists and illustrators\norganising and researching projects to tight deadlines\nsummarising written material;"
  },
  {
    value: 738,
    jobFunc: 30,
    text: "Author",
    assessment: "Write and produce documents for publications\nWrite and prepare brochures and other advertising material\nWrite and produce manuals and technical documents\nWrite maintenance and operational manuals\nWrite, edit and re-write documents and manuals\nPerform editorial duties for a newspaper or magazine\nAuthor and produce operational literature for systems and components\nMaintain accuracy and quality in all write-ups\n"
  },
  {
    value: 739,
    jobFunc: 13,
    text: "Broadcast and Sound Engineering Technician",
    assessment: "Operate, monitor, and adjust audio and video equipment to regulate the volume and ensure quality in radio and television broadcasts, concerts, and other performances\nSet up and tear down equipment for events and live performances\nRecord speech, music, and other sounds on recording equipment\nSynchronize sounds and dialogue with action taking place on television or in movie productions\nConvert video and audio records to digital formats for editing\nInstall audio, video, and sometimes lighting equipment in hotels, offices, and schools\nReport and repair equipment problems\nKeep records of recordings and equipment used"
  },
  {
    value: 740,
    jobFunc: 13,
    text: "Broadcaster",
    assessment: "researching topics and background information for items to be featured on the programme\nplanning and rehearsing shows\nwriting, and sometimes memorising, scripts\nliaising with other members of the production and technical teams\n"
  },
  {
    value: 741,
    jobFunc: 30,
    text: "Copy Editor",
    assessment: "Assess and edit search engine ad copy for grammar and factual accuracy through online user interface\nInvestigate, edit and check facts for divisional communication materials\nAssess and update CRS Style Guide and boilerplate materials and manage CRS Editorial Calendar\nAdvice on editorial processes and best practices\nGather, edit and track human interest stories for agency use\nMaintain internal communication vehicles for information sharing and project management\nSynthesize company conference materials and publications\n"
  },
  {
    value: 742,
    jobFunc: 30,
    text: "Copy Writer",
    assessment: "Create and conceptualize single projects from concept design to copy\nEngage in all work stages from ideation to production\nUnderstand product, service, target audience and competitor activities in market\nDetermine business strategic needs and translate to copy\nDetermine different ideas with designers, producers and AE’s to develop print, radio and video concepts\nPresent draft materials to creative director, team or client and ensure team meets copy guidelines\nConduct meetings with account executives and discuss clients requirements and core messages\n"
  },
  {
    value: 743,
    jobFunc: 30,
    text: "Digital Media Specialist",
    assessment: "establish an Internet presence for public relations campaigns\n In general, public relations or media specialists develop and maintain relationships with reporters, community members, consumers, and government officials, as well as anyone else who will spread the word about the company’s product or message\n Digital media specialists do the majority of their work online, using technology like websites, webcasts, blogs, and podcasts to spread the message of their clients\n"
  },
  {
    value: 744,
    jobFunc: 30,
    text: "Electronic Data Interchange Specialist",
    assessment: "Outlined state reporting requirements\nFormulated mandated EDI claim reports\nDrafted EDI First and Subsequent reports\nMaintained Electronic Data Interchange processes\nAided daily support of EDI system\nManaged full cycle of EDI project\nHandled maintenance of File Exchange server\n"
  },
  {
    value: 745,
    jobFunc: 30,
    text: "Freelance Writer",
    assessment: "Create new pages for specified regions with detailed, accurate, and up to\ndate information\nInvolves in writing the text for an advertising materials such as the companies who sell products to the distributors\nEngages in writing independently for any publishing houses or for books\nTheir job involves journal publishing, copy editing, and proofreading, indexing and even graphic designing\n Enjoys a greater variety of assignments than the regular employment, and has the freedom to choose their own work schedule\nWriting independently for the magazines, newspapers, book publishers, and non-profit organizations\n"
  },
  {
    value: 746,
    jobFunc: 30,
    text: "Intranet Applications Manager",
    assessment: "Coordinate creation of a visual design and theme for the intranet\nConduct research to understand intranet user needs\nLead efforts to create and maintain a sound site navigation (information architecture)\nManage the homepage to maintain a proper balance of content and tools\nOversee authoring and proper use of online channels for official company news\nManage projects to deliver intranet content or tools to mobile devices"
  },
  {
    value: 747,
    jobFunc: 30,
    text: "Journalist",
    assessment: "interviewing people in a range of different circumstances\nbuilding contacts to maintain a flow of news, for example, police and emergency services, local council, community groups, health trusts, press officers from a variety of organisations, the general public, etc\nseeking out and investigating stories via your contacts, press releases and other media\nattending press conferences and asking questions\nattending a range of events, such as council meetings, magistrates' court proceedings, football matches, talent contests, etc\nanswering the phones on the news desk and reacting to breaking news stories;"
  },
  {
    value: 748,
    jobFunc: 30,
    text: "Line Producer",
    assessment: "works with the director, production manager and department heads to prepare the final budget, shooting schedule and production dates\noversees hiring crew, finding equipment and suppliers, scouting locations and activities of various departments\nprovides vision to the director monitors the budget and production schedule, revising the schedule and controlling expenses to keep the film on time and within budget\nanswers to the studio and acts as a liaison between the crew and the producer\napproves or denies additional expenses"
  },
  {
    value: 749,
    jobFunc: 30,
    text: "Managing Editor",
    assessment: "Supervise entire editorial team’s daily activities\nHire and manage outside organization’s freelance writers as well as development editors\nManage receipt as well as materials workflow through his or her editorial team\nReport on status of respective projects for editing group\n"
  },
  {
    value: 750,
    jobFunc: 30,
    text: "Media Director",
    assessment: "Manage routine operations of entire Media Services team\nIdentify opportunities for new business and involve to develop and present new business pitches\nEnsure team performance is commensurate to high quality work on strategy as well as on time\nDevelop relations with extended team to improve team’s ability to attain excellence\nPrepare business case studies\n"
  },
  {
    value: 751,
    jobFunc: 30,
    text: "Media Planner",
    assessment: "Utilize exterior media contacts to protect research information to assist pitch\nEvaluate collected information externally and internally to synthesize for pitch team\nPerform competitive research and evaluation as well as summarize findings for strategy\nContact media representatives through RFI process to identify prototypical media programs suitable for customer and summarize strategy\nEvaluate collected information during RFP process\n"
  },
  {
    value: 752,
    jobFunc: 30,
    text: "Media Product Development Manager",
    assessment: "Manages the media product development team\n Evaluates capital expenditures, revenue potential, and production methods of new media products\n Manages the overall media product development process from concept to commercialization\n Monitors work flow and deadlines\n Provides leadership, coaching, and mentoring to development staff\n"
  },
  {
    value: 753,
    jobFunc: 30,
    text: "Media and Communication Equipment Operator",
    assessment: "Set up and install equipment such as microphones, sound speakers, video screens, projectors, video monitors, recording equipment, connecting wires and cables, sound and mixing boards for events and functions such as concerts, sports events, meetings and conventions, presentations, and news conferences\nSet up and operate sound equipment\nSet up and operate spotlights\nConfer with meeting or concert director to establish cues and directions\nCreate and install custom lighting systems\n"
  },
  {
    value: 754,
    jobFunc: 30,
    text: "Merchandising Manager",
    assessment: "Coordinate with various departments and monitor various store setups and resets in region\nDevelop and execute various store rotation schedule for appropriate region\nManage and validate model store program for assign area\nDevelop and ensure compliance to budget for all merchandising process\nSupervise and ensure effectiveness of all merchant activities\nPrepare training and job orientation programs for all new merchants\n"
  },
  {
    value: 755,
    jobFunc: 30,
    text: "Motion Picture Set Worker",
    assessment: "Set up, install, and arrange film production equipment, including dollies, cranes, and booms\nFollow work order specifications\nInstall and maneuver props\nRig and dismantle set equipment, including scaffolding, platforms, and backdrops\nRaise and lower stage curtain\nRaise and lower scenery or props during theater performance\nCover props with canvas covers to protect them from weather\nLoad and unload set equipment\n"
  },
  {
    value: 756,
    jobFunc: 30,
    text: "Multimedia Services Manager",
    assessment: "liaising with account managers and technical staff on behalf of the client and, where applicable, ensuring clearance and copyright\nauthoring files into a single program\ntesting and adjusting final programs\nproducing finished design work and presenting final designs to clients\nobserving company policy in terms of producing and archiving product documentation, as well as any reports and recommendations\ngaining final sign-off from the client\nagreeing on the upgrading of the product or website with the client\n"
  },
  {
    value: 757,
    jobFunc: 30,
    text: "News Analyst",
    assessment: "Analyze and interpret news and information received from various sources in order to be able to broadcast the information\nEdit news material to ensure that it fits within available time or space\nExamine news items of local, national, and international significance in order to determine topics to address, or obtain assignments from editorial staff members\nGather information and develop perspectives about news subjects through research, interviews, observation, and experience\n"
  },
  {
    value: 758,
    jobFunc: 30,
    text: "Promotions Specialist",
    assessment: "Design all client promotions activities and prepare required proposals for all promotional collaterals and presentations in coordination with account executives and partner with team members to monitor all client need analysis\nPrepare all local paperwork and implement all processes and ensure compliance to all legal processes and prepare all required paperwork such as affidavits and insurance requirements and maintain all safety precautions\n"
  },
  {
    value: 759,
    jobFunc: 30,
    text: "Proofreader",
    assessment: "read copy and transcripts and check to make sure there are no spelling, grammatical or typographical errors\n They work for publishers, newspapers and other places that rely on perfect grammar in printing\n Typically, proofreaders will receive copy and note any changes that are needed for writers, typists or editors to change\n In some cases, proofreaders also make sure that pages are spaced correctly, so that copy is not cut off during the printing process\nProofreaders have to know different styles of grammar, depending on where they work, such as the Chicago Manual of Style\n The Elements of Style, or the AP Stylebook\n"
  },
  {
    value: 760,
    jobFunc: 30,
    text: "Radio Operator",
    assessment: "Operate radio equipment in order to communicate with ships, aircraft, mining crews, offshore oil rigs, logging camps and other remote operations\nTurn controls or throw switches in order to activate power, adjust voice volume and modulation, and set transmitters on specified frequencies\nBroadcast weather reports and warnings\nConduct periodic equipment inspections and routine tests in order to ensure that operations standards are met\n"
  },
  {
    value: 761,
    jobFunc: 30,
    text: "Recording Engineer",
    assessment: "Maintained recording machines and recordings in logbook\nMonitored dials and imperfections of recording machines\nOperated equipment to record, mix and edit sound\nMaintained sound and clarity of voice and instruments\nManaged audio consoles and handled equipment designed to produce special effects\nCombined echoes, speed up or slow down tempos and fine-tune voices\n"
  },
  {
    value: 762,
    jobFunc: 30,
    text: "Technical Producer",
    assessment: "raising funding\nreading, researching and assessing ideas and finished scripts\ncommissioning writers or securing the rights to novels, plays or screenplays\nbuilding and developing a network of contacts\nliaising and discussing projects with financial backers - projects can range from a small, corporate video costing £500 to a multimillion-pound-budget Hollywood feature film\nusing computer software packages for screenwriting, budgeting and scheduling;"
  },
  {
    value: 763,
    jobFunc: 30,
    text: "Telecommunications Technician",
    assessment: "Designed and built the Linux based Asterisk VOIP PBX which provides plug and play telephone service to all remote range sites and mobile units\nExplained subscribers about operation of the cable system\nIdentified, troubleshot and repaired common problems with telephone, cabling and voicemail equipment\n"
  },
  {
    value: 764,
    jobFunc: 30,
    text: "Television Announcer",
    assessment: "Prepare and deliver news, sports, and/or weather reports, gathering and rewriting material so that it will convey required information and fit specific time slots\n Read news flashes to inform audiences of important events\nIdentify stations, and introduce or close shows, using memorized or read scripts, and/or ad-libs\nSelect program content, in conjunction with producers and assistants, based on factors such as program specialties, audience tastes, or requests from the public\nStudy background information in order to prepare for programs or interviews\nComment on music and other matters, such as weather or traffic conditions\n"
  },
  {
    value: 765,
    jobFunc: 30,
    text: "Web Content Executive",
    assessment: "work with the site's content producers, determining the type, quality and quantity of content needed for the website\n They may assign projects, edit content and manage the employees who work with the website's content\n Other duties may include monitoring the site's statistics, such as user demographics, traffic flow and search engine placement\n"
  },
  {
    value: 766,
    jobFunc: 30,
    text: "Web Customer Support Specialist",
    assessment: "Supports Web-based products and services through email support, desktop support, and telephone support\n Interacts with customers and troubleshoots problems to provide a high level of customer satisfaction\n"
  },
  {
    value: 767,
    jobFunc: 30,
    text: "Web Product Manager",
    assessment: "Administered everyday activities of development process from conceptualization to implementation\nCoordinated with various teams and developed strategies and schedules for projects\nManaged life cycle implementation and customized projects as required\nPrepared functional requirements and specification for projects and ensured workflow\nAdministered project working and ensured timely delivery of projects\n"
  },
  {
    value: 768,
    jobFunc: 1,
    text: "Senior Web Administrator",
    assessment: "Manages the day-to-day operations of the PCC host computers by monitoring system performance, configuration, maintenance and repair\n Ensures that records of system downtime and equipment inventory are properly maintained\n Applies revisions to host system firmware and software\n Works with vendors to assist support activities\nDevelops new system and application implementation plans, custom scripts and testing procedures to ensure operational reliability\n Trains technical staff in how to use new software and hardware developed and/or acquired\nSupervises Operations staff including hiring, training, evaluating and disciplining\n May guide or provide work direction to technical staff, contract staff and/or student employees\n Determines appropriate coverage for all hours of operation\n"
  },
  {
    value: 769,
    jobFunc: 1,
    text: "Senior Security Specialist",
    assessment: "Protects system by defining access privileges, control structures, and resources\nRecognizes problems by identifying abnormalities; reporting violations\nImplements security improvements by assessing current situation; evaluating trends; anticipating requirements\nDetermines security violations and inefficiencies by conducting periodic audits\nUpgrades system by implementing and maintaining security controls\nKeeps users informed by preparing performance reports; communicating system status\nMaintains quality service by following organization standards\nMaintains technical knowledge by attending educational workshops; reviewing publications\nContributes to team effort by accomplishing related results as needed\n"
  },
  {
    value: 770,
    jobFunc: 1,
    text: "Senior System Designer",
    assessment: "Conduct software programming through established design standards\nOwn or share ownership of game content as per lead\nPrototype and iterate on core game mechanics and content\nBalance and adjust game-play experiences to ensure product’s critical and commercial success\n"
  },
  {
    value: 4937,
    jobFunc: 6,
    text: "Financial Manager",
    assessment: "Responsibilities\nPrepare and analyze financial reports, budgets, and forecasts to provide accurate and timely financial information to management\nManage relationships with external stakeholders, such as banks, auditors, and regulatory agencies\nRequirements\nBachelors degree in finance, accounting, or related field\n Masters degree or CPA certification preferred\nMinimum of 5 years of experience in financial management, preferably in a similar industry\nStrong knowledge of financial principles, practices, and regulations\nExcellent analytical and problem-solving skills\nProficiency in financial software and ERP systems\nAdvanced proficiency in Microsoft Excel\nProven ability to lead and manage a team\nStrong attention to detail and accuracy\n"
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
