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
  const competencyId = document.getElementById("competency-list").value;
  const email = document.getElementById("email").value;

  if (email == username){
    loader.style.display = "none";
    competency_link.textContent = "You cannot send an email to yourself!";
    competency_link.style.display = "block";
    return;
  }
  const data = {
    competencyId: competencyId,
    email: email,
  };
  
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/knowledge-graph-extra", {
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
  await fetch(window.location.protocol+ "//" + window.location.host + "/knowledge-graph-extra-getId", {
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
  competency_link.textContent = "Email successfully sent to the user!";
  competency_link.style.display = "block";
});
