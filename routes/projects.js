var express = require('express');
var router = express.Router();
var Project = require('../models/project');

/* GET projects listing. */
router.get('/', async function(req, res, next) {
  try {
    const projects = await Project.find();
    res.render('projects/index', { projects: projects });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* GET new project form. */
router.get('/new', function(req, res, next) {
  res.render('projects/new');
});

/* GET edit project form. */
router.get('/:id/edit', async function(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).send('Project not found');
    res.render('projects/edit', { project: project });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* POST create new project. */
router.post('/', async function(req, res, next) {
  try {
    const project = new Project(req.body);
    await project.save();
    res.redirect('/projects');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/* POST update project. */
router.post('/:id/update', async function(req, res, next) {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).send('Project not found');
    res.redirect('/projects');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/* POST delete project. */
router.post('/:id/delete', async function(req, res, next) {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.redirect('/projects');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* POST add team member to project. */
router.post('/:id/members', async function(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).send('Project not found');
    
    project.teamMembers.push(req.body);
    await project.save();
    res.redirect('/projects/' + req.params.id);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/* GET specific project details. */
router.get('/:id', async function(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).send('Project not found');
    res.render('projects/show', { project: project });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
