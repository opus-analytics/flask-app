var username = document.getElementById("username").value;
const sendBtn = document.getElementById("send-button");
const loader = document.getElementById("loader-line");
const jobFamily_link = document.getElementById("job-family-list");
const job_list = document.getElementById("job-title-list");
const year_list = document.getElementById("years-of-experience");

// Reset Chart

window.onload = async () => {
  loader.style.display = "block";
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/get-salaries-family", {
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
};


jobFamily_link.addEventListener("change", async () => {
  loader.style.display = "block";
  const jobFamily = document.getElementById("job-family-list").value;
  const data = {
    jobFamily: jobFamily,
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
  const jobTitle = document.getElementById("job-title-list").value;
  const data = {
    jobTitle: jobTitle,
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

  if (!jobFamily || !jobTitle || !yearsOfExperience){
    loader.style.display = "none";
    return;
  }

  const dataResp = {
    familyJob: jobFamily,
    jobTitle: jobTitle,
    experience: yearsOfExperience,
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

    for (let i = 4; i < resp.length; i+=2){
      let high = parseFloat(resp[i].replace(/,/g, ''));
      let low = parseFloat(resp[i+1].replace(/,/g, ''));
      highSalary.push(high/12);
      lowSalary.push(low/12);
    }

    const data = {
      labels: ['2020', '2021', '2022', '2023', '2024'],
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
              text: 'Salary in EGP/month NET' 
            }
          }
        }
      }
    });
    
  loader.style.display = "none";
});
