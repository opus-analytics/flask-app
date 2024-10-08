const sendBtn = document.getElementById("send-button");
const loader = document.getElementById("loader-line");
const managersList = JSON.parse(document.getElementById("managers").value);
const selectElement = document.getElementById("managers-list");
const managersListView = document.getElementById("managersList")
const userAccess = document.getElementById("user-type")
var managerSelected = false;

if (managersList){
  managersList.forEach((competency) => {
    const option = document.createElement("option");
    option.value = competency.username;
    option.text = competency.full_name;
    selectElement.appendChild(option);
  });
}

loader.style.display = "none";
managersListView.style.display = "none";

userAccess.addEventListener("change",()=> {
  if(userAccess.value == 'Contributor'){
    managersListView.style.display= "block";
    managerSelected = true;
  }
  else{
    managersListView.style.display= "none";
    managerSelected = false;
  }
})

sendBtn.addEventListener("click", async () => {

  const email = document.getElementById("email").value;
  const fullName = document.getElementById("fullName").value

  if (email == "" || fullName == ""){
    userAcc.textContent = '';
    var text = document.createTextNode("Please enter an email!");
    userAcc.appendChild(text);
    return;
  }
  
  loader.style.display = "block";

  var userAcc = document.getElementById("userAcc");
  var managerToUser;
  if (managerSelected)
    managerToUser = selectElement.value
  else
    managerToUser = null

  const data = {
    username: email,
    fullname: fullName,
    userAccess: userAccess.value,
    manager: managerToUser
  };
  
  let resp;
  await fetch(window.location.protocol+ "//" + window.location.host + "/add-user", {
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
  
  loader.style.display = "none";
  console.log(resp)
  

  if(resp.success){
    userAcc.textContent = '';
    var text = document.createTextNode(resp.success);
    userAcc.appendChild(text);
  }
  else if(resp.error){
    userAcc.textContent = '';
    var text = document.createTextNode("Cannot create user, please check your data!");
    userAcc.appendChild(text);
  }
});
