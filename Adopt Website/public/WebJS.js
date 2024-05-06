//Current date and time
function doDate()
{
    let str = "";

    let days = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
    let months = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");

    let now = new Date();

    str += "Today is: " + days[now.getDay()] + ", " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear() + " " + now.getHours() +":" + now.getMinutes() + ":" + now.getSeconds();
    document.getElementById("todaysDate").innerHTML = str;
}

setInterval(doDate, 1000);

//General validation for give away and finding pets
document.addEventListener("submit", searchFormHandler)
document.addEventListener("submit", loginHandler)
document.addEventListener("submit", createAccountHandler)
document.addEventListener("submit", petFormHandler)

// Login form handler
async function loginHandler(event) {
    if(event.target.id === 'loginForm'){
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/giveAway';
        } else {
            const errorMessage = await response.text();
            document.getElementById('message').textContent = errorMessage;
        }
    }
};

// Create Account form handler
async function createAccountHandler(event) {
    if(event.target.id === 'createAccountForm'){
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Check if the username and password satisfy the format criteria
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;

        if (!usernameRegex.test(username) || !passwordRegex.test(password)) {
            document.getElementById('message').textContent = 'Username or password format is invalid.';
            return;
        }

        // Send a POST request to the server to create the account
        const response = await fetch('/createAccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            document.getElementById('message').textContent = 'Account created successfully.';
        } else {
            const errorMessage = await response.text();
            document.getElementById('message').textContent = errorMessage;
        }
    }
};

