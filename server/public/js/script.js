$(document).ready(() => {
  $("footer .container-md span").html(`&copy; ${new Date().getFullYear()}`);
});

$(document).ready(() => {
  $("#post").submit(async (event) => {
    event.preventDefault();

    let formData = new FormData();

    const author = $("#author").val();
    const displayName = $("#user").html() || "user";
    const description = $("#description").val();
    const photo = $("#photo")[0].files[0];

    if (!description) {
      $("#alert").append(
        `<div class="alert alert-danger text-center">Aggiungere una descrizione.</div>`
      );
      return;
    }

    formData.append("author", author);
    formData.append("displayName", displayName);
    formData.append("description", description);
    formData.append("photo", photo);

    await fetch("http://localhost:8080/api/v1/post", {
      method: "POST",
      body: formData,
      headers: { Accepts: "application/json" },
    })
      .then((result) => result.json())
      .then((result) => {
        setTimeout(() => {
          location.reload();
        }, 1000);
      })
      .catch((err) => console.error(err.message));
  });
});
