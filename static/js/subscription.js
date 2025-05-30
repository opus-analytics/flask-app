var username = document.getElementById("username").value;
const sendBtn = document.getElementById("send-button");
const loader = document.getElementById("loader-line");
const subscription_id = document.getElementById("subscription_id").value;
const competency_link = document.getElementById("competency-link");
loader.style.display = "none";

sendBtn.addEventListener("click", async () => {
  loader.style.display = "block";
  const email = document.getElementById("email").value;

  const data = {
    email: email,
    subscription_id: subscription_id,
  };

  let resp;
  await fetch(
    window.location.protocol +
      "//" +
      window.location.host +
      "/assign-subscription",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
    .then((response) => {
      if (!response.ok) {
        // If the status code is not in the success range, reject the promise
        return response.json().then((errorData) => {
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${JSON.stringify(
              errorData
            )}`
          );
        });
      }
      return response.json(); // Only parse as JSON if the response is successful
    })
    .then((data) => {
      resp = data;
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
      resp = "error";
    });

  console.log("Response from server: ", resp);
  if (resp == "error") {
    loader.style.display = "none";
    competency_link.textContent = "An Error occurred, check the user email!";
    competency_link.style.display = "block";
    return;
  }

  loader.style.display = "none";
  competency_link.textContent = "Email successfully sent to the user!";
  competency_link.style.display = "block";
});
