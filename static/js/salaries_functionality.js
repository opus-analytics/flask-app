var username = document.getElementById("username").value;
const sendBtn = document.getElementById("send-button");
const loader = document.getElementById("loader-line");
const country_list = document.getElementById("country-list");
const jobFamily_link = document.getElementById("job-family-list");
const job_list = document.getElementById("job-title-list");
const year_list = document.getElementById("years-of-experience");

// Reset Chart

window.onload = async () => {
  loader.style.display = "block";
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/get-salaries-country", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      resp = data;
    });
  
    const selectElement = document.getElementById("country-list");

    // Create first option to be empty and disabled
    const option = document.createElement("option");
    option.value = "";
    option.text = "Select Job Country";
    option.disabled = true;
    option.selected = true;
    selectElement.appendChild(option);


  if (resp){
    resp.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.text = country;
      selectElement.appendChild(option);
    });
  }

  loader.style.display = "none";
};

country_list.addEventListener("change", async () => {
  loader.style.display = "block";
  const country = document.getElementById("country-list").value;
  const data = {
    countryName: country,
  };
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/get-salaries-family", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      resp = data;
    });
  
    const selectElement = document.getElementById("job-family-list");

    // Create first option to be empty and disabled
    const option = document.createElement("option");
    option.value = "";
    option.text = "Select Job Family";
    option.disabled = true;
    option.selected = true;
    selectElement.appendChild(option);


  if (resp){
    resp.forEach((family) => {
      const option = document.createElement("option");
      option.value = family;
      option.text = family;
      selectElement.appendChild(option);
    });
  }

  loader.style.display = "none";
});


jobFamily_link.addEventListener("change", async () => {
  loader.style.display = "block";
  const jobFamily = document.getElementById("job-family-list").value;
  const country = document.getElementById("country-list").value;
  const data = {
    jobFamily: jobFamily,
    countryName: country,
  };
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/get-salaries-jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      resp = data;
    });

    job_list.innerHTML = "";
    year_list.innerHTML = "";

    const selectElement = document.getElementById("job-title-list");

    // Create first option to be empty and disabled
    const option = document.createElement("option");
    option.value = "";
    option.text = "Select Job Title";
    option.disabled = true;
    option.selected = true;
    selectElement.appendChild(option);

    if (resp){
      resp.forEach((job) => {
        const option = document.createElement("option");
        option.value = job;
        option.text = job;
        selectElement.appendChild(option);
      });
    }

  loader.style.display = "none";
});

job_list.addEventListener("change", async () => {
  loader.style.display = "block";
  const jobFamily = document.getElementById("job-family-list").value;
  const jobTitle = document.getElementById("job-title-list").value;
  const country = document.getElementById("country-list").value;
  const data = {
    jobFamily: jobFamily,
    jobTitle: jobTitle,
    countryName: country,
  };
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/get-salaries-experience", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      resp = data;
    });

    year_list.innerHTML = "";
    const selectElement = document.getElementById("years-of-experience");

    // Create first option to be empty and disabled
    const option = document.createElement("option");
    option.value = "";
    option.text = "Select Years of Experience";
    option.disabled = true;
    option.selected = true;
    selectElement.appendChild(option);

    if (resp){
      resp.forEach((job) => {
        const option = document.createElement("option");
        option.value = job;
        option.text = job;
        selectElement.appendChild(option);
      });
    }

  loader.style.display = "none";
});




sendBtn.addEventListener("click", async () => {
  loader.style.display = "block";
  const jobFamily = document.getElementById("job-family-list").value;
  const jobTitle = document.getElementById("job-title-list").value;
  const yearsOfExperience = document.getElementById("years-of-experience").value;
  const country = document.getElementById("country-list").value;

  if (!jobFamily || !jobTitle || !yearsOfExperience || !country) {
    loader.style.display = "none";
    return;
  }

  const dataResp = {
    familyJob: jobFamily,
    jobTitle: jobTitle,
    experience: yearsOfExperience,
    countryName: country,
  };
  
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/get-salaries-chart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataResp),
  })
    .then((response) => response.json())
    .then((data) => {
      resp = data;
    });

    // Reset the chart for new data
    document.getElementById("myChart").remove();
    const canvas = document.createElement("canvas");
    canvas.id = "myChart";
    document.getElementById("chart-container").appendChild(canvas);

    let highSalary = [];
    let lowSalary = [];
    let labelsArray = [];

    let year = 2020;
    for (let i = 4; i < resp.length-2; i+=2){
      if (resp[i] == null || resp[i+1] == null){
        continue;
      }
      let high = parseFloat(resp[i].replace(/,/g, ''));
      let low = parseFloat(resp[i+1].replace(/,/g, ''));

      if(low != 0 && high != 0){
        labelsArray.push(year);
        if (country == "UAE"){
          highSalary.push(high);
          lowSalary.push(low);
        }
        else {
          highSalary.push(high/12);
          lowSalary.push(low/12);
        }
      }
      year++;
    }

    const data = {
      labels: labelsArray,
      datasets: [
      {
        label: 'Min Salary',
        data: lowSalary,
        backgroundColor: [
          'rgba(64, 64, 64, 0.2)',
        ],
        borderColor: [
          'rgba(64, 64, 64, 1)',
        ],
        borderWidth: 1
      },
      {
        label: 'Max Salary',
        data: highSalary,
        backgroundColor: [
          'rgba(181, 82, 159, 0.2)',
        ],
        borderColor: [
          'rgba(181, 82, 159, 1)',
        ],
        borderWidth: 1
      }]
    };

    let chartLabel = 'Salary in EGP/month NET' ;

    if (country == "Egypt"){
      chartLabel = 'Salary in EGP/month NET' ;
    } 
    else if (country == "UAE"){
      chartLabel = 'Salary in AED/month NET' ;
    }
    else if (country == "Saudi Arabia"){
      chartLabel = 'Salary in SAR/month Gross' ;
    }

    const ctx = document.getElementById('myChart').getContext('2d');
    const myChart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        scales: {
          // Add labels to the x-axis
          x: {
            title: {
              display: true,
              text: 'Years'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: chartLabel
            }
          }
        }
      }
    });
    
  loader.style.display = "none";
});