// Pet Submission handler
async function petFormHandler(event) {
    if (event.target.id === 'giveAwayForm') {
        if(!validation(event)) return;
        event.preventDefault();

        const animalType = document.querySelector('input[name="animal_type"]:checked');
        const animalBreed = document.getElementById('animal_breed').value;
        const animalAge = document.getElementById('animal_age').value;
        const animalGender = document.querySelector('input[name="animal_gender"]:checked');
        const checkboxes = document.querySelectorAll('input[name="behaviour"]');
        const behaviours = [];
        checkboxes.forEach(checkbox => {
            behaviours.push({
                value: checkbox.value,
                checked: checkbox.checked
            });
        });

        const ownerName = document.getElementById('owner_name').value;
        const ownerEmail = document.getElementById('owner_email').value;

        const data = {
            animal_type: animalType ? animalType.value : null,
            animal_breed: animalBreed,
            animal_age: animalAge,
            animal_gender: animalGender ? animalGender.value : null,
            behaviours: behaviours,
            owner_name: ownerName,
            owner_email: ownerEmail
        };

        try {
            const response = await fetch('/submitPetInfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const responseData = await response.text();
                alert(responseData); // Show success message
                document.getElementById('giveAwayForm').reset(); // Clear the form
            } else {
                throw new Error('Error submitting pet information');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// Handler for searching the database
async function searchFormHandler(event) {
    if(event.target.id === 'searchForm') {
        if(!findFormValidation(event, true)) {
            return;
        }
        event.preventDefault();
        
        const animalType = document.querySelector('input[name="animal_type"]:checked');
        const animalBreed = document.getElementById('animal_breed').value;
        const animalAge = document.getElementById('animal_age').value;
        const animalGender = document.querySelector('input[name="animal_gender"]:checked');
        const checkboxes = document.querySelectorAll('input[name="behaviour"]');
        const behaviours = [];
        checkboxes.forEach(checkbox => {
            behaviours.push({
                value: checkbox.value,
                checked: checkbox.checked
            });
        });

        const data = {
            animal_type: animalType ? animalType.value : null,
            animal_breed: animalBreed,
            animal_age: animalAge,
            animal_gender: animalGender ? animalGender.value : null,
            behaviours: behaviours
        };
        
        try {
            const response = await fetch("/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const matchingRecords = await response.json();
                displayMatchingRecords(matchingRecords);
            } else {
                throw new Error("Error searching for records");
            }
        } catch (error) {
            console.error("Error:", error.message);
        }
    }
}

// Displays the matching records and redirects to matchingRecords.ejs
function displayMatchingRecords(records) {
    // Store records data in session storage
    sessionStorage.setItem('matchingRecords', JSON.stringify(records));
    
    // Redirect to matchingRecords.ejs
    window.location.href = "/matchingRecords";
}

// Check if the current page is matchingRecords.ejs
if (window.location.pathname === "/matchingRecords") {
    // Retrieve records data from session storage
    const matchingRecords = JSON.parse(sessionStorage.getItem('matchingRecords'));

    // Display matching records
    if (matchingRecords && matchingRecords.length) {
        const matchingRecordsSection = document.getElementById("matchingRecords");

        // Clear previous search results
        matchingRecordsSection.innerHTML = "";

        // Iterate through each matching record and create HTML elements to display them
        matchingRecords.forEach(function (record) {
            const recordElement = document.createElement("div");
            recordElement.classList.add("record");

            const typeElement = document.createElement("p");
            typeElement.textContent = "Type: " + record.type;
            recordElement.appendChild(typeElement);

            const breedElement = document.createElement("p");
            breedElement.textContent = "Breed: " + record.breed;
            recordElement.appendChild(breedElement);

            const ageElement = document.createElement("p");
            ageElement.textContent = "Age: " + record.age;
            recordElement.appendChild(ageElement);

            const genderElement = document.createElement("p");
            genderElement.textContent = "Gender: " + record.gender;
            recordElement.appendChild(genderElement);

            const ownerNameElement = document.createElement("p");
            ownerNameElement.textContent = "Owner Name: " + record.owner_name;
            recordElement.appendChild(ownerNameElement);

            const ownerEmailElement = document.createElement("p");
            ownerEmailElement.textContent = "Owner Email: " + record.owner_email;
            recordElement.appendChild(ownerEmailElement);

            // Append the record element to the matching records section
            matchingRecordsSection.appendChild(recordElement);
        });
    } else {
        // No matching records found, display a message
        alert("No matches were found.");
    }
}

function findFormValidation(event, value){
    if(event.target.id == 'loginForm' || event.target.id === 'createAccountForm') return;

    if(event.target.id === 'searchForm' || value === true){
        event.preventDefault();

        let animalType = document.getElementsByName("animal_type");
        let animalBreed = document.getElementById("animal_breed").value;
        let animalAge = document.getElementById("animal_age").value;
        let animalGender = document.getElementsByName("animal_gender");

        let flag1 = false;
        for(let i=0; i<animalType.length; i++){
            if(animalType[i].checked) {
                flag1 = !flag1;
            }
        }
        if(!flag1) {
            alert("Please select an option for animal type.");
            event.preventDefault();
            return false;
        }

        if(animalBreed == "invalid"){
            alert("Please select an option for breed.");
            event.preventDefault();
            return false;
        }
        if(animalAge == "invalid"){
            alert("Please select an option for age.");
            event.preventDefault();
            return false;
        }

        let flag2 = false;
        for(let i=0; i<animalGender.length; i++){
            if(animalGender[i].checked) flag2 = !flag2;
        }
        if(!flag2) {
            alert("Please select an option for animal gender.");
            event.preventDefault();
            return false;
        }
    }
    return true;
}

function validation(event){
    if(event.target.id === 'loginForm' || event.target.id === 'createAccountForm') return;

    if(!findFormValidation(event, true)) return false;
    event.preventDefault();

    //Text validation for pet giveaway
    let ownerName = document.getElementById("owner_name").value;
    let ownerEmail = document.getElementById("owner_email").value;

    if(ownerName.search(/^[A-Za-z\s]+$/)<0){
        alert("Please type in a valid name.");
        event.preventDefault();
        return false;
    }
    
    let regex = /[-A-Za-z0-9!#$%&'*+\/=?^_`{|}~]+(?:\.[-A-Za-z0-9!#$%&'*+\/=?^_`{|}~]+)*@(?:[A-Za-z0-9](?:[-A-Za-z0-9]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[-A-Za-z0-9]*[A-Za-z0-9])?/i;
    if(ownerEmail.search(regex)<0){
        alert("Please type in a valid email.");
        event.preventDefault();
        return false;
    }

    return true;
}