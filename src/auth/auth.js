const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    anonymousMessage: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Anonymous_Message'
        }
    ]
})

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema)