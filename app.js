const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const multer = require('multer');
const dotenv = require('dotenv');
const path = require("path");
const fs = require('fs');
const User = require("./models/User");
const Game = require("./models/Game");
const UserGame = require("./models/UserGame");
const Message = require("./models/Message");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const upload = multer({ dest: 'uploads/' });
dotenv.config();

//Commect to database
mongoose.connect(process.env.DB_CONNECTION_STRING)
        .then(() => console.log("Connected to MongoDB"))
        .catch((err) => {
            console.log("Error connecting to MongoDB:", err);
            process.exit(1);
        });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

//Check Token
function verifyToken(req, res, next) {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
        return res.status(403).send("Access Denied: No token provided");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("JWT Error:", err);
            return res
                .status(403)
                .send("Access Denied: Invalid or expired token");
        }
        req.user = user;
        next();
    });
}

app.get('/image/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await User.findById(userId);
        if (!user || !user.profilePicture || !user.profilePicture.data) {
            return res.status(404).json({ message: "Profile picture not found" });
        }

        res.set('Content-Type', user.profilePicture.contentType);
        res.send(user.profilePicture.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching profile picture" });
    }
});

app.get('/game-cover/:gameId', async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId);
        if (!game || !game.cover || !game.cover.data) {
            return res.status(404).json({ message: "Cover image not found" });
        }

        res.set('Content-Type', game.cover.contentType);
        res.send(game.cover.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching game cover" });
    }
});


io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('join', async (gameId) => {
        //Join room
        socket.join(gameId);
        //Fetch old messages
        try {
            /* const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); */
            const messages = await Message.find({
                gameId,
                /* timestamp: { $gte: oneWeekAgo } */
            }).sort({ timestamp: -1 }).exec();
            socket.emit('previousMessages', messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    });
    //Send message
    socket.on('sendMessage', async ({ gameId, sender, message }) => {
        const newMessage = new Message({
            sender,
            message,
            gameId,
            timestamp: new Date()
        });

        try {
            await newMessage.save();
            io.to(gameId).emit('newMessage', newMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.get("/", (req, res) => {
    res.redirect("/login");
});
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find the user
        const user = await User.findOne({ username }).exec();
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Generate token
            const token = jwt.sign(
                                { username: user.username, id: user._id },
                                process.env.JWT_SECRET,
                                { expiresIn: "1h" }
                            );
            return res.status(200).json({ message: "Login successful", token });
        } else {
            return res.status(400).json({ message: "Invalid username or password" });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});
app.post("/register", async (req, res) => {
    const { username, password, description } = req.body;

    try {
        // Check if the username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send("Username already exists");
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create a new user
        const newUser = new User({
            username,
            password: hashedPassword,
            description,
        });
        // Save the new user
        await newUser.save();

        res.status(201).send("User registered successfully");
    } catch (err) {
        res.status(500).send("Error registering user");
    }
});

app.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id }).exec();
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.status(200).json({
            username: user.username,
            description: user.description,
            profilePicture: user.profilePicture,
            userId: user._id,
            games: await Game.find({ addedBy: user._id }),
        });
    } catch (err) {
        res.status(500).send("Error fetching profile data");
    }
});

app.get("/settings", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const responseData = {
            username: user.username,
            description: user.description,
        };

        res.json(responseData);
    } catch (error) {
        console.error("Error fetching user settings:", error);
        res.status(500).json({ message: "Error fetching user settings" });
    }
});

app.post("/settings/update", verifyToken, upload.single('picture'), async (req, res) => {
    const { username, description } = req.body;
    const profilePicture = req.file;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        //Update info
        if (username) {
            user.username = username;
        }
        if (description) {
            user.description = description;
        }
        if (profilePicture) {
            const imageBuffer = fs.readFileSync(profilePicture.path);
            user.profilePicture = {
                data: imageBuffer,
                contentType: profilePicture.mimetype,
            };
            fs.unlinkSync(profilePicture.path);
        }

        await user.save();
        //Regenerate Token
        const newToken = jwt.sign(
                            { username: user.username, id: user._id },
                            process.env.JWT_SECRET,
                            { expiresIn: "1h" }
                        );

        res.status(200).json({ message: "Profile updated successfully!", token: newToken });
    } catch (err) {
        res.status(500).json({ message: "Error updating profile" });
    }
});

app.delete("/settings/delete-account", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        //Delete user-game relations from DB
        await UserGame.deleteMany({ user: req.user.id });
        //Delete user from DB
        await User.findByIdAndDelete(user._id);

        res.status(200).json({ message: "Account deleted successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting account" });
    }
});

app.post("/create-game", verifyToken, upload.single('cover'), async (req, res) => {
    const { name, genre, releaseDate, description } = req.body;
    const coverFile = req.file;

    try {
        if (!coverFile) {
            return res.status(400).json({ message: 'Cover image is required' });
        }
        
        const imageBuffer = fs.readFileSync(coverFile.path);


        const newGame = new Game({
            name,
            cover: {
                data: imageBuffer, 
                contentType: coverFile.mimetype,
            },
            genre,
            releaseDate,
            description,
            addedBy: req.user.id,
        });

        fs.unlinkSync(coverFile.path);

        await newGame.save();
        res.status(200).json({ message: "Game added successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding game to the database" });
    }  
});

