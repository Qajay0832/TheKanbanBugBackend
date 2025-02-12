import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import Signup from "./SignupModal.js"
import bcrypt from "bcrypt"
import base64 from "base-64"
import dotenv from "dotenv"
dotenv.config();


const app = express()
app.use(express.json())
app.use(cors())
const DB_User=process.env.DB_User
const DB_key=process.env.key



mongoose.connect(`mongodb+srv://${DB_User}:${DB_key}@cluster0.u7kjr.mongodb.net/prodiolabs?retryWrites=true&w=majority&appName=Cluster0`)
    .then(response => {
        console.log('db is connected')
    })
    .catch(err => {
        console.log('error while connecting to db', err.message);
    })


app.post('/signup', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        const existingUser = await Signup.findOne({ username });
        if (existingUser) {
            return res.send(400, "User already exists !")
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const signUpData = new Signup(
            { name, username, password: hashedPassword }
        )
        signUpData.save().then(response => {
            console.log("saved to db");
            return res.send(200, "user successfully created!")
        })
            .catch((error) => {
                console.log("failed to save user in DB", error);
                return res.send(500, 'failed to save user in DB!')
            })
    }
    catch (err) {
        console.log(err);
        return res.send(500, "Internal server error ! Please try after some time !")
    }

})

app.post('/login', async (req, res) => {

    try {
        const { username, password } = req.body;
        const existingUser = await Signup.findOne({ username });
        if (!existingUser) {
            return res.send(400, "User does not exists ! Please try Signup !")
        }
        const passwordMatch = await bcrypt.compare(password, existingUser.password);
        if (passwordMatch) {
            const token = base64.encode(`${username}:${password}`)  //generaTING a random token based on username and password 
            //only token is send to front end not password
            //we will pass this token with our api call which will show which user is modifying data 
            return res.status(200).json({ status: "Success", message: "User Logged In successfully", token: token })
        }
        else {
            return res.send(400, 'Incorrect Password')
        }
    }
    catch (err) {
        console.log(err);
        return res.send(500, "Internal server error ! Please try after some time !")
    }
})
app.post('/createtodo', async (req, res) => {
    try {
        const { token, todo } = req.body
        if (!token) {
            return res.send(400, "User Must Be Logged In!")
        }
        const decodedtoken = base64.decode(token).split(":")
        const username = decodedtoken[0]
        try {
            const AddingTodo = await Signup.findOneAndUpdate({ username },
                {
                    $push: {
                        'todolist.todo': todo // Add new todo item to the "todo" list
                    }
                },
                { new: true }
            );
            if (AddingTodo) {
                try {
                    const findtodo = await Signup.findOne(
                        { username: username }
                    )
                    if (findtodo) {
                        return res.status(200).send(findtodo.todolist)
                    }
                    else {
                        return res.status(400).send("item not found")
                    }
                }
                catch (error) {
                    return res.status(400).send("item not Working")

                }

            }
        }
        catch (error) {
            console.log(error)
            return res.send(400, "Error While Adding Todo")
        }
    }
    catch (error) {
        console.log(error)
        return res.send(500, "Server issue please try after some time !")
    }
})

app.get('/todo', async (req, res) => {
    try {

        const { token } = req.headers

        if (!token) {
            return res.send(400, "User Must Be Logged In!")

        }
        const username = base64.decode(token).split(":")[0]
        try {
            const existingUser = await Signup.findOne({ username });
            if (!existingUser) {
                return res.send(400, "User does not exists ! Please try Signup !")
            }
            return res.status(200).send({ todolist: existingUser.todolist })
        }
        catch (error) {
            console.log(error)
            return res.send(400, "Error while finding user !")
        }
    }
    catch (error) {
        console.log(error)
        return res.send(500, "Server issue please try after some time !")
    }


})

app.delete("/todo", async (req, res) => {
    try {
        const { token, id, status } = req.headers

        if (!token) {
            return res.send(400, "User Must Be Logged In!")

        }
        const username = base64.decode(token).split(":")[0]
        try {
            const existingUser = await Signup.findOne({ username });
            if (!existingUser) {
                return res.send(400, "User does not exists ! Please try Signup !")
            }
            const updatedUser = await Signup.updateOne(
                { username }, // Find the user
                {
                    $pull: {
                        // Pull the specific item from the 'todo' array
                        [`todolist.${status}`]: { _id: id }
                    }
                }
            );
            if (updatedUser) {
                try {
                    const findtodo = await Signup.findOne(
                        { username: username }
                    )
                    if (findtodo) {
                        return res.status(200).send(findtodo.todolist)
                    }
                    else {
                        return res.status(400).send("item not found")
                    }
                }
                catch (error) {
                    return res.status(400).send("item not Working")

                }
            }
        }
        catch (error) {
            console.log(error)
            return res.send(400, "Error while deleting todo !")
        }
    }
    catch (error) {
        console.log(error)
        return res.send(500, "Server issue please try after some time !")
    }

})


