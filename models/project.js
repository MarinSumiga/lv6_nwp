const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
    ime: { type: String, required: true },
    uloga: String,
    email: String
});

const ProjectSchema = new mongoose.Schema({
    naziv: { type: String, required: true },
    opis: String,
    cijena: Number,
    obavljeniPoslovi: String,
    datumPocetka: Date,
    datumZavrsetka: Date,
    teamMembers: [TeamMemberSchema]
});

module.exports = mongoose.model('Project', ProjectSchema);