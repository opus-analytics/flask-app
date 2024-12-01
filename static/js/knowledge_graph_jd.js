var username = document.getElementById("username").value;
const sendBtn = document.getElementById("send-button");
const loader = document.getElementById("loader-line");
const competency_link = document.getElementById("competency-link");

window.onload = async () => {
  loader.style.display = "none";
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/get-my-competency", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      resp = data;
    });
  const selectElement = document.getElementById("competency-list");
  if (resp){
    resp.forEach((competency) => {
      const option = document.createElement("option");
      option.value = competency.Id;
      option.text = competency.title;
      selectElement.appendChild(option);
    });
  }
};



sendBtn.addEventListener("click", async () => {
  loader.style.display = "block";
  competency_link.style.display = "none";

  const competencyId = document.getElementById("competency-list").value;

  const formData = new FormData();
  formData.append("user_id", competencyId);


  const fileInput = document.getElementById("file-input");
  if (fileInput.files && fileInput.files[0]) {
    formData.append("resume", fileInput.files[0]);
  } else {
    // Handle case where no file is selected (e.g., display an error message)
    console.error("Please select a resume file.");
    loader.style.display = "none";
    return;
  }

  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/analyze_jd_hamza", {
    method: "POST",
    body: formData
  })
    .then((response) => response.json())
    .then((data) => {
      resp = data;
    });

  console.log(resp.finalScore);

  loader.style.display = "none";
  competency_link.textContent = "Your score upon job description has been analyzed. And your score is: " + resp.finalScore;
  competency_link.style.display = "block";

  await fetch(window.location.protocol+ "//" + window.location.host + "/add-competency-resume-jd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ analysis_type: "Job Description", score: resp.finalScore , competencyId: competencyId}),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    });
});