app.post('/shift', async (req, res) => {
    try {
        const { token, id, status } = req.body
        // console.log(token,id,status);
        // return res.send(200,"hello")


        if (!token) {
            return res.send(400, "User Must Be Logged In!")

        }
        const username = base64.decode(token).split(":")[0]
        try {
            const existingUser = await Signup.findOne({ username });
            if (!existingUser) {
                return res.send(400, "User does not exists ! Please try Signup !")
            }
            const findUser = await Signup.findOne(
                { username }, // Find the user by username
            );
            try {
                let todoItem = findUser.todolist[status].find((todoItem) => todoItem._id == id)
                todoItem.status = status == 'todo' ? 'inProgress' : 'completed'
                try {
                    const findAndMove = await Signup.updateOne(
                        { username: username },
                        {
                            $pull: { [`todolist.${status}`]: { _id: id } }, // Remove from todo
                            $push: { [`todolist.${status == "todo" ? "inProgress" : "completed"}`]: todoItem }    // Add to completed
                        }
                    );
                    if (findAndMove) {
                        try {
                            const findtodo = await Signup.findOne(
                                { username: username }
                            )
                            if (findtodo) {
                                return res.status(200).send(findtodo.todolist)
                            }
                            else {
                                return res.status(400).send("item not found")
                            }
                        }
                        catch (error) {
                            return res.status(400).send("item not Working")

                        }

                    }
                }
                catch (error) {
                    console.log(error);
                    return res.status(400).send("Error while moving todo !Please try again !")

                }


            }
            catch (error) {
                console.log(error);
                return res.status(400).send("error while updating status")

            }
        }
        catch (error) {
            console.log(error)
            return res.status(400).send("Error while Moving todo !")
        }
    }
    catch (error) {
        console.log(error)
        return res.status(500).send("Server issue please try after some time !")
    }

})

// app.get('/gettodo', async (req, res) => {
//     try {
//         const { token, id, status } = req.headers


//         if (!token) {
//             return res.send(400, "User Must Be Logged In!")

//         }
//         const username = base64.decode(token).split(":")[0]
//         try {
//             const existingUser = await Signup.findOne({ username });
//             if (!existingUser) {
//                 return res.send(400, "User does not exists ! Please try Signup !")
//             }
//             const task = await Signup.findOne(
//                 {
//                     username: username,
//                     [`todolist.${status}._id`]: id  // Search for the task in the todo array by _id
//                 }
//             );
//             if(task){
//                 const edittodo=task.todolist[status].find(ele=>ele._id==id)
//                 return res.status(200).send(edittodo); 
//             }
//             else{
//                 return res.status(400).send("todo not found !");
//             }
//         }
//         catch (error) {
//             console.log(error);
//             res.status(400).send("unable to fetch todo !")
//         }

//     }
//     catch (error) {
//         console.log(error);
//         res.status(500).send("Server Issue ! Please try after sometime !")
//     }
// })

app.post('/edit', async (req, res) => {
    try {
        const { token, id, status, title, desc, deadline, priority } = req.body
        // return res.send(200,"hello")


        if (!token) {
            return res.send(400, "User Must Be Logged In!")

        }
        const username = base64.decode(token).split(":")[0]
        try {
            const existingUser = await Signup.findOne({ username });
            if (!existingUser) {
                return res.send(400, "User does not exists ! Please try Signup !")
            }
            try {
                const editTodo = await Signup.findOneAndUpdate(
                    {
                        username: username,
                        [`todolist.${status}._id`]: id // Find user and task with the specified taskId in the "todo" list
                    },
                    {
                        $set: {
                            [`todolist.${status}.$.title`]: title, // Update the title of the matched task
                            [`todolist.${status}.$.desc`]: desc,  // Update the description of the matched task
                            [`todolist.${status}.$.deadline`]: deadline,
                            [`todolist.${status}.$.priority`]: priority,
                        }
                    },
                    { new: true } // Option to return the updated document
                );
                if (editTodo) {
                    try {
                        const findtodo = await Signup.findOne(
                            { username: username }
                        )
                        if (findtodo) {
                            return res.status(200).send(findtodo.todolist)
                        }
                        else {
                            return res.status(400).send("item not found")
                        }
                    }
                    catch (error) {
                        return res.status(400).send("item not Working")
                    }

                }
                else {
                    console.log("not edited");
                    return res.status(400).send("unsuccessfull")
                }
            }
            catch (error) {
                console.log(error);
                return res.status(400).send("error while editing todo!")

            }
        }
        catch (error) {
            console.log(error)
            return res.status(400).send("Error while Finding User !")
        }
    }
    catch (error) {
        console.log(error)
        return res.status(500).send("Server issue please try after some time !")
    }


})

app.listen(3000, () => {
    console.log("server is running");
})