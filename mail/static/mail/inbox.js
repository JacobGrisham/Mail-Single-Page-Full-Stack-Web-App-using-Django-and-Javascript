document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#send').addEventListener('click', send_email)

  // By default, load the inbox
  load_mailbox('inbox');

  // Style navigation. Add active class to clicked list item
  nav = document.querySelectorAll('.navigation')
  for (var i = 0; i < nav.length; i++) {
    nav[i].addEventListener("click", function() {
      var current = document.getElementsByClassName("active");
      current[0].className = current[0].className.replace(" active", "");
      this.className += " active";
    });
  }
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#list-tab').style.display = 'none';
  document.querySelector('#nav-tabContent').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email() {

  // send email
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error)
  })

  // Lastly, load user's sent mailbox
  load_mailbox('sent')
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#list-tab').style.display = 'block';
  document.querySelector('#nav-tabContent').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#list-tab').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch("emails/" + mailbox)
  .then(response => response.json())
  .then(emails => {

    const emailsView = document.querySelector('#list-tab');
    // Style email mailbox
    emailsView.classList.add("list-group");

    for (i = 0; i < emails.length; i++) {

      // Create container for each email within the mailbox
      var email = document.createElement('div');
      email.classList.add("list-group-item")

      // Style each email
      email.classList.add("email", "list-group-item", "list-group-item-action", "flex-column", "align-items-start", "border-secondary", "text-primary", "unread");

      // Create elements for each email datum and populate element with datum
      // Style content of each email
      var email_top_half = document.createElement('div')
      email_top_half.classList.add("d-flex", "w-100", "justify-content-between");
      var user = document.createElement('h4')
      if (mailbox == 'sent') {
        user.innerHTML = `To: ${emails[i].recipients}`;
      }
      else {
        user.innerHTML = `${emails[i].sender}`;
      }
      var body = document.createElement('p')
      body.innerHTML = `${emails[i].subject}`;
      var timestamp = document.createElement('small');
      timestamp.innerHTML = `${emails[i].timestamp}`;
      timestamp.classList.add("text-muted");

      // Styling for each emails that was read
      if (emails[i].read == true) {
        email.classList.add("list-group-item-secondary");
        user.classList.add("font-weight-normal");
        email.classList.remove("text-primary", "unread");
      }

      // Append email data to the each email within the mailbox view
      email_top_half.appendChild(user);
      email_top_half.appendChild(timestamp);
      email.appendChild(email_top_half);
      email.appendChild(body);

      // Load individual email and mark as read once user clicks on the email from the mailbox view
      // Use closure
      (function(index){
        email.addEventListener("click", () => {
          load_email(emails[index].id);
          mark_read(emails[index].id);
        })
      })(i)

      // Append each individual email to the mailbox
      emailsView.append(email);
    }
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  })
}

function load_email(email_id) {

  // Show the email and hide other views
  document.querySelector('#list-tab').style.display = 'block';
  document.querySelector('#nav-tabContent').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch("emails/" + email_id)
  .then(response => response.json())
  .then(email => {

    // Create container for each email thread
    email_thread = document.querySelector('#nav-tabContent');
    email_thread.classList.add("border", "border-primary", "rounded", "p-4");
    // Clear out email view of previous content
    email_thread.innerHTML = '';

    // Create elements for each email datum and populate element with datum
    var sender = document.createElement('h4');
    sender.innerHTML = `From: ${email.sender}`
    var recipients = document.createElement('h4');
    recipients.innerHTML = `To: ${email.recipients}`
    var timestamp = document.createElement('h5');
    timestamp.innerHTML = `Date: ${email.timestamp}`
    var subject = document.createElement('h5');
    subject.innerHTML = `Subject: ${email.subject}`
    var body = document.createElement('p');
    body.innerHTML = `${email.body}`

    // Create reply and archive buttons
    var reply_button = document.createElement('button');
    reply_button.classList.add("btn", "btn-outline-primary");
    reply_button.setAttribute("id", "reply");
    reply_button.innerHTML = "Reply";

    var archive_button = document.createElement('button');
    archive_button.classList.add("btn", "btn-outline-primary");
    archive_button.setAttribute("id", "archive");

    // Append email data to the email thread
    email_thread.appendChild(sender);
    email_thread.appendChild(recipients);
    email_thread.appendChild(timestamp);
    email_thread.appendChild(reply_button);
    email_thread.appendChild(archive_button);
    email_thread.appendChild(subject);
    email_thread.appendChild(body);
    
    // Archive logic within the email thread
    if (email.sender != document.querySelector("#user").innerHTML) {
      marked_archived = email.archived;
      archive_button = document.querySelector('#archive');
      // Set inital text of archive_button text
      marked_archived ? archive_button.innerHTML = "Unarchive" : archive_button.innerHTML = "Archive";
      // Allow user to archive and unarchive an email by clicking the archive button. Change text accordingly
      archive_button.addEventListener('click', () => {
        marked_archived ? archive(email_id, false) : archive(email_id, true);
      })

      // Allow user to reply to an email by clicking the reply button
      reply_button = document.querySelector('#reply');
      reply_button.addEventListener('click', () => {
        reply(email);
      })
    } else {
      archive_button.style.display = "none";
    }

  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  })
}


function mark_read(email_id) {

  // Mark emails as read
  fetch("emails/" + email_id, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  })
}

function archive(email_id, bool) {

  // Toggle emails between archived and unarchived
  fetch("emails/" + email_id, {
    method: "PUT",
    body: JSON.stringify({
      archived: bool
    })
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  })

  // Lastly, load user's inbox
  load_mailbox('inbox');
}

function reply(email) {

    // Show compose view and hide other views
    document.querySelector('#list-tab').style.display = 'none';
    document.querySelector('#nav-tabContent').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = email.sender;
    var subject = email.subject;
    var compose = document.querySelector('#compose-subject');
    subject.includes("RE:" || "Re:") ? compose.value = subject : compose.value = "Re: " + subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
}