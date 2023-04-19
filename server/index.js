require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Joi = require("joi")
const app = express();
const bcrypt = require("bcrypt");
const { create } = require("./utils/tokenizer");

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json())
app.use(express.urlencoded({
    limit: '20mb',
    extended: true
}));

const userModel = require("./models/User")

const initializeDatabase = require("./config/database-config")
initializeDatabase()

const signupSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    name: Joi.string().required()
})

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to Eric's authentication backend service"
    })
});

function validatePassword(payload) {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~`!@#$%^&*()_\-+={[}\]|:;"'<,>.?/])(?!.*\s)[A-Za-z\d~`!@#$%^&*()_\-+={[}\]|:;"'<,>.?/]{8,}$/
    return re.test(payload)
}

app.post('/signup', async (req, res) => {
    try {
        const { value: { email, password, name }, error } = signupSchema.validate(req.body);
        if (error) return res.status(400).json({
            message: error.details[0].message
        })

        const existingEmail = await userModel.findOne({ email: email.toLowerCase() });
        if (existingEmail) return res.status(400).json({
            message: "Email Address Already Exists"
        })

        if (!validatePassword(password)) {
            return res.status(400).json({
                message: 'Password must be a Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character'
            })
        }

        const hashedpassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            email: email.toLowerCase(),
            password: hashedpassword,
            name: name.toLowerCase()
        });

        await user.save()

        return res.status(200).json({
            message: "Account created successfully"
        })
    } catch (err) {
        return res.status(500).json({
            message: err
        })
    }
})

app.post("/login", async (req, res) => {
    try {
        const { value: { email, password }, error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({
            message: error.details[0].message
        })

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: 'Invalid Email or Password'
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid Email or Password'
            })
        }

        delete user._doc.password

        const token = create(
            {
                _id: user.id,
                accountType: user.accountType,
                purpose: "authentication",
            },
            { expiresIn: "1h", issuer: "market-22" }
        );

        return res.status(200).json({
            message: 'Account Login Successful',
            data: {
                user,
                accessToken: token
            }
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: err
        })
    }
})

app.use((req, res, next) => {
    const error = "Couldn't find this endpoint. Try trobuleshooting your request or refer to docs ";
    error.status = 404;
    next(error);
});

const errorHandler = (err, req, res, next) => {
    if (err.name === 'ValidationError') {
        res.status(400).json({ error: err.message });
    } else {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        message: error
    });
});

app.use(errorHandler);
const port = process.env.PORT || 2100;

app.listen(port, () => {
    return console.log(`Eric's authentication Backend Service is live on http://localhost:${port}`);
});