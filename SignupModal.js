import mongoose from "mongoose";
const Schema = mongoose.Schema;


const TodoItemSchema = new Schema({
    title: {
        type: String,
        required:true
    },
    desc: {
        type: String,
        required:true
    },
    deadline: {
        type: String,
        required:true
        // match: /^\d{4}-\d{2}-\d{2}$/
    },
    priority: {
        type: String,
        required:true
    },
    status: {
        type: String,
        required:true
    }
}, { timestamps: true });
const SignupModel = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    todolist:({
        todo: {
            type: [TodoItemSchema], // Array of todo items
            default: []
        },
        inProgress: {
            type: [TodoItemSchema], // Array of in-progress items
            default: []
        },
        completed: {
            type: [TodoItemSchema], // Array of completed items
            default: []
        }
    })
}, {
    timestamps: true
})

const Signup = mongoose.model('Signup', SignupModel,"prodiolabs_signups");

export default Signup;