app.get('/user-added', verifyToken, async (req, res) => {
    try {
        //Find all games added by user and replace game reference with the actual object
        const userGames = await UserGame.find({ user: req.user.id }).populate('game');
        res.json(userGames);
    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/user-games", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        //Find all games added by user and replace game reference with the actual object
        const userGames = await UserGame.find({ user: req.user.id }).populate("game");

        const playedGames = userGames.filter((userGame) => userGame.played);
        const wantToPlayGames = userGames.filter((userGame) => userGame.wantToPlay);
        //Send game lists
        const responseData = {
            username: user.username,
            description: user.description,
            playedGames: playedGames.map((userGame) => ({
                name: userGame.game.name,
                cover: userGame.game.cover,
                genre: userGame.game.genre,
                releaseDate: userGame.game.releaseDate,
                rating: userGame.rating,
                gameId: userGame.game._id,
            })),
            wantToPlayGames: wantToPlayGames.map((userGame) => ({
                name: userGame.game.name,
                cover: userGame.game.cover,
                genre: userGame.game.genre,
                releaseDate: userGame.game.releaseDate,
                gameId: userGame.game._id,
            })),
        };

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching user games" });
    }
});

app.post("/user-games", verifyToken, async (req, res) => {
    const { gameId, status } = req.body;

    try {

        let userGame = await UserGame.findOne({ user: req.user.id, game: gameId });
        //Create new user-game
        if (!userGame) {
            userGame = new UserGame({
                user: req.user.id,
                game: gameId,
                played: status === "played",
                wantToPlay: status === "to-play",
                rating: 1,
            });
            await userGame.save();
            return res
                .status(200)
                .json({ message: `Game added as ${status}!` });
        } else {
            //Change existing flags
            if (status === "played") {
                userGame.played = true;
                userGame.wantToPlay = false;
            } else if (status === "to-play") {
                userGame.wantToPlay = true;
                userGame.played = false;
            }
        }

        await userGame.save();
        res.status(200).json({ message: `Game status updated to ${status}!` });
    } catch (error) {
        console.error("Error in /user-games:", error);
        res.status(500).json({ message: "Error processing request" });
    }
});

app.put("/user-games/:gameId/rating", verifyToken, async (req, res) => {
    const { gameId } = req.params;
    const { rating } = req.body;

    try {
        const userGame = await UserGame.findOne({ user: req.user.id, game: gameId });
        if (!userGame) {
            return res
                .status(404)
                .json({ message: "Game not found in user list" });
        }

        userGame.rating = rating;
        await userGame.save();

        res.status(200).json({ message: "Rating updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating rating" });
    }
});

app.delete("/user-games/:gameId", verifyToken, async (req, res) => {
    const { gameId } = req.params;
    try {
        const result = await UserGame.deleteOne({ user: req.user.id, game: gameId });
        if (result.deletedCount === 0) {
            return res
                .status(404)
                .json({ message: "Game not found in user list" });
        }

        res.status(200).json({ message: "Game removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error removing game" });
    }
});

app.put("/user-games/:gameId/mark-played", verifyToken, async (req, res) => {
    const { gameId } = req.params;
    try {
        let userGame = await UserGame.findOne({ user: req.user.id, game: gameId });
        if (!userGame) {
            return res
                .status(404)
                .json({ message: "Game not found in user list" });
        }
        userGame.played = true;
        userGame.wantToPlay = false;
        await userGame.save();

        res.status(200).json({
            message: "Game marked as played and moved to played list",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error marking game as played" });
    }
});

app.get("/games", verifyToken, async (req, res) => {
    try {
        const { query, page = 1, limit = 10, sort = 'name_asc' } = req.query;
        const skip = (page - 1) * limit;

        let sortOption;
        switch (sort) {
            case 'name_desc':
                sortOption = { name: -1 };
                break;
            case 'release_date_asc':
                sortOption = { releaseDate: 1 };
                break;
            case 'release_date_desc':
                sortOption = { releaseDate: -1 };
                break;
            default:
                sortOption = { name: 1 };
                break;
        }

        const games = await Game.find(query ? { name: { $regex: query, $options: 'i' } } : {})
                                .skip(skip)
                                .limit(Number(limit))
                                .sort(sortOption);

        const totalGames = await Game.countDocuments(query ? { name: { $regex: query, $options: 'i' } } : {});

        res.json({
            games,
            totalGames
        });
    } catch (err) {
        res.status(500).send("Error fetching games");
    }
});

app.get('/game/:gameId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.get("/game-info/:id", async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }
        res.json(game);
    } catch (err) {
        console.error("Error fetching game details:", err);
        res.status(500).send("Error fetching game details");
    }
});

http.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
