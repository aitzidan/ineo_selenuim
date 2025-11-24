const mongoose = require('mongoose');
require('./dBConnection');

const companySchema = new mongoose.Schema({
    name: { type : String },
    activity: { type : String },
    identifiantFiscale: { type : String },
    identifiantCommunEntreprise: { type : String },
    centreRc: { type : String },
    numeroRc: { type : String },
    adresse: { type : String },
    regimeImposition: { type : String }
}, { timestamps : true })


const Company = new mongoose.model('CompaniesInfo',companySchema);

// const newUser = new Company({
//     name: "data",
//     activity: "data",
//     identifiantFiscale: "data",
//     centreRc: "data",
//     numeroRc: "data",
//     adresse: "data",
//     regimeImposition: "data"
//   });
  
//   newUser
//     .save()
//     .then((user) => console.log("User created succesfully: ", user))
//     .catch((error) => console.log("Error creating user: ", error));


// Company.create({
//     name: "data",
//     activity: "data",
//     identifiantFiscale: "data",
//     centreRc: "data",
//     numeroRc: "data",
//     adresse: "data",
//     regimeImposition: "data"
// })
//   .then((newC)=>console.log('company added Successfully : ',newC))
//   .catch((error)=>console.log('Error creating company : ',error))
module.exports = Company;


