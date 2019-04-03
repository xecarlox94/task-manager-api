const express = require("express");

const Task = require("../models/task");

const auth = require("../middleware/auth");

const router = new express.Router();




router.post("/tasks", auth, async (req, res) => {
    
    try {
        const task = new Task({
            ...req.body,
            owner: req.user._id
        })

        await task.save()

        res.send(task)

    } catch(e){
        res.status(400).send()
    }

})


router.get("/tasks", auth, async (req, res) => {
    const match = {};
    let sort = {};

    if(req.query.completed) {
        match.completed = req.query.completed === "true";
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        // const tasks = await Task.find({ owner: req.user._id })

        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        const tasks =req.user.tasks;

        if(tasks.length == 0) throw new Error("No tasks");

        res.send(tasks)
        
    } catch (error) {
        res.status(500).send(error);
    }
    

})


router.get("/tasks/:id", auth, async (req, res) => {

    const _id = req.params.id;
    
    try {

        const task = await Task.findOne({ _id, owner: req.user._id})

        if(!task) throw new Error("No task");

        res.send(task)

    } catch (error) {
        console.log(error)
        res.status(500).send();
    }

})


router.patch("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body);

    const isValidOperation = updates.every( (update) => allowedUpdates.includes(update))
    if(!isValidOperation) return res.status(400).send({ error: 'Invalid updates'});

    try {

        const task = await Task.findOne({ _id, owner: req.user._id })

        if(!task) return res.status(404).send();

        updates.forEach( (update) => task[update] = req.body[update]);

        await task.save();

        res.status(201).send(task);

    } catch (error) {
        res.status(500).send();
    }


})

router.delete("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
        
        if(!task) return res.status(404).send();

        res.send(task)

    } catch (error) {
        console.log(error)
        res.status(500).send();
    }
})



module.exports = router;