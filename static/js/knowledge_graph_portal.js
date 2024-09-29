var username = document.getElementById("username").value;
const sendBtn = document.getElementById("send-button");
const loader = document.getElementById("loader-line");
const competency_link = document.getElementById("competency-link");

window.onload = async () => {
  loader.style.display = "none";
  let resp;
  await fetch("https://opus-app.azurewebsites.net/get-my-competency", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://opusanalytics.ai/"

    },
    body: JSON.stringify({ username: username }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      resp = data;
    });
  const selectElement = document.getElementById("competency-list");
  resp.forEach((competency) => {
    const option = document.createElement("option");
    option.value = competency.Id;
    option.text = competency.title;
    selectElement.appendChild(option);
  });
};



sendBtn.addEventListener("click", async () => {
  loader.style.display = "block";
  const competencyId = document.getElementById("competency-list").value;
  const email = document.getElementById("email").value;
  const data = {
    competencyId: competencyId,
    email: email,
  };
  
  let resp;
  await fetch("https://opus-app.azurewebsites.net/knowledge-graph-extra", {
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

    const data2 = {
      Id: resp.inserted_id
    }

    let resp2;
  await fetch("https://opus-app.azurewebsites.net/knowledge-graph-extra-getId", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data2),
  })
    .then((response) => response.json())
    .then((data) => {
      resp2 = data;
    });

  loader.style.display = "none";
  competency_link.href = "https://opus-app.azurewebsites.net/knowledge-graph-manager/" + resp2.token;
  competency_link.style.display = "block";
  competency_link.innerHTML = "Click here to get the link of your competency assessment";

  // copy to clipboard
  competency_link.addEventListener("click", (event) => {
    event.preventDefault();
    navigator.clipboard.writeText(competency_link.href);
    competency_link.innerHTML = "Link copied to clipboard!";
  });

});
