const sendBtn = document.getElementById("send-button");
const loader = document.getElementById("loader-line");

loader.style.display = "none";

sendBtn.addEventListener("click", async () => {

  loader.style.display = "block";
  const email = document.getElementById("email").value;
  const fullName = document.getElementById("fullName").value
  const userAccess = document.getElementById("user-type").value

  var userAcc = document.getElementById("userAcc");
  
  const data = {
    username: email,
    fullname: fullName,
    userAccess: userAccess
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
    var text = document.createTextNode(resp.success);
    userAcc.appendChild(text);
  }
  else if(resp.error){
    var text = document.createTextNode("Cannot create user, please check your data!");
    userAcc.appendChild(text);
  }
});
