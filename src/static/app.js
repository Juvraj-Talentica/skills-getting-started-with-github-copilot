document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderParticipants(activityName, participants) {
    if (!participants.length) {
      return '<p class="participants-empty">No participants yet</p>';
    }

    const participantItems = participants
      .map((participant) => {
        const escapedParticipant = escapeHtml(participant);
        const encodedActivity = encodeURIComponent(activityName);
        const encodedEmail = encodeURIComponent(participant);

        return `
          <li class="participant-item">
            <span class="participant-email">${escapedParticipant}</span>
            <button
              type="button"
              class="participant-delete"
              data-activity="${encodedActivity}"
              data-email="${encodedEmail}"
              aria-label="Remove ${escapedParticipant}"
              title="Unregister participant"
            >
              🗑️
            </button>
          </li>
        `;
      })
      .join("");

    return `<ul class="participants-list">${participantItems}</ul>`;
  }

  async function unregisterParticipant(activity, email) {
    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (response.ok) {
      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      await fetchActivities();
    } else {
      messageDiv.textContent = result.detail || "Failed to unregister participant";
      messageDiv.className = "error";
    }

    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = renderParticipants(name, details.participants);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants:</strong></p>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");
    if (!deleteButton) {
      return;
    }

    const activity = decodeURIComponent(deleteButton.dataset.activity || "");
    const email = decodeURIComponent(deleteButton.dataset.email || "");

    if (!activity || !email) {
      messageDiv.textContent = "Unable to unregister participant";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      await unregisterParticipant(activity, email);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
