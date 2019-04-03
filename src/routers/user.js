const express = require("express");
const sharp = require("sharp")

const router = new express.Router();

const User = require("../models/user");

const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account");


router.post("/users", async (req, res) => {

    const user = new User(req.body)
    try {
        
        await user.save();
        
        sendWelcomeEmail(user.email, user.name)

        const token = await user.generateAuthToken();

        res.status(201).send({ user, token })

    } catch(err) {
        res.status(400).send(err);
    }
    
})

router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);

        const token = await user.generateAuthToken();

        res.send({ user , token })

    } catch (error) {
        res.status(400).send(error);
    }
})


router.post("/users/logout", auth, async (req,res) => {
    try {
        req.user.tokens = req.user.tokens.filter( (token) => {
            return token.token !== req.token;
        })
        await req.user.save();

        res.send()
    } catch (error) {
        res.status(500).send();
    }
})

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();

        res.send()
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
})


router.patch("/users/:id", auth, async (req, res) => {

    try {
        
        const updates = Object.keys(req.body);
        const allowedUpdates = [ 'name', 'email', 'password', 'age'];

        const isValidOperation = updates.every( (update) =>  allowedUpdates.includes(update) );

        if (!isValidOperation) throw new Error("invalid updates");

        updates.forEach( (update) => req.user[update] = req.body[update] )
        
        await req.user.save();

        res.send(req.user)

    } catch (error) {
        console.log(error)
        res.status(400).send(error);
    }

})


router.delete("/users/me", auth, async (req, res) => {
    try {

        await req.user.remove();
        
        sendCancelationEmail(req.user.email, req.user.name)
        
        res.send(req.user);

    } catch (error) {
        console.log(error)
        res.status(500).send();
    }

})



const multer = require("multer");
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error("File must be either be in jpg, jpeg or png formats"))
        }
        cb(undefined, true)
    }
})


router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {

    try {
        // req.user.avatar = req.file.buffer;

        const buffer = await sharp(req.file.buffer).resize({
            width: 250,
            height: 250
        }).png().toBuffer();

        req.user.avatar = buffer;

        await req.user.save()
    } catch (error) {
        res.status(400).send();
    }
    res.send()

}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


router.delete("/users/me/avatar", auth, async (req, res) => {
    try {
        if(!req.user.avatar) throw new Error("No avatar")

        req.user.avatar = undefined;
        
        await req.user.save();

        res.send()

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
})

router.get("/users/:id/avatar", async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id)
        
        if(!user || !user.avatar) throw new Error()

        res.set("Content-Type", "image/png")

        res.send(user.avatar)

    } catch (error) {
        res.status(400).send
    }
})

module.exports = router;