const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const PORT = 5250;

const loginFilePath = path.join(__dirname, 'data/login.txt');
const petsFilePath = path.join(__dirname, 'data/pets.txt');

// Set up view engine and static files
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: 'key', 
    resave: false,
    saveUninitialized: false
}));



// Define routes dynamically
const routes = [
    { path: '/', page: 'home' },
    { path: '/find', page: 'find' },
    { path: '/dogCare', page: 'dogCare' },
    { path: '/catCare', page: 'catCare' },
    { path: '/createAccount', page: 'createAccount'},
    { path: '/login', page: 'login'},
    { path: '/matchingRecords', page: 'matchingRecords'},
    { path: '/contact', page: 'contact' }
];

routes.forEach(route => {
    app.get(route.path, (req, res) => {
        res.render(route.page, { currentPage: route.page });
    });
});

// Endpoint to handle account creation
app.post('/createAccount', (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists in the login file
    fs.readFile(loginFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        const lines = data.split('\n');
        const existingUser = lines.some(line => {
            const [storedUsername] = line.split(':');
            return username === storedUsername;
        });

        if (existingUser) {
            res.status(400).send('Username already exists. Please choose another one.');
            return;
        }

        // Write the new username and password to the login file
        const newUser = `${username}:${password}\n`;
        fs.appendFile(loginFilePath, newUser, 'utf8', err => {
            if (err) {
                console.error(err);
                res.status(500).send('Internal Server Error');
                return;
            }

            req.session.username = username;
            res.status(200).send('Account created successfully.');
        });
    });
});

// Endpoint for account login validation
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Read login file
    fs.readFile(loginFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Check if login pair exists
        const lines = data.split('\n');
        const validUser = lines.some(line => {
            const [storedUsername, storedPassword] = line.split(':');
            return username === storedUsername && password === storedPassword;
        });

        if (validUser) {
            // Start a new session
            req.session.username = username;
            res.status(200).send('Successful login');
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

// Check for active session before allowing giveAway page to pop up
app.get('/giveAway', (req, res) => {
    if(!req.session.username) {
        res.redirect('/login');
        return;
    }
    res.render(path.join(__dirname, 'views', 'giveAway.ejs'), { currentPage: 'giveAway' });
});

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.username) {
        // User is authenticated, proceed to the next middleware or route handler
        next();
    } else {
        // User is not authenticated, redirect to login page
        res.redirect('/login');
    }
};

// Render the logout page only if the user is authenticated
app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render(path.join(__dirname, 'views', 'logout.ejs'), { currentPage: 'logout' });
    });
});

// Endpoint to handle form submissions and add pet information to file
app.post('/submitPetInfo', async (req, res) => {
    const { animal_type, animal_breed, animal_age, animal_gender, behaviours, owner_name, owner_email } = req.body;

    // Filter out unchecked behaviours
    const checkedBehaviours = behaviours.filter(behaviour => behaviour.checked);

    // Extract only the values of checked behaviours
    const checkedBehaviourValues = checkedBehaviours.map(behaviour => behaviour.value);

    // Construct the behaviour string
    const behaviourString = checkedBehaviourValues.join(',');

    try {
        // Read the pet information file synchronously
        const data = fs.readFileSync(petsFilePath, 'utf8');

        // Parse the existing pet data
        let pets = [];
        if (data) {
            pets = data.split('\n').map(entry => entry.trim());
        }

        console.log(pets);
        // Generate a unique ID for the new pet entry
        const petId = pets.length === 0 ? 1 : pets.length;

        // Construct the new pet entry
        const newPetEntry = `${petId}:${req.session.username}:${animal_type}:${animal_breed}:${animal_age}:${behaviourString}:${animal_gender}:${owner_name}:${owner_email}`;

        // Write the new pet entry to the file
        fs.appendFileSync(petsFilePath, `${newPetEntry}\n`);

        res.send('Pet information added successfully.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/search", function (req, res) {
    // Get search criteria from request body
    const { animal_type, animal_breed, animal_age, animal_gender, behaviours } = req.body;

     // Filter out unchecked behaviours
     const checkedBehaviours = behaviours.filter(behaviour => behaviour.checked);

     // Extract only the values of checked behaviours
     const checkedBehaviourValues = checkedBehaviours.map(behaviour => behaviour.value);
 
     // Construct the behaviour string
     const behaviourString = checkedBehaviourValues.join(',');

    // Read the data file
    fs.readFile(petsFilePath, "utf8", function (err, data) {
        if (err) {
            console.error("Error reading data file:", err);
            return res.status(500).send("Internal Server Error");
        }
        
        try {
            // Parse the data file and filter records based on the search criteria
            const matchingRecords = data
            .split("\n") // Split data into lines
            .filter(line => line.trim() !== '') // Remove empty lines
            .map(line => {
                const fields = line.split(":").map(field => field.trim()); // Trim whitespace from field values
                if (fields.length === 9) {
                    return {
                        id: fields[0] || '', // Assign empty string if ID is missing
                        username: fields[1] || '', // Assign empty string if username is missing
                        type: fields[2] || '', // Assign empty string if type is missing
                        breed: fields[3] || '', // Assign empty string if breed is missing
                        age: fields[4] || '', // Assign empty string if age is missing
                        behaviour: fields[5] || '', // Assign empty string if behaviour is missing
                        gender: fields[6] || '', // Assign empty string if gender is missing
                        owner_name: fields[7] || '', // Assign empty string if owner_name is missing
                        owner_email: fields[8] || '' // Assign empty string if owner_email is missing
                    };
                } else {
                    return null; // Skip record if number of fields is incorrect
                }
            })
            .filter(record => {
                console.log(record);
                // Check if the record matches the search criteria
                return (
                    (!animal_type || record.type === animal_type) &&
                    (!animal_breed || record.breed === animal_breed) &&
                    (!animal_age || record.age === animal_age) &&
                    (!animal_gender || record.gender === animal_gender) &&
                    (!behaviours.length || record.behaviour === behaviourString)
                );
            })
            .filter(record => record !== null); // Filter out null records

            // Send the matching records back to the client
            res.json(matchingRecords);
        } catch (error) {
            console.error("Error parsing data or filtering records:", error);
            return res.status(500).send("Error searching for records");
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
